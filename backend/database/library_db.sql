CREATE DATABASE IF NOT EXISTS library_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE library_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS borrow_ticket_books;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS borrow_tickets;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  BẢNG users
-- ============================================================
CREATE TABLE users (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NULL,
  role         ENUM('admin','user') NOT NULL DEFAULT 'user',
  stream       VARCHAR(255) NULL,
  year         INT NULL,
  phone        VARCHAR(20) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG categories
-- ============================================================
CREATE TABLE categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG books
-- ============================================================
CREATE TABLE books (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  author           VARCHAR(255) NOT NULL,
  category         VARCHAR(255) NULL,
  category_id      INT UNSIGNED NULL,
  isbn             VARCHAR(255) NOT NULL UNIQUE,
  description      TEXT NOT NULL,
  available_copies INT NOT NULL,
  total_copies     INT NOT NULL,
  added_by         INT UNSIGNED NOT NULL,
  cover_image      TEXT NULL,
  cloudinary_id    VARCHAR(255) NULL,
  price            DECIMAL(10,2) NULL,
  branch           ENUM('dai-la','cau-giay') NOT NULL DEFAULT 'dai-la',
  borrow_count     INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_books_category (category_id),
  INDEX idx_books_added_by (added_by),
  CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL  ON UPDATE CASCADE,
  CONSTRAINT fk_books_user     FOREIGN KEY (added_by)    REFERENCES users(id)      ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG borrow_tickets
-- ============================================================
CREATE TABLE borrow_tickets (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  status      ENUM('pending','awaiting_payment','paid','approved','dispatched','delivered','returned','closed','cancelled') NOT NULL DEFAULT 'pending',
  borrow_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date    DATETIME NULL DEFAULT NULL,
  return_date TIMESTAMP NULL DEFAULT NULL,
  deposit_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_status  ENUM('none','pending','held','refunded','forfeited') NOT NULL DEFAULT 'none',
  payment_method  ENUM('cash','vnpay') NOT NULL DEFAULT 'cash',
  shipping_fee    DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_status ENUM('none','pending','dispatched','delivered','returned') NOT NULL DEFAULT 'none',
  shipping_address VARCHAR(255) NULL,
  shipping_phone  VARCHAR(20) NULL,
  fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  approved_by INT UNSIGNED NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket_user   (user_id),
  INDEX idx_ticket_status (status),
  CONSTRAINT fk_ticket_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE RESTRICT  ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG borrow_ticket_books
-- ============================================================
CREATE TABLE borrow_ticket_books (
  ticket_id INT UNSIGNED NOT NULL,
  book_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (ticket_id, book_id),
  CONSTRAINT fk_ticket_books_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_books_book   FOREIGN KEY (book_id)   REFERENCES books(id)          ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG transactions
-- ============================================================
CREATE TABLE transactions (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ticket_id    INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  type         ENUM('deposit','fine','shipping','volunteer_stipend') NOT NULL,
  method       ENUM('cash','vnpay') NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  status       ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  vnpay_txn_ref VARCHAR(64) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_transactions_ticket (ticket_id),
  INDEX idx_transactions_status (status),
  CONSTRAINT fk_transactions_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG carts
-- ============================================================
CREATE TABLE carts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG cart_items
-- ============================================================
CREATE TABLE cart_items (
  cart_id    INT UNSIGNED NOT NULL,
  book_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (cart_id, book_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG contacts
-- ============================================================
CREATE TABLE contacts (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(255) NOT NULL,
  email   VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  BẢNG otps
-- ============================================================
CREATE TABLE otps (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  otp        VARCHAR(16)  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  DỮ LIỆU MẪU -- users  (password: Admin@123 / Student@123)
-- ============================================================
INSERT INTO users (id, name, email, password, role, stream, year) VALUES
  (1,  'Quản trị viên',    'admin@thuvien.edu.vn',    '$2b$10$JOgXgVkT8v2/ghLegY8QaupRdFlSfsBiV0ZuMWpBF0SNV43ctGzWC', 'admin', NULL,                    NULL),
  (2,  'Nguyễn Văn An',   'an.nguyen@sv.edu.vn',     '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Công nghệ thông tin',   3),
  (3,  'Trần Thị Bích',   'bich.tran@sv.edu.vn',     '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Kinh tế',               2),
  (4,  'Lê Minh Khoa',    'khoa.le@sv.edu.vn',       '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Kỹ thuật điện tử',     4),
  (5,  'Phạm Thu Hà',     'ha.pham@sv.edu.vn',       '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Ngôn ngữ Anh',          1),
  (6,  'Hoàng Đức Mạnh',  'manh.hoang@sv.edu.vn',    '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Công nghệ thông tin',   2),
  (7,  'Vũ Thị Lan',      'lan.vu@sv.edu.vn',        '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Quản trị kinh doanh',   3),
  (8,  'Đặng Quốc Hùng',  'hung.dang@sv.edu.vn',     '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Khoa học máy tính',     4),
  (9,  'Bùi Thị Mai',     'mai.bui@sv.edu.vn',       '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Y khoa',                2),
  (10, 'Ngô Thanh Tùng',  'tung.ngo@sv.edu.vn',      '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user',  'Luật',                  1),
  (11, 'Đinh Thị Hoa',    'hoa.dinh@thuvien.edu.vn', '$2b$10$JOgXgVkT8v2/ghLegY8QaupRdFlSfsBiV0ZuMWpBF0SNV43ctGzWC', 'admin', NULL,                    NULL);


-- ============================================================
--  DỮ LIỆU MẪU -- categories
-- ============================================================
INSERT INTO categories (id, name) VALUES
  (1,  'Công nghệ thông tin'),
  (2,  'Văn học'),
  (3,  'Khoa học tự nhiên'),
  (4,  'Kỹ năng sống'),
  (5,  'Kinh tế & Kinh doanh'),
  (6,  'Lịch sử & Địa lý'),
  (7,  'Triết học & Tâm lý học'),
  (8,  'Ngoại ngữ'),
  (9,  'Y học & Sức khoẻ'),
  (10, 'Toán học');


-- ============================================================
--  DỮ LIỆU MẪU -- books  (30 cuốn)
--  cover_image: Open Library cover theo ISBN
--    URL gốc:  https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
--    Hiển thị đúng bìa sách thật, công khai, không cần auth
-- ============================================================
INSERT INTO books (
  id, title, author, category, category_id, isbn, description,
  available_copies, total_copies, added_by, cover_image, cloudinary_id,
  price, branch, borrow_count
) VALUES

-- ── Công nghệ thông tin ───────────────────────────────────
(1,  'Clean Code: Nghệ thuật viết code sạch',
     'Robert C. Martin',
     'Công nghệ thông tin', 1,
     '9780132350884',
     'Cuốn sách kinh điển hướng dẫn cách viết code sạch, dễ đọc và dễ bảo trì, phù hợp cho mọi lập trình viên.',
     4, 5, 1,
     'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
     'seed-clean-code', 159000, 'dai-la', 28),

(2,  'The Pragmatic Programmer',
     'David Thomas & Andrew Hunt',
     'Công nghệ thông tin', 1,
     '9780201616224',
     'Cẩm nang thực tiễn dành cho lập trình viên muốn nâng cao kỹ năng nghề nghiệp và tư duy giải quyết vấn đề.',
     3, 4, 1,
     'https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg',
     'seed-pragmatic-programmer', 189000, 'cau-giay', 19),

(3,  'Học Python qua dự án thực tế',
     'Eric Matthes',
     'Công nghệ thông tin', 1,
     '9781593279288',
     'Hướng dẫn từng bước học lập trình Python thông qua các dự án thực tế như game, trực quan hoá dữ liệu và ứng dụng web.',
     5, 6, 1,
     'https://covers.openlibrary.org/b/isbn/9781593279288-L.jpg',
     'seed-python-crash-course', 169000, 'dai-la', 35),

(4,  'Thiết kế cơ sở dữ liệu quan hệ',
     'C.J. Date',
     'Công nghệ thông tin', 1,
     '9780321774514',
     'Trình bày các nguyên tắc nền tảng về mô hình quan hệ, thiết kế lược đồ và tối ưu hoá truy vấn SQL.',
     2, 3, 11,
     'https://covers.openlibrary.org/b/isbn/9780321774514-L.jpg',
     'seed-db-design', 145000, 'cau-giay', 11),

(5,  'Kiến trúc microservices thực chiến',
     'Sam Newman',
     'Công nghệ thông tin', 1,
     '9781491950357',
     'Hướng dẫn xây dựng hệ thống phân tán theo kiến trúc microservices, từ thiết kế đến triển khai và vận hành.',
     2, 2, 11,
     'https://covers.openlibrary.org/b/isbn/9781491950357-L.jpg',
     'seed-microservices', 210000, 'dai-la', 9),

-- ── Văn học ──────────────────────────────────────────────
(6,  'Nhà giả kim',
     'Paulo Coelho',
     'Văn học', 2,
     '9780062315007',
     'Tác phẩm truyền cảm hứng về hành trình tìm kiếm ước mơ và ý nghĩa cuộc sống của cậu bé chăn cừu Santiago.',
     3, 3, 2,
     'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
     'seed-nha-gia-kim', 99000, 'dai-la', 22),

(7,  'Tôi thấy hoa vàng trên cỏ xanh',
     'Nguyễn Nhật Ánh',
     'Văn học', 2,
     '9786042124027',
     'Câu chuyện tuổi thơ đầy tình cảm về tình anh em, tình bạn và ký ức làng quê Việt Nam những năm 1980.',
     5, 5, 2,
     'https://covers.openlibrary.org/b/isbn/9786042124027-L.jpg',
     'seed-hoa-vang', 89000, 'cau-giay', 30),

(8,  'Số Đỏ',
     'Vũ Trọng Phụng',
     'Văn học', 2,
     '9786042072823',
     'Tiểu thuyết trào phúng bậc nhất Việt Nam, phơi bày sự hài hước và chua cay của xã hội thành thị thời Pháp thuộc.',
     4, 4, 2,
     'https://covers.openlibrary.org/b/isbn/9786042072823-L.jpg',
     'seed-so-do', 75000, 'dai-la', 17),

(9,  'Truyện Kiều',
     'Nguyễn Du',
     'Văn học', 2,
     '9786046895480',
     'Kiệt tác thơ Nôm của nền văn học cổ điển Việt Nam, kể cuộc đời đầy bi kịch và nghị lực của nàng Kiều.',
     3, 4, 2,
     'https://covers.openlibrary.org/b/isbn/9786046895480-L.jpg',
     'seed-truyen-kieu', 65000, 'cau-giay', 14),

(10, 'Mắt Biếc',
     'Nguyễn Nhật Ánh',
     'Văn học', 2,
     '9786042128223',
     'Câu chuyện tình yêu trong sáng và buồn thương giữa Ngạn và Hà Lan, gắn liền với làng quê đẹp đẽ nhưng cách trở.',
     4, 5, 2,
     'https://covers.openlibrary.org/b/isbn/9786042128223-L.jpg',
     'seed-mat-biec', 89000, 'dai-la', 25),

-- ── Khoa học tự nhiên ────────────────────────────────────
(11, 'Lược sử thời gian',
     'Stephen Hawking',
     'Khoa học tự nhiên', 3,
     '9780553380163',
     'Trình bày dễ hiểu về vũ trụ, thời gian, lỗ đen và các khái niệm vật lý hiện đại dành cho đại chúng.',
     2, 2, 1,
     'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg',
     'seed-brief-history-of-time', 199000, 'cau-giay', 16),

(12, 'Vũ trụ trong vỏ hạt dẻ',
     'Stephen Hawking',
     'Khoa học tự nhiên', 3,
     '9780553802023',
     'Phần tiếp nối của Lược sử thời gian, khám phá các chiều không gian bổ sung và thuyết tương đối hẹp.',
     2, 3, 1,
     'https://covers.openlibrary.org/b/isbn/9780553802023-L.jpg',
     'seed-universe-nutshell', 210000, 'dai-la', 8),

(13, 'Sapiens: Lược sử loài người',
     'Yuval Noah Harari',
     'Khoa học tự nhiên', 3,
     '9780062316097',
     'Khảo cứu toàn diện về sự tiến hoá, lịch sử và tương lai của loài Homo sapiens từ thời tiền sử đến hiện đại.',
     4, 5, 11,
     'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
     'seed-sapiens', 239000, 'cau-giay', 41),

(14, 'Vật lý vui',
     'Yakov Perelman',
     'Khoa học tự nhiên', 3,
     '9785447461942',
     'Tập hợp các bài toán và hiện tượng vật lý thú vị được giải thích bằng ngôn ngữ phổ thông, kích thích tư duy.',
     3, 4, 11,
     'https://covers.openlibrary.org/b/isbn/9785447461942-L.jpg',
     'seed-vat-ly-vui', 85000, 'dai-la', 12),

-- ── Kỹ năng sống ─────────────────────────────────────────
(15, 'Atomic Habits: Thói quen nguyên tử',
     'James Clear',
     'Kỹ năng sống', 4,
     '9780735211292',
     'Hệ thống xây dựng thói quen tốt và loại bỏ thói quen xấu theo từng bước nhỏ, được chứng minh bởi khoa học.',
     6, 6, 1,
     'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
     'seed-atomic-habits', 179000, 'cau-giay', 38),

(16, 'Đắc nhân tâm',
     'Dale Carnegie',
     'Kỹ năng sống', 4,
     '9780671027032',
     'Cuốn sách kinh điển về nghệ thuật giao tiếp và tạo ảnh hưởng, đã bán hơn 30 triệu bản trên toàn thế giới.',
     5, 7, 2,
     'https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg',
     'seed-dac-nhan-tam', 119000, 'dai-la', 52),

(17, 'Người bán hàng vĩ đại nhất thế giới',
     'Og Mandino',
     'Kỹ năng sống', 4,
     '9780553277579',
     'Mười cuộn giấy cói chứa đựng bí quyết thành công trong cuộc sống và sự nghiệp bán hàng.',
     3, 4, 1,
     'https://covers.openlibrary.org/b/isbn/9780553277579-L.jpg',
     'seed-nguoi-ban-hang', 99000, 'cau-giay', 21),

(18, 'Bí mật của may mắn',
     'Alex Rovira & Fernando Trías de Bes',
     'Kỹ năng sống', 4,
     '9788408041283',
     'Câu chuyện ngụ ngôn về hành trình tìm kiếm may mắn, khám phá rằng may mắn thực sự đến từ bên trong mỗi người.',
     2, 3, 2,
     'https://covers.openlibrary.org/b/isbn/9788408041283-L.jpg',
     'seed-bi-mat-may-man', 89000, 'dai-la', 15),

-- ── Kinh tế & Kinh doanh ─────────────────────────────────
(19, 'Khởi nghiệp tinh gọn',
     'Eric Ries',
     'Kinh tế & Kinh doanh', 5,
     '9780307887894',
     'Phương pháp xây dựng startup theo hướng phát triển sản phẩm linh hoạt, đo lường và học hỏi liên tục.',
     4, 5, 11,
     'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg',
     'seed-lean-startup', 199000, 'cau-giay', 27),

(20, 'Tư duy nhanh và chậm',
     'Daniel Kahneman',
     'Kinh tế & Kinh doanh', 5,
     '9780374533557',
     'Khám phá hai hệ thống tư duy trong não người và cách chúng ảnh hưởng đến quyết định kinh tế, xã hội hàng ngày.',
     3, 4, 1,
     'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg',
     'seed-thinking-fast-slow', 229000, 'dai-la', 18),

(21, 'Cha giàu cha nghèo',
     'Robert T. Kiyosaki',
     'Kinh tế & Kinh doanh', 5,
     '9781612680194',
     'So sánh quan điểm tài chính của hai người cha để chỉ ra con đường đến tự do tài chính thông qua đầu tư và kinh doanh.',
     6, 8, 2,
     'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg',
     'seed-cha-giau-cha-ngheo', 149000, 'cau-giay', 60),

(22, 'Nghệ thuật tư duy phản biện',
     'Richard Paul & Linda Elder',
     'Kinh tế & Kinh doanh', 5,
     '9780131993730',
     'Hướng dẫn phát triển tư duy phản biện để đánh giá thông tin, lập luận và đưa ra quyết định sáng suốt hơn.',
     2, 3, 11,
     'https://covers.openlibrary.org/b/isbn/9780131993730-L.jpg',
     'seed-tu-duy-phan-bien', 175000, 'dai-la', 14),

-- ── Lịch sử & Địa lý ─────────────────────────────────────
(23, 'Lịch sử Việt Nam bằng tranh – Bộ 10 tập',
     'Nhiều tác giả – NXB Trẻ',
     'Lịch sử & Địa lý', 6,
     '9786041175365',
     'Bộ tranh lịch sử Việt Nam từ thời Hùng Vương đến thời hiện đại, dễ tiếp cận và hấp dẫn mọi lứa tuổi.',
     3, 3, 2,
     'https://covers.openlibrary.org/b/isbn/9786041175365-L.jpg',
     'seed-lich-su-vn-tranh', 320000, 'cau-giay', 7),

(24, 'Địa lý kinh tế Việt Nam',
     'Nguyễn Viết Thịnh',
     'Lịch sử & Địa lý', 6,
     '9786048018832',
     'Giáo trình phân tích toàn diện về điều kiện tự nhiên, dân cư và các vùng kinh tế trọng điểm của Việt Nam.',
     2, 3, 11,
     'https://covers.openlibrary.org/b/isbn/9786048018832-L.jpg',
     'seed-dia-ly-kinh-te-vn', 95000, 'dai-la', 6),

-- ── Triết học & Tâm lý học ───────────────────────────────
(25, 'Đời ngắn đừng ngủ dài',
     'Robin Sharma',
     'Triết học & Tâm lý học', 7,
     '9781443456081',
     'Tập hợp các bài học về kỷ luật bản thân, mục tiêu sống và nghệ thuật tận dụng từng khoảnh khắc cuộc đời.',
     3, 5, 1,
     'https://covers.openlibrary.org/b/isbn/9781443456081-L.jpg',
     'seed-doi-ngan', 139000, 'cau-giay', 23),

(26, 'Dám bị ghét',
     'Ichiro Kishimi & Fumitake Koga',
     'Triết học & Tâm lý học', 7,
     '9781501156700',
     'Trình bày tư tưởng tâm lý học của Alfred Adler qua cuộc đối thoại giữa triết gia và chàng thanh niên.',
     4, 5, 2,
     'https://covers.openlibrary.org/b/isbn/9781501156700-L.jpg',
     'seed-dam-bi-ghet', 129000, 'dai-la', 32),

-- ── Ngoại ngữ ────────────────────────────────────────────
(27, 'English Grammar in Use (5th Edition)',
     'Raymond Murphy',
     'Ngoại ngữ', 8,
     '9781108457651',
     'Giáo trình ngữ pháp tiếng Anh toàn diện nhất dành cho trình độ trung cấp, kèm bài tập và đáp án chi tiết.',
     5, 7, 11,
     'https://covers.openlibrary.org/b/isbn/9781108457651-L.jpg',
     'seed-grammar-in-use', 249000, 'cau-giay', 45),

(28, 'Tiếng Nhật Minna no Nihongo – Sơ cấp 1',
     'Yookoso',
     'Ngoại ngữ', 8,
     '9784883190195',
     'Giáo trình tiếng Nhật phổ biến nhất thế giới dành cho người mới bắt đầu, dùng trong các trường đại học và trung tâm ngoại ngữ.',
     4, 5, 11,
     'https://covers.openlibrary.org/b/isbn/9784883190195-L.jpg',
     'seed-minna-nihongo', 180000, 'dai-la', 20),

-- ── Y học & Sức khoẻ ─────────────────────────────────────
(29, 'Giải phẫu học lâm sàng',
     'Keith L. Moore',
     'Y học & Sức khoẻ', 9,
     '9781496347213',
     'Giáo trình giải phẫu học kinh điển được sử dụng rộng rãi trong các trường y, kết hợp hình ảnh 3D và tình huống lâm sàng.',
     2, 2, 11,
     'https://covers.openlibrary.org/b/isbn/9781496347213-L.jpg',
     'seed-giai-phau-hoc', 450000, 'cau-giay', 5),

-- ── Toán học ─────────────────────────────────────────────
(30, 'Giải tích 1 – Dành cho kỹ sư',
     'James Stewart',
     'Toán học', 10,
     '9781305085664',
     'Giáo trình giải tích toán học toàn diện dành cho sinh viên kỹ thuật và khoa học tự nhiên với nhiều ví dụ ứng dụng thực tiễn.',
     3, 4, 1,
     'https://covers.openlibrary.org/b/isbn/9781305085664-L.jpg',
     'seed-giai-tich-1', 280000, 'dai-la', 13);


-- ============================================================
--  DỮ LIỆU MẪU -- borrow_tickets  (10 phiếu mượn)
-- ============================================================
INSERT INTO borrow_tickets (id, user_id, status, borrow_date, return_date, approved_by, approved_at) VALUES
  (1,  2,  'returned', '2024-11-05 08:30:00', '2024-11-19 10:00:00', 1,  '2024-11-05 09:00:00'),
  (2,  3,  'returned', '2024-11-10 09:00:00', '2024-11-24 14:00:00', 1,  '2024-11-10 09:30:00'),
  (3,  4,  'returned', '2024-12-01 10:15:00', '2024-12-15 11:00:00', 11, '2024-12-01 10:45:00'),
  (4,  5,  'approved', '2025-01-07 08:00:00', NULL,                  1,  '2025-01-07 08:30:00'),
  (5,  6,  'approved', '2025-01-15 13:00:00', NULL,                  11, '2025-01-15 13:30:00'),
  (6,  7,  'pending',  '2025-02-01 09:45:00', NULL,                  NULL, NULL),
  (7,  8,  'pending',  '2025-02-03 11:00:00', NULL,                  NULL, NULL),
  (8,  9,  'cancelled', '2025-02-10 14:00:00', NULL,                 1,  '2025-02-10 14:30:00'),
  (9,  10, 'approved', '2025-03-01 08:30:00', NULL,                  11, '2025-03-01 09:00:00'),
  (10, 2,  'pending',  '2025-03-05 10:00:00', NULL,                  NULL, NULL);


-- ============================================================
--  DỮ LIỆU MẪU -- borrow_ticket_books
-- ============================================================
INSERT INTO borrow_ticket_books (ticket_id, book_id) VALUES
  (1,  1),   -- An mượn Clean Code
  (1,  3),   -- An mượn Python
  (2,  15),  -- Bích mượn Atomic Habits
  (2,  16),  -- Bích mượn Đắc nhân tâm
  (3,  11),  -- Khoa mượn Lược sử thời gian
  (3,  13),  -- Khoa mượn Sapiens
  (4,  27),  -- Hà mượn English Grammar
  (5,  2),   -- Mạnh mượn Pragmatic Programmer
  (5,  5),   -- Mạnh mượn Microservices
  (6,  6),   -- Lan mượn Nhà giả kim
  (6,  26),  -- Lan mượn Dám bị ghét
  (7,  21),  -- Hùng mượn Cha giàu cha nghèo
  (8,  29),  -- Mai mượn Giải phẫu học (bị từ chối – hết sách)
  (9,  10),  -- Tùng mượn Mắt biếc
  (10, 19),  -- An mượn Khởi nghiệp tinh gọn
  (10, 22);  -- An mượn Tư duy phản biện


-- ============================================================
--  DỮ LIỆU MẪU -- contacts
-- ============================================================
INSERT INTO contacts (name, email, subject, message) VALUES
  ('Nguyễn Văn An',   'an.nguyen@sv.edu.vn',  'Yêu cầu bổ sung sách',
   'Thư viện có thể bổ sung thêm sách về Machine Learning và Deep Learning không ạ?'),
  ('Trần Thị Bích',   'bich.tran@sv.edu.vn',  'Phản ánh dịch vụ',
   'Mình muốn góp ý rằng giờ mở cửa buổi tối nên kéo dài đến 21h để thuận tiện hơn cho sinh viên.'),
  ('Lê Minh Khoa',    'khoa.le@sv.edu.vn',    'Sách bị rách trang',
   'Cuốn "Vũ trụ trong vỏ hạt dẻ" mình mượn về thấy bị rách một số trang, xin báo để thư viện biết.'),
  ('Phạm Thu Hà',     'ha.pham@sv.edu.vn',    'Hỏi về gia hạn phiếu mượn',
   'Cho mình hỏi quy trình gia hạn phiếu mượn sách thực hiện như thế nào ạ?'),
  ('Hoàng Đức Mạnh',  'manh.hoang@sv.edu.vn', 'Đề xuất tài liệu môn học',
   'Mình muốn đề xuất thêm sách tham khảo môn Cấu trúc dữ liệu và Giải thuật vào thư viện.');