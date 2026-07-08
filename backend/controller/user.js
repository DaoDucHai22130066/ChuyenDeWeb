const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const jwt = require("jsonwebtoken");
const userController = {};

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const {
  query,
  withTransaction,
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

const CONTACT_SUBJECTS = new Set([
  "general",
  "borrow",
  "donate",
  "volunteer",
  "feedback",
  "other",
]);

function mapAddressRow(row) {
  return {
    _id: row.id,
    recipientName: row.recipient_name,
    phone: row.phone,
    address: row.address,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeAddressPayload(body) {
  const recipientName = String(body.recipientName || body.recipient_name || "").trim();
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const latRaw = body.lat;
  const lngRaw = body.lng;
  const lat = latRaw === "" || latRaw === null || latRaw === undefined ? null : Number(latRaw);
  const lng = lngRaw === "" || lngRaw === null || lngRaw === undefined ? null : Number(lngRaw);

  return {
    recipientName,
    phone,
    address,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    isDefault: Boolean(body.isDefault || body.is_default),
  };
}

function validateAddressPayload(payload) {
  if (!payload.phone) {
    return "Số điện thoại nhận sách là bắt buộc";
  }
  if (payload.phone.length > 20) {
    return "Số điện thoại không được vượt quá 20 ký tự";
  }
  if (!payload.address) {
    return "Địa chỉ nhận sách là bắt buộc";
  }
  if (payload.address.length > 500) {
    return "Địa chỉ không được vượt quá 500 ký tự";
  }
  if (payload.recipientName.length > 255) {
    return "Tên người nhận không được vượt quá 255 ký tự";
  }
  return null;
}

async function syncDefaultAddress(connection, userId) {
  const [rows] = await connection.query(
    `SELECT recipient_name, phone, address, lat, lng
     FROM user_addresses
     WHERE user_id = ? AND is_default = 1
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );
  const defaultAddress = rows[0];

  await connection.query(
    `UPDATE users
     SET phone = COALESCE(?, phone),
         default_address = ?,
         default_address_lat = ?,
         default_address_lng = ?
     WHERE id = ?`,
    [
      defaultAddress?.phone || null,
      defaultAddress?.address || null,
      defaultAddress?.lat || null,
      defaultAddress?.lng || null,
      userId,
    ]
  );
}

userController.userRegistration = async (req, res) => {
  try {
    const { name, email, password, stream, year, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const requestedRole = role === "admin" ? "user" : (role || "user");
    const existingRows = await query("SELECT id, email_verified FROM users WHERE email = ? LIMIT 1", [email]);
    const existingUser = existingRows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser && Number(existingUser.email_verified) === 1) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (existingUser) {
      await query(
        `UPDATE users
         SET name = ?, password = ?, stream = ?, year = ?, role = ?, email_verified = 0
         WHERE email = ?`,
        [name, hashedPassword, stream || null, year || null, requestedRole, email]
      );
    } else {
      await query(
        `INSERT INTO users (name, email, password, stream, year, role, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [name, email, hashedPassword, stream || null, year || null, requestedRole]
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await query(
      `INSERT INTO otps (email, otp, reset_token, verified_at, reset_token_expires, created_at)
       VALUES (?, ?, NULL, NULL, NULL, NOW())
       ON DUPLICATE KEY UPDATE
         otp = VALUES(otp),
         reset_token = NULL,
         verified_at = NULL,
         reset_token_expires = NULL,
         created_at = VALUES(created_at)`,
      [email, otp]
    );

    await sendRegistrationOtpMail(email, otp);

    res.status(201).json({
      message: "Đăng ký thành công. Vui lòng kiểm tra email để nhập mã xác nhận.",
      requiresVerification: true,
    });
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

    if (Number(user.is_active) === 0) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ thủ thư." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Use Google login for this account" });
    }

    if (Number(user.email_verified) === 0) {
      return res.status(403).json({ message: "Vui lòng xác nhận email trước khi đăng nhập" });
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
      `SELECT id, name, email, role, stream, year, phone, default_address, default_address_lat, default_address_lng, email_verified, is_active, created_at, updated_at
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
      `SELECT id, name, email, role, stream, year, phone, default_address, default_address_lat, default_address_lng, email_verified, is_active, created_at, updated_at
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

userController.getAddresses = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    let rows = await query(
      `SELECT *
       FROM user_addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, updated_at DESC, id DESC`,
      [userId]
    );

    if (rows.length === 0) {
      const userRows = await query(
        `SELECT name, phone, default_address, default_address_lat, default_address_lng
         FROM users WHERE id = ? LIMIT 1`,
        [userId]
      );
      const currentUser = userRows[0];
      if (currentUser?.default_address) {
        await query(
          `INSERT INTO user_addresses (user_id, recipient_name, phone, address, lat, lng, is_default)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            userId,
            currentUser.name || null,
            currentUser.phone || "",
            currentUser.default_address,
            currentUser.default_address_lat || null,
            currentUser.default_address_lng || null,
          ]
        );
        rows = await query(
          `SELECT *
           FROM user_addresses
           WHERE user_id = ?
           ORDER BY is_default DESC, updated_at DESC, id DESC`,
          [userId]
        );
      }
    }

    res.json({
      error: false,
      message: "addresses fetched successfully",
      addresses: rows.map(mapAddressRow),
    });
  } catch (error) {
    console.error("Address Fetch Error:", error);
    res.status(500).json({ error: true, message: "Không tải được sổ địa chỉ" });
  }
};

userController.createAddress = async (req, res) => {
  const payload = normalizeAddressPayload(req.body);
  const validationMessage = validateAddressPayload(payload);
  if (validationMessage) {
    return res.status(400).json({ error: true, message: validationMessage });
  }

  try {
    const userId = req.userInfo.id;
    const address = await withTransaction(async (connection) => {
      const [countRows] = await connection.query(
        "SELECT COUNT(*) AS total FROM user_addresses WHERE user_id = ?",
        [userId]
      );
      const shouldBeDefault = payload.isDefault || Number(countRows[0]?.total || 0) === 0;

      if (shouldBeDefault) {
        await connection.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
      }

      const [result] = await connection.query(
        `INSERT INTO user_addresses (user_id, recipient_name, phone, address, lat, lng, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          payload.recipientName || null,
          payload.phone,
          payload.address,
          payload.lat,
          payload.lng,
          shouldBeDefault ? 1 : 0,
        ]
      );

      if (shouldBeDefault) {
        await syncDefaultAddress(connection, userId);
      }

      const [rows] = await connection.query("SELECT * FROM user_addresses WHERE id = ? LIMIT 1", [result.insertId]);
      return rows[0];
    });

    res.status(201).json({
      error: false,
      message: "Đã thêm địa chỉ",
      address: mapAddressRow(address),
    });
  } catch (error) {
    console.error("Address Create Error:", error);
    res.status(500).json({ error: true, message: "Không thêm được địa chỉ" });
  }
};

userController.updateAddress = async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) {
    return res.status(400).json({ error: true, message: "Mã địa chỉ không hợp lệ" });
  }

  const payload = normalizeAddressPayload(req.body);
  const validationMessage = validateAddressPayload(payload);
  if (validationMessage) {
    return res.status(400).json({ error: true, message: validationMessage });
  }

  try {
    const userId = req.userInfo.id;
    const address = await withTransaction(async (connection) => {
      const [existingRows] = await connection.query(
        "SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1",
        [addressId, userId]
      );
      if (!existingRows.length) return null;

      const shouldBeDefault = payload.isDefault || Boolean(existingRows[0].is_default);
      if (shouldBeDefault) {
        await connection.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
      }

      await connection.query(
        `UPDATE user_addresses
         SET recipient_name = ?, phone = ?, address = ?, lat = ?, lng = ?, is_default = ?
         WHERE id = ? AND user_id = ?`,
        [
          payload.recipientName || null,
          payload.phone,
          payload.address,
          payload.lat,
          payload.lng,
          shouldBeDefault ? 1 : 0,
          addressId,
          userId,
        ]
      );

      if (shouldBeDefault) {
        await syncDefaultAddress(connection, userId);
      }

      const [rows] = await connection.query("SELECT * FROM user_addresses WHERE id = ? LIMIT 1", [addressId]);
      return rows[0];
    });

    if (!address) {
      return res.status(404).json({ error: true, message: "Không tìm thấy địa chỉ" });
    }

    res.json({
      error: false,
      message: "Đã cập nhật địa chỉ",
      address: mapAddressRow(address),
    });
  } catch (error) {
    console.error("Address Update Error:", error);
    res.status(500).json({ error: true, message: "Không cập nhật được địa chỉ" });
  }
};

