const { query, withTransaction } = require("../utils/mysql");

const cartController = {};

cartController.getCart = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const rows = await query(
      `SELECT c.id AS cart_id, b.id AS book_id, b.title, b.author, b.cover_image, b.available_copies
       FROM carts c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN books b ON b.id = ci.book_id
       WHERE c.user_id = ?`,
      [userId]
    );

    const items = rows.map((r) => ({ _id: r.book_id, title: r.title, author: r.author, coverImage: r.cover_image, availableCopies: r.available_copies }));
    res.json({ error: false, cart: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Failed to load cart" });
  }
};

cartController.saveCart = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const { bookIds } = req.body; // expect array of book ids
    if (!Array.isArray(bookIds)) return res.status(400).json({ error: true, message: 'bookIds must be an array' });

    await withTransaction(async (connection) => {
      const [existing] = await connection.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [userId]);
      let cartId;
      if (existing.length > 0) {
        cartId = existing[0].id;
        // remove existing items to replace with provided list
        await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
      } else {
        const [ins] = await connection.query("INSERT INTO carts (user_id) VALUES (?)", [userId]);
        cartId = ins.insertId;
      }

      if (bookIds.length > 0) {
        const rows = bookIds.map((bid) => [cartId, bid]);
        await connection.query("INSERT INTO cart_items (cart_id, book_id) VALUES ?", [rows]);
      }
    });

    res.json({ error: false, message: 'Cart saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Failed to save cart' });
  }
};

cartController.clearCart = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    await withTransaction(async (connection) => {
      const [existing] = await connection.query("SELECT id FROM carts WHERE user_id = ? LIMIT 1", [userId]);
      if (existing.length > 0) {
        const cartId = existing[0].id;
        await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
        await connection.query("DELETE FROM carts WHERE id = ?", [cartId]);
      }
    });
    res.json({ error: false, message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Failed to clear cart' });
  }
};

module.exports = { cartController };
