import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  plan: {
    type: String,
    enum: ["free", "pro", "enterprise", "admin"], // Added "admin" to enum
    default: "free",
  },
  originalPlan: {
    type: String,
    enum: ["free", "pro", "enterprise", "admin"], // Added "admin" to enum
    default: "free",
  },
  apiKey: { type: String, default: "" },
  subscriptionId: { type: String, default: "" },
  paymentStatus: {
    type: String,
    enum: ["inactive", "active", "cancelled"],
    default: "inactive",
  },
  isActive: { type: Boolean, default: true },
  registrationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  // Add these fields for better user tracking
  apiUsage: { type: Number, default: 0 },
  storageUsed: { type: Number, default: 0 }, // in MB
  projectsCount: { type: Number, default: 0 },
  hasSelectedPlan: { type: Boolean, default: false },
  // Password reset fields - OTP based
  resetPasswordOTP: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  resetPasswordAttempts: { type: Number, default: 0 },

  // AI Tools Configuration
  aiApiKey: { type: String, default: null },
  aiApiKeyVerified: { type: Boolean, default: false },
  aiToolsEnabled: { type: Boolean, default: false },
  aiProvider: {
    type: String,
    enum: ["openai", "gemini", "groq"],
    default: "groq",
  },

  // Stripe Integration Fields
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: {
    type: String,
    enum: ["active", "canceled", "past_due", "trialing", "incomplete", null],
    default: null,
  },
  billingCycle: {
    type: String,
    enum: ["monthly", "annual", null],
    default: null,
  },

  // Technician Request
  technicianRequestStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
  },
  technicianRequestMessage: { type: String, default: "" },
  technicianRequestedAt: { type: Date, default: null },
});

// Cascade delete: When a user is deleted, clean up related data
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const userId = this.getQuery()._id;

    if (userId) {
      // Import models here to avoid circular dependency
      const Technician = mongoose.model("Technician");
      const Issue = mongoose.model("Issue");

      console.log(`🗑️  Cascading delete for user: ${userId}`);

      // Delete technician profile if exists
      const deletedTech = await Technician.findOneAndDelete({ userId });
      if (deletedTech) {
        console.log(`   ✅ Deleted technician profile: ${deletedTech.name}`);
      }

      // Update issues submitted by this user (set to null or keep for history)
      const submittedIssues = await Issue.updateMany(
        { submittedBy: userId },
        {
          $set: {
            submittedBy: null,
            submittedByName: "[Deleted User]",
          },
        },
      );
      if (submittedIssues.modifiedCount > 0) {
        console.log(
          `   ✅ Updated ${submittedIssues.modifiedCount} submitted issues`,
        );
      }

      // Update issues assigned to this user (unassign them)
      const assignedIssues = await Issue.updateMany(
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
      if (assignedIssues.modifiedCount > 0) {
        console.log(
          `   ✅ Unassigned ${assignedIssues.modifiedCount} issues (set to pending)`,
        );
      }

      console.log(`   ✅ Cascade delete completed for user: ${userId}`);
    }

    next();
  } catch (error) {
    console.error("❌ Error in cascade delete:", error);
    next(error);
  }
});

// Also handle deleteOne
userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const userId = this._id;

      if (userId) {
        const Technician = mongoose.model("Technician");
        const Issue = mongoose.model("Issue");

        console.log(`🗑️  Cascading delete for user: ${userId}`);

        await Technician.findOneAndDelete({ userId });
        await Issue.updateMany(
          { submittedBy: userId },
          {
            $set: {
              submittedBy: null,
              submittedByName: "[Deleted User]",
            },
          },
        );
        await Issue.updateMany(
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

        console.log(`   ✅ Cascade delete completed`);
      }

      next();
    } catch (error) {
      console.error("❌ Error in cascade delete:", error);
      next(error);
    }
  },
);

const User = mongoose.model("User", userSchema);

export default User;
