import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./books.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { useCart } from "../../context/CartContext";

const STATUS_ALL = "all";
const STATUS_IN_LIBRARY = "in_library";
const STATUS_AVAILABLE = "available";

const BRANCH_LABELS = {
  "dai-la": "Cs. Đại La",
  "cau-giay": "Cs. Cầu Giấy",
};

const Books = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [branchFilter, setBranchFilter] = useState("all");
  const [sortBy, setSortBy] = useState("borrowCount");
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Khác";

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${Server_URL}books`)
      .then((response) => {
        if (!response.data.error) {
          const list = response.data.books || [];
          setBooks(list);
          const uniqueCategories = [
            "All",
            ...new Set(list.map((book) => getCategoryLabel(book))),
          ];
          setCategories(uniqueCategories);
        }
      })
      .catch(() => {
        showErrorToast("Không tải được danh sách sách.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const branches = useMemo(() => {
    const set = new Set(books.map((b) => b.branch).filter(Boolean));
    return ["all", ...set];
  }, [books]);

  const filteredBooks = useMemo(() => {
    let filtered = [...books];

    if (selectedCategory !== "All") {
      filtered = filtered.filter((book) => getCategoryLabel(book) === selectedCategory);
    }

    if (statusFilter === STATUS_AVAILABLE) {
      filtered = filtered.filter((book) => book.availableCopies > 0);
    } else if (statusFilter === STATUS_IN_LIBRARY) {
      filtered = filtered.filter((book) => book.availableCopies === 0);
    }

    if (branchFilter !== "all") {
      filtered = filtered.filter((book) => (book.branch || "dai-la") === branchFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title?.toLowerCase().includes(q) ||
          book.author?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "borrowCount") {
      filtered.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "newest") {
      filtered.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return filtered;
  }, [books, selectedCategory, statusFilter, branchFilter, searchTerm, sortBy]);

  function bookDetails(bookid) {
    navigate(`/bookdetails/${bookid}`);
  }

  return (
    <div className="books-page container-dfb">
      <div className="books-layout">
        <aside className="filter-sidebar">
          <h3 className="books-sidebar-title">Bộ lọc</h3>

          <div className="filter-group">
            <h4>Trạng thái sách</h4>
            {[
              [STATUS_ALL, "Tất cả"],
              [STATUS_IN_LIBRARY, "Trong thư viện"],
              [STATUS_AVAILABLE, "Có sẵn để mượn"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`filter-option ${statusFilter === val ? "active" : ""}`}
                onClick={() => setStatusFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {branches.length > 1 && (
            <div className="filter-group">
              <h4>Chi nhánh thư viện</h4>
              <button
                type="button"
                className={`filter-option ${branchFilter === "all" ? "active" : ""}`}
                onClick={() => setBranchFilter("all")}
              >
                Tất cả
              </button>
              {branches
                .filter((b) => b !== "all")
                .map((branch) => (
                  <button
                    key={branch}
                    type="button"
                    className={`filter-option ${branchFilter === branch ? "active" : ""}`}
                    onClick={() => setBranchFilter(branch)}
                  >
                    {BRANCH_LABELS[branch] || branch}
                  </button>
                ))}
            </div>
          )}

          <div className="filter-group">
            <h4>Danh mục</h4>
            {categories.map((category, index) => (
              <button
                key={index}
                type="button"
                className={`filter-option ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "All" ? "Tất cả loại sách" : category}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h4>Sắp xếp</h4>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="borrowCount">Số lượng mượn</option>
              <option value="newest">Mới nhất</option>
              <option value="title">Tên sách (A-Z)</option>
            </select>
          </div>
        </aside>

        <main className="books-main">
          <div className="search-header">
            <h2 className="page-title">Sách</h2>
            <input
              type="text"
              className="form-control books-search-input"
              placeholder="Tìm theo tên sách, tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="loading-spinner text-center py-5">
              <div className="spinner-border text-success" role="status" />
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="books-grid-dfb">
              {filteredBooks.map((book) => (
                <div key={book._id} className="book-card-dfb">
                  <div className="card-image-container">
                    <img
                      src={book.coverImage}
                      className="card-image"
                      alt={book.title}
                      onError={(e) => {
                        e.target.src = "/assets/library.avif";
                      }}
                    />
                    <div className="book-badge">{getCategoryLabel(book)}</div>
                    {book.availableCopies > 0 ? (
                      <span className="book-status available">Có sẵn</span>
                    ) : (
                      <span className="book-status unavailable">Đã mượn hết</span>
                    )}
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">{book.title}</h5>
                    <p className="card-author">{book.author}</p>
                    <div className="card-footer">
                      <button
                        type="button"
                        className="btn-dfb-outline btn-sm"
                        onClick={() => bookDetails(book._id)}
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        className="btn-dfb-primary btn-sm"
                        onClick={() => {
                          addToCart(book);
                          showSuccessToast("Đã thêm vào giỏ sách mượn.");
                        }}
                        disabled={book.availableCopies === 0 || isInCart(book._id)}
                      >
                        {isInCart(book._id) ? "Đã trong giỏ" : "Thêm vào giỏ"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-books-found">
              <h4>Không tìm thấy sách</h4>
              <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Books;
