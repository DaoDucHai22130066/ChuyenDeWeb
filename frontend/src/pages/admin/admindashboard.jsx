import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
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
  FiPlus,
  FiMail,
  FiBarChart2,
  FiDownload,
  FiTrendingUp,
  FiCalendar,
  FiCreditCard,
  FiPackage
} from "react-icons/fi";

ChartJS.register(ArcElement, Tooltip, Legend);

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

const normalizeTicketStatus = (status) => String(status || "").trim().toLowerCase();

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

const CONTACT_SUBJECT_LABEL = {
  general: "Câu hỏi chung",
  borrow: "Mượn / trả sách",
  donate: "Hiến sách",
  volunteer: "Tình nguyện",
  feedback: "Góp ý",
  other: "Khác",
};

const CONTACT_STATUS_LABEL = {
  new: "Mới",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đóng",
};

const CONTACT_STATUS_FILTERS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "new", label: "Mới" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "closed", label: "Đóng" },
];

const emptyReport = {
  topBorrowedBooks: [],
  revenueByType: {},
  lateReturn: {
    returnedWithDueDate: 0,
    lateReturned: 0,
    currentlyOverdue: 0,
    lateRate: 0,
  },
  ticketStatusSummary: {},
  recentTransactions: [],
  generatedAt: null,
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
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("all");
  const [contactNotes, setContactNotes] = useState({});
  const [updatingContactId, setUpdatingContactId] = useState(null);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [ticketTransactions, setTicketTransactions] = useState({});
  const [reports, setReports] = useState(emptyReport);

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
  const filteredContacts = useMemo(() => {
    const searchTerm = contactSearch.trim().toLowerCase();

    return contacts.filter((contact) => {
      const subjectLabel = CONTACT_SUBJECT_LABEL[contact.subject] || contact.subject || "";
      const matchesSearch = !searchTerm || [
        contact.name,
        contact.email,
        subjectLabel,
        contact.message,
        contact.adminNote,
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = contactStatusFilter === "all" || contact.status === contactStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contacts, contactSearch, contactStatusFilter]);
  const totalBooks = books.length;
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "pending" || ticket.status === "awaiting_payment").length;
  const filteredTickets = useMemo(() => {
    const keyword = ticketSearch.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = ticketFilter === "all" || ticket.status === ticketFilter;
      const matchesSearch = !keyword || [
        ticket._id,
        ticket.userId?.name,
        ticket.userId?.email,
        ticket.shippingAddress,
        ...(ticket.books || []).flatMap((book) => [book.title, book.author]),
      ].some((value) => String(value || "").toLowerCase().includes(keyword));

      return matchesStatus && matchesSearch;
    });
  }, [tickets, ticketFilter, ticketSearch]);

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
  const reportRevenueTypes = ["deposit", "shipping", "fine"];
  const realRevenueTypes = ["shipping", "fine"];
  const chartColors = ["#2563eb", "#0f766e", "#dc2626", "#f59e0b", "#7c3aed", "#475569", "#0891b2", "#65a30d", "#be123c"];
  const totalCompletedRevenue = reportRevenueTypes.reduce(
    (total, type) => total + Number(reports.revenueByType?.[type]?.completedAmount || 0),
    0
  );
  const totalRefundedRevenue = reportRevenueTypes.reduce(
    (total, type) => total + Math.abs(Number(reports.revenueByType?.[type]?.refundedAmount || 0)),
    0
  );
  const totalNetRevenue = reportRevenueTypes.reduce(
    (total, type) => total + Number(reports.revenueByType?.[type]?.netAmount || 0),
    0
  );
  const totalRealRevenue = realRevenueTypes.reduce(
    (total, type) => total + Number(reports.revenueByType?.[type]?.completedAmount || 0),
    0
  );
  const revenueBreakdownRows = reportRevenueTypes.map((type) => ({
    type,
    label: getTransactionTypeLabel(type),
    completedAmount: Number(reports.revenueByType?.[type]?.completedAmount || 0),
    pendingAmount: Number(reports.revenueByType?.[type]?.pendingAmount || 0),
    refundedAmount: Number(reports.revenueByType?.[type]?.refundedAmount || 0),
    netAmount: Number(reports.revenueByType?.[type]?.netAmount || 0),
  }));
  const realRevenueRows = revenueBreakdownRows.filter((row) => realRevenueTypes.includes(row.type));
  const realRevenueChartData = {
    labels: realRevenueRows.map((row) => row.label),
    datasets: [
      {
        data: realRevenueRows.map((row) => row.completedAmount),
        backgroundColor: chartColors.slice(1, 3),
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  };
  const ticketStatusRows = Object.entries(reports.ticketStatusSummary || {})
    .map(([status, total]) => ({
      status,
      label: getStatusLabel(status),
      total: Number(total || 0),
    }))
    .filter((row) => row.total > 0);
  const ticketStatusChartData = {
    labels: ticketStatusRows.map((row) => row.label),
    datasets: [
      {
        data: ticketStatusRows.map((row) => row.total),
        backgroundColor: chartColors,
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  };
  const createDoughnutOptions = (formatter) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "64%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: "#475569",
          font: {
            size: 12,
            weight: 700,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.raw || 0);
            const total = context.dataset.data.reduce((sum, item) => sum + Number(item || 0), 0);
            const percent = total > 0 ? ` (${((value / total) * 100).toFixed(1)}%)` : "";
            return `${context.label}: ${formatter(value)}${percent}`;
          },
        },
      },
    },
  });
  const currencyDoughnutOptions = createDoughnutOptions(formatCurrency);
  const countDoughnutOptions = createDoughnutOptions((value) => new Intl.NumberFormat("vi-VN").format(value));
  const recentTransactionGroups = useMemo(() => {
    const groups = new Map();

    reports.recentTransactions.slice(0, 20).forEach((transaction, index) => {
      const ticketKey = transaction.ticketId || transaction.ticket?._id || `unknown-${index}`;
      const group = groups.get(ticketKey) || {
        key: ticketKey,
        ticketId: transaction.ticketId,
        userName: transaction.userName,
        userEmail: transaction.userEmail,
        latestAt: transaction.createdAt,
        totalAmount: 0,
        collectedAmount: 0,
        refundedAmount: 0,
        realRevenueAmount: 0,
        transactions: [],
      };

      const amount = Number(transaction.amount || 0);
      const isCompletedIncome = transaction.status === "completed" && amount > 0;
      const isRefund = transaction.status === "refunded" || amount < 0;
      const currentDate = transaction.createdAt ? new Date(transaction.createdAt).getTime() : 0;
      const latestDate = group.latestAt ? new Date(group.latestAt).getTime() : 0;

      group.totalAmount += amount;
      group.collectedAmount += isCompletedIncome ? amount : 0;
      group.refundedAmount += isRefund ? Math.abs(amount) : 0;
      group.realRevenueAmount += isCompletedIncome && transaction.type !== "deposit" ? amount : 0;
      group.transactions.push(transaction);

      if (currentDate >= latestDate) {
        group.latestAt = transaction.createdAt;
        group.userName = transaction.userName || group.userName;
        group.userEmail = transaction.userEmail || group.userEmail;
      }

      groups.set(ticketKey, group);
    });

    return Array.from(groups.values());
  }, [reports.recentTransactions]);
  const escapeCsvValue = (value) => {
    const text = value === undefined || value === null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const downloadCsv = (filename, rows) => {
    const csvContent = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportReportCsv = () => {
    const rows = [
      ["Loại báo cáo", "Chi tiết 1", "Chi tiết 2", "Chi tiết 3", "Giá trị"],
      ["Tổng thu hoàn tất", "", "", "", totalCompletedRevenue],
      ["Tổng đã hoàn", "", "", "", totalRefundedRevenue],
      ["Doanh thu thực", "", "", "", totalRealRevenue],
      ["Dòng tiền ròng", "", "", "", totalNetRevenue],
      ["Tỷ lệ trả trễ", "Đã trả có hạn", reports.lateReturn.returnedWithDueDate, "Trả trễ", `${reports.lateReturn.lateRate}%`],
      ["Đang quá hạn", "", "", "", reports.lateReturn.currentlyOverdue],
      [],
      ["Sách mượn nhiều", "Tiêu đề", "Tác giả", "Danh mục", "Lượt mượn"],
      ...reports.topBorrowedBooks.map((book) => [
        "Sách mượn nhiều",
        book.title,
        book.author,
        book.category,
        book.borrowCount,
      ]),
      [],
      ["Giao dịch", "Mã phiếu", "Độc giả", "Loại", "Số tiền", "Trạng thái", "Ngày tạo"],
      ...reports.recentTransactions.map((transaction) => [
        "Giao dịch",
        transaction.ticketId,
        transaction.userEmail || transaction.userName || "",
        getTransactionTypeLabel(transaction.type),
        transaction.amount,
        getTransactionStatusLabel(transaction.status),
        transaction.createdAt ? new Date(transaction.createdAt).toLocaleString("vi-VN") : "",
      ]),
    ];
    downloadCsv(`bao-cao-thu-vien-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };


  const isWaitingVnpay = (ticket) =>
    ticket.depositStatus === "pending" &&
    ticket.paymentMethod === "vnpay" &&
    ["pending", "awaiting_payment"].includes(normalizeTicketStatus(ticket.status));

  const canApproveTicket = (ticket) =>
    ["pending", "paid"].includes(normalizeTicketStatus(ticket.status)) &&
    (ticket.paymentMethod === "vnpay" ? ticket.depositStatus === "held" : true);

  // Giao tận nơi: bắt đầu giao
  const canDispatch = (ticket) =>
    normalizeTicketStatus(ticket.status) === "approved" && ticket.shippingStatus === "pending";

  // Xác nhận đã giao (giao tận nơi)
  const canDeliver = (ticket) =>
    normalizeTicketStatus(ticket.status) === "dispatched" && ticket.shippingStatus === "dispatched";

  const getOverdueDays = (ticket) => {
    if (normalizeTicketStatus(ticket.status) !== "delivered" || !ticket.dueDate) return 0;
    const due = new Date(ticket.dueDate);
    due.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstimatedFine = (ticket) => {
    return getOverdueDays(ticket) * 5000;
  };
  const overdueTickets = tickets.filter((ticket) => getOverdueDays(ticket) > 0).length;

  // Cash should be collected when delivering, not at pending/approval stage)
  const canReturn = (ticket) =>
    normalizeTicketStatus(ticket.status) === "delivered";

  const canSettle = (ticket) =>
    normalizeTicketStatus(ticket.status) === "returned" && ticket.depositStatus === "held";

  const canSettleOutstanding = (ticket) =>
    ticket.depositStatus === "forfeited" && normalizeTicketStatus(ticket.status) !== "closed";

  const canCancel = (ticket) =>
    ["pending", "awaiting_payment", "paid", "approved"].includes(normalizeTicketStatus(ticket.status));

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

  const fetchContacts = async () => {
    try {
      const result = await axios.get(`${Server_URL}admin/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contactList = result.data.contacts || [];
      setContacts(contactList);
      setContactNotes(
        contactList.reduce((acc, contact) => ({
          ...acc,
          [contact._id]: contact.adminNote || "",
        }), {})
      );
    } catch (error) {
      console.error("Lỗi tải liên hệ:", error);
    }
  };

  const fetchReports = async () => {
    try {
      const result = await axios.get(`${Server_URL}admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(result.data.report || emptyReport);
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    }
  };

  const replaceContactInList = (updatedContact) => {
    setContacts((prev) => prev.map((contact) => (
      contact._id === updatedContact._id ? updatedContact : contact
    )));
    setContactNotes((prev) => ({ ...prev, [updatedContact._id]: updatedContact.adminNote || "" }));
  };

  const handleContactNoteChange = (contactId, value) => {
    setContactNotes((prev) => ({ ...prev, [contactId]: value }));
  };

  const handleUpdateContact = async (contact, nextStatus = contact.status) => {
    try {
      setUpdatingContactId(contact._id);
      const response = await axios.put(
        `${Server_URL}admin/contacts/${contact._id}`,
        {
          status: nextStatus,
          adminNote: contactNotes[contact._id] || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      replaceContactInList(response.data.contact);
      showSuccessToast("Đã cập nhật liên hệ");
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể cập nhật liên hệ"));
    } finally {
      setUpdatingContactId(null);
    }
  };

  const handleDeleteContact = async (contact) => {
    if (!window.confirm(`Xóa tin nhắn liên hệ từ ${contact.email}?`)) {
      return;
    }

    try {
      await axios.delete(`${Server_URL}admin/contacts/${contact._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts((prev) => prev.filter((item) => item._id !== contact._id));
      setContactNotes((prev) => {
        const next = { ...prev };
        delete next[contact._id];
        return next;
      });
      showSuccessToast("Đã xóa liên hệ");
    } catch (error) {
      showErrorToast(getAxiosErrorMessage(error, "Không thể xóa liên hệ"));
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
      fetchReports();
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
    fetchContacts();
    fetchReports();
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
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "contacts" ? "active" : ""}`}
                onClick={() => setSelectedSection("contacts")}
              >
                <FiMail /> Liên hệ
              </button>
            </li>
            <li className="admin-nav-item">
              <button
                className={`admin-nav-btn ${selectedSection === "reports" ? "active" : ""}`}
                onClick={() => setSelectedSection("reports")}
              >
                <FiBarChart2 /> Báo cáo
              </button>
            </li>
          </ul>
        </nav>

        <main className="col-md-9 col-lg-10 admin-main">
          {selectedSection === "dashboard" && (
            <section className="admin-workspace-section">
              <div className="admin-section-hero dashboard-hero">
                <div>
                  <span className="admin-section-kicker">Trung tâm điều hành</span>
                  <h2>Tổng quan hệ thống</h2>
                  <p>Nắm nhanh hoạt động thư viện và các công việc cần xử lý trong ngày.</p>
                </div>
                <span className="admin-section-hero-icon"><FiGrid /></span>
              </div>

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
            </section>
          )}

          {selectedSection === "tickets" && (
            <section className="ticket-management-page">
              <div className="ticket-page-hero">
                <div>
                  <span className="ticket-page-kicker">Vận hành mượn trả</span>
                  <h2>Quản lý phiếu mượn</h2>
                  <p>Theo dõi thanh toán, giao nhận và tiến độ hoàn trả trong một luồng thống nhất.</p>
                </div>
                <div className="ticket-overview-grid">
                  <div><FiClipboard /><span><strong>{totalTickets}</strong>Tổng phiếu</span></div>
                  <div><FiClock /><span><strong>{pendingTickets}</strong>Chờ xử lý</span></div>
                  <div><FiPackage /><span><strong>{tickets.filter((ticket) => ["approved", "dispatched", "delivered"].includes(ticket.status)).length}</strong>Đang thực hiện</span></div>
                  <div className={overdueTickets ? "danger" : ""}><FiCalendar /><span><strong>{overdueTickets}</strong>Quá hạn</span></div>
                </div>
              </div>

              <div className="ticket-control-panel">
                <div className="ticket-search-box">
                  <FiSearch />
                  <input
                    value={ticketSearch}
                    onChange={(event) => setTicketSearch(event.target.value)}
                    placeholder="Tìm mã phiếu, độc giả, sách hoặc địa chỉ..."
                    aria-label="Tìm kiếm phiếu mượn"
                  />
                </div>
                <span className="ticket-result-count">{filteredTickets.length} kết quả</span>
              </div>

              <div className="ticket-filter-tabs">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "pending", label: "Chờ duyệt" },
                  { key: "approved", label: "Đã duyệt" },
                  { key: "dispatched", label: "Đang giao" },
                  { key: "delivered", label: "Đã giao" },
                  { key: "returned", label: "Đã trả" },
                  { key: "closed", label: "Hoàn tất" },
                  { key: "cancelled", label: "Đã hủy" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`ticket-filter-btn ${ticketFilter === key ? "active" : ""}`}
                    onClick={() => setTicketFilter(key)}
                  >
                    {label}
                    <span className="ticket-filter-count">
                      {key === "all" ? tickets.length : tickets.filter((ticket) => ticket.status === key).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="ticket-list">
                {filteredTickets.map((ticket) => (
                  <article key={ticket._id} className={`ticket-item ${expandedTicket === ticket._id ? "is-expanded" : ""}`}>
                    <div className="ticket-header" onClick={() => toggleTicketExpand(ticket._id)}>
                      <div className="ticket-header-main">
                        <button className="expand-btn" aria-label={expandedTicket === ticket._id ? "Thu gọn phiếu" : "Xem chi tiết phiếu"}>
                          {expandedTicket === ticket._id ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        <div className="ticket-header-info">
                          <div className="ticket-id">Phiếu #{String(ticket._id).slice(-8).toUpperCase()}</div>
                          <div className="ticket-reader">
                            {ticket.userId?.name || ticket.userId?.email || "—"}
                          </div>
                          {ticket.userId?.email && ticket.userId?.name && <small>{ticket.userId.email}</small>}
                        </div>
                        <div className="ticket-books-list">
                          <span className="ticket-books-count">{ticket.books?.length || 0} cuốn</span>
                          <span>{getTicketBookTitleList(ticket)}</span>
                        </div>
                        <div className="ticket-dates">
                          <small><FiCalendar /> Mượn {ticket.borrowDate ? new Date(ticket.borrowDate).toLocaleDateString("vi-VN") : "—"}</small>
                          {ticket.dueDate && <small><FiClock /> Hạn {new Date(ticket.dueDate).toLocaleDateString("vi-VN")}</small>}
                          {getOverdueDays(ticket) > 0 && (
                            <span className="ticket-overdue-badge">
                              Quá hạn {getOverdueDays(ticket)} ngày
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ticket-header-status">
                        <span className="ticket-payment-method"><FiCreditCard /> {ticket.paymentMethod === "vnpay" ? "VNPay" : "Tiền mặt"}</span>
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
                              <strong>
                                {ticket.fineAmount > 0
                                  ? formatCurrency(ticket.fineAmount)
                                  : getEstimatedFine(ticket) > 0
                                    ? `Tạm tính: ${formatCurrency(getEstimatedFine(ticket))}`
                                    : formatCurrency(0)}
                              </strong>
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
                  </article>
                ))}
                {!filteredTickets.length && (
                  <div className="ticket-empty-state">
                    <FiClipboard />
                    <h3>Không tìm thấy phiếu mượn</h3>
                    <p>Thử thay đổi từ khóa hoặc chọn một trạng thái khác.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {selectedSection === "reports" && (
            <section className="admin-workspace-section">
              <div className="report-header">
                <div>
                  <span className="admin-section-kicker">Phân tích dữ liệu</span>
                  <h2>Báo cáo thư viện</h2>
                  <p>Theo dõi sách được mượn nhiều, các khoản thu và tình trạng trả sách.</p>
                </div>
                <button type="button" className="btn admin-btn-primary" onClick={exportReportCsv}>
                  <FiDownload /> Xuất CSV
                </button>
              </div>

              <div className="report-summary-grid">
                <div className="report-summary-card">
                  <span>Đã thu</span>
                  <strong>{formatCurrency(totalCompletedRevenue)}</strong>
                  <small>Tổng tiền cọc, phí giao hàng và phí phạt đã hoàn tất.</small>
                </div>
                <div className="report-summary-card">
                  <span>Đã hoàn</span>
                  <strong>{formatCurrency(totalRefundedRevenue)}</strong>
                  <small>Tiền đã trả lại cho độc giả, chủ yếu là hoàn cọc.</small>
                </div>
                <div className="report-summary-card success">
                  <span>Doanh thu thực</span>
                  <strong>{formatCurrency(totalRealRevenue)}</strong>
                  <small>Chỉ tính phí giao hàng và phí phạt đã hoàn tất, không tính tiền cọc giữ hộ.</small>
                </div>
                <div className="report-summary-card">
                  <span>Dòng tiền ròng</span>
                  <strong>{formatCurrency(totalNetRevenue)}</strong>
                  <small>Đã thu trừ đi các khoản hoàn tiền. Dùng để đối soát dòng tiền.</small>
                </div>
                <div className="report-summary-card warning">
                  <span>Trả trễ</span>
                  <strong>{reports.lateReturn.lateRate}%</strong>
                  <small>{reports.lateReturn.lateReturned}/{reports.lateReturn.returnedWithDueDate} phiếu đã trả có ghi hạn trả.</small>
                </div>
                <div className="report-summary-card danger">
                  <span>Đang quá hạn</span>
                  <strong>{reports.lateReturn.currentlyOverdue}</strong>
                  <small>Phiếu chưa hoàn tất dù đã quá hạn trả.</small>
                </div>
              </div>

              <div className="report-revenue-grid">
                {revenueBreakdownRows.map((item) => {
                  return (
                    <div key={item.type} className="report-revenue-card">
                      <div className="report-card-title">
                        <FiDollarSign />
                        <strong>{item.label}</strong>
                      </div>
                      <div className="report-money-row">
                        <span>Đã thu</span>
                        <strong>{formatCurrency(item.completedAmount)}</strong>
                      </div>
                      <div className="report-money-row">
                        <span>Chờ xử lý</span>
                        <strong>{formatCurrency(item.pendingAmount)}</strong>
                      </div>
                      <div className="report-money-row">
                        <span>Đã hoàn</span>
                        <strong>{formatCurrency(Math.abs(item.refundedAmount))}</strong>
                      </div>
                      <div className="report-money-row total">
                        <span>Dòng tiền ròng</span>
                        <strong>{formatCurrency(item.netAmount)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="report-analysis-grid">
                <section className="report-panel report-chart-panel">
                  <div className="report-panel-heading">
                    <h3><FiBarChart2 /> Cơ cấu doanh thu thực</h3>
                    <small>Không tính tiền cọc vì đây là khoản giữ hộ và có thể hoàn lại.</small>
                  </div>
                  {totalRealRevenue > 0 ? (
                    <div className="report-chart-layout">
                      <div className="report-chart-box">
                        <Doughnut data={realRevenueChartData} options={currencyDoughnutOptions} />
                      </div>
                      <div className="report-chart-notes">
                        {realRevenueRows.map((row) => (
                          <div key={row.type} className="report-chart-note">
                            <span>{row.label}</span>
                            <strong>{formatCurrency(row.completedAmount)}</strong>
                            <small>{totalRealRevenue > 0 ? `${((row.completedAmount / totalRealRevenue) * 100).toFixed(1)}% doanh thu thực` : "0%"}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="report-empty">Chưa có phí giao hàng hoặc phí phạt hoàn tất để vẽ biểu đồ.</p>
                  )}
                </section>

                <section className="report-panel report-chart-panel">
                  <div className="report-panel-heading">
                    <h3><FiClipboard /> Phân bổ trạng thái phiếu</h3>
                    <small>Cho biết phiếu đang kẹt ở bước nào trong quy trình mượn trả.</small>
                  </div>
                  {ticketStatusRows.length > 0 ? (
                    <div className="report-chart-layout">
                      <div className="report-chart-box">
                        <Doughnut data={ticketStatusChartData} options={countDoughnutOptions} />
                      </div>
                      <div className="report-chart-notes">
                        {ticketStatusRows.map((row) => (
                          <div key={row.status} className="report-chart-note">
                            <span>{row.label}</span>
                            <strong>{row.total}</strong>
                            <small>{totalTickets > 0 ? `${((row.total / totalTickets) * 100).toFixed(1)}% tổng phiếu` : "0%"}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="report-empty">Chưa có dữ liệu trạng thái phiếu.</p>
                  )}
                </section>
              </div>

              <section className="report-panel report-explain-panel">
                <div className="report-panel-heading">
                  <h3><FiCreditCard /> Cách đọc số liệu</h3>
                </div>
                <div className="report-explain-grid">
                  <div>
                    <strong>Đã thu</strong>
                    <p>Tất cả giao dịch dương đã hoàn tất, gồm cả tiền cọc. Số này dùng để đối chiếu tiền vào.</p>
                  </div>
                  <div>
                    <strong>Doanh thu thực</strong>
                    <p>Chỉ gồm phí giao hàng và phí phạt đã hoàn tất. Đây là chỉ số nên dùng khi xem hiệu quả tài chính.</p>
                  </div>
                  <div>
                    <strong>Dòng tiền ròng</strong>
                    <p>Bằng đã thu trừ hoàn tiền. Nếu dùng để tính doanh thu, tiền cọc có thể làm số bị hiểu sai.</p>
                  </div>
                </div>
              </section>

              <div className="report-content-grid">
                <section className="report-panel">
                  <div className="report-panel-heading">
                    <h3><FiTrendingUp /> Sách mượn nhiều</h3>
                  </div>
                  <div className="report-book-list">
                    {reports.topBorrowedBooks.length > 0 ? (
                      reports.topBorrowedBooks.map((book, index) => (
                        <div key={book._id || book.title} className="report-book-item">
                          <span className="report-rank">#{index + 1}</span>
                          <div>
                            <strong>{book.title}</strong>
                            <small>{book.author || "Chưa cập nhật"} · {book.category || "Chưa phân loại"}</small>
                          </div>
                          <span>{book.borrowCount} lượt</span>
                        </div>
                      ))
                    ) : (
                      <p className="report-empty">Chưa có dữ liệu mượn sách.</p>
                    )}
                  </div>
                </section>

                <section className="report-panel">
                  <div className="report-panel-heading">
                    <h3><FiClipboard /> Trạng thái phiếu</h3>
                  </div>
                  <div className="report-status-list">
                    {Object.entries(reports.ticketStatusSummary || {}).map(([status, total]) => (
                      <div key={status} className="report-status-item">
                        <span className={`status-badge ${status}`}>{getStatusLabel(status)}</span>
                        <strong>{total}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="report-panel">
                <div className="report-panel-heading">
                  <h3><FiDollarSign /> Giao dịch gần đây</h3>
                  <small>Gom theo mã phiếu từ 20 giao dịch mới nhất</small>
                </div>
                <div className="report-transaction-list">
                  {recentTransactionGroups.length > 0 ? (
                    recentTransactionGroups.map((group) => (
                      <article key={group.key} className="report-transaction-card grouped">
                        <div className="report-transaction-main">
                          <span className="report-transaction-icon">
                            <FiDollarSign />
                          </span>
                          <div>
                            <strong>Phiếu #{group.ticketId || "Chưa có mã"}</strong>
                            <small>
                              {group.userEmail || group.userName || "Chưa rõ độc giả"} · {group.transactions.length} khoản
                            </small>
                          </div>
                        </div>
                        <div className="report-transaction-side">
                          <strong className={Number(group.realRevenueAmount) < 0 ? "negative" : "positive"}>
                            {formatCurrency(group.realRevenueAmount)}
                          </strong>
                          <div>
                            <span className="status-badge completed">Doanh thu thực</span>
                            <small>{group.latestAt ? new Date(group.latestAt).toLocaleString("vi-VN") : "—"}</small>
                          </div>
                        </div>
                        <div className="report-transaction-metrics">
                          <div>
                            <span>Đã thu</span>
                            <strong>{formatCurrency(group.collectedAmount)}</strong>
                          </div>
                          <div>
                            <span>Đã hoàn</span>
                            <strong>{formatCurrency(group.refundedAmount)}</strong>
                          </div>
                          <div>
                            <span>Dòng tiền ròng</span>
                            <strong className={Number(group.totalAmount) < 0 ? "negative" : "positive"}>
                              {formatCurrency(group.totalAmount)}
                            </strong>
                          </div>
                        </div>
                        <div className="report-transaction-items">
                          {group.transactions.map((transaction) => (
                            <div key={transaction._id} className={`report-transaction-item ${transaction.type}`}>
                              <span className={`report-transaction-dot ${transaction.type}`} />
                              <div>
                                <strong>{getTransactionTypeLabel(transaction.type)}</strong>
                                <small>
                                  {getTransactionStatusLabel(transaction.status)} · {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString("vi-VN") : "—"}
                                </small>
                              </div>
                              <strong className={Number(transaction.amount) < 0 ? "negative" : "positive"}>
                                {formatCurrency(transaction.amount)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="report-empty">Chưa có giao dịch.</p>
                  )}
                </div>
              </section>
            </section>
          )}

          {selectedSection === "users" && (
            <section className="admin-workspace-section">
              <div className="admin-section-hero users-hero">
                <div>
                  <span className="admin-section-kicker">Cộng đồng thư viện</span>
                  <h2>Quản lý người dùng</h2>
                  <p>Quản lý hồ sơ, quyền truy cập và trạng thái tài khoản của độc giả, thủ thư.</p>
                </div>
                <div className="admin-section-mini-stats">
                  <div><strong>{users.length}</strong><span>Tài khoản</span></div>
                  <div><strong>{totalUsers}</strong><span>Độc giả</span></div>
                  <div><strong>{users.filter((user) => user.isActive === false).length}</strong><span>Đã khóa</span></div>
                </div>
              </div>

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
            </section>
          )}

          {selectedSection === "categories" && (
            <section className="admin-workspace-section">
              <div className="admin-section-hero categories-hero">
                <div>
                  <span className="admin-section-kicker">Phân loại nội dung</span>
                  <h2>Quản lý danh mục</h2>
                  <p>Tổ chức kho sách thành các nhóm rõ ràng để độc giả tìm kiếm nhanh hơn.</p>
                </div>
                <span className="admin-section-hero-icon"><FiTag /></span>
              </div>

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
            </section>
          )}

          {selectedSection === "books" && (
            <section className="admin-workspace-section">
              <div className="admin-section-hero books-hero">
                <div>
                  <span className="admin-section-kicker">Tài nguyên thư viện</span>
                  <h2>Kho sách thư viện</h2>
                  <p>Theo dõi nhanh số lượng đầu sách và tình trạng sẵn có trong kho.</p>
                </div>
                <div className="admin-section-mini-stats">
                  <div><strong>{books.length}</strong><span>Đầu sách</span></div>
                  <div><strong>{books.reduce((total, book) => total + Number(book.totalCopies || 0), 0)}</strong><span>Tổng bản</span></div>
                  <div><strong>{books.reduce((total, book) => total + Number(book.availableCopies || 0), 0)}</strong><span>Sẵn có</span></div>
                </div>
              </div>
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
            </section>
          )}

          {selectedSection === "contacts" && (
            <section className="admin-workspace-section">
              <div className="admin-section-hero contacts-hero">
                <div>
                  <span className="admin-section-kicker">Hộp thư hỗ trợ</span>
                  <h2>Quản lý liên hệ</h2>
                  <p>Tiếp nhận, phân loại và theo dõi tiến độ xử lý yêu cầu từ độc giả.</p>
                </div>
                <span className="admin-section-hero-icon"><FiMail /></span>
              </div>

              <div className="contact-admin-stats">
                {CONTACT_STATUS_FILTERS.filter((option) => option.value !== "all").map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`contact-stat-card ${option.value} ${contactStatusFilter === option.value ? "active" : ""}`}
                    onClick={() => setContactStatusFilter(option.value)}
                  >
                    <span>{option.label}</span>
                    <strong>{contacts.filter((contact) => contact.status === option.value).length}</strong>
                  </button>
                ))}
              </div>

              <div className="user-management-toolbar contact-toolbar">
                <div className="user-search-box">
                  <FiSearch />
                  <input
                    type="search"
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    placeholder="Tìm theo tên, email, chủ đề, nội dung..."
                  />
                </div>
                <div className="user-filter-group contact-filter-group">
                  <FiFilter />
                  <select
                    value={contactStatusFilter}
                    onChange={(event) => setContactStatusFilter(event.target.value)}
                  >
                    {CONTACT_STATUS_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="user-result-count">
                  {filteredContacts.length}/{contacts.length} liên hệ
                </div>
              </div>

              <div className="admin-contact-list">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <article key={contact._id} className="admin-contact-item">
                      <div className="admin-contact-header">
                        <div className="admin-contact-sender">
                          <strong>{contact.name}</strong>
                          <a href={`mailto:${contact.email}`}>{contact.email}</a>
                        </div>
                        <span className={`contact-status-badge ${contact.status}`}>
                          {CONTACT_STATUS_LABEL[contact.status] || "Chưa cập nhật"}
                        </span>
                      </div>

                      <div className="admin-contact-meta">
                        <span>{CONTACT_SUBJECT_LABEL[contact.subject] || contact.subject || "Khác"}</span>
                        <span>{contact.createdAt ? new Date(contact.createdAt).toLocaleString("vi-VN") : "—"}</span>
                        {contact.handledBy && (
                          <span>Xử lý bởi {contact.handledBy.name || contact.handledBy.email}</span>
                        )}
                      </div>

                      <p className="admin-contact-message">{contact.message}</p>

                      <label className="admin-contact-note">
                        <span>Ghi chú xử lý</span>
                        <textarea
                          value={contactNotes[contact._id] || ""}
                          onChange={(event) => handleContactNoteChange(contact._id, event.target.value)}
                          placeholder="Nhập ghi chú nội bộ cho tin nhắn này..."
                          rows="3"
                        />
                      </label>

                      <div className="admin-contact-actions">
                        <select
                          value={contact.status}
                          onChange={(event) => handleUpdateContact(contact, event.target.value)}
                          disabled={updatingContactId === contact._id}
                        >
                          {CONTACT_STATUS_FILTERS.filter((option) => option.value !== "all").map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateContact(contact)}
                          disabled={updatingContactId === contact._id}
                        >
                          <FiCheck /> Lưu ghi chú
                        </button>
                        <a className="btn btn-sm btn-outline-primary" href={`mailto:${contact.email}`}>
                          <FiMail /> Trả lời
                        </a>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteContact(contact)}
                        >
                          <FiTrash2 /> Xóa
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="admin-contact-empty">
                    Không tìm thấy tin nhắn liên hệ phù hợp.
                  </div>
                )}
              </div>
            </section>
          )}

          {selectedSection === "reviews" && (
            <section className="admin-workspace-section">
              <div className="admin-section-hero reviews-hero">
                <div>
                  <span className="admin-section-kicker">Phản hồi độc giả</span>
                  <h2>Quản lý đánh giá</h2>
                  <p>Kiểm duyệt nội dung và phản hồi trực tiếp các nhận xét về sách.</p>
                </div>
                <div className="admin-section-mini-stats">
                  <div><strong>{reviews.length}</strong><span>Đánh giá</span></div>
                  <div><strong>{reviews.filter((review) => review.status === "visible").length}</strong><span>Hiển thị</span></div>
                  <div><strong>{reviews.filter((review) => review.admin_reply).length}</strong><span>Đã phản hồi</span></div>
                </div>
              </div>
              <div className="admin-table-container">
                {reviews.length === 0 ? (
                  <div className="admin-reviews-empty"><span>☆</span>Chưa có đánh giá nào.</div>
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
                            <div className="admin-review-user">
                              <span className="admin-review-avatar">{String(review.user_name || "U").charAt(0).toUpperCase()}</span>
                              <div className="admin-review-user-info">
                                <strong>{review.user_name}</strong>
                                <span>{review.user_email}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="admin-review-book">{review.book_title}</span></td>
                          <td>
                            <span className="admin-review-stars">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </span>
                          </td>
                          <td>
                            <div className="admin-review-content">
                              <p>{review.comment || <em>Không có nội dung</em>}</p>
                              <div className="review-reply-section">
                                {review.admin_reply ? (
                                  <div className="admin-review-reply">
                                    <strong>Phản hồi của thư viện</strong>
                                    <span>{review.admin_reply}</span>
                                  </div>
                                ) : (
                                  <div className="admin-review-reply-form">
                                    <textarea
                                      placeholder="Nhập câu trả lời..."
                                      value={replyInputs[review.id] || ""}
                                      onChange={(event) => handleReplyChange(review.id, event.target.value)}
                                    />
                                    <button type="button" onClick={() => handleSendReply(review.id)}>
                                      <FiMail /> Gửi phản hồi
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="admin-review-date">
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td>
                            <span className={`status-badge ${review.status === 'visible' ? 'approved' : 'cancelled'}`}>
                              {review.status === 'visible' ? 'Hiển thị' : 'Đã ẩn'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-review-actions">
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
            </section>
          )}
        </main>

      </div>
    </motion.div>
  );
};

export default AdminDashboard;
