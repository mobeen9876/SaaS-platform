/**
 * Seed Script — Create 5 Technicians directly in MongoDB Atlas
 * Run: node scripts/seedTechnicians.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ─── Inline schemas (avoid circular imports) ─────────────────────────────────

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  plan: { type: String, enum: ["free", "pro", "enterprise", "admin"], default: "free" },
  apiKey: { type: String, default: "" },
  paymentStatus: { type: String, enum: ["inactive", "active", "cancelled"], default: "active" },
  isActive: { type: Boolean, default: true },
  registrationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
  technicianRequestStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "approved" },
  hasSelectedPlan: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const technicianSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  specializations: [{ type: String, enum: ["technical", "maintenance", "software", "hardware", "network", "other"] }],
  isAvailable: { type: Boolean, default: true },
  currentIssuesCount: { type: Number, default: 0 },
  totalIssuesResolved: { type: Number, default: 0 },
  averageResolutionTime: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Technician = mongoose.model("Technician", technicianSchema);

// ─── Technician data ──────────────────────────────────────────────────────────

const technicians = [
  {
    firstName: "Muhammad",
    lastName: "Mobeen",
    email: "m.mobeen2003.786@gmail.com",
    specializations: ["software", "technical", "network"],
    rating: 4.9,
  },
  {
    firstName: "Ahmed",
    lastName: "Raza",
    email: "ahmed.raza.tech@gmail.com",
    specializations: ["hardware", "maintenance"],
    rating: 4.7,
  },
  {
    firstName: "Sara",
    lastName: "Khan",
    email: "sara.khan.support@gmail.com",
    specializations: ["software", "technical"],
    rating: 4.8,
  },
  {
    firstName: "Usman",
    lastName: "Ali",
    email: "usman.ali.network@gmail.com",
    specializations: ["network", "technical"],
    rating: 4.6,
  },
  {
    firstName: "Fatima",
    lastName: "Malik",
    email: "fatima.malik.dev@gmail.com",
    specializations: ["software", "other"],
    rating: 4.8,
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    const defaultPassword = await bcrypt.hash("Tech@2026", 10);
    let created = 0;
    let skipped = 0;

    for (const t of technicians) {
      const existing = await User.findOne({ email: t.email });

      let user = existing;

      if (!existing) {
        user = await User.create({
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          password: defaultPassword,
          role: "user",
          plan: "pro",
          paymentStatus: "active",
          isActive: true,
          registrationStatus: "approved",
          technicianRequestStatus: "approved",
          hasSelectedPlan: true,
          apiKey: `tech_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });
        console.log(`👤 Created user: ${t.email}`);
      } else {
        // Update existing user to approved technician status
        await User.findByIdAndUpdate(existing._id, {
          technicianRequestStatus: "approved",
          registrationStatus: "approved",
          isActive: true,
        });
        console.log(`ℹ️  User already exists: ${t.email} — updating status`);
      }

      // Create Technician profile if not exists
      const existingTech = await Technician.findOne({ userId: user._id });
      if (!existingTech) {
        await Technician.create({
          userId: user._id,
          name: `${t.firstName} ${t.lastName}`,
          email: t.email,
          specializations: t.specializations,
          isAvailable: true,
          rating: t.rating,
          totalIssuesResolved: Math.floor(Math.random() * 50) + 10,
        });
        console.log(`🔧 Created technician profile: ${t.firstName} ${t.lastName} (${t.specializations.join(", ")})`);
        created++;
      } else {
        console.log(`⏭️  Technician profile already exists for: ${t.email}`);
        skipped++;
      }
    }

    console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
    console.log(`\n🔑 Default password for all new technicians: Tech@2026`);
    console.log(`📧 Technicians: ${technicians.map(t => t.email).join(", ")}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
