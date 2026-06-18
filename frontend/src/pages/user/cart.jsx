import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Server_URL } from "../../utils/config";
import { DEFAULT_SHIPPING_FEE, estimateDeposit } from "../../utils/borrowConfig";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { getAuthToken } from "../../utils/auth";
import { useCart } from "../../context/CartContext";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import "./cart.css";

const getBookId = (book) => String(book?._id ?? book?.id ?? "");

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const navigate = useNavigate();

  const receiveMethod = "delivery";
  const selectedBooks = useMemo(
    () => cartItems.filter((book) => selectedBookIds.includes(getBookId(book))),
    [cartItems, selectedBookIds]
  );
  const depositEstimate = estimateDeposit(selectedBooks);
  const shippingFee = selectedBooks.length > 0 ? DEFAULT_SHIPPING_FEE : 0;
  const totalEstimate = depositEstimate + shippingFee;
  const allSelected = cartItems.length > 0 && selectedBookIds.length === cartItems.length;

  useEffect(() => {
    const currentCartIds = new Set(cartItems.map(getBookId));
    setSelectedBookIds((current) => current.filter((id) => currentCartIds.has(id)));
  }, [cartItems]);

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value) + " đ";

  const handleToggleBook = (bookId) => {
    setSelectedBookIds((current) =>
      current.includes(bookId)
        ? current.filter((id) => id !== bookId)
        : [...current, bookId]
    );
  };

  const handleToggleAll = () => {
    setSelectedBookIds(allSelected ? [] : cartItems.map(getBookId));
  };

  const handleSubmitRequest = async () => {
    const token = getAuthToken();
    if (!token) {
      showErrorToast("Vui lòng đăng nhập để gửi yêu cầu mượn sách.");
      navigate("/login");
      return;
    }

    if (selectedBooks.length === 0) {
      showErrorToast("Vui lòng tích chọn ít nhất một cuốn sách.");
      return;
    }

    if (!acceptedPolicy) {
      showErrorToast("Vui lòng xác nhận điều khoản mượn sách trước khi gửi yêu cầu.");
      return;
    }

    if (!shippingAddress.trim()) {
      showErrorToast("Vui lòng nhập địa chỉ giao sách.");
      return;
    }

    if (!shippingPhone.trim()) {
      showErrorToast("Vui lòng nhập số điện thoại người nhận.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${Server_URL}tickets`,
        {
          books: selectedBooks.map((book) => Number(book._id ?? book.id)),
          payment_method: paymentMethod,
          receive_method: receiveMethod,
          shipping_address: shippingAddress.trim(),
          shipping_phone: shippingPhone.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        showErrorToast(response.data.message);
        return;
      }

      selectedBooks.forEach((book) => removeFromCart(book._id ?? book.id));
      setSelectedBookIds([]);
      showSuccessToast(response.data.message || "Đã gửi yêu cầu mượn sách.");

      if (paymentMethod === "vnpay" && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        const ticketId = response.data.ticket?._id || response.data.ticket?.id || "";
        const amount = response.data.amounts?.totalAmount || 0;
        navigate(`/payment-result?status=success&method=cash&ticketId=${ticketId}&amount=${amount}`);
      }
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Không gửi được yêu cầu mượn sách.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="cart-page container-dfb"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="cart-hero">
        <div>
          <p className="cart-eyebrow"><FiShoppingBag /> Giỏ sách mượn</p>
          <h1>Hoàn tất yêu cầu mượn sách</h1>
          <p>
            Chọn sách, nhập thông tin giao nhận và xác nhận yêu cầu trong một quy trình đơn giản.
          </p>
        </div>
        <div className="cart-progress">
          <div className="active"><span>1</span><small>Chọn sách</small></div>
          <i />
          <div className={selectedBooks.length ? "active" : ""}><span>2</span><small>Giao nhận</small></div>
          <i />
          <div className={acceptedPolicy ? "active" : ""}><span>3</span><small>Xác nhận</small></div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty dfb-card">
          <span className="cart-empty-icon"><FiBookOpen /></span>
          <h2>Giỏ sách trống</h2>
          <p>Hãy quay lại trang sách và thêm vài đầu sách bạn muốn mượn.</p>
          <button type="button" className="btn-dfb-primary" onClick={() => navigate("/books")}>Xem sách</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-section-heading">
              <div>
                <span>Bước 1</span>
                <h2>Chọn sách cần mượn</h2>
              </div>
              <label className="cart-select-all">
                <input type="checkbox" checked={allSelected} onChange={handleToggleAll} />
                <span>Chọn tất cả ({selectedBooks.length}/{cartItems.length})</span>
              </label>
            </div>

            {cartItems.map((book) => {
              const bookId = getBookId(book);
              const isSelected = selectedBookIds.includes(bookId);
              const bookPrice = Number(book.price || 0);

              return (
                <article key={bookId} className={`cart-item ${isSelected ? "selected" : ""}`}>
                  <label className="cart-item-select" aria-label={`Chọn ${book.title}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleBook(bookId)}
                    />
                    <span><FiCheck /></span>
                  </label>
                  <img
                    src={book.coverImage || "/assets/library.avif"}
                    alt={book.title}
                    onError={(e) => {
                      e.currentTarget.src = "/assets/library.avif";
                    }}
                  />
                  <div className="cart-item-body">
                    <span className="cart-item-category">{book.categoryId?.name || book.category || "Chưa phân loại"}</span>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <div className="cart-item-meta">
                      <span><FiBookOpen /> Giá tham khảo</span>
                      <strong>{formatCurrency(bookPrice)}</strong>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(book._id ?? book.id)}>
                      <FiTrash2 /> <span>Xóa</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-panel">
            <div className="cart-panel-header">
              <span>Tóm tắt yêu cầu</span>
              <strong>{selectedBooks.length} cuốn</strong>
            </div>
            <div className="cart-form-section">
              <h3><FiTruck /> Thông tin giao nhận</h3>
              <div className="cart-input-wrap"><FiMapPin /><input type="text" placeholder="Địa chỉ nhận sách" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} /></div>
              <div className="cart-input-wrap"><FiPhone /><input type="text" placeholder="Số điện thoại người nhận" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} /></div>
            </div>

            <div className="cart-form-section">
              <h3><FiCreditCard /> Phương thức thanh toán</h3>
              <label className={`cart-option ${paymentMethod === "cash" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
                <span><strong>Tiền mặt</strong><small>Thanh toán khi nhận sách</small></span>
              </label>
              <label className={`cart-option ${paymentMethod === "vnpay" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="vnpay"
                  checked={paymentMethod === "vnpay"}
                  onChange={() => setPaymentMethod("vnpay")}
                />
                <span><strong>VNPAY</strong><small>Thanh toán trực tuyến an toàn</small></span>
              </label>
            </div>

            <div className="cart-summary-box">
              <div className="summary-row">
                <span>Tiền cọc sách</span>
                <strong>{formatCurrency(depositEstimate)}</strong>
              </div>
              <div className="summary-row">
                <span>Phí giao hàng</span>
                <strong>{formatCurrency(shippingFee)}</strong>
              </div>
              <div className="summary-row total">
                <span>Tổng thanh toán</span>
                <strong>{formatCurrency(totalEstimate)}</strong>
              </div>
            </div>
            <div className="cart-policy-box">
              <h3><FiShield /> Chính sách mượn</h3>
              <p>Mượn miễn phí · Cọc hoàn lại · Phí trễ hạn minh bạch</p>
              <label className="cart-policy-check">
                <input
                  type="checkbox"
                  checked={acceptedPolicy}
                  onChange={(e) => setAcceptedPolicy(e.target.checked)}
                />
                Tôi đã đọc và đồng ý với điều khoản mượn sách.
              </label>
            </div>
            <button
              type="button"
              className="btn-dfb-primary cart-submit-selected-btn"
              onClick={handleSubmitRequest}
              disabled={isSubmitting || selectedBooks.length === 0 || !acceptedPolicy}
            >
              {isSubmitting ? "Đang gửi..." : <>Gửi yêu cầu mượn <FiArrowRight /></>}
            </button>
            <button type="button" className="btn-dfb-outline cart-clear-btn" onClick={clearCart}>
              Xóa toàn bộ giỏ
            </button>
          </aside>
        </div>
      )}
    </motion.div>
  );
}
