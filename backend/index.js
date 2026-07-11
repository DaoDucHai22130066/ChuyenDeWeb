const express = require('express'); 
const app = express(); 
const cors = require('cors'); 
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require("./utils/loadEnv");
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
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://library-management-app-karan.vercel.app",
].filter(Boolean);

app.use(express.json()); // Parse JSON
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));

// Required for Google Sign-In One Tap popups to work properly
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(helmet());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 1000),
  message: { error: true, message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
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
    res.send("API is running...");
  });
  
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack || err);
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
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