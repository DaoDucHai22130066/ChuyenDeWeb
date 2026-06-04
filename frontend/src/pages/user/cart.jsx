import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Server_URL } from "../../utils/config";
import { DEFAULT_SHIPPING_FEE, estimateDeposit } from "../../utils/borrowConfig";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { getAuthToken } from "../../utils/auth";
import { useCart } from "../../context/CartContext";
import "./cart.css";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingBookId, setSendingBookId] = useState(null);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [receiveMethod, setReceiveMethod] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const navigate = useNavigate();

  const depositEstimate = estimateDeposit(cartItems);
  const shippingFee = receiveMethod === "delivery" ? DEFAULT_SHIPPING_FEE * cartItems.length : 0;
  const totalEstimate = depositEstimate + shippingFee;

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value) + " đ";

  const handleSubmitRequest = async (book) => {
    const token = getAuthToken();
    if (!token) {
      showErrorToast("Vui lòng đăng nhập để gửi yêu cầu mượn sách.");
      navigate("/login");
      return;
    }

    if (!book) {
      showErrorToast("Giỏ sách đang trống.");
      return;
    }

    if (!acceptedPolicy) {
      showErrorToast("Vui lòng xác nhận điều khoản mượn sách trước khi gửi yêu cầu.");
      return;
    }

    if (receiveMethod === "delivery" && !shippingAddress.trim()) {
      showErrorToast("Vui lòng nhập địa chỉ giao sách.");
      return;
    }

    if (receiveMethod === "delivery" && !shippingPhone.trim()) {
      showErrorToast("Vui lòng nhập số điện thoại người nhận.");
      return;
    }

    try {
      setSendingBookId(book._id);
      setIsSubmitting(true);
      const response = await axios.post(
        `${Server_URL}tickets`,
        {
          books: [book._id],
          payment_method: paymentMethod,
          receive_method: receiveMethod,
          shipping_address: receiveMethod === "delivery" ? shippingAddress.trim() : null,
          shipping_phone: receiveMethod === "delivery" ? shippingPhone.trim() : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        showErrorToast(response.data.message);
        return;
      }

      removeFromCart(book._id);
      showSuccessToast(response.data.message || `Đã gửi yêu cầu cho "${book.title}".`);

      if (paymentMethod === "vnpay" && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        const ticketId = response.data.ticket?.id || "";
        const amount = response.data.amounts?.totalAmount || 0;
        navigate(`/payment-result?status=success&method=cash&ticketId=${ticketId}&amount=${amount}`);
      }
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Không gửi được yêu cầu mượn sách.");
    } finally {
      setIsSubmitting(false);
      setSendingBookId(null);
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
          <h1>Gửi yêu cầu riêng cho từng cuốn sách</h1>
          <p>
            Mỗi cuốn sách được gửi thành một yêu cầu riêng để tránh nhầm lẫn khi quản trị viên duyệt.
          </p>
        </div>
        <div className="cart-summary">
          <span>{cartItems.length}</span>
          <small>cuốn trong giỏ</small>
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
            {cartItems.map((book) => (
              <div key={book._id} className="cart-item dfb-card">
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
                </div>
                <div className="cart-item-actions">
                  <button
                    type="button"
                    className="btn-dfb-primary cart-send-btn"
                    onClick={() => handleSubmitRequest(book)}
                    disabled={isSubmitting || sendingBookId === book._id || !acceptedPolicy}
                  >
                    {sendingBookId === book._id ? "Đang gửi..." : "Gửi yêu cầu cuốn này"}
                  </button>
                  <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(book._id)}>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-panel dfb-card">
            <h2>Tổng kết</h2>
            <p>{cartItems.length} cuốn sách đang chờ gửi theo từng yêu cầu riêng.</p>
            <div className="cart-form-section">
              <h3>Hình thức nhận sách</h3>
              <label className="cart-option">
                <input
                  type="radio"
                  name="receiveMethod"
                  value="delivery"
                  checked={receiveMethod === "delivery"}
                  onChange={() => setReceiveMethod("delivery")}
                />
                Giao tận nơi
              </label>
              {receiveMethod === "delivery" && (
                <>
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
                    style={{ marginTop: '10px' }}
                  />
                </>
              )}
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
                <span>Tiền cọc dự kiến</span>
                <strong>{formatCurrency(depositEstimate)}</strong>
              </div>
              <div className="summary-row">
                <span>Phí giao hàng</span>
                <strong>{formatCurrency(shippingFee)}</strong>
              </div>
              <div className="summary-row total">
                <span>Tạm tính</span>
                <strong>{formatCurrency(totalEstimate)}</strong>
              </div>
              <small>Lưu ý: mỗi cuốn sách sẽ tạo một phiếu mượn riêng.</small>
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
            <p className="cart-panel-note">
              Bạn sẽ gửi từng cuốn riêng lẻ để tránh nhầm lẫn khi quản trị viên duyệt.
            </p>
            <button type="button" className="btn-dfb-outline cart-clear-btn" onClick={clearCart}>
              Xóa toàn bộ giỏ
            </button>
          </aside>
        </div>
      )}
    </motion.div>
  );
}