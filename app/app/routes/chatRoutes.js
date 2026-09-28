import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  sendMessage,
  getMessages,
  findConversation,
  authenticateChannel,
} from "../services/pusherService.js";

const router = express.Router();

/**
 * Send a message
 */
router.post("/messages/send", verifyToken, async (req, res) => {
  try {
    const { conversationId, message, recipientId, issueId } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Get user details from token
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);

    const result = await sendMessage({
      senderId: userId,
      senderRole: user.role,
      senderName: `${user.firstName} ${user.lastName}`,
      recipientId,
      conversationId,
      issueId,
      message,
    });

    res.json({
      success: true,
      conversationId: result.conversationId,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Send message error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send message",
    });
  }
});

/**
 * Get messages for a conversation
 */
router.get("/messages/:conversationId", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await getMessages(conversationId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("❌ Get messages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
});

/**
 * Find conversation for an issue
 */
router.get("/conversation/find", verifyToken, async (req, res) => {
  try {
    const { recipientId, issueId } = req.query;
    const userId = req.user.userId;

    if (!recipientId || !issueId) {
      return res.status(400).json({
        success: false,
        error: "recipientId and issueId are required",
      });
    }

    const conversation = await findConversation(userId, recipientId, issueId);

    if (conversation) {
      res.json({
        success: true,
        found: true,
        conversationId: conversation._id,
      });
    } else {
      res.json({
        success: true,
        found: false,
      });
    }
  } catch (error) {
    console.error("❌ Find conversation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find conversation",
    });
  }
});

/**
 * Pusher authentication endpoint for private channels
 */
router.post("/pusher/auth", async (req, res) => {
  try {
    console.log("\n=== PUSHER AUTH REQUEST (NO MIDDLEWARE) ===");
    console.log("Headers:", req.headers.authorization);
    console.log("Body:", req.body);

    // Manually verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error("❌ No authorization header");
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    console.log("Token:", token ? "Present" : "Missing");

    // Import jwt
    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const { socket_id, channel_name } = req.body;
    const userId = decoded.userId;

    console.log("🔐 Pusher auth request:", {
      socket_id,
      channel_name,
      userId,
    });

    if (!socket_id || !channel_name) {
      console.error("❌ Missing socket_id or channel_name");
      return res.status(400).json({
        error: "socket_id and channel_name are required",
      });
    }

    const auth = authenticateChannel(socket_id, channel_name, userId);

    console.log("✅ Pusher auth successful");
    console.log("Auth response:", auth);
    console.log("=== PUSHER AUTH COMPLETE ===\n");

    // Send auth response directly (Pusher expects specific format)
    res.send(auth);
  } catch (error) {
    console.error("❌ Pusher auth error:", error.message);
    console.error("Error stack:", error.stack);
    res.status(403).json({
      error: "Authentication failed: " + error.message,
    });
  }
});

// Test endpoint to verify routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Chat routes are working!", timestamp: new Date() });
});

export default router;
