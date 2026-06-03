require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { clearCache } = require("../utils/cache");
const calculateFine = require("../utils/fineCalculator");
const {
  query,
  withTransaction,
  mapBookRow,
  mapTicketRow,
  createTransaction,
  updateTransactionStatus,
  getTransactionsByTicket,
} = require("../utils/mysql");
const { createVnpayPaymentUrl, verifyVnpaySignature } = require("../utils/vnpay");
const { sendDepositSuccessMail, sendApprovalSuccessMail } = require("../utils/mail");

const ticketController = {};

const DEFAULT_DEPOSIT_PER_BOOK = Number(process.env.DEFAULT_DEPOSIT_PER_BOOK || 50000);
const DEFAULT_SHIPPING_FEE = Number(process.env.DEFAULT_SHIPPING_FEE || 15000);
const DEFAULT_BORROW_DAYS = Number(process.env.DEFAULT_BORROW_DAYS || 14);

const VALID_PAYMENT_METHODS = new Set(["cash", "vnpay"]);
const VALID_RECEIVE_METHODS = new Set(["pickup", "delivery"]);
const VALID_TICKET_ACTIONS = new Set([
  "confirm_cash",
  "approve",
  "dispatch",
  "deliver",
  "return",
  "settle_deposit",
  "settle_outstanding_fine",
  "cancel",
]);

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

function normalizePaymentMethod(method) {
  if (!method) {
    return "cash";
  }
  const normalized = String(method).toLowerCase();
  return VALID_PAYMENT_METHODS.has(normalized) ? normalized : "cash";
}

function normalizeReceiveMethod(method) {
  if (!method) {
    return "pickup";
  }
  const normalized = String(method).toLowerCase();
  return VALID_RECEIVE_METHODS.has(normalized) ? normalized : "pickup";
}

function formatPaymentRef(ticketId) {
  return `BT${ticketId}-${Date.now()}`;
}

function calculateDepositAmount(bookRows) {
  return bookRows.reduce((total, book) => {
    const price = book.price === null || book.price === undefined ? null : Number(book.price);
    return total + (price && Number.isFinite(price) ? price : DEFAULT_DEPOSIT_PER_BOOK);
  }, 0);
}

function normalizeIp(ip) {
  if (!ip) {
    return "127.0.0.1";
  }

  if (typeof ip !== "string") {
    return String(ip);
  }

  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    return "127.0.0.1";
  }

  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }

  return ip;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return normalizeIp(forwarded.split(",")[0].trim());
  }
  return normalizeIp(req.socket?.remoteAddress || "127.0.0.1");
}

function getDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + DEFAULT_BORROW_DAYS);
  return dueDate;
}

async function fetchTicketBundle(connection, whereClause = "", params = []) {
  const runner = connection ? connection : { query };
  const ticketSql = `
    SELECT
      t.id,
      t.user_id,
      t.status,
      t.borrow_date,
      t.due_date,
      t.return_date,
      t.deposit_amount,
      t.deposit_status,
      t.shipping_fee,
      t.shipping_status,
      t.shipping_address,
      t.shipping_phone,
      t.payment_method,
      t.fine_amount,
      t.approved_by,
      t.approved_at,
      t.created_at,
      t.updated_at,
      u.name AS user_name,
      u.email AS user_email,
      u.role AS user_role,
      ap.name AS approver_name,
      ap.email AS approver_email,
      ap.role AS approver_role
    FROM borrow_tickets t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN users ap ON ap.id = t.approved_by
    ${whereClause}
    ORDER BY t.borrow_date DESC
  `;

  const ticketRows = connection ? (await connection.query(ticketSql, params))[0] : await query(ticketSql, params);
  if (!ticketRows.length) {
    return [];
  }

  const ticketIds = ticketRows.map((row) => row.id);
  const placeholders = ticketIds.map(() => "?").join(",");
  const bookSql = `
    SELECT
      btb.ticket_id,
      b.id,
      b.title,
      b.author,
      b.category,
      b.category_id,
      b.isbn,
      b.description,
      b.available_copies,
      b.total_copies,
      b.added_by,
      b.cover_image,
      b.cloudinary_id,
      b.price,
      b.branch,
      b.borrow_count,
      b.created_at,
      b.updated_at,
      c.name AS category_name,
      u.name AS user_name,
      u.email AS user_email,
      u.role AS user_role
    FROM borrow_ticket_books btb
    JOIN books b ON b.id = btb.book_id
    LEFT JOIN categories c ON c.id = b.category_id
    LEFT JOIN users u ON u.id = b.added_by
    WHERE btb.ticket_id IN (${placeholders})
    ORDER BY btb.ticket_id ASC, b.id ASC
  `;

  const bookRows = connection ? (await connection.query(bookSql, ticketIds))[0] : await query(bookSql, ticketIds);

  const booksByTicket = new Map();
  for (const row of bookRows) {
    const ticketId = row.ticket_id;
    if (!booksByTicket.has(ticketId)) {
      booksByTicket.set(ticketId, []);
    }
    booksByTicket.get(ticketId).push(mapBookRow(row));
  }

  return ticketRows.map((ticketRow) => {
    const ticket = mapTicketRow(ticketRow);
    ticket.books = booksByTicket.get(ticketRow.id) || [];
    return ticket;
  });
}

