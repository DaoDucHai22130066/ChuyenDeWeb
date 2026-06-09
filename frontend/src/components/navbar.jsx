import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import { useCart } from "../context/CartContext";
import "./navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const { cartCount, clearLocalCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    clearLocalCart();
    window.dispatchEvent(new Event('cart:auth-changed'));
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg dfb-navbar">
      <div className="container">
        <motion.div className="navbar-brand" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="logo-icon">📚</span>
            D Free Book
          </Link>
        </motion.div>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/") ? "active" : ""}`} to="/">
                Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/ve-d-free-book") || isActive("/aboutus") ? "active" : ""}`}
                to="/ve-d-free-book"
              >
                Về D Free Book
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/books") ? "active" : ""}`} to="/books">
                Sách
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/cart") ? "active" : ""}`} to="/cart">
                Giỏ sách {cartCount > 0 ? <span className="cart-count-badge">{cartCount}</span> : null}
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/hoat-dong") ? "active" : ""}`} to="/hoat-dong">
                Hoạt động
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/lien-he") || isActive("/contactus") ? "active" : ""}`}
                to="/lien-he"
              >
                Liên hệ
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav align-items-lg-center gap-2">
            {token ? (
              <li className="nav-item dropdown">
                <motion.button
                  className="btn btn-profile dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tài khoản
                </motion.button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/user">
                      Hồ sơ mượn sách
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/wishlist">
                      Sách yêu thích
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item" type="button" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link className="btn btn-login" to="/login">
                      Đăng nhập
                    </Link>
                  </motion.div>
                </li>
                <li className="nav-item">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link className="btn btn-register" to="/register">
                      Đăng ký
                    </Link>
                  </motion.div>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
