const express = require('express'); 
const app = express(); 
const cors = require('cors'); 
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require("./config/db.js");
const users = require("./routes/user.js") 
const books = require("./routes/books.js")
const admin = require("./routes/admin.js")
const categories = require("./routes/categories.js")
const tickets = require("./routes/tickets.js")
const home = require("./routes/home.js")
const cart = require("./routes/cart.js")
const wishlist = require("./routes/wishlist.js")
const reviews = require("./routes/reviews.js")

const allowedOrigins = [
<<<<<<< HEAD
  process.env.FRONTEND_URL || "http://localhost:5173",
=======
  "http://localhost:5173",
>>>>>>> hai
  "https://library-management-app-karan.vercel.app",
];

app.use(express.json()); // Parse JSON
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

<<<<<<< HEAD
// expose cookies parsing (optional): read auth token from cookie header
// Note: do not enable cookie-parser unless you set secure cookie settings in production
// We read cookies manually in middleware to avoid extra dependency.

=======
>>>>>>> hai
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
<<<<<<< HEAD
  message: { error: true, message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút" },
=======
  message: { error: true, message: "Too many requests from this IP, please try again after 15 minutes" },
>>>>>>> hai
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use(limiter);
app.use("/users",users);
app.use("/books",books);
app.use("/admin",admin);
app.use("/categories",categories);
app.use("/tickets",tickets);
app.use("/home",home);
app.use("/cart", cart);
app.use("/wishlist", wishlist);
app.use("/reviews", reviews);

app.get("/", (req, res) => {
<<<<<<< HEAD
    res.send("API đang chạy...");
=======
    res.send("API is running...");
>>>>>>> hai
  });
  
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack || err);
  const status = err.statusCode || 500;
<<<<<<< HEAD
  const message = err.message || "Lỗi máy chủ nội bộ";
=======
  const message = err.message || "Internal Server Error";
>>>>>>> hai
  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});
  
  const PORT = process.env.PORT || 5000;

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });