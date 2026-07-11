const nodemailer = require("nodemailer");
require("./loadEnv");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const generateOtpEmailTemplate = (otp, title = "Mã xác thực (OTP) đặt lại mật khẩu", note = "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.") => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
        <h1 style="color: #2e7d32; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">THƯ VIỆN SỐ</h1>
      </div>
      <div style="background-color: #f4fcf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4CAF50; text-align: center;">
        <h2 style="color: #2e7d32; margin-top: 0; font-size: 18px;">${title}</h2>
        <div style="color: #444; line-height: 1.6; font-size: 15px; margin-top: 15px;">
          <p>Mã OTP của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; margin: 20px 0;">${otp}</div>
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #999; font-size: 12px; line-height: 1.5;">
        <p style="margin: 5px 0;">${note}</p>
        <p style="margin: 5px 0;">Đây là email tự động, vui lòng không trả lời qua email này.</p>
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Hệ thống Thư Viện Số. All rights reserved.</p>
      </div>
    </div>
  `;
};

const sendOtpMail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Thư Viện Số" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "[Thư Viện] Mã xác thực đặt lại mật khẩu",
      html: generateOtpEmailTemplate(otp),
    });
    console.log(`Sent OTP email to ${email}`);
  } catch (error) {
    console.error("Error sending OTP mail:", error);
  }
};

const sendRegistrationOtpMail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Thư Viện Số" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "[Thư Viện] Mã xác nhận đăng ký tài khoản",
      html: generateOtpEmailTemplate(
        otp,
        "Mã xác nhận đăng ký tài khoản",
        "Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này."
      ),
    });
    console.log(`Sent registration OTP email to ${email}`);
  } catch (error) {
    console.error("Error sending registration OTP mail:", error);
  }
};

const getDepositStatusText = (status) => {
  const map = {
    pending: "Chờ xác nhận",
    held: "Đã cọc",
    refunded: "Đã hoàn",
    forfeited: "Bị tịch thu",
    none: "Không có"
  };
  return map[status] || "Chưa cập nhật";
};

const generateEmailTemplate = (title, content, ticket) => {
  const booksHtml = ticket.books.map(book => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; width: 60px;">
        <img src="${book.coverImage || 'https://via.placeholder.com/50'}" alt="${book.title}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px;" />
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong style="color: #333; font-size: 15px;">${book.title}</strong><br />
        <span style="color: #666; font-size: 13px;">Tác giả: ${book.author}</span>
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
        <h1 style="color: #2e7d32; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">THƯ VIỆN SỐ</h1>
      </div>
      <div style="background-color: #f4fcf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
        <h2 style="color: #2e7d32; margin-top: 0; font-size: 18px;">${title}</h2>
        <div style="color: #444; line-height: 1.6; font-size: 15px;">
          ${content}
        </div>
      </div>
      <div style="margin-bottom: 25px; background-color: #fafafa; padding: 15px; border-radius: 8px;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 0; font-size: 16px;">CHI TIẾT PHIẾU MƯỢN #${ticket._id}</h3>
        <table style="width: 100%; font-size: 14px; color: #555; line-height: 1.8;">
          <tr>
            <td style="width: 40%;"><strong>Người mượn:</strong></td>
            <td>${ticket.userId?.name || 'Bạn'}</td>
          </tr>
          <tr>
            <td><strong>Ngày tạo phiếu:</strong></td>
            <td>${new Date(ticket.createdAt).toLocaleString('vi-VN')}</td>
          </tr>
          ${ticket.dueDate ? `
          <tr>
            <td><strong>Hạn trả sách:</strong></td>
            <td><strong style="color: #d84315;">${new Date(ticket.dueDate).toLocaleDateString('vi-VN')}</strong></td>
          </tr>
          ` : ''}
          <tr>
            <td><strong>Trạng thái cọc:</strong></td>
            <td>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background-color: ${ticket.depositStatus === 'held' ? '#e8f5e9' : '#fff3e0'}; color: ${ticket.depositStatus === 'held' ? '#2e7d32' : '#e65100'}; border: 1px solid ${ticket.depositStatus === 'held' ? '#a5d6a7' : '#ffcc80'};">
                ${getDepositStatusText(ticket.depositStatus)}
              </span>
            </td>
          </tr>
          <tr>
            <td><strong>Tiền cọc sách:</strong></td>
            <td><strong>${Number(ticket.depositAmount).toLocaleString('vi-VN')} VNĐ</strong></td>
          </tr>
          ${ticket.shippingFee > 0 ? `
          <tr>
            <td><strong>Phí giao hàng:</strong></td>
            <td><strong>${Number(ticket.shippingFee).toLocaleString('vi-VN')} VNĐ</strong></td>
          </tr>
          <tr>
            <td><strong>Tổng thanh toán:</strong></td>
            <td><strong style="color: #e53935; font-size: 15px;">${(Number(ticket.depositAmount) + Number(ticket.shippingFee)).toLocaleString('vi-VN')} VNĐ</strong></td>
          </tr>
          ` : ''}
          <tr>
            <td><strong>Phương thức nhận:</strong></td>
            <td><span style="color: #1976d2; font-weight: bold;">Giao tận nơi</span></td>
          </tr>
          ${ticket.shippingAddress ? `
          <tr>
            <td style="vertical-align: top;"><strong>Địa chỉ giao:</strong></td>
            <td>${ticket.shippingAddress}<br/>(SĐT: ${ticket.shippingPhone})</td>
          </tr>
          ` : ''}
        </table>
      </div>
      <div>
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 16px;">SÁCH BẠN MƯỢN</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          ${booksHtml}
        </table>
      </div>
      <div style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #999; font-size: 12px; line-height: 1.5;">
        <p style="margin: 5px 0;">Đây là email tự động, vui lòng không trả lời qua email này.</p>
        <p style="margin: 5px 0;">Nếu cần hỗ trợ, vui lòng liên hệ admin qua website.</p>
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Hệ thống Thư Viện Số. All rights reserved.</p>
      </div>
    </div>
  `;
};

