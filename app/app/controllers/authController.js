import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOTP, sendOTPEmail } from "../utils/emailService.js";
import { pusher } from "../config/pusher.js";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ exists: false });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ exists: false });
  }
};

// Returns { exists, role } so the frontend can auto-detect admin vs user
export const checkEmailRole = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ exists: false, role: null });
    const user = await User.findOne(
      { email: email.toLowerCase().trim() },
      "role registrationStatus isActive",
    );
    if (!user) return res.json({ exists: false, role: null });
    res.json({ exists: true, role: user.role });
  } catch (error) {
    res.status(500).json({ exists: false, role: null });
  }
};

export const checkNameExists = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) return res.json({ exists: false });
    const user = await User.findOne({
      firstName: new RegExp(`^${firstName.trim()}$`, "i"),
      lastName: new RegExp(`^${lastName.trim()}$`, "i"),
    });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ exists: false });
  }
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = "user",
      plan = "free",
    } = req.body;

    console.log("📝 Registration attempt:", { email, firstName, role, plan });

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate plan (only allow valid plans)
    const validPlans = ["free", "pro", "enterprise"];
    const selectedPlan = validPlans.includes(plan) ? plan : "free";

    // Set payment status based on plan
    const paymentStatus = selectedPlan === "free" ? "active" : "inactive";

    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      plan: selectedPlan,
      originalPlan: selectedPlan, // Store original plan
      apiKey: "",
      paymentStatus,
      isActive: false, // Set to false initially
      registrationStatus: "pending", // Set to pending
      hasSelectedPlan: plan && plan !== "free", // True if user selected a paid plan during signup
    });

    await user.save();

    console.log("✅ User registered successfully:", {
      email: user.email,
      id: user._id,
      role: user.role,
      plan: user.plan,
      paymentStatus: user.paymentStatus,
    });

    // Notify admin dashboard in real-time about the new registration
    try {
      await pusher.trigger("admin-channel", "new-registration", {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt,
        },
      });
    } catch (pusherErr) {
      console.warn(
        "⚠️ Pusher notification failed (non-critical):",
        pusherErr.message,
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      message:
        "Registration request submitted! Please wait for admin approval.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        plan: user.plan,
        registrationStatus: user.registrationStatus,
        isActive: user.isActive,
      },
      // Don't send token for pending users
      requiresApproval: true,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for email:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log("❌ User not found for email:", email);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Block login for deactivated users
    if (user.isActive === false) {
      console.log("⚠️ Deactivated user attempted login:", email);
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated by an admin.",
      });
    }

    // Block login for pending users (except admins)
    if (user.registrationStatus === "pending" && user.role !== "admin") {
      console.log("⚠️ Pending user attempted login:", email);
      return res.status(403).json({
        success: false,
        error:
          "Your registration is still pending admin approval. Please wait for approval.",
        registrationStatus: "pending",
      });
    }

    // Block login for rejected users (except admins)
    if (user.registrationStatus === "rejected" && user.role !== "admin") {
      console.log("⚠️ Rejected user attempted login:", email);
      return res.status(403).json({
        success: false,
        error: `Your registration was rejected. Reason: ${user.rejectionReason || "No reason provided"}`,
        registrationStatus: "rejected",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", user.email);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    console.log("✅ Password valid for user:", user.email);

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        plan: user.plan,
        apiKey: user.apiKey,
        paymentStatus: user.paymentStatus,
        isActive: user.isActive,
        hasSelectedPlan: user.hasSelectedPlan,
        registrationStatus: user.registrationStatus,
        billingCycle: user.billingCycle,
        subscriptionStatus: user.subscriptionStatus,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
};

// Request password reset OTP
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔑 Password reset request for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address",
      });
    }

    let user;
    try {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } catch (dbError) {
      console.error("❌ Database error finding user:", dbError);
      return res.status(500).json({
        success: false,
        error: "Database connection error. Please try again later.",
      });
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      console.log("⚠️ Password reset requested for non-existent user:", email);
      return res.json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    // Check if user is active and approved
    if (!user.isActive || user.registrationStatus !== "approved") {
      console.log(
        "⚠️ Password reset requested for inactive/unapproved user:",
        email,
      );
      return res.json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Set OTP and expiration (10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordAttempts = 0; // Reset attempts

    try {
      await user.save();
      console.log("✅ OTP saved to MongoDB:");
      console.log("📧 Email:", user.email);
      console.log("🔢 OTP:", user.resetPasswordOTP);
      console.log("⏰ Expires:", user.resetPasswordExpires);
      console.log("🗄️ Database: saasapp, Collection: users");
    } catch (saveError) {
      console.error("❌ Database error saving OTP:", saveError);
      return res.status(500).json({
        success: false,
        error: "Failed to process request. Please try again later.",
      });
    }

    // Send OTP email
    try {
      const emailResult = await sendOTPEmail(user.email, otp, "reset");

      console.log("🔑 Password reset OTP sent to:", email);
      console.log("🔢 OTP:", otp);
      console.log("⏰ Expires at:", user.resetPasswordExpires);

      res.json({
        success: true,
        message:
          "An OTP has been sent to your email address. Please check your inbox.",
        // Remove this in production - only for testing
        ...(process.env.NODE_ENV !== "production" && {
          otp: otp,
          previewUrl: emailResult.previewUrl,
        }),
      });
    } catch (emailError) {
      console.error("❌ Failed to send OTP email:", emailError);

      // Don't clear the OTP if email failed - allow user to still use it
      // This is for development purposes
      console.log("🔑 Email failed but OTP is still valid for testing:", otp);
      console.log("⏰ Expires at:", user.resetPasswordExpires);

      res.json({
        success: true,
        message:
          "An OTP has been generated. Check the server console for the OTP code (development mode).",
        // For development - show OTP even if email fails
        ...(process.env.NODE_ENV !== "production" && {
          otp: otp,
          emailError: "Email service unavailable - using console output",
        }),
      });
    }
  } catch (error) {
    console.error("❌ Password reset request error:", error);
    res.status(500).json({
      success: false,
      error:
        "Failed to process password reset request. Please try again later.",
    });
  }
};

// Verify OTP and reset password
export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Find user with valid OTP
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if user exists but OTP is invalid/expired
      const userExists = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (userExists && userExists.resetPasswordOTP) {
        // Increment failed attempts
        userExists.resetPasswordAttempts =
          (userExists.resetPasswordAttempts || 0) + 1;

        // Lock account after 5 failed attempts
        if (userExists.resetPasswordAttempts >= 5) {
          userExists.resetPasswordOTP = null;
          userExists.resetPasswordExpires = null;
          await userExists.save();

          return res.status(429).json({
            success: false,
            error: "Too many failed attempts. Please request a new OTP.",
          });
        }

        await userExists.save();
      }

      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    console.log("✅ Password reset successful for:", user.email);

    res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
};

