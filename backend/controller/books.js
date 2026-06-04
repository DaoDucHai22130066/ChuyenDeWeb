const booksController = {};
const { clearCache } = require("../utils/cache");
const { withTransaction, query, mapBookRow } = require("../utils/mysql");

async function resolveCategory(connection, categoryInput) {
  const value = categoryInput?.toString().trim();
  if (!value) {
    return null;
  }

  const numericId = Number(value);
  if (Number.isInteger(numericId) && String(numericId) === value) {
    const [rows] = await connection.query("SELECT id, name, created_at, updated_at FROM categories WHERE id = ? LIMIT 1", [numericId]);
    if (rows.length > 0) {
      return rows[0];
    }
  }

  const [existingRows] = await connection.query("SELECT id, name, created_at, updated_at FROM categories WHERE name = ? LIMIT 1", [value]);
  if (existingRows.length > 0) {
    return existingRows[0];
  }

  const [insertResult] = await connection.query("INSERT INTO categories (name) VALUES (?)", [value]);
  const [newRows] = await connection.query("SELECT id, name, created_at, updated_at FROM categories WHERE id = ? LIMIT 1", [insertResult.insertId]);
  return newRows[0] || null;
}

async function fetchBooks(connection, { orderByLatest = false } = {}) {
  const rows = await connection.query(
    `SELECT
       b.id,
       b.title,
       b.author,
       b.category,
       b.category_id,
       b.isbn,
       b.description,
       b.available_copies,
       b.total_copies,
       b.added_by,
       b.cover_image,
       b.price,
       b.branch,
       b.borrow_count,
       b.created_at,
       b.updated_at,
       c.name AS category_name,
       u.name AS user_name,
       u.email AS user_email,
       u.role AS user_role
     FROM books b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN users u ON u.id = b.added_by
     ${orderByLatest ? "ORDER BY b.created_at DESC" : "ORDER BY b.id DESC"}`
  );

  return rows.map(mapBookRow);
}

const getBookReviews = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT r.*, u.name as user_name
            FROM book_reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = ? AND r.status = 'visible'
            ORDER BY r.created_at DESC
        `;
        const reviews = await query(sql, [id]);
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};

const getReviewSummary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating
            FROM book_reviews
            WHERE book_id = ? AND status = 'visible'
        `;
        const result = await query(sql, [id]);
        const summary = result[0] || { total_reviews: 0, average_rating: 0 };
        res.status(200).json({ 
            success: true, 
            summary: {
                totalReviews: summary.total_reviews,
                averageRating: summary.average_rating ? Number(summary.average_rating).toFixed(1) : 0
            }
        });
    } catch (error) {
        next(error);
    }
};

booksController.getBookReviews = getBookReviews;
booksController.getReviewSummary = getReviewSummary;

booksController.addNewBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      categoryId,
      isbn,
      availableCopies,
      totalCopies,
      coverImage,
      price,
      description,
      branch,
    } = req.body;

    const { id } = req.userInfo;

    if (!title || !author || !isbn || !description || !totalCopies) {
      return res.status(400).json({ error: true, message: "Thiếu trường thông tin sách bắt buộc" });
    }

    const existingBookRows = await query("SELECT id FROM books WHERE isbn = ? LIMIT 1", [isbn]);
    if (existingBookRows.length > 0) {
      return res.status(400).json({ error: true, message: "Sách với ISBN này đã tồn tại" });
    }

    const categoryInput = categoryId || category;
    const categoryRow = await withTransaction(async (connection) => {
      return resolveCategory(connection, categoryInput);
    });

    if (!categoryRow) {
      return res.status(400).json({ error: true, message: "Cần chọn thể loại" });
    }

    const coverImageUrl = coverImage || "";
    const totalCopiesValue = Number(totalCopies);
    const availableCopiesValue = Number.isFinite(Number(availableCopies)) ? Number(availableCopies) : totalCopiesValue;
    const numericPrice = price === undefined || price === "" ? null : Number(price);

    const insertResult = await query(
      `INSERT INTO books
        (title, author, category, category_id, isbn, description, available_copies, total_copies, added_by, cover_image, price, branch)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        title,
        author,
        categoryRow.name,
        categoryRow.id,
        isbn,
        description,
        availableCopiesValue,
        totalCopiesValue,
        id,
        coverImageUrl,
        numericPrice,
        branch || "dai-la",
      ]
    );

    clearCache("homeData");

    const bookRows = await query(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.category,
         b.category_id,
         b.isbn,
         b.description,
         b.available_copies,
         b.total_copies,
         b.added_by,
         b.cover_image,
         b.price,
         b.branch,
         b.borrow_count,
         b.created_at,
         b.updated_at,
         c.name AS category_name,
         u.name AS user_name,
         u.email AS user_email,
         u.role AS user_role
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN users u ON u.id = b.added_by
       WHERE b.id = ?
       LIMIT 1`,
      [insertResult.insertId]
    );

    res.status(201).json({ error: false, message: "Thêm sách thành công", book: mapBookRow(bookRows[0]) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Lỗi máy chủ", error: error.message });
  }
};

