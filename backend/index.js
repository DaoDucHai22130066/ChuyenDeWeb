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

const allowedOrigins = [
  "http://localhost:5173",
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

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: true, message: "Too many requests from this IP, please try again after 15 minutes" },
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