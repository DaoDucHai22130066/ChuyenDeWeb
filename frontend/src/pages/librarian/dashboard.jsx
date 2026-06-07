import React, { useState, useEffect } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { getAuthToken } from "../../utils/auth";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import {
  FiCheckCircle, FiX, FiClock, FiBook, FiUsers, FiTrendingUp,
  FiLogOut, FiMenu, FiRefreshCw, FiAlertCircle, FiBarChart2
} from "react-icons/fi";
import "./librarian-dashboard.css";

export default function LibrarianDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    approved: 0,
    pending: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLibrarianData();
  }, [activeTab]);

  const fetchLibrarianData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === "overview" || activeTab === "requests") {
        const res = await axios.get(`${Server_URL}books/issued-requests`, { headers });
        const requests = res.data.requestedBooks || [];
        setPendingRequests(requests);

        setStats({
          totalRequests: requests.length,
          approved: requests.filter(r => r.status === "Issued").length,
          pending: requests.filter(r => r.status === "Requested").length,
          overdue: requests.filter(r => r.status === "Overdue").length,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.put(
        `${Server_URL}books/issued/${requestId}`,
        { status: "Issued" },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      showSuccessToast("Yêu cầu đã được phê duyệt");
      fetchLibrarianData();
    } catch (error) {
      showErrorToast("Lỗi khi phê duyệt yêu cầu");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.delete(
        `${Server_URL}books/issued/${requestId}`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      showSuccessToast("Yêu cầu đã bị từ chối");
      fetchLibrarianData();
    } catch (error) {
      showErrorToast("Lỗi khi từ chối yêu cầu");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="stats-grid-lib">
        <div className="stat-card-lib">
          <div className="stat-icon-lib requests">
            <FiClock />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalRequests}</div>
            <div className="stat-label">Tổng Yêu Cầu</div>
          </div>
        </div>
        <div className="stat-card-lib">
          <div className="stat-icon-lib approved">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Đã Duyệt</div>
          </div>
        </div>
        <div className="stat-card-lib">
          <div className="stat-icon-lib pending">
            <FiBook />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Chờ Duyệt</div>
          </div>
        </div>
        <div className="stat-card-lib">
          <div className="stat-icon-lib overdue">
            <FiAlertCircle />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">Quá Hạn</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Hành Động Nhanh</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <FiCheckCircle />
            <span>Phê Duyệt Yêu Cầu</span>
          </button>
          <button className="action-btn">
            <FiBook />
            <span>Quản Lý Kho</span>
          </button>
          <button className="action-btn">
            <FiUsers />
            <span>Quản Lý Thành Viên</span>
          </button>
          <button className="action-btn">
            <FiTrendingUp />
            <span>Xem Báo Cáo</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="requests-section">
      <div className="section-header-lib">
        <h2>📋 Yêu Cầu Mượn Sách</h2>
        <div className="filter-buttons">
          <button className="filter-btn active">Tất Cả</button>
          <button className="filter-btn">Chờ Duyệt</button>
          <button className="filter-btn">Đã Duyệt</button>
          <button className="filter-btn">Từ Chối</button>
        </div>
      </div>

      {pendingRequests.length > 0 ? (
        <div className="requests-grid">
          {pendingRequests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div>
                  <h4>{request.title}</h4>
                  <p className="author">Tác giả: {request.author}</p>
                </div>
                <span className={`status-badge status-${request.status?.toLowerCase()}`}>
                  {request.status === "Requested" && "Chờ Duyệt"}
                  {request.status === "Issued" && "Đã Duyệt"}
                  {request.status === "Returned" && "Đã Trả"}
                  {request.status === "Overdue" && "Quá Hạn"}
                </span>
              </div>

              <div className="request-details">
                <div className="detail-item">
                  <span className="label">Người Yêu Cầu:</span>
                  <span className="value">{request.userName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{request.userEmail}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày Yêu Cầu:</span>
                  <span className="value">
                    {new Date(request.issueDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Hạn Trả:</span>
                  <span className="value">
                    {new Date(request.dueDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {request.status === "Requested" && (
                <div className="request-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApproveRequest(request.id)}
                  >
                    <FiCheckCircle /> Phê Duyệt
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    <FiX /> Từ Chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-lib">
          <FiClock size={48} />
          <p>Không có yêu cầu mượn sách nào</p>
        </div>
      )}
    </div>
  );

  const renderReturns = () => (
    <div className="returns-section">
      <h2>🔄 Xử Lý Trả Sách</h2>
      <div className="empty-state-lib">
        <FiBook size={48} />
        <p>Chức năng xử lý trả sách sẽ được tích hợp</p>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="inventory-section">
      <h2>📦 Quản Lý Kho</h2>
      <div className="empty-state-lib">
        <FiBook size={48} />
        <p>Chức năng quản lý kho sẽ được tích hợp</p>
      </div>
    </div>
  );

  return (
    <div className="librarian-dashboard">
      {/* Sidebar */}
      <aside className={`lib-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header-lib">
          <h2>📚 Librarian Panel</h2>
          <button className="sidebar-toggle-lib" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ×
          </button>
        </div>

        <nav className="sidebar-nav-lib">
          {[
            { id: "overview", label: "📊 Tổng Quan" },
            { id: "requests", label: "📋 Yêu Cầu Mượn" },
            { id: "returns", label: "🔄 Xử Lý Trả" },
            { id: "inventory", label: "📦 Quản Lý Kho" },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-item-lib ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer-lib">
          <button className="btn-logout-lib" onClick={handleLogout}>
            <FiLogOut /> Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lib-main">
        <div className="lib-header">
          <button className="menu-toggle-lib" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu />
          </button>
          <h1>Librarian Dashboard</h1>
          <div className="header-actions-lib">
            <button className="btn-refresh-lib" onClick={() => fetchLibrarianData()}>
              <FiRefreshCw />
            </button>
          </div>
        </div>

        <div className="lib-content">
          {loading ? (
            <div className="loading-lib">
              <div className="spinner-lib"></div>
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "requests" && renderRequests()}
              {activeTab === "returns" && renderReturns()}
              {activeTab === "inventory" && renderInventory()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
