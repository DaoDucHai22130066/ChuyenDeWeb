const pool = require("../config/db");
const cloudinary = require("cloudinary").v2;
const calculateFine = require("../utils/fineCalculator");
const { clearCache } = require("../utils/cache");

const booksController = {};

booksController.addNewBook = async (req, res) => {
  try {
    const { title, author, category, isbn, availableCopies, totalCopies, price, description } = req.body;
    
    // In SQL we can just INSERT or check first
    const [existing] = await pool.query("SELECT * FROM books WHERE isbn = ?", [isbn]);
    if (existing.length > 0) {
      return res.status(400).json({error:true, message: "Book with this ISBN already exists" });
    }

    let coverImageUrl = req.file ? req.file.path : "";
    let cloudinaryId = req.file ? req.file.filename : "";

    await pool.query(
      "INSERT INTO books (title, author, category, isbn, availableCopies, totalCopies, coverImage, cloudinaryId, price, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [title, author, category, isbn, totalCopies, totalCopies, coverImageUrl, cloudinaryId, price || 0, description]
    );

    clearCache("homeData");
    res.status(201).json({error:false , message: "Book added successfully" });
  } catch (error) {
    res.status(500).json({error:true, message: "Internal Server Error", error });
  }
};

booksController.getAllBooks = async (req, res) => {
  try {
    const [books] = await pool.query("SELECT * FROM books");
    const totalBooks = books.length;
    res.status(200).json({error:false,message:"Books fetched Successfully",books,totalBooks});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error", details: error.message });
  }
};

booksController.getIssuedRequest = async (req, res) => {
  try {
    const [requestedBooks] = await pool.query("SELECT b.*, bo.title, bo.coverImage, u.name as userName, u.email as userEmail FROM borrows b JOIN books bo ON b.bookId = bo.id JOIN users u ON b.userId = u.id WHERE b.status = 'Requested'");
    const totalRequestedBooks = requestedBooks.length;
    res.status(200).json({error:false,message:"Books fetched Successfully",requestedBooks,totalRequestedBooks});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error", details: error.message });
  }
};

booksController.getLatestBooks = async (req, res) => {
  try {
    const [books] = await pool.query("SELECT * FROM books ORDER BY createdAt DESC");
    const totalBooks = books.length;
    
    const [[{totalCategories}]] = await pool.query("SELECT COUNT(DISTINCT category) as totalCategories FROM books");
    const [[{totalActiveStudents}]] = await pool.query("SELECT COUNT(DISTINCT userId) as totalActiveStudents FROM borrows WHERE status = 'Issued'");

    res.status(200).json({error:false,message:"Books fetched Successfully",books,totalBooks,totalCategories,totalActiveStudents});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error", details: error.message });
  }
};

booksController.getParticularBook = async (req, res) => {
  try {
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [req.params.id]);
    if (books.length === 0) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(books[0]);
  } catch (error) {
    res.status(500).json({ message: "internal server error", error });
  }
};

