import { pusher } from "../config/pusher.js";
import User from "../models/User.js";
import { sendWelcomeEmail, sendRejectionEmail } from "../utils/emailService.js";

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const freeUsers = await User.countDocuments({ plan: "free" });
    const proUsers = await User.countDocuments({ plan: "pro" });
    const enterpriseUsers = await User.countDocuments({ plan: "enterprise" });
    const adminUsers = await User.countDocuments({ plan: "admin" });

    // Get users by payment status
    const activePaymentUsers = await User.countDocuments({
      paymentStatus: "active",
    });
    const inactivePaymentUsers = await User.countDocuments({
      paymentStatus: "inactive",
    });

    // Get user growth (users created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        freeUsers,
        proUsers,
        enterpriseUsers,
        adminUsers,
        recentUsers,
        activePaymentUsers,
        inactivePaymentUsers,
        conversionRate:
          totalUsers > 0
            ? (((totalUsers - freeUsers) / totalUsers) * 100).toFixed(1)
            : 0,
        proConversionRate:
          totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0,
        enterpriseConversionRate:
          totalUsers > 0
            ? ((enterpriseUsers / totalUsers) * 100).toFixed(1)
            : 0,
        growthRate:
          totalUsers - recentUsers > 0
            ? ((recentUsers / (totalUsers - recentUsers)) * 100).toFixed(1)
            : 100,
      },
    });
  } catch (error) {
    console.error("❌ Admin stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin stats",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // Process users to ensure admins show "admin" plan
    const processedUsers = users.map((user) => {
      const userObj = user.toObject();
      // Override plan for admin users
      if (userObj.role === "admin") {
        userObj.plan = "admin";
      }
      return userObj;
    });

    res.json({
      success: true,
      users: processedUsers,
    });
  } catch (error) {
    console.error("❌ Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // If changing from user to admin
    if (user.role === "user" && role === "admin") {
      // Store original plan before changing to admin
      user.originalPlan = user.plan;
      user.plan = "admin"; // Changed to "admin"
      user.paymentStatus = "active"; // Admins should have active status
    }
    // If changing from admin back to user
    else if (user.role === "admin" && role === "user") {
      // Restore original plan (or default to free if not set)
      user.plan = user.originalPlan || "free";
      // Reset payment status based on restored plan
      user.paymentStatus = user.plan === "free" ? "active" : "inactive";
    }

    // Update the role
    user.role = role;
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Update user role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
    });
  }
};

// Update user plan (admin can change user's plan)
export const updateUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    // Don't allow "admin" as a plan through this route
    if (!["free", "pro", "enterprise"].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // If user is admin, don't allow changing plan
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        error: "Cannot change plan for admin users. Change role to user first.",
      });
    }

    // Update plan and adjust payment status
    const previousPlan = user.plan;
    user.plan = plan;

    // Set payment status based on plan
    if (plan === "free") {
      user.paymentStatus = "active";
    } else {
      // If upgrading from free to paid, set to inactive until payment
      if (previousPlan === "free" && plan !== "free") {
        user.paymentStatus = "inactive";
      }
      // Keep existing payment status for other changes
    }

    // Update originalPlan if it exists and user is not admin
    if (user.originalPlan && user.role === "user") {
      user.originalPlan = plan;
    }

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: `User plan updated to ${plan}`,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Update user plan error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user plan",
    });
  }
};

// Toggle user status
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Don't allow deactivating your own account
    if (req.user && req.user.userId === userId) {
      return res.status(400).json({
        success: false,
        error: "You cannot deactivate your own account.",
      });
    }

    // Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("❌ Toggle user status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle user status",
    });
  }
};

// Delete a user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admins from deleting their own account via admin panel
    if (req.user && req.user.userId === userId) {
      return res.status(400).json({
        success: false,
        error: "You cannot delete your own account.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
      userId,
    });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
};

