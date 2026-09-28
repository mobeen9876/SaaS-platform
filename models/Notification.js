import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Recipient
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification Details
    type: {
      type: String,
      enum: [
        "issue_assigned",
        "issue_status_update",
        "issue_resolved",
        "issue_closed",
        "technician_added",
        "technician_removed",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Related Issue (if applicable)
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },

    // Status
    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
