const { query, mapCategoryRow } = require("../utils/mysql");

const categoriesController = {};

categoriesController.getAllCategories = async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, created_at, updated_at
       FROM categories
       ORDER BY name ASC`
    );

    const categories = rows.map(mapCategoryRow);

    res.status(200).json({
      error: false,
<<<<<<< HEAD
      message: "Lấy danh sách thể loại thành công",
=======
      message: "Categories fetched successfully",
>>>>>>> hai
      categories,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
<<<<<<< HEAD
      message: "Lỗi máy chủ",
=======
      message: "Internal Server Error",
>>>>>>> hai
      details: error.message,
    });
  }
};

module.exports = { categoriesController };
