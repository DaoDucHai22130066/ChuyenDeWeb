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

      // notify cart context to sync
      try { window.dispatchEvent(new Event('cart:auth-changed')); } catch (e) {}

      showSuccessToast("Đăng nhập thành công!");
    } catch {
      showErrorToast("Đăng nhập thất bại. Kiểm tra email và mật khẩu.");
    }
  };

  // Google Sign-In callback
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
        { theme: 'outline', size: 'large' }
      );
    }
  }, []);

  const handleGoogleClick = () => {
    if (window.google) {
      // Show one-tap / prompt to select account
      window.google.accounts.id.prompt();
    } else {
      showErrorToast("Google Sign-In không sẵn có");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Đăng nhập</h2>
        <p className="login-subtitle">D Free Book — Thư viện cộng đồng</p>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              {...register("email", { required: "Vui lòng nhập email" })}
              className="form-input"
              placeholder="email@example.com"
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              {...register("password", { required: "Vui lòng nhập mật khẩu" })}
              className="form-input"
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <div className="forgot-password">
            <button type="button" className="forgot-btn" onClick={() => navigate("/forgetPassword")}>
              Quên mật khẩu?
            </button>
          </div>

          <button type="submit" className="btn-submit">Đăng nhập</button>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button type="button" className="social-btn google-btn" onClick={handleGoogleClick} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={GoogleIcon} alt="Google" style={{ width: 20, height: 20 }} />
                Đăng nhập bằng Google
              </button>
            </div>
            <div id="googleSignInDiv" style={{ marginTop: 8 }}></div>
          </div>

          <p className="login-register-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
