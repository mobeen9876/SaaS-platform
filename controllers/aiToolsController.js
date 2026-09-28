import User from "../models/User.js";
import Issue from "../models/Issue.js";
import Technician from "../models/Technician.js";
import {
  verifyAIApiKey,
  analyzeIssue,
  findBestTechnician,
  generatePerformanceReport as aiGenerateReport,
} from "../services/aiService.js";
import {
  sendIssueAssignmentEmail,
  sendIssueStatusUpdateEmail,
} from "../utils/emailService.js";
import { createNotification } from "./notificationController.js";
import { pusher } from "../config/pusher.js";

/**
 * Verify and save AI API key for user
 */
export const verifyAndSaveApiKey = async (req, res) => {
  try {
    const { apiKey, provider } = req.body;
    const userId = req.user.userId;

    console.log(
      `🔑 Verifying API key for user: ${userId}, provider: ${provider}`,
    );

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "API key is required",
      });
    }

    if (!provider || !["openai", "gemini", "groq"].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: "Valid provider is required (openai, gemini, or groq)",
      });
    }

    console.log(
      `🔑 Verifying ${provider.toUpperCase()} API key for user:`,
      userId,
    );

    // Verify the API key with the specified provider
    const verification = await verifyAIApiKey(apiKey, provider);

    if (!verification.valid) {
      console.error(`❌ API key verification failed: ${verification.error}`);
      return res.status(400).json({
        success: false,
        error: verification.error || "Invalid API key",
      });
    }

    // Save the API key and provider to user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    user.aiApiKey = apiKey;
    user.aiProvider = provider;
    user.aiApiKeyVerified = true;
    user.aiToolsEnabled = true;
    await user.save();

    console.log(
      `✅ ${provider.toUpperCase()} API key verified and saved for user:`,
      user.email,
    );

    res.json({
      success: true,
      message: "AI API key verified and saved successfully",
      aiToolsEnabled: true,
      provider: provider,
    });
  } catch (error) {
    console.error("❌ Error in verifyAndSaveApiKey:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to verify API key: " + error.message,
    });
  }
};

/**
 * Check if user has AI tools enabled
 */
export const checkAIToolsStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "aiToolsEnabled aiApiKeyVerified aiProvider role",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Admin uses Groq from .env, doesn't need to add key
    const isAdmin = user.role === "admin";
    const adminGroqKey = process.env.GROQ_API_KEY;

    res.json({
      success: true,
      aiToolsEnabled: isAdmin ? !!adminGroqKey : user.aiToolsEnabled || false,
      aiApiKeyVerified: isAdmin
        ? !!adminGroqKey
        : user.aiApiKeyVerified || false,
      provider: isAdmin ? "groq" : user.aiProvider || null,
      isAdmin: isAdmin,
      needsApiKey: !isAdmin && !user.aiApiKeyVerified,
    });
  } catch (error) {
    console.error("❌ Error checking AI tools status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check AI tools status",
    });
  }
};

/**
 * Delete user's AI API key
 */
export const deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Clear AI API key and related fields
    user.aiApiKey = null;
    user.aiProvider = null;
    user.aiApiKeyVerified = false;
    user.aiToolsEnabled = false;
    await user.save();

    console.log(`🗑️ API key deleted for user: ${user.email}`);

    res.json({
      success: true,
      message: "AI API key deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting AI API key:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete API key",
    });
  }
};

/**
 * Submit a new issue (User)
 */
