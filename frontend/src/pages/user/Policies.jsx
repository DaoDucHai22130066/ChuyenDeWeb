import { useParams, Link } from 'react-router-dom';

const POLICY_CONTENT = {
  'ho-tro': {
    title: 'Chính sách hỗ trợ',
    sections: [
      {
        heading: 'Nguyên tắc hoạt động',
        body: 'D Free Book hoạt động theo mô hình: mượn sách miễn phí, đặt cọc hoàn lại khi trả đúng quy định, phí trễ hạn thấp và rõ ràng, cùng đóng góp tự nguyện để duy trì hoạt động cộng đồng.',
      },
      {
        heading: 'Hỗ trợ độc giả',
        body: 'Chúng tôi hỗ trợ tra cứu sách, hướng dẫn đăng ký mượn online, tư vấn đặt cọc và hoàn cọc, cũng như giải thích rõ mức phí trễ hạn trước khi xác nhận mượn.',
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
        body: 'Độc giả vui lòng trả sách đúng hạn và trong tình trạng tốt. Nếu trả đúng quy định, khoản đặt cọc sẽ được hoàn lại. Nếu sách bị hư hỏng hoặc mất, vui lòng liên hệ thư viện để thống nhất phương án bồi hoàn hoặc thay thế bằng sách tương đương.',
      },
      {
        heading: 'Gia hạn',
        body: 'Trong tinh thần thư viện cộng đồng, bạn có thể liên hệ để gia hạn khi cần thêm thời gian đọc. Phí trễ hạn chỉ áp dụng khi quá hạn và sẽ được thông báo trước theo bảng quy định.',
      },
      {
        heading: 'Đóng góp hỗ trợ',
        body: 'Quyên góp hoặc hội viên hỗ trợ hoàn toàn là lựa chọn tự nguyện, không phải điều kiện bắt buộc để được mượn sách.',
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
        body: 'Khi đăng ký tài khoản, bạn đồng ý sử dụng dịch vụ mượn sách một cách trung thực, tôn trọng tài sản chung, các điều khoản đặt cọc hoàn lại và chính sách phí trễ hạn đã công bố.',
      },
      {
        heading: 'Trách nhiệm',
        body: 'Người mượn chịu trách nhiệm bảo quản sách trong thời gian mượn. Thư viện có quyền từ chối phục vụ nếu vi phạm nghiêm trọng quy định về hoàn trả, đặt cọc hoặc làm hư hỏng tài sản chung.',
      },
    ],
  },
};

const Policies = () => {
  const { slug } = useParams();
  const policy = POLICY_CONTENT[slug];

  if (!policy) {
    return (
      <div className="container-dfb policy-content">
        <h1>Không tìm thấy trang</h1>
        <p>
          <Link to="/">Về trang chủ</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-dfb policy-content">
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
