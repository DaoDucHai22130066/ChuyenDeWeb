import React, { useState, useEffect } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { getAuthToken } from "../../utils/auth";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import {
  FiBook, FiUsers, FiTrendingUp, FiRefreshCw, FiEdit2,
  FiTrash2, FiPlus, FiLogOut, FiMenu, FiX, FiDollarSign,
  FiBarChart2, FiCheckCircle, FiAlertCircle, FiClock
} from "react-icons/fi";
import "./admin-dashboard.css";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalBorrows: 0,
    totalDonations: 0,
  });
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === "overview") {
        const [booksRes, usersRes] = await Promise.all([
          axios.get(`${Server_URL}books`, { headers }),
          axios.get(`${Server_URL}users`, { headers }),
        ]);
        
        setStats({
          totalBooks: booksRes.data.totalBooks || 0,
          totalUsers: usersRes.data.totalUser || 0,
          totalBorrows: 0,
          totalDonations: 0,
        });
      } else if (activeTab === "books") {
        const res = await axios.get(`${Server_URL}books`, { headers });
        setBooks(res.data.books || []);
      } else if (activeTab === "users") {
        const res = await axios.get(`${Server_URL}users`, { headers });
        setUsers(res.data.user || []);
      } else if (activeTab === "borrows") {
        const res = await axios.get(`${Server_URL}books/issued-requests`, { headers });
        setBorrows(res.data.requestedBooks || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sách này?")) return;
    try {
      await axios.delete(`${Server_URL}books/${bookId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      showSuccessToast("Sách đã được xóa");
      fetchDashboardData();
    } catch (error) {
      showErrorToast("Lỗi khi xóa sách");
    }
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="stats-grid-admin">
        <div className="stat-card-admin">
          <div className="stat-icon-admin book">
            <FiBook />
          </div>
          <div className="stat-info">
            <div className="stat-value-admin">{stats.totalBooks}</div>
            <div className="stat-label-admin">Tổng Sách</div>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-icon-admin users">
            <FiUsers />
          </div>
          <div className="stat-info">
            <div className="stat-value-admin">{stats.totalUsers}</div>
            <div className="stat-label-admin">Người Dùng</div>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-icon-admin borrows">
            <FiRefreshCw />
          </div>
          <div className="stat-info">
            <div className="stat-value-admin">-</div>
            <div className="stat-label-admin">Sách Đang Mượn</div>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-icon-admin donations">
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <div className="stat-value-admin">-</div>
            <div className="stat-label-admin">Quyên Góp</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>📊 Hoạt Động Gần Đây</h3>
          <p>Chào mừng đến Admin Dashboard!</p>
          <div className="chart-placeholder">
            <FiBarChart2 size={48} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBooks = () => (
    <div className="table-section">
      <div className="table-header-section">
        <h2>Quản Lý Sách</h2>
        <button className="btn-primary">
          <FiPlus /> Thêm Sách Mới
        </button>
      </div>
      {books.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Sách</th>
              <th>Tác Giả</th>
              <th>Danh Mục</th>
              <th>Có Sẵn</th>
              <th>Tổng</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>#{book.id}</td>
                <td className="book-name">{book.title}</td>
                <td>{book.author}</td>
                <td><span className="badge">{book.category}</span></td>
                <td className="available">{book.availableCopies}</td>
                <td>{book.totalCopies}</td>
                <td>
                  <button className="btn-edit" title="Chỉnh sửa">
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteBook(book.id)}
                    title="Xóa"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state-admin">
          <FiBook size={48} />
          <p>Chưa có sách nào</p>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="table-section">
      <h2>Quản Lý Người Dùng</h2>
      {users.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Ngành</th>
              <th>Năm</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.stream || "-"}</td>
                <td>{user.year || "-"}</td>
                <td><span className="badge active">Hoạt Động</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state-admin">
          <FiUsers size={48} />
          <p>Chưa có người dùng nào</p>
        </div>
      )}
    </div>
  );

  const renderBorrows = () => (
    <div className="table-section">
      <h2>Yêu Cầu Mượn Sách</h2>
      {borrows.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người Dùng</th>
              <th>Sách</th>
              <th>Ngày Yêu Cầu</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map((borrow) => (
              <tr key={borrow.id}>
                <td>{borrow.userName}</td>
                <td>{borrow.title}</td>
                <td>{new Date(borrow.issueDate).toLocaleDateString("vi-VN")}</td>
                <td><span className="badge warning">Chờ Phê Duyệt</span></td>
                <td>
                  <button className="btn-approve" title="Phê Duyệt">
                    <FiCheckCircle />
                  </button>
                  <button className="btn-reject" title="Từ Chối">
                    <FiAlertCircle />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state-admin">
          <FiClock size={48} />
          <p>Không có yêu cầu mượn sách nào</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>⚙️ Admin Panel</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "overview", label: "📊 Tổng Quan", icon: FiBarChart2 },
            { id: "books", label: "📚 Quản Lý Sách", icon: FiBook },
            { id: "users", label: "👥 Quản Lý Người Dùng", icon: FiUsers },
            { id: "borrows", label: "🔄 Yêu Cầu Mượn", icon: FiRefreshCw },
            { id: "donations", label: "💝 Quyên Góp", icon: FiDollarSign },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={handleLogout}>
            <FiLogOut />
            {sidebarOpen && <span>Đăng Xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu />
          </button>
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <button className="btn-refresh" onClick={() => fetchDashboardData()}>
              <FiRefreshCw />
            </button>
          </div>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="loading-admin">
              <div className="spinner-admin"></div>
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "books" && renderBooks()}
              {activeTab === "users" && renderUsers()}
              {activeTab === "borrows" && renderBorrows()}
              {activeTab === "donations" && (
                <div className="table-section">
                  <h2>Quản Lý Quyên Góp</h2>
                  <div className="empty-state-admin">
                    <FiDollarSign size={48} />
                    <p>Chức năng quản lý quyên góp sẽ được tích hợp</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
