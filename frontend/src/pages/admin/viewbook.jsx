import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import "../../styles/components.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";

import "./viewbook.css";
import "./admin-shared.css";

const ViewBooks = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    price: "",
    totalCopies: "",
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const url = Server_URL + "books";
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setBooks(response.data.books);
    } catch (error) {
      console.error("Error fetching books:", error.response?.data?.message || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sách này?")) return;

    try {
      await axios.delete(`${Server_URL}books/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      showSuccessToast("Book deleted successfully!");
      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error.response?.data?.message || error.message);
      showErrorToast("Failed to delete book!");
    }
  };

  
  const handleEdit = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.categoryId?.name || book.category || "",
      isbn: book.isbn,
      price: book.price,
      totalCopies: book.totalCopies,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
 
  const handleUpdate = async () => {
    try {
      
      await axios.put(`${Server_URL}books/update/${selectedBook._id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
  
      showSuccessToast("Book updated successfully!");
      setShowModal(false);
      fetchBooks();
    } catch (error) {
      console.error("Error updating book:", error.response?.data?.message || error.message);
      showErrorToast("Failed to update book!");
    }
  };
  

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.34 }}>
      <div className="admin-page-hero">
        <div className="admin-page-kicker">Admin library</div>
        <h2 className="admin-page-title admin-book-heading">Quản lý sách</h2>
        <p className="admin-page-lead">Danh sách sách dùng cùng hệ màu với toàn bộ giao diện quản trị.</p>
      </div>
        <div className="container admin-book-grid">
  <div className="row">
    {books.length > 0 ? (
      books.map((book, index) => (
        <div key={book._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div className="card book-card">
            <div className="book-image-wrapper">
              <img
                src={book.coverImage || "https://via.placeholder.com/200"}
                className="book-image"
                alt={book.title}
              />
            </div>
            <div className="card-body">
              <h5 className="card-title">{book.title}</h5>
              <p className="book-author">{book.author}</p>
              <p className="book-category">📚 {book.categoryId?.name || book.category || "Chưa phân loại"}</p>
              <p className="book-isbn">🔢 ISBN: {book.isbn}</p>
              <p className="book-price">💰 ₹{book.price}</p>
            </div>
            <div className="card-footer text-center">
              <button className="btn edit-btn me-2" onClick={() => handleEdit(book)}>
                ✏ Edit
              </button>
              <button className="btn delete-btn" onClick={() => handleDelete(book._id)}>
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-4">
        <h5 className="text-muted">No books found.</h5>
      </div>
    )}
  </div>
</div>





   
      {showModal && selectedBook && (
  <div className="modal d-block" tabIndex="-1">
    <div className="modal-dialog modal-dialog-centered modal-lg"> {/* Centered and Larger Modal */}
      <div className="modal-content admin-modal-content"> {/* Added Shadow & Rounded Corners */}
        <div className="modal-header admin-modal-header">
          <h5 className="modal-title">Chỉnh sửa sách</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
        </div>
        <div className="modal-body p-4">
          <form>
            <div className="mb-3">
              <label className="form-label fw-bold">Title</label>
              <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Author</label>
              <input type="text" className="form-control" name="author" value={formData.author} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Category</label>
              <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">ISBN</label>
                <input type="text" className="form-control" name="isbn" value={formData.isbn} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Price (₹)</label>
                <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Total Copies</label>
              <input type="number" className="form-control" name="totalCopies" value={formData.totalCopies} onChange={handleChange} />
            </div>
          </form>
        </div>
        <div className="modal-footer admin-modal-footer d-flex justify-content-between p-3">
          <button type="button" className="btn admin-btn-secondary px-4" onClick={() => setShowModal(false)}>Hủy</button>
          <button type="button" className="btn admin-btn-primary px-4" onClick={handleUpdate}>Cập nhật</button>
        </div>
      </div>
    </div>
  </div>
)}



    </motion.div>
  );
};

export default ViewBooks;
