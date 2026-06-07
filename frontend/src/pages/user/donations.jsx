import React, { useState } from "react";
import axios from "axios";
import { FiHeart, FiBook, FiDollarSign, FiCheck } from "react-icons/fi";
import { Server_URL } from "../../utils/config";
import { toast } from "react-toastify";

export default function Donations() {
  const [donationType, setDonationType] = useState("money");
  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    amount: "",
    description: "",
    book_count: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.donor_name || !formData.donor_email) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        donation_type: donationType,
      };

      const { data } = await axios.post(`${Server_URL}donations`, payload);
      
      if (data.error === false) {
        toast.success("Cảm ơn bạn đã quyên góp! Chúng tôi sẽ liên hệ sớm.");
        setSubmitted(true);
        setFormData({
          donor_name: "",
          donor_email: "",
          donor_phone: "",
          amount: "",
          description: "",
          book_count: "",
        });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
      console.error("Error submitting donation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-teal-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <FiHeart className="text-red-400" size={32} />
            <h1 className="text-4xl font-bold">Quyên Góp & Ủng Hộ</h1>
          </div>
          <p className="text-teal-100 text-lg max-w-2xl">
            Giúp chúng tôi phát triển thư viện sách miễn phí cho cộng đồng. Mọi sự hỗ trợ đều quý giá!
          </p>
        </div>
      </section>

      {/* Why Donate Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Tại Sao Quyên Góp?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <FiBook className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Xây Dựng Thư Viện</h3>
              <p className="text-gray-600">
                Mỗi quyên góp sách giúp chúng tôi mở rộng bộ sưu tập và phục vụ nhiều bạn đọc hơn
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hỗ Trợ Hoạt Động</h3>
              <p className="text-gray-600">
                Quỹ tài chính giúp duy trì hoạt động, bảo trì cơ sở vật chất
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <FiHeart className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lan Tỏa Tri Thức</h3>
              <p className="text-gray-600">
                Cùng chúng tôi lan tỏa tình yêu đọc sách đến mọi tầng lớp xã hội
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Tôi Muốn Quyên Góp</h2>

          {/* Donation Type Tabs */}
          <div className="flex gap-4 mb-8">
            {[
              { type: "money", label: "💰 Tiền", icon: FiDollarSign },
              { type: "books", label: "📚 Sách", icon: FiBook },
              { type: "supplies", label: "🎁 Vật Dụng", icon: FiHeart },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => setDonationType(item.type)}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                  donationType === item.type
                    ? "bg-primary text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block font-bold text-gray-900 mb-2">
                  Tên của bạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="donor_name"
                  value={formData.donor_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
                  placeholder="Nhập tên của bạn"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-gray-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="donor_email"
                  value={formData.donor_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-gray-900 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  name="donor_phone"
                  value={formData.donor_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
                  placeholder="0987654321"
                />
              </div>

              {/* Amount or Count */}
              {donationType === "money" && (
                <div>
                  <label className="block font-bold text-gray-900 mb-2">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
                    placeholder="100000"
                  />
                </div>
              )}

              {donationType === "books" && (
                <div>
                  <label className="block font-bold text-gray-900 mb-2">Số lượng sách</label>
                  <input
                    type="number"
                    name="book_count"
                    value={formData.book_count}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
                    placeholder="10"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-900 mb-2">Mô tả hoặc Ghi chú</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100 resize-none"
                  placeholder="Nhập mô tả hoặc ghi chú của bạn"
                  rows="4"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Đang gửi..." : "Gửi Quyên Góp"}
              </button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <FiCheck className="text-green-600" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Cảm ơn bạn!</h3>
              <p className="text-gray-600">
                Chúng tôi đã nhận được thông tin quyên góp của bạn. <br />
                Sớm chúng tôi sẽ liên hệ để sắp xếp chi tiết.
              </p>
            </div>
          )}

          {/* Bank Account Info */}
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3">💳 Chuyển Khoản Ngân Hàng</h3>
            <p className="text-gray-600 mb-2">
              <strong>Ngân hàng:</strong> Vietcombank
            </p>
            <p className="text-gray-600 mb-2">
              <strong>Số TK:</strong> 0123 4567 8901
            </p>
            <p className="text-gray-600">
              <strong>Chủ TK:</strong> D Free Book - Thư Viện Sách Miễn Phí
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Vui lòng chuyển tiền và gửi ảnh chứng minh tới email: donations@dfreebook.vn
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
