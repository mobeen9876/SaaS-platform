import express from "express";
import Stripe from "stripe";
import { verifyToken as auth } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from "../services/stripeService.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create checkout session
 * POST /stripe/create-checkout-session
 */
router.post("/create-checkout-session", auth, async (req, res) => {
  console.log("\n=== CHECKOUT REQUEST RECEIVED ===");
  console.log("Time:", new Date().toISOString());
  console.log("Body:", req.body);
  console.log("User:", req.user);

  try {
    const { plan, billingCycle } = req.body;
    const userId = req.user.userId;

    console.log("📝 Checkout request:", { userId, plan, billingCycle });

    // Validate plan
    if (!["pro", "enterprise"].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be "pro" or "enterprise"',
      });
    }

    // Validate billing cycle
    if (!["monthly", "annual"].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid billing cycle. Must be "monthly" or "annual"',
      });
    }

    // Get user email
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Create checkout session
    const session = await createCheckoutSession({
      userId: userId,
      userEmail: user.email,
      plan: plan,
      billingCycle: billingCycle,
      successUrl: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
    });

    console.log("📤 Sending response to frontend:", session);
    res.json(session);
  } catch (error) {
    console.error("❌ Checkout error:", error);
    console.error("Error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(500).json({
      success: false,
      error: "Failed to create checkout session",
      message: error.message,
      details:
        process.env.NODE_ENV === "development"
          ? {
              type: error.type,
              code: error.code,
            }
          : undefined,
    });
  }
});

/**
 * Create customer portal session
 * POST /stripe/create-portal-session
 */
router.post("/create-portal-session", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: "No active subscription found",
      });
    }

    const session = await createPortalSession(
      user.stripeCustomerId,
      `${process.env.FRONTEND_URL}/dashboard`,
    );

    res.json(session);
  } catch (error) {
    console.error("❌ Portal error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create portal session",
      message: error.message,
    });
  }
});

/**
 * Stripe webhook endpoint
 * POST /stripe/webhook
 *
 * IMPORTANT: This endpoint must use raw body, not JSON
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      await handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      console.error("❌ Webhook handling error:", error);
      res.status(500).json({
        error: "Webhook handler failed",
        message: error.message,
      });
    }
  },
);

/**
 * Get subscription status
 * GET /stripe/subscription-status
 */
router.get("/subscription-status", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "plan subscriptionStatus billingCycle stripeCustomerId",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      subscription: {
        plan: user.plan,
        status: user.subscriptionStatus,
        billingCycle: user.billingCycle,
        hasActiveSubscription: !!user.stripeCustomerId,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching subscription status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subscription status",
    });
  }
});

/**
 * Test Stripe configuration
 * GET /stripe/test-config
 */
router.get("/test-config", async (req, res) => {
  try {
    const config = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      priceIds: {
        proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "NOT SET",
        proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || "NOT SET",
        enterpriseMonthly:
          process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "NOT SET",
        enterpriseYearly:
          process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "NOT SET",
      },
      frontendUrl: process.env.FRONTEND_URL || "NOT SET",
    };

    res.json({
      success: true,
      message: "Stripe configuration check",
      config,
    });
  } catch (error) {
    console.error("❌ Config test error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check configuration",
    });
  }
});

/**
 * Check user plan in database
 * GET /stripe/check-user-plan/:userId
 */
router.get("/check-user-plan/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      "email plan subscriptionStatus billingCycle stripeCustomerId stripeSubscriptionId hasSelectedPlan",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        billingCycle: user.billingCycle,
        hasStripeCustomer: !!user.stripeCustomerId,
        hasStripeSubscription: !!user.stripeSubscriptionId,
        hasSelectedPlan: user.hasSelectedPlan,
      },
    });
  } catch (error) {
    console.error("❌ Error checking user plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check user plan",
    });
  }
});

export default router;
