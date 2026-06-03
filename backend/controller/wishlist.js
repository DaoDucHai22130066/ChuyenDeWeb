const { query, mapBookRow } = require("../utils/mysql");

const getWishlist = async (req, res, next) => {
    try {
        const userId = req.userInfo.id;
        // Fetch wishlisted books for the user
        const sql = `
            SELECT w.user_id, w.book_id, w.created_at as w_created_at, b.*, 
                   c.name as category_name, 
                   u.name as user_name, u.email as user_email, u.role as user_role
            FROM wishlists w
            JOIN books b ON w.book_id = b.id
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN users u ON b.added_by = u.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;
        const rows = await query(sql, [userId]);
        
        const wishlist = rows.map(row => ({
            _id: `${row.user_id}-${row.book_id}`,
            createdAt: row.w_created_at,
            bookId: mapBookRow(row)
        }));
        
        res.status(200).json({ success: true, wishlist });
    } catch (error) {
        next(error);
    }
};

const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.userInfo.id;
        const { bookId } = req.params;

        // Check if book exists
        const books = await query("SELECT id FROM books WHERE id = ?", [bookId]);
        if (books.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
        }

        // Add to wishlist
        try {
            await query("INSERT INTO wishlists (user_id, book_id) VALUES (?, ?)", [userId, bookId]);
            res.status(201).json({ success: true, message: "Đã thêm vào danh sách yêu thích" });
        } catch (insertError) {
            if (insertError.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "Sách đã có trong danh sách yêu thích" });
            }
            throw insertError;
        }
    } catch (error) {
        next(error);
    }
};

const removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.userInfo.id;
        const { bookId } = req.params;

        const result = await query("DELETE FROM wishlists WHERE user_id = ? AND book_id = ?", [userId, bookId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sách trong danh sách yêu thích" });
        }

        res.status(200).json({ success: true, message: "Đã xóa khỏi danh sách yêu thích" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};

