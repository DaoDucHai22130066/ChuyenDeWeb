import React, { useState, useEffect } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { getAuthToken } from "../../utils/auth";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { FiBook, FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiLogOut } from "react-icons/fi";
import "./dashboard.css";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    currentlyIssued: 0,
    pendingRequests: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [profileRes, borrowRes] = await Promise.all([
        axios.get(`${Server_URL}users/profile`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }),
        axios.get(`${Server_URL}books/issued`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }),
      ]);

      const userData = profileRes.data.user;
      setUser(userData);
      setFormData(userData);

      const borrows = borrowRes.data.issuedBooks || [];
      setBorrowHistory(borrows);
      calculateStats(borrows);
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (borrows) => {
    const stats = {
      totalBorrowed: borrows.length,
      currentlyIssued: borrows.filter(b => b.status === "Issued").length,
      pendingRequests: borrows.filter(b => b.status === "Requested").length,
      overdue: borrows.filter(b => b.status === "Overdue").length,
    };
    setStats(stats);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Xin chào, {user?.name}! 👋</h1>
          <p>Quản lý sách mượn và hồ sơ cá nhân của bạn</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <FiLogOut /> Đăng Xuất
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiBook />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBorrowed}</div>
            <div className="stat-label">Tổng Sách Mượn</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.currentlyIssued}</div>
            <div className="stat-label">Sách Đang Mượn</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <FiClock />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-label">Yêu Cầu Chờ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <FiAlertCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">Quá Hạn</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Profile Card */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Hồ Sơ Cá Nhân</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="btn-secondary"
            >
              <FiEdit2 /> {editMode ? "Hủy" : "Chỉnh Sửa"}
            </button>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="profile-info">
              <div className="info-row">
                <FiUser className="info-icon" />
                <div>
                  <label>Tên</label>
                  <p>{user?.name}</p>
                </div>
              </div>
              <div className="info-row">
                <FiMail className="info-icon" />
                <div>
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>
              </div>
              {user?.phone && (
                <div className="info-row">
                  <FiPhone className="info-icon" />
                  <div>
                    <label>Điện Thoại</label>
                    <p>{user?.phone}</p>
                  </div>
                </div>
              )}
              {user?.address && (
                <div className="info-row">
                  <FiMapPin className="info-icon" />
                  <div>
                    <label>Địa Chỉ</label>
                    <p>{user?.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Borrow History */}
        <div className="borrow-section">
          <div className="section-header">
            <h2>Lịch Sử Mượn Sách</h2>
          </div>

          {borrowHistory.length > 0 ? (
            <div className="borrow-table">
              <div className="table-header">
                <div>Tên Sách</div>
                <div>Tác Giả</div>
                <div>Ngày Mượn</div>
                <div>Hạn Trả</div>
                <div>Trạng Thái</div>
              </div>
              {borrowHistory.map((borrow, idx) => (
                <div key={idx} className="table-row">
                  <div className="book-title">{borrow.title}</div>
                  <div className="book-author">{borrow.author}</div>
                  <div>
                    {new Date(borrow.issueDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div>
                    {new Date(borrow.dueDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div>
                    <span className={`status-badge status-${borrow.status.toLowerCase()}`}>
                      {borrow.status === "Issued" && "Đang Mượn"}
                      {borrow.status === "Requested" && "Chờ Phê Duyệt"}
                      {borrow.status === "Returned" && "Đã Trả"}
                      {borrow.status === "Overdue" && "Quá Hạn"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FiBook size={48} />
              <p>Bạn chưa mượn sách nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
