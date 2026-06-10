import { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import "./profile.css";
import { getAuthToken } from "../../utils/auth";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import {
  FiUser,
  FiMail,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiEdit2,
  FiSave,
  FiX,
  FiCalendar,
  FiBook,
  FiActivity,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
  FiMapPin,
  FiTruck
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";

const STATUS_VI = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Returned: "Đã trả",
  Rejected: "Từ chối",
  pending: "Chờ duyệt",
  awaiting_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  approved: "Đã duyệt",
  dispatched: "Đang giao",
  delivered: "Đã giao",
  returned: "Đã trả",
  closed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const normalizeTicketStatus = (status) => String(status || "").trim().toLowerCase();
const canCancelTicketStatus = (status) => ["pending", "awaiting_payment"].includes(normalizeTicketStatus(status));
const formatCurrency = (value) => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const DEPOSIT_STATUS_VI = {
  none: "Không có",
  pending: "Chờ xác nhận",
  held: "Đã giữ cọc",
  refunded: "Đã hoàn cọc",
  forfeited: "Đã trừ cọc",
};

const SHIPPING_STATUS_VI = {
  none: "Không giao hàng",
  pending: "Chờ giao",
  dispatched: "Đang giao",
  delivered: "Đã giao",
  returned: "Đã trả",
};

const TRANSACTION_TYPE_VI = {
  deposit: "Tiền cọc",
  shipping: "Phí ship",
  fine: "Phí phạt",
  volunteer_stipend: "Hỗ trợ tình nguyện",
};

const TRANSACTION_STATUS_VI = {
  pending: "Chờ xử lý",
  completed: "Hoàn tất",
  failed: "Thất bại",
  refunded: "Đã hoàn",
};

const PAYMENT_METHOD_VI = {
  cash: "Tiền mặt",
  vnpay: "VNPay",
};

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", stream: "", year: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [cancelingTicketId, setCancelingTicketId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [ticketTransactions, setTicketTransactions] = useState({});
  const [loadingTransactionId, setLoadingTransactionId] = useState(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null); // { ticket, book }
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedKeys, setReviewedKeys] = useState(new Set()); // "ticketId-bookId"
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  async function fetchProfile() {
    try {
      const response = await axios.get(`${Server_URL}users/profile`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUser(response.data.user);
    } catch {
      showErrorToast("Không tải được hồ sơ.");
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${Server_URL}tickets/me`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setTickets(response.data.tickets || []);
    } catch {
      showErrorToast("Không tải được phiếu mượn.");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        stream: user.stream || "",
        year: user.year || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showErrorToast("Họ và tên không được để trống.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.put(`${Server_URL}users/profile`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUser(response.data.user);
      setIsEditing(false);
      showSuccessToast("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  };

  const openReviewModal = (ticket, book) => {
    setReviewModal({ ticket, book });
    setReviewRating(5);
    setReviewComment("");
    setHoverRating(0);
  };

  const closeReviewModal = () => {
    setReviewModal(null);
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setIsSubmittingReview(true);
    try {
      await axios.post(`${Server_URL}reviews`, {
        bookId: reviewModal.book._id || reviewModal.book.id,
        ticketId: reviewModal.ticket._id,
        rating: reviewRating,
        comment: reviewComment,
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      showSuccessToast("Cảm ơn bạn đã đánh giá!");
      setReviewedKeys(prev => new Set([...prev, `${reviewModal.ticket._id}-${reviewModal.book._id || reviewModal.book.id}`]));
      closeReviewModal();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Không thể gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRenewTicket = async (ticketId) => {
    try {
      const response = await axios.post(`${Server_URL}tickets/${ticketId}/renew`, {}, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      showSuccessToast("Gia hạn thành công! Hạn trả mới: " + new Date(response.data.newDueDate).toLocaleDateString("vi-VN"));
      setTickets(tickets.map(t => {
        if (t._id === ticketId) {
          return { ...t, dueDate: response.data.newDueDate, renewCount: response.data.renewCount };
        }
        return t;
      }));
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Không thể gia hạn phiếu.");
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm("Bạn có chắc muốn hủy phiếu mượn này?")) return;

    setCancelingTicketId(ticketId);
    try {
      const response = await axios.post(`${Server_URL}tickets/${ticketId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      showSuccessToast("Đã hủy phiếu mượn thành công.");
      setTickets(tickets.map((ticket) => (
        ticket._id === ticketId ? { ...ticket, ...response.data.ticket } : ticket
      )));
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Không thể hủy phiếu mượn.");
    } finally {
      setCancelingTicketId(null);
    }
  };

  const openTicketDetail = async (ticket) => {
    setDetailTicket(ticket);
    if (ticketTransactions[ticket._id]) return;

    setLoadingTransactionId(ticket._id);
    try {
      const response = await axios.get(`${Server_URL}tickets/${ticket._id}/transactions`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setTicketTransactions((current) => ({
        ...current,
        [ticket._id]: response.data.transactions || [],
      }));
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Không thể tải lịch sử giao dịch.");
    } finally {
      setLoadingTransactionId(null);
    }
  };

  const closeTicketDetail = () => {
    setDetailTicket(null);
  };

  if (!user) return <div className="loading-container"><div className="spinner"></div><p>Đang tải hồ sơ...</p></div>;

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Compute statistics
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => ["pending", "awaiting_payment"].includes(normalizeTicketStatus(t.status))).length;
  const approvedTickets = tickets.filter(t => ["approved", "dispatched", "delivered"].includes(normalizeTicketStatus(t.status))).length;
  const returnedTickets = tickets.filter(t => ["returned", "closed"].includes(normalizeTicketStatus(t.status))).length;
  const detailTransactions = detailTicket ? ticketTransactions[detailTicket._id] || [] : [];

  return (
    <div className="profile-page">
      <div className="profile-hero-banner">
        <div className="banner-overlay"></div>
        <div className="profile-hero-copy">
          <span>Hồ sơ độc giả</span>
          <h1>Quản lý thông tin và lịch sử mượn sách</h1>
        </div>
      </div>

      <div className="profile-container">
        {/* Left Side: Summary & Quick Stats */}
        <div className="profile-sidebar">
          <div className="profile-card summary-card">
            <div className="avatar-container">
              <div className="profile-avatar">
                {getInitials(user.name)}
              </div>
              <span className={`role-badge ${user.role}`}>
                {user.role === "admin" ? "Thủ thư" : "Độc giả"}
              </span>
            </div>

            <h2 className="user-display-name">{user.name}</h2>
            <p className="user-display-email">{user.email}</p>

            <div className="profile-meta-list">
              <div className="meta-item">
                <FiCalendar className="meta-icon" />
                <span>Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
              {user.stream && (
                <div className="meta-item">
                  <FaGraduationCap className="meta-icon" />
                  <span>Ngành: {user.stream}</span>
                </div>
              )}
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <FiEdit2 /> Chỉnh sửa hồ sơ
                </button>
              ) : (
                <button className="btn-cancel" onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name || "",
                    stream: user.stream || "",
                    year: user.year || "",
                  });
                }}>
                  <FiX /> Hủy chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="profile-card stats-card">
            <h3>Thống kê hoạt động</h3>
            <div className="stats-grid">
              <div className="stat-item total">
                <div className="stat-icon-wrapper">
                  <FiBookOpen />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{totalTickets}</span>
                  <span className="stat-label">Tổng mượn</span>
                </div>
              </div>
              <div className="stat-item pending">
                <div className="stat-icon-wrapper">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{pendingTickets}</span>
                  <span className="stat-label">Chờ duyệt</span>
                </div>
              </div>
              <div className="stat-item active">
                <div className="stat-icon-wrapper">
                  <FiActivity />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{approvedTickets}</span>
                  <span className="stat-label">Đang mượn</span>
                </div>
              </div>
              <div className="stat-item completed">
                <div className="stat-icon-wrapper">
                  <FiCheckCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{returnedTickets}</span>
                  <span className="stat-label">Đã trả</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Form & Borrow Tickets */}
        <div className="profile-main-content">
          {/* Details & Edit Form */}
          <div className="profile-card details-card">
            <h3>Thông tin tài khoản</h3>
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label><FiUser className="input-icon" /> Họ và tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Nhập họ và tên"
                    className={isEditing ? "editable" : ""}
                  />
                </div>

                <div className="form-group">
                  <label><FiMail className="input-icon" /> Địa chỉ Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="disabled-field"
                  />
                </div>

                <div className="form-group">
                  <label><FaGraduationCap className="input-icon" /> Ngành học / Đơn vị</label>
                  <input
                    type="text"
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Ví dụ: Công nghệ thông tin" : "Chưa cập nhật"}
                    className={isEditing ? "editable" : ""}
                  />
                </div>

                <div className="form-group">
                  <label><FiCalendar className="input-icon" /> Năm học (Khóa)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Ví dụ: 3" : "Chưa cập nhật"}
                    className={isEditing ? "editable" : ""}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="form-submit-actions">
                  <button type="submit" className="btn-save" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <span className="mini-spinner"></span> Đang lưu...
                      </>
                    ) : (
                      <>
                        <FiSave /> Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Borrow Tickets List */}
          <div className="profile-card tickets-card">
            <div className="card-header-flex">
              <h3>Lịch sử mượn sách</h3>
              <span className="tickets-count">Tổng số: {tickets.length} phiếu</span>
            </div>

            {tickets.length === 0 ? (
              <div className="empty-tickets">
                <FiBook className="empty-icon" />
                <p>Bạn chưa thực hiện phiếu mượn sách nào.</p>
              </div>
            ) : (
              <div className="ticket-card-list">
                {tickets.map((ticket) => {
                  const status = normalizeTicketStatus(ticket.status);
                  const canCancel = canCancelTicketStatus(ticket.status);
                  const canRenew = ["approved", "dispatched", "delivered"].includes(status) &&
                    !ticket.returnDate &&
                    ticket.dueDate &&
                    new Date(ticket.dueDate) >= new Date() &&
                    (ticket.renewCount || 0) < 1;
                  const canReview = ["returned", "closed"].includes(status);

                  return (
                    <article key={ticket._id} className={`profile-ticket-card ${status}`}>
                      <div className="profile-ticket-top">
                        <div>
                          <span className="ticket-id-label">Mã phiếu</span>
                          <strong>#{ticket._id.toString().slice(-6).toUpperCase()}</strong>
                        </div>
                        <span className={`status-badge ${status}`}>
                          {STATUS_VI[ticket.status] || STATUS_VI[status] || ticket.status}
                        </span>
                      </div>

                      <div className="ticket-date-grid">
                        <div>
                          <span>Ngày mượn</span>
                          <strong>{ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</strong>
                        </div>
                        <div>
                          <span>Hạn trả</span>
                          <strong>{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString("vi-VN") : "—"}</strong>
                        </div>
                        <div>
                          <span>Số sách</span>
                          <strong>{ticket.books?.length || 0} cuốn</strong>
                        </div>
                      </div>

                      <div className="ticket-book-chips">
                        {(ticket.books || []).map((book) => (
                          <span key={book._id || book.id || book.title}>{book.title}</span>
                        ))}
                      </div>

                      <div className="profile-ticket-actions">
                        <button
                          className="btn-ticket-detail"
                          onClick={() => openTicketDetail(ticket)}
                          title="Xem chi tiết phiếu mượn"
                        >
                          <FiInfo /> Chi tiết
                        </button>

                        {canReview && (
                          <div className="review-action-cell">
                            {ticket.books.map((book) => {
                              const key = `${ticket._id}-${book._id || book.id}`;
                              const alreadyReviewed = reviewedKeys.has(key);
                              return (
                                <button
                                  key={key}
                                  className={`btn-review ${alreadyReviewed ? 'reviewed' : ''}`}
                                  onClick={() => !alreadyReviewed && openReviewModal(ticket, book)}
                                  disabled={alreadyReviewed}
                                  title={alreadyReviewed ? 'Đã đánh giá' : `Đánh giá: ${book.title}`}
                                >
                                  {alreadyReviewed ? '✓ Đã đánh giá' : `⭐ ${book.title.substring(0, 18)}${book.title.length > 18 ? '...' : ''}`}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {canCancel && (
                          <button
                            className="btn-ticket-cancel"
                            onClick={() => handleCancelTicket(ticket._id)}
                            disabled={cancelingTicketId === ticket._id}
                            title="Hủy phiếu đang chờ xử lý"
                          >
                            <FiX /> {cancelingTicketId === ticket._id ? "Đang hủy..." : "Hủy phiếu"}
                          </button>
                        )}

                        {canRenew && (
                          <button
                            className="btn-renew"
                            onClick={() => handleRenewTicket(ticket._id)}
                            title="Gia hạn thêm 7 ngày"
                          >
                            <FiClock /> Gia hạn
                          </button>
                        )}

                        {!canReview && !canCancel && !canRenew && (
                          <span className="no-review-dash">Không có thao tác</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailTicket && (
        <div className="ticket-detail-overlay">
          <div className="ticket-detail-modal">
            <div className="ticket-detail-header">
              <div>
                <span>Chi tiết phiếu mượn</span>
                <h3>#{detailTicket._id.toString().slice(-6).toUpperCase()}</h3>
              </div>
              <button type="button" className="ticket-detail-close" onClick={closeTicketDetail} title="Đóng">
                <FiX />
              </button>
            </div>

            <div className="ticket-detail-status-row">
              <span className={`status-badge ${normalizeTicketStatus(detailTicket.status)}`}>
                {STATUS_VI[detailTicket.status] || STATUS_VI[normalizeTicketStatus(detailTicket.status)] || detailTicket.status}
              </span>
              <span>{PAYMENT_METHOD_VI[detailTicket.paymentMethod] || detailTicket.paymentMethod || "Chưa cập nhật"}</span>
            </div>

            <div className="ticket-detail-grid">
              <div className="ticket-detail-box">
                <FiDollarSign />
                <span>Tiền cọc</span>
                <strong>{formatCurrency(detailTicket.depositAmount)}</strong>
              </div>
              <div className="ticket-detail-box">
                <FiTruck />
                <span>Phí ship</span>
                <strong>{formatCurrency(detailTicket.shippingFee)}</strong>
              </div>
              <div className="ticket-detail-box">
                <FiCreditCard />
                <span>Trạng thái cọc</span>
                <strong>{DEPOSIT_STATUS_VI[detailTicket.depositStatus] || detailTicket.depositStatus || "Chưa cập nhật"}</strong>
              </div>
              <div className="ticket-detail-box">
                <FiTruck />
                <span>Giao hàng</span>
                <strong>{SHIPPING_STATUS_VI[detailTicket.shippingStatus] || detailTicket.shippingStatus || "Chưa cập nhật"}</strong>
              </div>
            </div>

            <div className="ticket-detail-section">
              <h4><FiMapPin /> Địa chỉ nhận</h4>
              <p>{detailTicket.shippingAddress || "Không có địa chỉ giao hàng"}</p>
              {detailTicket.shippingPhone && <small>SĐT nhận hàng: {detailTicket.shippingPhone}</small>}
            </div>

            <div className="ticket-detail-section">
              <h4><FiBook /> Sách trong phiếu</h4>
              <div className="ticket-detail-books">
                {(detailTicket.books || []).map((book) => (
                  <div key={book._id || book.id || book.title}>
                    <strong>{book.title}</strong>
                    {book.author && <span>{book.author}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="ticket-detail-section">
              <h4><FiCreditCard /> Lịch sử giao dịch</h4>
              {loadingTransactionId === detailTicket._id ? (
                <p className="ticket-detail-muted">Đang tải giao dịch...</p>
              ) : detailTransactions.length > 0 ? (
                <div className="ticket-transaction-list">
                  {detailTransactions.map((transaction) => (
                    <div key={transaction._id} className="ticket-transaction-item">
                      <div>
                        <strong>{TRANSACTION_TYPE_VI[transaction.type] || transaction.type}</strong>
                        <span>
                          {PAYMENT_METHOD_VI[transaction.method] || transaction.method}
                          {transaction.createdAt ? ` • ${new Date(transaction.createdAt).toLocaleString("vi-VN")}` : ""}
                        </span>
                      </div>
                      <div className="transaction-value">
                        <strong>{formatCurrency(transaction.amount)}</strong>
                        <span className={`txn-status ${transaction.status}`}>
                          {TRANSACTION_STATUS_VI[transaction.status] || transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ticket-detail-muted">Chưa có giao dịch.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal-box">
            <div className="review-modal-header">
              <h3>⭐ Đánh giá sách</h3>
              <button className="review-modal-close" onClick={closeReviewModal} title="Đóng">✕</button>
            </div>

            <div className="review-modal-book-title">
              📖 {reviewModal.book.title}
            </div>

            {/* Star Rating */}
            <span className="review-stars-label">Chọn số sao:</span>
            <div className="review-stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${(hoverRating || reviewRating) >= star ? 'filled' : 'empty'}`}
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="review-rating-label">
              {['', '⭐ Rất tệ', '⭐⭐ Tệ', '⭐⭐⭐ Bình thường', '⭐⭐⭐⭐ Tốt', '⭐⭐⭐⭐⭐ Tuyệt vời'][reviewRating]}
            </p>

            {/* Comment */}
            <span className="review-comment-label">Nhận xét (tuỳ chọn):</span>
            <textarea
              className="review-comment-textarea"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
              rows={4}
            />

            {/* Actions */}
            <div className="review-modal-actions">
              <button className="btn-review-cancel" onClick={closeReviewModal}>Hủy</button>
              <button className="btn-review-submit" onClick={submitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
