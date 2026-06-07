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
      phone VARCHAR(20) NULL,
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
<<<<<<< HEAD
      cloudinary_id VARCHAR(255) NULL,
=======
>>>>>>> hai
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

<<<<<<< HEAD
  // cloudinary_id column is intentionally supported for seeded data
=======
  const [bookColumns] = await connection.query("SHOW COLUMNS FROM books LIKE 'cloudinary_id'");
  if (bookColumns.length > 0) {
    await connection.query("ALTER TABLE books DROP COLUMN cloudinary_id");
  }
>>>>>>> hai

  await connection.query(`
    CREATE TABLE IF NOT EXISTS borrow_tickets (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      status ENUM(
        'pending',
        'awaiting_payment',
        'paid',
        'approved',
        'dispatched',
        'delivered',
        'returned',
        'closed',
        'cancelled'
      ) NOT NULL DEFAULT 'pending',
      borrow_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME NULL DEFAULT NULL,
      return_date TIMESTAMP NULL DEFAULT NULL,
      deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      deposit_status ENUM('none', 'pending', 'held', 'refunded', 'forfeited') NOT NULL DEFAULT 'none',
      payment_method ENUM('cash', 'vnpay') NOT NULL DEFAULT 'cash',
      shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
<<<<<<< HEAD
      shipping_status ENUM('pending', 'dispatched', 'delivered', 'returned') NOT NULL DEFAULT 'pending',
=======
      shipping_status ENUM('none', 'pending', 'dispatched', 'delivered', 'returned') NOT NULL DEFAULT 'none',
>>>>>>> hai
      shipping_address VARCHAR(255) NULL,
      shipping_phone VARCHAR(20) NULL,
      fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS transactions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      type ENUM('deposit', 'fine', 'shipping', 'volunteer_stipend') NOT NULL,
      method ENUM('cash', 'vnpay') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      vnpay_txn_ref VARCHAR(64) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_transactions_ticket (ticket_id),
      INDEX idx_transactions_status (status),
      CONSTRAINT fk_transactions_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_renewals (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      old_due_date DATETIME NOT NULL,
      new_due_date DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_renewals_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_renewals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureBorrowTicketSchema(connection);


  async function columnExists(connection, tableName, columnName) {
    const [rows] = await connection.query("SHOW COLUMNS FROM ?? LIKE ?", [tableName, columnName]);
    return rows.length > 0;
  }

  async function addColumnIfMissing(connection, tableName, columnName, definition) {
    const exists = await columnExists(connection, tableName, columnName);
    if (!exists) {
      await connection.query(`ALTER TABLE ?? ADD COLUMN ${definition}`, [tableName]);
    }
  }

  async function ensureBorrowTicketSchema(connection) {
    // Add missing columns (won't fail if they exist)
    await addColumnIfMissing(connection, "users", "phone", "phone VARCHAR(20) NULL");
    await addColumnIfMissing(connection, "borrow_tickets", "due_date", "due_date DATETIME NULL DEFAULT NULL");
    await addColumnIfMissing(connection, "borrow_tickets", "deposit_amount", "deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0");
    await addColumnIfMissing(connection, "borrow_tickets", "deposit_status", "deposit_status ENUM('none', 'pending', 'held', 'refunded', 'forfeited') NOT NULL DEFAULT 'none'");
    await addColumnIfMissing(connection, "borrow_tickets", "payment_method", "payment_method ENUM('cash', 'vnpay') NOT NULL DEFAULT 'cash'");
    await addColumnIfMissing(connection, "borrow_tickets", "shipping_fee", "shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0");
<<<<<<< HEAD
    await addColumnIfMissing(connection, "borrow_tickets", "shipping_status", "shipping_status ENUM('pending', 'dispatched', 'delivered', 'returned') NOT NULL DEFAULT 'pending'");
=======
    await addColumnIfMissing(connection, "borrow_tickets", "shipping_status", "shipping_status ENUM('none', 'pending', 'dispatched', 'delivered', 'returned') NOT NULL DEFAULT 'none'");
>>>>>>> hai
    await addColumnIfMissing(connection, "borrow_tickets", "shipping_address", "shipping_address VARCHAR(255) NULL");
    await addColumnIfMissing(connection, "borrow_tickets", "shipping_phone", "shipping_phone VARCHAR(20) NULL");
    await addColumnIfMissing(connection, "borrow_tickets", "fine_amount", "fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0");
    await addColumnIfMissing(connection, "borrow_tickets", "renew_count", "renew_count INT NOT NULL DEFAULT 0");
    await addColumnIfMissing(connection, "borrow_tickets", "last_renewed_at", "last_renewed_at DATETIME NULL DEFAULT NULL");

    // Safely migrate old status values to new format
    try {
      await connection.query("UPDATE borrow_tickets SET status = 'pending' WHERE status = 'Pending' OR status = 'pending'");
    } catch (e) {
      // Ignore if no rows to update
    }
    try {
      await connection.query("UPDATE borrow_tickets SET status = 'approved' WHERE status = 'Approved'");
    } catch (e) {
      // Ignore
    }
    try {
      await connection.query("UPDATE borrow_tickets SET status = 'returned' WHERE status = 'Returned'");
    } catch (e) {
      // Ignore
    }
    try {
      await connection.query("UPDATE borrow_tickets SET status = 'cancelled' WHERE status = 'Rejected'");
    } catch (e) {
      // Ignore
    }

    // Try to modify the status column - use safe approach
    try {
      await connection.query(`
      ALTER TABLE borrow_tickets
      MODIFY COLUMN status ENUM(
        'pending',
        'awaiting_payment',
        'paid',
        'approved',
        'dispatched',
        'delivered',
        'returned',
        'closed',
        'cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);
    } catch (e) {
      // If MODIFY fails, table might already have this schema
      console.log("Status column already has new enum or similar error - skipping MODIFY");
    }
  }
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
<<<<<<< HEAD
      reset_token VARCHAR(128) NULL,
      expires_at DATETIME NULL,
