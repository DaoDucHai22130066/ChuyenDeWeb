import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPhone, FiMail, FiMapPin, FiClock, FiImage } from "react-icons/fi";
import { Server_URL } from "../../utils/config";
import Preloader from "../../components/Preloader";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await axios.get(`${Server_URL}branches`);
        if (data.error === false) {
          setBranches(data.branches || []);
          if (data.branches && data.branches.length > 0) {
            setSelectedBranch(0);
          }
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  if (loading) return <Preloader />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Các Chi Nhánh Của Chúng Tôi</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            D Free Book có mặt tại nhiều địa điểm. Tìm chi nhánh gần nhất và ghé thăm chúng tôi
          </p>
        </div>
      </section>

      {/* Branches Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Branches List */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {branches.map((branch, index) => (
                  <div
                    key={branch.id}
                    onClick={() => setSelectedBranch(index)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBranch === index
                        ? "border-primary bg-teal-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{branch.name}</h3>
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <FiMapPin className="text-primary flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{branch.address}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiPhone className="text-primary flex-shrink-0" />
                      <p>{branch.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Branch Details */}
            {selectedBranch !== null && branches[selectedBranch] && (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Branch Image */}
                  <div className="h-64 bg-gradient-to-br from-primary to-teal-700 flex items-center justify-center">
                    <div className="text-white text-center">
                      <FiImage size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="opacity-75">Thư viện sách miễn phí</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      {branches[selectedBranch].name}
                    </h2>

                    <div className="space-y-6">
                      {/* Address */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <FiMapPin className="text-primary" size={20} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">Địa chỉ</h3>
                          <p className="text-gray-600">{branches[selectedBranch].address}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <FiPhone className="text-primary" size={20} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">Liên hệ</h3>
                          <a href={`tel:${branches[selectedBranch].phone}`} className="text-primary hover:text-teal-700 font-medium">
                            {branches[selectedBranch].phone}
                          </a>
                        </div>
                      </div>

                      {/* Email */}
                      {branches[selectedBranch].email && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <FiMail className="text-primary" size={20} />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                            <a href={`mailto:${branches[selectedBranch].email}`} className="text-primary hover:text-teal-700 font-medium">
                              {branches[selectedBranch].email}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Opening Hours */}
                      {branches[selectedBranch].opening_hours && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <FiClock className="text-primary" size={20} />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1">Giờ mở cửa</h3>
                            <p className="text-gray-600">{branches[selectedBranch].opening_hours}</p>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {branches[selectedBranch].description && (
                        <div className="pt-6 border-t border-gray-200">
                          <h3 className="font-bold text-gray-900 mb-3">Giới thiệu</h3>
                          <p className="text-gray-600 leading-relaxed">
                            {branches[selectedBranch].description}
                          </p>
                        </div>
                      )}

                      {/* CTA Button */}
                      <button className="w-full mt-8 px-6 py-3 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/30 hover:bg-teal-700 transition-all">
                        Thăm chi nhánh này
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-white border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Quy Định Của Chúng Tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <FiClock className="text-primary" size={32} />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Thời Gian Mượn</h3>
              <p className="text-gray-600">Mượn sách trong 14 ngày</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="text-primary" size={32} />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Đặt Cọc</h3>
              <p className="text-gray-600">50,000 VNĐ/cuốn sách</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <FiPhone className="text-primary" size={32} />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Hỗ Trợ 24/7</h3>
              <p className="text-gray-600">Liên hệ qua các kênh hỗ trợ</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
