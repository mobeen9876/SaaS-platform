import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
  getUserStats,
  updateUserPlan,
  requestTechnicianRole,
  cancelTechnicianRequest,
} from "../controllers/userController.js";

const router = express.Router();

// All user routes require authentication
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.put("/change-password", verifyToken, changeUserPassword);
router.delete("/delete-account", verifyToken, deleteUserAccount);
router.get("/stats", verifyToken, getUserStats);
router.put("/update-plan", verifyToken, updateUserPlan);
router.post("/request-technician", verifyToken, requestTechnicianRole);
router.delete("/request-technician", verifyToken, cancelTechnicianRequest);

export default router;
