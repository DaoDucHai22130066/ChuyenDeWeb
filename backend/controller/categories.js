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
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

module.exports = { categoriesController };
