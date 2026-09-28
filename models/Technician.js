import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema({
  // Link to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // Technician Details
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },

  // Specializations
  specializations: [
    {
      type: String,
      enum: [
        "technical",
        "maintenance",
        "software",
        "hardware",
        "network",
        "other",
      ],
    },
  ],

  // Availability
  isAvailable: {
    type: Boolean,
    default: true,
  },

  // Workload
  currentIssuesCount: {
    type: Number,
    default: 0,
  },
  totalIssuesResolved: {
    type: Number,
    default: 0,
  },

  // Performance
  averageResolutionTime: {
    type: Number,
    default: 0, // in hours
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5,
  },

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

const Technician = mongoose.model("Technician", technicianSchema);

export default Technician;
