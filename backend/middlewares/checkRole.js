const checkRole = (allowedRoles) => {
    // allow passing a single role string or an array of roles
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        if (!req.userInfo || !allowed.includes(req.userInfo.role)) {
            return res.status(403).json({ error: true, message: "Access Denied: Unauthorized role" });
        }
        next();
    };
};

module.exports = { checkRole };