export const submitIssue = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.userId;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Title and description are required",
      });
    }

    console.log("📝 New issue submitted by user:", userId);

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Determine AI provider and API key
    let apiKey;
    let provider;

    if (user.role === "admin") {
      // Admin uses Groq from .env (FREE & FAST)
      apiKey = process.env.GROQ_API_KEY;
      provider = "groq";
      console.log("🔑 Using admin Groq API key");
    } else {
      // Regular user uses their own key
      apiKey = user.aiApiKey;
      provider = user.aiProvider || "openai";
      console.log(`🔑 Using user's ${provider.toUpperCase()} API key`);
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error:
          user.role === "admin"
            ? "Admin Groq API key not configured in .env file"
            : "AI API key not configured. Please add your API key first.",
      });
    }

    // Step 1: Analyze issue with AI
    console.log(`🤖 Analyzing issue with ${provider.toUpperCase()} AI...`);
    let analysis;
    try {
      analysis = await analyzeIssue(title, description, apiKey, provider);
      console.log("📊 AI Analysis:", analysis);
    } catch (aiError) {
      console.error("❌ AI Analysis failed:", aiError);

      // Check if it's a rate limit or API key issue
      const errorMessage = aiError.message || "";
      if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("429")
      ) {
        return res.status(429).json({
          success: false,
          error:
            "AI API rate limit reached. Your API key has exceeded its quota.",
          reason:
            "The AI service returned a rate limit error. This usually means you've used up your free tier or monthly quota. Please check your API provider dashboard or wait until your quota resets.",
          errorType: "RATE_LIMIT",
          provider: provider.toUpperCase(),
        });
      }

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("expired")
      ) {
        return res.status(401).json({
          success: false,
          error: "AI API key is invalid or expired.",
          reason:
            "The API key you provided is not valid or has expired. Please verify your API key in your provider's dashboard and update it in the settings.",
          errorType: "INVALID_KEY",
          provider: provider.toUpperCase(),
        });
      }

      if (errorMessage.includes("parse") || errorMessage.includes("JSON")) {
        return res.status(500).json({
          success: false,
          error: "AI returned an invalid response.",
          reason:
            "The AI service responded but the format was incorrect. This is usually a temporary issue. Please try again.",
          errorType: "PARSE_ERROR",
          provider: provider.toUpperCase(),
        });
      }

      // For other errors, return generic message with details
      return res.status(500).json({
        success: false,
        error: "AI analysis failed.",
        reason: `The AI service encountered an error: ${errorMessage}. Please try again or contact support if the issue persists.`,
        errorType: "AI_ERROR",
        provider: provider.toUpperCase(),
      });
    }

    // Step 2: Get available technicians
    const technicians = await Technician.find({ isAvailable: true });

    // Step 3: Find best technician
    let assignedTo = null;
    let assignmentReason = "No technicians available";

    if (technicians.length > 0) {
      console.log("👷 Finding best technician...");
      try {
        const assignment = await findBestTechnician(
          technicians,
          analysis.issueType,
          analysis.priority,
          apiKey,
          provider,
        );

        if (assignment.technicianId) {
          assignedTo = assignment.technicianId;
          assignmentReason = assignment.reason;

          // Update technician workload
          await Technician.findOneAndUpdate(
            { userId: assignedTo },
            { $inc: { currentIssuesCount: 1 } },
          );

          console.log("✅ Issue assigned to technician:", assignedTo);
        }
      } catch (assignError) {
        console.error("⚠️ Technician assignment failed:", assignError);
        // Continue without assignment - issue will be pending
        assignmentReason =
          "Auto-assignment unavailable - will be manually assigned";
      }
    }

    // Get assigned technician details
    let assignedToName = null;
    let assignedToEmail = null;
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (assignedUser) {
        assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
        assignedToEmail = assignedUser.email;
      }
    }

    // Step 4: Create issue
    const issue = new Issue({
      title,
      description,
      submittedBy: userId,
      submittedByName: `${user.firstName} ${user.lastName}`,
      submittedByEmail: user.email,
      issueType: analysis.issueType,
      priority: analysis.priority,
      aiAnalysis: analysis.analysis,
      assignedTo: assignedTo,
      assignedToName: assignedToName,
      assignedToEmail: assignedToEmail,
      assignedAt: assignedTo ? new Date() : null,
      assignmentReason: assignmentReason,
      status: assignedTo ? "assigned" : "pending",
    });

    await issue.save();

    console.log("✅ Issue created successfully:", issue._id);

    // Step 5: Send email notification to technician if assigned
    if (assignedTo && assignedToEmail) {
      console.log("📧 Sending assignment notification to technician...");
      try {
        await sendIssueAssignmentEmail(assignedToEmail, assignedToName, {
          title: issue.title,
          description: issue.description,
          issueType: issue.issueType,
          priority: issue.priority,
          aiAnalysis: issue.aiAnalysis,
          submittedByName: issue.submittedByName,
          submittedByEmail: issue.submittedByEmail,
          createdAt: issue.createdAt,
          assignmentReason: issue.assignmentReason,
        });
        console.log("✅ Assignment notification sent successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send assignment email:", emailError);
        // Don't fail the request if email fails
      }

      // Push real-time notification to the technician's personal channel
      // so their TechnicianIssues page updates instantly without a refresh.
      try {
        await pusher.trigger(`user-${assignedTo}`, "issue:assigned", {
          issue: {
            _id: issue._id,
            title: issue.title,
            description: issue.description,
            issueType: issue.issueType,
            priority: issue.priority,
            status: issue.status,
            submittedByName: issue.submittedByName,
            submittedByEmail: issue.submittedByEmail,
            assignedToName: issue.assignedToName,
            createdAt: issue.createdAt,
            assignedAt: issue.assignedAt,
            aiAnalysis: issue.aiAnalysis,
            conversationId: issue.conversationId || null,
          },
        });
        console.log(
          `🔔 Real-time assignment notification sent to technician: ${assignedTo}`,
        );
      } catch (pusherErr) {
        // Non-fatal — technician will still see it on next poll/refresh
        console.warn(
          "⚠️ Pusher assignment notification failed:",
          pusherErr.message,
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Issue submitted successfully",
      issue: {
        id: issue._id,
        title: issue.title,
        description: issue.description,
        issueType: issue.issueType,
        priority: issue.priority,
        status: issue.status,
        assignedTo: assignedToName,
        assignmentReason: assignmentReason,
        aiAnalysis: analysis.analysis,
      },
    });
  } catch (error) {
    console.error("❌ Error submitting issue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit issue",
    });
  }
};

