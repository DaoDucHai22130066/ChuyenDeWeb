import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./adminnavbar.css";

export default function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    try {
      clearCart();
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
            <small>Khu vực quản trị</small>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Mở menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto admin-navbar-links">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                to="/admin"
                onClick={() => setMenuOpen(false)}
              >
                Bảng điều khiển
              </Link>
            </li>
            <li className="nav-item dropdown">
              <Link
                className={`nav-link dropdown-toggle ${isActive("/admin/addbook") || isActive("/admin/viewbook") ? "active" : ""}`}
                to="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Sách
              </Link>
              <ul className="dropdown-menu admin-dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/admin/addbook" onClick={() => setMenuOpen(false)}>
                    Thêm sách
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin/viewbook" onClick={() => setMenuOpen(false)}>
                    Danh sách sách
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
                Phiếu mượn
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
                    <Link className="dropdown-item" to="/" onClick={() => setMenuOpen(false)}>Về trang chủ</Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="btn admin-account-btn" to="/login">Đăng nhập</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
