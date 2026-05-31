const express = require("express");
const router = express.Router();
const { categoriesController } = require("../controller/categories");

router.get("/", categoriesController.getAllCategories);

module.exports = router;