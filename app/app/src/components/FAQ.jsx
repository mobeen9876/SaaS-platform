import React, { useState } from "react";
import styles from "./faq.module.css";
import { FiChevronDown, FiChevronUp, FiHelpCircle } from "react-icons/fi";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0); // First question open by default

  const faqItems = [
    {
      question: "How does the free trial work?",
      answer:
        "We offer free trials on all paid plans - 7 days for Professional and 30 days for Enterprise. No credit card is required to start. You get full access to all features during the trial period. You can upgrade to a paid plan at any time during or after the trial.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your subscription at any time with no penalties. When you cancel, you'll continue to have access to the paid features until the end of your current billing period.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer:
        "Yes! Annual plans come with a 20% discount compared to monthly billing. This applies to all paid plans (Professional and Enterprise).",
    },
    {
      question: "How secure is my data?",
      answer:
        "We use bank-level security with 256-bit encryption, regular security audits, and SOC 2 Type II compliance. All data is backed up daily and stored in secure, redundant servers across multiple locations.",
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer:
        "Yes, you can change your plan at any time. Upgrades take effect immediately (prorated). Downgrades take effect at the end of your current billing period.",
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer:
        "You'll receive notifications before reaching your limits. For storage and user limits, you can upgrade your plan. For API rate limits, requests will be throttled until the next billing cycle.",
    },
    {
      question: "Do you offer custom enterprise plans?",
      answer:
        "Yes! Our Enterprise plan is fully customizable. We can accommodate unlimited users, custom integrations, dedicated support, and enterprise-level security requirements. Contact our sales team for a custom quote.",
    },
    {
      question: "What support options are available?",
      answer:
        "All plans include email support with 24-hour response time. Professional and Enterprise plans include live chat support. Enterprise plans include 24/7 phone support and a dedicated account manager.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faq}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Frequently Asked <span className={styles.highlight}>Questions</span>
          </h2>
          <p className={styles.subtitle}>
            Can't find the answer you're looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className={styles.faqGrid}>
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${
                openIndex === index ? styles.open : ""
              }`}
            >
              <button
                className={styles.questionButton}
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className={styles.questionText}>{item.question}</span>
                <span className={styles.arrowIcon}>
                  {openIndex === index ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={styles.answerWrapper}>
                <div className={styles.answer}>
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className={styles.helpSection}>
          <div className={styles.helpCard}>
            <h3 className={styles.helpTitle}>Still have questions?</h3>
            <p className={styles.helpText}>
              Our support team is here to help you get the most out of our
              platform.
            </p>
            <div className={styles.helpButtons}>
              <button className={styles.helpButtonPrimary}>
                Contact Support
              </button>
              <button className={styles.helpButtonSecondary}>
                Schedule a Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
