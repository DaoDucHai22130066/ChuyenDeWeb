const bcrypt = require("bcryptjs");
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const jwt = require("jsonwebtoken");
const { query } = require("../utils/mysql");

const adminController = {};

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
