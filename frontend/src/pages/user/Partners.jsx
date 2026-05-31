import React from 'react';
import './partners.css';

const Partners = () => {
  const partners = [
    { name: 'Cộng đồng tình nguyện D Free Book', desc: 'Đồng hành xây dựng và vận hành thư viện' },
    { name: 'Các nhà hảo tâm & độc giả', desc: 'Hiến tặng sách và hỗ trợ hoạt động thư viện' },
    { name: 'Tổ chức giáo dục & xã hội', desc: 'Kết nối chương trình tủ sách cho em' },
  ];

  return (
    <div className="partners-page">
      <section className="partners-hero">
        <div className="container-dfb">
          <h1>Đối tác & truyền thông</h1>
          <p>Cùng nhau lan tỏa tri thức và văn hóa đọc</p>
        </div>
      </section>
      <section className="container-dfb partners-content">
        <p className="partners-intro">
          D Free Book trân trọng sự đồng hành của cộng đồng, báo chí và các đối tác trong hành trình
          mang sách đến với mọi người.
        </p>
        <div className="partners-grid">
          {partners.map((p, i) => (
            <div key={i} className="partner-card dfb-card">
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="partners-contact">
          Liên hệ hợp tác:{' '}
          <a href="mailto:thuviendfb@gmail.com">thuviendfb@gmail.com</a>
        </p>
      </section>
    </div>
  );
};

export default Partners;
