const express = require("express");
const router = express.Router();
const { categoriesController } = require("../controller/categories");
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");

router.get("/", categoriesController.getAllCategories);
router.post("/", userAuth, checkRole("admin"), categoriesController.createCategory);
router.put("/:id", userAuth, checkRole("admin"), categoriesController.updateCategory);
router.delete("/:id", userAuth, checkRole("admin"), categoriesController.deleteCategory);

module.exports = router;
