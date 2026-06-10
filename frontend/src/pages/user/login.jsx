import React, { useEffect } from "react";
import GoogleIcon from "../../assets/google.svg";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${Server_URL}users/login`, data);
      const { role } = response.data.user;

      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("role", role);

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

      try { window.dispatchEvent(new Event('cart:auth-changed')); } catch (e) {}

      showSuccessToast("Đăng nhập thành công!");
    } catch {
      showErrorToast("Đăng nhập thất bại. Kiểm tra email và mật khẩu.");
    }
  };

  const handleCredentialResponse = async (response) => {
    try {
      const idToken = response.credential;
      const res = await axios.post(`${Server_URL}users/google-login`, { idToken });
      const { role } = res.data.user;
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("role", role);
      if (role === "admin") navigate("/admin"); else navigate("/");
      showSuccessToast("Đăng nhập bằng Google thành công!");
    } catch (err) {
      showErrorToast("Đăng nhập bằng Google thất bại");
    }
  };

  useEffect(() => {
    if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
      );
    }
  }, []);

  return (
    <div className="login-split-container">
      {/* CỘT TRÁI: BANNER & SLOGAN */}
      <div className="login-banner">
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <div className="banner-logo-badge">D Free Book</div>
          <h1 className="banner-slogan">
            Mượn sách bằng <br />
            <span>đặt cọc tự tâm</span>
          </h1>
          <p className="banner-description">
            Không gian lan tỏa văn hóa đọc, kết nối những tâm hồn yêu tri thức và sẻ chia giá trị cộng đồng hoàn toàn miễn phí.
          </p>
          <div className="banner-footer">
            <span className="footer-dot"></span> Thư viện cộng đồng không lợi nhuận
          </div>
        </div>
        {/* Decorative elements */}
        <div className="banner-blob blob-1"></div>
        <div className="banner-blob blob-2"></div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <div className="login-form-section">
        <div className="login-form-wrapper animate-fade-in-right">
          <div className="login-form-header">
            <h2 className="form-title">Chào mừng trở lại</h2>
            <p className="form-subtitle">Vui lòng nhập thông tin tài khoản của bạn</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="modern-form">
            <div className="form-group-modern">
              <label>Email</label>
              <input
                type="email"
                {...register("email", { required: "Vui lòng nhập email" })}
                className="input-field-modern"
                placeholder="name@example.com"
              />
              {errors.email && <span className="error-msg-modern">{errors.email.message}</span>}
            </div>

            <div className="form-group-modern">
              <label>Mật khẩu</label>
              <input
                type="password"
                {...register("password", { required: "Vui lòng nhập mật khẩu" })}
                className="input-field-modern"
                placeholder="••••••••"
              />
              {errors.password && <span className="error-msg-modern">{errors.password.message}</span>}
            </div>

            <div className="form-options-modern">
              <button type="button" className="forgot-link-modern" onClick={() => navigate("/forgetPassword")}>
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" className="btn-submit-modern">Đăng nhập</button>

            <div className="divider-modern">
              <span>Hoặc tiếp tục với</span>
            </div>

            <div className="google-btn-container">
              <div id="googleSignInDiv"></div>
            </div>

            <p className="switch-page-text">
              Bạn chưa có tài khoản? <Link to="/register">Đăng ký thành viên</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}