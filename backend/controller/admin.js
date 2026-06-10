const bcrypt = require("bcryptjs");
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const jwt = require("jsonwebtoken");
const { query, mapUserRow, mapContactRow } = require("../utils/mysql");

const adminController = {};

const USER_SELECT = `
  SELECT id, name, email, role, stream, year, phone, email_verified, is_active, created_at, updated_at
  FROM users
`;
const USER_ROLES = ["admin", "user"];
const CONTACT_STATUSES = ["new", "in_progress", "resolved", "closed"];
const CONTACT_SELECT = `
  SELECT
    c.id,
    c.name,
    c.email,
    c.subject,
    c.message,
    c.status,
    c.admin_note,
    c.handled_by,
    c.handled_at,
    c.date,
    c.updated_at,
    u.name AS handler_name,
    u.email AS handler_email,
    u.role AS handler_role
  FROM contacts c
  LEFT JOIN users u ON u.id = c.handled_by
`;

function parseUserId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function normalizeBoolean(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return value === 1 ? 1 : 0;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "active", "yes"].includes(normalized)) {
    return 1;
  }
  if (["0", "false", "locked", "no"].includes(normalized)) {
    return 0;
  }

  return fallback;
}

async function getUserById(id) {
  const rows = await query(`${USER_SELECT} WHERE id = ? LIMIT 1`, [id]);
  return rows[0];
}

async function getContactById(id) {
  const rows = await query(`${CONTACT_SELECT} WHERE c.id = ? LIMIT 1`, [id]);
  return rows[0];
}

async function countActiveAdminsExcept(id) {
  const rows = await query(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?",
    [id]
  );
  return Number(rows[0]?.total || 0);
}

async function ensureAdminCanBeChanged(existingUser, targetRole, targetActive, currentAdminId, res) {
  if (existingUser.id === currentAdminId && targetRole !== "admin") {
    res.status(400).json({ error: true, message: "Không thể tự hạ quyền admin của chính mình" });
    return false;
  }

  if (existingUser.id === currentAdminId && targetActive === 0) {
    res.status(400).json({ error: true, message: "Không thể tự khóa tài khoản đang đăng nhập" });
    return false;
  }

  if (existingUser.role === "admin" && (targetRole !== "admin" || targetActive === 0)) {
    const otherActiveAdmins = await countActiveAdminsExcept(existingUser.id);
    if (otherActiveAdmins < 1) {
      res.status(400).json({ error: true, message: "Phải còn ít nhất một admin đang hoạt động" });
      return false;
    }
  }

  return true;
}

