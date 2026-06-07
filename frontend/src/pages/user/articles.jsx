import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiCalendar, FiUser, FiArrowRight, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Server_URL } from "../../utils/config";
import Preloader from "../../components/Preloader";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState([]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await axios.get(`${Server_URL}articles`);
        if (data.error === false) {
          setArticles(data.articles || []);
          setFilteredArticles(data.articles || []);
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    const filtered = articles.filter(article =>
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredArticles(filtered);
  }, [searchQuery, articles]);

  if (loading) return <Preloader />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Bài Viết Và Tin Tức</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Cập nhật những bài viết mới nhất về sách, đọc và cộng đồng yêu sách
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full"
                >
                  {/* Featured Image */}
                  <div className="h-48 bg-gradient-to-br from-primary to-teal-700 flex items-center justify-center overflow-hidden">
                    {article.featured_image_url ? (
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">📰</div>
                        <p className="opacity-75">Bài viết</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <FiCalendar size={16} />
                        {new Date(article.created_at).toLocaleDateString("vi-VN")}
                      </span>
                      {article.author && (
                        <span className="flex items-center gap-1">
                          <FiUser size={16} />
                          {article.author.name}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                      {article.excerpt || article.content?.substring(0, 150)}
                    </p>

                    {/* Read More */}
                    <Link
                      to={`/articles/${article.slug}`}
                      className="inline-flex items-center gap-2 text-primary font-semibold hover:text-teal-700 transition-colors mt-auto"
                    >
                      Đọc tiếp <FiArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h3>
              <p className="text-gray-600">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
