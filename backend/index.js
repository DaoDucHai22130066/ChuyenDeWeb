const express = require('express'); 
const app = express(); 
const cors = require('cors'); 
require('dotenv').config();
const users = require("./routes/user.js") 
const books = require("./routes/books.js")
const home = require("./routes/home.js")
const branches = require("./routes/branches.js")
const articles = require("./routes/articles.js")
const donations = require("./routes/donations.js")

const pool = require("./config/db.js");

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

// API Routes
app.use("/users", users);
app.use("/books", books);
app.use("/home", home);
app.use("/branches", branches);
app.use("/articles", articles);
app.use("/donations", donations);

app.get("/", (req, res) => {
    res.send("D Free Book API is running...");
});
  
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const [rows, fields] = await pool.query("SELECT 1");
    console.log("✓ Database Connected");
  } catch (error) {
    console.error("✗ Database Connection Failed", error);
  }
});