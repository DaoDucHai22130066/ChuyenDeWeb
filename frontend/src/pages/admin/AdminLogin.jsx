import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./admin-shared.css";


const AdminLogin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
  const navigate = useNavigate();


  const onSubmit = async (data) => {
        try {
          const url =Server_URL + 'admin/login';
          const response = await axios.post(url, data);
          console.log("Phản hồi đăng nhập:", response.data);
          showSuccessToast("Đăng nhập thành công!");
          localStorage.setItem("authToken", response.data.token);
          localStorage.setItem("role", response.data.user?.role || "admin");
          navigate("/admin")
          
  
        } catch (error) {
          console.error("Lỗi đăng nhập:", error.response?.data || error.message);
          showErrorToast("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu!");
        }
      };

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <div className="admin-auth-logo">DFB</div>
        <div className="admin-auth-badge">Quản trị D Free Book</div>
        <h3 className="admin-auth-title">Đăng nhập quản trị</h3>
        <p className="admin-auth-subtitle">Truy cập khu vực quản trị bằng tài khoản được cấp quyền để quản lý sách, phiếu mượn và giao dịch.</p>
        <form onSubmit={handleSubmit(onSubmit)}>
        
          <div className="mb-3">
            <label className="form-label">Địa chỉ email quản trị</label>
            <input
              type="email"
              className="form-control"
              {...register("email", { required: "Vui lòng nhập địa chỉ email" })}
            />
            {errors.email && <p className="text-danger">{errors.email.message}</p>}
          </div>

       
          <div className="mb-3">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              {...register("password", { required: "Vui lòng nhập mật khẩu" })}
            />
            {errors.password && <p className="text-danger">{errors.password.message}</p>}
          </div>

          
          <button type="submit" className="btn admin-auth-submit w-100">Đăng nhập vào hệ thống</button>
          <p className="admin-auth-help">Chỉ tài khoản có quyền quản trị mới truy cập được khu vực này.</p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
