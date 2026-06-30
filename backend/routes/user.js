const express = require("express");
const router = express.Router();
const { checkRole } = require("../middlewares/checkRole");
const { userAuth } = require("../middlewares/userAuth");

const { userController } = require("../controller/user")
router.get("/", userAuth, checkRole("admin"), userController.getUsers)

router.post("/register", userController.userRegistration);
router.post("/verify-registration-otp", userController.verifyRegistrationOTP);
router.post("/resend-registration-otp", userController.resendRegistrationOTP);

router.post("/login", userController.login)

router.post("/google-login", userController.googleLogin);

router.get("/profile", userAuth, checkRole("user"), userController.profile);
router.put("/profile", userAuth, checkRole("user"), userController.updateProfile);

router.post("/contact", userController.addContact)

router.post("/forgot-password", userController.forgotPassword);
router.post("/verify-otp", userController.verifyOTP);
router.post("/reset-password", userController.resetPassword);




module.exports = router;
