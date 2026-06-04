const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit login attempts
  message: { error: true, message: "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit OTP requests
  message: { error: true, message: "Quá nhiều yêu cầu OTP, vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: true, message: "Quá nhiều lần đăng ký, vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: "Quá nhiều yêu cầu phiếu mượn, vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  otpLimiter,
  registerLimiter,
  ticketLimiter,
};
