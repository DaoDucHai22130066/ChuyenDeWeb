const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";

const userController = {};

userController.userRegistration = async (req, res) => {
    try {
        const { name, email, password, stream, year } = req.body;
        const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (name, email, password, stream, year) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, stream || null, year || null]
        );

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

userController.login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
        res.json({ message: "Login successful", token, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

userController.getUsers = async (req,res) => {
    try {
        const [users] = await pool.query("SELECT id, name, email, stream, year FROM users");
        res.status(200).json({error:false,message:"users fetched successfully", user: users, totalUser: users.length});        
    } catch (error) {
        res.status(500).json({error:false,message:"internal server error",error:error.message})
    }
}

userController.profile = async (req,res) => {
    try {
        const {id} = req.userInfo;
        const [users] = await pool.query("SELECT id, name, email, stream, year FROM users WHERE id = ?", [id]);
        if(users.length === 0){
            return res.status(404).json({error:true,message:"no such user"})
        }
        res.json({error:false,message:"user fetched successfully", user: users[0]});
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({error:true,message:"Internal Server error"})
    }
}

userController.addContact = async(req,res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        await pool.query("INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)", [name, email, subject, message]);
        res.status(200).json({ success: true, message: 'Your message has been sent! We will get back to you soon.' });
    } catch (error) {
        console.error('Error saving contact:', error.message);
        res.status(500).json({ error: 'Server error while saving message' });
    }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

userController.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const [existingOtp] = await pool.query("SELECT * FROM otps WHERE email = ?", [email]);
    if (existingOtp.length > 0) {
        await pool.query("UPDATE otps SET otp = ?, createdAt = CURRENT_TIMESTAMP WHERE email = ?", [otp, email]);
    } else {
        await pool.query("INSERT INTO otps (email, otp) VALUES (?, ?)", [email, otp]);
    }

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

userController.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [records] = await pool.query("SELECT * FROM otps WHERE email = ?", [email]);
    if (records.length === 0 || records[0].otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const record = records[0];
    const otpAge = (new Date() - new Date(record.createdAt)) / (1000 * 60);
    if (otpAge > 10) return res.status(400).json({ message: "OTP expired" });

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

userController.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    await pool.query("DELETE FROM otps WHERE email = ?", [email]); 
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {userController};