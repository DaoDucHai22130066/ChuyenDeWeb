const checkRole = (allowedRoles) => {
    // allow passing a single role string or an array of roles
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        if (!req.userInfo || !allowed.includes(req.userInfo.role)) {
<<<<<<< HEAD
            return res.status(403).json({ error: true, message: "Từ chối truy cập: vai trò không hợp lệ" });
=======
            return res.status(403).json({ error: true, message: "Access Denied: Unauthorized role" });
>>>>>>> hai
        }
        next();
    };
};

module.exports = { checkRole };