/**
 * Get user's issues
 */
export const getUserIssues = async (req, res) => {
  try {
    const userId = req.user.userId;

    const issues = await Issue.find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .select(
        "title description issueType priority status submittedBy submittedByName assignedTo assignedToName createdAt resolvedAt conversationId",
      );

    res.json({
      success: true,
      issues,
      count: issues.length,
    });
  } catch (error) {
    console.error("❌ Error fetching user issues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch issues",
    });
  }
};

/**
 * Get technician's assigned issues
 */
export const getTechnicianIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // Build filter
    const filter = { assignedTo: userId };
    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "title description issueType priority status submittedBy submittedByName submittedByEmail assignedTo assignedToName createdAt assignedAt aiAnalysis conversationId",
      );

    res.json({
      success: true,
      issues,
      count: issues.length,
    });
  } catch (error) {
    console.error("❌ Error fetching technician issues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch issues",
    });
  }
};

/**
 * Get count of technician's assigned issues (for notification badge)
 */
export const getTechnicianIssuesCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalCount = await Issue.countDocuments({ assignedTo: userId });
    const pendingCount = await Issue.countDocuments({
      assignedTo: userId,
      status: { $in: ["assigned", "in-progress"] },
    });
    const newCount = await Issue.countDocuments({
      assignedTo: userId,
      status: "assigned",
    });

    res.json({
      success: true,
      total: totalCount,
      pending: pendingCount,
      new: newCount,
    });
  } catch (error) {
    console.error("❌ Error fetching technician issues count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch issues count",
    });
  }
};

/**
 * Get all issues (Admin)
 */
export const getAllIssues = async (req, res) => {
  try {
    const { status, priority, issueType } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (issueType) filter.issueType = issueType;

    const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean(); // Use lean() for better performance

    // Manually populate user data to ensure it's always present
    const issuesWithUserData = issues.map((issue) => ({
      ...issue,
      submittedByName: issue.submittedByName || "Unknown User",
      submittedByEmail: issue.submittedByEmail || "N/A",
      assignedToName: issue.assignedToName || null,
      assignedToEmail: issue.assignedToEmail || null,
    }));

    console.log(`📊 Fetched ${issuesWithUserData.length} issues for admin`);

    res.json({
      success: true,
      issues: issuesWithUserData,
      count: issuesWithUserData.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all issues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch issues",
    });
  }
};

/**
 * Get issue statistics (Admin)
 */
