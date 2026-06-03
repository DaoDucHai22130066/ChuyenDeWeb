const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const jwt = require("jsonwebtoken");
const userController = {};

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const {
  query,
  mapUserRow,
} = require("../utils/mysql");

function buildUserPayload(userRow) {
  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role,
  };
}

userController.userRegistration = async (req, res) => {
  try {
    const { name, email, password, stream, year, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (name, email, password, stream, year, role)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [name, email, hashedPassword, stream || null, year || null, role || "user"]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

userController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Use Google login for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(buildUserPayload(user), JWT_SECRET, { expiresIn: "24h" });
    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

userController.getUsers = async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, email, role, stream, year, created_at, updated_at
       FROM users
       ORDER BY id DESC`
    );

    const user = rows.map((row) => mapUserRow(row));
    const totalUser = user.length;
    res.status(200).json({ error: false, message: "users fetched successfully", user, totalUser });
  } catch (error) {
    res.status(500).json({ error: false, message: "internal server error", error: error.message });
  }
};

userController.profile = async (req, res) => {
  try {
    const { id } = req.userInfo;
    const rows = await query(
      `SELECT id, name, email, role, stream, year, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: true, message: "no such user" });
    }

    res.json({ error: false, message: "user fetched successfully", user: mapUserRow(user) });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: true, message: "Internal Server error" });
  }
};

userController.addContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await query(
      `INSERT INTO contacts (name, email, subject, message)
       VALUES (?, ?, ?, ?)` ,
      [name, email, subject, message]
    );

    // Send email to admin
    await sendContactNotification({ name, email, subject, message });

    res.status(200).json({ success: true, message: "Your message has been sent! We will get back to you soon." });
  } catch (error) {
    console.error("Error saving contact:", error.message);
    res.status(500).json({ error: "Server error while saving message" });
  }
};

const { transporter, sendOtpMail, sendContactNotification } = require("../utils/mail");

userController.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const rows = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await query(
      `INSERT INTO otps (email, otp, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = VALUES(created_at)` ,
      [email, otp]
    );

    await sendOtpMail(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

userController.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const rows = await query("SELECT otp, created_at FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];

    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpAge = (new Date() - new Date(record.created_at)) / (1000 * 60);
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
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    await query("DELETE FROM otps WHERE email = ?", [email]);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

userController.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || payload.email.split("@")[0];

    let rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    let user = rows[0];

    if (!user) {
      await query(
        `INSERT INTO users (name, email, password, role, stream, year)
         VALUES (?, ?, NULL, 'user', NULL, NULL)` ,
        [name, email]
      );
      rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
      user = rows[0];
    }

    const tokenPayload = buildUserPayload(user);
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });
    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Google login failed", error: error.message });
  }
};

userController.updateProfile = async (req, res) => {
  try {
    const { id } = req.userInfo;
    const { name, stream, year } = req.body;

    if (!name) {
      return res.status(400).json({ error: true, message: "Họ và tên là bắt buộc" });
    }

    await query(
      `UPDATE users 
       SET name = ?, stream = ?, year = ? 
       WHERE id = ?`,
      [name, stream || null, year || null, id]
    );

    const rows = await query(
      `SELECT id, name, email, role, stream, year, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: true, message: "Người dùng không tồn tại" });
    }

    res.json({ error: false, message: "Cập nhật hồ sơ thành công", user: mapUserRow(user) });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: true, message: "Lỗi hệ thống khi cập nhật hồ sơ" });
  }
};

module.exports = { userController };

