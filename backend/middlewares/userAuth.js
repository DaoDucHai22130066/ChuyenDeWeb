const jwt = require("jsonwebtoken");
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";

function getCookieValue(req, name) {
  const header = req.headers && req.headers.cookie;
  if (!header) return null;
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
}

const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const tokenFromCookie = getCookieValue(req, 'authToken');

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(403).json({ error: true, message: "Access Denied: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userInfo = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: "Invalid token" });
  }
};

module.exports = { userAuth };
=======
const JWT_SECRET = "12345@abcd12";


const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({error: true, message: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1]; 

  try {
    const decoded = jwt.verify(token,JWT_SECRET);
    req.userInfo = decoded; 
    next(); 
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });

  }
};


module.exports = {userAuth}
>>>>>>> hai
