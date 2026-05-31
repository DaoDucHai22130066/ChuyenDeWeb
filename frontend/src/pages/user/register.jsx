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
    } catch {
      showErrorToast("Đăng ký thất bại. Email có thể đã được sử dụng.");
    }
  };

  // Google Sign-In callback for register page (reuses google-login endpoint)
  const handleCredentialResponse = async (response) => {
    try {
      const idToken = response.credential;
      const res = await axios.post(`${Server_URL}users/google-login`, { idToken });
      localStorage.setItem("authToken", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      showSuccessToast("Đăng nhập bằng Google thành công!");
      // optional: redirect to home
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
        { theme: 'outline', size: 'large' }
      );
    }
  }, []);

  const handleGoogleClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      showErrorToast("Google Sign-In không sẵn có");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: "480px" }}>
        <h2 className="login-title">Đăng ký</h2>
        <p className="login-subtitle">Tham gia cộng đồng độc giả D Free Book</p>
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
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
