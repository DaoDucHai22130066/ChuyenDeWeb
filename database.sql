-- =====================================================
-- D FREE BOOK - LIBRARY MANAGEMENT DATABASE SCHEMA
-- =====================================================

DROP DATABASE IF EXISTS library_management;
CREATE DATABASE IF NOT EXISTS library_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_management;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    avatar_url TEXT,
    role ENUM('user', 'librarian', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- =====================================================
-- BRANCHES TABLE (Branches/Library Locations)
-- =====================================================
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    opening_hours VARCHAR(255),
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
);

-- =====================================================
-- BOOKS TABLE
-- =====================================================
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    isbn VARCHAR(100) NOT NULL UNIQUE,
    description LONGTEXT,
    publisher VARCHAR(255),
    publication_year INT,
    available_copies INT NOT NULL DEFAULT 0,
    total_copies INT NOT NULL DEFAULT 0,
    cover_image_url TEXT,
    cloudinary_id VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    language VARCHAR(50) DEFAULT 'Vietnamese',
    pages INT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_isbn (isbn),
    INDEX idx_category (category_id),
    INDEX idx_featured (is_featured),
    FULLTEXT idx_fulltext (title, author, description)
);

-- =====================================================
-- BORROWS TABLE (Borrowing Records)
-- =====================================================
CREATE TABLE borrows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    branch_id INT,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP NULL,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Requested', 'Issued', 'Requested Return', 'Returned', 'Overdue') DEFAULT 'Requested',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_book (book_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- =====================================================
-- ARTICLES/POSTS TABLE
-- =====================================================
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    cloudinary_id VARCHAR(255),
    author_id INT NOT NULL,
    category_id INT,
    view_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_published (is_published),
    INDEX idx_author (author_id),
    FULLTEXT idx_fulltext (title, content)
);

-- =====================================================
-- DONATIONS/SUPPORTS TABLE
-- =====================================================
CREATE TABLE donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    amount DECIMAL(10, 2),
    donation_type ENUM('money', 'books', 'supplies') DEFAULT 'money',
    description TEXT,
    book_count INT,
    status ENUM('pending', 'received', 'processed') DEFAULT 'pending',
    branch_id INT,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- =====================================================
-- CONTACTS/INQUIRIES TABLE
-- =====================================================
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message LONGTEXT NOT NULL,
    branch_id INT,
    status ENUM('new', 'read', 'responded') DEFAULT 'new',
    response_message TEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created (created_at)
);

-- =====================================================
-- OTP VERIFICATION TABLE
-- =====================================================
CREATE TABLE otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    attempts INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
);

-- =====================================================
-- BOOK REVIEWS TABLE
-- =====================================================
CREATE TABLE book_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_book (book_id, user_id),
    INDEX idx_book (book_id),
    INDEX idx_user (user_id)
);

-- =====================================================
-- GALLERY IMAGES TABLE
-- =====================================================
CREATE TABLE gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    cloudinary_id VARCHAR(255),
    description TEXT,
    image_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_branch (branch_id)
);

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    value LONGTEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (key_name)
);

-- =====================================================
-- ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Văn học', 'van-hoc', 'Các tác phẩm văn học nổi tiếng', 1),
('Lịch sử', 'lich-su', 'Sách về lịch sử', 2),
('Khoa học', 'khoa-hoc', 'Sách khoa học tổng hợp', 3),
('Tâm lý học', 'tam-ly', 'Sách về tâm lý và phát triển bản thân', 4),
('Kinh tế', 'kinh-te', 'Sách về kinh tế và quản lý', 5),
('Công nghệ', 'cong-nghe', 'Sách về công nghệ thông tin', 6),
('Ngoại ngữ', 'ngoai-ngu', 'Sách học ngoại ngữ', 7),
('Trẻ em', 'tre-em', 'Sách dành cho trẻ em', 8),
('Sức khỏe', 'suc-khoe', 'Sách về sức khỏe và wellness', 9),
('Hài hước', 'hai-huoc', 'Sách hài hước và giải trí', 10);

