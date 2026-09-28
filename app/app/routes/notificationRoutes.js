import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification routes require authentication
router.get("/", verifyToken, getUserNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.put("/:notificationId/read", verifyToken, markAsRead);
router.put("/mark-all-read", verifyToken, markAllAsRead);
router.delete("/:notificationId", verifyToken, deleteNotification);

export default router;
