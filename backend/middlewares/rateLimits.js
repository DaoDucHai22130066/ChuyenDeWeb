const rateLimit = require("express-rate-limit");

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { error: true, message },
  });
}

const loginLimiter = createLimiter({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
  message: "Quá nhiều lần đăng nhập. Vui lòng thử lại sau.",
});

const registerLimiter = createLimiter({
  windowMs: Number(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.REGISTER_RATE_LIMIT_MAX || 5),
  message: "Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.",
});

const otpLimiter = createLimiter({
  windowMs: Number(process.env.OTP_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.OTP_RATE_LIMIT_MAX || 10),
  message: "Quá nhiều yêu cầu OTP. Vui lòng thử lại sau.",
});

const otpResendLimiter = createLimiter({
  windowMs: Number(process.env.OTP_RESEND_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.OTP_RESEND_RATE_LIMIT_MAX || 3),
  message: "Bạn gửi lại OTP quá nhanh. Vui lòng đợi một chút.",
});

module.exports = {
  loginLimiter,
  registerLimiter,
  otpLimiter,
  otpResendLimiter,
};