adminController.login = async (req, res) => {
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
      return res.status(403).json({ message: "Tài khoản admin đã bị khóa" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    res.json({ message: "Login successful", token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

adminController.getUsers = async (req, res, next) => {
  try {
    const { search = "", role = "all", status = "all" } = req.query;
    const where = [];
    const params = [];
    const normalizedRole = String(role).trim().toLowerCase();
    const normalizedStatus = String(status).trim().toLowerCase();
    const searchTerm = String(search).trim();

    if (USER_ROLES.includes(normalizedRole)) {
      where.push("role = ?");
      params.push(normalizedRole);
    }

    if (normalizedStatus === "active") {
      where.push("is_active = 1");
    } else if (normalizedStatus === "locked") {
      where.push("is_active = 0");
    } else if (normalizedStatus === "verified") {
      where.push("email_verified = 1");
    } else if (normalizedStatus === "unverified") {
      where.push("email_verified = 0");
    }

    if (searchTerm) {
      where.push("(name LIKE ? OR email LIKE ? OR stream LIKE ? OR phone LIKE ?)");
      const likeValue = `%${searchTerm}%`;
      params.push(likeValue, likeValue, likeValue, likeValue);
    }

    const sql = `
      ${USER_SELECT}
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY id DESC
    `;

    const rows = await query(sql, params);
    const users = rows.map((row) => mapUserRow(row));
    res.status(200).json({
      success: true,
      error: false,
      message: "users fetched successfully",
      users,
      user: users,
      totalUser: users.length,
    });
  } catch (error) {
    next(error);
  }
};

adminController.updateUser = async (req, res, next) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: true, message: "User id không hợp lệ" });
    }

    const existingUser = await getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: true, message: "Không tìm thấy người dùng" });
    }

    const name = normalizeOptionalText(req.body.name);
    const email = normalizeOptionalText(req.body.email)?.toLowerCase();
    const role = String(req.body.role || existingUser.role).trim().toLowerCase();
    const phone = normalizeOptionalText(req.body.phone);
    const stream = role === "user" ? normalizeOptionalText(req.body.stream) : null;
    const yearValue = role === "user" && req.body.year !== "" && req.body.year !== undefined && req.body.year !== null
      ? Number(req.body.year)
      : null;
    const emailVerified = normalizeBoolean(req.body.emailVerified, Number(existingUser.email_verified));
    const isActive = normalizeBoolean(req.body.isActive, Number(existingUser.is_active));
    const currentAdminId = Number(req.userInfo?.id);

    if (!name) {
      return res.status(400).json({ error: true, message: "Họ và tên là bắt buộc" });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: true, message: "Email không hợp lệ" });
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ error: true, message: "Vai trò không hợp lệ" });
    }

    if (yearValue !== null && (!Number.isInteger(yearValue) || yearValue < 1 || yearValue > 10)) {
      return res.status(400).json({ error: true, message: "Năm học không hợp lệ" });
    }

    const canChange = await ensureAdminCanBeChanged(existingUser, role, isActive, currentAdminId, res);
    if (!canChange) {
      return;
    }

    const duplicateRows = await query("SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1", [email, id]);
    if (duplicateRows.length > 0) {
      return res.status(400).json({ error: true, message: "Email đã được sử dụng" });
    }

    await query(
      `UPDATE users
       SET name = ?, email = ?, role = ?, stream = ?, year = ?, phone = ?, email_verified = ?, is_active = ?
       WHERE id = ?`,
      [name, email, role, stream, yearValue, phone, emailVerified, isActive, id]
    );

    const updatedUser = await getUserById(id);
    res.status(200).json({
      success: true,
      error: false,
      message: "Đã cập nhật người dùng",
      user: mapUserRow(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

adminController.updateUserStatus = async (req, res, next) => {
  try {
    const id = parseUserId(req.params.id);
    const isActive = normalizeBoolean(req.body.isActive ?? req.body.is_active ?? req.body.active);

    if (!id) {
      return res.status(400).json({ error: true, message: "User id không hợp lệ" });
    }

    if (isActive === null) {
      return res.status(400).json({ error: true, message: "Trạng thái tài khoản không hợp lệ" });
    }

    const existingUser = await getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: true, message: "Không tìm thấy người dùng" });
    }

    const currentAdminId = Number(req.userInfo?.id);
    const canChange = await ensureAdminCanBeChanged(existingUser, existingUser.role, isActive, currentAdminId, res);
    if (!canChange) {
      return;
    }

    await query("UPDATE users SET is_active = ? WHERE id = ?", [isActive, id]);
    const updatedUser = await getUserById(id);
    res.status(200).json({
      success: true,
      error: false,
      message: isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
      user: mapUserRow(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

adminController.deleteUser = async (req, res, next) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: true, message: "User id không hợp lệ" });
    }

    const existingUser = await getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: true, message: "Không tìm thấy người dùng" });
    }

    const currentAdminId = Number(req.userInfo?.id);
    if (id === currentAdminId) {
      return res.status(400).json({ error: true, message: "Không thể tự xóa tài khoản đang đăng nhập" });
    }

    const canChange = await ensureAdminCanBeChanged(existingUser, "user", 0, currentAdminId, res);
    if (!canChange) {
      return;
    }

    await query("DELETE FROM users WHERE id = ?", [id]);
    res.status(200).json({ success: true, error: false, message: "Đã xóa người dùng" });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.code === "ER_ROW_IS_REFERENCED") {
      return res.status(409).json({
        error: true,
        message: "Không thể xóa người dùng đã có dữ liệu mượn sách/sách/giao dịch liên quan. Hãy khóa tài khoản nếu cần ngừng truy cập.",
      });
    }

    next(error);
  }
};

