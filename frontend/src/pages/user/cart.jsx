import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { getAuthToken } from "../../utils/auth";
import { useCart } from "../../context/CartContext";
import "./cart.css";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmitRequest = async () => {
    const token = getAuthToken();
    if (!token) {
      showErrorToast("Vui lòng đăng nhập để gửi yêu cầu mượn sách.");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      showErrorToast("Giỏ sách đang trống.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${Server_URL}tickets`,
        { books: cartItems.map((book) => book._id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        showErrorToast(response.data.message);
        return;
      }

      clearCart();
      showSuccessToast(response.data.message || "Yêu cầu mượn đã được gửi.");
      navigate("/user");
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
          <h1>Danh sách sách đang chờ đăng ký mượn</h1>
          <p>
            Gom nhiều đầu sách vào một phiếu mượn, gửi một lần và chờ quản trị viên duyệt.
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
                <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(book._id)}>
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <aside className="cart-panel dfb-card">
            <h2>Tổng kết</h2>
            <p>{cartItems.length} cuốn sách sẽ được gửi trong một phiếu mượn.</p>
            <button
              type="button"
              className="btn-dfb-primary cart-submit-btn"
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu mượn sách"}
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