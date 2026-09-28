import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import {
  verifyAndSaveApiKey,
  checkAIToolsStatus,
  deleteApiKey,
  submitIssue,
  getUserIssues,
  getTechnicianIssues,
  getTechnicianIssuesCount,
  getAllIssues,
  getIssueStatistics,
  updateIssueStatus,
  getAllTechnicians,
  addTechnician,
  removeTechnician,
  deleteIssue,
  deleteAllIssues,
  generatePerformanceReport,
  getMyTechnicianProfile,
} from "../controllers/aiToolsController.js";

const router = express.Router();

// AI API Key Management
router.post("/verify-api-key", verifyToken, verifyAndSaveApiKey);
router.delete("/delete-api-key", verifyToken, deleteApiKey);
router.get("/status", verifyToken, checkAIToolsStatus);

// Issue Management (User)
router.post("/issues", verifyToken, submitIssue);
router.get("/issues/my-issues", verifyToken, getUserIssues);

// Technician Routes
router.get("/issues/my-assigned", verifyToken, getTechnicianIssues);
router.get("/issues/my-assigned/count", verifyToken, getTechnicianIssuesCount);

// Issue Management (Admin)
router.get("/issues/all", verifyToken, isAdmin, getAllIssues);
router.get("/issues/statistics", verifyToken, isAdmin, getIssueStatistics);
router.put("/issues/:issueId/status", verifyToken, updateIssueStatus);
router.delete("/issues/delete/all", verifyToken, isAdmin, deleteAllIssues);
router.delete("/issues/:issueId", verifyToken, isAdmin, deleteIssue);

// Technician Management (Admin)
router.get("/technicians", verifyToken, isAdmin, getAllTechnicians);
router.post("/technicians", verifyToken, isAdmin, addTechnician);
router.delete("/technicians/:userId", verifyToken, isAdmin, removeTechnician);

// Performance Report (Admin or self-technician)
router.get("/technicians/my-profile", verifyToken, getMyTechnicianProfile);
router.get(
  "/technicians/:technicianId/report",
  verifyToken,
  generatePerformanceReport,
);

export default router;
