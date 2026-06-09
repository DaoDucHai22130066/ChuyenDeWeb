import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiHeart, FiMapPin } from 'react-icons/fi';
import './about.css';

const AboutUs = () => {
  return (
    <div className="about-page">
      <section className="about-hero-section">
        <div className="about-container">
          <h1 className="about-hero-title">Về D Free Book</h1>
          <p className="about-hero-subtitle">
            Thư viện cộng đồng — mượn sách miễn phí, đặt cọc hoàn lại, phí trễ hạn minh bạch
          </p>
        </div>
      </section>

      <section className="about-mission-section">
        <div className="about-container">
          <div className="about-mission-content">
            <div className="about-mission-text">
              <h2 className="about-section-title">Sứ mệnh</h2>
              <p className="about-mission-paragraph">
                D Free Book tin rằng &quot;một cuốn sách nằm im là một cuốn sách chết&quot;. Chúng tôi
                muốn lan tỏa văn hóa đọc đến mọi miền và kết nối những người yêu sách.
              </p>
              <p className="about-mission-paragraph">
                D Free Book vận hành theo mô hình mượn miễn phí, đặt cọc hoàn lại, phí trễ hạn rõ
                ràng và đóng góp tự nguyện để duy trì hoạt động lâu dài.
              </p>
            </div>
            <div className="about-mission-image">
              <img
                src="/assets/libraryinterior.jpg"
                alt="Không gian thư viện"
                className="about-mission-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="about-history-section">
        <div className="about-container">
          <h2 className="about-section-title about-history-title">Hành trình</h2>
          <div className="about-timeline">
            <div className="about-timeline-item">
              <div className="about-timeline-year">2017</div>
              <div className="about-timeline-content">
                <h3 className="about-timeline-event">Thành lập</h3>
                <p className="about-timeline-description">
                  D Free Book ra đời với mục tiêu xây dựng một thư viện cộng đồng dễ tiếp cận và minh bạch.
                </p>
              </div>
            </div>
            <div className="about-timeline-item">
              <div className="about-timeline-year">2020+</div>
              <div className="about-timeline-content">
                <h3 className="about-timeline-event">Mở rộng chi nhánh</h3>
                <p className="about-timeline-description">
                  Phát triển cơ sở Đại La và Cầu Giấy, đón hàng chục lượt độc giả mỗi ngày.
                </p>
              </div>
            </div>
            <div className="about-timeline-item">
              <div className="about-timeline-year">Hiện nay</div>
              <div className="about-timeline-content">
                <h3 className="about-timeline-event">Mượn sách online</h3>
                <p className="about-timeline-description">
                  Website và ứng dụng giúp độc giả tra cứu, đăng ký mượn sách từ mọi tỉnh thành.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-stats-section">
        <div className="about-container">
          <h2 className="about-stats-title">Con số biết nói</h2>
          <div className="about-stats-grid">
            <div className="about-stat-card">
              <FiBook size={40} className="about-stat-icon" />
              <h3 className="about-stat-number">10.000+</h3>
              <p className="about-stat-label">Đầu sách</p>
            </div>
            <div className="about-stat-card">
              <FiUsers size={40} className="about-stat-icon" />
              <h3 className="about-stat-number">2</h3>
              <p className="about-stat-label">Chi nhánh tại Hà Nội</p>
            </div>
            <div className="about-stat-card">
              <FiHeart size={40} className="about-stat-icon" />
              <h3 className="about-stat-number">4</h3>
              <p className="about-stat-label">Cam kết — miễn phí, cọc, trễ hạn, ủng hộ</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-facilities-section">
        <div className="about-container">
          <h2 className="about-section-title">Chi nhánh</h2>
          <div className="about-facilities-grid">
            <div className="about-facility-card">
              <img src="/assets/readingroom.webp" alt="Cs. Đại La" className="about-facility-img" onError={(e) => { e.target.src = '/assets/library.avif'; }} />
              <h3 className="about-facility-name">Cs. Đại La</h3>
              <p className="about-facility-description">Phố Đại La, Hà Nội — không gian ấm cúng cho độc giả trẻ.</p>
            </div>
            <div className="about-facility-card">
              <img src="/assets/libraryinterior.jpg" alt="Cs. Cầu Giấy" className="about-facility-img" onError={(e) => { e.target.src = '/assets/library.avif'; }} />
              <h3 className="about-facility-name">Cs. Cầu Giấy</h3>
              <p className="about-facility-description">Khu vực Cầu Giấy — tiếp đón bạn đọc mỗi ngày.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-section">
        <div className="about-container">
          <h2 className="about-cta-title">Tham gia cộng đồng</h2>
          <p className="about-cta-subtitle">Mượn sách, đóng góp tự nguyện, hoặc trở thành tình nguyện viên</p>
          <div className="about-cta-buttons">
            <Link to="/books" className="about-btn about-btn-primary">
              <FiBook className="about-icon" /> Xem sách
            </Link>
            <Link to="/lien-he" className="about-btn about-btn-secondary">
              <FiMapPin className="about-icon" /> Liên hệ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
