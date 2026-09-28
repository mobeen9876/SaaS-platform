import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import aiToolsRoutes from "./routes/aiToolsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import { logger } from "./utils/logger.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");
    console.log("✅ Using Pusher Channels for real-time messaging");

    // Start server only after DB connection
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 CORS enabled for: http://localhost:5173`);
      console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`💬 Pusher chat API: http://localhost:${PORT}/api/chat`);
      console.log(`👑 Admin creation in progress...`);

      // Create admin with delay to ensure DB is ready
      setTimeout(async () => {
        await createAdminUser();
      }, 2000);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Function to create admin - runs after DB connection
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = new User({
        firstName: "Admin",
        lastName: "User",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        plan: "admin", // Changed from "enterprise" to "admin"
        paymentStatus: "active",
        apiKey: `admin_${Date.now()}`,
        isActive: true,
        registrationStatus: "approved", // Ensure admin is approved
      });

      await adminUser.save();
      console.log("✅ Admin created:");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log("👑 Plan: admin (full access)");
      console.log(
        "⚠️  Remove this function after first use to prevent duplicate admin creation!",
      );
    } else {
      console.log("ℹ️ Admin already exists");
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👑 Role: ${existingAdmin.role}`);
      console.log(`📋 Plan: ${existingAdmin.plan}`);
      console.log(
        `🔑 Password hash exists: ${existingAdmin.password ? "Yes" : "No"}`,
      );

      // Check if password is correct by trying to login
      const isPasswordCorrect = await bcrypt.compare(
        adminPassword,
        existingAdmin.password,
      );
      console.log(
        `🔑 Test password "${adminPassword}" matches: ${
          isPasswordCorrect ? "Yes" : "No"
        }`,
      );

      if (!isPasswordCorrect) {
        console.log("⚠️  Password mismatch! Updating password...");
        const newHashedPassword = await bcrypt.hash(adminPassword, 10);
        existingAdmin.password = newHashedPassword;
        await existingAdmin.save();
        console.log(`✅ Password updated to '${adminPassword}'`);
      }

      // Ensure admin has correct registration status
      if (
        !existingAdmin.registrationStatus ||
        existingAdmin.registrationStatus !== "approved"
      ) {
        console.log("⚠️  Updating admin registration status...");
        existingAdmin.registrationStatus = "approved";

        // Also ensure lastName is not empty (fix validation issue)
        if (!existingAdmin.lastName || existingAdmin.lastName.trim() === "") {
          existingAdmin.lastName = "User";
        }

        await existingAdmin.save();
        console.log("✅ Admin registration status updated to 'approved'");
      }
    }
  } catch (error) {
    console.error("❌ Error creating/checking admin:", error);
  }
};

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stripe webhook needs raw body - must come BEFORE express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Pusher auth requests
app.use(logger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ai-tools", aiToolsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/assignments", assignmentRoutes);

// ---- Basic routes (kept from original index.js) ----
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "✅ Backend is working!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    server: "SaaS Backend",
    version: "1.0.0",
  });
});

// Pricing route (moved from original index.js)
app.get("/api/pricing", async (req, res) => {
  try {
    let plans = [
      {
        id: "free",
        name: "Free",
        price: 0,
        description: "Perfect for getting started",
        features: [
          "✓ Basic API access",
          "✓ 100 requests/month",
          "✓ Email support",
          "✓ Community access",
          "✗ Advanced features",
          "✗ Priority support",
        ],
        popular: false,
        selected: false,
      },
      {
        id: "pro",
        name: "Pro",
        price: 29,
        description: "Best for growing businesses",
        features: [
          "✓ Everything in Free",
          "✓ 10,000 requests/month",
          "✓ Priority support",
          "✓ Advanced analytics",
          "✓ Custom API keys",
          "✓ 24/7 monitoring",
        ],
        popular: true,
        selected: false,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 99,
        description: "For large scale applications",
        features: [
          "✓ Everything in Pro",
          "✓ Unlimited requests",
          "✓ 24/7 phone support",
          "✓ Custom integrations",
          "✓ Dedicated account manager",
          "✓ SLA guarantee",
        ],
        popular: false,
        selected: false,
      },
    ];

    const { userId } = req.query;
    if (userId) {
      try {
        const user = await User.findById(userId).lean();
        if (user && user.hasSelectedPlan && user.plan) {
          plans = plans.map((p) => ({ ...p, selected: p.id === user.plan }));
        } else {
          plans = plans.map((p) => ({ ...p, selected: false }));
        }
      } catch (err) {
        console.warn(
          "⚠️ Pricing: failed to find user for userId:",
          userId,
          err,
        );
        plans = plans.map((p) => ({ ...p, selected: false }));
      }
    }

    res.json({
      success: true,
      message: "Pricing plans retrieved",
      plans,
    });
  } catch (error) {
    console.error("❌ Pricing route error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pricing plans",
    });
  }
});

// Payment routes
app.post("/api/payment/create-checkout", async (req, res) => {
  try {
    const { userId, planId, planName, price } = req.body;

    console.log("💰 Payment checkout requested:", {
      userId,
      planId,
      planName,
      price,
    });

    const mockSession = {
      id: `mock_session_${Date.now()}`,
      url: `http://localhost:5173/payment-success?session_id=mock_${Date.now()}`,
      amount_total: price * 100,
      currency: "usd",
      customer: userId,
      metadata: {
        planId,
        userId,
      },
    };

    res.json({
      success: true,
      message: "Checkout session created",
      session: mockSession,
      redirectUrl: mockSession.url,
    });
  } catch (error) {
    console.error("❌ Payment checkout error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create checkout session",
    });
  }
});

