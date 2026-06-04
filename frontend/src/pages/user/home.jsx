import React, { useState, useEffect } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiBook, FiSearch, FiClock, FiUser, FiCalendar, FiArrowRight } from "react-icons/fi";
import Preloader from "../../components/Preloader";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    students: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(Server_URL + "home");
      if (!data.error) {
        setStats(data.stats);
        setCategories(data.categories);
        setNewArrivals(data.newArrivals);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Preloader />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Khơi nguồn <span className="text-teal-200">tri thức</span>, kết nối <span className="text-teal-200">cộng đồng</span>
            </h1>
            <p className="text-lg md:text-xl text-teal-50 mb-10 max-w-2xl leading-relaxed">
              D Free Book - Thư viện miễn phí. Mượn sách dễ dàng, lan tỏa văn hóa đọc đến mọi người. Cùng nhau xây dựng một cộng đồng yêu sách.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/books" className="px-8 py-3.5 bg-white text-primary font-bold rounded-full text-center hover:bg-gray-50 shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                <FiBook className="text-xl" /> Khám phá tủ sách
              </Link>
              <Link to="/aboutus" className="px-8 py-3.5 bg-transparent border-2 border-white text-white font-bold rounded-full text-center hover:bg-white hover:text-primary transition-all duration-300 flex items-center justify-center gap-2">
                Về chúng tôi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 relative -mt-10 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="flex items-center gap-6 md:justify-center pt-4 md:pt-0">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-primary">
                <FiBook size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalCategories}+</h3>
                <p className="text-gray-500 font-medium">Danh mục sách</p>
              </div>
            </div>
            <div className="flex items-center gap-6 md:justify-center pt-8 md:pt-0">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-primary">
                <FiBook size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalBooks}+</h3>
                <p className="text-gray-500 font-medium">Cuốn sách</p>
              </div>
            </div>
            <div className="flex items-center gap-6 md:justify-center pt-8 md:pt-0">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-primary">
                <FiUser size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalActiveStudents}</h3>
                <p className="text-gray-500 font-medium">Bạn đọc tích cực</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Danh mục nổi bật</h2>
              <p className="text-gray-600">Tìm kiếm theo thể loại bạn yêu thích</p>
            </div>
            <Link to="/category" className="hidden md:flex items-center gap-2 text-primary font-semibold hover:text-teal-700 transition-colors">
              Xem tất cả <FiArrowRight />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <div key={index} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={cat.coverImage || "/assets/images/default-subject.jpg"} 
                    alt={cat.category}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-4">
                     <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{cat.count} cuốn</span>
                  </div>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{cat.category}</h3>
                  </div>
                  <Link to={`/books`} className="mt-4 flex items-center gap-2 text-primary font-medium group-hover:text-teal-700 transition-colors">
                    Khám phá ngay <FiArrowRight className="transform group-hover:translate-x-1 transition-transform"/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/category" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-teal-700 bg-teal-50 px-6 py-2 rounded-full">
              Xem tất cả <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sách mới về</h2>
              <p className="text-gray-600">Những tựa sách mới nhất được cập nhật</p>
            </div>
            <Link to="/books" className="hidden md:flex items-center gap-2 text-primary font-semibold hover:text-teal-700 transition-colors">
              Xem tất cả tủ sách <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {newArrivals.map((book, index) => (
              <div key={index} className="group flex flex-col h-full bg-white rounded-xl hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100/50">
                <div className="aspect-[2/3] overflow-hidden bg-gray-100">
                  <img 
                    src={book.coverImage || "/assets/images/default-book.png"} 
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex-grow flex flex-col">
                   <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{book.title}</h3>
                   <p className="text-gray-500 text-sm mb-3 line-clamp-1">{book.author}</p>
                   <div className="mt-auto">
                      <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-md">{book.category}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
               <div className="absolute bottom-0 left-0 w-96 h-96 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl"></div>
               
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-6">Trải nghiệm đọc sách miễn phí cùng D Free Book!</h2>
                    <p className="text-teal-50 text-lg mb-8 leading-relaxed">
                       Chúng tôi tin rằng tri thức nên được sẻ chia. Hãy đến và mượn sách, đóng góp cho thư viện, hoặc tham gia làm tình nguyện viên.
                    </p>
                    <Link to="/register" className="inline-block px-8 py-3 bg-white text-primary font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                       Tham gia ngay
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <FiClock className="text-3xl text-teal-200 mb-4" />
                        <h4 className="text-xl font-bold mb-2">Giờ mở cửa</h4>
                        <p className="text-teal-50 leading-relaxed text-sm">
                           Thứ 2 - Chủ Nhật<br/>
                           Sáng: 08:30 - 11:30<br/>
                           Chiều: 14:00 - 17:30<br/>
                           Tối: 18:00 - 21:00
                        </p>
                     </div>
                     <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <FiCalendar className="text-3xl text-teal-200 mb-4" />
                        <h4 className="text-xl font-bold mb-2">Quy định</h4>
                        <p className="text-teal-50 leading-relaxed text-sm">
                           Đặt cọc 50K/cuốn.<br/>
                           Thời gian mượn: 14 ngày.<br/>
                           Trả sách lấy lại cọc.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}