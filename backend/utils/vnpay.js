const crypto = require("crypto");
require("./loadEnv");
const VNPAY_DEBUG = String(process.env.VNPAY_DEBUG || "").toLowerCase() === "true";

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function buildSearchParams(obj) {
  const params = new URLSearchParams();
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }

  return params;
}

/**
 * Sanitize orderInfo: only alphanumeric + space + basic punctuation.
 * VNPAY rejects special characters in vnp_OrderInfo.
 */
function sanitizeOrderInfo(str) {
  return String(str)
    .replace(/[^a-zA-Z0-9\s\-_.]/g, "")
    .trim()
    .substring(0, 255);
}

function createVnpayPaymentUrl({
  amount,
  txnRef,
  orderInfo,
  returnUrl,
  ipnUrl,
  tmnCode,
  secretKey,
  vnpUrl,
  locale = "vn",
  currCode = "VND",
  clientIp = "127.0.0.1",
}) {
  let IPv4 = String(clientIp || "127.0.0.1").trim();
  if (IPv4 === "::1" || IPv4.includes("::ffff:")) {
    IPv4 = "127.0.0.1";
  }

  const createDate = formatDate(new Date());
  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: String(tmnCode),
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: String(txnRef),
    vnp_OrderInfo: sanitizeOrderInfo(orderInfo),
    vnp_OrderType: "other",
    vnp_Amount: String(Math.round(amount * 100)),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: IPv4,
    vnp_CreateDate: createDate,
  };

  const signData = buildSearchParams(vnpParams).toString();

  const secureHash = crypto
    .createHmac("sha512", String(secretKey).trim())
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (VNPAY_DEBUG) {
    console.log("[VNPAY DEBUG] createVnpayPaymentUrl signData:", signData);
    console.log("[VNPAY DEBUG] createVnpayPaymentUrl secureHash:", secureHash);
    if (ipnUrl) {
      console.log("[VNPAY DEBUG] createVnpayPaymentUrl ipnUrl is configured separately:", ipnUrl);
    }
  }

  return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
}

function verifyVnpaySignature(params, secretKey) {
  const secureHash = params.vnp_SecureHash;
  const input = { ...params };
  delete input.vnp_SecureHash;
  delete input.vnp_SecureHashType;

  const signData = buildSearchParams(input).toString();

  const computed = crypto
    .createHmac("sha512", String(secretKey).trim())
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (VNPAY_DEBUG) {
    console.log("[VNPAY DEBUG] verifyVnpaySignature received:", secureHash);
    console.log("[VNPAY DEBUG] verifyVnpaySignature computed:", computed);
    console.log("[VNPAY DEBUG] verifyVnpaySignature signData:", signData);
  }

  return {
    isValid: typeof secureHash === "string" && secureHash.toLowerCase() === String(computed).toLowerCase(),
    computed,
  };
}

module.exports = {
  createVnpayPaymentUrl,
  verifyVnpaySignature,
};
