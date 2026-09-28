import React from "react";
import styles from "./howItWorks.module.css";
import { FiUserPlus, FiSettings, FiBarChart } from "react-icons/fi";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: <FiUserPlus />,
      title: "Sign Up in Seconds",
      description:
        "Create your free account in under 60 seconds. No credit card required to start.",
    },
    {
      number: "02",
      icon: <FiSettings />,
      title: "Connect Your Tools",
      description:
        "Integrate with your existing workflow tools in just a few clicks.",
    },
    {
      number: "03",
      icon: <FiBarChart />,
      title: "See Results Instantly",
      description: "Get actionable insights and automate tasks from day one.",
    },
  ];

  return (
    <section className={styles.howItWorks}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Get Started in{" "}
            <span className={styles.highlight}>3 Easy Steps</span>
          </h2>
          <p className={styles.subtitle}>
            Join thousands of teams who have streamlined their workflow with our
            platform.
          </p>
        </div>

        {/* Steps */}
        <div className={styles.steps}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={styles.cta}>
          <button className={styles.ctaButton}>Start Your Free Trial</button>
          <p className={styles.ctaNote}>
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
