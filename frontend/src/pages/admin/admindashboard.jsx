import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import "../../styles/components.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./AdminDashboard.css";
import { 
  FiGrid, 
  FiClipboard, 
  FiUsers, 
  FiBook, 
  FiShield, 
  FiCheck, 
  FiRefreshCw, 
  FiX, 
  FiInfo, 
  FiClock, 
  FiFileText, 
  FiCheckCircle, 
  FiXCircle,
  FiDollarSign,
  FiEye,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";

const STATUS_VI = {
  pending: "Chờ duyệt",
  awaiting_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  approved: "Đã duyệt",
  dispatched: "Đang giao",
  delivered: "Đã giao",
  returned: "Đã trả",
  closed: "Hoàn tất",
  cancelled: "Hủy",
};

const DEPOSIT_STATUS_VI = {
  none: "Không có",
  pending: "Chờ xác nhận",
  held: "Đã cọc",
  refunded: "Đã hoàn",
  forfeited: "Bị tịch thu",
};

const AdminDashboard = ({ initialSection = "dashboard" }) => {
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [ticketTransactions, setTicketTransactions] = useState({});

  const token = localStorage.getItem("authToken");

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Chưa phân loại";

  const totalUsers = useMemo(() => users.filter((user) => user.role === "user").length, [users]);
  const totalBooks = books.length;
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "pending" || ticket.status === "awaiting_payment").length;

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value) + " đ";

  const canConfirmCash = (ticket) =>
    ticket.status === "pending" &&
    ticket.depositStatus === "pending" &&
    ticket.paymentMethod === "cash";

  const canApproveTicket = (ticket) =>
    ticket.status === "pending" &&
    ticket.depositStatus === "held";

  const fetchUsers = async () => {
    try {
      const result = await axios.get(`${Server_URL}users`);
      setUsers(result.data.user || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const result = await axios.get(`${Server_URL}books`);
      setBooks(result.data.books || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const result = await axios.get(`${Server_URL}tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(result.data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchTicketTransactions = async (ticketId) => {
    try {
      const result = await axios.get(`${Server_URL}tickets/${ticketId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTicketTransactions((prev) => ({
        ...prev,
        [ticketId]: result.data.transactions || [],
      }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleTicketAction = async (ticketId, action, paymentMethod = "cash") => {
    try {
      const response = await axios.put(
        `${Server_URL}tickets/${ticketId}/status`,
        { action, payment_method: paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        showErrorToast(response.data.message);
        return;
      }

      showSuccessToast(response.data.message || "Đã cập nhật trạng thái phiếu mượn.");
      fetchTickets();
      fetchBooks();
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Không cập nhật được phiếu mượn.");
    }
  };

  const toggleTicketExpand = async (ticketId) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
      if (!ticketTransactions[ticketId]) {
        await fetchTicketTransactions(ticketId);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBooks();
    fetchTickets();
  }, []);

  useEffect(() => {
    setSelectedSection(initialSection);
  }, [initialSection]);

  return (
    <motion.div
      className="admin-dashboard"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.36 }}
    >
      <div className="row g-0">
        <nav className="col-md-3 col-lg-2 admin-sidebar">
          <h4 className="admin-sidebar-title">
            <FiShield className="sidebar-icon-title" /> Panel Quản trị
          </h4>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "dashboard" ? "active" : ""}`}
                onClick={() => setSelectedSection("dashboard")}
              >
                <FiGrid /> Tổng quan
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "tickets" ? "active" : ""}`}
                onClick={() => setSelectedSection("tickets")}
              >
                <FiClipboard /> Phiếu mượn
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "users" ? "active" : ""}`}
                onClick={() => setSelectedSection("users")}
              >
                <FiUsers /> Độc giả
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "books" ? "active" : ""}`}
                onClick={() => setSelectedSection("books")}
              >
                <FiBook /> Kho sách
              </button>
            </li>
          </ul>
        </nav>

        <main className="col-md-9 col-lg-10 admin-main">
          {selectedSection === "dashboard" && (
            <>
              <h2 className="admin-section-title">Tổng quan hệ thống</h2>

              <div className="stats-grid">
                <div className="stat-card books">
                  <div className="stat-icon-wrapper">
                    <FiBook />
                  </div>
                  <div className="stat-details">
                    <h3>Tổng số sách</h3>
                    <p>{totalBooks}</p>
                  </div>
                </div>
                <div className="stat-card users">
                  <div className="stat-icon-wrapper">
                    <FiUsers />
                  </div>
                  <div className="stat-details">
                    <h3>Tổng độc giả</h3>
                    <p>{totalUsers}</p>
                  </div>
                </div>
                <div className="stat-card borrowed">
                  <div className="stat-icon-wrapper">
                    <FiClipboard />
                  </div>
                  <div className="stat-details">
                    <h3>Tổng lượt mượn</h3>
                    <p>{totalTickets}</p>
                  </div>
                </div>
                <div className="stat-card librarians">
                  <div className="stat-icon-wrapper">
                    <FiClock />
                  </div>
                  <div className="stat-details">
                    <h3>Phiếu chờ xử lý</h3>
                    <p>{pendingTickets}</p>
                  </div>
                </div>
              </div>

              <div className="admin-table-container">
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <h3 className="mb-0 fs-5 fw-bold text-success">Phiếu mượn gần đây</h3>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedSection("tickets")}>
                    Xem tất cả
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Độc giả</th>
                      <th>Danh sách sách</th>
                      <th>Ngày mượn</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.slice(0, 5).map((ticket) => (
                      <tr key={ticket._id}>
                        <td>{ticket.userId?.name || ticket.userId?.email || "—"}</td>
                        <td>{ticket.books.map((book) => book.title).join(", ")}</td>
                        <td>{ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>
                          <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                            {STATUS_VI[ticket.status] || ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedSection === "tickets" && (
            <>
              <h2 className="admin-section-title">Quản lý Phiếu mượn</h2>
              <div className="admin-table-container">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="ticket-item">
                    <div className="ticket-header" onClick={() => toggleTicketExpand(ticket._id)}>
                      <div className="ticket-header-main">
                        <button className="expand-btn">
                          {expandedTicket === ticket._id ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        <div className="ticket-header-info">
                          <div className="ticket-id">#{ticket._id}</div>
                          <div className="ticket-reader">
                            {ticket.userId?.name || ticket.userId?.email || "—"}
                          </div>
                        </div>
                        <div className="ticket-books-list">
                          {ticket.books.map((book) => book.title).join(", ")}
                        </div>
                        <div className="ticket-dates">
                          <small>Mượn: {ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</small>
                          {ticket.dueDate && <small>Hạn: {new Date(ticket.dueDate).toLocaleDateString("vi-VN")}</small>}
                        </div>
                      </div>
                      <div className="ticket-header-status">
                        <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                          {STATUS_VI[ticket.status] || ticket.status}
                        </span>
                      </div>
                    </div>

                    {expandedTicket === ticket._id && (
                      <div className="ticket-expanded">
                        <div className="ticket-details-grid">
                          <div className="detail-section">
                            <h4>Chi phí</h4>
                            <div className="detail-row">
                              <span>Tiền cọc:</span>
                              <strong>{formatCurrency(ticket.depositAmount || 0)}</strong>
                            </div>
                            <div className="detail-row">
                              <span>Phí giao hàng:</span>
                              <strong>{formatCurrency(ticket.shippingFee || 0)}</strong>
                            </div>
                            <div className="detail-row">
                              <span>Phạt trễ hạn:</span>
                              <strong>{formatCurrency(ticket.fineAmount || 0)}</strong>
                            </div>
                          </div>

                          <div className="detail-section">
                            <h4>Trạng thái</h4>
                            <div className="detail-row">
                              <span>Cọc:</span>
                              <span className="badge">{DEPOSIT_STATUS_VI[ticket.depositStatus] || ticket.depositStatus}</span>
                            </div>
                            <div className="detail-row">
                              <span>Giao hàng:</span>
                              <span className="badge">{ticket.shippingStatus === "none" ? "Nhận tại quầy" : ticket.shippingStatus}</span>
                            </div>
                            {ticket.shippingAddress && (
                              <div className="detail-row">
                                <span>Địa chỉ:</span>
                                <span>{ticket.shippingAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ticket-transactions">
                          <h4>Lịch sử giao dịch</h4>
                          {ticketTransactions[ticket._id]?.length ? (
                            <div className="transactions-list">
                              {ticketTransactions[ticket._id].map((txn) => (
                                <div key={txn._id} className="transaction-item">
                                  <span className="txn-type">{txn.type}</span>
                                  <span className="txn-amount">{formatCurrency(txn.amount)}</span>
                                  <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-transactions">Chưa có giao dịch</p>
                          )}
                        </div>

                        <div className="ticket-actions">
                          {canConfirmCash(ticket) && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleTicketAction(ticket._id, "confirm_cash", "cash")}
                            >
                              <FiCheck /> Thu tiền mặt
                            </button>
                          )}

                          {ticket.status === "pending" &&
                            ticket.depositStatus === "pending" &&
                            ticket.paymentMethod === "vnpay" && (
                              <div className="admin-alert admin-alert-info">
                                <FiDollarSign /> Chờ thanh toán VNPAY
                              </div>
                            )}

                          {canApproveTicket(ticket) && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleTicketAction(ticket._id, "approve")}
                            >
                              <FiCheck /> Phê duyệt
                            </button>
                          )}

                          {ticket.status === "approved" && (
                            <>
                              {ticket.shippingStatus === "none" && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleTicketAction(ticket._id, "deliver")}
                                >
                                  <FiCheckCircle /> Giao xong
                                </button>
                              )}
                              {ticket.shippingStatus === "pending" && (
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleTicketAction(ticket._id, "dispatch")}
                                >
                                  <FiRefreshCw /> Bắt đầu giao
                                </button>
                              )}
                              {(ticket.shippingStatus === "dispatched" || ticket.shippingStatus === "none") && (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => handleTicketAction(ticket._id, "return")}
                                >
                                  <FiRefreshCw /> Xác nhận đã trả
                                </button>
                              )}
                            </>
                          )}
                          {ticket.status === "returned" && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleTicketAction(ticket._id, "settle_deposit")}
                            >
                              <FiDollarSign /> Quyết toán cọc
                            </button>
                          )}
                          {ticket.depositStatus === "forfeited" && ticket.fineAmount > 0 && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleTicketAction(ticket._id, "settle_outstanding_fine", "cash")}
                            >
                              <FiDollarSign /> Thanh toán phạt còn lại
                            </button>
                          )}
                          {["pending", "awaiting_payment"].includes(ticket.status) && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleTicketAction(ticket._id, "cancel")}
                            >
                              <FiX /> Hủy
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedSection === "users" && (
            <>
              <h2 className="admin-section-title">Quản lý Độc giả</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Họ và tên</th>
                      <th>Địa chỉ Email</th>
                      <th>Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user._id || index}>
                        <td>{index + 1}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`status-badge ${user.role === 'admin' ? 'rejected' : 'approved'}`}>
                            {user.role === 'admin' ? 'Thủ thư' : 'Độc giả'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedSection === "books" && (
            <>
              <h2 className="admin-section-title">Kho sách thư viện</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên sách</th>
                      <th>Tác giả</th>
                      <th>Thể loại</th>
                      <th>Tổng số bản</th>
                      <th>Sẵn có</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book, index) => (
                      <tr key={book._id || index}>
                        <td>{index + 1}</td>
                        <td className="fw-bold">{book.title}</td>
                        <td>{book.author}</td>
                        <td>{getCategoryLabel(book)}</td>
                        <td>{book.totalCopies}</td>
                        <td>
                          <span className={`status-badge ${book.availableCopies > 0 ? 'returned' : 'rejected'}`}>
                            {book.availableCopies} cuốn
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
