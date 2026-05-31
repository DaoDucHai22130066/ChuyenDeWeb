import React, { useState, useEffect } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import "./home.css";
import { Link } from "react-router-dom";
import { FiBook, FiUser, FiClock, FiCalendar, FiDollarSign, FiShield, FiUsers } from "react-icons/fi";
import Preloader from "../../components/Preloader";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCategories: 0,
    totalActiveStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Chưa phân loại";

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(Server_URL + "home");
      if (!data.error) {
        setStats(data.stats || {});
        setCategories(data.categories || []);
        setNewArrivals(data.newArrivals || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Preloader />;

  return (
    <div className="library-homepage">
      <header className="hero-section has-bg-image">
        <div className="hero-overlay"></div>
        <div className="container-dfb hero-content">
          <h1 className="hero-title">Thư viện cộng đồng D Free Book</h1>
          <p className="hero-subtitle">
            Mượn sách miễn phí — đặt cọc niềm tin. Lan tỏa văn hóa đọc đến mọi người.
          </p>
          <div className="hero-buttons">
            <Link to="/books" className="btn-dfb-primary">
              <FiBook size={18} />
              Khám phá sách
            </Link>
            <Link to="/ve-d-free-book" className="btn-dfb-outline" style={{ marginLeft: "0.75rem", color: "white", borderColor: "white" }}>
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </header>

      <section className="three-no-section container-dfb">
        <h2 className="section-title">Thư viện 3 không</h2>
        <p className="section-subtitle">Hoạt động trên nguyên tắc tự giác và niềm tin</p>
        <div className="three-no-grid">
          <div className="three-no-card">
            <FiDollarSign className="three-no-icon" />
            <h3>Không thu phí</h3>
            <p>Mượn sách hoàn toàn miễn phí, không mất bất kỳ khoản phí nào.</p>
          </div>
          <div className="three-no-card">
            <FiShield className="three-no-icon" />
            <h3>Không đặt cọc</h3>
            <p>Chúng tôi tin vào độc giả — đặt cọc bằng niềm tin thay vì tiền.</p>
          </div>
          <div className="three-no-card">
            <FiUsers className="three-no-icon" />
            <h3>Không giới hạn</h3>
            <p>Mọi đối tượng, mọi thể loại sách đều được chào đón.</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container-dfb">
          <div className="stats-grid-dfb">
            <div className="stat-card-dfb">
              <FiBook className="stat-icon" style={{ fontSize: "2rem", color: "var(--dfb-primary)" }} />
              <h3>{stats.totalCategories || 0}+</h3>
              <p>Danh mục sách</p>
            </div>
            <div className="stat-card-dfb">
              <FiBook className="stat-icon" style={{ fontSize: "2rem", color: "var(--dfb-primary)" }} />
              <h3>{stats.totalBooks || 0}+</h3>
              <p>Đầu sách</p>
            </div>
            <div className="stat-card-dfb">
              <FiUser className="stat-icon" style={{ fontSize: "2rem", color: "var(--dfb-primary)" }} />
              <h3>{stats.totalActiveStudents || 0}</h3>
              <p>Độc giả đang hoạt động</p>
            </div>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <div className="container-dfb">
          <h2 className="section-title">Danh mục sách</h2>
          <p className="section-subtitle">Tìm sách theo chủ đề bạn quan tâm</p>
          <div className="categories-grid">
            {categories.map((cat, index) => (
              <div key={index} className="category-card dfb-card">
                <div className="category-img-container">
                  <img
                    src={cat.coverImage || "/assets/library.avif"}
                    alt={cat.category}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/assets/library.avif"; }}
                  />
                </div>
                <div className="category-info">
                  <h3>{cat.category}</h3>
                  <p>{cat.count} cuốn</p>
                  <Link to={`/books?category=${encodeURIComponent(cat.category)}`} className="btn-dfb-outline">
                    Xem sách
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center" style={{ marginTop: "2rem" }}>
            <Link to="/category" className="btn-dfb-primary">
              Xem tất cả danh mục
            </Link>
          </div>
        </div>
      </section>

      <section className="na-section">
        <div className="container-dfb">
          <h2 className="section-title">Sách mới</h2>
          <p className="section-subtitle">Vừa được bổ sung vào thư viện</p>
          <div className="na-grid-container">
            {newArrivals.map((book, index) => (
              <Link key={index} to={`/bookdetails/${book._id}`} className="na-book-item dfb-card">
                <div className="na-cover-wrapper">
                  <img
                    src={book.coverImage || "/assets/library.avif"}
                    alt={book.title}
                    className="na-cover-image"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/assets/library.avif"; }}
                  />
                </div>
                <div className="na-book-info">
                  <h3 className="na-book-title">{book.title}</h3>
                  <p className="na-book-author">{book.author}</p>
                  <span className="na-book-category">{getCategoryLabel(book)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hours-section">
        <div className="container-dfb">
          <h2 className="section-title">Giờ mở cửa</h2>
          <div className="hours-grid">
            <div className="hours-card dfb-card">
              <FiClock className="hours-icon" />
              <h3>Cs. Đại La</h3>
              <p>Thứ 2 – Chủ nhật: 9:00 – 21:00</p>
            </div>
            <div className="hours-card dfb-card">
              <FiCalendar className="hours-icon" />
              <h3>Cs. Cầu Giấy</h3>
              <p>Thứ 2 – Chủ nhật: 9:00 – 21:00</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}