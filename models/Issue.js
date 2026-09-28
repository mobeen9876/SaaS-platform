import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  // Issue Details
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },

  // Submitted by
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedByName: String,
  submittedByEmail: String,

  // AI Analysis
  issueType: {
    type: String,
    enum: [
      "technical",
      "maintenance",
      "software",
      "hardware",
      "network",
      "other",
    ],
    default: "other",
  },
  priority: {
    type: String,
    enum: ["small", "medium", "large"],
    default: "medium",
  },
  aiAnalysis: {
    type: String,
    default: "",
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  assignedToName: String,
  assignedToEmail: String,
  assignedAt: Date,
  assignmentReason: String, // Why AI assigned to this person

  // Chat/Conversation
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    default: null,
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "assigned", "in-progress", "resolved", "closed"],
    default: "pending",
  },

  // Resolution
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolutionNotes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
issueSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
