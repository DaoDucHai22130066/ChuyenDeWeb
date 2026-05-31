import React from 'react';
import { useParams, Link } from 'react-router-dom';

const POLICY_CONTENT = {
  'ho-tro': {
    title: 'Chính sách hỗ trợ',
    sections: [
      {
        heading: 'Nguyên tắc 3 không',
        body: 'D Free Book hoạt động theo tiêu chí: không thu phí mượn sách, không đặt cọc tiền, không giới hạn đối tượng độc giả. Mọi hoạt động dựa trên niềm tin và sự tự giác của cộng đồng.',
      },
      {
        heading: 'Hỗ trợ độc giả',
        body: 'Chúng tôi hỗ trợ tra cứu sách, hướng dẫn đăng ký mượn online và tư vấn nhận sách tại chi nhánh hoặc qua đơn vị vận chuyển (phí ship do người mượn chi trả nếu chọn giao hàng).',
      },
      {
        heading: 'Liên hệ',
        body: 'Mọi thắc mắc vui lòng gửi email thuviendfb@gmail.com hoặc nhắn tin qua fanpage Facebook D Free Book.',
      },
    ],
  },
  'doi-tra': {
    title: 'Chính sách đổi trả',
    sections: [
      {
        heading: 'Trả sách',
        body: 'Độc giả vui lòng trả sách đúng hạn và trong tình trạng tốt. Nếu sách bị hư hỏng hoặc mất, vui lòng liên hệ thư viện để thống nhất phương án bồi hoàn hoặc thay thế bằng sách tương đương.',
      },
      {
        heading: 'Gia hạn',
        body: 'Trong tinh thần thư viện cộng đồng, bạn có thể liên hệ để gia hạn khi cần thêm thời gian đọc, tránh giữ sách quá lâu để người khác có cơ hội mượn.',
      },
    ],
  },
  'bao-mat': {
    title: 'Chính sách bảo mật',
    sections: [
      {
        heading: 'Thu thập thông tin',
        body: 'Chúng tôi chỉ thu thập thông tin cần thiết cho việc đăng ký tài khoản và quản lý mượn trả (họ tên, email, số điện thoại nếu có).',
      },
      {
        heading: 'Sử dụng & bảo vệ',
        body: 'Thông tin cá nhân không được chia sẻ cho bên thứ ba vì mục đích thương mại. Dữ liệu được bảo vệ theo các biện pháp kỹ thuật phù hợp.',
      },
    ],
  },
  'dieu-khoan': {
    title: 'Điều khoản dịch vụ',
    sections: [
      {
        heading: 'Điều kiện sử dụng',
        body: 'Khi đăng ký tài khoản, bạn đồng ý sử dụng dịch vụ mượn sách một cách trung thực, tôn trọng tài sản chung và cộng đồng độc giả.',
      },
      {
        heading: 'Trách nhiệm',
        body: 'Người mượn chịu trách nhiệm bảo quản sách trong thời gian mượn. Thư viện có quyền từ chối phục vụ nếu vi phạm nghiêm trọng quy định.',
      },
    ],
  },
};

const Policies = () => {
  const { slug } = useParams();
  const policy = POLICY_CONTENT[slug];

  if (!policy) {
    return (
      <div className="container-dfb policy-content" style={{ marginTop: '2rem' }}>
        <h1>Không tìm thấy trang</h1>
        <p>
          <Link to="/">Về trang chủ</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-dfb policy-content" style={{ marginTop: '2rem' }}>
      <h1>{policy.title}</h1>
      {policy.sections.map((s, i) => (
        <div key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
  );
};

export default Policies;
