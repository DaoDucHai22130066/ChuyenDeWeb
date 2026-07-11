import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiEdit2, FiMapPin, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import "../../styles/components.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { getAuthToken } from "../../utils/auth";
import "./viewbook.css";
import "./admin-shared.css";

const FALLBACK_COVER = "https://placehold.co/240x340/eef2ff/475569?text=D+Free+Book";

const formatVND = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "Chưa cập nhật";
  return `${new Intl.NumberFormat("vi-VN").format(numericValue)} VNĐ`;
};

const BRANCH_LABELS = {
  "dai-la": "Cơ sở Đại La",
  "cau-giay": "Cơ sở Cầu Giấy",
};

const ViewBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    price: "",
    totalCopies: "",
    coverImage: "",
    description: "",
    branch: "dai-la",
  });

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${Server_URL}books`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setBooks(response.data.books || []);
    } catch (error) {
      console.error("Lỗi tải danh sách sách:", error.response?.data?.message || error.message);
      showErrorToast("Không thể tải danh sách sách.");
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return books.filter((book) => {
      const matchesBranch = branchFilter === "all" || (book.branch || "dai-la") === branchFilter;
      const matchesSearch = !keyword || [
        book.title,
        book.author,
        book.isbn,
        book.categoryId?.name,
        book.category,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
      return matchesBranch && matchesSearch;
    });
  }, [books, branchFilter, search]);

  const totalCopies = useMemo(
    () => books.reduce((total, book) => total + Number(book.totalCopies || 0), 0),
    [books]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sách này?")) return;
    try {
      await axios.delete(`${Server_URL}books/delete/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      showSuccessToast("Đã xóa sách thành công!");
      fetchBooks();
    } catch (error) {
      console.error("Lỗi xóa sách:", error.response?.data?.message || error.message);
      showErrorToast("Không xóa được sách.");
    }
  };

  const handleEdit = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      category: book.categoryId?.name || book.category || "",
      isbn: book.isbn || "",
      price: book.price || "",
      totalCopies: book.totalCopies || "",
      coverImage: book.coverImage || "",
      description: book.description || "",
      branch: book.branch || "dai-la",
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${Server_URL}books/update/${selectedBook._id}`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      showSuccessToast("Đã cập nhật sách thành công!");
      setShowModal(false);
      fetchBooks();
    } catch (error) {
      console.error("Lỗi cập nhật sách:", error.response?.data?.message || error.message);
      showErrorToast("Không cập nhật được sách.");
    }
  };

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <section className="admin-page-hero admin-books-hero">
        <div className="admin-page-kicker">Kho tài liệu</div>
        <h1 className="admin-page-title">Quản lý sách</h1>
        <p className="admin-page-lead">
          Tra cứu, theo dõi số lượng và cập nhật thông tin đầu sách trong toàn bộ thư viện.
        </p>
        <div className="admin-hero-metrics">
          <div><strong>{books.length}</strong><span>Đầu sách</span></div>
          <div><strong>{totalCopies}</strong><span>Tổng số bản</span></div>
          <div><strong>{filteredBooks.length}</strong><span>Kết quả hiển thị</span></div>
        </div>
      </section>

      <section className="admin-books-toolbar" aria-label="Bộ lọc sách">
        <div className="admin-book-search">
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên sách, tác giả, ISBN..."
            aria-label="Tìm kiếm sách"
          />
        </div>
        <select
          className="admin-branch-filter"
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          aria-label="Lọc theo chi nhánh"
        >
          <option value="all">Tất cả chi nhánh</option>
          <option value="dai-la">Cơ sở Đại La</option>
          <option value="cau-giay">Cơ sở Cầu Giấy</option>
        </select>
        <button type="button" className="btn admin-btn-primary" onClick={() => navigate("/admin/addbook")}>
          <FiPlus /> Thêm sách mới
        </button>
      </section>

      {filteredBooks.length > 0 ? (
        <div className="admin-book-grid">
          {filteredBooks.map((book) => (
            <article key={book._id} className="book-card">
              <div className="book-image-wrapper">
                <img src={book.coverImage || FALLBACK_COVER} className="book-image" alt={`Bìa sách ${book.title}`} />
                <span className="book-stock-badge">{Number(book.totalCopies || 0)} bản</span>
              </div>
              <div className="card-body">
                <span className="book-category">{book.categoryId?.name || book.category || "Chưa phân loại"}</span>
                <h2 className="card-title">{book.title}</h2>
                <p className="book-author">{book.author}</p>
                <div className="book-meta">
                  <span><FiMapPin /> {BRANCH_LABELS[book.branch] || BRANCH_LABELS["dai-la"]}</span>
                  <span><FiBookOpen /> ISBN: {book.isbn || "Chưa có"}</span>
                </div>
                <p className="book-price">{formatVND(book.price)}</p>
              </div>
              <div className="card-footer">
                <button className="btn edit-btn" onClick={() => handleEdit(book)}>
                  <FiEdit2 /> Chỉnh sửa
                </button>
                <button className="btn delete-btn" onClick={() => handleDelete(book._id)}>
                  <FiTrash2 /> Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-books-empty">
          <FiBookOpen />
          <h2>Không tìm thấy sách phù hợp</h2>
          <p>Thử đổi từ khóa hoặc bộ lọc chi nhánh.</p>
        </div>
      )}

      {showModal && selectedBook && (
        <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content admin-modal-content">
              <div className="modal-header admin-modal-header">
                <div>
                  <small>Thông tin đầu sách</small>
                  <h2 className="modal-title">Chỉnh sửa sách</h2>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="admin-edit-book-layout">
                  <div className="edit-cover-preview">
                    <img src={formData.coverImage || FALLBACK_COVER} alt="Xem trước ảnh bìa" />
                  </div>
                  <form className="admin-edit-book-form">
                    <label>Tên sách<input type="text" name="title" value={formData.title} onChange={handleChange} /></label>
                    <label>Tác giả<input type="text" name="author" value={formData.author} onChange={handleChange} /></label>
                    <label>Danh mục<input type="text" name="category" value={formData.category} onChange={handleChange} /></label>
                    <label>Chi nhánh
                      <select name="branch" value={formData.branch} onChange={handleChange}>
                        <option value="dai-la">Cơ sở Đại La</option>
                        <option value="cau-giay">Cơ sở Cầu Giấy</option>
                      </select>
                    </label>
                    <label className="full-width">Ảnh bìa (URL)<input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} /></label>
                    <label>ISBN<input type="text" name="isbn" value={formData.isbn} onChange={handleChange} /></label>
                    <label>Giá tham khảo<input type="number" name="price" value={formData.price} onChange={handleChange} /></label>
                    <label>Số bản<input type="number" min="1" name="totalCopies" value={formData.totalCopies} onChange={handleChange} /></label>
                    <label className="full-width">Mô tả<textarea name="description" rows="4" value={formData.description} onChange={handleChange} /></label>
                  </form>
                </div>
              </div>
              <div className="modal-footer admin-modal-footer">
                <button type="button" className="btn admin-btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="button" className="btn admin-btn-primary" onClick={handleUpdate}>Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ViewBooks;
