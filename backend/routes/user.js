const express = require("express");
const router = express.Router();
const { checkRole } = require("../middlewares/checkRole");
const { userAuth } = require("../middlewares/userAuth");
const { loginLimiter, registerLimiter, otpLimiter, otpResendLimiter } = require("../middlewares/rateLimits");

const { userController } = require("../controller/user")
router.get("/", userAuth, checkRole("admin"), userController.getUsers)

router.get("/session", userAuth, userController.session);
router.post("/logout", userController.logout);

router.post("/register", registerLimiter, userController.userRegistration);
router.post("/verify-registration-otp", otpLimiter, userController.verifyRegistrationOTP);
router.post("/resend-registration-otp", otpResendLimiter, userController.resendRegistrationOTP);

router.post("/login", loginLimiter, userController.login)

router.post("/google-login", loginLimiter, userController.googleLogin);

router.get("/profile", userAuth, checkRole("user"), userController.profile);
router.put("/profile", userAuth, checkRole("user"), userController.updateProfile);
router.get("/addresses", userAuth, checkRole("user"), userController.getAddresses);
router.post("/addresses", userAuth, checkRole("user"), userController.createAddress);
router.put("/addresses/:id", userAuth, checkRole("user"), userController.updateAddress);
router.patch("/addresses/:id/default", userAuth, checkRole("user"), userController.setDefaultAddress);
router.delete("/addresses/:id", userAuth, checkRole("user"), userController.deleteAddress);

router.post("/contact", userController.addContact)

router.post("/forgot-password", otpResendLimiter, userController.forgotPassword);
router.post("/verify-otp", otpLimiter, userController.verifyOTP);
router.post("/reset-password", otpLimiter, userController.resetPassword);




module.exports = router;
