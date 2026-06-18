import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { FiBookOpen, FiLock, FiMail, FiShield } from "react-icons/fi";

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
  const handleCredentialResponse = useCallback(async (response) => {
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
  }, [navigate]);

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
  }, [handleCredentialResponse]);

  return (
    <div className="login-container">
      <section className="auth-showcase">
        <div className="auth-showcase-content">
          <span className="auth-showcase-logo"><FiBookOpen /></span>
          <p className="auth-eyebrow">D Free Book Community</p>
          <h1>Mỗi cuốn sách là một kết nối mới.</h1>
          <p>Đăng nhập để lưu sách yêu thích, gửi yêu cầu mượn và theo dõi hành trình đọc của bạn.</p>
          <div className="auth-benefits">
            <span><FiShield /> Mượn sách minh bạch</span>
            <span><FiBookOpen /> Kho sách đa dạng</span>
          </div>
        </div>
      </section>
      <div className="login-box">
        <span className="auth-mobile-logo"><FiBookOpen /> D Free Book</span>
        <h2 className="login-title">Chào mừng trở lại</h2>
        <p className="login-subtitle">Đăng nhập tài khoản độc giả để tiếp tục.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <div className="auth-input-wrap">
              <FiMail />
              <input type="email" {...register("email", { required: "Vui lòng nhập email" })} className="form-input" placeholder="email@example.com" />
            </div>
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div className="auth-input-wrap">
              <FiLock />
              <input type="password" {...register("password", { required: "Vui lòng nhập mật khẩu" })} className="form-input" placeholder="Nhập mật khẩu" />
            </div>
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <div className="forgot-password">
            <button type="button" className="forgot-btn" onClick={() => navigate("/forgetPassword")}>
              Quên mật khẩu?
            </button>
          </div>

          <button type="submit" className="btn-submit">Đăng nhập</button>

          <div className="auth-divider"><span>hoặc</span></div>
          <div className="auth-google-row"><div id="googleSignInDiv"></div></div>

          <p className="login-register-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
