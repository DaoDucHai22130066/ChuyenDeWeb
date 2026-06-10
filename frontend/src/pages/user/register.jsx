import React, { useEffect } from "react";
import GoogleIcon from "../../assets/google.svg";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./login.css";

export default function Register() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const formData = { ...data, role: "user" };
      await axios.post(`${Server_URL}users/register`, formData);

      const loginResponse = await axios.post(`${Server_URL}users/login`, {
        email: data.email,
        password: data.password,
      });

      localStorage.setItem("authToken", loginResponse.data.token);
      localStorage.setItem("role", loginResponse.data.user.role);

      showSuccessToast("Đăng ký thành công!");
      reset();
      navigate("/user");
      try { window.dispatchEvent(new Event('cart:auth-changed')); } catch (e) {}
    } catch {
      showErrorToast("Đăng ký thất bại. Email có thể đã được sử dụng.");
    }
  };

  const handleCredentialResponse = async (response) => {
    try {
      const idToken = response.credential;
      const res = await axios.post(`${Server_URL}users/google-login`, { idToken });
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      showSuccessToast("Đăng nhập bằng Google thành công!");
      window.location.href = "/";
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
            Đọc sách miễn phí,<br />
            <span>Lan tỏa tử tế</span>
          </h1>
          <p className="banner-description">
            Trở thành một mảnh ghép của thư viện đặt cọc tự tâm. Sở hữu tủ sách trực tuyến mượn không giới hạn ngay hôm nay.
          </p>
          <div className="banner-footer">
            <span className="footer-dot"></span> Hơn 10,000+ đầu sách đang chờ bạn
          </div>
        </div>
        <div className="banner-blob blob-1" style={{ background: 'rgba(249, 115, 22, 0.25)' }}></div>
        <div className="banner-blob blob-2" style={{ background: 'rgba(59, 130, 246, 0.3)' }}></div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG KÝ */}
      <div className="login-form-section">
        <div className="login-form-wrapper animate-fade-in-right" style={{ maxWidth: '520px' }}>
          <div className="login-form-header">
            <h2 className="form-title">Tạo tài khoản mới</h2>
            <p className="form-subtitle">Khám phá kho tri thức cộng đồng vô tận</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="modern-form">
            <div className="grid-2-col">
              <div className="form-group-modern">
                <label>Họ và tên</label>
                <input type="text" className="input-field-modern" placeholder="Nguyễn Văn A" {...register("name", { required: "Vui lòng nhập họ tên" })} />
                {errors.name && <span className="error-msg-modern">{errors.name.message}</span>}
              </div>

              <div className="form-group-modern">
                <label>Email</label>
                <input type="email" className="input-field-modern" placeholder="alex@gmail.com" {...register("email", { required: "Vui lòng nhập email" })} />
                {errors.email && <span className="error-text">{errors.email.message}</span>}
              </div>
            </div>

            <div className="form-group-modern">
              <label>Mật khẩu</label>
              <input type="password" className="input-field-modern" placeholder="Tối thiểu 6 ký tự" {...register("password", { required: "Vui lòng nhập mật khẩu" })} />
              {errors.password && <span className="error-msg-modern">{errors.password.message}</span>}
            </div>

            <div className="grid-2-col">
              <div className="form-group-modern">
                <label>Ngành / Lĩnh vực</label>
                <input type="text" className="input-field-modern" placeholder="Kinh tế, CNTT..." {...register("stream", { required: "Vui lòng nhập thông tin" })} />
                {errors.stream && <span className="error-msg-modern">{errors.stream.message}</span>}
              </div>

              <div className="form-group-modern">
                <label>Năm sinh / Khóa</label>
                <input type="number" className="input-field-modern" placeholder="2000" {...register("year", { required: "Vui lòng nhập năm" })} />
                {errors.year && <span className="error-msg-modern">{errors.year.message}</span>}
              </div>
            </div>

            <button type="submit" className="btn-submit-modern">Đăng ký ngay</button>

            <div className="divider-modern">
              <span>Hoặc kết nối qua</span>
            </div>

            <div className="google-btn-container">
              <div id="googleSignInDiv"></div>
            </div>

            <p className="switch-page-text">
              Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}