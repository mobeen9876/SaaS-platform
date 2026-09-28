import express from "express";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  deleteAssignment,
  submitAssignment,
  getMySubmission,
  toggleAssignment,
} from "../controllers/assignmentController.js";

const router = express.Router();

// Admin routes
router.post("/", verifyToken, isAdmin, createAssignment);
router.get("/", verifyToken, getAssignments);
router.get("/:assignmentId", verifyToken, isAdmin, getAssignmentById);
router.delete("/:assignmentId", verifyToken, isAdmin, deleteAssignment);
router.patch("/:assignmentId/toggle", verifyToken, isAdmin, toggleAssignment);

// User routes
router.post("/:assignmentId/submit", verifyToken, submitAssignment);
router.get("/:assignmentId/my-submission", verifyToken, getMySubmission);

export default router;