export const getIssueStatistics = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: "pending" });
    const assignedIssues = await Issue.countDocuments({ status: "assigned" });
    const inProgressIssues = await Issue.countDocuments({
      status: "in-progress",
    });
    const resolvedIssues = await Issue.countDocuments({ status: "resolved" });

    // Count by priority
    const smallPriority = await Issue.countDocuments({ priority: "small" });
    const mediumPriority = await Issue.countDocuments({ priority: "medium" });
    const largePriority = await Issue.countDocuments({ priority: "large" });

    // Count by type
    const issuesByType = await Issue.aggregate([
      {
        $group: {
          _id: "$issueType",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      statistics: {
        total: totalIssues,
        byStatus: {
          pending: pendingIssues,
          assigned: assignedIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
        },
        byPriority: {
          small: smallPriority,
          medium: mediumPriority,
          large: largePriority,
        },
        byType: issuesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching issue statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};

/**
 * Update issue status
 */
export const updateIssueStatus = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, resolutionNotes } = req.body;
    const userId = req.user.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        error: "Issue not found",
      });
    }

    const oldStatus = issue.status;

    // Update status
    issue.status = status;
    issue.updatedAt = new Date();

    // If resolved, add resolution details
    if (status === "resolved" || status === "closed") {
      issue.resolvedAt = new Date();
      issue.resolvedBy = userId;
      if (resolutionNotes) {
        issue.resolutionNotes = resolutionNotes;
      }

      // Update technician workload
      if (issue.assignedTo) {
        await Technician.findOneAndUpdate(
          { userId: issue.assignedTo },
          {
            $inc: {
              currentIssuesCount: -1,
              totalIssuesResolved: 1,
            },
          },
        );
      }
    }

    await issue.save();

    console.log("✅ Issue status updated:", issueId, "->", status);

    // Send email notification to user about status change
    if (issue.submittedByEmail && oldStatus !== status) {
      console.log("📧 Sending status update notification to user...");
      try {
        await sendIssueStatusUpdateEmail(
          issue.submittedByEmail,
          issue.submittedByName,
          {
            title: issue.title,
            assignedToName: issue.assignedToName,
            resolutionNotes: issue.resolutionNotes,
          },
          oldStatus,
          status,
        );
        console.log("✅ Status update notification sent successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send status update email:", emailError);
        // Don't fail the request if email fails
      }

      // Create in-app notification
      try {
        const notificationMessages = {
          assigned: `Your issue "${issue.title}" has been assigned to ${issue.assignedToName}`,
          "in-progress": `Work has started on your issue "${issue.title}"`,
          resolved: `Your issue "${issue.title}" has been resolved! ${issue.resolutionNotes ? `Resolution: ${issue.resolutionNotes}` : ""}`,
          closed: `Your issue "${issue.title}" has been closed`,
        };

        const notificationTitles = {
          assigned: "Issue Assigned",
          "in-progress": "Work In Progress",
          resolved: "Issue Resolved ✅",
          closed: "Issue Closed",
        };

        await createNotification(
          issue.submittedBy,
          status === "resolved" ? "issue_resolved" : "issue_status_update",
          notificationTitles[status] || "Issue Updated",
          notificationMessages[status] ||
            `Your issue status changed to ${status}`,
          issueId,
        );
        console.log("🔔 In-app notification created");
      } catch (notifError) {
        console.error("⚠️ Failed to create notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      success: true,
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    console.error("❌ Error updating issue status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update issue status",
    });
  }
};

/**
 * Get all technicians (Admin)
 */
export const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find()
      .populate("userId", "firstName lastName email")
      .sort({ currentIssuesCount: 1 });

    res.json({
      success: true,
      technicians,
      count: technicians.length,
    });
  } catch (error) {
    console.error("❌ Error fetching technicians:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch technicians",
    });
  }
};

/**
 * Add a new technician (Admin)
 */
export const addTechnician = async (req, res) => {
  try {
    const { userId, specializations } = req.body;

    if (!userId || !specializations || specializations.length === 0) {
      return res.status(400).json({
        success: false,
        error: "User ID and specializations are required",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if technician already exists
    const existingTech = await Technician.findOne({ userId });
    if (existingTech) {
      return res.status(400).json({
        success: false,
        error: "User is already a technician",
      });
    }

    // Create technician
    const technician = new Technician({
      userId,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      specializations,
    });

    await technician.save();

    console.log("✅ Technician added:", technician.name);

    res.status(201).json({
      success: true,
      message: "Technician added successfully",
      technician,
    });
  } catch (error) {
    console.error("❌ Error adding technician:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add technician",
    });
  }
};

/**
 * Remove a technician (Admin)
 */
export const removeTechnician = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Find and delete technician
    const technician = await Technician.findOne({ userId });
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: "Technician not found",
      });
    }

    // Unassign all issues assigned to this technician
    const unassignedIssues = await Issue.updateMany(
      { assignedTo: userId },
      {
        $set: {
          assignedTo: null,
          assignedToName: null,
          assignedToEmail: null,
          status: "pending",
        },
      },
    );

    // Delete technician profile
    await Technician.findOneAndDelete({ userId });

    console.log("✅ Technician removed:", technician.name);
    console.log(`   Unassigned ${unassignedIssues.modifiedCount} issues`);

    res.json({
      success: true,
      message: "Technician removed successfully",
      unassignedIssues: unassignedIssues.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error removing technician:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove technician",
    });
  }
};

/**
 * Delete an issue (Admin)
 */
export const deleteIssue = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        error: "Issue not found",
      });
    }

    // If issue was assigned, decrease technician workload
    if (
      issue.assignedTo &&
      issue.status !== "resolved" &&
      issue.status !== "closed"
    ) {
      await Technician.findOneAndUpdate(
        { userId: issue.assignedTo },
        { $inc: { currentIssuesCount: -1 } },
      );
    }

    await Issue.findByIdAndDelete(issueId);

    console.log("✅ Issue deleted:", issueId);

    res.json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting issue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete issue",
    });
  }
};

