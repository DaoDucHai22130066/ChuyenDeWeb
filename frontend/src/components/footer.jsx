import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">📚</span>
              D Free Book
            </h3>
            <p className="text-[#cedee0] leading-relaxed">
              Thư viện cộng đồng cho mượn sách miễn phí và đặt cọc niềm tin.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-[#cedee0] hover:text-white transition-colors block">Trang chủ</Link></li>
              <li><Link to="/books" className="text-[#cedee0] hover:text-white transition-colors block">Tủ sách</Link></li>
              <li><Link to="/category" className="text-[#cedee0] hover:text-white transition-colors block">Phân loại</Link></li>
              <li><Link to="/aboutus" className="text-[#cedee0] hover:text-white transition-colors block">Giới thiệu</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li><Link to="/contactus" className="text-[#cedee0] hover:text-white transition-colors block">Liên hệ</Link></li>
              <li><Link to="/faq" className="text-[#cedee0] hover:text-white transition-colors block">Câu hỏi thường gặp</Link></li>
              <li><Link to="/rules" className="text-[#cedee0] hover:text-white transition-colors block">Quy định mượn sách</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Kết nối với chúng tôi</h4>
            <p className="text-[#cedee0]">Theo dõi Fanpage để cập nhật sách mới mỗi ngày.</p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="text-lg">F</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="text-lg">I</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="text-lg">Y</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#cedee0] text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} D Free Book. Nền tảng chia sẻ tri thức cộng đồng.
          </p>
          <div className="flex space-x-6 text-sm text-[#cedee0]">
            <Link to="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}