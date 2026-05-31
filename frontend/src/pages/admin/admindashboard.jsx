import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import "../../styles/components.css";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import "./AdminDashboard.css";

const AdminDashboard = ({ initialSection = "dashboard" }) => {
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [tickets, setTickets] = useState([]);

  const token = localStorage.getItem("authToken");

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Chưa phân loại";

  const totalUsers = useMemo(() => users.filter((user) => user.role === "user").length, [users]);
  const totalBooks = books.length;
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "Pending").length;

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

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const response = await axios.put(
        `${Server_URL}tickets/${ticketId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        showErrorToast(response.data.message);
        return;
      }

      showSuccessToast(response.data.message || "Ticket updated.");
      fetchTickets();
      fetchBooks();
    } catch (error) {
      showErrorToast(error.response?.data?.message || "Không cập nhật được phiếu mượn.");
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
          <h4 className="admin-sidebar-title">📌 Admin Panel</h4>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "dashboard" ? "active" : ""}`}
                onClick={() => setSelectedSection("dashboard")}
              >
                📊 Dashboard
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "tickets" ? "active" : ""}`}
                onClick={() => setSelectedSection("tickets")}
              >
                🧾 Phiếu mượn
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "users" ? "active" : ""}`}
                onClick={() => setSelectedSection("users")}
              >
                👥 Users
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "books" ? "active" : ""}`}
                onClick={() => setSelectedSection("books")}
              >
                📖 Books
              </button>
            </li>
          </ul>
        </nav>

        <main className="col-md-9 col-lg-10 admin-main">
          {selectedSection === "dashboard" && (
            <>
              <h2 className="admin-section-title">📊 Dashboard Overview</h2>

              <div className="stats-grid">
                <div className="stat-card books">
                  <h3>Total Books</h3>
                  <p>{totalBooks}</p>
                </div>
                <div className="stat-card users">
                  <h3>Total Users</h3>
                  <p>{totalUsers}</p>
                </div>
                <div className="stat-card borrowed">
                  <h3>Total Tickets</h3>
                  <p>{totalTickets}</p>
                </div>
                <div className="stat-card librarians">
                  <h3>Pending Tickets</h3>
                  <p>{pendingTickets}</p>
                </div>
              </div>

              <div className="admin-table-container">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="mb-0">Recent Tickets</h3>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedSection("tickets")}>View all</button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Books</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.slice(0, 5).map((ticket) => (
                      <tr key={ticket._id}>
                        <td>{ticket.userId?.name || ticket.userId?.email || "—"}</td>
                        <td>{ticket.books.map((book) => book.title).join(", ")}</td>
                        <td>{ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>{ticket.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedSection === "tickets" && (
            <>
              <h2 className="admin-section-title">🧾 Borrow Tickets</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Books</th>
                      <th>Borrow Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td>{ticket.userId?.name || ticket.userId?.email || "—"}</td>
                        <td>{ticket.books.map((book) => book.title).join(", ")}</td>
                        <td>{ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>{ticket.status}</td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => updateTicketStatus(ticket._id, "Approved")}
                              disabled={ticket.status !== "Pending"}
                            >
                              Phê duyệt
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => updateTicketStatus(ticket._id, "Returned")}
                              disabled={ticket.status !== "Approved"}
                            >
                              Đã trả
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => updateTicketStatus(ticket._id, "Rejected")}
                              disabled={ticket.status !== "Pending"}
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedSection === "users" && (
            <>
              <h2 className="admin-section-title">👥 Users Management</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user._id || index}>
                        <td>{index + 1}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedSection === "books" && (
            <>
              <h2 className="admin-section-title">📖 Books Inventory</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Total Copies</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book, index) => (
                      <tr key={book._id || index}>
                        <td>{index + 1}</td>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{getCategoryLabel(book)}</td>
                        <td>{book.totalCopies}</td>
                        <td>{book.availableCopies}</td>
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
