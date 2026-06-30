const jwt = require("jsonwebtoken");
const { query } = require("../utils/mysql");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";

const userAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: true, message: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rows = await query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1",
      [decoded.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: true, message: "Invalid Token" });
    }

    if (Number(user.is_active) === 0) {
      return res.status(403).json({ error: true, message: "Tài khoản đã bị khóa" });
    }

    req.userInfo = {
      ...decoded,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: "Invalid Token" });
  }
};

module.exports = { userAuth };
