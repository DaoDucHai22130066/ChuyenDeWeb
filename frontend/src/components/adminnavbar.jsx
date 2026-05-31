import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import "./adminnavbar.css";

export default function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
      try { clearCart(); } catch (e) {}
      navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light admin-navbar-dfb shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/admin">
          D Free Book — Quản trị
        </Link>

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
              <Link className="nav-link" to="/admin">Bảng điều khiển</Link>
            </li>
            <li className="nav-item dropdown">
              <Link
                className="nav-link dropdown-toggle"
                to="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Sách
              </Link>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/admin/addbook">Thêm sách</Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin/viewbook">Danh sách sách</Link>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/admin/tickets">Phiếu mượn</Link>
            </li>
          </ul>

          <ul className="navbar-nav">
            {token ? (
              <li className="nav-item dropdown">
                <button
                  className="btn btn-light dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  type="button"
                >
                  Tài khoản
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/">Về trang chủ</Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" type="button" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-light" to="/login">Đăng nhập</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
