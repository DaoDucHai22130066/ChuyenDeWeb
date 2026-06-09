import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";

const notifyCartAuthChanged = () => {
  try {
    window.dispatchEvent(new Event('cart:auth-changed'));
  } catch {
    // Auth sync event is best-effort.
  }
};

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${Server_URL}users/login`, data);
      const { role } = response.data.user;

      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("role", role);
      notifyCartAuthChanged();

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

      showSuccessToast("Đăng nhập thành công!");
    } catch {
      showErrorToast("Đăng nhập thất bại. Kiểm tra email và mật khẩu.");
    }
  };

  // Callback đăng nhập bằng Google
  const handleCredentialResponse = async (response) => {
    try {
      const idToken = response.credential;
      const res = await axios.post(`${Server_URL}users/google-login`, { idToken });
      const { role } = res.data.user;
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("role", role);
      notifyCartAuthChanged();
      if (role === "admin") navigate("/admin"); else navigate("/");
      showSuccessToast("Đăng nhập bằng Google thành công!");
    } catch {
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
