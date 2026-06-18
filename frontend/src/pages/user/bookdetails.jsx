import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { motion } from "framer-motion";
import { FaTags, FaBarcode, FaInfoCircle } from "react-icons/fa";
import { FiArrowLeft, FiBookOpen, FiCheckCircle, FiClock, FiMapPin, FiShield, FiShoppingBag } from "react-icons/fi";
import { RiBookmarkLine } from "react-icons/ri";
import "./bookdetails.css";
import { showSuccessToast } from "../../utils/toasthelper";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const BRANCH_LABELS = {
  "dai-la": "Cs. Đại La",
  "cau-giay": "Cs. Cầu Giấy",
};

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ totalReviews: 0, averageRating: 0 });
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const categoryLabel = book?.categoryId?.name || book?.category || "Chưa phân loại";

  const handleWishlistToggle = async () => {
    if (!book) return;
    const bookId = book._id || book.id;
    if (isInWishlist(bookId)) {
      await removeFromWishlist(bookId);
    } else {
      const result = await addToWishlist(book);
      if (result.success) {
        showSuccessToast("Đã lưu vào sách yêu thích");
      } else if (result.message) {
        // Optional: show error toast
      }
    }
  };

  useEffect(() => {
    async function fetchBook() {
      try {
        setIsLoading(true);
        const response = await axios.get(`${Server_URL}books/${id}`);
        const payload = response.data?.book || response.data?.data || response.data;

        if (!payload || (!payload._id && !payload.id && !payload.title)) {
          setBook(null);
          setError("Không tìm thấy thông tin sách.");
          return;
        }

        setBook(payload);
        setError(null);
      } catch (error) {
        console.error("Không tải được thông tin sách:", error);
        setError("Không tải được thông tin sách. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    axios.get(`${Server_URL}books/${id}/reviews`)
      .then(res => { if (res.data.success) setReviews(res.data.reviews || []); })
      .catch(() => {});
    axios.get(`${Server_URL}books/${id}/review-summary`)
      .then(res => { if (res.data.success) setReviewSummary(res.data.summary); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  if (isLoading) return (
    <div className="book-details-loading">
      <motion.div
        className="book-details-spinner"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p>Đang tải thông tin sách...</p>
    </div>
  );

  if (error) return (
    <motion.div
      className="book-details-error"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {error}
    </motion.div>
  );

  if (!book) return (
    <div className="book-details-empty">
      <RiBookmarkLine className="not-found-icon" />
      <h2>Không tìm thấy sách</h2>
      <p>Sách bạn tìm không tồn tại hoặc đã được gỡ khỏi thư viện.</p>
      <Link to="/books" className="btn-dfb-primary">Quay lại kho sách</Link>
    </div>
  );

  const isUnavailable = book.availableCopies !== undefined && book.availableCopies <= 0;

  return (
    <motion.div
      className="book-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="container-dfb">
        <div className="book-details-breadcrumb">
          <Link to="/books"><FiArrowLeft /> Quay lại kho sách</Link>
        </div>

        <div className="book-details-shell">
          <motion.div
            className="book-cover-panel"
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="book-cover-glow"></div>
            <img
              src={book.coverImage || "/assets/library.avif"}
              alt={book.title}
              className="book-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/library.avif";
              }}
            />
            {book.availableCopies !== undefined && (
              <div className={`availability-badge ${book.availableCopies > 0 ? "available" : "unavailable"}`}>
                {book.availableCopies > 0 ? `Còn ${book.availableCopies} cuốn` : "Hết sách"}
              </div>
            )}
          </motion.div>

          <div className="book-info-panel dfb-card">
            <div className="book-header">
              <div className="book-detail-topline">
                <span className="book-detail-kicker">Chi tiết sách</span>
                <button 
                  className="wishlist-icon-btn"
                  onClick={handleWishlistToggle}
                  title={isInWishlist(book._id || book.id) ? "Bỏ lưu" : "Lưu yêu thích"}
                >
                  {isInWishlist(book._id || book.id) ? <FaHeart color="#e74c3c" /> : <FaRegHeart color="#7f8c8d" />}
                </button>
              </div>
              <h1 className="book-title">{book.title}</h1>
              <p className="book-author">Tác giả: {book.author}</p>
            </div>

            <div className="book-meta-grid">
              <div className="meta-item">
                <FaTags className="meta-icon" />
                <div>
                  <span className="meta-label">Danh mục</span>
                  <span className="meta-value">{categoryLabel}</span>
                </div>
              </div>
              <div className="meta-item">
                <FaBarcode className="meta-icon" />
                <div>
                  <span className="meta-label">ISBN</span>
                  <span className="meta-value">{book.isbn || "Chưa cập nhật"}</span>
                </div>
              </div>
              <div className="meta-item">
                <FiMapPin className="meta-icon" />
                <div>
                  <span className="meta-label">Chi nhánh</span>
                  <span className="meta-value">{BRANCH_LABELS[book.branch] || "Cs. Đại La"}</span>
                </div>
              </div>
              <div className="meta-item">
                <FiBookOpen className="meta-icon" />
                <div>
                  <span className="meta-label">Số bản còn</span>
                  <span className="meta-value">{book.availableCopies ?? "Đang cập nhật"}</span>
                </div>
              </div>
            </div>

            <div className="book-description">
              <h3>
                <FaInfoCircle className="description-icon" />
                Mô tả
              </h3>
              <p>{book.description || "Chưa có mô tả cho cuốn sách này."}</p>
            </div>

            <div className="book-trust-row">
              <div><FiShield /> Đặt cọc hoàn lại</div>
              <div><FiClock /> Theo dõi hạn trả</div>
              <div><FiCheckCircle /> Mượn sách minh bạch</div>
            </div>

            <div className="action-buttons">
              <motion.button
                className={`issue-button ${isUnavailable ? "disabled" : ""}`}
                onClick={() => {
                  addToCart(book);
                  showSuccessToast("Đã thêm vào giỏ sách mượn.");
                }}
                whileHover={{ scale: isUnavailable ? 1 : 1.03 }}
                whileTap={{ scale: isUnavailable ? 1 : 0.97 }}
                disabled={isUnavailable || isInCart(book._id)}
              >
                <FiShoppingBag className="button-icon" />
                {isUnavailable ? "Hết sách" : isInCart(book._id) ? "Đã trong giỏ" : "Thêm vào giỏ sách mượn"}
              </motion.button>
              <Link to="/cart" className="wishlist-button">
                Xem giỏ sách
              </Link>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="bdr-section">
          <div className="bdr-header">
            <h3 className="bdr-title">⭐ Đánh giá &amp; Nhận xét</h3>
            {reviewSummary.totalReviews > 0 && (
              <div className="bdr-summary-badge">
                <span className="bdr-avg-score">{reviewSummary.averageRating}</span>
                <span className="bdr-stars-fill">★★★★★</span>
                <span className="bdr-count">({reviewSummary.totalReviews} lượt đánh giá)</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bdr-empty">
              <span className="bdr-empty-icon">💬</span>
              <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            <div className="bdr-list">
              {reviews.map((r) => (
                <div key={r.id} className="bdr-card">
                  <div className="bdr-card-top">
                    <div className="bdr-user-info">
                      <div className="bdr-avatar">
                        {r.user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="bdr-user-name">{r.user_name}</div>
                        <div className="bdr-user-date">
                          {new Date(r.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="bdr-rating-stars">
                      {'★'.repeat(r.rating)}
                      <span className="bdr-empty-stars">{'★'.repeat(5 - r.rating)}</span>
                    </div>
                  </div>
                  
                  {/* Hiển thị bình luận của người dùng (Đã sửa lại biến thành r.comment) */}
                  {r.comment && (
                    <p className="bdr-comment user-comment">{r.comment}</p>
                  )}

                  {/* THÊM ĐOẠN ADMIN PHẢN HỒI VÀO ĐÂY (Đã sửa review thành r) */}
                  {r.admin_reply && (
                      <div className="admin-reply-box">
                          <strong>Phản hồi từ D Free Book</strong>
                          <p>{r.admin_reply}</p>
                      </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default BookDetails;