const sendDepositSuccessMail = async (ticket) => {
  if (!ticket || !ticket.userId || !ticket.userId.email) return;
  const email = ticket.userId.email;
  const total = Number(ticket.depositAmount) + Number(ticket.shippingFee);
  const amountStr = total.toLocaleString("vi-VN");
  
  try {
    const title = "Xác nhận đặt cọc thành công";
    const content = `
      <p>Chào <strong>${ticket.userId.name}</strong>,</p>
      <p>Chúng tôi đã nhận được khoản thanh toán đặt cọc <strong>${amountStr} VNĐ</strong> cho phiếu mượn sách của bạn.</p>
      <p>Phiếu mượn đang chờ quản trị viên phê duyệt. Chúng tôi sẽ gửi email thông báo cho bạn ngay khi phiếu được duyệt thành công.</p>
      <p>Cảm ơn bạn đã đồng hành cùng thư viện!</p>
    `;
    
    await transporter.sendMail({
      from: `"Thư Viện Số" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[Thư Viện] Đặt cọc thành công - Phiếu mượn #${ticket._id}`,
      html: generateEmailTemplate(title, content, ticket),
    });
    console.log(`Sent deposit success email to ${email} for ticket ${ticket._id}`);
  } catch (error) {
    console.error("Error sending deposit success mail:", error);
  }
};

const sendApprovalSuccessMail = async (ticket) => {
  if (!ticket || !ticket.userId || !ticket.userId.email) return;
  const email = ticket.userId.email;
  
  try {
    const title = "Tuyệt vời! Phiếu mượn sách đã được phê duyệt";
    const dueDate = ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString('vi-VN') : '14 ngày kể từ ngày duyệt';
    const content = `
      <p>Chào <strong>${ticket.userId.name}</strong>,</p>
      <p>Phiếu mượn sách của bạn đã được quản trị viên <strong>phê duyệt thành công</strong>.</p>
      ${ticket.shippingAddress 
        ? '<p>Thư viện đang chuẩn bị sách và sẽ sớm giao đến địa chỉ của bạn. Bạn vui lòng chú ý điện thoại nhé!</p>'
        : '<p>Bạn có thể sắp xếp thời gian đến thư viện để nhận sách bất cứ lúc nào trong giờ làm việc.</p>'}
      <p><strong>Lưu ý quan trọng:</strong> Hạn trả sách dự kiến là ngày <strong>${dueDate}</strong>. Bạn vui lòng trả sách đúng hạn để tránh bị trừ tiền cọc nhé.</p>
      <p>Chúc bạn có những giờ phút đọc sách thật thú vị và bổ ích!</p>
    `;

    await transporter.sendMail({
      from: `"Thư Viện Số" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[Thư Viện] Phiếu mượn đã được duyệt - Phiếu mượn #${ticket._id}`,
      html: generateEmailTemplate(title, content, ticket),
    });
    console.log(`Sent approval email to ${email} for ticket ${ticket._id}`);
  } catch (error) {
    console.error("Error sending approval mail:", error);
  }
};

