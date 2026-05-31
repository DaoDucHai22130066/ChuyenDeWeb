import React from "react";
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
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(data).forEach((key) => {
        if (key !== "coverImage" && key !== "categoryName") {
          formData.append(key, data[key]);
        }
      });

      if (!data.categoryId && data.categoryName) {
        formData.append("category", data.categoryName);
      }
  
      // Append the file manually
      if (data.coverImage && data.coverImage[0]) {
        formData.append("coverImage", data.coverImage[0]); // Ensure it's the file object
      }
  
      const authToken = localStorage.getItem("authToken");
      const url = Server_URL + "books/add";
  
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const { error, message } = response.data;

      if (error) {
        showErrorToast(message);
      } else {
        showSuccessToast(message);
        reset();
      }
      
    } catch (error) {
      console.error("Error:", error.response?.data?.message || error.message);
      showErrorToast("Không thêm được sách!");
    }
  };

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.32 }}>
      <div className="admin-page-hero">
        <div className="admin-page-kicker">Admin library</div>
        <h2 className="admin-page-title">Thêm sách mới</h2>
        <p className="admin-page-lead">Bổ sung đầu sách vào kho với cùng phong cách giao diện của toàn bộ khu vực quản trị.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="admin-form-card">
        <div className="mb-3">
          <label className="form-label">Tên sách</label>
          <input
            type="text"
            className="form-control"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <small className="text-danger">{errors.title.message}</small>}
        </div>

        <div className="mb-3">
          <label className="form-label">Tác giả</label>
          <input
            type="text"
            className="form-control"
            {...register("author", { required: "Author is required" })}
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
            {...register("isbn", { required: "ISBN is required" })}
          />
          {errors.isbn && <small className="text-danger">{errors.isbn.message}</small>}
        </div>

        

        <div className="mb-3">
          <label className="form-label">Ảnh bìa</label>
          <input
            type="file"
            className="form-control"
            {...register("coverImage")}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Số bản</label>
          <input 
            type="number" 
            className="form-control" 
            {...register("totalCopies", { required: true, min: 1 })} 
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Giá tham khảo (tùy chọn)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-control" 
            {...register("price")} 
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mô tả</label>
          <textarea
            className="form-control"
            rows="3"
            {...register("description", { required: "Description is required" })}
          ></textarea>
          {errors.description && <small className="text-danger">{errors.description.message}</small>}
        </div>

        <button type="submit" className="btn admin-btn-primary w-100">Thêm sách</button>
      </form>
    </motion.div>
  );
};

export default AddBookForm;
