import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  updateUserPlan,
  toggleUserStatus,
  deleteUser,
  getUserDetails,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  updateRegistrationStatus,
  getTechnicianRequests,
  approveTechnicianRequest,
  rejectTechnicianRequest,
} from "../controllers/adminController.js";
import {
  adminResetUserPassword,
  adminRequestPasswordReset,
  adminResetPasswordWithOTP,
} from "../controllers/authController.js";
import {
  getSystemStats,
  getSystemLogs,
  getRevenueStats,
} from "../controllers/adminSystemController.js";
import User from "../models/User.js";

const router = express.Router();

// All admin routes are protected and require admin role

// User management routes
router.get("/stats", verifyToken, isAdmin, getAdminStats);
router.get("/users", verifyToken, isAdmin, getAllUsers);
router.get("/users/:userId", verifyToken, isAdmin, getUserDetails);
router.put("/users/:userId/role", verifyToken, isAdmin, updateUserRole);
router.put("/users/:userId/plan", verifyToken, isAdmin, updateUserPlan);
router.put(
  "/users/:userId/registration-status",
  verifyToken,
  isAdmin,
  updateRegistrationStatus,
);
router.put(
  "/users/:userId/toggle-status",
  verifyToken,
  isAdmin,
  toggleUserStatus,
);
router.delete("/users/:userId", verifyToken, isAdmin, deleteUser);

// Registration management routes
router.get(
  "/pending-registrations",
  verifyToken,
  isAdmin,
  getPendingRegistrations,
);
router.put(
  "/registrations/:userId/approve",
  verifyToken,
  isAdmin,
  approveRegistration,
);
router.put(
  "/registrations/:userId/reject",
  verifyToken,
  isAdmin,
  rejectRegistration,
);

// Technician request management routes
router.get("/technician-requests", verifyToken, isAdmin, getTechnicianRequests);
router.put(
  "/technician-requests/:userId/approve",
  verifyToken,
  isAdmin,
  approveTechnicianRequest,
);
router.put(
  "/technician-requests/:userId/reject",
  verifyToken,
  isAdmin,
  rejectTechnicianRequest,
);

// Password management routes
router.post(
  "/reset-user-password",
  verifyToken,
  isAdmin,
  adminResetUserPassword,
);

// Admin OTP-based password reset (for admin's own password)
router.post("/request-password-reset", adminRequestPasswordReset);
router.post("/reset-password-with-otp", adminResetPasswordWithOTP);

// NEW: System monitoring routes
router.get("/system-stats", verifyToken, isAdmin, getSystemStats);
router.get("/system-logs", verifyToken, isAdmin, getSystemLogs);
router.get("/revenue-stats", verifyToken, isAdmin, getRevenueStats);

// Migration route
router.post(
  "/migrate-hasSelectedPlan",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const result = await User.updateMany(
        { hasSelectedPlan: { $exists: false } },
        { $set: { hasSelectedPlan: false } },
      );
      res.json({
        success: true,
        modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      });
    } catch (error) {
      console.error("❌ Migration error:", error);
      res.status(500).json({ success: false, error: "Migration failed" });
    }
  },
);

export default router;
