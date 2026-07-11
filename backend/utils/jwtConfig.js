const jwt = require("jsonwebtoken");
require("./loadEnv");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET configuration");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_ISSUER = process.env.JWT_ISSUER || "DFreeBook";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "DFreeBook-Web";

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    subject: String(payload.id),
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  JWT_ISSUER,
  JWT_AUDIENCE,
  JWT_EXPIRES_IN,
};
