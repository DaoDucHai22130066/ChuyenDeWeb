import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./books.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiFilter, FiSearch, FiBookOpen, FiMapPin, FiGrid, FiShoppingBag } from "react-icons/fi";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { FaHeart, FaRegHeart } from "react-icons/fa";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Khác";

  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("q");
    if (cat) setSelectedCategory(cat);
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, statusFilter, branchFilter, searchTerm, sortBy]);

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
          book.author?.toLowerCase().includes(q) ||
          getCategoryLabel(book).toLowerCase().includes(q)
      );
    }

    if (sortBy === "borrowCount") {
      filtered.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
    } else if (sortBy === "title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return filtered;
  }, [books, selectedCategory, statusFilter, branchFilter, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const indexOfLastBook = currentPage * itemsPerPage;
  const indexOfFirstBook = indexOfLastBook - itemsPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

  function bookDetails(bookid) {
    navigate(`/bookdetails/${bookid}`);
  }

  return (
    <div className="books-page">
      <section className="books-hero">
        <div className="container-dfb books-hero-inner">
          <span className="books-eyebrow">Kho sách D Free Book</span>
          <h1>Chọn cuốn sách tiếp theo cho hành trình đọc của bạn</h1>
          <p>Tìm kiếm, lọc theo chi nhánh, trạng thái và danh mục để gửi yêu cầu mượn nhanh hơn.</p>
        </div>
      </section>

      <div className="container-dfb books-layout">
        <aside className="filter-sidebar books-filter-panel">
          <div className="books-filter-heading">
            <FiFilter />
            <h3 className="books-sidebar-title">Bộ lọc</h3>
          </div>

          <div className="filter-group">
            <h4>Trạng thái sách</h4>
            {[
              [STATUS_ALL, "Tất cả"],
              [STATUS_IN_LIBRARY, "Đang ở thư viện"],
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
                Tất cả chi nhánh
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
            <div className="books-category-list">
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
          </div>
        </aside>

        <main className="books-main">
          <div className="books-toolbar dfb-card">
            <div>
              <span className="books-toolbar-kicker"><FiGrid /> Danh sách sách</span>
              <h2 className="page-title">{filteredBooks.length} kết quả phù hợp</h2>
            </div>
            <div className="books-toolbar-actions">
              <div className="books-search-box">
                <FiSearch />
                <input
                  type="text"
                  className="books-search-input"
                  placeholder="Tìm theo tên sách, tác giả, danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="books-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="borrowCount">Số lượng mượn</option>
                <option value="newest">Mới nhất</option>
                <option value="title">Tên sách (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="books-active-filters">
            <span>{selectedCategory === "All" ? "Tất cả danh mục" : selectedCategory}</span>
            <span>{statusFilter === STATUS_AVAILABLE ? "Có sẵn" : statusFilter === STATUS_IN_LIBRARY ? "Đang ở thư viện" : "Mọi trạng thái"}</span>
            <span>{branchFilter === "all" ? "Tất cả chi nhánh" : BRANCH_LABELS[branchFilter] || branchFilter}</span>
          </div>

          {isLoading ? (
            <div className="books-loading dfb-card">
              <div className="books-loading-spinner" />
              <p>Đang tải danh sách sách...</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            <>
              <div className="books-grid-dfb">
                {currentBooks.map((book) => (
                  <article key={book._id} className="book-card-dfb">
                    <div className="card-image-container">
                      <img
                        src={book.coverImage || "/assets/library.avif"}
                        className="card-image"
                        alt={book.title}
                        onError={(e) => {
                          e.currentTarget.src = "/assets/library.avif";
                        }}
                      />
                      <button
                        className="wishlist-icon-btn list-wishlist-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const bookId = book._id || book.id;
                          if (isInWishlist(bookId)) {
                            removeFromWishlist(bookId);
                          } else {
                            addToWishlist(book).then(res => {
                              if (res && res.success) {
                                showSuccessToast("Đã lưu vào sách yêu thích");
                              }
                            });
                          }
                        }}
                        title={isInWishlist(book._id || book.id) ? "Bỏ lưu" : "Lưu yêu thích"}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                          zIndex: 2,
                          padding: 0
                        }}
                      >
                        {isInWishlist(book._id || book.id) ? <FaHeart color="#e74c3c" size={16} /> : <FaRegHeart color="#7f8c8d" size={16} />}
                      </button>
                      <div className="book-badge">{getCategoryLabel(book)}</div>
                      {book.availableCopies > 0 ? (
                        <span className="book-status available">Còn {book.availableCopies} cuốn</span>
                      ) : (
                        <span className="book-status unavailable">Đã mượn hết</span>
                      )}
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{book.title}</h5>
                      <p className="card-author">{book.author}</p>
                      <div className="book-meta-line">
                        <span><FiMapPin /> {BRANCH_LABELS[book.branch] || "Cs. Đại La"}</span>
                        <span><FiBookOpen /> {book.borrowCount || 0} lượt mượn</span>
                      </div>
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
                          <FiShoppingBag /> {isInCart(book._id) ? "Đã trong giỏ" : "Thêm vào giỏ"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button
                    type="button"
                    className="btn-dfb-outline pagination-btn"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                  >
                    Trang trước
                  </button>
                  <span className="pagination-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-dfb-outline pagination-btn"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-books-found dfb-card">
              <h4>Không tìm thấy sách</h4>
              <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Books;
