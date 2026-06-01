const crypto = require("crypto");

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
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function buildQueryString(params) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
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
    vnp_IpnUrl: ipnUrl,
    vnp_IpAddr: clientIp,
    vnp_CreateDate: createDate,
  };

  const sorted = sortObject(vnpParams);
  const signData = buildQueryString(sorted);
  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const signedParams = {
    ...sorted,
    vnp_SecureHash: secureHash,
  };

  return `${vnpUrl}?${buildQueryString(signedParams)}`;
}

function verifyVnpaySignature(params, secretKey) {
  const secureHash = params.vnp_SecureHash;
  const input = { ...params };
  delete input.vnp_SecureHash;
  delete input.vnp_SecureHashType;

  const sorted = sortObject(input);
  const signData = buildQueryString(sorted);
  const computed = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return {
    isValid: secureHash === computed,
    computed,
  };
}

module.exports = {
  createVnpayPaymentUrl,
  verifyVnpaySignature,
};