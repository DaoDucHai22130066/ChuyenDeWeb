import { Link } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import "./notfound.css";

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-card dfb-card">
        <div className="notfound-code">404</div>
        <h1>Không tìm thấy trang</h1>
        <p>
          Đường dẫn này không tồn tại hoặc đã bị chuyển đi. Bạn có thể quay lại trang chủ hoặc
          tìm sách ngay từ đây.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn-dfb-primary">
            <FiArrowLeft /> Về trang chủ
          </Link>
          <Link to="/books" className="btn-dfb-outline">
            <FiSearch /> Tìm sách
          </Link>
        </div>
      </div>
    </div>
  );
}