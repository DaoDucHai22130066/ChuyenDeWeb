import { useForm } from "react-hook-form";
import axios from "axios";
import { Server_URL } from "../../../utils/config";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiCheckCircle, FiKey, FiMail, FiRefreshCw, FiShield } from "react-icons/fi";
import { showErrorToast, showSuccessToast } from "../../../utils/toasthelper";
import "../../../styles/components.css";
import "./VerifyOtp.css";

function VerifyOTP() {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      otp: "",
    },
  });
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${Server_URL}users/verify-otp`, data);
      showSuccessToast("Xác thực mã OTP thành công.");
      navigate("/resetpass", { state: { email: data.email, resetToken: response.data.resetToken } });
    } catch {
      showErrorToast("Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.");
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = getValues("email") || email;
    if (!targetEmail) {
      showErrorToast("Vui lòng nhập email trước khi gửi lại mã.");
      return;
    }

    try {
      await axios.post(`${Server_URL}users/forgot-password`, { email: targetEmail });
      showSuccessToast("Mã OTP mới đã được gửi đến email của bạn.");
    } catch {
      showErrorToast("Không gửi lại được mã OTP. Vui lòng thử lại sau.");
    }
  };

  return (
    <motion.div
      className="verify-otp-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      <div className="verify-otp-shell">
        <motion.section
          className="verify-otp-info-panel"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Link to="/forgetPassword" className="verify-otp-back-link">
            <FiArrowLeft /> Quay lại nhập email
          </Link>

          <div className="verify-otp-brand">
            <span className="verify-otp-brand-icon">📚</span>
            <span>D Free Book</span>
          </div>

          <h1>Xác minh tài khoản của bạn</h1>
          <p>
            Nhập mã OTP gồm 6 chữ số đã được gửi đến email để tiếp tục đặt lại mật khẩu.
          </p>

          <div className="verify-otp-steps" aria-label="Quy trình khôi phục mật khẩu">
            <div className="verify-otp-step done">
              <span><FiCheckCircle /></span>
              <p>Nhập email</p>
            </div>
            <div className="verify-otp-step active">
              <span>2</span>
              <p>Xác thực OTP</p>
            </div>
            <div className="verify-otp-step">
              <span>3</span>
              <p>Đặt mật khẩu mới</p>
            </div>
          </div>
        </motion.section>

        <motion.div
          className="verify-otp-card dfb-card"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="verify-otp-card-icon">
            <FiKey />
          </div>

          <p className="verify-otp-kicker">Bảo mật tài khoản</p>
          <h2 className="verify-otp-title">Nhập mã xác thực</h2>
          <p className="verify-otp-subtitle">
            Chúng tôi đã gửi mã OTP đến {email ? <span>{email}</span> : "email của bạn"}.
          </p>

          <form className="verify-otp-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="verify-otp-form-group">
              <label htmlFor="email" className="verify-otp-label">
                Địa chỉ email
              </label>
              <div className="verify-otp-input-wrap">
                <FiMail className="verify-otp-input-icon" />
                <input
                  id="email"
                  type="email"
                  className={`verify-otp-input ${errors.email ? "input-error" : ""}`}
                  placeholder="Nhập email đã đăng ký"
                  defaultValue={email}
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
              {errors.email && <p className="verify-otp-error">{errors.email.message}</p>}
            </div>

            <div className="verify-otp-form-group">
              <label htmlFor="otp" className="verify-otp-label">
                Mã OTP
              </label>
              <div className="verify-otp-input-wrap otp-input-container">
                <FiShield className="verify-otp-input-icon" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  className={`verify-otp-input otp-input ${errors.otp ? "input-error" : ""}`}
                  placeholder="Nhập 6 chữ số"
                  autoComplete="one-time-code"
                  {...register("otp", {
                    required: "Vui lòng nhập mã OTP.",
                    minLength: { value: 6, message: "Mã OTP phải gồm 6 chữ số." },
                    maxLength: { value: 6, message: "Mã OTP phải gồm 6 chữ số." },
                    pattern: { value: /^[0-9]{6}$/, message: "Mã OTP chỉ bao gồm chữ số." },
                  })}
                />
              </div>
              {errors.otp && <p className="verify-otp-error">{errors.otp.message}</p>}
            </div>

            <button type="submit" className="verify-otp-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="verify-otp-mini-spinner" /> Đang xác thực...
                </>
              ) : (
                <>
                  <FiCheckCircle /> Xác thực OTP
                </>
              )}
            </button>
          </form>

          <div className="verify-otp-footer">
            Chưa nhận được mã?
            <button type="button" className="verify-otp-resend-link" onClick={handleResendOtp}>
              <FiRefreshCw /> Gửi lại mã
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default VerifyOTP;
