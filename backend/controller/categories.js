const { query, withTransaction, mapCategoryRow } = require("../utils/mysql");
const { clearCache } = require("../utils/cache");

const categoriesController = {};

function parseCategoryId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeCategoryName(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

async function getCategoryById(id) {
  const rows = await query(
    `SELECT c.id, c.name, c.created_at, c.updated_at, COUNT(b.id) AS book_count
     FROM categories c
     LEFT JOIN books b ON b.category_id = c.id
     WHERE c.id = ?
     GROUP BY c.id, c.name, c.created_at, c.updated_at
     LIMIT 1`,
    [id]
  );

  return rows[0];
}

async function categoryNameExists(name, excludeId = null) {
  const params = [name];
  let sql = "SELECT id FROM categories WHERE name = ?";

  if (excludeId) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";
  const rows = await query(sql, params);
  return rows.length > 0;
}

function handleCategoryError(error, res) {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(400).json({ error: true, message: "Danh mục đã tồn tại" });
  }

  return res.status(500).json({
    error: true,
    message: "Internal Server Error",
    details: error.message,
  });
}

categoriesController.getAllCategories = async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.id, c.name, c.created_at, c.updated_at, COUNT(b.id) AS book_count
       FROM categories c
       LEFT JOIN books b ON b.category_id = c.id
       GROUP BY c.id, c.name, c.created_at, c.updated_at
       ORDER BY c.name ASC`
    );

    const categories = rows.map(mapCategoryRow);

    res.status(200).json({
      error: false,
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    handleCategoryError(error, res);
  }
};

categoriesController.createCategory = async (req, res) => {
  try {
    const name = normalizeCategoryName(req.body.name);

    if (!name) {
      return res.status(400).json({ error: true, message: "Tên danh mục là bắt buộc" });
    }

    if (name.length > 255) {
      return res.status(400).json({ error: true, message: "Tên danh mục không được vượt quá 255 ký tự" });
    }

    if (await categoryNameExists(name)) {
      return res.status(400).json({ error: true, message: "Danh mục đã tồn tại" });
    }

    const result = await query("INSERT INTO categories (name) VALUES (?)", [name]);
    clearCache("homeData");

    const category = await getCategoryById(result.insertId);
    res.status(201).json({
      error: false,
      success: true,
      message: "Đã thêm danh mục",
      category: mapCategoryRow(category),
    });
  } catch (error) {
    handleCategoryError(error, res);
  }
};

categoriesController.updateCategory = async (req, res) => {
  try {
    const id = parseCategoryId(req.params.id);
    const name = normalizeCategoryName(req.body.name);

    if (!id) {
      return res.status(400).json({ error: true, message: "Category id không hợp lệ" });
    }

    if (!name) {
      return res.status(400).json({ error: true, message: "Tên danh mục là bắt buộc" });
    }

    if (name.length > 255) {
      return res.status(400).json({ error: true, message: "Tên danh mục không được vượt quá 255 ký tự" });
    }

    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({ error: true, message: "Không tìm thấy danh mục" });
    }

    if (await categoryNameExists(name, id)) {
      return res.status(400).json({ error: true, message: "Danh mục đã tồn tại" });
    }

    await withTransaction(async (connection) => {
      await connection.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
      await connection.query("UPDATE books SET category = ? WHERE category_id = ?", [name, id]);
    });

    clearCache("homeData");

    const category = await getCategoryById(id);
    res.status(200).json({
      error: false,
      success: true,
      message: "Đã cập nhật danh mục",
      category: mapCategoryRow(category),
    });
  } catch (error) {
    handleCategoryError(error, res);
  }
};

categoriesController.deleteCategory = async (req, res) => {
  try {
    const id = parseCategoryId(req.params.id);

    if (!id) {
      return res.status(400).json({ error: true, message: "Category id không hợp lệ" });
    }

    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({ error: true, message: "Không tìm thấy danh mục" });
    }

    const affectedBooks = Number(existingCategory.book_count || 0);

    await withTransaction(async (connection) => {
      await connection.query("UPDATE books SET category = NULL, category_id = NULL WHERE category_id = ?", [id]);
      await connection.query("DELETE FROM categories WHERE id = ?", [id]);
    });

    clearCache("homeData");

    res.status(200).json({
      error: false,
      success: true,
      message: "Đã xóa danh mục",
      affectedBooks,
    });
  } catch (error) {
    handleCategoryError(error, res);
  }
};

module.exports = { categoriesController };