adminController.getContacts = async (req, res, next) => {
  try {
    const { search = "", status = "all" } = req.query;
    const where = [];
    const params = [];
    const normalizedStatus = String(status).trim().toLowerCase();
    const searchTerm = String(search).trim();

    if (CONTACT_STATUSES.includes(normalizedStatus)) {
      where.push("c.status = ?");
      params.push(normalizedStatus);
    }

    if (searchTerm) {
      where.push("(c.name LIKE ? OR c.email LIKE ? OR c.subject LIKE ? OR c.message LIKE ? OR c.admin_note LIKE ?)");
      const likeValue = `%${searchTerm}%`;
      params.push(likeValue, likeValue, likeValue, likeValue, likeValue);
    }

    const rows = await query(
      `${CONTACT_SELECT}
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY c.date DESC, c.id DESC`,
      params
    );
    const contacts = rows.map(mapContactRow);

    const summaryRows = await query("SELECT status, COUNT(*) AS total FROM contacts GROUP BY status");
    const summary = CONTACT_STATUSES.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    summaryRows.forEach((row) => {
      summary[row.status] = Number(row.total || 0);
    });

    res.status(200).json({
      success: true,
      error: false,
      message: "contacts fetched successfully",
      contacts,
      totalContacts: contacts.length,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

adminController.updateContact = async (req, res, next) => {
  try {
    const id = parseUserId(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();
    const adminNote = normalizeOptionalText(req.body.adminNote ?? req.body.admin_note);

    if (!id) {
      return res.status(400).json({ error: true, message: "Contact id không hợp lệ" });
    }

    if (!CONTACT_STATUSES.includes(status)) {
      return res.status(400).json({ error: true, message: "Trạng thái liên hệ không hợp lệ" });
    }

    const existingContact = await getContactById(id);
    if (!existingContact) {
      return res.status(404).json({ error: true, message: "Không tìm thấy tin nhắn liên hệ" });
    }

    const handledBy = status === "new" ? null : Number(req.userInfo?.id);
    await query(
      `UPDATE contacts
       SET status = ?, admin_note = ?, handled_by = ?, handled_at = ${status === "new" ? "NULL" : "NOW()"}
       WHERE id = ?`,
      [status, adminNote, handledBy, id]
    );

    const updatedContact = await getContactById(id);
    res.status(200).json({
      success: true,
      error: false,
      message: "Đã cập nhật tin nhắn liên hệ",
      contact: mapContactRow(updatedContact),
    });
  } catch (error) {
    next(error);
  }
};

adminController.deleteContact = async (req, res, next) => {
  try {
    const id = parseUserId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: true, message: "Contact id không hợp lệ" });
    }

    const result = await query("DELETE FROM contacts WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: "Không tìm thấy tin nhắn liên hệ" });
    }

    res.status(200).json({ success: true, error: false, message: "Đã xóa tin nhắn liên hệ" });
  } catch (error) {
    next(error);
  }
};

adminController.getAllReviews = async (req, res, next) => {
    try {
        const sql = `
            SELECT r.*, u.name as user_name, u.email as user_email, b.title as book_title
            FROM book_reviews r
            JOIN users u ON r.user_id = u.id
            JOIN books b ON r.book_id = b.id
            ORDER BY r.created_at DESC
        `;
        const reviews = await query(sql);
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};

adminController.updateReviewStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (status !== 'visible' && status !== 'hidden') {
            return res.status(400).json({ error: true, message: "Trạng thái không hợp lệ" });
        }

        const result = await query("UPDATE book_reviews SET status = ? WHERE id = ?", [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "Không tìm thấy đánh giá" });
        }
        
        res.status(200).json({ success: true, message: "Đã cập nhật trạng thái đánh giá" });
    } catch (error) {
        next(error);
    }
};

adminController.deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query("DELETE FROM book_reviews WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "Không tìm thấy đánh giá" });
        }
        
        res.status(200).json({ success: true, message: "Đã xóa đánh giá" });
    } catch (error) {
        next(error);
    }
};
// Thêm vào controller/admin.js
adminController.replyReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { admin_reply } = req.body;
        
        // Kiểm tra xem admin có nhập nội dung không
        if (!admin_reply || admin_reply.trim() === '') {
            return res.status(400).json({ error: true, message: "Nội dung phản hồi không được để trống" });
        }

        const result = await query("UPDATE book_reviews SET admin_reply = ? WHERE id = ?", [admin_reply, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "Không tìm thấy đánh giá" });
        }
        
        res.status(200).json({ success: true, message: "Đã phản hồi đánh giá thành công", admin_reply });
    } catch (error) {
        next(error);
    }
};
module.exports = { adminController };
