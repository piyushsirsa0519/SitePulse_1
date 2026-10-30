/**
 * Site Pulse — Role-Based Authorization Middleware
 * Enforces role restrictions (e.g. viewer cannot submit daily updates).
 */

function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Authentication required'
                }
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `User role '${req.user.role}' is not authorized to perform this action`
                }
            });
        }

        next();
    };
}

module.exports = {
    requireRoles
};
