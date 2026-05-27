import React, { useState, useEffect } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import { Link } from "react-router-dom";
import Loader from "../../components/Preloader";
import { showErrorToast } from "../../utils/toasthelper";
import { FiFilter, FiArrowRight } from "react-icons/fi";

export default function ViewAllCategories() {
  const [books, setBooks] = useState([]);
  const [filterBooks, setFilteredBooks] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const url = Server_URL + "books";
      const response = await axios.get(url);
      const { error, message, books } = response.data;

      if (error) {
        showErrorToast(message);
      } else {
        setBooks(books);
        setFilteredBooks(books);

        const categoryCountMap = {};
        books.forEach((book) => {
          const cat = book.category;
          categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
        });

        setCategoryCounts(categoryCountMap);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showErrorToast("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (selectedCategory) => {
    setActiveCategory(selectedCategory);
    if (selectedCategory === "All") {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        (book) => book.category === selectedCategory
      );
      setFilteredBooks(filtered);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiFilter className="text-primary" /> Phân loại
              </h4>
              <div className="flex flex-col space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <button
                  className={`text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    activeCategory === "All"
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleCategoryClick("All")}
                >
                  Tất cả danh mục
                </button>
                {[...new Set(books.map((book) => book.category))].map(
                  (category, index) => (
                    <button
                      key={index}
                      className={`text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                        activeCategory === category
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
               <h2 className="text-2xl font-bold text-gray-900">Danh mục sách</h2>
               <p className="text-gray-500 font-medium">Tìm thấy {Object.keys(categoryCounts).length} danh mục</p>
            </div>

            {loading ? (
              <Loader />
            ) : filterBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...new Set(filterBooks.map((book) => book.category))].map(
                  (category, index) => (
                    <div key={index} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={filterBooks.find((b) => b.category === category)?.coverImage || "/assets/images/default-subject.jpg"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={category}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/assets/images/default-subject.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-4">
                           <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{categoryCounts[category] || 0} cuốn</span>
                        </div>
                      </div>
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <h5 className="text-xl font-bold text-gray-900 mb-4 line-clamp-1">
                          {category}
                        </h5>
                        <Link to="/books" className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 text-primary font-medium rounded-xl hover:bg-primary hover:text-white transition-colors group-hover:shadow-md">
                          Khám phá <FiArrowRight className="transform group-hover:translate-x-1 transition-transform"/>
                        </Link>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <FiFilter className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy danh mục nào!</h4>
                <p className="text-gray-500">Thư viện hiện chưa có sách trong danh mục này.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
