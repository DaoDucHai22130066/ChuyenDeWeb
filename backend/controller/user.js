const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
require("../utils/loadEnv");
const { signAccessToken } = require("../utils/jwtConfig");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookie");
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

const GENERIC_FORGOT_PASSWORD_MESSAGE = "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email đó.";
const INVALID_LOGIN_MESSAGE = "Email hoặc mật khẩu không đúng";
const MAX_OTP_ATTEMPTS = Number.isFinite(Number(process.env.OTP_MAX_ATTEMPTS)) ? Number(process.env.OTP_MAX_ATTEMPTS) : 5;
const OTP_EXPIRY_MINUTES = Number.isFinite(Number(process.env.OTP_EXPIRY_MINUTES)) ? Number(process.env.OTP_EXPIRY_MINUTES) : 10;
const OTP_LOCK_MINUTES = Number.isFinite(Number(process.env.OTP_LOCK_MINUTES)) ? Number(process.env.OTP_LOCK_MINUTES) : 15;
const OTP_RESEND_COOLDOWN_SECONDS = Number.isFinite(Number(process.env.OTP_RESEND_COOLDOWN_SECONDS)) ? Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) : 60;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(email, otp) {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
  return crypto
    .createHmac("sha256", String(secret))
    .update(`${normalizeEmail(email)}:${String(otp)}`)
    .digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function otpMatches(record, email, otp) {
  const stored = String(record?.otp || "");
  if (stored.length <= 16) {
    return stored === String(otp);
  }
  return safeEqual(stored, hashOtp(email, otp));
}

function isFutureDate(value) {
  return value && new Date(value) > new Date();
}

function isOtpExpired(record) {
  const ageMinutes = (new Date() - new Date(record.created_at)) / (1000 * 60);
  return ageMinutes > OTP_EXPIRY_MINUTES;
}

async function saveOtp(email, otp) {
  await query(
    `INSERT INTO otps (email, otp, reset_token, verified_at, reset_token_expires, otp_attempts, locked_until, last_sent_at, created_at)
     VALUES (?, ?, NULL, NULL, NULL, 0, NULL, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       otp = VALUES(otp),
       reset_token = NULL,
       verified_at = NULL,
       reset_token_expires = NULL,
       otp_attempts = 0,
       locked_until = NULL,
       last_sent_at = VALUES(last_sent_at),
       created_at = VALUES(created_at)`,
    [normalizeEmail(email), hashOtp(email, otp)]
  );
}

function isOtpResendTooSoon(record) {
  const sentAt = record?.last_sent_at || record?.created_at;
  if (!sentAt) return false;
  const ageSeconds = (new Date() - new Date(sentAt)) / 1000;
  return ageSeconds < OTP_RESEND_COOLDOWN_SECONDS;
}

async function recordFailedOtpAttempt(email, currentAttempts = 0) {
  const nextAttempts = Number(currentAttempts || 0) + 1;
  const shouldLock = nextAttempts >= MAX_OTP_ATTEMPTS;
  await query(
    `UPDATE otps
     SET otp_attempts = ?,
         locked_until = ${shouldLock ? `DATE_ADD(NOW(), INTERVAL ${OTP_LOCK_MINUTES} MINUTE)` : "locked_until"}
     WHERE email = ?`,
    [nextAttempts, normalizeEmail(email)]
  );
}

function decodeBase64UrlJson(segment) {
  const normalized = String(segment || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const json = Buffer.from(normalized + padding, "base64").toString("utf8");
  return JSON.parse(json);
}

function getAllowedClockSkewSecs() {
  const configured = Number(process.env.GOOGLE_ID_TOKEN_CLOCK_SKEW_SECS || 3600);
  return Number.isFinite(configured) && configured >= 0 ? configured : 3600;
}

function verifyGoogleIdTokenClaims(payload) {
  const expectedAudience = process.env.GOOGLE_CLIENT_ID;
  if (!expectedAudience) {
    throw new Error("Missing GOOGLE_CLIENT_ID configuration");
  }

  const issuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!issuers.includes(payload.iss)) {
    throw new Error("Invalid token issuer");
  }

  if (payload.aud !== expectedAudience) {
    throw new Error("Invalid token audience");
  }

  const now = Math.floor(Date.now() / 1000);
  const skew = getAllowedClockSkewSecs();

  if (typeof payload.nbf === "number" && now + skew < payload.nbf) {
    throw new Error("Token used too early");
  }

  if (typeof payload.iat === "number" && now + skew < payload.iat) {
    throw new Error("Token issued in the future");
  }

  if (typeof payload.exp === "number" && now - skew > payload.exp) {
    throw new Error("Token expired");
  }
}

async function verifyGoogleIdToken(idToken) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Google ID token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson(encodedHeader);
  const payload = decodeBase64UrlJson(encodedPayload);

  if (header.alg !== "RS256") {
    throw new Error("Unsupported Google token algorithm");
  }

  const { certs } = await googleClient.getFederatedSignonCertsAsync();
  const certificate = certs[header.kid];

  if (!certificate) {
    throw new Error("Google signing certificate not found");
  }

  const signature = Buffer.from(String(encodedSignature).replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const signed = Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const verified = crypto.verify("RSA-SHA256", signed, certificate, signature);

  if (!verified) {
    throw new Error("Invalid Google token signature");
  }

  verifyGoogleIdTokenClaims(payload);
  return payload;
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
    const { name, email, password, stream, year } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const requestedRole = "user";
    const existingRows = await query("SELECT id, email_verified FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
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
        [name, hashedPassword, stream || null, year || null, requestedRole, normalizedEmail]
      );
    } else {
      await query(
        `INSERT INTO users (name, email, password, stream, year, role, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [name, normalizedEmail, hashedPassword, stream || null, year || null, requestedRole]
      );
    }

    const otp = generateOtp();
    await saveOtp(normalizedEmail, otp);

    await sendRegistrationOtpMail(normalizedEmail, otp);

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
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: INVALID_LOGIN_MESSAGE });
    }

    if (Number(user.is_active) === 0) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ thủ thư." });
    }

    if (!user.password) {
      return res.status(400).json({ message: INVALID_LOGIN_MESSAGE });
    }

    if (Number(user.email_verified) === 0) {
      return res.status(403).json({ message: "Vui lòng xác nhận email trước khi đăng nhập" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: INVALID_LOGIN_MESSAGE });
    }

    const token = signAccessToken(buildUserPayload(user));
    setAuthCookie(res, token);
    res.json({
      message: "Login successful",
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

userController.session = async (req, res) => {
  res.json({
    error: false,
    user: {
      _id: req.userInfo.id,
      name: req.userInfo.name,
      email: req.userInfo.email,
      role: req.userInfo.role,
    },
  });
};

userController.logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ error: false, message: "Đã đăng xuất" });
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
  const { otp } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const rows = await query("SELECT otp, created_at, otp_attempts, locked_until FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (isFutureDate(record.locked_until)) {
      return res.status(429).json({ message: "OTP đã bị khóa tạm thời. Vui lòng thử lại sau." });
    }

    if (!otpMatches(record, email, otp)) {
      await recordFailedOtpAttempt(email, record.otp_attempts);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (isOtpExpired(record)) return res.status(400).json({ message: "OTP expired" });

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
  const email = normalizeEmail(req.body.email);
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const rows = await query("SELECT id, email_verified FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    if (Number(user.email_verified) === 1) return res.status(400).json({ message: "Email already verified" });

    const otpRows = await query("SELECT created_at, last_sent_at FROM otps WHERE email = ? LIMIT 1", [email]);
    if (otpRows[0] && isOtpResendTooSoon(otpRows[0])) {
      return res.status(429).json({ message: "Vui lòng đợi trước khi gửi lại OTP." });
    }

    const otp = generateOtp();
    await saveOtp(email, otp);

    await sendRegistrationOtpMail(email, otp);
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Resend registration OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

userController.forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const rows = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (rows.length === 0) return res.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE });

    const otpRows = await query("SELECT created_at, last_sent_at FROM otps WHERE email = ? LIMIT 1", [email]);
    if (otpRows[0] && isOtpResendTooSoon(otpRows[0])) {
      return res.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE });
    }

    const otp = generateOtp();
    await saveOtp(email, otp);

    await sendOtpMail(email, otp);

    res.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

userController.verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const rows = await query("SELECT otp, created_at, otp_attempts, locked_until FROM otps WHERE email = ? LIMIT 1", [email]);
    const record = rows[0];

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (isFutureDate(record.locked_until)) {
      return res.status(429).json({ message: "OTP đã bị khóa tạm thời. Vui lòng thử lại sau." });
    }

    if (!otpMatches(record, email, otp)) {
      await recordFailedOtpAttempt(email, record.otp_attempts);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (isOtpExpired(record)) return res.status(400).json({ message: "OTP expired" });

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
  const { newPassword, resetToken } = req.body;
  const email = normalizeEmail(req.body.email);
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

    const payload = await verifyGoogleIdToken(idToken);
    const email = normalizeEmail(payload.email);
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
    const token = signAccessToken(tokenPayload);
    setAuthCookie(res, token);
    res.json({
      message: "Login successful",
      user: { _id: user.id, name: user.name, email: user.email, role: user.role },
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

