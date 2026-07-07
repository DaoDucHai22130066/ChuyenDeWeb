import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import "../../styles/components.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./AdminDashboard.css";
import { 
  FiGrid, FiClipboard, FiUsers, FiBook, FiShield, FiCheck, FiRefreshCw, FiX, 
  FiClock, FiCheckCircle, FiDollarSign, FiEye, FiChevronDown, FiChevronUp, 
  FiTrash2, FiLock, FiUnlock, FiSearch, FiFilter, FiMail, FiBarChart2, FiTrendingUp
} from "react-icons/fi";

const STATUS_VI = {
  pending: "Chờ duyệt",
  awaiting_payment: "Chờ cọc",
  paid: "Đã cọc",
  approved: "Đã duyệt",
  dispatched: "Đang giao",
  delivered: "Đã giao",
  returned: "Đã trả",
  cancelled: "Đã hủy",
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [booksCount, setBooksCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc tìm kiếm & trạng thái phiếu mượn
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState(null);

  const getHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("authToken")}`
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = getHeaders();
    try {
      const [resTickets, resUsers, resBooks, resReviews, resContacts] = await Promise.all([
        axios.get(`${Server_URL}tickets/admin/all`, { headers }),
        axios.get(`${Server_URL}users/admin/all`, { headers }),
        axios.get(`${Server_URL}books`),
        axios.get(`${Server_URL}reviews/admin/all`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${Server_URL}contact/admin/all`, { headers }).catch(() => ({ data: [] }))
      ]);

      setTickets(resTickets.data.tickets || []);
      setUsers(resUsers.data.users || []);
      setBooksCount(resBooks.data.books?.length || 0);
      setReviews(resReviews.data.reviews || resReviews.data || []);
      setContacts(resContacts.data.contacts || resContacts.data || []);
    } catch (error) {
      showErrorToast("Không thể tải toàn bộ dữ liệu hệ thống.");
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // HÀM CORE DÙNG CHUNG: Cập nhật trạng thái phiếu mượn
  const updateTicketStatus = async (ticketId, nextStatus) => {
    try {
      const response = await axios.put(
        `${Server_URL}tickets/admin/update-status/${ticketId}`,
        { status: nextStatus },
        { headers: getHeaders() }
      );
      if (response.data.error) return showErrorToast(response.data.message);
      
      showSuccessToast(`Đã chuyển trạng thái sang: ${STATUS_VI[nextStatus]}`);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: nextStatus } : t));
    } catch (error) {
      showErrorToast("Lỗi thay đổi trạng thái phiếu.");
    }
  };

  // Cập nhật trạng thái người dùng (Khóa/Mở)
  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === "active" ? "banned" : "active";
    try {
      await axios.put(`${Server_URL}users/admin/update-status/${user._id}`, { status: nextStatus }, { headers: getHeaders() });
      showSuccessToast(nextStatus === "active" ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản thành công");
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: nextStatus } : u));
    } catch {
      showErrorToast("Không thể thay đổi trạng thái tài khoản.");
    }
  };

  // Tính toán số liệu thống kê bằng useMemo tránh Render lại vô ích
  const stats = useMemo(() => {
    let revenue = 0;
    let pendingTickets = 0;
    tickets.forEach(t => {
      if (t.status === "paid" || t.status === "approved" || t.status === "delivered") {
        revenue += Number(t.depositAmount || 0) + Number(t.shippingFee || 0);
      }
      if (t.status === "pending") pendingTickets++;
    });
    return { revenue, pendingTickets, totalTickets: tickets.length };
  }, [tickets]);

  // Bộ lọc danh sách phiếu mượn thông minh
  const filteredTickets = useMemo(() => {
    const q = ticketSearch.toLowerCase().trim();
    return tickets.filter(t => {
      const matchQ = !q || t._id.toLowerCase().includes(q) || t.userId?.name?.toLowerCase().includes(q);
      const matchS = ticketStatusFilter === "all" || t.status === ticketStatusFilter;
      return matchQ && matchS;
    });
  }, [tickets, ticketSearch, ticketStatusFilter]);

  if (loading) {
    return (
      <div className="admin-loading-wrapper" style={{ textAlign: "center", padding: "5rem" }}>
        <FiRefreshCw className="spin-animation" style={{ fontSize: "2.5rem", color: "#2563eb" }} />
        <p style={{ marginTop: "1rem", color: "#64748b" }}>Đang đồng bộ dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <motion.div className="admin-dashboard-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="row g-0">
        {/* Navigation Sidebar */}
        <aside className="col-md-3 col-lg-2 admin-sidebar">
          <div className="admin-nav-brand"><FiShield /> <span>Hệ quản trị</span></div>
          <nav className="admin-nav-menu">
            <button className={`nav-link-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}><FiGrid /> Tổng quan</button>
            <button className={`nav-link-btn ${activeTab === "tickets" ? "active" : ""}`} onClick={() => setActiveTab("tickets")}><FiClipboard /> Phiếu mượn ({stats.pendingTickets})</button>
            <button className={`nav-link-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}><FiUsers /> Độc giả</button>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="col-md-9 col-lg-10 admin-main-content">
          {activeTab === "overview" && (
            <section className="admin-tab-pane">
              <div className="admin-page-hero">
                <h1 className="admin-page-title">Chào Quản trị viên</h1>
                <p>Dưới đây là hoạt động tổng thể của thư viện hôm nay.</p>
              </div>

              <div className="admin-overview-grid">
                <div className="stat-card">
                  <div className="icon bg-blue"><FiClipboard /></div>
                  <div className="info"><h3>{stats.totalTickets}</h3><span>Tổng đơn mượn</span></div>
                </div>
                <div className="stat-card">
                  <div className="icon bg-orange"><FiClock /></div>
                  <div className="info"><h3>{stats.pendingTickets}</h3><span>Đơn chờ duyệt</span></div>
                </div>
                <div className="stat-card">
                  <div className="icon bg-green"><FiDollarSign /></div>
                  <div className="info"><h3>{stats.revenue.toLocaleString("vi-VN")} đ</h3><span>Tiền quỹ đặt cọc</span></div>
                </div>
                <div className="stat-card">
                  <div className="icon bg-purple"><FiBook /></div>
                  <div className="info"><h3>{booksCount}</h3><span>Đầu sách kho</span></div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "tickets" && (
            <section className="admin-tab-pane">
              <div className="admin-books-toolbar" style={{ gridTemplateColumns: "1fr auto" }}>
                <div className="admin-search-box">
                  <FiSearch />
                  <input type="text" placeholder="Tìm theo Mã đơn hoặc tên người mượn..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} />
                </div>
                <select value={ticketStatusFilter} onChange={e => setTicketStatusFilter(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  {Object.entries(STATUS_VI).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                </select>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Người mượn</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Thao tác nhanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(ticket => (
                      <tr key={ticket._id}>
                        <td>#{ticket._id.slice(-6).toUpperCase()}</td>
                        <td>{ticket.userId?.name || "N/A"}</td>
                        <td>{(Number(ticket.depositAmount || 0) + Number(ticket.shippingFee || 0)).toLocaleString("vi-VN")} đ</td>
                        <td><span className={`badge-status ${ticket.status}`}>{STATUS_VI[ticket.status]}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {ticket.status === "pending" && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => updateTicketStatus(ticket._id, "approved")}><FiCheck /> Duyệt</button>
                            )}
                            {ticket.status === "paid" && (
                              <button className="btn btn-sm btn-outline-primary" onClick={() => updateTicketStatus(ticket._id, "dispatched")}>Giao hàng</button>
                            )}
                            <button className="btn btn-icon" onClick={() => setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id)}>
                              {expandedTicket === ticket._id ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "users" && (
            <section className="admin-tab-pane">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={`badge-status ${u.status === "active" ? "approved" : "cancelled"}`}>{u.status === "active" ? "Hoạt động" : "Bị Khóa"}</span></td>
                        <td>
                          <button className={`btn btn-sm ${u.status === "active" ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => handleToggleUserStatus(u)}>
                            {u.status === "active" ? <FiLock /> : <FiUnlock />} {u.status === "active" ? "Khóa" : "Mở"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;