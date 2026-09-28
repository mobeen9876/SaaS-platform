import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedByName: { type: String, required: true },
  submittedByEmail: { type: String },
  content: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  // AI check results
  checked: { type: Boolean, default: false },
  score: { type: Number, min: 0, max: 10 },
  grade: { type: String },
  grammarFeedback: { type: String },
  contentFeedback: { type: String },
  mistakes: [{ type: String }],
  improvements: [{ type: String }],
  strengths: [{ type: String }],
  aiWrittenPercent: { type: Number, min: 0, max: 100 },
  humanWrittenPercent: { type: Number, min: 0, max: 100 },
  aiDetectionVerdict: { type: String },
  aiDetectionReason: { type: String },
  overallFeedback: { type: String },
  checkedAt: { type: Date },
});

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    deadline: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: { type: String },
    isActive: { type: Boolean, default: true },
    submissions: [submissionSchema],
  },
  { timestamps: true },
);

export default mongoose.model("Assignment", assignmentSchema);
