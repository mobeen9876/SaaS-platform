import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiTarget,
  FiEye,
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiCheck,
  FiGlobe,
  FiShield,
  FiCode,
  FiHeart,
  FiArrowRight,
} from "react-icons/fi";
import styles from "./about.module.css";

export default function AboutPage() {
  const [activeValue, setActiveValue] = useState(0);

  const values = [
    {
      id: 0,
      title: "Innovation",
      icon: <FiTrendingUp />,
      description: "Constantly pushing boundaries with cutting-edge technology",
    },
    {
      id: 1,
      title: "Excellence",
      icon: <FiAward />,
      description:
        "Delivering premium quality in every feature and interaction",
    },
    {
      id: 2,
      title: "Community",
      icon: <FiUsers />,
      description: "Building a thriving ecosystem of developers and businesses",
    },
    {
      id: 3,
      title: "Integrity",
      icon: <FiShield />,
      description: "Transparent, honest, and ethical in everything we do",
    },
  ];

  const stats = [
    { number: "10K+", label: "Active Users", suffix: "" },
    { number: "99.9", label: "Uptime", suffix: "%" },
    { number: "24/7", label: "Support", suffix: "" },
    { number: "150", label: "Countries", suffix: "+" },
  ];

  const teamMembers = [
    { name: "Muhammad Mobeen", role: "CEO & Founder", expertise: "Tech Strategy" },
    { name: "Muhammad Ali", role: "CTO", expertise: "Software Architecture" },
    { name: "Muhammad Rehman", role: "Product Lead", expertise: "UX Design" },
    { name: "Muhammad Raza", role: "Head of Engineering", expertise: "DevOps" },
  ];

  return (
    <div className={styles.aboutContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span>Our Story</span>
          </div>
          <h1 className={styles.title}>
            Building the Future of{" "}
            <span className={styles.highlight}>SaaS</span> Solutions
          </h1>
          <p className={styles.subtitle}>
            We're on a mission to transform how businesses leverage technology.
            Our platform combines cutting-edge innovation with enterprise-grade
            reliability.
          </p>
          <div className={styles.heroStats}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.statNumber}>
                  {stat.number}
                  <span className={styles.statSuffix}>{stat.suffix}</span>
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={styles.missionSection}>
        <div className={styles.grid2Col}>
          <div className={styles.missionCard}>
            <div className={styles.iconWrapper}>
              <FiTarget />
            </div>
            <h3 className={styles.cardTitle}>Our Mission</h3>
            <p className={styles.cardText}>
              To democratize access to enterprise-grade tools, enabling
              businesses of all sizes to compete and thrive in the digital
              economy.
            </p>
          </div>
          <div className={styles.missionCard}>
            <div className={styles.iconWrapper}>
              <FiEye />
            </div>
            <h3 className={styles.cardTitle}>Our Vision</h3>
            <p className={styles.cardText}>
              A world where every business has access to powerful, affordable,
              and intuitive software that accelerates their growth and
              innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className={styles.valuesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Core Values</h2>
          <p className={styles.sectionSubtitle}>
            These principles guide everything we build and every decision we
            make
          </p>
        </div>

        <div className={styles.valuesGrid}>
          {values.map((value) => (
            <div
              key={value.id}
              className={`${styles.valueCard} ${
                activeValue === value.id ? styles.active : ""
              }`}
              onMouseEnter={() => setActiveValue(value.id)}
            >
              <div className={styles.valueIcon}>{value.icon}</div>
              <h4 className={styles.valueTitle}>{value.title}</h4>
              <p className={styles.valueDescription}>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className={styles.techSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built with Modern Technology</h2>
          <p className={styles.sectionSubtitle}>
            Our tech stack ensures performance, scalability, and reliability
          </p>
        </div>

        <div className={styles.techGrid}>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>
              <FiCode />
            </div>
            <h4 className={styles.techTitle}>React.js</h4>
            <p className={styles.techDesc}>
              Modern component-based architecture for interactive UIs
            </p>
            <div className={styles.techFeatures}>
              <span>
                <FiCheck /> Reusable Components
              </span>
              <span>
                <FiCheck /> Virtual DOM
              </span>
              <span>
                <FiCheck /> Hooks & Context
              </span>
            </div>
          </div>

          <div className={styles.techCard}>
            <div className={styles.techIcon}>
              <FiGlobe />
            </div>
            <h4 className={styles.techTitle}>Node.js & Express</h4>
            <p className={styles.techDesc}>
              High-performance backend with real-time capabilities
            </p>
            <div className={styles.techFeatures}>
              <span>
                <FiCheck /> RESTful APIs
              </span>
              <span>
                <FiCheck /> Middleware Support
              </span>
              <span>
                <FiCheck /> Scalable Architecture
              </span>
            </div>
          </div>

          <div className={styles.techCard}>
            <div className={styles.techIcon}>
              <FiTrendingUp />
            </div>
            <h4 className={styles.techTitle}>MongoDB</h4>
            <p className={styles.techDesc}>
              Flexible NoSQL database for modern applications
            </p>
            <div className={styles.techFeatures}>
              <span>
                <FiCheck /> Document Storage
              </span>
              <span>
                <FiCheck /> Horizontal Scaling
              </span>
              <span>
                <FiCheck /> Aggregation Framework
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Meet Our Leadership</h2>
          <p className={styles.sectionSubtitle}>
            The passionate minds driving our vision forward
          </p>
        </div>

        <div className={styles.teamGrid}>
          {teamMembers.map((member, index) => (
            <div key={index} className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h4 className={styles.teamName}>{member.name}</h4>
              <p className={styles.teamRole}>{member.role}</p>
              <div className={styles.expertise}>
                <FiCheck /> {member.expertise}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <div className={styles.ctaIcon}>
            <FiHeart />
          </div>
          <h2 className={styles.ctaTitle}>
            Join Thousands of Successful Teams
          </h2>
          <p className={styles.ctaText}>
            Start building with our platform today and experience the difference
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/signup" className={styles.primaryButton}>
              Get Started Free <FiArrowRight />
            </Link>
            <Link to="/contact" className={styles.secondaryButton}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className={styles.footerSection}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} SaaS Platform. All rights reserved.
        </p>
        <div className={styles.footerLinks}>
          <Link to="/privacy">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms">Terms of Service</Link>
          <span>•</span>
          <Link to="/contact">Contact</Link>
        </div>
      </section>
    </div>
  );
}
