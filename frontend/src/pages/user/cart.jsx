import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Server_URL } from "../../utils/config";
import { DEFAULT_SHIPPING_FEE, estimateDeposit } from "../../utils/borrowConfig";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { getAuthToken } from "../../utils/auth";
import { useCart } from "../../context/CartContext";
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
          <p className="cart-eyebrow">Giỏ sách mượn</p>
          <h1>Chọn sách muốn mượn</h1>
          <p>
            Tích một hoặc nhiều cuốn sách trong giỏ, hệ thống sẽ tạo một phiếu mượn cho các cuốn đã chọn.
          </p>
        </div>
        <div className="cart-summary">
          <span>{selectedBooks.length}</span>
          <small>cuốn đã chọn</small>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty dfb-card">
          <h2>Giỏ sách trống</h2>
          <p>Hãy quay lại trang sách và thêm vài đầu sách bạn muốn mượn.</p>
          <button type="button" className="btn-dfb-primary" onClick={() => navigate("/books")}>Xem sách</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-select-bar dfb-card">
              <label className="cart-select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                />
                Chọn tất cả
              </label>
              <span>{selectedBooks.length}/{cartItems.length} cuốn đã chọn</span>
            </div>

            {cartItems.map((book) => {
              const bookId = getBookId(book);
              const isSelected = selectedBookIds.includes(bookId);
              const bookPrice = Number(book.price || 0);

              return (
                <div key={bookId} className={`cart-item dfb-card ${isSelected ? "selected" : ""}`}>
                  <label className="cart-item-select" aria-label={`Chọn ${book.title}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleBook(bookId)}
                    />
                  </label>
                  <img
                    src={book.coverImage || "/assets/library.avif"}
                    alt={book.title}
                    onError={(e) => {
                      e.currentTarget.src = "/assets/library.avif";
                    }}
                  />
                  <div className="cart-item-body">
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <span>{book.categoryId?.name || book.category || "Chưa phân loại"}</span>
                    <strong className="cart-item-price">{formatCurrency(bookPrice)}</strong>
                  </div>
                  <div className="cart-item-actions">
                    <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(book._id ?? book.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="cart-panel dfb-card">
            <h2>Tổng kết</h2>
            <p>{selectedBooks.length} cuốn sách đã chọn để gửi yêu cầu.</p>
            <div className="cart-form-section">
              <h3>Hình thức nhận sách</h3>
              <p className="cart-delivery-note">Giao tận nơi</p>
              <input
                type="text"
                className="cart-input"
                placeholder="Địa chỉ nhận sách"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
              <input
                type="text"
                className="cart-input mt-2"
                placeholder="Số điện thoại nhận sách"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                style={{ marginTop: "10px" }}
              />
            </div>

            <div className="cart-form-section">
              <h3>Phương thức thanh toán</h3>
              <label className="cart-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
                Tiền mặt khi nhận sách
              </label>
              <label className="cart-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="vnpay"
                  checked={paymentMethod === "vnpay"}
                  onChange={() => setPaymentMethod("vnpay")}
                />
                VNPAY online
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
                <span>Tiền cọc + phí ship</span>
                <strong>{formatCurrency(totalEstimate)}</strong>
              </div>
            </div>
            <div className="cart-policy-box">
              <h3>Điều khoản mượn</h3>
              <ul>
                <li>Mượn sách miễn phí.</li>
                <li>Đặt cọc hoàn lại khi trả đúng quy định.</li>
                <li>Phí trễ hạn áp dụng theo chính sách đã công bố.</li>
                <li>Quyên góp hoặc hội viên hỗ trợ là tùy chọn.</li>
              </ul>
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
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu sách đã chọn"}
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