=======
>>>>>>> hai
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      book_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_book (user_id, book_id),
      CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_wishlists_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_reviews (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      book_id INT UNSIGNED NOT NULL,
      ticket_id INT UNSIGNED NOT NULL,
      rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      status ENUM('visible', 'hidden') DEFAULT 'visible',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_review_per_ticket_book (user_id, book_id, ticket_id),
      CONSTRAINT fk_book_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_book_reviews_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_book_reviews_ticket FOREIGN KEY (ticket_id) REFERENCES borrow_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE
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
    phone: row.phone,
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
<<<<<<< HEAD
    cloudinaryId: row.cloudinary_id || null,
=======
>>>>>>> hai
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    branch: row.branch,
    borrowCount: row.borrow_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEnumValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return String(value).trim().toLowerCase();
}

function normalizeTicketStatus(value) {
  const normalized = normalizeEnumValue(value);
  if (normalized === "rejected") {
    return "cancelled";
  }
  return normalized;
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
    status: normalizeTicketStatus(row.status),
    borrowDate: row.borrow_date,
    dueDate: row.due_date,
    returnDate: row.return_date,
    depositAmount: row.deposit_amount === null || row.deposit_amount === undefined ? 0 : Number(row.deposit_amount),
    depositStatus: normalizeEnumValue(row.deposit_status),
    shippingFee: row.shipping_fee === null || row.shipping_fee === undefined ? 0 : Number(row.shipping_fee),
    shippingStatus: normalizeEnumValue(row.shipping_status),
    shippingAddress: row.shipping_address,
    shippingPhone: row.shipping_phone,
    paymentMethod: normalizeEnumValue(row.payment_method),
    fineAmount: row.fine_amount === null || row.fine_amount === undefined ? 0 : Number(row.fine_amount),
    approvedBy: row.approved_by
      ? {
        _id: row.approved_by,
        name: row.approver_name,
        email: row.approver_email,
        role: row.approver_role,
      }
      : null,
    approvedAt: row.approved_at,
    renewCount: row.renew_count || 0,
    lastRenewedAt: row.last_renewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransactionRow(row) {
  return {
    _id: row.id,
    ticketId: row.ticket_id,
    userId: row.user_id,
    type: normalizeEnumValue(row.type),
    method: normalizeEnumValue(row.method),
    amount: row.amount === null || row.amount === undefined ? 0 : Number(row.amount),
    status: normalizeEnumValue(row.status),
    vnpayTxnRef: row.vnpay_txn_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createTransaction(connection, transaction) {
  const runner = connection ? connection : { query };
  const {
    ticketId,
    userId,
    type,
    method,
    amount,
    status,
    vnpayTxnRef,
  } = transaction;

  const sql = `
    INSERT INTO transactions
      (ticket_id, user_id, type, method, amount, status, vnpay_txn_ref)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    ticketId,
    userId,
    type,
    method,
    amount,
    status,
    vnpayTxnRef || null,
  ];

  if (connection) {
    const [result] = await runner.query(sql, params);
    return result.insertId;
  }

  const result = await runner.query(sql, params);
  return result.insertId;
}

async function updateTransactionStatus(connection, transactionId, status, vnpayTxnRef = null) {
  const runner = connection ? connection : { query };
  const sql = `
    UPDATE transactions
    SET status = ?, vnpay_txn_ref = COALESCE(?, vnpay_txn_ref)
    WHERE id = ?
  `;
  const params = [status, vnpayTxnRef, transactionId];

  if (connection) {
    await runner.query(sql, params);
    return;
  }
  await runner.query(sql, params);
}

async function getTransactionsByTicket(ticketId) {
  const rows = await query(
    `SELECT * FROM transactions WHERE ticket_id = ? ORDER BY created_at ASC, id ASC`,
    [ticketId]
  );
  return rows.map(mapTransactionRow);
}

module.exports = {
  initializeDatabase,
  query,
  withTransaction,
  mapUserRow,
  mapCategoryRow,
  mapBookRow,
  mapTicketRow,
  mapTransactionRow,
  createTransaction,
  updateTransactionStatus,
  getTransactionsByTicket,
};
