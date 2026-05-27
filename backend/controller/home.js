const pool = require("../config/db");
const { setCache, getCache } = require("../utils/cache");

const homeController = {};

homeController.getHomeData = async (req, res) => {
  try {
    const cachedData = getCache("homeData");
    if (cachedData) {
      return res.status(200).json({
        error: false,
        message: "Homepage data fetched from cache",
        ...cachedData
      });
    }

    const [[{ totalBooks }]] = await pool.query("SELECT COUNT(*) AS totalBooks FROM books");

    const [categoriesResult] = await pool.query(`
      SELECT category, COUNT(*) as count, max(coverImage) as coverImage 
      FROM books 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 4
    `);

    const [[{ totalCategories }]] = await pool.query(`
      SELECT COUNT(DISTINCT category) as totalCategories FROM books
    `);

    const [newArrivals] = await pool.query(`
      SELECT title, author, category, coverImage 
      FROM books 
      ORDER BY createdAt DESC 
      LIMIT 4
    `);

    const [[{ totalActiveStudents }]] = await pool.query(`
      SELECT COUNT(DISTINCT userId) as totalActiveStudents FROM borrows WHERE status = 'Issued'
    `);

    const responseData = {
      stats: {
        totalBooks,
        totalCategories,
        totalActiveStudents
      },
      categories: categoriesResult,
      newArrivals
    };
    
    setCache("homeData", responseData);

    res.status(200).json({
      error: false,
      message: "Homepage data fetched successfully",
      ...responseData
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message
    });
  }
};

module.exports = { homeController };
