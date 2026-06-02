import { useForm } from "react-hook-form";
import axios from "axios";
import { Server_URL } from "../../../utils/config";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiMail, FiSend, FiShield } from "react-icons/fi";
import { showErrorToast, showSuccessToast } from "../../../utils/toasthelper";
import "../../../styles/components.css";
import "./ForgotPassword.css";

function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await axios.post(`${Server_URL}users/forgot-password`, data);
      showSuccessToast("Mã xác thực đã được gửi đến email của bạn.");
      navigate("/verifyotp", { state: { email: data.email } });
    } catch {
      showErrorToast("Không gửi được mã xác thực. Vui lòng kiểm tra email và thử lại.");
    }
  };

  return (
    <motion.div
      className="forgot-password-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      <div className="forgot-password-shell">
        <motion.section
          className="forgot-password-info-panel"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Link to="/login" className="forgot-password-back-link">
            <FiArrowLeft /> Quay lại đăng nhập
          </Link>

          <div className="forgot-password-brand">
            <span className="forgot-password-brand-icon">📚</span>
            <span>D Free Book</span>
          </div>

          <h1>Lấy lại quyền truy cập tài khoản</h1>
          <p>
            Nhập email đã đăng ký, hệ thống sẽ gửi mã xác thực để bạn đặt lại mật khẩu một cách an toàn.
          </p>

          <div className="forgot-password-steps" aria-label="Quy trình khôi phục mật khẩu">
            <div className="forgot-password-step active">
              <span>1</span>
              <p>Nhập email</p>
            </div>
            <div className="forgot-password-step">
              <span>2</span>
              <p>Xác thực OTP</p>
            </div>
            <div className="forgot-password-step">
              <span>3</span>
              <p>Đặt mật khẩu mới</p>
            </div>
          </div>
        </motion.section>

        <motion.div
          className="forgot-password-card dfb-card"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="forgot-password-card-icon">
            <FiShield />
          </div>

          <p className="forgot-password-kicker">Khôi phục mật khẩu</p>
          <h2 className="forgot-password-title">Quên mật khẩu?</h2>
          <p className="forgot-password-subtitle">
            Mã OTP sẽ được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư rác.
          </p>

          <form className="forgot-password-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="forgot-password-form-group">
              <label htmlFor="email" className="forgot-password-label">
                Địa chỉ email
              </label>
              <div className="forgot-password-input-wrap">
                <FiMail className="forgot-password-input-icon" />
                <input
                  id="email"
                  type="email"
                  className={`forgot-password-input ${errors.email ? "input-error" : ""}`}
                  placeholder="Nhập email đã đăng ký"
                  autoComplete="email"
                  {...register("email", {
                    required: "Vui lòng nhập email.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ.",
                    },
                  })}
                />
              </div>
              {errors.email && <p className="forgot-password-error">{errors.email.message}</p>}
            </div>

            <button type="submit" className="forgot-password-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="forgot-password-mini-spinner" /> Đang gửi mã...
                </>
              ) : (
                <>
                  <FiSend /> Gửi mã xác thực
                </>
              )}
            </button>
          </form>

          <div className="forgot-password-footer">
            Bạn đã nhớ mật khẩu? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ForgotPassword;
