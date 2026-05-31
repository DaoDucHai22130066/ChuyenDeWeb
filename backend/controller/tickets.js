const { clearCache } = require("../utils/cache");
const { query, withTransaction, mapBookRow, mapTicketRow } = require("../utils/mysql");

const ticketController = {};

async function fetchTicketBundle(connection, whereClause = "", params = []) {
  const runner = connection ? connection : { query };
  const ticketSql = `
    SELECT
      t.id,
      t.user_id,
      t.status,
      t.borrow_date,
      t.return_date,
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
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: true, message: "Books list is required" });
    }

    const uniqueBookIds = [...new Set(books.map((bookId) => Number(bookId)))].filter((bookId) => Number.isInteger(bookId));
    if (uniqueBookIds.length === 0) {
      return res.status(400).json({ error: true, message: "Books list is required" });
    }

    const placeholders = uniqueBookIds.map(() => "?").join(",");
    const existingBooks = await query(
      `SELECT id FROM books WHERE id IN (${placeholders})`,
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

    const ticketId = await withTransaction(async (connection) => {
      const [ticketResult] = await connection.query(
        `INSERT INTO borrow_tickets (user_id, status)
         VALUES (?, 'Pending')`,
        [userId]
      );

      const values = uniqueBookIds.map((bookId) => [ticketResult.insertId, bookId]);
      await connection.query(
        `INSERT INTO borrow_ticket_books (ticket_id, book_id)
         VALUES ?`,
        [values]
      );

      return ticketResult.insertId;
    });

    clearCache("homeData");
    const ticket = await fetchSingleTicket(null, ticketId);

    res.status(201).json({
      error: false,
      message: "Borrow ticket created successfully",
      ticket,
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
    const { status } = req.body;

    if (!["Approved", "Returned", "Rejected"].includes(status)) {
      return res.status(400).json({ error: true, message: "Invalid status" });
    }

    const updatedTicket = await withTransaction(async (connection) => {
      const ticket = await fetchSingleTicket(connection, id);
      if (!ticket) {
        return null;
      }

      const rawTicketRows = (await connection.query(
        `SELECT id, status FROM borrow_tickets WHERE id = ? LIMIT 1`,
        [id]
      ))[0];
      const currentStatus = rawTicketRows[0]?.status || ticket.status;

      if (status === "Approved") {
        if (currentStatus !== "Pending") {
          throw new Error("Only pending tickets can be approved");
        }

        const unavailableBooks = ticket.books.filter((book) => (book.availableCopies || 0) < 1);
        if (unavailableBooks.length > 0) {
          const error = new Error(`Some books are unavailable: ${unavailableBooks.map((book) => book.title).join(", ")}`);
          error.statusCode = 400;
          throw error;
        }

        for (const book of ticket.books) {
          await connection.query(
            `UPDATE books
             SET available_copies = available_copies - 1,
                 borrow_count = borrow_count + 1
             WHERE id = ?`,
            [book._id]
          );
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'Approved', approved_by = ?, approved_at = NOW()
           WHERE id = ?`,
          [req.userInfo.id, id]
        );
      }

      if (status === "Returned") {
        if (currentStatus !== "Approved") {
          throw new Error("Only approved tickets can be marked as returned");
        }

        for (const book of ticket.books) {
          await connection.query(
            `UPDATE books
             SET available_copies = available_copies + 1
             WHERE id = ?`,
            [book._id]
          );
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'Returned', return_date = NOW()
           WHERE id = ?`,
          [id]
        );
      }

      if (status === "Rejected") {
        if (currentStatus !== "Pending") {
          throw new Error("Only pending tickets can be rejected");
        }

        await connection.query(
          `UPDATE borrow_tickets
           SET status = 'Rejected'
           WHERE id = ?`,
          [id]
        );
      }

      return fetchSingleTicket(connection, id);
    });

    if (!updatedTicket) {
      return res.status(404).json({ error: true, message: "Ticket not found" });
    }

    clearCache("homeData");
    res.status(200).json({
      error: false,
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    const message = error.statusCode === 400 ? error.message : "Internal Server Error";
    res.status(error.statusCode || 500).json({
      error: true,
      message,
      details: error.statusCode === 400 ? undefined : error.message,
    });
  }
};

module.exports = { ticketController };
