const express = require("express");
const  router = express.Router();
const {adminController} = require("../controller/admin")


const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { loginLimiter } = require("../middlewares/rateLimits");

router.post("/login", loginLimiter, adminController.login)
router.get("/users", userAuth, checkRole("admin"), adminController.getUsers)
router.put("/users/:id", userAuth, checkRole("admin"), adminController.updateUser)
router.patch("/users/:id/status", userAuth, checkRole("admin"), adminController.updateUserStatus)
router.delete("/users/:id", userAuth, checkRole("admin"), adminController.deleteUser)
router.get("/contacts", userAuth, checkRole("admin"), adminController.getContacts)
router.put("/contacts/:id", userAuth, checkRole("admin"), adminController.updateContact)
router.delete("/contacts/:id", userAuth, checkRole("admin"), adminController.deleteContact)
router.get("/reports", userAuth, checkRole("admin"), adminController.getReports)
router.get("/reviews", userAuth, checkRole("admin"), adminController.getAllReviews)
router.put("/reviews/:id/status", userAuth, checkRole("admin"), adminController.updateReviewStatus)
router.delete("/reviews/:id", userAuth, checkRole("admin"), adminController.deleteReview)
// Thêm dòng này vào routes/admin.js
router.put("/reviews/:id/reply", userAuth, checkRole("admin"), adminController.replyReview);


module.exports = router