async function fetchSingleTicket(connection, ticketId) {
  const tickets = await fetchTicketBundle(connection, "WHERE t.id = ?", [ticketId]);
  return tickets[0] || null;
}

ticketController.createTicket = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const {
      books,
      payment_method: paymentMethod,
      receive_method: receiveMethod,
      shipping_address: shippingAddress,
      shipping_phone: shippingPhone,
    } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: true, message: "Books list is required" });
    }

    const uniqueBookIds = [...new Set(books.map((bookId) => Number(bookId)))].filter((bookId) => Number.isInteger(bookId));
    if (uniqueBookIds.length === 0) {
      return res.status(400).json({ error: true, message: "Danh sách sách không hợp lệ." });
    }

    if (uniqueBookIds.length > 1) {
      return res.status(400).json({ error: true, message: "Mỗi phiếu mượn chỉ được phép chứa tối đa 1 cuốn sách. Vui lòng gửi yêu cầu từng cuốn một." });
    }

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
    const normalizedReceiveMethod = normalizeReceiveMethod(receiveMethod);

    const vnpayConfig = {
      tmnCode: process.env.VNPAY_TMN_CODE,
      secretKey: process.env.VNPAY_HASH_SECRET,
      vnpUrl: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    };

    if (normalizedPaymentMethod === "vnpay" && (!vnpayConfig.tmnCode || !vnpayConfig.secretKey)) {
      return res.status(500).json({
        error: true,
        message: "VNPAY configuration is missing",
      });
    }

    if (normalizedReceiveMethod === "delivery" && (!shippingAddress || !String(shippingAddress).trim())) {
      return res.status(400).json({ error: true, message: "Shipping address is required" });
    }

    if (normalizedReceiveMethod === "delivery" && (!shippingPhone || !String(shippingPhone).trim())) {
      return res.status(400).json({ error: true, message: "Shipping phone is required" });
    }

    const placeholders = uniqueBookIds.map(() => "?").join(",");
    const existingBooks = await query(
      `SELECT id, price FROM books WHERE id IN (${placeholders})`,
      uniqueBookIds
    );

    if (existingBooks.length !== uniqueBookIds.length) {
      const existingIds = new Set(existingBooks.map((book) => Number(book.id)));
      const missingIds = uniqueBookIds.filter((bookId) => !existingIds.has(bookId));
      return res.status(404).json({
        error: true,
        message: `Books not found: ${missingIds.join(", ")}`,
      });
    }

    const depositAmount = calculateDepositAmount(existingBooks);
    const shippingFee = normalizedReceiveMethod === "delivery" ? DEFAULT_SHIPPING_FEE : 0;
    const totalAmount = depositAmount + shippingFee;

    const ticketId = await withTransaction(async (connection) => {
      const [ticketResult] = await connection.query(
        `INSERT INTO borrow_tickets (
           user_id,
           status,
           deposit_amount,
           deposit_status,
           payment_method,
           shipping_fee,
           shipping_status,
           shipping_address,
           shipping_phone,
           fine_amount
         )
         VALUES (?, 'pending', ?, 'pending', ?, ?, ?, ?, ?, 0)`,
        [
          userId,
          depositAmount,
          normalizedPaymentMethod,
          shippingFee,
          normalizedReceiveMethod === "delivery" ? "pending" : "none",
          normalizedReceiveMethod === "delivery" ? String(shippingAddress).trim() : null,
          normalizedReceiveMethod === "delivery" ? String(shippingPhone).trim() : null,
        ]
      );

      const values = uniqueBookIds.map((bookId) => [ticketResult.insertId, bookId]);
      await connection.query(
        `INSERT INTO borrow_ticket_books (ticket_id, book_id)
         VALUES ?`,
        [values]
      );

      const paymentRef = normalizedPaymentMethod === "vnpay" ? formatPaymentRef(ticketResult.insertId) : null;

      if (depositAmount > 0) {
        await createTransaction(connection, {
          ticketId: ticketResult.insertId,
          userId,
          type: "deposit",
          method: normalizedPaymentMethod,
          amount: depositAmount,
          status: "pending",
          vnpayTxnRef: paymentRef,
        });
      }

      if (shippingFee > 0) {
        await createTransaction(connection, {
          ticketId: ticketResult.insertId,
          userId,
          type: "shipping",
          method: normalizedPaymentMethod,
          amount: shippingFee,
          status: "pending",
          vnpayTxnRef: paymentRef,
        });
      }

      return ticketResult.insertId;
    });

    clearCache("homeData");
    const ticket = await fetchSingleTicket(null, ticketId);
    let paymentUrl = null;

    if (normalizedPaymentMethod === "vnpay" && totalAmount > 0) {
      const transactions = await getTransactionsByTicket(ticketId);
      const paymentRef = transactions.find((item) => item.vnpayTxnRef)?.vnpayTxnRef;
      if (!paymentRef) {
        return res.status(500).json({ error: true, message: "Unable to create payment reference" });
      }

      paymentUrl = createVnpayPaymentUrl({
        amount: totalAmount,
        txnRef: paymentRef,
        orderInfo: `Borrow ticket ${ticketId}`,
        returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:5000/tickets/vnpay/return",
        ipnUrl: process.env.VNPAY_IPN_URL || "http://localhost:5000/tickets/vnpay/ipn",
        clientIp: getClientIp(req),
        tmnCode: vnpayConfig.tmnCode,
        secretKey: vnpayConfig.secretKey,
        vnpUrl: vnpayConfig.vnpUrl,
      });
    }

    res.status(201).json({
      error: false,
      message: "Borrow ticket created successfully",
      ticket,
      amounts: {
        depositAmount,
        shippingFee,
        totalAmount,
      },
      paymentUrl,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

ticketController.getAllTickets = async (req, res) => {
  try {
    const tickets = await fetchTicketBundle(null);

    res.status(200).json({
      error: false,
      message: "Tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

ticketController.getMyTickets = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const tickets = await fetchTicketBundle(null, "WHERE t.user_id = ?", [userId]);

    res.status(200).json({
      error: false,
      message: "Tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

ticketController.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action, payment_method: paymentMethod } = req.body;
    let nextAction = action;

    if (!nextAction && status) {
      const legacyMap = {
        Approved: "approve",
        Returned: "return",
        Rejected: "cancel",
      };
      nextAction = legacyMap[status];
    }

    if (!nextAction || !VALID_TICKET_ACTIONS.has(nextAction)) {
      return res.status(400).json({ error: true, message: "Invalid action" });
    }

    let triggerDepositMail = false;
    let triggerApproveMail = false;

    const updatedTicket = await withTransaction(async (connection) => {
      const ticket = await fetchSingleTicket(connection, id);
      if (!ticket) {
        return null;
      }

      const rawTicketRows = (await connection.query(
        `SELECT id, status, deposit_status, deposit_amount, shipping_status, fine_amount, due_date, return_date
         FROM borrow_tickets WHERE id = ? LIMIT 1`,
        [id]
      ))[0];
      const currentStatus = normalizeTicketStatus(rawTicketRows[0]?.status || ticket.status);
      const currentDepositStatus = normalizeEnumValue(rawTicketRows[0]?.deposit_status || ticket.depositStatus);
      const currentShippingStatus = normalizeEnumValue(rawTicketRows[0]?.shipping_status || ticket.shippingStatus);

      if (nextAction === "confirm_cash") {
        if (currentDepositStatus !== "pending") {
          throw new Error("Only pending payments can be confirmed");
        }

        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod || "cash");
        const [pendingTransactions] = await connection.query(
          `SELECT id FROM transactions
           WHERE ticket_id = ? AND status = 'pending' AND method = ?
           ORDER BY id ASC`,
          [id, normalizedPaymentMethod]
        );

        for (const transaction of pendingTransactions) {
          await updateTransactionStatus(connection, transaction.id, "completed");
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET deposit_status = 'held', updated_at = NOW()
           WHERE id = ?`,
          [id]
        );
        triggerDepositMail = true;
      }

      if (nextAction === "approve") {

        const unavailableBooks = ticket.books.filter((book) => (book.availableCopies || 0) < 1);
        if (unavailableBooks.length > 0) {
          const error = new Error(`Some books are unavailable: ${unavailableBooks.map((book) => book.title).join(", ")}`);
          error.statusCode = 400;
          throw error;
        }

        for (const book of ticket.books) {
          const [result] = await connection.query(
            `UPDATE books
             SET available_copies = available_copies - 1,
                 borrow_count = borrow_count + 1
             WHERE id = ? AND available_copies > 0`,
            [book._id]
          );
          if (result.affectedRows === 0) {
            const error = new Error(`Book "${book.title}" is no longer available`);
            error.statusCode = 400;
            throw error;
          }
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'approved', due_date = ?, approved_by = ?, approved_at = NOW()
           WHERE id = ?`,
          [getDueDate(), req.userInfo.id, id]
        );
        triggerApproveMail = true;
      }

      if (nextAction === "dispatch") {
        if (currentShippingStatus !== "pending") {
          throw new Error("Only pending shipping tickets can be dispatched");
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'dispatched', shipping_status = 'dispatched'
           WHERE id = ?`,
          [id]
        );
      }

      if (nextAction === "deliver") {
        if (!['approved', 'dispatched'].includes(currentStatus)) {
          throw new Error("Only approved or dispatched tickets can be delivered");
        }

        const nextShippingStatus = currentShippingStatus === "none" ? "none" : "delivered";
        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'delivered', shipping_status = ?
           WHERE id = ?`,
          [nextShippingStatus, id]
        );
      }

      if (nextAction === "return") {
        if (!['approved', 'dispatched', 'delivered'].includes(currentStatus)) {
          throw new Error("Only active tickets can be marked as returned");
        }

        for (const book of ticket.books) {
          await connection.query(
            `UPDATE books
             SET available_copies = available_copies + 1
             WHERE id = ?`,
            [book._id]
          );
        }

        const fineAmount = calculateFine(ticket.dueDate, new Date());
        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'returned', return_date = NOW(), fine_amount = ?
           WHERE id = ?`,
          [fineAmount, id]
        );
      }

      if (nextAction === "settle_deposit") {
        if (currentDepositStatus !== "held") {
          throw new Error("Only held deposits can be settled");
        }

        const [depositRows] = await connection.query(
          `SELECT id, amount, method FROM transactions
           WHERE ticket_id = ? AND type = 'deposit' AND status = 'completed'
           ORDER BY id ASC`,
          [id]
        );
        const depositTransaction = depositRows[0];
        const depositAmount = depositTransaction ? Number(depositTransaction.amount) : Number(ticket.depositAmount || 0);
        const fineAmount = Number(ticket.fineAmount || 0);
        const refundAmount = Math.max(depositAmount - fineAmount, 0);

        if (fineAmount <= 0) {
          if (refundAmount > 0) {
            await createTransaction(connection, {
              ticketId: id,
              userId: ticket.userId?._id || ticket.userId,
              type: "deposit",
              method: depositTransaction?.method || "cash",
              amount: -refundAmount,
              status: "refunded",
              vnpayTxnRef: depositTransaction?.vnpay_txn_ref || null,
            });
          }

          await connection.query(
            `UPDATE borrow_tickets
             SET deposit_status = 'refunded', status = 'closed'
             WHERE id = ?`,
            [id]
          );
        } else if (fineAmount < depositAmount) {
          await createTransaction(connection, {
            ticketId: id,
            userId: ticket.userId?._id || ticket.userId,
            type: "fine",
            method: depositTransaction?.method || "cash",
            amount: fineAmount,
            status: "completed",
            vnpayTxnRef: depositTransaction?.vnpay_txn_ref || null,
          });

          await createTransaction(connection, {
            ticketId: id,
            userId: ticket.userId?._id || ticket.userId,
            type: "deposit",
            method: depositTransaction?.method || "cash",
            amount: -refundAmount,
            status: "refunded",
            vnpayTxnRef: depositTransaction?.vnpay_txn_ref || null,
          });

          await connection.query(
            `UPDATE borrow_tickets
             SET deposit_status = 'refunded', status = 'closed'
             WHERE id = ?`,
            [id]
          );
        } else {
          await createTransaction(connection, {
            ticketId: id,
            userId: ticket.userId?._id || ticket.userId,
            type: "fine",
            method: depositTransaction?.method || "cash",
            amount: depositAmount,
            status: "completed",
            vnpayTxnRef: depositTransaction?.vnpay_txn_ref || null,
          });

          const outstandingAmount = Math.max(fineAmount - depositAmount, 0);
          if (outstandingAmount > 0) {
            await createTransaction(connection, {
              ticketId: id,
              userId: ticket.userId?._id || ticket.userId,
              type: "fine",
              method: normalizePaymentMethod(paymentMethod || "cash"),
              amount: outstandingAmount,
              status: "pending",
              vnpayTxnRef: null,
            });
          }

          await connection.query(
            `UPDATE borrow_tickets
             SET deposit_status = 'forfeited', status = ?
             WHERE id = ?`,
            [outstandingAmount > 0 ? "returned" : "closed", id]
          );
        }
      }

      if (nextAction === "settle_outstanding_fine") {
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod || "cash");
        const [pendingFineRows] = await connection.query(
          `SELECT id FROM transactions
           WHERE ticket_id = ? AND type = 'fine' AND status = 'pending' AND method = ?
           ORDER BY id ASC`,
          [id, normalizedPaymentMethod]
        );

        for (const transaction of pendingFineRows) {
          await updateTransactionStatus(connection, transaction.id, "completed");
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'closed'
           WHERE id = ?`,
          [id]
        );
      }

      if (nextAction === "cancel") {
        if (!['pending', 'awaiting_payment', 'paid'].includes(currentStatus)) {
          throw new Error("Only pending or paid tickets can be cancelled");
        }

        const [pendingTransactions] = await connection.query(
          `SELECT id FROM transactions
           WHERE ticket_id = ? AND status = 'pending'
           ORDER BY id ASC`,
          [id]
        );

        for (const transaction of pendingTransactions) {
          await updateTransactionStatus(connection, transaction.id, "failed");
        }

        if (currentDepositStatus === "held") {
          const [depositRows] = await connection.query(
            `SELECT amount, method, vnpay_txn_ref FROM transactions
             WHERE ticket_id = ? AND type = 'deposit' AND status = 'completed'
             LIMIT 1`,
            [id]
          );

          if (depositRows.length > 0) {
            await createTransaction(connection, {
              ticketId: id,
              userId: ticket.userId?._id || ticket.userId,
              type: "deposit",
              method: depositRows[0].method,
              amount: -Number(depositRows[0].amount),
              status: "refunded",
              vnpayTxnRef: depositRows[0].vnpay_txn_ref,
            });
          }

          await connection.query(
            `UPDATE borrow_tickets
             SET status = 'cancelled', deposit_status = 'refunded'
             WHERE id = ?`,
            [id]
          );
        } else {
          await connection.query(
            `UPDATE borrow_tickets
             SET status = 'cancelled', deposit_status = 'none'
             WHERE id = ?`,
            [id]
          );
        }
      }

      return fetchSingleTicket(connection, id);
    });

    if (!updatedTicket) {
      return res.status(404).json({ error: true, message: "Ticket not found" });
    }

    if (triggerDepositMail && updatedTicket.userId?.email) {
      sendDepositSuccessMail(updatedTicket).catch(console.error);
    }
    
    if (triggerApproveMail && updatedTicket.userId?.email) {
      sendApprovalSuccessMail(updatedTicket).catch(console.error);
    }

    clearCache("homeData");
    res.status(200).json({
      error: false,
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    const message = error.statusCode === 400 ? error.message : "Internal Server Error";
    res.status(error.statusCode || 500).json({
      error: true,
      message,
      details: error.statusCode === 400 ? undefined : error.message,
    });
  }
};

ticketController.getTicketTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await getTransactionsByTicket(id);
    res.status(200).json({
      error: false,
      message: "Transactions fetched successfully",
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

ticketController.vnpayReturn = async (req, res) => {
  try {
    const params = req.query;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    if (!secretKey) {
      return res.status(500).json({ error: true, message: "VNPAY configuration is missing" });
    }

    const verification = verifyVnpaySignature(params, secretKey);

    if (!verification.isValid) {
      return res.status(400).json({ error: true, message: "Invalid VNPAY signature" });
    }

    const isSuccess = params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    const vnpTxnRef = params.vnp_TxnRef || "";
    const ticketIdMatch = vnpTxnRef.match(/^BT(\d+)-/);
    const ticketId = ticketIdMatch ? ticketIdMatch[1] : "";
    const amount = params.vnp_Amount ? Number(params.vnp_Amount) / 100 : 0;
    
    // Sync status on return for local testing or immediate update
    if (vnpTxnRef) {
      try {
        const transactionRows = await query(
          `SELECT id, ticket_id, status FROM transactions WHERE vnpay_txn_ref = ? ORDER BY id ASC`,
          [vnpTxnRef]
        );

        if (transactionRows.length > 0) {
          const dbTicketId = transactionRows[0].ticket_id;
          let triggerDepositMail = false;
          let ticketInfoForMail = null;

          await withTransaction(async (connection) => {
            for (const transaction of transactionRows) {
              if (transaction.status === "pending") {
                await updateTransactionStatus(connection, transaction.id, isSuccess ? "completed" : "failed", vnpTxnRef);
              }
            }

            if (isSuccess) {
              const [updateResult] = await connection.query(
                `UPDATE borrow_tickets
                 SET deposit_status = 'held', updated_at = NOW()
                 WHERE id = ? AND deposit_status = 'pending'`,
                [dbTicketId]
              );
              
              if (updateResult && updateResult.affectedRows > 0) {
                triggerDepositMail = true;
                ticketInfoForMail = await fetchSingleTicket(connection, dbTicketId);
              }
            }
          });

          if (triggerDepositMail && ticketInfoForMail) {
            sendDepositSuccessMail(ticketInfoForMail).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Error updating status in vnpayReturn:", err);
      }
    }
    
    res.redirect(`${frontendUrl}/payment-result?status=${isSuccess ? 'success' : 'failed'}&method=vnpay&ticketId=${ticketId}&amount=${amount}`);
  } catch (error) {
    res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};

ticketController.vnpayIpn = async (req, res) => {
  try {
    const params = req.query;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    if (!secretKey) {
      return res.status(200).json({ RspCode: "99", Message: "Missing config" });
    }

    const verification = verifyVnpaySignature(params, secretKey);
    if (!verification.isValid) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }

    const vnpTxnRef = params.vnp_TxnRef;
    const isSuccess = params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";

    const transactionRows = await query(
      `SELECT id, ticket_id, status FROM transactions WHERE vnpay_txn_ref = ? ORDER BY id ASC`,
      [vnpTxnRef]
    );

    if (!transactionRows.length) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }

    const ticketId = transactionRows[0].ticket_id;
    let triggerDepositMail = false;
    let ticketInfoForMail = null;

    await withTransaction(async (connection) => {
      for (const transaction of transactionRows) {
        if (transaction.status === "pending") {
          await updateTransactionStatus(connection, transaction.id, isSuccess ? "completed" : "failed", vnpTxnRef);
        }
      }

      if (isSuccess) {
        const [updateResult] = await connection.query(
          `UPDATE borrow_tickets
           SET deposit_status = 'held', updated_at = NOW()
           WHERE id = ? AND deposit_status = 'pending'`,
          [ticketId]
        );

        if (updateResult && updateResult.affectedRows > 0) {
          triggerDepositMail = true;
          ticketInfoForMail = await fetchSingleTicket(connection, ticketId);
        }
      }
    });

    if (triggerDepositMail && ticketInfoForMail) {
      sendDepositSuccessMail(ticketInfoForMail).catch(console.error);
    }

    return res.status(200).json({ RspCode: "00", Message: "Success" });
  } catch (error) {
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

module.exports = { ticketController };