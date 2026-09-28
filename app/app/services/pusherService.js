import { pusher } from "../config/pusher.js";
import ChatMessage from "../models/ChatMessage.js";
import Conversation from "../models/Conversation.js";
import Issue from "../models/Issue.js";

/**
 * Send a message through Pusher
 */
export const sendMessage = async ({
  senderId,
  senderRole,
  senderName,
  recipientId,
  conversationId,
  issueId,
  message,
}) => {
  try {
    console.log("\n=== PUSHER MESSAGE SEND ===");
    console.log(`📤 From: ${senderName} (${senderId})`);
    console.log(`📝 Message: "${message.substring(0, 50)}..."`);
    console.log(`🔑 ConversationId: ${conversationId || "none"}`);
    console.log(`👤 RecipientId: ${recipientId || "none"}`);
    console.log(`📋 IssueId: ${issueId || "none"}`);

    let conversation;

    // Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      console.log("✅ Found existing conversation:", conversationId);
    } else if (recipientId && issueId) {
      // Check if conversation exists for this specific issue
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, recipientId], $size: 2 },
        issueId: issueId,
      });

      if (!conversation) {
        // Create new conversation for this issue
        conversation = new Conversation({
          participants: [senderId, recipientId],
          issueId: issueId,
          lastMessage: message,
          lastMessageAt: new Date(),
        });
        await conversation.save();
        console.log(
          "✅ Created new conversation:",
          conversation._id,
          "for issue:",
          issueId,
        );

        // Update issue with conversationId
        await Issue.findByIdAndUpdate(issueId, {
          conversationId: conversation._id,
        });

        // Notify both participants about new conversation
        const channelName = `private-issue-${issueId}`;
        await pusher.trigger(channelName, "conversation:created", {
          issueId: issueId,
          conversationId: conversation._id,
        });
        console.log(`📢 Notified participants about new conversation`);
      } else {
        console.log("✅ Using existing conversation:", conversation._id);
      }

      conversationId = conversation._id;
    } else {
      throw new Error("Cannot create conversation without recipient");
    }

    if (!conversation) {
      throw new Error("Could not create conversation");
    }

    // Save message to database
    const chatMessage = new ChatMessage({
      conversationId: conversation._id,
      sender: senderId,
      senderRole: senderRole,
      message,
    });

    await chatMessage.save();
    await chatMessage.populate("sender", "firstName lastName role");
    console.log("✅ Message saved:", chatMessage._id);

    // Update conversation
    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Trigger message event on Pusher channel
    const channelName = `private-issue-${issueId}`;
    await pusher.trigger(channelName, "message:new", {
      conversationId: conversation._id,
      message: chatMessage,
    });

    console.log(`📨 Message sent to Pusher channel: ${channelName}`);

    // Also send to personal notification channels for unread indicators
    conversation.participants.forEach(async (participantId) => {
      const participantIdStr = String(participantId);
      // Don't send notification to sender
      if (participantIdStr !== String(senderId)) {
        await pusher.trigger(`user-${participantIdStr}`, "message:new", {
          conversationId: conversation._id,
          issueId: issueId, // Include issueId for matching
          message: chatMessage,
        });
        console.log(
          `🔔 Notification sent to user-${participantIdStr} for issue ${issueId}`,
        );
      }
    });

    console.log("=== PUSHER MESSAGE SEND COMPLETE ===\n");

    return {
      success: true,
      conversationId: conversation._id,
      message: chatMessage,
    };
  } catch (error) {
    console.error("❌ Pusher message send error:", error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId) => {
  try {
    const messages = await ChatMessage.find({ conversationId })
      .populate("sender", "firstName lastName role")
      .sort({ createdAt: 1 })
      .lean();

    return messages;
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
};

/**
 * Find conversation between two users for a specific issue
 */
export const findConversation = async (userId, recipientId, issueId) => {
  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
      issueId: issueId,
    });

    return conversation;
  } catch (error) {
    console.error("❌ Error finding conversation:", error);
    throw error;
  }
};

/**
 * Authenticate Pusher private channel
 */
export const authenticateChannel = (socketId, channelName, userId) => {
  try {
    console.log(
      `🔐 Authenticating channel: ${channelName} for user: ${userId}`,
    );

    // For private channels, use authenticate (not authorizeChannel)
    const auth = pusher.authenticate(socketId, channelName);

    console.log("✅ Channel authenticated successfully");
    return auth;
  } catch (error) {
    console.error("❌ Channel authentication error:", error);
    throw error;
  }
};