// Admin reset user password (direct reset - no OTP)
export const adminResetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "User ID and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear any existing reset data
    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    console.log("✅ Admin reset password for user:", user.email);

    res.json({
      success: true,
      message: `Password has been reset for ${user.email}`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("❌ Admin password reset error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset user password",
    });
  }
};

// Admin request OTP for their own password reset
export const adminRequestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin",
    });

    if (!user) {
      // Don't reveal if admin exists or not for security
      return res.json({
        success: true,
        message:
          "If an admin account with that email exists, an OTP has been sent.",
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Set OTP and expiration (10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordAttempts = 0; // Reset attempts
    await user.save();

    // Send OTP email
    try {
      const emailResult = await sendOTPEmail(user.email, otp, "admin-reset");

      console.log("🔑 Admin password reset OTP sent to:", email);
      console.log("🔢 OTP:", otp);
      console.log("⏰ Expires at:", user.resetPasswordExpires);

      res.json({
        success: true,
        message:
          "An OTP has been sent to your admin email address. Please check your inbox.",
        // Remove this in production - only for testing
        ...(process.env.NODE_ENV !== "production" && {
          otp: otp,
          previewUrl: emailResult.previewUrl,
        }),
      });
    } catch (emailError) {
      console.error("❌ Failed to send admin OTP email:", emailError);

      // Don't clear the OTP if email failed - allow admin to still use it
      // This is for development purposes
      console.log("🔑 Email failed but OTP is still valid for testing:", otp);
      console.log("⏰ Expires at:", user.resetPasswordExpires);

      res.json({
        success: true,
        message:
          "An OTP has been generated. Check the server console for the OTP code (development mode).",
        // For development - show OTP even if email fails
        ...(process.env.NODE_ENV !== "production" && {
          otp: otp,
          emailError: "Email service unavailable - using console output",
        }),
      });
    }
  } catch (error) {
    console.error("❌ Admin password reset request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process admin password reset request",
    });
  }
};

// Admin reset their own password with OTP
export const adminResetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Find admin with valid OTP
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin",
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if admin exists but OTP is invalid/expired
      const adminExists = await User.findOne({
        email: email.toLowerCase().trim(),
        role: "admin",
      });

      if (adminExists && adminExists.resetPasswordOTP) {
        // Increment failed attempts
        adminExists.resetPasswordAttempts =
          (adminExists.resetPasswordAttempts || 0) + 1;

        // Lock account after 5 failed attempts
        if (adminExists.resetPasswordAttempts >= 5) {
          adminExists.resetPasswordOTP = null;
          adminExists.resetPasswordExpires = null;
          await adminExists.save();

          return res.status(429).json({
            success: false,
            error: "Too many failed attempts. Please request a new OTP.",
          });
        }

        await adminExists.save();
      }

      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    console.log("✅ Admin password reset successful for:", user.email);

    res.json({
      success: true,
      message:
        "Admin password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("❌ Admin password reset error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset admin password",
    });
  }
};
