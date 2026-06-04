const { query } = require("../utils/mysql");

const addReview = async (req, res, next) => {
    try {
        const userId = req.userInfo.id;
        const { bookId, ticketId, rating, comment } = req.body;

        if (!bookId || !ticketId || !rating) {
            return res.status(400).json({ error: true, message: "Thiếu thông tin đánh giá" });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: true, message: "Đánh giá phải từ 1 đến 5 sao" });
        }

        // Validate ticket belongs to user, and is returned or closed
        const ticketRows = await query(
            "SELECT id, status FROM borrow_tickets WHERE id = ? AND user_id = ?",
            [ticketId, userId]
        );

        if (ticketRows.length === 0) {
            return res.status(404).json({ error: true, message: "Không tìm thấy phiếu mượn" });
        }

        const ticket = ticketRows[0];
        if (ticket.status !== 'returned' && ticket.status !== 'closed') {
            return res.status(400).json({ error: true, message: "Bạn chỉ có thể đánh giá sách sau khi đã trả sách" });
        }

        // Validate book belongs to this ticket
        const bookRows = await query(
            "SELECT * FROM borrow_ticket_books WHERE ticket_id = ? AND book_id = ?",
            [ticketId, bookId]
        );

        if (bookRows.length === 0) {
            return res.status(400).json({ error: true, message: "Cuốn sách này không thuộc phiếu mượn đã chọn" });
        }

        // Insert review
        try {
            await query(
                "INSERT INTO book_reviews (user_id, book_id, ticket_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
                [userId, bookId, ticketId, rating, comment || null]
            );
            res.status(201).json({ success: true, message: "Cảm ơn bạn đã đánh giá" });
        } catch (insertError) {
            if (insertError.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: true, message: "Bạn đã đánh giá sách này trong phiếu mượn này rồi" });
            }
            throw insertError;
        }

    } catch (error) {
        next(error);
    }
};

module.exports = {
    addReview
};
