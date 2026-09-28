import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "First name and last name are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update profile fields
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(userId).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// Change user password
export const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear any reset data
    user.password = hashedNewPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;

    await user.save();

    console.log("✅ Password changed for user:", user.email);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};

// Delete user account
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Don't allow admins to delete their own account
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        error: "Admin accounts cannot be deleted through this method",
      });
    }

    await User.findByIdAndDelete(userId);

    console.log("✅ User account deleted:", user.email);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
    });
  }
};

// Get user statistics (for profile page)
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Calculate user statistics
    const stats = {
      accountAge: Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ), // days
      apiUsage: user.apiUsage || 0,
      storageUsed: user.storageUsed || 0,
      projectsCount: user.projectsCount || 0,
      lastLogin: user.lastLogin,
      plan: user.plan,
      paymentStatus: user.paymentStatus,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics",
    });
  }
};
// Update user plan
export const updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.userId;

    console.log("📋 Plan update requested for user:", { userId, plan });

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: "Plan is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Don't allow admins to change their plan through this route
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        error: "Admin users cannot change their plan",
      });
    }

    user.plan = plan;
    user.hasSelectedPlan = true;
    await user.save();

    console.log("✅ Plan updated for user:", user.email, "to", plan);

    res.json({
      success: true,
      message: `Plan updated successfully to ${plan}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan,
        hasSelectedPlan: user.hasSelectedPlan,
        apiKey: user.apiKey,
        paymentStatus: user.paymentStatus,
        registrationStatus: user.registrationStatus,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Update plan error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update plan",
    });
  }
};

// Request to become a technician
export const requestTechnicianRole = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    if (user.role === "admin") {
      return res
        .status(400)
        .json({
          success: false,
          error: "Admins cannot request technician role",
        });
    }

    if (user.technicianRequestStatus === "pending") {
      return res
        .status(400)
        .json({ success: false, error: "You already have a pending request" });
    }

    user.technicianRequestStatus = "pending";
    user.technicianRequestMessage = message || "";
    user.technicianRequestedAt = new Date();
    await user.save();

    // Notify admin via Pusher
    try {
      const { pusher } = await import("../config/pusher.js");
      await pusher.trigger("admin-channel", "technician-request", {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: user.technicianRequestMessage,
          requestedAt: user.technicianRequestedAt,
        },
      });
    } catch (_) {}

    res.json({
      success: true,
      message: "Technician request submitted successfully",
    });
  } catch (error) {
    console.error("❌ Technician request error:", error);
    res.status(500).json({ success: false, error: "Failed to submit request" });
  }
};

// Cancel technician request
export const cancelTechnicianRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    user.technicianRequestStatus = "none";
    user.technicianRequestMessage = "";
    user.technicianRequestedAt = null;
    await user.save();

    res.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to cancel request" });
  }
};
