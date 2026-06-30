import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBookOpen,
  FiChevronDown,
  FiHeart,
  FiHome,
  FiInfo,
  FiLogIn,
  FiLogOut,
  FiMail,
  FiMenu,
  FiShoppingBag,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import "./navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const { cartCount, clearLocalCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    clearLocalCart();
    window.dispatchEvent(new Event("cart:auth-changed"));
    navigate("/login");
  };

  const isActive = (...paths) => paths.some((path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  );

  return (
    <nav className="navbar navbar-expand-lg dfb-navbar">
      <div className="container-dfb dfb-navbar-inner">
        <motion.div className="navbar-brand" whileHover={{ y: -1 }}>
          <Link to="/" onClick={closeMenu}>
            <span className="logo-icon"><FiBookOpen /></span>
            <span className="dfb-brand-copy">
              <strong>D Free Book</strong>
              <small>Thư viện cộng đồng</small>
            </span>
          </Link>
        </motion.div>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto dfb-main-nav">
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/") ? "active" : ""}`} to="/" onClick={closeMenu}>
                <FiHome /> Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/books", "/bookdetails", "/category") ? "active" : ""}`} to="/books" onClick={closeMenu}>
                <FiBookOpen /> Kho sách
              </Link>
            </li>
            <li className="nav-item dropdown">
              <button className={`nav-link dropdown-toggle ${isActive("/ve-d-free-book", "/aboutus", "/hoat-dong", "/doi-tac") ? "active" : ""}`} type="button" data-bs-toggle="dropdown">
                <FiUsers /> Cộng đồng <FiChevronDown className="nav-chevron" />
              </button>
              <ul className="dropdown-menu dfb-nav-dropdown">
                <li><Link className="dropdown-item" to="/ve-d-free-book" onClick={closeMenu}><FiInfo /> Về D Free Book</Link></li>
                <li><Link className="dropdown-item" to="/hoat-dong" onClick={closeMenu}><FiUsers /> Hoạt động</Link></li>
                <li><Link className="dropdown-item" to="/doi-tac" onClick={closeMenu}><FiHeart /> Đối tác & truyền thông</Link></li>
                <li><Link className="dropdown-item" to="/lien-he" onClick={closeMenu}><FiMail /> Liên hệ</Link></li>
              </ul>
            </li>
          </ul>

          <div className="dfb-navbar-actions">
            <Link className={`dfb-cart-link ${isActive("/cart") ? "active" : ""}`} to="/cart" onClick={closeMenu}>
              <FiShoppingBag />
              <span>Giỏ sách</span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </Link>

            {token ? (
              <div className="dropdown">
                <button className="btn dfb-account-button dropdown-toggle" data-bs-toggle="dropdown" type="button">
                  <span className="dfb-account-avatar"><FiUser /></span>
                  <span><strong>Tài khoản</strong><small>Hồ sơ độc giả</small></span>
                  <FiChevronDown />
                </button>
                <ul className="dropdown-menu dropdown-menu-end dfb-nav-dropdown">
                  <li><Link className="dropdown-item" to="/user" onClick={closeMenu}><FiUser /> Hồ sơ mượn sách</Link></li>
                  <li><Link className="dropdown-item" to="/wishlist" onClick={closeMenu}><FiHeart /> Sách yêu thích</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" type="button" onClick={handleLogout}><FiLogOut /> Đăng xuất</button></li>
                </ul>
              </div>
            ) : (
              <div className="dfb-auth-actions">
                <Link className="btn btn-login" to="/login" onClick={closeMenu}><FiLogIn /> Đăng nhập</Link>
                <Link className="btn btn-register" to="/register" onClick={closeMenu}>Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
