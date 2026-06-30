import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./login.css";
import { FiBookOpen, FiCheckCircle } from "react-icons/fi";

export default function Register() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const loginAfterVerified = async (email, password) => {
    const loginResponse = await axios.post(`${Server_URL}users/login`, { email, password });
    localStorage.setItem("authToken", loginResponse.data.token);
    localStorage.setItem("role", loginResponse.data.user.role);
    try {
      window.dispatchEvent(new Event('cart:auth-changed'));
    } catch {
      // Auth sync event is best-effort.
    }
    navigate("/user");
  };

  const onSubmit = async (data) => {
    try {
      const formData = { ...data, role: "user" };
      await axios.post(`${Server_URL}users/register`, formData);

      setPendingEmail(data.email);
      setPendingPassword(data.password);
      showSuccessToast("Đăng ký thành công. Vui lòng kiểm tra email và nhập mã OTP.");
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Đăng ký thất bại. Email có thể đã được sử dụng.");
    }
  };

  const handleVerifyRegistration = async (event) => {
    event.preventDefault();
    if (!pendingEmail || !otp.trim()) {
      showErrorToast("Vui lòng nhập mã OTP xác nhận email.");
      return;
    }

    try {
      setIsVerifying(true);
      await axios.post(`${Server_URL}users/verify-registration-otp`, {
        email: pendingEmail,
        otp: otp.trim(),
      });
      showSuccessToast("Xác nhận email thành công!");
      await loginAfterVerified(pendingEmail, pendingPassword);
      reset();
      setOtp("");
      setPendingEmail("");
      setPendingPassword("");
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    if (!pendingEmail) return;
    try {
      await axios.post(`${Server_URL}users/resend-registration-otp`, { email: pendingEmail });
      showSuccessToast("Mã OTP mới đã được gửi đến email của bạn.");
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Không gửi lại được mã OTP.");
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
        { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
      );
    }
  }, []);

  return (
<<<<<<< HEAD
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
=======
    <div className="login-container">
      <section className="auth-showcase register-showcase">
        <div className="auth-showcase-content">
          <span className="auth-showcase-logo"><FiBookOpen /></span>
          <p className="auth-eyebrow">Tham gia cộng đồng</p>
          <h1>Bắt đầu hành trình đọc theo cách của bạn.</h1>
          <p>Tạo tài khoản miễn phí để khám phá, lưu và mượn sách thuận tiện hơn.</p>
          <div className="auth-benefits">
            <span><FiCheckCircle /> Theo dõi phiếu mượn</span>
            <span><FiCheckCircle /> Lưu danh sách yêu thích</span>
          </div>
        </div>
      </section>
      <div className="login-box register-box">
        <span className="auth-mobile-logo"><FiBookOpen /> D Free Book</span>
        <h2 className="login-title">{pendingEmail ? "Xác nhận email" : "Tạo tài khoản"}</h2>
        <p className="login-subtitle">{pendingEmail ? "Nhập mã OTP được gửi đến email của bạn." : "Tham gia cộng đồng độc giả D Free Book."}</p>
        {pendingEmail ? (
          <form onSubmit={handleVerifyRegistration} className="login-form">
            <p className="login-subtitle">Mã OTP đã gửi đến <strong>{pendingEmail}</strong>.</p>
            <div className="form-group">
              <label>Mã OTP xác nhận email</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                className="form-input"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Nhập 6 chữ số"
              />
            </div>
            <button type="submit" className="btn-submit" disabled={isVerifying}>
              {isVerifying ? "Đang xác nhận..." : "Xác nhận email"}
            </button>
            <button
              type="button"
              className="btn-submit auth-secondary-submit"
              onClick={handleResendRegistrationOtp}
            >
              Gửi lại mã OTP
            </button>
            <p className="login-register-link">
              Nhập sai email? <button type="button" className="forgot-btn" onClick={() => setPendingEmail("")}>Đăng ký lại</button>
            </p>
          </form>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label>Họ và tên</label>
            <input type="text" className="form-input" {...register("name", { required: "Vui lòng nhập họ tên" })} />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" {...register("email", { required: "Vui lòng nhập email" })} />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" className="form-input" {...register("password", { required: "Vui lòng nhập mật khẩu" })} />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label>Ngành / lĩnh vực</label>
            <input type="text" className="form-input" {...register("stream", { required: "Vui lòng nhập thông tin" })} />
            {errors.stream && <span className="error-text">{errors.stream.message}</span>}
          </div>

          <div className="form-group">
            <label>Năm</label>
            <input type="number" className="form-input" {...register("year", { required: "Vui lòng nhập năm" })} />
            {errors.year && <span className="error-text">{errors.year.message}</span>}
          </div>

          <button type="submit" className="btn-submit">Đăng ký</button>

          <div className="auth-divider"><span>hoặc</span></div>
          <div className="auth-google-row"><div id="googleSignInDiv"></div></div>

          <p className="login-register-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
        )}
>>>>>>> f642a8cbe12965b30ad49a78e8e49a3c9793c471
      </div>
    </div>
  );
}