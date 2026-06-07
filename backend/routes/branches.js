const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all branches
router.get("/", async (req, res) => {
  try {
    const [branches] = await pool.query(
      "SELECT id, name, address, phone, email, opening_hours, description FROM branches WHERE is_active = TRUE ORDER BY name"
    );
    res.status(200).json({
      error: false,
      message: "Branches fetched successfully",
      branches,
      totalBranches: branches.length,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Get branch by ID with gallery
router.get("/:id", async (req, res) => {
  try {
    const [branches] = await pool.query(
      "SELECT * FROM branches WHERE id = ? AND is_active = TRUE",
      [req.params.id]
    );
    if (branches.length === 0) {
      return res.status(404).json({ error: true, message: "Branch not found" });
    }

    const [gallery] = await pool.query(
      "SELECT id, title, image_url, description FROM gallery_images WHERE branch_id = ? AND is_active = TRUE ORDER BY image_order",
      [req.params.id]
    );

    res.status(200).json({
      error: false,
      message: "Branch fetched successfully",
      branch: branches[0],
      gallery,
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