booksController.getAllBooks = async (req, res) => {
  try {
    const rows = await query(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.category,
         b.category_id,
         b.isbn,
         b.description,
         b.available_copies,
         b.total_copies,
         b.added_by,
         b.cover_image,
         b.price,
         b.branch,
         b.borrow_count,
         b.created_at,
         b.updated_at,
         c.name AS category_name,
         u.name AS user_name,
         u.email AS user_email,
         u.role AS user_role
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN users u ON u.id = b.added_by
       ORDER BY b.id DESC`
    );

    if (!rows || rows.length === 0) {
      return res.json({ error: true, message: "Không tìm thấy sách" });
    }

    const books = rows.map(mapBookRow);
    const totalBooks = books.length;

    res.status(200).json({ error: false, message: "Lấy danh sách sách thành công", books, totalBooks });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

booksController.getLatestBooks = async (req, res) => {
  try {
    const rows = await query(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.category,
         b.category_id,
         b.isbn,
         b.description,
         b.available_copies,
         b.total_copies,
         b.added_by,
         b.cover_image,
         b.price,
         b.branch,
         b.borrow_count,
         b.created_at,
         b.updated_at,
         c.name AS category_name,
         u.name AS user_name,
         u.email AS user_email,
         u.role AS user_role
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN users u ON u.id = b.added_by
       ORDER BY b.created_at DESC`
    );

    if (!rows || rows.length === 0) {
      return res.json({ error: true, message: "Không tìm thấy sách" });
    }

    const books = rows.map(mapBookRow);
    const totalBooks = books.length;
    const uniqueCategories = new Set(books.map((book) => book.categoryId?.name || book.category).filter(Boolean));
    const totalCategories = uniqueCategories.size;

    const activeStudentsRows = await query(
      `SELECT COUNT(DISTINCT user_id) AS totalActiveStudents
       FROM borrow_tickets
       WHERE status IN ('approved', 'dispatched', 'delivered')`
    );

    const totalActiveStudents = Number(activeStudentsRows[0]?.totalActiveStudents || 0);

    res.status(200).json({
      error: false,
      message: "Lấy danh sách sách thành công",
      books,
      totalBooks,
      totalCategories,
      totalActiveStudents,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Lỗi máy chủ",
      details: error.message,
    });
  }
};

booksController.getParticularBook = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.category,
         b.category_id,
         b.isbn,
         b.description,
         b.available_copies,
         b.total_copies,
         b.added_by,
         b.cover_image,
         b.price,
         b.branch,
         b.borrow_count,
         b.created_at,
         b.updated_at,
         c.name AS category_name,
         u.name AS user_name,
         u.email AS user_email,
         u.role AS user_role
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN users u ON u.id = b.added_by
       WHERE b.id = ?
       LIMIT 1`,
      [id]
    );

    const book = rows[0];
    if (!book) {
      return res.status(404).json({ error: true, message: "Không tìm thấy sách" });
    }

    res.status(200).json(mapBookRow(book));
  } catch (error) {
    res.status(500).json({ error: true, message: "Lỗi máy chủ", details: error.message });
  }
};

booksController.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT id FROM books WHERE id = ? LIMIT 1", [id]);
    const book = rows[0];

    if (!book) {
      return res.status(404).json({ error: true, message: "Không tìm thấy sách" });
    }

    await withTransaction(async (connection) => {
      await connection.query("DELETE FROM borrow_ticket_books WHERE book_id = ?", [id]);
      await connection.query("DELETE FROM books WHERE id = ?", [id]);
    });

    clearCache("homeData");
    res.status(200).json({ error: false, message: "Xóa sách thành công" });
  } catch (error) {
    res.status(500).json({ error: true, message: "Lỗi máy chủ", details: error.message });
  }
};

booksController.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, isbn, price, totalCopies, description, branch } = req.body;

    const rows = await query(
      `SELECT * FROM books WHERE id = ? LIMIT 1`,
      [id]
    );
    const currentBook = rows[0];

    if (!currentBook) {
      return res.status(404).json({ error: true, message: "Không tìm thấy sách" });
    }

    const categoryRow = category !== undefined && category !== null && String(category).trim() !== ""
      ? await withTransaction(async (connection) => resolveCategory(connection, category))
      : null;

    const nextTitle = title ?? currentBook.title;
    const nextAuthor = author ?? currentBook.author;
    const nextIsbn = isbn ?? currentBook.isbn;
    const nextDescription = description ?? currentBook.description;
    const nextBranch = branch ?? currentBook.branch;
    const nextPrice = price === undefined || price === "" ? currentBook.price : Number(price);
    const nextTotalCopies = totalCopies === undefined || totalCopies === ""
      ? currentBook.total_copies
      : Number(totalCopies);
    const borrowedCopies = Math.max(currentBook.total_copies - currentBook.available_copies, 0);
    const nextAvailableCopies = Math.max(nextTotalCopies - borrowedCopies, 0);

    await query(
      `UPDATE books
       SET title = ?, author = ?, category = ?, category_id = ?, isbn = ?, description = ?,
           available_copies = ?, total_copies = ?, price = ?, branch = ?
       WHERE id = ?`,
      [
        nextTitle,
        nextAuthor,
        categoryRow ? categoryRow.name : currentBook.category,
        categoryRow ? categoryRow.id : currentBook.category_id,
        nextIsbn,
        nextDescription,
        nextAvailableCopies,
        nextTotalCopies,
        nextPrice,
        nextBranch,
        id,
      ]
    );



    clearCache("homeData");
    res.status(200).json({ error: false, message: "Cập nhật sách thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Lỗi máy chủ", details: error.message });
  }
};

module.exports = { booksController };
