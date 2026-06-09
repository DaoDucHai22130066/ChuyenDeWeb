import { useEffect, useMemo, useState } from "react";
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
  FiClock, 
  FiCheckCircle, 
  FiDollarSign,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiSearch,
  FiFilter,
  FiTag,
  FiPlus
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

const SHIPPING_STATUS_VI = {
  none: "Chưa giao",
  pending: "Chờ giao hàng",
  dispatched: "Đang giao",
  delivered: "Đã giao",
  returned: "Đã trả",
};

const TRANSACTION_TYPE_VI = {
  deposit: "Tiền cọc",
  shipping: "Phí giao hàng",
  fine: "Phí phạt",
  refund: "Hoàn cọc",
  deposit_refund: "Hoàn cọc",
  outstanding_fine: "Phạt còn lại",
  settle_outstanding_fine: "Thanh toán phạt còn lại",
};

const TRANSACTION_STATUS_VI = {
  pending: "Chờ xử lý",
  completed: "Hoàn tất",
  success: "Thành công",
  failed: "Thất bại",
  refunded: "Đã hoàn",
  cancelled: "Đã hủy",
};

const ACTION_SUCCESS_VI = {
  confirm_cash: "Đã xác nhận thanh toán.",
  approve: "Đã phê duyệt phiếu mượn.",
  dispatch: "Đã chuyển phiếu sang trạng thái đang giao.",
  deliver: "Đã xác nhận giao xong.",
  deliver_and_confirm_cash: "Đã xác nhận giao & đã thu tiền.",
  return: "Đã xác nhận độc giả trả sách.",
  settle_deposit: "Đã quyết toán tiền cọc.",
  settle_outstanding_fine: "Đã xác nhận thanh toán phí phạt còn lại.",
  cancel: "Đã hủy phiếu mượn.",
};

const USER_ROLE_LABEL = {
  admin: "Thủ thư",
  user: "Độc giả",
};

const USER_STATUS_FILTERS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "locked", label: "Đã khóa" },
  { value: "unverified", label: "Chưa xác thực email" },
];

const USER_ROLE_FILTERS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "user", label: "Độc giả" },
  { value: "admin", label: "Thủ thư" },
];

const emptyUserForm = {
  name: "",
  email: "",
  role: "user",
  stream: "",
  year: "",
  phone: "",
};

