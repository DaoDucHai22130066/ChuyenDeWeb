import { motion } from 'framer-motion';
import "../../styles/components.css";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./admin-shared.css";
import { useEffect, useState } from "react";


const AddBookForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(`${Server_URL}categories`);
        setCategories(response.data.categories || []);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {};
      
      // Thêm tất cả trường
      Object.keys(data).forEach((key) => {
        if (key !== "categoryName") {
          if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
            payload[key] = data[key];
          }
        }
      });

      if (!data.categoryId && data.categoryName) {
        payload.category = data.categoryName;
      }
  
      const authToken = localStorage.getItem("authToken");
      const url = Server_URL + "books/add";
  
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const { error } = response.data;

      if (error) {
        showErrorToast("Không thêm được sách. Vui lòng kiểm tra lại thông tin!");
      } else {
        showSuccessToast("Đã thêm sách thành công!");
        reset();
      }
      
    } catch (error) {
      console.error("Lỗi thêm sách:", error.response?.data?.message || error.message);
      showErrorToast("Không thêm được sách. Vui lòng thử lại!");
    }
  };

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.32 }}>
      <div className="admin-page-hero">
        <div className="admin-page-kicker">Quản trị thư viện</div>
        <h2 className="admin-page-title">Thêm sách mới</h2>
        <p className="admin-page-lead">Bổ sung đầu sách vào kho với cùng phong cách giao diện của toàn bộ khu vực quản trị.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="admin-form-card">
        <div className="mb-3">
          <label className="form-label">Tên sách</label>
          <input
            type="text"
            className="form-control"
            {...register("title", { required: "Vui lòng nhập tên sách" })}
          />
          {errors.title && <small className="text-danger">{errors.title.message}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Tác giả</label>
          <input
            type="text"
            className="form-control"
            {...register("author", { required: "Vui lòng nhập tên tác giả" })}
          />
          {errors.author && <small className="text-danger">{errors.author.message}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Danh mục</label>
          <select className="form-select" defaultValue="" {...register("categoryId")}>
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <small className="text-muted d-block mt-1">Hoặc nhập danh mục mới bên dưới.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Danh mục mới</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ví dụ: Công nghệ, Văn học..."
            {...register("categoryName")}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Chi nhánh</label>
          <select className="form-select" {...register("branch")} defaultValue="dai-la">
            <option value="dai-la">Cs. Đại La</option>
            <option value="cau-giay">Cs. Cầu Giấy</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">ISBN</label>
          <input
            type="text"
            className="form-control"
            {...register("isbn", { required: "Vui lòng nhập mã ISBN" })}
          />
          {errors.isbn && <small className="text-danger">{errors.isbn.message}</small>}
        </div>

        

        <div className="mb-3">
          <label className="form-label">Ảnh bìa (URL)</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ví dụ: https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg"
            {...register("coverImage")}
          />
          <small className="text-muted d-block mt-1">Nhập liên kết URL của ảnh bìa sách</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Số bản</label>
          <input 
            type="number" 
            className="form-control" 
            {...register("totalCopies", { required: "Vui lòng nhập số bản", min: { value: 1, message: "Số bản phải lớn hơn hoặc bằng 1" } })} 
          />
          {errors.totalCopies && <small className="text-danger">{errors.totalCopies.message}</small>}
        </div>
        
        <div className="mb-3">
          <label className="form-label">Giá tham khảo (VNĐ, tùy chọn)</label>
          <input 
            type="number" 
            step="1" 
            className="form-control" 
            placeholder="Ví dụ: 50000"
            {...register("price")} 
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mô tả</label>
          <textarea
            className="form-control"
            rows="3"
            {...register("description", { required: "Vui lòng nhập mô tả sách" })}
          ></textarea>
          {errors.description && <small className="text-danger">{errors.description.message}</small>}
        </div>

        <button type="submit" className="btn admin-btn-primary w-100">Thêm sách</button>
      </form>
    </motion.div>
  );
};

export default AddBookForm;
