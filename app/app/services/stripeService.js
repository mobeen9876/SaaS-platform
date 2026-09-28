import Stripe from "stripe";
import User from "../models/User.js";

// Initialize Stripe with error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY not found in environment variables");
    throw new Error("Stripe secret key not configured");
  }

  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log("✅ Stripe initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Stripe:", error.message);
  throw error;
}

export const createCheckoutSession = async ({
  userId,
  userEmail,
  plan,
  billingCycle,
  successUrl,
  cancelUrl,
}) => {
  try {
    console.log("🛒 Creating checkout session:", {
      userId,
      plan,
      billingCycle,
    });

    let priceId;

    if (plan === "pro") {
      priceId =
        billingCycle === "annual"
          ? process.env.STRIPE_PRICE_PRO_YEARLY
          : process.env.STRIPE_PRICE_PRO_MONTHLY;
    } else if (plan === "enterprise") {
      priceId =
        billingCycle === "annual"
          ? process.env.STRIPE_PRICE_ENTERPRISE_YEARLY
          : process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY;
    } else {
      throw new Error("Invalid plan");
    }

    console.log("💰 Using price ID:", priceId);

    if (!priceId) {
      throw new Error(
        `Price ID not found for plan: ${plan}, billing: ${billingCycle}`,
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY not configured in environment variables",
      );
    }

    const trialDays = plan === "pro" ? 7 : 30;

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId: userId,
          plan: plan,
          billingCycle: billingCycle,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        plan: plan,
        billingCycle: billingCycle,
      },
    });

    console.log("✅ Checkout session created:", session.id);
    console.log("📍 Checkout URL:", session.url);

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error("❌ Stripe checkout error:", error);
    throw error;
  }
};

export const createPortalSession = async (customerId, returnUrl) => {
  try {
    console.log("🏛️ Creating portal session for customer:", customerId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log("✅ Portal session created");

    return {
      success: true,
      url: session.url,
    };
  } catch (error) {
    console.error("❌ Stripe portal error:", error);
    throw error;
  }
};

export const handleWebhook = async (event) => {
  try {
    console.log("\n=== STRIPE WEBHOOK ===");
    console.log("Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        await activateSubscription(session);
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object;
        await updateSubscription(subscription);
        break;

      case "customer.subscription.deleted":
        const cancelledSub = event.data.object;
        await cancelSubscription(cancelledSub);
        break;

      case "invoice.payment_failed":
        const invoice = event.data.object;
        await handlePaymentFailure(invoice);
        break;

      case "customer.subscription.trial_will_end":
        const trialSub = event.data.object;
        console.log("⏰ Trial ending soon for subscription:", trialSub.id);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    console.log("=== WEBHOOK COMPLETE ===\n");

    return { success: true };
  } catch (error) {
    console.error("❌ Webhook error:", error);
    throw error;
  }
};

async function activateSubscription(session) {
  try {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;
    const billingCycle = session.metadata.billingCycle;

    console.log("✅ Activating subscription for user:", userId);

    await User.findByIdAndUpdate(userId, {
      plan: plan,
      billingCycle: billingCycle,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: "trialing", // Will be 'trialing' during trial period
      hasSelectedPlan: true,
    });

    console.log(
      `✅ Subscription activated for user ${userId} - Plan: ${plan} (${billingCycle})`,
    );
  } catch (error) {
    console.error("❌ Error activating subscription:", error);
    throw error;
  }
}

async function updateSubscription(subscription) {
  try {
    console.log("🔄 Updating subscription:", subscription.id);
    console.log("Status:", subscription.status);

    const user = await User.findOne({ stripeSubscriptionId: subscription.id });

    if (user) {
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: subscription.status,
      });
      console.log(`✅ Updated subscription status to: ${subscription.status}`);
    } else {
      console.log("⚠️ User not found for subscription:", subscription.id);
    }
  } catch (error) {
    console.error("❌ Error updating subscription:", error);
    throw error;
  }
}

async function cancelSubscription(subscription) {
  try {
    console.log("❌ Cancelling subscription:", subscription.id);

    const user = await User.findOne({ stripeSubscriptionId: subscription.id });

    if (user) {
      await User.findByIdAndUpdate(user._id, {
        plan: "free",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
      });
      console.log(`✅ Subscription cancelled for user ${user._id}`);
    } else {
      console.log("⚠️ User not found for subscription:", subscription.id);
    }
  } catch (error) {
    console.error("❌ Error cancelling subscription:", error);
    throw error;
  }
}

async function handlePaymentFailure(invoice) {
  try {
    console.log("💳 Payment failed for invoice:", invoice.id);
    console.log("Customer:", invoice.customer);

    const user = await User.findOne({ stripeCustomerId: invoice.customer });

    if (user) {
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: "past_due",
      });
      console.log(`⚠️ User ${user._id} marked as past_due`);
    } else {
      console.log("⚠️ User not found for customer:", invoice.customer);
    }
  } catch (error) {
    console.error("❌ Error handling payment failure:", error);
    throw error;
  }
}
