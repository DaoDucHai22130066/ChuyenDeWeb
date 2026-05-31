import { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import "./profile.css";
import { getAuthToken } from "../../utils/auth";
import { showErrorToast } from "../../utils/toasthelper";

const STATUS_VI = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Returned: "Đã trả",
  Rejected: "Từ chối",
};

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);

  async function fetchProfile() {
    try {
      const response = await axios.get(`${Server_URL}users/profile`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUser(response.data.user);
    } catch {
      showErrorToast("Không tải được hồ sơ.");
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${Server_URL}tickets/me`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setTickets(response.data.tickets || []);
    } catch {
      showErrorToast("Không tải được phiếu mượn.");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTickets();
  }, []);

  if (!user) return <p className="loading">Đang tải...</p>;

  return (
    <div className="profile-page">
      <div className="profile-container container-dfb">
        <div className="profile-info card">
          <h1>{user.name}</h1>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <div className="profile-sections">
          <div className="section-card issued-books">
            <h2>Phiếu mượn của tôi</h2>
            {tickets.length === 0 ? (
              <p>Bạn chưa có phiếu mượn nào.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Danh sách sách</th>
                    <th>Ngày mượn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>{ticket._id.slice(-6).toUpperCase()}</td>
                      <td>{ticket.books.map((book) => book.title).join(", ")}</td>
                      <td>{ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</td>
                      <td><span className="badge issued">{STATUS_VI[ticket.status] || ticket.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
