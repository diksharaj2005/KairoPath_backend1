import jwt from "jsonwebtoken";

/**
 * Role-based authorization middleware
 * Use this after authMiddleware to check user roles
 * 
 * Usage:
 * router.get('/admin', authMiddleware, requireRole('admin'), handler)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "You don't have permission to access this resource"
        });
      }

      next();
    } catch (err) {
      console.error("Role Authorization Error:", err.message);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  };
};

/**
 * Optional role check - doesn't block access but adds role info to request
 */
export const attachRole = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.userRole = decoded.role || 'user';
    } else {
      req.userRole = 'guest';
    }
    
    next();
  } catch (err) {
    req.userRole = 'guest';
    next();
  }
};
