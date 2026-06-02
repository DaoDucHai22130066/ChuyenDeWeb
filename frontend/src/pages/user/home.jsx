import React, { useState, useEffect } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import "./home.css";
import { Link, useNavigate } from "react-router-dom";
import { FiBook, FiUser, FiClock, FiCalendar, FiHeart, FiShield, FiSearch, FiArrowRight, FiTruck, FiCheckCircle } from "react-icons/fi";
import Preloader from "../../components/Preloader";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [heroQuery, setHeroQuery] = useState("");
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCategories: 0,
    totalActiveStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Chưa phân loại";
  const getBookId = (book) => book?._id || book?.id;

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
      console.error("Không tải được dữ liệu trang chủ:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleHeroSearch = (event) => {
    event.preventDefault();
    const query = heroQuery.trim();
    navigate(query ? `/books?q=${encodeURIComponent(query)}` : "/books");
  };

  if (loading) return <Preloader />;

  return (
    <div className="library-homepage">
      <header className="home-hero-section">
        <div className="home-hero-overlay"></div>
        <div className="container-dfb home-hero-grid">
          <div className="home-hero-content">
            <span className="home-hero-badge">Thư viện cộng đồng • Mượn sách minh bạch</span>
            <h1 className="home-hero-title">Mượn sách dễ hơn, đọc sách nhiều hơn cùng D Free Book</h1>
            <p className="home-hero-subtitle">
              Khám phá kho sách cộng đồng, gửi yêu cầu mượn online, theo dõi phiếu mượn và nhận sách theo cách thuận tiện nhất cho bạn.
            </p>

            <form className="home-hero-search" onSubmit={handleHeroSearch}>
              <FiSearch className="home-search-icon" />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Tìm sách, tác giả hoặc chủ đề bạn quan tâm..."
              />
              <button type="submit">Tìm sách</button>
            </form>

            <div className="home-hero-actions">
              <Link to="/books" className="btn-dfb-primary">
                <FiBook size={18} /> Khám phá sách
              </Link>
              <Link to="/ve-d-free-book" className="btn-dfb-outline home-hero-outline">
                Tìm hiểu thêm <FiArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="home-hero-card" aria-label="Tổng quan thư viện">
            <div className="home-featured-book">
              <div className="home-book-stack stack-one"></div>
              <div className="home-book-stack stack-two"></div>
              <div className="home-book-cover">
                <span>DFB</span>
                <strong>Đọc là sẻ chia</strong>
              </div>
            </div>
            <div className="home-hero-mini-stats">
              <div>
                <strong>{stats.totalBooks || 0}+</strong>
                <span>Đầu sách</span>
              </div>
              <div>
                <strong>{stats.totalCategories || 0}+</strong>
                <span>Danh mục</span>
              </div>
              <div>
                <strong>{stats.totalActiveStudents || 0}</strong>
                <span>Độc giả</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="home-promise-section container-dfb">
        <div className="home-section-heading">
          <span>Cam kết D Free Book</span>
          <h2>Thư viện cộng đồng rõ ràng, dễ dùng và thân thiện</h2>
          <p>Mọi quy trình đều được thiết kế để độc giả hiểu nhanh, mượn nhanh và yên tâm khi sử dụng.</p>
        </div>
        <div className="home-promise-grid">
          <article className="home-promise-card dfb-card">
            <FiBook className="home-promise-icon" />
            <h3>Mượn miễn phí</h3>
            <p>Độc giả mượn sách không mất phí mượn, chỉ cần tuân thủ thời hạn và quy định bảo quản sách.</p>
          </article>
          <article className="home-promise-card dfb-card">
            <FiShield className="home-promise-icon" />
            <h3>Đặt cọc hoàn lại</h3>
            <p>Khoản cọc giúp bảo đảm sách và được hoàn lại khi sách được trả đúng quy định.</p>
          </article>
          <article className="home-promise-card dfb-card">
            <FiClock className="home-promise-icon" />
            <h3>Phí trễ hạn minh bạch</h3>
            <p>Mức phí trễ hạn được hiển thị rõ để bạn chủ động theo dõi lịch trả sách.</p>
          </article>
          <article className="home-promise-card dfb-card">
            <FiHeart className="home-promise-icon" />
            <h3>Ủng hộ tự nguyện</h3>
            <p>Độc giả có thể đóng góp hoặc trở thành hội viên nếu muốn đồng hành lâu dài.</p>
          </article>
        </div>
      </section>

      <section className="home-process-section">
        <div className="container-dfb">
          <div className="home-section-heading light">
            <span>Quy trình mượn sách</span>
            <h2>Chỉ vài bước để bắt đầu đọc</h2>
          </div>
          <div className="home-process-grid">
            <div className="home-process-card">
              <FiSearch />
              <h3>1. Tìm sách</h3>
              <p>Lọc theo danh mục, chi nhánh, tình trạng còn sách hoặc tìm bằng tên sách/tác giả.</p>
            </div>
            <div className="home-process-card">
              <FiCheckCircle />
              <h3>2. Gửi yêu cầu</h3>
              <p>Thêm sách vào giỏ và gửi yêu cầu mượn từng cuốn để quản trị viên xử lý chính xác.</p>
            </div>
            <div className="home-process-card">
              <FiTruck />
              <h3>3. Nhận sách</h3>
              <p>Nhận tại quầy hoặc chọn giao tận nơi nếu bạn cần hỗ trợ vận chuyển.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats-section">
        <div className="container-dfb home-stats-grid">
          <div className="home-stat-card dfb-card">
            <FiBook className="home-stat-icon" />
            <h3>{stats.totalCategories || 0}+</h3>
            <p>Danh mục sách</p>
          </div>
          <div className="home-stat-card dfb-card">
            <FiBook className="home-stat-icon" />
            <h3>{stats.totalBooks || 0}+</h3>
            <p>Đầu sách</p>
          </div>
          <div className="home-stat-card dfb-card">
            <FiUser className="home-stat-icon" />
            <h3>{stats.totalActiveStudents || 0}</h3>
            <p>Độc giả đang hoạt động</p>
          </div>
        </div>
      </section>

      <section className="home-categories-section">
        <div className="container-dfb">
          <div className="home-section-heading">
            <span>Khám phá theo chủ đề</span>
            <h2>Danh mục sách nổi bật</h2>
            <p>Tìm nhanh những nhóm sách phù hợp với nhu cầu học tập, nghiên cứu và giải trí.</p>
          </div>
          <div className="home-categories-grid">
            {categories.map((cat, index) => (
              <Link key={index} to={`/books?category=${encodeURIComponent(cat.category)}`} className="home-category-card dfb-card">
                <div className="home-category-image">
                  <img
                    src={cat.coverImage || "/assets/library.avif"}
                    alt={cat.category}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/assets/library.avif"; }}
                  />
                </div>
                <div className="home-category-info">
                  <span>{cat.count} cuốn</span>
                  <h3>{cat.category}</h3>
                  <p>Xem sách <FiArrowRight /></p>
                </div>
              </Link>
            ))}
          </div>
          <div className="home-center-action">
            <Link to="/category" className="btn-dfb-primary">Xem tất cả danh mục</Link>
          </div>
        </div>
      </section>

      <section className="home-new-section">
        <div className="container-dfb">
          <div className="home-section-heading">
            <span>Sách mới cập nhật</span>
            <h2>Vừa được bổ sung vào thư viện</h2>
            <p>Các đầu sách mới nhất đang chờ bạn khám phá.</p>
          </div>
          <div className="home-new-grid">
            {newArrivals.map((book, index) => (
              <Link key={index} to={`/bookdetails/${getBookId(book)}`} className="home-book-card dfb-card">
                <div className="home-book-image">
                  <img
                    src={book.coverImage || "/assets/library.avif"}
                    alt={book.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/assets/library.avif"; }}
                  />
                </div>
                <div className="home-book-info">
                  <span>{getCategoryLabel(book)}</span>
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-hours-section">
        <div className="container-dfb">
          <div className="home-section-heading">
            <span>Không gian đọc</span>
            <h2>Giờ mở cửa</h2>
          </div>
          <div className="home-hours-grid">
            <div className="home-hours-card dfb-card">
              <FiClock className="home-hours-icon" />
              <h3>Cs. Đại La</h3>
              <p>Thứ 2 – Chủ nhật: 9:00 – 21:00</p>
            </div>
            <div className="home-hours-card dfb-card">
              <FiCalendar className="home-hours-icon" />
              <h3>Cs. Cầu Giấy</h3>
              <p>Thứ 2 – Chủ nhật: 9:00 – 21:00</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
