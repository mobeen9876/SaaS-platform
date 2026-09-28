import styles from "./features.module.css";
import {
  FiZap,
  FiUsers,
  FiShield,
  FiBarChart,
  FiClock,
  FiGlobe,
  FiTrendingUp,
} from "react-icons/fi";

export default function FeaturesPage() {
  const features = [
    {
      icon: <FiZap />,
      title: "Lightning Fast",
      description:
        "Process data in real-time with our optimized infrastructure. No more waiting for reports.",
    },
    {
      icon: <FiUsers />,
      title: "Team Collaboration",
      description:
        "Work together seamlessly with role-based permissions, comments, and real-time updates.",
    },
    {
      icon: <FiShield />,
      title: "Enterprise Security",
      description:
        "Bank-level security with SOC 2 compliance, encryption, and regular security audits.",
    },
    {
      icon: <FiBarChart />,
      title: "Advanced Analytics",
      description:
        "Deep insights with customizable dashboards and predictive analytics.",
    },
    {
      icon: <FiClock />,
      title: "Time Saving",
      description:
        "Automate repetitive tasks and save up to 20 hours per week for your team.",
    },
    {
      icon: <FiGlobe />,
      title: "Global Infrastructure",
      description:
        "Deployed across 12 regions worldwide for maximum performance and reliability.",
    },
  ];

  const stats = [
    { icon: <FiTrendingUp />, number: "99.9%", label: "Uptime" },
    { icon: <FiUsers />, number: "5K+", label: "Active Users" },
    { icon: <FiClock />, number: "2M+", label: "Tasks Managed" },
    { icon: <FiGlobe />, number: "24/7", label: "Support" },
  ];

  return (
    <section className={styles.featuresSection}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Everything You Need to{" "}
            <span className={styles.highlight}>Succeed</span>
          </h2>
          <p className={styles.subtitle}>
            A comprehensive suite of tools designed to streamline your workflow
            and boost productivity.
          </p>
        </div>

        {/* Feature Cards */}
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.iconContainer}>{feature.icon}</div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
