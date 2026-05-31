const booksController = {};
const { clearCache } = require("../utils/cache");
const { cloudinary } = require("../utils/cloudConfig");
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
       b.cloudinary_id,
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
      return res.status(400).json({ error: true, message: "Missing required book fields" });
    }

    const existingBookRows = await query("SELECT id FROM books WHERE isbn = ? LIMIT 1", [isbn]);
    if (existingBookRows.length > 0) {
      return res.status(400).json({ error: true, message: "Book with this ISBN already exists" });
    }

    const categoryInput = categoryId || category;
    const categoryRow = await withTransaction(async (connection) => {
      return resolveCategory(connection, categoryInput);
    });

    if (!categoryRow) {
      return res.status(400).json({ error: true, message: "Category is required" });
    }

    const coverImageUrl = req.file ? req.file.path : coverImage || "";
    const cloudinaryId = req.file ? req.file.filename : "";
    const totalCopiesValue = Number(totalCopies);
    const availableCopiesValue = Number.isFinite(Number(availableCopies)) ? Number(availableCopies) : totalCopiesValue;
    const numericPrice = price === undefined || price === "" ? null : Number(price);

    const insertResult = await query(
      `INSERT INTO books
        (title, author, category, category_id, isbn, description, available_copies, total_copies, added_by, cover_image, cloudinary_id, price, branch)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
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
        cloudinaryId,
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
         b.cloudinary_id,
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

    res.status(201).json({ error: false, message: "Book added successfully", book: mapBookRow(bookRows[0]) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error", error: error.message });
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
         b.cloudinary_id,
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
      return res.json({ error: true, message: "No Books Found" });
    }

    const books = rows.map(mapBookRow);
    const totalBooks = books.length;

    res.status(200).json({ error: false, message: "Books fetched Successfully", books, totalBooks });
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
         b.cloudinary_id,
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
      return res.json({ error: true, message: "No Books Found" });
    }

    const books = rows.map(mapBookRow);
    const totalBooks = books.length;
    const uniqueCategories = new Set(books.map((book) => book.categoryId?.name || book.category).filter(Boolean));
    const totalCategories = uniqueCategories.size;

    const activeStudentsRows = await query(
      `SELECT COUNT(DISTINCT user_id) AS totalActiveStudents
       FROM borrow_tickets
       WHERE status = 'Approved'`
    );

    const totalActiveStudents = Number(activeStudentsRows[0]?.totalActiveStudents || 0);

    res.status(200).json({
      error: false,
      message: "Books fetched Successfully",
      books,
      totalBooks,
      totalCategories,
      totalActiveStudents,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
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
         b.cloudinary_id,
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
      return res.status(404).json({ error: true, message: "Book not found" });
    }

    res.status(200).json(mapBookRow(book));
  } catch (error) {
    res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};

booksController.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT cloudinary_id FROM books WHERE id = ? LIMIT 1", [id]);
    const book = rows[0];

    if (!book) {
      return res.status(404).json({ error: true, message: "Book not found" });
    }

    await withTransaction(async (connection) => {
      await connection.query("DELETE FROM borrow_ticket_books WHERE book_id = ?", [id]);
      await connection.query("DELETE FROM books WHERE id = ?", [id]);
    });

    if (book.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(book.cloudinary_id, { invalidate: true });
      } catch (cloudError) {
        console.warn("Cloudinary cleanup failed:", cloudError.message);
      }
    }

    clearCache("homeData");
    res.status(200).json({ error: false, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
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
      return res.status(404).json({ error: true, message: "Book not found" });
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

    if (req.file && currentBook.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(currentBook.cloudinary_id, { invalidate: true });
      } catch (cloudError) {
        console.warn("Cloudinary cleanup failed:", cloudError.message);
      }
    }

    if (req.file) {
      await query(
        `UPDATE books SET cover_image = ?, cloudinary_id = ? WHERE id = ?`,
        [req.file.path, req.file.filename, id]
      );
    }

    clearCache("homeData");
    res.status(200).json({ error: false, message: "Book updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};

module.exports = { booksController };
