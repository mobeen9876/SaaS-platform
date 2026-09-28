import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./pricing.module.css";
import { showError, showSuccess } from "../utils/swal";
import { FiCheck, FiX, FiZap } from "react-icons/fi";
import { API_URL } from "../config/api";
import Swal from "sweetalert2";

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [user, setUser] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");

  useEffect(() => {
    // Load user info if available
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch fresh profile only if user hasn't selected a plan yet
    // (avoids overwriting hasSelectedPlan: true with stale DB data)
    const token = localStorage.getItem("token");
    const cachedUser = userData ? JSON.parse(userData) : null;
    if (token && cachedUser && !cachedUser.hasSelectedPlan) {
      fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.user) {
            const fetchedUser = {
              id: data.user._id || data.user.id,
              ...data.user,
            };
            setUser(fetchedUser);
            localStorage.setItem("user", JSON.stringify(fetchedUser));
          }
        })
        .catch((err) => {
          console.warn("Profile fetch failed:", err);
        });
    }
  }, []);

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for individuals exploring AI tools",
      monthlyPrice: "$0",
      annualPrice: "$0",
      priceDescription: "Free forever",
      popular: false,
      features: [
        { included: true, text: "Up to 5 team members" },
        { included: true, text: "Access to basic AI tools" },
        { included: true, text: "Connect your own AI API key" },
        { included: true, text: "Basic dashboard analytics" },
        { included: true, text: "Issue reporting system" },
        { included: false, text: "Advanced AI automation" },
        { included: false, text: "Real-time team collaboration" },
        { included: false, text: "API integrations" },
      ],
      ctaText: "Get Started Free",
      ctaVariant: "secondary",
    },
    {
      id: "pro",
      name: "Professional",
      description: "For growing teams using AI to improve workflows",
      monthlyPrice: "$29",
      annualPrice: "$24",
      priceDescription: "per user/month",
      popular: true,
      features: [
        { included: true, text: "Up to 20 team members" },
        { included: true, text: "Access to all AI tools" },
        { included: true, text: "Multiple AI API integrations" },
        { included: true, text: "Real-time chat & collaboration" },
        { included: true, text: "Advanced analytics dashboard" },
        { included: true, text: "API access" },
        { included: true, text: "Priority processing" },
        { included: false, text: "24/7 priority support" },
      ],
      ctaText: "Start 7-Day Free Trial",
      ctaVariant: "primary",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations scaling AI workflows",
      monthlyPrice: "$99",
      annualPrice: "$79",
      priceDescription: "per user/month",
      popular: false,
      features: [
        { included: true, text: "Unlimited team members" },
        { included: true, text: "Full access to all AI platform tools" },
        { included: true, text: "Multi-provider AI integrations" },
        { included: true, text: "Advanced automation workflows" },
        { included: true, text: "Custom integrations" },
        { included: true, text: "Advanced reporting & analytics" },
        { included: true, text: "24/7 priority support" },
        { included: true, text: "Dedicated account manager" },
      ],
      ctaText: "Start 30-Day Free Trial",
      ctaVariant: "primary",
      hasContactOption: true, // Enable "Contact Sales" link
    },
  ];

  const handleSelectPlan = async (planId) => {
    console.log("=== HANDLE SELECT PLAN ===");
    console.log("Plan ID:", planId);
    console.log("Billing Cycle:", billingCycle);
    console.log("User:", user);

    if (!user) {
      await showError("Please login first");
      navigate("/login");
      return;
    }

    setLoadingPlan(planId);

    try {
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      // Free plan - no payment needed
      if (planId === "free") {
        console.log("Taking FREE plan path");
        const response = await fetch(`${API_URL}/user/update-plan`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            plan: planId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Use server response to ensure hasSelectedPlan is persisted correctly
          const updatedUser = {
            ...user,
            ...(data.user || {}),
            hasSelectedPlan: true,
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("auth-changed"));
          navigate("/dashboard");
        } else {
          await showError(data.error || "Failed to select plan");
        }
        setLoadingPlan("");
        return;
      }

      // Paid plans - redirect to Stripe Checkout
      console.log("Taking PAID plan path");
      console.log("Calling:", `${API_URL}/stripe/create-checkout-session`);
      console.log("With body:", { plan: planId, billingCycle: billingCycle });

      const response = await fetch(
        `${API_URL}/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan: planId,
            billingCycle: billingCycle,
          }),
        },
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.url) {
        console.log("Redirecting to Stripe:", data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error("Checkout failed:", data);
        await showError(data.error || "Failed to start checkout");
        setLoadingPlan("");
      }
    } catch (error) {
      console.error("Plan selection error:", error);
      await showError("Network error. Please try again.");
      setLoadingPlan("");
    }
  };

  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Simple, Transparent{" "}
            <span className={styles.highlight}>Pricing</span>
          </h2>
          <p className={styles.subtitle}>
            Choose the perfect plan for your team. Start with a free trial - no
            credit card required.
          </p>
        </div>

        {/* Current Plan Status */}
        {user && user.hasSelectedPlan ? (
          <div className={styles.currentPlan}>
            <div className={styles.currentPlanBadge}>
              Current Plan: <strong>{user.plan.toUpperCase()}</strong>
            </div>
            <p className={styles.currentPlanText}>
              You're currently on the <strong>{user.plan}</strong> plan.
            </p>
          </div>
        ) : user ? (
          <div className={styles.currentPlan}>
            <div className={styles.currentPlanBadge}>
              Current Plan: <strong>Not selected</strong>
            </div>
            <p className={styles.currentPlanText}>
              You are on the free tier by default. Choose a plan below to make a
              selection.
            </p>
          </div>
        ) : null}

        {/* Billing Toggle */}
        <div className={styles.billingToggle}>
          <div className={styles.toggleContainer}>
            <span
              className={billingCycle === "monthly" ? styles.activeLabel : ""}
            >
              Monthly
            </span>
            <button
              className={styles.toggle}
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "annual" : "monthly",
                )
              }
              aria-label={`Switch to ${
                billingCycle === "monthly" ? "annual" : "monthly"
              } billing`}
            >
              <div
                className={`${styles.toggleSwitch} ${
                  billingCycle === "annual" ? styles.annual : ""
                }`}
              ></div>
            </button>
            <span
              className={billingCycle === "annual" ? styles.activeLabel : ""}
            >
              Annual <span className={styles.saveBadge}>Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className={styles.plans}>
          {plans.map((plan, index) => {
            const isCurrent =
              !!user && !!user.hasSelectedPlan && user.plan === plan.id;

            return (
              <div
                key={index}
                className={`${styles.planCard} ${
                  plan.popular ? styles.popular : ""
                } ${isCurrent ? styles.currentSelectedPlan : ""}`}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>
                    <FiZap /> Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div className={styles.currentPlanIndicator}>
                    ✓ Current Plan
                  </div>
                )}

                <div className={styles.planHeader}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planDescription}>{plan.description}</p>

                  <div className={styles.price}>
                    <span className={styles.priceAmount}>
                      {billingCycle === "monthly"
                        ? plan.monthlyPrice
                        : plan.annualPrice}
                    </span>
                    <span className={styles.priceDescription}>
                      {plan.priceDescription}
                    </span>
                  </div>
                </div>

                <div className={styles.planFeatures}>
                  <ul className={styles.featuresList}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className={styles.featureItem}>
                        {feature.included ? (
                          <FiCheck className={styles.featureIcon} />
                        ) : (
                          <FiX
                            className={`${styles.featureIcon} ${styles.disabled}`}
                          />
                        )}
                        <span
                          className={
                            feature.included ? "" : styles.disabledText
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.planFooter}>
                  {/* Simple "Contact Sales" link for Enterprise - ABOVE button */}
                  {plan.hasContactOption && !isCurrent && (
                    <div className={styles.contactOption}>
                      <a
                        href="/contact"
                        className={styles.contactLink}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/contact");
                        }}
                      >
                        Need 50+ users? Contact Sales
                      </a>
                    </div>
                  )}

                  <button
                    className={`${styles.ctaButton} ${
                      plan.ctaVariant === "primary"
                        ? styles.primary
                        : styles.secondary
                    } ${isCurrent ? styles.currentPlanButton : ""}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loadingPlan === plan.id || isCurrent}
                  >
                    {loadingPlan === plan.id
                      ? "Processing..."
                      : isCurrent
                        ? "✓ Current Plan"
                        : plan.ctaText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing FAQ */}
        <div className={styles.faq}>
          <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4>Can I change plans later?</h4>
              <p>
                Yes, you can upgrade or downgrade at any time. Changes take
                effect immediately.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4>Is there a free trial?</h4>
              <p>
                Professional plan includes a 7-day free trial, Enterprise
                includes 30 days. No credit card required to start.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4>What payment methods do you accept?</h4>
              <p>
                We accept all major credit cards, PayPal, and bank transfers for
                annual plans.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4>Can I cancel anytime?</h4>
              <p>
                Yes, you can cancel your subscription at any time with no
                penalties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
