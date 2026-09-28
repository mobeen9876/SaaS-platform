import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. Invalid token format.",
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);

    // Ensure the user still exists and is active
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(verified.userId).select("isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated by an admin.",
      });
    }

    req.user = verified;
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    res.status(401).json({
      success: false,
      error: "Invalid or expired token.",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const requireAdmin = isAdmin; // Alias for consistency
