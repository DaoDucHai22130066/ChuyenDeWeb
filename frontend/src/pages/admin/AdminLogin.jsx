import axios from "axios";
import React from "react";
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
          console.log("Response:", response.data);
          showSuccessToast("Login Successful!");
          localStorage.setItem("authToken", response.data.token);
          localStorage.setItem("role", response.data.user?.role || "admin");
          navigate("/admin")
          
  
        } catch (error) {
          console.error("Error:", error.response?.data || error.message);
          showErrorToast("Login Failed!");
        }
      };

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <div className="admin-auth-badge">Quản trị D Free Book</div>
        <h3 className="admin-auth-title">Đăng nhập admin</h3>
        <p className="admin-auth-subtitle">Truy cập khu vực quản trị bằng tài khoản được cấp quyền.</p>
        <form onSubmit={handleSubmit(onSubmit)}>
        
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-danger">{errors.email.message}</p>}
          </div>

       
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="text-danger">{errors.password.message}</p>}
          </div>

          
          <button type="submit" className="btn admin-auth-submit w-100">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
