import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiShield } from "react-icons/fi";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./admin-shared.css";

const AdminLogin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${Server_URL}admin/login`, data);
      showSuccessToast("Đăng nhập thành công!");
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("role", response.data.user?.role || "admin");
      navigate("/admin");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error.response?.data || error.message);
      showErrorToast("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.");
    }
  };

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <div className="admin-auth-logo"><FiShield /></div>
        <div className="admin-auth-badge">D Free Book · Admin</div>
        <h1 className="admin-auth-title">Chào mừng trở lại</h1>
        <p className="admin-auth-subtitle">
          Đăng nhập để quản lý kho sách, độc giả và toàn bộ quy trình mượn trả.
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="admin-auth-field">
            <span>Địa chỉ email</span>
            <div><FiMail /><input type="email" placeholder="admin@example.com" {...register("email", { required: "Vui lòng nhập email" })} /></div>
            {errors.email && <small className="admin-field-error">{errors.email.message}</small>}
          </label>
          <label className="admin-auth-field">
            <span>Mật khẩu</span>
            <div><FiLock /><input type="password" placeholder="Nhập mật khẩu" {...register("password", { required: "Vui lòng nhập mật khẩu" })} /></div>
            {errors.password && <small className="admin-field-error">{errors.password.message}</small>}
          </label>
          <button type="submit" className="btn admin-auth-submit w-100" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập hệ thống"}
          </button>
          <p className="admin-auth-help">Khu vực dành riêng cho tài khoản có quyền quản trị.</p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