app.get("/api/payment/success", async (req, res) => {
  try {
    const { session_id, user_id, plan_id } = req.query;

    console.log("✅ Payment success callback:", {
      session_id,
      user_id,
      plan_id,
    });

    if (user_id && plan_id) {
      const user = await User.findById(user_id);
      if (user) {
        user.plan = plan_id;
        user.paymentStatus = "active";
        user.hasSelectedPlan = true;
        await user.save();
        console.log(`📋 User ${user.email} upgraded to plan: ${plan_id}`);
      }
    }

    res.json({
      success: true,
      message: "Payment successful! Your plan has been upgraded.",
      plan: plan_id,
    });
  } catch (error) {
    console.error("❌ Payment success callback error:", error);
    res.status(500).json({
      success: false,
      error: "Payment processing error",
    });
  }
});

app.get("/api/payment/cancel", (req, res) => {
  res.json({
    success: false,
    message: "Payment was cancelled. You can try again anytime.",
    redirectUrl: "http://localhost:5173/pricing",
  });
});

// Manual admin creation endpoint (for testing)
app.post("/api/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Update existing user to admin
      existingUser.role = "admin";
      existingUser.plan = "admin"; // Changed to "admin"
      existingUser.paymentStatus = "active";
      existingUser.registrationStatus = "approved"; // Ensure admin is approved
      await existingUser.save();

      return res.json({
        success: true,
        message: "Existing user upgraded to admin",
        user: {
          email: existingUser.email,
          role: existingUser.role,
          plan: existingUser.plan,
        },
      });
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(password, 10);

      const adminUser = new User({
        firstName: "Admin",
        lastName: ".",
        email: email,
        password: hashedPassword,
        role: "admin",
        plan: "admin", // Changed to "admin"
        paymentStatus: "active",
        apiKey: `admin_${Date.now()}`,
        isActive: true,
        registrationStatus: "approved", // Ensure admin is approved
      });

      await adminUser.save();

      return res.json({
        success: true,
        message: "Admin created successfully",
        user: {
          email: adminUser.email,
          role: adminUser.role,
          plan: adminUser.plan,
        },
      });
    }
  } catch (error) {
    console.error("❌ Create admin error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create admin",
    });
  }
});

// Test endpoint to check if admin exists
app.get("/api/check-admin", async (req, res) => {
  try {
    const adminUsers = await User.find({ role: "admin" }).select(
      "email firstName lastName role plan",
    );

    res.json({
      success: true,
      count: adminUsers.length,
      admins: adminUsers,
    });
  } catch (error) {
    console.error("❌ Check admin error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check admins",
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.error(`❌ 404 Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
  });
});

// Start server
startServer().catch((error) => {
  console.error("❌ Server startup failed:", error);
  process.exit(1);
});
