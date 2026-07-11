const { query } = require("../utils/mysql");
const { verifyAccessToken } = require("../utils/jwtConfig");
const { getAuthTokenFromRequest } = require("../utils/authCookie");

const userAuth = async (req, res, next) => {
  const token = getAuthTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: true, message: "Access Denied: No token provided" });
  }

  try {
    const decoded = verifyAccessToken(token);
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
