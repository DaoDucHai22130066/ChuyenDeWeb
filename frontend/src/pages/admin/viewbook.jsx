import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import "../../styles/components.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";

import "./viewbook.css";
import "./admin-shared.css";

const formatVND = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "Chưa cập nhật";
  return new Intl.NumberFormat("vi-VN").format(numericValue) + " VNĐ";
};

const ViewBooks = () => {
  const navigate = useNavigate();
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
      console.error("Lỗi tải danh sách sách:", error.response?.data?.message || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sách này?")) return;

    try {
      await axios.delete(`${Server_URL}books/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      showSuccessToast("Đã xóa sách thành công!");
      fetchBooks();
    } catch (error) {
      console.error("Lỗi xóa sách:", error.response?.data?.message || error.message);
      showErrorToast("Không xóa được sách!");
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
  
      showSuccessToast("Đã cập nhật sách thành công!");
      setShowModal(false);
      fetchBooks();
    } catch (error) {
      console.error("Lỗi cập nhật sách:", error.response?.data?.message || error.message);
      showErrorToast("Không cập nhật được sách!");
    }
  };
  

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.34 }}>
      <div className="admin-page-hero">
        <div className="admin-page-kicker">Quản trị thư viện</div>
        <h2 className="admin-page-title admin-book-heading">Quản lý sách</h2>
        <p className="admin-page-lead">Theo dõi kho sách, chỉnh sửa thông tin và xử lý sách không còn phù hợp trong một giao diện trực quan.</p>
      </div>

      <div className="admin-books-toolbar">
        <div>
          <span className="admin-books-count">{books.length}</span>
          <span className="admin-books-label">đầu sách đang hiển thị</span>
        </div>
        <button type="button" className="btn admin-btn-primary" onClick={() => navigate("/admin/addbook")}>+ Thêm sách mới</button>
      </div>

        <div className="container admin-book-grid">
  <div className="row">
    {books.length > 0 ? (
      books.map((book) => (
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
              <p className="book-price">💰 {formatVND(book.price)}</p>
            </div>
            <div className="card-footer text-center">
              <button className="btn edit-btn me-2" onClick={() => handleEdit(book)}>
                ✏ Sửa
              </button>
              <button className="btn delete-btn" onClick={() => handleDelete(book._id)}>
                🗑 Xóa
              </button>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-4">
        <h5 className="text-muted">Chưa có sách nào trong hệ thống.</h5>
      </div>
    )}
  </div>
</div>





   
      {showModal && selectedBook && (
  <div className="modal d-block" tabIndex="-1">
    <div className="modal-dialog modal-dialog-centered modal-lg"> {/* Hộp thoại căn giữa và mở rộng */}
      <div className="modal-content admin-modal-content"> {/* Thêm bóng đổ và bo góc */}
        <div className="modal-header admin-modal-header">
          <h5 className="modal-title">Chỉnh sửa sách</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
        </div>
        <div className="modal-body p-4">
          <form>
            <div className="mb-3">
              <label className="form-label fw-bold">Tên sách</label>
              <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Tác giả</label>
              <input type="text" className="form-control" name="author" value={formData.author} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Danh mục</label>
              <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">ISBN</label>
                <input type="text" className="form-control" name="isbn" value={formData.isbn} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Giá tham khảo (VNĐ)</label>
                <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Tổng số bản</label>
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
