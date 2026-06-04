import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./paymentresult.css";

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [statusInfo, setStatusInfo] = useState({
    isSuccess: false,
    title: "",
    message: "",
    type: "info",
    ticketId: "",
    amount: 0,
    method: ""
  });

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value) + " đ";

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get("status");
    const method = query.get("method");
    const rspCode = query.get("vnp_ResponseCode");
    const ticketId = query.get("ticketId") || "";
    const amount = Number(query.get("amount") || 0);

    let isSuccess = false;
    let title = "Đang xử lý...";
    let message = "Vui lòng chờ trong giây lát.";
    let type = "info";

    if (status === "success" || rspCode === "00") {
      isSuccess = true;
      type = "success";
      title = "Giao dịch thành công!";
      if (method === "cash") {
        message = "Bạn đã gửi yêu cầu mượn sách thành công. Vui lòng chờ thư viện phê duyệt nhé!";
      } else {
        message = "Bạn đã thanh toán online thành công qua VNPAY. Đơn mượn của bạn đang được xử lý.";
      }
    } else if (status === "failed" || (rspCode && rspCode !== "00")) {
      isSuccess = false;
      type = "error";
      title = "Giao dịch thất bại";
      message = "Quá trình thanh toán đã bị hủy hoặc xảy ra lỗi. Vui lòng thử lại sau.";
    }

    setStatusInfo({ isSuccess, title, message, type, ticketId, amount, method });
  }, [location]);

  return (
    <motion.div
      className="payment-result-container container-dfb"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className={`result-card ${statusInfo.type}`}>
        <div className="result-icon">
          {statusInfo.type === "success" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          {statusInfo.type === "error" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          {statusInfo.type === "info" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
            </svg>
          )}
        </div>
        
        <h2>{statusInfo.title}</h2>
        <p>{statusInfo.message}</p>
        
        {statusInfo.isSuccess && (statusInfo.ticketId || statusInfo.amount > 0) && (
          <div className="transaction-details">
            <div className="detail-row">
              <span>Mã phiếu mượn</span>
              <strong>{statusInfo.ticketId ? `BT${statusInfo.ticketId}` : '---'}</strong>
            </div>
            <div className="detail-row">
              <span>Hình thức thanh toán</span>
              <strong style={{ textTransform: "uppercase" }}>{statusInfo.method === 'cash' ? 'Tiền mặt' : 'VNPAY'}</strong>
            </div>
            <div className="detail-row total-row">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(statusInfo.amount)}</strong>
            </div>
          </div>
        )}
        
        <div className="result-actions">
          <button 
            className="btn-dfb-primary"
            onClick={() => navigate('/user')}
          >
            Về trang cá nhân
          </button>
          <button 
            className="btn-dfb-outline"
            onClick={() => navigate('/cart')}
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    </motion.div>
  );
}