/**
 * Delete ALL issues (Admin only - for testing)
 */
export const deleteAllIssues = async (req, res) => {
  try {
    // Delete all issues
    const result = await Issue.deleteMany({});

    // Reset all technician workloads
    await Technician.updateMany({}, { $set: { currentIssuesCount: 0 } });

    console.log(
      `✅ Deleted ${result.deletedCount} issues and reset technician workloads`,
    );

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} issues`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error deleting all issues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete issues",
    });
  }
};

/**
 * Generate AI Performance Report for a technician
 * Admin: can generate for any technician
 * Technician: can generate their own report
 */
export const generatePerformanceReport = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const requestingUser = req.user;

    const technician = await Technician.findById(technicianId).populate(
      "userId",
      "firstName lastName email aiApiKey aiProvider aiToolsEnabled",
    );

    if (!technician) {
      return res
        .status(404)
        .json({ success: false, error: "Technician not found" });
    }

    const isAdminUser = requestingUser.role === "admin";
    const isSelf = technician.userId._id.toString() === requestingUser.userId;

    if (!isAdminUser && !isSelf) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Fetch all issues for this technician
    const allIssues = await Issue.find({
      assignedTo: technician.userId._id,
    }).sort({ createdAt: -1 });
    const resolvedIssues = allIssues.filter(
      (i) => i.status === "resolved" || i.status === "closed",
    );
    const pendingIssues = allIssues.filter(
      (i) => !["resolved", "closed"].includes(i.status),
    );

    // Calculate average resolution time
    const resolutionTimes = resolvedIssues
      .filter((i) => i.resolvedAt && i.assignedAt)
      .map((i) =>
        Math.max(
          0,
          (new Date(i.resolvedAt) - new Date(i.assignedAt)) / (1000 * 60 * 60),
        ),
      );

    const avgResolutionHours =
      resolutionTimes.length > 0
        ? parseFloat(
            (
              resolutionTimes.reduce((a, b) => a + b, 0) /
              resolutionTimes.length
            ).toFixed(1),
          )
        : 0;

    // Issue type & priority breakdown
    const typeBreakdown = {};
    const priorityBreakdown = {};
    allIssues.forEach((i) => {
      typeBreakdown[i.issueType] = (typeBreakdown[i.issueType] || 0) + 1;
      priorityBreakdown[i.priority] = (priorityBreakdown[i.priority] || 0) + 1;
    });

    const recentResolved = resolvedIssues.slice(0, 5).map((i) => ({
      title: i.title,
      type: i.issueType,
      priority: i.priority,
      resolutionTime:
        i.resolvedAt && i.assignedAt
          ? parseFloat(
              (
                (new Date(i.resolvedAt) - new Date(i.assignedAt)) /
                (1000 * 60 * 60)
              ).toFixed(1),
            )
          : null,
    }));

    const stats = {
      name: technician.name,
      email: technician.email,
      specializations: technician.specializations,
      rating: technician.rating,
      totalAssigned: allIssues.length,
      totalResolved: resolvedIssues.length,
      currentPending: pendingIssues.length,
      avgResolutionHours,
      typeBreakdown,
      priorityBreakdown,
      recentResolved,
      memberSince: technician.createdAt,
    };

    // Get API key — admin uses GROQ from .env, technician uses their own saved key
    let apiKey, provider;
    if (isAdminUser) {
      apiKey = process.env.GROQ_API_KEY;
      provider = "groq";
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "Admin AI key not configured. Add GROQ_API_KEY to .env file.",
        });
      }
    } else {
      const techUser = await User.findById(requestingUser.userId);
      if (!techUser?.aiApiKey || !techUser?.aiToolsEnabled) {
        return res.status(400).json({
          success: false,
          error: "Please set up your AI API key in AI Tools settings first",
        });
      }
      apiKey = techUser.aiApiKey;
      provider = techUser.aiProvider || "groq";
    }

    const report = await aiGenerateReport(stats, apiKey, provider);
    return res.json({ success: true, report, stats });
  } catch (error) {
    console.error("❌ Error generating performance report:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate report: " + error.message,
    });
  }
};

/**
 * Get my own technician profile (for technician to find their ID)
 */
export const getMyTechnicianProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, error: "Technician profile not found" });
    }
    return res.json({
      success: true,
      technicianId: technician._id,
      technician,
    });
  } catch (error) {
    console.error("❌ Error fetching technician profile:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch profile" });
  }
};