const AdminDashboard = ({ initialSection = "dashboard" }) => {
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [isUserSaving, setIsUserSaving] = useState(false);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [ticketTransactions, setTicketTransactions] = useState({});

  const token = localStorage.getItem("authToken");

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Chưa phân loại";

  const totalUsers = useMemo(() => users.filter((user) => user.role === "user").length, [users]);
  const filteredUsers = useMemo(() => {
    const searchTerm = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch = !searchTerm || [
        user.name,
        user.email,
        user.stream,
        user.phone,
        user.year,
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === "all" ||
        (userStatusFilter === "active" && user.isActive !== false) ||
        (userStatusFilter === "locked" && user.isActive === false) ||
        (userStatusFilter === "unverified" && !user.emailVerified);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);
  const filteredCategories = useMemo(() => {
    const searchTerm = categorySearch.trim().toLowerCase();

    return categories.filter((category) =>
      !searchTerm || category.name?.toLowerCase().includes(searchTerm)
    );
  }, [categories, categorySearch]);
  const totalBooks = books.length;
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "pending" || ticket.status === "awaiting_payment").length;

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value) + " đ";
  const getBookPrice = (book) => {
    const price = Number(book?.price);
    return Number.isFinite(price) && price > 0 ? price : 0;
  };
  const getTicketPayableTotal = (ticket) =>
    Number(ticket?.depositAmount || 0) + Number(ticket?.shippingFee || 0);
  const getTicketBookTitleList = (ticket) =>
    ticket.books?.map((book) => book.title).filter(Boolean).join(", ") || "—";

  const getStatusLabel = (value) => STATUS_VI[value] || "Chưa cập nhật";
  const getDepositStatusLabel = (value) => DEPOSIT_STATUS_VI[value] || "Chưa cập nhật";
  const getShippingStatusLabel = (value) => SHIPPING_STATUS_VI[value] || "Chưa cập nhật";
  const getTransactionTypeLabel = (value) => TRANSACTION_TYPE_VI[value] || "Giao dịch";
  const getTransactionStatusLabel = (value) => TRANSACTION_STATUS_VI[value] || "Chưa cập nhật";

  // Cash should be collected when delivering, not at pending/approval stage
  // VNPay: chỉ show badge, không cho admin tự duyệt
  const isWaitingVnpay = (ticket) =>
    ticket.depositStatus === "pending" &&
    ticket.paymentMethod === "vnpay" &&
    ["pending", "awaiting_payment"].includes(ticket.status);

  const canApproveTicket = (ticket) =>
    ["pending", "paid"].includes(ticket.status) &&
    (ticket.paymentMethod === "vnpay" ? ticket.depositStatus === "held" : true);

  // Giao tận nơi: bắt đầu giao
  const canDispatch = (ticket) =>
    ticket.status === "approved" && ticket.shippingStatus === "pending";

  // Xác nhận đã giao (giao tận nơi)
  const canDeliver = (ticket) =>
    ticket.status === "dispatched" && ticket.shippingStatus === "dispatched";

  // Trả sách: chỉ sau khi delivered (cả quầy lẫn giao hàng)
  const canReturn = (ticket) =>
    ticket.status === "delivered";

  const canSettle = (ticket) =>
    ticket.status === "returned" && ticket.depositStatus === "held";

  const canSettleOutstanding = (ticket) =>
    ticket.depositStatus === "forfeited" && ticket.status !== "closed";

  const canCancel = (ticket) =>
    ["pending", "awaiting_payment"].includes(ticket.status);

  const fetchUsers = async () => {
    try {
      const result = await axios.get(`${Server_URL}admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(result.data.users || result.data.user || []);
    } catch (error) {
      console.error("Lỗi tải danh sách người dùng:", error);
    }
  };

  const getUserRoleLabel = (role) => USER_ROLE_LABEL[role] || "Chưa cập nhật";
  const getUserStatusLabel = (user) => (user?.isActive === false ? "Đã khóa" : "Đang hoạt động");
  const getAxiosErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

  const openUserEditor = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      stream: user.stream || "",
      year: user.year || "",
      phone: user.phone || "",
    });
  };

  const closeUserEditor = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setIsUserSaving(false);
  };

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const replaceUserInList = (updatedUser) => {
    setUsers((prev) => prev.map((user) => (user._id === updatedUser._id ? updatedUser : user)));
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;

    const payload = {
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      role: userForm.role,
      stream: userForm.role === "user" ? userForm.stream.trim() || null : null,
      year: userForm.role === "user" && userForm.year !== "" ? Number(userForm.year) : null,
      phone: userForm.phone.trim() || null,
    };

    try {
      setIsUserSaving(true);
      const response = await axios.put(`${Server_URL}admin/users/${editingUser._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      replaceUserInList(response.data.user);
      showSuccessToast("Đã cập nhật người dùng");
      closeUserEditor();
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể cập nhật người dùng"));
      setIsUserSaving(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextActive = user.isActive === false;
    const actionLabel = nextActive ? "mở khóa" : "khóa";

    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản ${user.email}?`)) {
      return;
    }

    try {
      const response = await axios.patch(
        `${Server_URL}admin/users/${user._id}/status`,
        { isActive: nextActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      replaceUserInList(response.data.user);
      showSuccessToast(response.data.message || `Đã ${actionLabel} tài khoản`);
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể cập nhật trạng thái tài khoản"));
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Xóa người dùng ${user.email}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      await axios.delete(`${Server_URL}admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      showSuccessToast("Đã xóa người dùng");
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể xóa người dùng"));
    }
  };

  const sortCategoriesByName = (items) =>
    [...items].sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));

  const fetchCategories = async () => {
    try {
      const result = await axios.get(`${Server_URL}categories`);
      setCategories(sortCategoriesByName(result.data.categories || []));
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  const replaceCategoryInList = (updatedCategory) => {
    setCategories((prev) =>
      sortCategoriesByName(prev.map((category) =>
        category._id === updatedCategory._id ? updatedCategory : category
      ))
    );
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    const name = categoryName.trim();

    if (!name) {
      showErrorToast("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setIsCategorySaving(true);
      const response = await axios.post(
        `${Server_URL}categories`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories((prev) => sortCategoriesByName([...prev, response.data.category]));
      setCategoryName("");
      showSuccessToast("Đã thêm danh mục");
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể thêm danh mục"));
    } finally {
      setIsCategorySaving(false);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setEditingCategoryName(category.name || "");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleUpdateCategory = async (category) => {
    const name = editingCategoryName.trim();

    if (!name) {
      showErrorToast("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setIsCategorySaving(true);
      const response = await axios.put(
        `${Server_URL}categories/${category._id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      replaceCategoryInList(response.data.category);
      cancelEditCategory();
      fetchBooks();
      showSuccessToast("Đã cập nhật danh mục");
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể cập nhật danh mục"));
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const bookCount = Number(category.bookCount || 0);
    const detail = bookCount > 0
      ? ` ${bookCount} sách thuộc danh mục này sẽ chuyển sang "Chưa phân loại".`
      : "";

    if (!window.confirm(`Xóa danh mục "${category.name}"?${detail}`)) {
      return;
    }

    try {
      await axios.delete(`${Server_URL}categories/${category._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories((prev) => prev.filter((item) => item._id !== category._id));
      if (editingCategoryId === category._id) {
        cancelEditCategory();
      }
      fetchBooks();
      showSuccessToast("Đã xóa danh mục");
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể xóa danh mục"));
    }
  };

  const fetchBooks = async () => {
    try {
      const result = await axios.get(`${Server_URL}books`);
      setBooks(result.data.books || []);
    } catch (error) {
      console.error("Lỗi tải danh sách sách:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const result = await axios.get(`${Server_URL}tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(result.data.tickets || []);
    } catch (error) {
      console.error("Lỗi tải danh sách phiếu mượn:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const result = await axios.get(`${Server_URL}admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(result.data.reviews || []);
    } catch (error) {
      console.error("Lỗi tải đánh giá:", error);
    }
  };

  const handleToggleReviewStatus = async (review) => {
    const newStatus = review.status === 'visible' ? 'hidden' : 'visible';
    try {
      await axios.put(`${Server_URL}admin/reviews/${review.id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccessToast(newStatus === 'hidden' ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá');
      fetchReviews();
    } catch {
      showErrorToast('Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try {
      await axios.delete(`${Server_URL}admin/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccessToast('Đã xóa đánh giá');
      fetchReviews();
    } catch {
      showErrorToast('Không thể xóa');
    }
  };

  // Thêm state để quản lý nội dung ô input của từng đánh giá
const [replyInputs, setReplyInputs] = useState({});

// Hàm bắt sự kiện khi Admin gõ chữ
const handleReplyChange = (reviewId, value) => {
    setReplyInputs(prev => ({ ...prev, [reviewId]: value }));
};

// Hàm gửi phản hồi lên Backend
const handleSendReply = async (reviewId) => {
    const admin_reply = replyInputs[reviewId];
    if (!admin_reply || admin_reply.trim() === '') {
        alert("Vui lòng nhập nội dung phản hồi!"); 
        return;
    }

    try {
        // Lấy đúng tên token trong project của bạn là "authToken"
        const userToken = localStorage.getItem("authToken"); 

        const res = await axios.put(`${Server_URL}admin/reviews/${reviewId}/reply`, 
            { admin_reply }, 
            { headers: { Authorization: `Bearer ${userToken}` } } 
        );

        if (res.data.success) {
            alert("Đã gửi phản hồi thành công!");
            
            // Cập nhật giao diện ngay lập tức
            setReviews(reviews.map(review => 
                review.id === reviewId ? { ...review, admin_reply: admin_reply } : review
            ));
            
            // Xóa rỗng ô nhập liệu
            setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
        }
    } catch (error) {
        console.error("Lỗi khi phản hồi:", error);
        alert("Có lỗi xảy ra khi gửi phản hồi.");
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
      console.error("Lỗi tải lịch sử giao dịch:", error);
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
        showErrorToast("Không thực hiện được thao tác. Vui lòng thử lại!");
        return;
      }

      showSuccessToast(ACTION_SUCCESS_VI[action] || "Đã cập nhật trạng thái phiếu mượn.");
      fetchTickets();
      fetchBooks();
    } catch {
      showErrorToast("Không cập nhật được phiếu mượn. Vui lòng thử lại!");
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
    fetchCategories();
    fetchBooks();
    fetchTickets();
    fetchReviews();
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
            <FiShield className="sidebar-icon-title" /> Bảng quản trị
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
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "categories" ? "active" : ""}`}
                onClick={() => setSelectedSection("categories")}
              >
                <FiTag /> Danh mục
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "reviews" ? "active" : ""}`}
                onClick={() => setSelectedSection("reviews")}
              >
                <FiCheckCircle /> Đánh giá
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
                        <td>
                          <div className="ticket-book-summary">
                            <strong>{ticket.books?.length || 0} cuốn</strong>
                            <span>{getTicketBookTitleList(ticket)}</span>
                          </div>
                        </td>
                        <td>{ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>
                          <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                            {getStatusLabel(ticket.status)}
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

              {/* Filter tabs */}
              <div className="ticket-filter-tabs">
                {[
                  { key: "all",              label: "Tất cả" },
                  { key: "pending",          label: "Chờ duyệt" },
                  { key: "awaiting_payment", label: "Chờ thanh toán" },
                  { key: "approved",         label: "Đã duyệt" },
                  { key: "dispatched",       label: "Đang giao" },
                  { key: "delivered",        label: "Đã giao" },
                  { key: "returned",         label: "Đã trả" },
                  { key: "closed",           label: "Hoàn tất" },
                  { key: "cancelled",        label: "Đã hủy" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`ticket-filter-btn ${ticketFilter === key ? "active" : ""}`}
                    onClick={() => setTicketFilter(key)}
                  >
                    {label}
                    {key !== "all" && (
                      <span className="ticket-filter-count">
                        {tickets.filter(t => t.status === key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="admin-table-container">
                {tickets
                  .filter(t => ticketFilter === "all" || t.status === ticketFilter)
                  .map((ticket) => (
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
                          <span className="ticket-books-count">{ticket.books?.length || 0} cuốn</span>
                          <span>{getTicketBookTitleList(ticket)}</span>
                        </div>
                        <div className="ticket-dates">
                          <small>Mượn: {ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</small>
                          {ticket.dueDate && <small>Hạn: {new Date(ticket.dueDate).toLocaleDateString("vi-VN")}</small>}
                        </div>
                      </div>
                      <div className="ticket-header-status">
                        <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                    </div>

                    {expandedTicket === ticket._id && (
                      <div className="ticket-expanded">

                        {/* Timeline trạng thái */}
                        <div className="ticket-timeline">
                          {[
                            { key: "awaiting",  label: "Chờ TT",   done: !["pending","awaiting_payment"].includes(ticket.status) || ticket.depositStatus === "held" },
                            { key: "pending",   label: "Chờ duyệt", done: !["pending","awaiting_payment"].includes(ticket.status) },
                            { key: "approved",  label: "Đã duyệt",  done: ["dispatched","delivered","returned","closed"].includes(ticket.status) },
                            { key: "delivered", label: "Đã giao",  done: ["delivered","returned","closed"].includes(ticket.status) },
                            { key: "returned",  label: "Trả sách",   done: ["returned","closed"].includes(ticket.status) },
                            { key: "closed",    label: "Hoàn tất",   done: ticket.status === "closed" },
                          ].map((step, idx, arr) => (
                            <div key={step.key} className="tl-step">
                              <div className={`tl-dot ${step.done ? "done" : ""} ${
                                (step.key === ticket.status ||
                                (step.key === "awaiting" && ticket.status === "awaiting_payment") ||
                                (step.key === "pending" && ticket.status === "pending"))
                                ? "current" : ""
                              }`} />
                              <span className="tl-label">{step.label}</span>
                              {idx < arr.length - 1 && <div className={`tl-line ${step.done ? "done" : ""}`} />}
                            </div>
                          ))}
                        </div>

                        <div className="ticket-details-grid">
                          <div className="detail-section ticket-books-detail">
                            <h4>Sách trong phiếu ({ticket.books?.length || 0})</h4>
                            <div className="ticket-book-lines">
                              {(ticket.books || []).map((book, index) => (
                                <div
                                  key={`${book._id || book.id || book.title || "book"}-${index}`}
                                  className="ticket-book-line"
                                >
                                  <div>
                                    <strong>{book.title || "Sách không tên"}</strong>
                                    {book.author && <span>{book.author}</span>}
                                  </div>
                                  <strong>{formatCurrency(getBookPrice(book))}</strong>
                                </div>
                              ))}
                            </div>
                          </div>

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
                            <div className="detail-row total-cost">
                              <span>Tổng cọc + ship:</span>
                              <strong>{formatCurrency(getTicketPayableTotal(ticket))}</strong>
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
                              <span className="badge">{getDepositStatusLabel(ticket.depositStatus)}</span>
                            </div>
                            <div className="detail-row">
                              <span>Giao hàng:</span>
                              <span className="badge">{getShippingStatusLabel(ticket.shippingStatus)}</span>
                            </div>
                            <div className="detail-row">
                              <span>Thanh toán:</span>
                              <span className="badge">
                                {ticket.paymentMethod === "vnpay" ? "VNPay" : "Tiền mặt"}
                              </span>
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
                                  <span className="txn-type">{getTransactionTypeLabel(txn.type)}</span>
                                  <span className="txn-amount">{formatCurrency(txn.amount)}</span>
                                  <span className={`txn-status ${txn.status}`}>{getTransactionStatusLabel(txn.status)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-transactions">Chưa có giao dịch</p>
                          )}
                        </div>

                        <div className="ticket-actions">

                          {/* VNPay: chỉ badge, không cho tự duyệt */}
                          {isWaitingVnpay(ticket) && (
                            <span className="badge-vnpay-waiting">
                              ⏳ Chờ VNPay xác nhận
                            </span>
                          )}

                          {/* VNPay đã xác nhận: show badge xanh */}
                          {ticket.paymentMethod === "vnpay" && ticket.depositStatus === "held" &&
                            ["pending", "paid"].includes(ticket.status) && (
                            <span className="badge-vnpay-ok">
                              ✅ VNPay đã xác nhận
                            </span>
                          )}

                          {/* Duyệt phiếu */}
                          {canApproveTicket(ticket) && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleTicketAction(ticket._id, "approve")}
                            >
                              <FiCheck /> Phê duyệt
                            </button>
                          )}

                          {/* Bắt đầu giao hàng (giao tận nơi) */}
                          {canDispatch(ticket) && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleTicketAction(ticket._id, "dispatch")}
                            >
                              <FiRefreshCw /> Bắt đầu giao
                            </button>
                          )}

                          {/* Xác nhận đã giao (giao tận nơi) */}
                          {canDeliver(ticket) && (
                            ticket.paymentMethod === "cash" ? (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleTicketAction(ticket._id, "deliver_and_confirm_cash", "cash")}
                              >
                                <FiCheckCircle /> Xác nhận đã giao & đã thu tiền
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleTicketAction(ticket._id, "deliver")}
                              >
                                <FiCheckCircle /> Xác nhận đã giao
                              </button>
                            )
                          )}

                          {/* Trả sách: chỉ sau delivered */}
                          {canReturn(ticket) && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleTicketAction(ticket._id, "return")}
                            >
                              <FiRefreshCw /> Xác nhận đã trả
                            </button>
                          )}

                          {/* Quyết toán cọc */}
                          {canSettle(ticket) && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleTicketAction(ticket._id, "settle_deposit")}
                            >
                              <FiDollarSign /> Quyết toán cọc
                            </button>
                          )}

                          {/* Phạt còn lại */}
                          {canSettleOutstanding(ticket) && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleTicketAction(ticket._id, "settle_outstanding_fine", "cash")}
                            >
                              <FiDollarSign /> Thanh toán phạt còn lại
                            </button>
                          )}

                          {/* Hủy phiếu */}
                          {canCancel(ticket) && (
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
              <h2 className="admin-section-title">Quản lý người dùng</h2>

              <div className="user-management-toolbar">
                <div className="user-search-box">
                  <FiSearch />
                  <input
                    type="search"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Tìm theo tên, email, ngành, SĐT..."
                  />
                </div>

                <div className="user-filter-group">
                  <FiFilter />
                  <select
                    value={userRoleFilter}
                    onChange={(event) => setUserRoleFilter(event.target.value)}
                  >
                    {USER_ROLE_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(event) => setUserStatusFilter(event.target.value)}
                  >
                    {USER_STATUS_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="user-result-count">
                  {filteredUsers.length}/{users.length} người dùng
                </div>
              </div>

              <div className="admin-table-container user-table-container">
                <table className="admin-table user-management-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Người dùng</th>
                      <th>Vai trò</th>
                      <th>Ngành</th>
                      <th>Năm</th>
                      <th>SĐT</th>
                      <th>Tài khoản</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr key={user._id || index}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="admin-user-cell">
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${user.role === "admin" ? "approved" : "returned"}`}>
                              {getUserRoleLabel(user.role)}
                            </span>
                          </td>
                          <td>{user.stream || "—"}</td>
                          <td>{user.year || "—"}</td>
                          <td>{user.phone || "—"}</td>
                          <td>
                            <div className="admin-user-status-stack">
                              <span className={`status-badge ${user.isActive === false ? "cancelled" : "closed"}`}>
                                {getUserStatusLabel(user)}
                              </span>
                              {!user.emailVerified && (
                                <span className="email-warning-badge">Chưa xác thực</span>
                              )}
                            </div>
                          </td>
                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                          <td>
                            <div className="admin-user-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openUserEditor(user)}
                              >
                                <FiEdit2 /> Sửa
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm ${user.isActive === false ? "btn-outline-success" : "btn-outline-danger"}`}
                                onClick={() => handleToggleUserStatus(user)}
                              >
                                {user.isActive === false ? <FiUnlock /> : <FiLock />}
                                {user.isActive === false ? "Mở" : "Khóa"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <FiTrash2 /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="empty-users-cell" colSpan="9">
                          Không tìm thấy người dùng phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {editingUser && (
                <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
                  <form className="admin-user-modal" onSubmit={handleUpdateUser}>
                    <div className="admin-user-modal-header">
                      <h3>Sửa người dùng</h3>
                      <button type="button" className="modal-close-btn" onClick={closeUserEditor}>
                        <FiX />
                      </button>
                    </div>

                    <div className="admin-user-form-grid">
                      <label>
                        <span>Họ và tên</span>
                        <input
                          name="name"
                          value={userForm.name}
                          onChange={handleUserFormChange}
                          required
                        />
                      </label>

                      <label>
                        <span>Email</span>
                        <input
                          name="email"
                          type="email"
                          value={userForm.email}
                          onChange={handleUserFormChange}
                          required
                        />
                      </label>

                      <label>
                        <span>Vai trò</span>
                        <select name="role" value={userForm.role} onChange={handleUserFormChange}>
                          <option value="user">Độc giả</option>
                          <option value="admin">Thủ thư</option>
                        </select>
                      </label>

                      <label>
                        <span>SĐT</span>
                        <input
                          name="phone"
                          value={userForm.phone}
                          onChange={handleUserFormChange}
                          placeholder="Chưa cập nhật"
                        />
                      </label>

                      <label>
                        <span>Ngành</span>
                        <input
                          name="stream"
                          value={userForm.stream}
                          onChange={handleUserFormChange}
                          disabled={userForm.role === "admin"}
                        />
                      </label>

                      <label>
                        <span>Năm học</span>
                        <input
                          name="year"
                          type="number"
                          min="1"
                          max="10"
                          value={userForm.year}
                          onChange={handleUserFormChange}
                          disabled={userForm.role === "admin"}
                        />
                      </label>
                    </div>

                    <div className="admin-user-modal-actions">
                      <button type="button" className="btn btn-outline-danger" onClick={closeUserEditor}>
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-success" disabled={isUserSaving}>
                        {isUserSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {selectedSection === "categories" && (
            <>
              <h2 className="admin-section-title">Quản lý danh mục</h2>

              <div className="category-management-grid">
                <form className="category-form-card" onSubmit={handleCreateCategory}>
                  <div className="category-form-icon">
                    <FiTag />
                  </div>
                  <div className="category-form-body">
                    <label htmlFor="categoryName">Tên danh mục mới</label>
                    <div className="category-input-row">
                      <input
                        id="categoryName"
                        value={categoryName}
                        onChange={(event) => setCategoryName(event.target.value)}
                        placeholder="Ví dụ: Khoa học dữ liệu"
                        maxLength="255"
                      />
                      <button type="submit" className="btn btn-success" disabled={isCategorySaving}>
                        <FiPlus /> Thêm
                      </button>
                    </div>
                  </div>
                </form>

                <div className="category-summary-card">
                  <span>Tổng danh mục</span>
                  <strong>{categories.length}</strong>
                  <small>{categories.reduce((total, category) => total + Number(category.bookCount || 0), 0)} sách đã phân loại</small>
                </div>
              </div>

              <div className="user-management-toolbar category-toolbar">
                <div className="user-search-box">
                  <FiSearch />
                  <input
                    type="search"
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    placeholder="Tìm danh mục..."
                  />
                </div>
                <div className="user-result-count">
                  {filteredCategories.length}/{categories.length} danh mục
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table category-management-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên danh mục</th>
                      <th>Số sách</th>
                      <th>Ngày tạo</th>
                      <th>Cập nhật</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category, index) => {
                        const isEditing = editingCategoryId === category._id;

                        return (
                          <tr key={category._id || index}>
                            <td>{index + 1}</td>
                            <td>
                              {isEditing ? (
                                <input
                                  className="category-inline-input"
                                  value={editingCategoryName}
                                  onChange={(event) => setEditingCategoryName(event.target.value)}
                                  autoFocus
                                  maxLength="255"
                                />
                              ) : (
                                <div className="admin-category-cell">
                                  <FiTag />
                                  <strong>{category.name}</strong>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="status-badge returned">
                                {Number(category.bookCount || 0)} cuốn
                              </span>
                            </td>
                            <td>{category.createdAt ? new Date(category.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                            <td>{category.updatedAt ? new Date(category.updatedAt).toLocaleDateString("vi-VN") : "—"}</td>
                            <td>
                              <div className="admin-user-actions">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleUpdateCategory(category)}
                                      disabled={isCategorySaving}
                                    >
                                      <FiCheck /> Lưu
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={cancelEditCategory}
                                    >
                                      <FiX /> Hủy
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => startEditCategory(category)}
                                    >
                                      <FiEdit2 /> Sửa
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteCategory(category)}
                                    >
                                      <FiTrash2 /> Xóa
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="empty-users-cell" colSpan="6">
                          Không tìm thấy danh mục phù hợp.
                        </td>
                      </tr>
                    )}
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

          {selectedSection === "reviews" && (
            <>
              <h2 className="admin-section-title">Quản lý Đánh giá</h2>
              <div className="admin-table-container">
                {reviews.length === 0 ? (
                  <p style={{ padding: '24px', color: '#94a3b8', textAlign: 'center' }}>Chưa có đánh giá nào.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Độc giả</th>
                        <th>Sách</th>
                        <th>Sao</th>
                        <th>Nội dung</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((review) => (
                        <tr key={review.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{review.user_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{review.user_email}</div>
                          </td>
                          <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {review.book_title}
                          </td>
                          <td>
                            <span style={{ color: '#f59e0b', fontSize: '1rem' }}>
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </span>
                          </td>
                          {/* <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {review.comment || <em style={{ color: '#cbd5e1' }}>Không có</em>}
                          </td> */}
                          <td style={{ maxWidth: '300px' }}> 
  {/* Lưu ý: Tôi đã bỏ thuộc tính whiteSpace: 'nowrap' để khung phản hồi không bị che khuất */}
  <div style={{ marginBottom: '8px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
    {review.comment || <em style={{ color: '#cbd5e1' }}>Không có</em>}
  </div>
  
  {/* --- ĐOẠN CODE BƯỚC 1.2 ĐƯỢC CHÈN VÀO ĐÂY --- */}
  <div className="review-reply-section" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
      {review.admin_reply ? (
          <div style={{ backgroundColor: '#eef2f5', padding: '8px', borderRadius: '5px', borderLeft: '4px solid #4CAF50', fontSize: '0.85rem', whiteSpace: 'normal' }}>
              <strong style={{ color: '#2e7d32', display: 'block', marginBottom: '2px' }}>Đã phản hồi: </strong>
              <span>{review.admin_reply}</span>
          </div>
      ) : (
          <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
              <textarea 
                  placeholder="Nhập câu trả lời..."
                  value={replyInputs[review.id] || ""}
                  onChange={(e) => handleReplyChange(review.id, e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '50px', fontSize: '0.85rem' }}
              />
              <button 
                  onClick={() => handleSendReply(review.id)}
                  style={{ padding: '5px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.8rem' }}
              >
                  Gửi phản hồi
              </button>
          </div>
      )}
  </div>
  {/* --- KẾT THÚC ĐOẠN BƯỚC 1.2 --- */}
</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td>
                            <span className={`status-badge ${review.status === 'visible' ? 'approved' : 'cancelled'}`}>
                              {review.status === 'visible' ? 'Hiển thị' : 'Đã ẩn'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleToggleReviewStatus(review)}
                                title={review.status === 'visible' ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                              >
                                <FiEye /> {review.status === 'visible' ? 'Ẩn' : 'Hiện'}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteReview(review.id)}
                                title="Xóa đánh giá"
                              >
                                <FiX /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </main>

      </div>
    </motion.div>
  );
};

export default AdminDashboard;
