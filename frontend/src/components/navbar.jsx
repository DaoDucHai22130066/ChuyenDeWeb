import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiBook, FiMenu, FiX } from "react-icons/fi";
import "./navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-book-icon"><FiBook color="white" /></div>
          <div className="logo-text-wrap">
            <div className="logo-title">D Free Book</div>
            <div className="logo-sub">Thư viện cộng đồng</div>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
          <Link to="/" className="navbar-link" onClick={() => setMenuOpen(false)}>Trang chủ</Link>
          <Link to="/books" className="navbar-link" onClick={() => setMenuOpen(false)}>Sách</Link>
          <Link to="/posts" className="navbar-link" onClick={() => setMenuOpen(false)}>Bài viết</Link>
          <Link to="/supports" className="navbar-link" onClick={() => setMenuOpen(false)}>Quyên góp & ủng hộ</Link>
          <Link to="/contact" className="navbar-link" onClick={() => setMenuOpen(false)}>Liên hệ</Link>
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Search */}
          <div className="navbar-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Tìm kiếm sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <FiSearch />
              </button>
            </form>
          </div>

          {/* Book Icon */}
          <Link to="/my-books" className="navbar-icon-btn" title="Sách của bạn">
            <FiBook size={22} />
          </Link>

          {/* Auth Section */}
          <div className="navbar-auth">
            {token && user ? (
              <div className="navbar-user-wrap">
                <button className="user-btn">
                  <div className="user-avatar">{(user.name || "U").charAt(0)}</div>
                  <div className="user-name-text">{user.name}</div>
                  <div className="user-chevron">▾</div>
                </button>
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-link">Hồ sơ của tôi</Link>
                  <Link to="/my-books" className="dropdown-link">Sách đã mượn</Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-link logout">Đăng xuất</button>
                </div>
              </div>
            ) : (
              <div className="">
                <Link to="/login" className="auth-btn-outline">Đăng nhập</Link>
                <Link to="/register" className="auth-btn-solid" style={{marginLeft: '0.6rem'}}>Đăng ký</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-toggle"
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-6 shadow-lg">
          <div className="flex flex-col space-y-3 mt-4">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-primary font-medium text-lg px-2">Trang chủ</Link>
            <Link to="/books" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-primary font-medium text-lg px-2">Tủ sách</Link>
            <Link to="/category" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-primary font-medium text-lg px-2">Phân loại</Link>
            <Link to="/aboutus" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-primary font-medium text-lg px-2">Giới thiệu</Link>
            <Link to="/contactus" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-primary font-medium text-lg px-2">Liên hệ</Link>
            
            <div className="border-t border-gray-100 my-4 py-4">
              {token ? (
                <>
                  <Link to="/user" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-primary font-medium text-lg px-2 mb-3">Hồ sơ người dùng</Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left text-red-600 font-medium text-lg px-2">Đăng xuất</button>
                </>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full text-center px-6 py-2.5 rounded-full text-primary border border-primary font-medium hover:bg-gray-50">Đăng nhập</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="w-full text-center px-6 py-2.5 rounded-full bg-primary text-white font-medium shadow-md shadow-primary/30">Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}