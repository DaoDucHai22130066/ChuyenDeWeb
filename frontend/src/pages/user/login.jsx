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

<<<<<<< HEAD
      try { window.dispatchEvent(new Event('cart:auth-changed')); } catch (e) {}

=======
>>>>>>> f642a8cbe12965b30ad49a78e8e49a3c9793c471
      showSuccessToast("Đăng nhập thành công!");
    } catch {
      showErrorToast("Đăng nhập thất bại. Kiểm tra email và mật khẩu.");
    }
  };

<<<<<<< HEAD
  const handleCredentialResponse = async (response) => {
=======
  // Callback đăng nhập bằng Google
  const handleCredentialResponse = useCallback(async (response) => {
>>>>>>> f642a8cbe12965b30ad49a78e8e49a3c9793c471
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
        { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
      );
    }
<<<<<<< HEAD
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
=======
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
>>>>>>> f642a8cbe12965b30ad49a78e8e49a3c9793c471
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