import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiChevronDown,
  FiClipboard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import "./adminnavbar.css";

export default function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  const { clearLocalCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    try {
      clearLocalCart();
      window.dispatchEvent(new Event("cart:auth-changed"));
    } catch {
      // Cart cleanup is best-effort during logout.
    }
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const getRoleLabel = (value) => {
    if (value === "admin") return "Quản trị";
    if (value === "librarian") return "Thủ thư";
    if (value === "user") return "Độc giả";
    return "Quản trị";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light admin-navbar-dfb">
      <div className="container-fluid admin-navbar-container">
        <Link className="navbar-brand admin-brand" to="/admin" onClick={() => setMenuOpen(false)}>
          <span className="admin-brand-mark">DFB</span>
          <span>
            <strong>D Free Book</strong>
            <small>Không gian quản trị</small>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto admin-navbar-links">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                to="/admin"
                onClick={() => setMenuOpen(false)}
              >
                <FiGrid /> Tổng quan
              </Link>
            </li>
            <li className="nav-item dropdown">
              <button
                className={`nav-link dropdown-toggle border-0 ${
                  isActive("/admin/addbook") || isActive("/admin/viewbook") ? "active" : ""
                }`}
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FiBookOpen /> Kho sách <FiChevronDown className="admin-nav-chevron" />
              </button>
              <ul className="dropdown-menu admin-dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/admin/addbook" onClick={() => setMenuOpen(false)}>
                    <FiPlus /> Thêm sách mới
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin/viewbook" onClick={() => setMenuOpen(false)}>
                    <FiBookOpen /> Danh sách sách
                  </Link>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/admin/tickets") ? "active" : ""}`}
                to="/admin/tickets"
                onClick={() => setMenuOpen(false)}
              >
                <FiClipboard /> Phiếu mượn
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav admin-account-zone">
            {token ? (
              <li className="nav-item dropdown">
                <button
                  className="btn admin-account-btn dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  type="button"
                >
                  <span className="admin-account-avatar">A</span>
                  <span className="admin-account-text">
                    <strong>Quản trị viên</strong>
                    <small>{getRoleLabel(role)}</small>
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end admin-dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/" onClick={() => setMenuOpen(false)}>
                      <FiHome /> Về trang chủ
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                      <FiLogOut /> Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="btn admin-account-btn" to="/login"><FiUser /> Đăng nhập</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
