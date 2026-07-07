import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { FiBookOpen, FiImage, FiInfo, FiMapPin, FiPlus } from "react-icons/fi";
import axios from "axios";
import "../../styles/components.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./admin-shared.css";

const FALLBACK_COVER = "https://placehold.co/240x340/eef2ff/475569?text=D+Free+Book";

// Component con: Chỉ re-render khu vực này khi các trường xem trước thay đổi dữ liệu
const BookPreview = ({ control }) => {
  const title = useWatch({ control, name: "title", defaultValue: "" });
  const author = useWatch({ control, name: "author", defaultValue: "" });
  const coverImage = useWatch({ control, name: "coverImage", defaultValue: "" });

  return (
    <section className="admin-cover-card">
      <div className="admin-form-section-title">
        <FiImage />
        <div>
          <h2>Ảnh bìa</h2>
          <p>Xem trước theo thời gian thực.</p>
        </div>
      </div>
      <div className="admin-cover-preview">
        <img src={coverImage || FALLBACK_COVER} alt="Xem trước ảnh bìa" />
      </div>
      <strong>{title || "Tên sách"}</strong>
      <span>{author || "Tên tác giả"}</span>
    </section>
  );
};

const AddBookForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ 
    defaultValues: { 
      branch: "dai-la",
      categoryId: "",
      categoryName: "",
      coverImage: "",
      title: "",
      author: "",
      isbn: "",
      description: "",
      totalCopies: 1,
      price: ""
    } 
  });

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Tải danh sách danh mục có sẵn
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await axios.get(`${Server_URL}categories`);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
        showErrorToast("Không thể tải danh sách danh mục hiện tại.");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showErrorToast("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        return;
      }

      // Xây dựng payload và lọc bỏ các giá trị rỗng/không hợp lệ
      const payload = {};
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "categoryName" && value !== undefined && value !== null && value !== "") {
          payload[key] = value;
        }
      });

      // Nếu không chọn danh mục có sẵn mà điền danh mục mới
      if (!data.categoryId && data.categoryName?.trim()) {
        payload.category = data.categoryName.trim();
      }

      const response = await axios.post(`${Server_URL}books/add`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.error) {
        showErrorToast(response.data.message || "Không thêm được sách. Vui lòng kiểm tra lại thông tin.");
        return;
      }

      showSuccessToast("Đã thêm sách thành công!");
      reset({ branch: "dai-la", totalCopies: 1 });
    } catch (error) {
      console.error("Lỗi thêm sách:", error.response?.data?.message || error.message);
      showErrorToast(error.response?.data?.message || "Không thêm được sách. Vui lòng thử lại.");
    }
  };

  return (
    <motion.div className="admin-page-wrap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <section className="admin-page-hero">
        <div className="admin-page-kicker">Bổ sung kho sách</div>
        <h1 className="admin-page-title">Thêm sách mới</h1>
        <p className="admin-page-lead">
          Nhập thông tin xuất bản, vị trí lưu trữ và ảnh bìa để tạo một đầu sách mới.
        </p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="admin-book-create-layout">
        <div className="admin-create-main">
          
          {/* Thông tin cơ bản */}
          <section className="admin-form-section">
            <div className="admin-form-section-title">
              <FiBookOpen />
              <div><h2>Thông tin cơ bản</h2><p>Tên sách, tác giả và mô tả nội dung.</p></div>
            </div>
            <div className="admin-form-grid">
              <label className="full-width">Tên sách
                <input 
                  type="text" 
                  placeholder="Nhập tên sách" 
                  {...register("title", { required: "Vui lòng nhập tên sách" })} 
                />
                {errors.title && <small className="admin-field-error">{errors.title.message}</small>}
              </label>

              <label>Tác giả
                <input 
                  type="text" 
                  placeholder="Tên tác giả" 
                  {...register("author", { required: "Vui lòng nhập tên tác giả" })} 
                />
                {errors.author && <small className="admin-field-error">{errors.author.message}</small>}
              </label>

              <label>ISBN
                <input 
                  type="text" 
                  placeholder="Ví dụ: 978604..." 
                  {...register("isbn", { required: "Vui lòng nhập mã ISBN" })} 
                />
                {errors.isbn && <small className="admin-field-error">{errors.isbn.message}</small>}
              </label>

              <label className="full-width">Mô tả
                <textarea 
                  rows="5" 
                  placeholder="Mô tả ngắn về nội dung sách" 
                  {...register("description", { required: "Vui lòng nhập mô tả sách" })} 
                />
                {errors.description && <small className="admin-field-error">{errors.description.message}</small>}
              </label>
            </div>
          </section>

          {/* Phân loại và số lượng */}
          <section className="admin-form-section">
            <div className="admin-form-section-title">
              <FiInfo />
              <div><h2>Phân loại và số lượng</h2><p>Thiết lập danh mục, chi nhánh và thông tin kho.</p></div>
            </div>
            <div className="admin-form-grid">
              <label>Danh mục có sẵn
                <select defaultValue="" {...register("categoryId")}>
                  <option value="">{isLoadingCategories ? "Đang tải danh mục..." : "Chọn danh mục"}</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label>Hoặc danh mục mới
                <input type="text" placeholder="Ví dụ: Công nghệ" {...register("categoryName")} />
              </label>

              <label><span><FiMapPin /> Chi nhánh</span>
                <select {...register("branch")}>
                  <option value="dai-la">Cơ sở Đại La</option>
                  <option value="cau-giay">Cơ sở Cầu Giấy</option>
                </select>
              </label>

              <label>Số bản
                <input 
                  type="number" 
                  min="1" 
                  placeholder="1" 
                  {...register("totalCopies", {
                    required: "Vui lòng nhập số bản",
                    valueAsNumber: true,
                    min: { value: 1, message: "Số bản phải từ 1 trở lên" },
                  })} 
                />
                {errors.totalCopies && <small className="admin-field-error">{errors.totalCopies.message}</small>}
              </label>

              <label className="full-width">Giá tham khảo (VNĐ)
                <input 
                  type="number" 
                  min="0" 
                  step="1000" 
                  placeholder="Ví dụ: 120000" 
                  {...register("price", { valueAsNumber: true })} 
                />
              </label>
            </div>
          </section>
        </div>

        {/* Sidebar xem trước & Hành động */}
        <aside className="admin-create-aside">
          {/* Gọi component preview cô lập re-render */}
          <BookPreview control={control} />

          <label style={{ width: "100%", display: "block", marginBottom: "1rem" }}>URL ảnh bìa
            <input type="url" placeholder="https://..." {...register("coverImage")} />
          </label>

          <button type="submit" className="btn admin-btn-primary admin-create-submit" disabled={isSubmitting}>
            <FiPlus /> {isSubmitting ? "Đang lưu..." : "Thêm vào kho sách"}
          </button>
        </aside>
      </form>
    </motion.div>
  );
};

export default AddBookForm;