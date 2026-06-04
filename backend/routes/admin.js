const express = require("express");
const  router = express.Router();
const {adminController} = require("../controller/admin")


const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { loginLimiter } = require("../middlewares/rateLimiters");

router.post("/login", loginLimiter, adminController.login)
router.get("/reviews", userAuth, checkRole("admin"), adminController.getAllReviews)
router.put("/reviews/:id/status", userAuth, checkRole("admin"), adminController.updateReviewStatus)
router.delete("/reviews/:id", userAuth, checkRole("admin"), adminController.deleteReview)



module.exports = router