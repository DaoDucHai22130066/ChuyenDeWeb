const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all published articles
router.get("/", async (req, res) => {
  try {
    const [articles] = await pool.query(
      `SELECT 
        a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.created_at, a.view_count,
        u.name as author_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_published = TRUE
      ORDER BY a.published_at DESC
      LIMIT 50`
    );
    res.status(200).json({
      error: false,
      message: "Articles fetched successfully",
      articles,
      totalArticles: articles.length,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Get article by slug
router.get("/detail/:slug", async (req, res) => {
  try {
    const [articles] = await pool.query(
      `SELECT 
        a.*, 
        u.name as author_name, u.email as author_email
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.slug = ? AND a.is_published = TRUE`,
      [req.params.slug]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: true, message: "Article not found" });
    }

    // Increment view count
    await pool.query("UPDATE articles SET view_count = view_count + 1 WHERE id = ?", [
      articles[0].id,
    ]);

    res.status(200).json({
      error: false,
      message: "Article fetched successfully",
      article: articles[0],
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Search articles
router.get("/search/:query", async (req, res) => {
  try {
    const [articles] = await pool.query(
      `SELECT 
        a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.created_at,
        u.name as author_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_published = TRUE AND 
      MATCH(a.title, a.content) AGAINST(? IN BOOLEAN MODE)
      ORDER BY a.published_at DESC
      LIMIT 20`,
      [req.params.query]
    );
    res.status(200).json({
      error: false,
      message: "Articles searched successfully",
      articles,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
