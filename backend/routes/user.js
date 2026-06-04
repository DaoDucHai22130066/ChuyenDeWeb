const express = require("express");
const router = express.Router();
const { checkRole } = require("../middlewares/checkRole");
const { userAuth } = require("../middlewares/userAuth");
const { userController } = require("../controller/user");
const { body, validationResult } = require("express-validator");
const { loginLimiter, otpLimiter, registerLimiter } = require("../middlewares/rateLimiters");

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });
  next();
}

// Protect user listing: admin only
router.get("/", userAuth, checkRole("admin"), userController.getUsers);

router.post(
  "/register",
  registerLimiter,
  [body("name").notEmpty(), body("email").isEmail(), body("password").isLength({ min: 6 })],
  runValidation,
  userController.userRegistration
);

router.post(
  "/login",
  loginLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  runValidation,
  userController.login
);

router.post("/google-login", loginLimiter, userController.googleLogin);

router.get("/profile", userAuth, checkRole("user"), userController.profile);
router.put("/profile", userAuth, checkRole("user"), userController.updateProfile);

router.post("/contact", userController.addContact);

router.post("/forgot-password", otpLimiter, [body("email").isEmail()], runValidation, userController.forgotPassword);
router.post("/verify-otp", [body("email").isEmail(), body("otp").notEmpty()], runValidation, userController.verifyOTP);
router.post("/reset-password", [body("email").isEmail(), body("newPassword").isLength({ min: 6 })], runValidation, userController.resetPassword);

module.exports = router;
