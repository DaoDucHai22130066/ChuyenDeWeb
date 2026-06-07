const homeController = {};
const { query, mapBookRow } = require("../utils/mysql");
const { getCache, setCache } = require("../utils/cache");

homeController.getHomeData = async (req, res) => {
  try {
    const cachedData = getCache("homeData");
    if (cachedData) {
      return res.status(200).json({
        error: false,
        message: "Homepage data fetched from cache",
        ...cachedData,
      });
    }

    const rows = await query(
      `SELECT
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
         b.price,
         b.branch,
         b.borrow_count,
         b.created_at,
         b.updated_at,
         c.name AS category_name,
         u.name AS user_name,
         u.email AS user_email,
         u.role AS user_role
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN users u ON u.id = b.added_by
       ORDER BY b.created_at DESC`
    );

    const books = rows.map(mapBookRow);
    const totalBooks = books.length;
    const categoryMap = new Map();

    books.forEach((book) => {
      const categoryName = book.categoryId?.name || book.category || "Chưa phân loại";
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          category: categoryName,
          count: 0,
          coverImage: book.coverImage,
        });
      }

      const current = categoryMap.get(categoryName);
      current.count += 1;
    });

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const totalCategories = categoryMap.size;

    const newArrivals = books.slice(0, 4).map((book) => ({
      _id: book._id,
      title: book.title,
      author: book.author,
      category: book.categoryId?.name || book.category,
      coverImage: book.coverImage,
    }));

    const activeStudentsRows = await query(
      `SELECT COUNT(DISTINCT user_id) AS totalActiveStudents
       FROM borrow_tickets
       WHERE status IN ('approved', 'dispatched', 'delivered')`
    );
    const totalActiveStudents = Number(activeStudentsRows[0]?.totalActiveStudents || 0);

    const responseData = {
      stats: {
        totalBooks,
        totalCategories,
        totalActiveStudents,
      },
      categories,
      newArrivals,
    };

    setCache("homeData", responseData);

    res.status(200).json({
      error: false,
      message: "Homepage data fetched successfully",
      ...responseData,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

module.exports = { homeController };
