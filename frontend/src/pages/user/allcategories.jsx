import React, { useEffect, useState } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import "./allcategories.css";
import { Link } from "react-router-dom";
import Loader from "../../components/Preloader";
import { showErrorToast } from "../../utils/toasthelper";

export default function ViewAllCategories() {
  const [books, setBooks] = useState([]);
  const [filterBooks, setFilteredBooks] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const getCategoryLabel = (book) => book.categoryId?.name || book.category || "Chưa phân loại";

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${Server_URL}books`);
      const { error, message, books: fetchedBooks } = response.data;

      if (error) {
        showErrorToast(message);
        return;
      }

      setBooks(fetchedBooks || []);
      setFilteredBooks(fetchedBooks || []);

      const categoryCountMap = {};
      (fetchedBooks || []).forEach((book) => {
        const category = getCategoryLabel(book);
        categoryCountMap[category] = (categoryCountMap[category] || 0) + 1;
      });

      setCategoryCounts(categoryCountMap);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showErrorToast("Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (selectedCategory) => {
    setActiveCategory(selectedCategory);
    if (selectedCategory === "All") {
      setFilteredBooks(books);
    } else {
      setFilteredBooks(books.filter((book) => getCategoryLabel(book) === selectedCategory));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const allCategories = [...new Set(books.map((book) => getCategoryLabel(book)))];
  const displayedCategories = [...new Set(filterBooks.map((book) => getCategoryLabel(book)))];

  return (
    <div className="all-categories-container">
      <div className="all-categories-row">
        <nav className="all-categories-sidebar">
          <h5 className="all-categories-sidebar-title">Danh mục</h5>
          <ul className="all-categories-nav">
            <li
              className={`all-categories-nav-item ${activeCategory === "All" ? "active" : ""}`}
              onClick={() => handleCategoryClick("All")}
            >
              Tất cả
            </li>
            {allCategories.map((category, index) => (
              <li
                key={index}
                className={`all-categories-nav-item ${activeCategory === category ? "active" : ""}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </nav>

        <main className="all-categories-main">
          <h2 className="all-categories-main-title">Tất cả danh mục</h2>
          {loading ? (
            <Loader />
          ) : displayedCategories.length > 0 ? (
            <div className="all-categories-grid">
              {displayedCategories.map((category, index) => (
                <div key={index} className="all-categories-card-wrapper">
                  <div className="all-categories-card shadow-sm">
                    <img
                      src={filterBooks.find((book) => getCategoryLabel(book) === category)?.coverImage || "/assets/library.avif"}
                      className="all-categories-card-img"
                      alt={category}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/assets/library.avif";
                      }}
                    />
                    <div className="all-categories-card-body">
                      <h5 className="all-categories-card-title">{category}</h5>
                      <p className="text-muted">{categoryCounts[category] || 0} cuốn</p>
                      <Link to={`/books?category=${encodeURIComponent(category)}`} className="all-categories-btn">
                        Xem sách
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="all-categories-empty">
              <p>Không có sách trong danh mục này.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
