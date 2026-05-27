const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Create a new donation
router.post("/", async (req, res) => {
  try {
    const {
      donor_name,
      donor_email,
      donor_phone,
      amount,
      donation_type,
      description,
      book_count,
      branch_id,
    } = req.body;

    if (!donor_name || !donor_email) {
      return res.status(400).json({
        error: true,
        message: "Donor name and email are required",
      });
    }

    await pool.query(
      `INSERT INTO donations 
      (donor_name, donor_email, donor_phone, amount, donation_type, description, book_count, branch_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        donor_name,
        donor_email,
        donor_phone || null,
        amount || null,
        donation_type || "money",
        description || null,
        book_count || null,
        branch_id || null,
      ]
    );

    res.status(201).json({
      error: false,
      message: "Donation received successfully. We will contact you soon.",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Get all donations (admin only)
router.get("/", async (req, res) => {
  try {
    const [donations] = await pool.query(
      `SELECT d.*, b.name as branch_name
      FROM donations d
      LEFT JOIN branches b ON d.branch_id = b.id
      ORDER BY d.created_at DESC`
    );
    res.status(200).json({
      error: false,
      message: "Donations fetched successfully",
      donations,
      totalDonations: donations.length,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Get donation by ID
router.get("/:id", async (req, res) => {
  try {
    const [donations] = await pool.query(
      `SELECT d.*, b.name as branch_name
      FROM donations d
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.id = ?`,
      [req.params.id]
    );

    if (donations.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Donation not found",
      });
    }

    res.status(200).json({
      error: false,
      message: "Donation fetched successfully",
      donation: donations[0],
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Update donation status (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "received", "processed"].includes(status)) {
      return res.status(400).json({
        error: true,
        message: "Invalid status",
      });
    }

    await pool.query("UPDATE donations SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);

    res.status(200).json({
      error: false,
      message: "Donation status updated successfully",
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