userController.setDefaultAddress = async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) {
    return res.status(400).json({ error: true, message: "Mã địa chỉ không hợp lệ" });
  }

  try {
    const userId = req.userInfo.id;
    const address = await withTransaction(async (connection) => {
      const [existingRows] = await connection.query(
        "SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1",
        [addressId, userId]
      );
      if (!existingRows.length) return null;

      await connection.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
      await connection.query("UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?", [addressId, userId]);
      await syncDefaultAddress(connection, userId);

      const [rows] = await connection.query("SELECT * FROM user_addresses WHERE id = ? LIMIT 1", [addressId]);
      return rows[0];
    });

    if (!address) {
      return res.status(404).json({ error: true, message: "Không tìm thấy địa chỉ" });
    }

    res.json({
      error: false,
      message: "Đã đặt làm địa chỉ mặc định",
      address: mapAddressRow(address),
    });
  } catch (error) {
    console.error("Address Default Error:", error);
    res.status(500).json({ error: true, message: "Không đặt được địa chỉ mặc định" });
  }
};

userController.deleteAddress = async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) {
    return res.status(400).json({ error: true, message: "Mã địa chỉ không hợp lệ" });
  }

  try {
    const userId = req.userInfo.id;
    const deleted = await withTransaction(async (connection) => {
      const [existingRows] = await connection.query(
        "SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1",
        [addressId, userId]
      );
      const existing = existingRows[0];
      if (!existing) return false;

      await connection.query("DELETE FROM user_addresses WHERE id = ? AND user_id = ?", [addressId, userId]);

      if (existing.is_default) {
        const [fallbackRows] = await connection.query(
          `SELECT id FROM user_addresses
           WHERE user_id = ?
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [userId]
        );
        if (fallbackRows.length) {
          await connection.query("UPDATE user_addresses SET is_default = 1 WHERE id = ?", [fallbackRows[0].id]);
        }
        await syncDefaultAddress(connection, userId);
      }

      return true;
    });

    if (!deleted) {
      return res.status(404).json({ error: true, message: "Không tìm thấy địa chỉ" });
    }

    res.json({ error: false, message: "Đã xóa địa chỉ" });
  } catch (error) {
    console.error("Address Delete Error:", error);
    res.status(500).json({ error: true, message: "Không xóa được địa chỉ" });
  }
};

userController.addContact = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const subject = String(req.body.subject || "").trim().toLowerCase();
  const message = String(req.body.message || "").trim();

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: true, message: "Vui lòng nhập đầy đủ thông tin liên hệ" });
  }

  if (name.length > 255 || email.length > 255) {
    return res.status(400).json({ error: true, message: "Họ tên hoặc email quá dài" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: true, message: "Email không hợp lệ" });
  }

  if (!CONTACT_SUBJECTS.has(subject)) {
    return res.status(400).json({ error: true, message: "Chủ đề liên hệ không hợp lệ" });
  }

  if (message.length < 10) {
    return res.status(400).json({ error: true, message: "Nội dung liên hệ cần ít nhất 10 ký tự" });
  }

  if (message.length > 5000) {
    return res.status(400).json({ error: true, message: "Nội dung liên hệ không được vượt quá 5000 ký tự" });
  }

  try {
    const result = await query(
      `INSERT INTO contacts (name, email, subject, message)
       VALUES (?, ?, ?, ?)` ,
      [name, email, subject, message]
    );

    // Send email to admin
    await sendContactNotification({ name, email, subject, message });

    res.status(201).json({
      success: true,
      error: false,
      message: "Tin nhắn đã được gửi. Chúng tôi sẽ phản hồi sớm.",
      contactId: result.insertId,
    });
  } catch (error) {
    console.error("Error saving contact:", error.message);
    res.status(500).json({ error: true, message: "Lỗi hệ thống khi gửi liên hệ" });
  }
};

const { transporter, sendOtpMail, sendRegistrationOtpMail, sendContactNotification } = require("../utils/mail");

userController.verifyRegistrationOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const rows = await query("SELECT otp, created_at FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];

    if (!record || String(record.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpAge = (new Date() - new Date(record.created_at)) / (1000 * 60);
    if (otpAge > 10) return res.status(400).json({ message: "OTP expired" });

    const result = await query("UPDATE users SET email_verified = 1 WHERE email = ?", [email]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    await query("DELETE FROM otps WHERE email = ?", [email]);
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify registration OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

userController.resendRegistrationOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const rows = await query("SELECT id, email_verified FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    if (Number(user.email_verified) === 1) return res.status(400).json({ message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await query(
      `INSERT INTO otps (email, otp, reset_token, verified_at, reset_token_expires, created_at)
       VALUES (?, ?, NULL, NULL, NULL, NOW())
       ON DUPLICATE KEY UPDATE
         otp = VALUES(otp),
         reset_token = NULL,
         verified_at = NULL,
         reset_token_expires = NULL,
         created_at = VALUES(created_at)`,
      [email, otp]
    );

    await sendRegistrationOtpMail(email, otp);
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Resend registration OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

userController.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const rows = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await query(
      `INSERT INTO otps (email, otp, reset_token, verified_at, reset_token_expires, created_at)
       VALUES (?, ?, NULL, NULL, NULL, NOW())
       ON DUPLICATE KEY UPDATE
         otp = VALUES(otp),
         reset_token = NULL,
         verified_at = NULL,
         reset_token_expires = NULL,
         created_at = VALUES(created_at)`,
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
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const rows = await query("SELECT otp, created_at FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];

    if (!record || String(record.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpAge = (new Date() - new Date(record.created_at)) / (1000 * 60);
    if (otpAge > 10) return res.status(400).json({ message: "OTP expired" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    await query(
      `UPDATE otps
       SET reset_token = ?, verified_at = NOW(), reset_token_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
       WHERE email = ?`,
      [resetToken, email]
    );

    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

userController.resetPassword = async (req, res) => {
  const { email, newPassword, resetToken } = req.body;
  try {
    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({ message: "Email, new password and reset token are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const otpRows = await query(
      `SELECT reset_token, reset_token_expires, verified_at
       FROM otps
       WHERE email = ?
       LIMIT 1`,
      [email]
    );
    const otpRecord = otpRows[0];

    if (
      !otpRecord ||
      !otpRecord.verified_at ||
      !otpRecord.reset_token ||
      otpRecord.reset_token !== resetToken ||
      new Date(otpRecord.reset_token_expires) < new Date()
    ) {
      return res.status(400).json({ message: "OTP has not been verified or reset session expired" });
    }

    const userRows = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    await query("DELETE FROM otps WHERE email = ?", [email]);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
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
        `INSERT INTO users (name, email, password, role, stream, year, email_verified)
         VALUES (?, ?, NULL, 'user', NULL, NULL, 1)` ,
        [name, email]
      );
      rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
      user = rows[0];
    }

    if (Number(user.is_active) === 0) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ thủ thư." });
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
    const {
      name,
      stream,
      year,
      phone,
      defaultAddress,
      defaultAddressLat,
      defaultAddressLng,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: true, message: "Họ và tên là bắt buộc" });
    }

    const normalizedAddress = String(defaultAddress || "").trim();
    const normalizedPhone = String(phone || "").trim();
    const latValue = defaultAddressLat === "" || defaultAddressLat === null || defaultAddressLat === undefined
      ? null
      : Number(defaultAddressLat);
    const lngValue = defaultAddressLng === "" || defaultAddressLng === null || defaultAddressLng === undefined
      ? null
      : Number(defaultAddressLng);

    if (normalizedAddress.length > 500) {
      return res.status(400).json({ error: true, message: "Địa chỉ mặc định không được vượt quá 500 ký tự" });
    }

    if (normalizedPhone && normalizedPhone.length > 20) {
      return res.status(400).json({ error: true, message: "Số điện thoại không được vượt quá 20 ký tự" });
    }

    await query(
      `UPDATE users 
       SET name = ?, stream = ?, year = ?, phone = ?, default_address = ?, default_address_lat = ?, default_address_lng = ? 
       WHERE id = ?`,
      [
        String(name).trim(),
        stream || null,
        year || null,
        normalizedPhone || null,
        normalizedAddress || null,
        Number.isFinite(latValue) ? latValue : null,
        Number.isFinite(lngValue) ? lngValue : null,
        id,
      ]
    );

    const rows = await query(
      `SELECT id, name, email, role, stream, year, phone, default_address, default_address_lat, default_address_lng, email_verified, is_active, created_at, updated_at
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