booksController.updateBook = async (req, res) => {
  try {
    const { title, author, category, availableCopies, totalCopies, price } = req.body;
    const [result] = await pool.query(
      "UPDATE books SET title=?, author=?, category=?, availableCopies=?, totalCopies=?, price=? WHERE id=?",
      [title, author, category, availableCopies, totalCopies, price, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Book not found" });
    
    clearCache("homeData");
    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

booksController.deleteBook = async (req, res) => {
  try {
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [req.params.id]);
    if (books.length === 0) return res.status(404).json({ error: true, message: "Book not found" });
    
    if (books[0].cloudinaryId) {
      await cloudinary.uploader.destroy(books[0].cloudinaryId);
    }
    
    await pool.query("DELETE FROM books WHERE id = ?", [req.params.id]);
    clearCache("homeData");
    res.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

booksController.issueBook = async(req,res)=>{
  try {
    const bookid = req.params.bookid;
    const userid = req.userInfo.id;
    
    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [bookid]);
    if (books.length === 0) return res.status(404).json({ message: "Book not found!" });
    
    const [[{issuedBooksCount}]] = await pool.query("SELECT COUNT(*) as issuedBooksCount FROM borrows WHERE userId = ? AND status = 'Issued'", [userid]);
    if (issuedBooksCount >= 4) return res.status(400).json({ message: "You can issue a maximum of 4 books at a time." });
    
    if (books[0].availableCopies <= 0) return res.status(400).json({ message: "No copies available to issue!" });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    await pool.query("INSERT INTO borrows (bookId, userId, dueDate, status) VALUES (?, ?, ?, 'Issued')", [bookid, userid, dueDate]);
    await pool.query("UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?", [bookid]);

    res.status(200).json({ message: "Book issued successfully!", dueDate });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });    
  }
}

booksController.reqIssueBook = async (req, res) => {
  try {
    const userid = req.userInfo.id;
    const bookid = req.params.bookid;

    const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [bookid]);
    if (books.length === 0) return res.status(404).json({ error: true, message: "Book not found" });
    if (books[0].availableCopies < 1) return res.status(400).json({ error: true, message: "No available copies to issue" });

    const [[{currentCount}]] = await pool.query("SELECT COUNT(*) as currentCount FROM borrows WHERE userId = ? AND status IN ('Requested', 'Issued', 'Requested Return')", [userid]);
    if (currentCount >= 4) return res.status(400).json({ error: true, message: "You cannot request or issue more than 4 books at a time." });

    const [existing] = await pool.query("SELECT * FROM borrows WHERE userId = ? AND bookId = ? AND status IN ('Requested', 'Issued')", [userid, bookid]);
    if (existing.length > 0) return res.status(400).json({ error: true, message: "You already requested or issued this book" });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await pool.query("INSERT INTO borrows (bookId, userId, dueDate, status) VALUES (?, ?, ?, 'Requested')", [bookid, userid, dueDate]);

    res.status(200).json({ error: false, message: "Book request submitted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

booksController.getIssuedBooks = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const [issuedBooks] = await pool.query("SELECT b.*, bo.title, bo.author, bo.category, bo.isbn, bo.price, bo.coverImage FROM borrows b JOIN books bo ON b.bookId = bo.id WHERE b.userId = ? AND b.returnDate IS NULL AND b.status IN ('Issued', 'Requested', 'Requested Return') ORDER BY b.issueDate DESC", [userId]);
    
    if (issuedBooks.length === 0) {
      return res.status(200).json({ error: true, message: "No issued books found.", issuedBooks: [] });
    }

    const booksWithFine = issuedBooks.map(book => {
      const fine = calculateFine(book.dueDate, book.returnDate);
      return { ...book, fine };
    });

    res.json({ error: false, message: "Issued books fetched", issuedBooks: booksWithFine });
  } catch (error) {
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};

booksController.returnBook = async (req, res) => {
  try {
    const issueId = req.params.id;
    const [borrows] = await pool.query("SELECT * FROM borrows WHERE id = ?", [issueId]);
    if (borrows.length === 0) return res.status(404).json({ message: "Issued record not found" });
    
    const issuedBook = borrows[0];
    if (issuedBook.status === "Returned") return res.status(400).json({ message: "Book already returned" });

    await pool.query("UPDATE borrows SET status = 'Returned', returnDate = CURRENT_TIMESTAMP WHERE id = ?", [issueId]);
    await pool.query("UPDATE books SET availableCopies = availableCopies + 1 WHERE id = ?", [issuedBook.bookId]);

    res.json({ message: "Book returned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

booksController.requestReturnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const [borrows] = await pool.query("SELECT * FROM borrows WHERE id = ?", [borrowId]);
    if (borrows.length === 0) return res.status(404).json({ message: "Borrow record not found" });

    const borrowRecord = borrows[0];
    if (borrowRecord.userId != req.userInfo.id) return res.status(403).json({ message: "Unauthorized" });
    if (borrowRecord.status !== "Issued") return res.status(400).json({ message: "Only books with status 'Issued' can be requested for return" });

    await pool.query("UPDATE borrows SET status = 'Requested Return' WHERE id = ?", [borrowId]);
    return res.status(200).json({ message: "Return request submitted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { booksController };