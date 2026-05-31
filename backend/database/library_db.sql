-- Library Management MySQL schema and seed data
-- Import this file into MySQL Workbench 8.0 CE or run it from the CLI.

CREATE DATABASE IF NOT EXISTS library_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE library_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS borrow_ticket_books;
DROP TABLE IF EXISTS borrow_tickets;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  stream VARCHAR(255) NULL,
  year INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE books (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(255) NULL,
  category_id INT UNSIGNED NULL,
  isbn VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  available_copies INT NOT NULL,
  total_copies INT NOT NULL,
  added_by INT UNSIGNED NOT NULL,
  cover_image TEXT NULL,
  cloudinary_id VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NULL,
  branch ENUM('dai-la', 'cau-giay') NOT NULL DEFAULT 'dai-la',
  borrow_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_books_category (category_id),
  INDEX idx_books_added_by (added_by),
  CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_books_user FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE borrow_tickets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('Pending', 'Approved', 'Returned', 'Rejected') NOT NULL DEFAULT 'Pending',
  borrow_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  return_date TIMESTAMP NULL DEFAULT NULL,
  approved_by INT UNSIGNED NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket_user (user_id),
  INDEX idx_ticket_status (status),
  CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE borrow_ticket_books (
  ticket_id INT UNSIGNED NOT NULL,
  book_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (ticket_id, book_id),
  CONSTRAINT fk_ticket_books_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_books_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contacts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE otps (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  otp VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (id, name, email, password, role, stream, year) VALUES
  (1, 'Admin', 'admin@example.com', '$2b$10$JOgXgVkT8v2/ghLegY8QaupRdFlSfsBiV0ZuMWpBF0SNV43ctGzWC', 'admin', NULL, NULL),
  (2, 'Student', 'student@example.com', '$2b$10$tqfjbB2fwcEeQA0zV5BCSOMyHhILMi.9G3jHzd42HdGGDefJfzfna', 'user', 'Computer Science', 3);

INSERT INTO categories (id, name) VALUES
  (1, 'Công nghệ'),
  (2, 'Văn học'),
  (3, 'Khoa học'),
  (4, 'Kỹ năng sống');

INSERT INTO books (
  id, title, author, category, category_id, isbn, description,
  available_copies, total_copies, added_by, cover_image, cloudinary_id,
  price, branch, borrow_count
) VALUES
  (
    1,
    'Clean Code',
    'Robert C. Martin',
    'Công nghệ',
    1,
    '9780132350884',
    'Sách kinh điển về cách viết code sạch, dễ đọc và dễ bảo trì.',
    4,
    5,
    1,
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
    'seed-clean-code',
    159000,
    'dai-la',
    12
  ),
  (
    2,
    'Atomic Habits',
    'James Clear',
    'Kỹ năng sống',
    4,
    '9780735211292',
    'Cách xây dựng thói quen tốt và loại bỏ thói quen xấu theo từng bước nhỏ.',
    6,
    6,
    1,
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80',
    'seed-atomic-habits',
    179000,
    'cau-giay',
    8
  ),
  (
    3,
    'Nhà Giả Kim',
    'Paulo Coelho',
    'Văn học',
    2,
    '9780062315007',
    'Tác phẩm truyền cảm hứng về hành trình tìm kiếm ước mơ và ý nghĩa cuộc sống.',
    3,
    3,
    2,
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    'seed-nha-gia-kim',
    99000,
    'dai-la',
    5
  ),
  (
    4,
    'A Brief History of Time',
    'Stephen Hawking',
    'Khoa học',
    3,
    '9780553380163',
    'Giải thích dễ hiểu về vũ trụ, thời gian và các khái niệm vật lý hiện đại.',
    2,
    2,
    1,
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80',
    'seed-brief-history-of-time',
    199000,
    'cau-giay',
    4
  );

-- No tickets are seeded here so you can start with a clean borrow workflow.
-- The application can create borrow_tickets and borrow_ticket_books later from the UI.
