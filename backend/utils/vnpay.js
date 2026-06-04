const crypto = require("crypto");
const qs = require("qs");
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

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
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
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(amount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: IPv4,
    vnp_CreateDate: createDate,
  };

  const sorted = sortObject(vnpParams);
  const signData = qs.stringify(sorted, { encode: false });
  const secureHash = crypto
    .createHmac("sha512", String(secretKey).trim())
    .update(signData, "utf-8")
    .digest("hex");

  if (VNPAY_DEBUG) {
    try {
      console.log("[VNPAY DEBUG] createVnpayPaymentUrl signData:", signData);
      console.log("[VNPAY DEBUG] createVnpayPaymentUrl secureHash:", secureHash);
    } catch (e) {}
  }

  const signedParams = {
    ...sorted,
    vnp_SecureHash: secureHash,
  };

  return `${vnpUrl}?${qs.stringify(signedParams, { encode: false })}`;
}

function verifyVnpaySignature(params, secretKey) {
  const secureHash = params.vnp_SecureHash;
  const input = { ...params };
  delete input.vnp_SecureHash;
  delete input.vnp_SecureHashType;

  const sorted = sortObject(input);
  const signData = qs.stringify(sorted, { encode: false });
  const computed = crypto
    .createHmac("sha512", String(secretKey).trim())
    .update(signData, "utf-8")
    .digest("hex");

  if (VNPAY_DEBUG) {
    try {
      console.log("[VNPAY DEBUG] verifyVnpaySignature received:", secureHash);
      console.log("[VNPAY DEBUG] verifyVnpaySignature computed:", computed);
      console.log("[VNPAY DEBUG] verifyVnpaySignature signData:", signData);
    } catch (e) {}
  }

  return {
    isValid: secureHash === computed,
    computed,
  };
}

module.exports = {
  createVnpayPaymentUrl,
  verifyVnpaySignature,
};