-- Insert default branches
INSERT INTO branches (name, address, phone, email, opening_hours, description) VALUES
('Cơ sở Đại La', 'Số 107, khu tập thể A5, ngõ 128C Đại La, Hà Nội', '0962188248', 'branch1@dfreebook.vn', '08:30 - 22:00', 'Thư viện cộng đồng cho mượn sách miễn phí tại Đại La'),
('Cơ sở Cầu Giấy', 'Số 2 ngõ Viện Máy, đường Phạm Văn Đồng, Cầu Giấy, Hà Nội', '0867371903', 'branch2@dfreebook.vn', '08:30 - 11:00, 14:00 - 20:30', 'Thư viện cộng đồng cho mượn sách miễn phí tại Cầu Giấy');

-- Insert sample admin user
INSERT INTO users (name, email, password, role, status) VALUES
('Admin', 'admin@dfreebook.vn', '$2a$10$YtgfT8HFwK.iyj3NxVQy1uiIvZFbG5b5Jf2K.bN8PvKpPHyX0zHQa', 'admin', 'active');

-- Insert sample books
INSERT INTO books (title, author, category_id, isbn, description, publisher, publication_year, available_copies, total_copies, price, language) VALUES
('Nhà Giả Kim', 'Paulo Coelho', 1, 'ISBN-001', 'Câu chuyện về một cậu bé và hành trình tìm kiếm những giấc mơ của mình', 'Nhà xuất bản Trẻ', 2010, 5, 5, 0, 'Vietnamese'),
('Tôi Thích Thích Chuộc Lỗi', 'Sally Rooney', 1, 'ISBN-002', 'Câu chuyện về tình yêu và mối quan hệ phức tạp', 'Nhà xuất bản Văn học', 2019, 3, 3, 0, 'Vietnamese'),
('Đắc Nhân Tâm', 'Dale Carnegie', 4, 'ISBN-003', 'Cuốn sách cổ điển về phát triển kỹ năng giao tiếp', 'Nhà xuất bản Lao động', 2015, 7, 7, 0, 'Vietnamese'),
('Lịch Sử Thế Giới', 'Yuval Noah Harari', 2, 'ISBN-004', 'Một cái nhìn toàn cảnh về lịch sử nhân loại', 'Nhà xuất bản Hội nhà văn', 2018, 4, 4, 0, 'Vietnamese'),
('Sapiens', 'Yuval Noah Harari', 2, 'ISBN-005', 'Hành trình từ khí hậu đến những ngày này', 'Nhà xuất bản Hội nhà văn', 2017, 6, 6, 0, 'Vietnamese');

-- Insert default settings
INSERT INTO settings (key_name, value, description, is_public) VALUES
('site_name', 'D Free Book - Thư viện Sách Miễn Phí', 'Tên trang web', TRUE),
('site_description', 'Thư viện cộng đồng cho mượn sách miễn phí với đặc điểm là trao đổi sách dựa trên niềm tin', 'Mô tả trang web', TRUE),
('site_logo', '', 'Logo của trang web', FALSE),
('site_email', 'info@dfreebook.vn', 'Email liên hệ của trang web', TRUE),
('site_phone', '0962188248', 'Số điện thoại liên hệ', TRUE),
('fine_per_day', '5000', 'Tiền phạt mỗi ngày quá hạn (VND)', FALSE),
('max_borrow_days', '14', 'Số ngày mượn tối đa', FALSE),
('max_books_per_user', '5', 'Số sách tối đa mỗi người dùng có thể mượn', FALSE),
('donation_bank_account', 'VietcomBank: 0971000123456', 'Tài khoản ngân hàng để quyên góp', FALSE),
('facebook_url', 'https://facebook.com/dfreebook', 'Liên kết Facebook', TRUE),
('twitter_url', 'https://twitter.com/dfreebook', 'Liên kết Twitter', TRUE);
