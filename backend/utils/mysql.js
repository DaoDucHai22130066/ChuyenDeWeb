const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env"),
  override: true,
});

const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "library_db",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
  timezone: "+00:00",
};

let pool;
let initPromise;

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
}

async function createSchema(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      stream VARCHAR(255) NULL,
      year INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS books (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS borrow_tickets (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS borrow_ticket_books (
      ticket_id INT UNSIGNED NOT NULL,
      book_id INT UNSIGNED NOT NULL,
      PRIMARY KEY (ticket_id, book_id),
      CONSTRAINT fk_ticket_books_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_ticket_books_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      cart_id INT UNSIGNED NOT NULL,
      book_id INT UNSIGNED NOT NULL,
      PRIMARY KEY (cart_id, book_id),
      CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_cart_items_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS otps (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      otp VARCHAR(16) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function seedAdminUser(connection) {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const [rows] = await connection.query("SELECT id FROM users WHERE email = ? LIMIT 1", [adminEmail]);
  if (rows.length > 0) {
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await connection.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
    [process.env.SEED_ADMIN_NAME || "Admin", adminEmail, hashedPassword]
  );
}

async function initializeDatabase() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    await ensureDatabaseExists();
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    try {
      await createSchema(connection);
      await seedAdminUser(connection);
    } finally {
      connection.release();
    }
    return pool;
  })();

  return initPromise;
}

async function getPool() {
  if (pool) {
    return pool;
  }
  await initializeDatabase();
  return pool;
}

async function query(sql, params = []) {
  const activePool = await getPool();
  const [rows] = await activePool.execute(sql, params);
  return rows;
}

async function withTransaction(handler) {
  const activePool = await getPool();
  const connection = await activePool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function mapUserRow(row, includePassword = false) {
  const user = {
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    stream: row.stream,
    year: row.year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includePassword) {
    user.password = row.password;
  }

  return user;
}

function mapCategoryRow(row) {
  return {
    _id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBookRow(row) {
  return {
    _id: row.id,
    title: row.title,
    author: row.author,
    category: row.category,
    categoryId: row.category_id
      ? {
          _id: row.category_id,
          name: row.category_name,
        }
      : null,
    isbn: row.isbn,
    description: row.description,
    availableCopies: row.available_copies,
    totalCopies: row.total_copies,
    addedBy: row.added_by
      ? {
          _id: row.added_by,
          name: row.user_name,
          email: row.user_email,
          role: row.user_role,
        }
      : null,
    coverImage: row.cover_image,
    cloudinaryId: row.cloudinary_id,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    branch: row.branch,
    borrowCount: row.borrow_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTicketRow(row) {
  return {
    _id: row.id,
    userId: {
      _id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role,
    },
    books: [],
    status: row.status,
    borrowDate: row.borrow_date,
    returnDate: row.return_date,
    approvedBy: row.approved_by
      ? {
          _id: row.approved_by,
          name: row.approver_name,
          email: row.approver_email,
          role: row.approver_role,
        }
      : null,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  initializeDatabase,
  query,
  withTransaction,
  mapUserRow,
  mapCategoryRow,
  mapBookRow,
  mapTicketRow,
};
