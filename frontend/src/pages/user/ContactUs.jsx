import { useForm } from "react-hook-form";
import axios from "axios";
import { FiMail, FiMapPin, FiClock, FiSend } from "react-icons/fi";
import "./contact.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";

const ContactUs = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await axios.post(Server_URL + "users/contact", data);
      showSuccessToast("Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm.");
      reset();
    } catch {
      showErrorToast("Không gửi được tin nhắn. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-container">
          <h1>Liên hệ</h1>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn về mượn sách và hoạt động thư viện</p>
        </div>
      </section>

      <section className="contact-info-section">
        <div className="contact-container">
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <FiMapPin className="contact-icon" size={28} />
              <h3>Cs. Đại La</h3>
              <p>Phố Đại La, Hai Bà Trưng, Hà Nội</p>
            </div>
            <div className="contact-info-card">
              <FiMapPin className="contact-icon" size={28} />
              <h3>Cs. Cầu Giấy</h3>
              <p>Cầu Giấy, Hà Nội</p>
            </div>
            <div className="contact-info-card">
              <FiMail className="contact-icon" size={28} />
              <h3>Email</h3>
              <p>
                <a href="mailto:thuviendfb@gmail.com">thuviendfb@gmail.com</a>
              </p>
            </div>
            <div className="contact-info-card">
              <FiClock className="contact-icon" size={28} />
              <h3>Giờ mở cửa</h3>
              <p>
                Thứ 2 – Chủ nhật: 9:00 – 21:00
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-form-section">
        <div className="contact-container">
          <div className="contact-form-wrapper">
            <div className="contact-form-text">
              <h2>Gửi tin nhắn</h2>
              <p>
                Có câu hỏi về mượn sách, hiến sách hoặc hợp tác? Điền form bên dưới hoặc nhắn
                fanpage Facebook D Free Book.
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Họ và tên</label>
                <input
                  {...register("name", { required: true })}
                  type="text"
                  id="name"
                  placeholder="Nhập họ tên"
                />
                {errors.name && <span className="error">Vui lòng nhập họ tên</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  {...register("email", {
                    required: true,
                    pattern: /^\S+@\S+\.\S+$/,
                  })}
                  type="email"
                  id="email"
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <span className="error">Email không hợp lệ</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="subject">Chủ đề</label>
                <select {...register("subject", { required: true })} id="subject">
                  <option value="">Chọn chủ đề</option>
                  <option value="general">Câu hỏi chung</option>
                  <option value="borrow">Mượn / trả sách</option>
                  <option value="donate">Hiến sách</option>
                  <option value="volunteer">Tình nguyện</option>
                  <option value="feedback">Góp ý</option>
                  <option value="other">Khác</option>
                </select>
                {errors.subject && (
                  <span className="error">Vui lòng chọn chủ đề</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="message">Nội dung</label>
                <textarea
                  {...register("message", { required: true })}
                  id="message"
                  rows="6"
                  placeholder="Nhập nội dung tin nhắn..."
                ></textarea>
                {errors.message && (
                  <span className="error">Vui lòng nhập nội dung</span>
                )}
              </div>

              <button type="submit" className="contact-submit-btn">
                <FiSend className="btn-icon" /> Gửi tin nhắn
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
