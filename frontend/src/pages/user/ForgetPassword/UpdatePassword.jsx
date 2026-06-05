import { useForm } from "react-hook-form";
import axios from "axios";
import { Server_URL } from "../../../utils/config";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";
import { showErrorToast, showSuccessToast } from "../../../utils/toasthelper";
import "../../../styles/components.css";
import "./UpdatePassword.css";

function ResetPassword() {
  const location = useLocation();
  const email = location.state?.email || "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email,
      newPassword: "",
      confirmPassword: "",
    },
  });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, resetToken: location.state?.resetToken };
      await axios.post(`${Server_URL}users/reset-password`, payload);
      showSuccessToast("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      navigate("/login");
    } catch {
      showErrorToast("Không thể đổi mật khẩu. Vui lòng kiểm tra thông tin và thử lại.");
    }
  };

  return (
    <motion.div
      className="reset-password-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      <div className="reset-password-shell">
        <motion.section
          className="reset-password-info-panel"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Link to="/verifyotp" className="reset-password-back-link">
            <FiArrowLeft /> Quay lại xác thực OTP
          </Link>

          <div className="reset-password-brand">
            <span className="reset-password-brand-icon">📚</span>
            <span>D Free Book</span>
          </div>

          <h1>Tạo mật khẩu mới an toàn hơn</h1>
          <p>
            Chọn mật khẩu mới dễ nhớ với bạn nhưng khó đoán với người khác. Sau khi đổi thành công, bạn có thể đăng nhập lại ngay.
          </p>

          <div className="reset-password-steps" aria-label="Quy trình khôi phục mật khẩu">
            <div className="reset-password-step done">
              <span><FiCheckCircle /></span>
              <p>Nhập email</p>
            </div>
            <div className="reset-password-step done">
              <span><FiCheckCircle /></span>
              <p>Xác thực OTP</p>
            </div>
            <div className="reset-password-step active">
              <span>3</span>
              <p>Đặt mật khẩu mới</p>
            </div>
          </div>
        </motion.section>

        <motion.div
          className="reset-password-card dfb-card"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="reset-password-card-icon">
            <FiLock />
          </div>

          <p className="reset-password-kicker">Cập nhật bảo mật</p>
          <h2 className="reset-password-title">Đặt lại mật khẩu</h2>
          <p className="reset-password-subtitle">
            Mật khẩu mới cần tối thiểu 6 ký tự. Không nên dùng lại mật khẩu cũ.
          </p>

          <form className="reset-password-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="reset-password-form-group">
              <label htmlFor="email" className="reset-password-label">
                Địa chỉ email
              </label>
              <div className="reset-password-input-wrap">
                <FiMail className="reset-password-input-icon" />
                <input
                  id="email"
                  type="email"
                  className={`reset-password-input ${errors.email ? "input-error" : ""}`}
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
              {errors.email && <p className="reset-password-error">{errors.email.message}</p>}
            </div>

            <div className="reset-password-form-group">
              <label htmlFor="newPassword" className="reset-password-label">
                Mật khẩu mới
              </label>
              <div className="reset-password-input-wrap">
                <FiShield className="reset-password-input-icon" />
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  className={`reset-password-input ${errors.newPassword ? "input-error" : ""}`}
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  {...register("newPassword", {
                    required: "Vui lòng nhập mật khẩu mới.",
                    minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự." },
                  })}
                />
                <button
                  type="button"
                  className="reset-password-visibility-btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.newPassword && <p className="reset-password-error">{errors.newPassword.message}</p>}
            </div>

            <div className="reset-password-form-group">
              <label htmlFor="confirmPassword" className="reset-password-label">
                Xác nhận mật khẩu mới
              </label>
              <div className="reset-password-input-wrap">
                <FiLock className="reset-password-input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`reset-password-input ${errors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu.",
                    validate: (value) => value === watch("newPassword") || "Mật khẩu xác nhận không khớp.",
                  })}
                />
                <button
                  type="button"
                  className="reset-password-visibility-btn"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="reset-password-error">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="reset-password-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="reset-password-mini-spinner" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <FiCheckCircle /> Cập nhật mật khẩu
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ResetPassword;