// Update user registration status
export const updateRegistrationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { registrationStatus } = req.body;

    if (!["pending", "approved", "rejected"].includes(registrationStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid registration status",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Don't allow changing admin registration status
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        error: "Cannot change registration status for admin users",
      });
    }

    const previousStatus = user.registrationStatus;
    user.registrationStatus = registrationStatus;

    // Update isActive based on registration status
    if (registrationStatus === "approved") {
      user.isActive = true;
      user.approvedBy = req.user.userId;
      user.approvedAt = new Date();
    } else if (registrationStatus === "rejected") {
      user.isActive = false;
    } else if (registrationStatus === "pending") {
      user.isActive = false;
    }

    await user.save();

    // Send email notification
    try {
      if (registrationStatus === "approved" && previousStatus !== "approved") {
        await sendWelcomeEmail(user.email, user.firstName);
      } else if (
        registrationStatus === "rejected" &&
        previousStatus !== "rejected"
      ) {
        await sendRejectionEmail(
          user.email,
          user.firstName,
          "Registration not approved by administrator",
        );
      }
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    console.log(
      `✅ Registration status updated: ${user.email} -> ${registrationStatus}`,
    );

    res.json({
      success: true,
      message: `Registration status updated to ${registrationStatus}`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationStatus: user.registrationStatus,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("❌ Update registration status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update registration status",
    });
  }
};

// Get user details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Override plan for admin users
    const userResponse = user.toObject();
    if (userResponse.role === "admin") {
      userResponse.plan = "admin";
    }

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Get user details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user details",
    });
  }
};

// Get pending registration requests
export const getPendingRegistrations = async (req, res) => {
  try {
    const pendingUsers = await User.find({ registrationStatus: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pendingUsers,
      count: pendingUsers.length,
    });
  } catch (error) {
    console.error("❌ Get pending registrations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending registrations",
    });
  }
};

// Approve user registration
export const approveRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.registrationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: "User registration is not pending",
      });
    }

    // Approve the user
    user.registrationStatus = "approved";
    user.isActive = true;
    user.approvedBy = adminId;
    user.approvedAt = new Date();

    // Generate API key for approved user
    user.apiKey = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // Notify the approved user in real-time
    try {
      await pusher.trigger(`user-${userId}`, "registration-approved", {
        message: "Your registration has been approved!",
      });
    } catch (pusherErr) {
      console.warn("⚠️ Pusher notification failed:", pusherErr.message);
    }

    res.json({
      success: true,
      message: "User registration approved successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationStatus: user.registrationStatus,
        isActive: user.isActive,
        approvedAt: user.approvedAt,
      },
    });
  } catch (error) {
    console.error("❌ Approve registration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve registration",
    });
  }
};

// Reject user registration
export const rejectRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.registrationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: "User registration is not pending",
      });
    }

    // Reject the user
    user.registrationStatus = "rejected";
    user.rejectionReason = reason || "No reason provided";
    user.approvedBy = adminId;
    user.approvedAt = new Date();

    await user.save();

    // Send rejection email
    try {
      await sendRejectionEmail(user.email, user.firstName, reason);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
      // Don't fail the rejection if email fails
    }

    // TODO: Send rejection email to user here

    res.json({
      success: true,
      message: "User registration rejected",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationStatus: user.registrationStatus,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (error) {
    console.error("❌ Reject registration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject registration",
    });
  }
};

// Get all pending technician requests
export const getTechnicianRequests = async (req, res) => {
  try {
    const requests = await User.find({ technicianRequestStatus: "pending" })
      .select(
        "firstName lastName email plan technicianRequestMessage technicianRequestedAt",
      )
      .sort({ technicianRequestedAt: -1 });

    res.json({ success: true, requests, count: requests.length });
  } catch (error) {
    console.error("❌ Get technician requests error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch requests" });
  }
};

// Approve technician request (admin assigns specializations then approves)
export const approveTechnicianRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { specializations } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    if (!specializations || specializations.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Specializations are required" });
    }

    // Import Technician model
    const Technician = (await import("../models/Technician.js")).default;

    // Check if already a technician
    const existing = await Technician.findOne({ userId });
    if (!existing) {
      const technician = new Technician({
        userId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        specializations,
      });
      await technician.save();
    }

    user.technicianRequestStatus = "approved";
    await user.save();

    // Notify user via Pusher
    try {
      await pusher.trigger(`user-${userId}`, "technician-request-approved", {
        message: "Your technician request has been approved!",
      });
    } catch (_) {}

    res.json({ success: true, message: "Technician request approved" });
  } catch (error) {
    console.error("❌ Approve technician request error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to approve request" });
  }
};

// Reject technician request
export const rejectTechnicianRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    user.technicianRequestStatus = "rejected";
    await user.save();

    // Notify user via Pusher
    try {
      await pusher.trigger(`user-${userId}`, "technician-request-rejected", {
        message: "Your technician request was not approved.",
      });
    } catch (_) {}

    res.json({ success: true, message: "Technician request rejected" });
  } catch (error) {
    console.error("❌ Reject technician request error:", error);
    res.status(500).json({ success: false, error: "Failed to reject request" });
  }
};
