const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
<<<<<<< HEAD
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const crypto = require("crypto");
=======
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const jwt = require("jsonwebtoken");
>>>>>>> hai
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
<<<<<<< HEAD
    const { name, email, password, stream, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tên, email và mật khẩu là bắt buộc" });
=======
    const { name, email, password, stream, year, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
>>>>>>> hai
    }

    const existingUser = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existingUser.length > 0) {
<<<<<<< HEAD
      return res.status(400).json({ message: "Email đã tồn tại" });
=======
      return res.status(400).json({ message: "Email already exists" });
>>>>>>> hai
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (name, email, password, stream, year, role)
       VALUES (?, ?, ?, ?, ?, ?)` ,
<<<<<<< HEAD
      [name, email, hashedPassword, stream || null, year || null, 'user']
    );

    res.status(201).json({ message: "Đăng ký tài khoản thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
=======
      [name, email, hashedPassword, stream || null, year || null, role || "user"]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
>>>>>>> hai
  }
};

userController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
<<<<<<< HEAD
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
=======
      return res.status(400).json({ message: "Email and password are required" });
>>>>>>> hai
    }

    const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];

    if (!user) {
<<<<<<< HEAD
      return res.status(400).json({ message: "Email hoặc mật khẩu không hợp lệ" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Vui lòng đăng nhập bằng Google cho tài khoản này" });
=======
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Use Google login for this account" });
>>>>>>> hai
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
<<<<<<< HEAD
      return res.status(400).json({ message: "Email hoặc mật khẩu không hợp lệ" });
    }

    const token = jwt.sign(buildUserPayload(user), JWT_SECRET, { expiresIn: "24h" });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    };
    try {
      res.cookie('authToken', token, cookieOptions);
    } catch (e) {
      // ignore cookie set issues
    }

    res.json({
      message: "Đăng nhập thành công",
=======
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(buildUserPayload(user), JWT_SECRET, { expiresIn: "24h" });
    res.json({
      message: "Login successful",
>>>>>>> hai
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
<<<<<<< HEAD
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
=======
    res.status(500).json({ message: "Server error", error: error.message });
>>>>>>> hai
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
<<<<<<< HEAD
    res.status(200).json({ error: false, message: "Lấy danh sách người dùng thành công", user, totalUser });
  } catch (error) {
    res.status(500).json({ error: true, message: "Lỗi máy chủ", details: error.message });
=======
    res.status(200).json({ error: false, message: "users fetched successfully", user, totalUser });
  } catch (error) {
    res.status(500).json({ error: false, message: "internal server error", error: error.message });
>>>>>>> hai
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
<<<<<<< HEAD
      return res.status(404).json({ error: true, message: "Không tìm thấy người dùng" });
    }

    res.json({ error: false, message: "Lấy thông tin người dùng thành công", user: mapUserRow(user) });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: true, message: "Lỗi máy chủ" });
=======
      return res.status(404).json({ error: true, message: "no such user" });
    }

    res.json({ error: false, message: "user fetched successfully", user: mapUserRow(user) });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: true, message: "Internal Server error" });
>>>>>>> hai
  }
};

userController.addContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
<<<<<<< HEAD
    return res.status(400).json({ error: "Tất cả các trường là bắt buộc" });
=======
    return res.status(400).json({ error: "All fields are required" });
>>>>>>> hai
  }

  try {
    await query(
      `INSERT INTO contacts (name, email, subject, message)
       VALUES (?, ?, ?, ?)` ,
      [name, email, subject, message]
    );

    // Send email to admin
    await sendContactNotification({ name, email, subject, message });

<<<<<<< HEAD
    res.status(200).json({ success: true, message: "Tin nhắn của bạn đã được gửi! Chúng tôi sẽ liên hệ lại sớm." });
  } catch (error) {
    console.error("Error saving contact:", error.message);
    res.status(500).json({ error: "Lỗi máy chủ khi lưu tin nhắn" });
=======
    res.status(200).json({ success: true, message: "Your message has been sent! We will get back to you soon." });
  } catch (error) {
    console.error("Error saving contact:", error.message);
    res.status(500).json({ error: "Server error while saving message" });
>>>>>>> hai
  }
};

const { transporter, sendOtpMail, sendContactNotification } = require("../utils/mail");

userController.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const rows = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
<<<<<<< HEAD
    if (rows.length === 0) return res.status(400).json({ message: "Không tìm thấy người dùng" });
=======
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });
>>>>>>> hai

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await query(
      `INSERT INTO otps (email, otp, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = VALUES(created_at)` ,
      [email, otp]
    );

    await sendOtpMail(email, otp);

<<<<<<< HEAD
    res.json({ message: "OTP đã được gửi tới email của bạn" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
=======
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
>>>>>>> hai
  }
};

userController.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const rows = await query("SELECT otp, created_at FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];

    if (!record || record.otp !== otp) {
<<<<<<< HEAD
      return res.status(400).json({ message: "OTP không hợp lệ" });
    }

    const otpAge = (new Date() - new Date(record.created_at)) / (1000 * 60);
    if (otpAge > 10) return res.status(400).json({ message: "OTP đã hết hạn" });

    // Generate a reset token valid for 15 minutes and store it
    const resetToken = crypto.randomBytes(32).toString('hex');
    await query("UPDATE otps SET reset_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = ?", [resetToken, email]);

    res.json({ message: "Xác thực OTP thành công", resetToken });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ" });
=======
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpAge = (new Date() - new Date(record.created_at)) / (1000 * 60);
    if (otpAge > 10) return res.status(400).json({ message: "OTP expired" });

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
>>>>>>> hai
  }
};

userController.resetPassword = async (req, res) => {
<<<<<<< HEAD
  const { email, newPassword, resetToken } = req.body;
  if (!resetToken) return res.status(400).json({ message: 'Thiếu reset token' });
  try {
    const rows = await query("SELECT reset_token, expires_at FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];
    if (!record || !record.reset_token || record.reset_token !== resetToken) {
      return res.status(400).json({ message: 'Reset token không hợp lệ' });
    }
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Reset token đã hết hạn' });
    }

=======
  const { email, newPassword } = req.body;
  try {
>>>>>>> hai
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    await query("DELETE FROM otps WHERE email = ?", [email]);

<<<<<<< HEAD
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

userController.logout = async (req, res) => {
  try {
    res.clearCookie('authToken', { path: '/' });
    res.json({ message: 'Đã đăng xuất' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
=======
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
>>>>>>> hai
  }
};

userController.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
<<<<<<< HEAD
    if (!idToken) return res.status(400).json({ message: "Thiếu idToken" });
=======
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });
>>>>>>> hai

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
<<<<<<< HEAD
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    };
    try { res.cookie('authToken', token, cookieOptions); } catch (e) {}

    res.json({
      message: "Đăng nhập thành công",
=======
    res.json({
      message: "Login successful",
>>>>>>> hai
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
<<<<<<< HEAD
    res.status(500).json({ message: "Đăng nhập Google thất bại", error: error.message });
=======
    res.status(500).json({ message: "Google login failed", error: error.message });
>>>>>>> hai
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

