import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiMail } from 'react-icons/fi';
import './footer.css';

const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="library-footer">
      <div className="footer-container">
        <div className="footer-tagline">
          <p>
            D Free Book là một thư viện cộng đồng cho mượn sách miễn phí và đặt cọc niềm tin.
          </p>
        </div>

        <div className="footer-main">
          <div className="footer-column">
            <h3 className="footer-heading">Trang</h3>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link" onClick={handleLinkClick}>Trang chủ</Link></li>
              <li><Link to="/ve-d-free-book" className="footer-link" onClick={handleLinkClick}>Về D Free Book</Link></li>
              <li><Link to="/books" className="footer-link" onClick={handleLinkClick}>Sách</Link></li>
              <li><Link to="/hoat-dong" className="footer-link" onClick={handleLinkClick}>Hoạt động</Link></li>
              <li><Link to="/doi-tac" className="footer-link" onClick={handleLinkClick}>Đối tác & truyền thông</Link></li>
              <li><Link to="/lien-he" className="footer-link" onClick={handleLinkClick}>Liên hệ</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Hỗ trợ</h3>
            <ul className="footer-links">
              <li><Link to="/chinh-sach/ho-tro" className="footer-link" onClick={handleLinkClick}>Chính sách hỗ trợ</Link></li>
              <li><Link to="/chinh-sach/doi-tra" className="footer-link" onClick={handleLinkClick}>Chính sách đổi trả</Link></li>
              <li><Link to="/chinh-sach/bao-mat" className="footer-link" onClick={handleLinkClick}>Chính sách bảo mật</Link></li>
              <li><Link to="/chinh-sach/dieu-khoan" className="footer-link" onClick={handleLinkClick}>Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Giữ liên lạc</h3>
            <ul className="footer-contact-info">
              <li className="contact-item">
                <FiMail className="contact-icon" />
                <a href="mailto:thuviendfb@gmail.com" className="footer-link">thuviendfb@gmail.com</a>
              </li>
            </ul>
            <div className="footer-social">
              <a
                href="https://www.facebook.com/dfreebook"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <FiFacebook />
              </a>
              <a
                href="https://www.instagram.com/dfree.book"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FiInstagram />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} D Free Book. Mượn sách miễn phí — đặt cọc niềm tin.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
