import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiBookOpen, FiEdit2, FiMapPin, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import axios from "axios";
import "../../styles/components.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./viewbook.css";
import "./admin-shared.css";

const FALLBACK_COVER = "https://placehold.co/240x340/eef2ff/475569?text=D+Free+Book";
const ITEMS_PER_PAGE = 8;

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
  const [currentPage, setCurrentPage] = useState(1);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const getHeaders = () => {
    const token = localStorage.getItem("authToken");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${Server_URL}books`);
      setBooks(response.data.books || response.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách sách:", error);
      showErrorToast("Không thể tải danh mục sách.");
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Mở modal sửa sách
  const openEditModal = (book) => {
    setSelectedBook(book);
    reset({
      title: book.title,
      author: book.author,
      branch: book.branch || "dai-la",
      coverImage: book.coverImage || "",
      isbn: book.isbn || "",
      price: book.price || "",
      totalCopies: book.totalCopies || 1,
      description: book.description || "",
    });
  };

  // Xử lý Cập nhật sách
  const onUpdateSubmit = async (data) => {
    try {
      const response = await axios.put(`${Server_URL}books/update/${selectedBook._id}`, data, {
        headers: getHeaders(),
      });
      if (response.data.error) {
        showErrorToast(response.data.message || "Cập nhật thất bại.");
        return;
      }
      showSuccessToast("Cập nhật sách thành công!");
      setSelectedBook(null);
      fetchBooks(); // Refresh UI cực kì sạch sẽ
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Lỗi cập nhật sách.");
    }
  };

  // Xử lý Xóa sách
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuốn sách này không?")) return;
    try {
      await axios.delete(`${Server_URL}books/delete/${id}`, { headers: getHeaders() });
      showSuccessToast("Xóa sách thành công!");
      fetchBooks();
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Lỗi khi xóa sách.");
    }
  };

  // Lọc dữ liệu tối ưu bằng useMemo
  const filteredBooks = useMemo(() => {
    const query = search.toLowerCase().trim();
    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.isbn?.includes(query);
      const matchesBranch = branchFilter === "all" || book.branch === branchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [books, search, branchFilter]);

  // Phân trang dữ liệu
  const paginatedBooks = useMemo(() => {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(offset, offset + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);

  // Thống kê nhanh kho sách
  const metrics = useMemo(() => {
    return books.reduce(
      (acc, book) => {
        acc.titles += 1;
        acc.copies += Number(book.totalCopies || 0);
        return acc;
      },
      { titles: 0, copies: 0 }
    );
  }, [books]);

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="admin-page-hero admin-books-hero">
        <div className="admin-page-kicker">Quản lý thư viện</div>
        <h1 className="admin-page-title">Danh mục sách kho</h1>
        <div className="admin-hero-metrics">
          <div><strong>{metrics.titles}</strong><span>Đầu sách</span></div>
          <div><strong>{metrics.copies}</strong><span>Tổng số bản</span></div>
        </div>
      </section>

      <div className="admin-books-toolbar">
        <div className="admin-search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">Tất cả cơ sở</option>
          <option value="dai-la">Cơ sở Đại La</option>
          <option value="cau-giay">Cơ sở Cầu Giấy</option>
        </select>
        <button className="btn admin-btn-primary" onClick={() => navigate("/admin/addbook")}>
          <FiPlus /> Thêm đầu sách
        </button>
      </div>

      <div className="admin-table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Thông tin sách</th>
              <th>Vị trí</th>
              <th>Giá trị cọc</th>
              <th>Số bản</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBooks.length > 0 ? (
              paginatedBooks.map((book) => (
                <tr key={book._id}>
                  <td>
                    <img className="admin-cell-cover" src={book.coverImage || FALLBACK_COVER} alt={book.title} />
                  </td>
                  <td>
                    <div className="admin-cell-title">{book.title}</div>
                    <div className="admin-cell-meta">Tác giả: {book.author} | ISBN: {book.isbn || "N/A"}</div>
                  </td>
                  <td>
                    <span className={`admin-branch-badge ${book.branch || "dai-la"}`}>
                      <FiMapPin /> {BRANCH_LABELS[book.branch] || BRANCH_LABELS["dai-la"]}
                    </span>
                  </td>
                  <td><strong>{formatVND(book.price)}</strong></td>
                  <td><span className="admin-cell-copies">{book.totalCopies || 0} bản</span></td>
                  <td>
                    <div className="admin-cell-actions">
                      <button className="btn btn-icon edit" onClick={() => openEditModal(book)} title="Sửa thông tin"><FiEdit2 /></button>
                      <button className="btn btn-icon delete" onClick={() => handleDelete(book._id)} title="Xóa sách"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Không tìm thấy cuốn sách nào phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination" style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`btn ${currentPage === i + 1 ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => setCurrentPage(i + 1)}
              style={{ padding: "0.4rem 0.8rem", minWidth: "35px" }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal Chỉnh sửa sử dụng React-Hook-Form cực nhẹ */}
      <AnimatePresence>
        {selectedBook && (
          <div className="modal fade show" style={{ display: "block", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <motion.div className="modal-content admin-modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                <div className="modal-header admin-modal-header">
                  <h5 className="modal-title"><FiBookOpen /> Chỉnh sửa thông tin sách</h5>
                  <button type="button" className="btn-close-custom" onClick={() => setSelectedBook(null)}><FiX /></button>
                </div>
                <form onSubmit={handleSubmit(onUpdateSubmit)}>
                  <div className="modal-body admin-modal-body">
                    <div className="admin-edit-book-form">
                      <label>Tên sách
                        <input type="text" {...register("title", { required: true })} />
                      </label>
                      <label>Tác giả
                        <input type="text" {...register("author", { required: true })} />
                      </label>
                      <label>Cơ sở lưu trữ
                        <select {...register("branch")}>
                          <option value="dai-la">Cơ sở Đại La</option>
                          <option value="cau-giay">Cơ sở Cầu Giấy</option>
                        </select>
                      </label>
                      <label className="full-width">Ảnh bìa (URL)
                        <input type="url" {...register("coverImage")} />
                      </label>
                      <label>ISBN
                        <input type="text" {...register("isbn")} />
                      </label>
                      <label>Giá tham khảo
                        <input type="number" {...register("price", { valueAsNumber: true })} />
                      </label>
                      <label>Số bản kho
                        <input type="number" min="1" {...register("totalCopies", { valueAsNumber: true })} />
                      </label>
                      <label className="full-width">Mô tả sách
                        <textarea rows="4" {...register("description")} />
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer admin-modal-footer">
                    <button type="button" className="btn admin-btn-secondary" onClick={() => setSelectedBook(null)}>Hủy</button>
                    <button type="submit" className="btn admin-btn-primary">Lưu thay đổi</button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ViewBooks;