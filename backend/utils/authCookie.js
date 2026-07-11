require("./loadEnv");

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "authToken";

function getAuthCookieOptions() {
  const sameSite = (process.env.AUTH_COOKIE_SAMESITE || (process.env.NODE_ENV === "production" ? "none" : "lax")).toLowerCase();
  const secure = String(process.env.AUTH_COOKIE_SECURE || "").toLowerCase() === "true" || process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 24 * 60 * 60 * 1000),
  };
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
  const options = getAuthCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return cookies;
      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

function getAuthTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.split(" ")[1];
    if (bearerToken && !["null", "undefined", "__cookie__"].includes(bearerToken)) {
      return bearerToken;
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || null;
}

module.exports = {
  AUTH_COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
  getAuthTokenFromRequest,
};
