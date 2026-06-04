import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiHeart, FiTruck, FiUsers } from 'react-icons/fi';
import './activities.css';

const Activities = () => {
  const activities = [
    {
      icon: <FiBook />,
      title: 'Mượn sách online',
      description:
        'Đăng ký mượn sách trực tuyến hoàn toàn miễn phí. Khi cần, bạn chỉ đặt cọc hoàn lại và có thể phát sinh phí trễ hạn nếu trả muộn theo quy định.',
      cta: { to: '/books', label: 'Xem danh sách sách' },
    },
    {
      icon: <FiHeart />,
      title: 'Tủ sách cho em',
      description:
        'Chương trình trao tặng sách và xây dựng tủ sách tại các vùng còn khó khăn, lan tỏa văn hóa đọc đến trẻ em trên cả nước.',
    },
    {
      icon: <FiUsers />,
      title: 'Sự kiện & cộng đồng',
      description:
        'Gặp gỡ những người yêu sách, tham gia buổi chia sẻ, review sách và các hoạt động thiện nguyện cùng D Free Book.',
      link: 'https://www.facebook.com/dfreebook',
      linkLabel: 'Theo dõi trên Facebook',
    },
    {
      icon: <FiTruck />,
      title: 'Kết nối & tặng sách',
      description:
        'D Free Book kết nối với các tổ chức, cá nhân để trung chuyển sách đến nơi cần — vì “sách nằm im là sách chết”.',
    },
    {
      icon: <FiHeart />,
      title: 'Hội viên và quyên góp',
      description:
        'Ai muốn đồng hành lâu dài có thể đóng góp tự nguyện hoặc trở thành hội viên hỗ trợ hoạt động của thư viện.',
    },
  ];

  return (
    <div className="activities-page">
      <section className="activities-hero">
        <div className="container-dfb">
          <h1>Hoạt động</h1>
          <p>Lan tỏa văn hóa đọc và sự tử tế đến cộng đồng</p>
        </div>
      </section>

      <section className="activities-list container-dfb">
        <div className="activities-grid">
          {activities.map((item, i) => (
            <article key={i} className="activity-card dfb-card">
              <div className="activity-icon">{item.icon}</div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              {item.cta && (
                <Link to={item.cta.to} className="btn-dfb-primary">
                  {item.cta.label}
                </Link>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dfb-outline"
                >
                  {item.linkLabel}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Activities;