const sendContactNotification = async (contactInfo) => {
  try {
    const { name, email, subject, message } = contactInfo;
    const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER;

    if (!adminEmail) {
      console.warn("CONTACT_RECEIVER_EMAIL or EMAIL_USER is not configured; skipping contact notification email");
      return;
    }
    
    const subjectMap = {
      general: "Câu hỏi chung",
      borrow: "Mượn / trả sách",
      donate: "Hiến sách",
      volunteer: "Tình nguyện",
      feedback: "Góp ý",
      other: "Khác"
    };
    const displaySubject = subjectMap[subject] || subject;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(displaySubject);
    const safeMessage = escapeHtml(message);

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
          <h1 style="color: #2e7d32; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">THƯ VIỆN SỐ</h1>
        </div>
        <div style="background-color: #f4fcf5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
          <h2 style="color: #2e7d32; margin-top: 0; font-size: 18px;">Tin nhắn liên hệ mới</h2>
          <p style="color: #444; font-size: 15px; margin-bottom: 0;">Bạn vừa nhận được một tin nhắn liên hệ mới từ người dùng trên hệ thống website.</p>
        </div>
        
        <div style="margin-bottom: 25px; background-color: #fafafa; padding: 15px; border-radius: 8px;">
          <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 0; font-size: 16px;">THÔNG TIN NGƯỜI GỬI</h3>
          <table style="width: 100%; font-size: 14px; color: #555; line-height: 1.8;">
            <tr>
              <td style="width: 35%;"><strong>Họ và tên:</strong></td>
              <td><span style="color: #333; font-weight: 500;">${safeName}</span></td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td><a href="mailto:${safeEmail}" style="color: #1976d2; text-decoration: none;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td><strong>Thời gian:</strong></td>
              <td>${new Date().toLocaleString('vi-VN')}</td>
            </tr>
          </table>
        </div>

        <div>
          <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 16px;">NỘI DUNG LIÊN HỆ</h3>
          <div style="margin-bottom: 15px;">
            <span style="display: inline-block; background-color: #e3f2fd; color: #1565c0; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: bold; margin-bottom: 10px;">
              Chủ đề: ${safeSubject}
            </span>
          </div>
          <div style="background-color: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 6px; color: #444; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</div>
        </div>

        <div style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px solid #eaeaea;">
          <a href="mailto:${safeEmail}" style="display: inline-block; background-color: #4CAF50; color: #fff; text-decoration: none; padding: 10px 25px; border-radius: 4px; font-weight: bold; font-size: 14px;">Trả lời Email này</a>
        </div>

        <div style="text-align: center; margin-top: 25px; color: #999; font-size: 12px; line-height: 1.5;">
          <p style="margin: 5px 0;">Đây là email tự động từ hệ thống Thư Viện Số.</p>
          <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Hệ thống Thư Viện Số. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Thư Viện Số" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `[Liên hệ mới] Chủ đề: ${displaySubject}`,
      html: htmlContent,
    });
    console.log(`Sent contact notification to ${adminEmail}`);
  } catch (error) {
    console.error("Error sending contact notification:", error);
  }
};

const sendRenewalSuccessMail = async (ticket, oldDueDate, newDueDate) => {
  if (!ticket || !ticket.userId || !ticket.userId.email) return;
  const email = ticket.userId.email;
  
  try {
    const title = "Gia hạn phiếu mượn thành công";
    const oldDateStr = new Date(oldDueDate).toLocaleDateString('vi-VN');
    const newDateStr = new Date(newDueDate).toLocaleDateString('vi-VN');
    
    const content = `
      <p>Chào <strong>${ticket.userId.name}</strong>,</p>
      <p>Yêu cầu gia hạn sách của bạn đã được xử lý thành công.</p>
      <p>Hạn trả sách cũ: <strike>${oldDateStr}</strike></p>
      <p>Hạn trả sách mới: <strong style="color: #d84315;">${newDateStr}</strong></p>
      <p>Bạn vui lòng hoàn trả sách đúng hạn mới để tránh bị trừ tiền cọc nhé.</p>
      <p>Chúc bạn có những giờ phút đọc sách thật thú vị và bổ ích!</p>
    `;

    await transporter.sendMail({
      from: `"Thư Viện Số" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[Thư Viện] Gia hạn sách thành công - Phiếu #${ticket._id}`,
      html: generateEmailTemplate(title, content, ticket),
    });
    console.log(`Sent renewal success email to ${email} for ticket ${ticket._id}`);
  } catch (error) {
    console.error("Error sending renewal success mail:", error);
  }
};

module.exports = { transporter, sendDepositSuccessMail, sendApprovalSuccessMail, sendOtpMail, sendRegistrationOtpMail, sendContactNotification, sendRenewalSuccessMail };