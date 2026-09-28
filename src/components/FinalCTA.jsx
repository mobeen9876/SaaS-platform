import React from "react";
import { Link } from "react-router-dom";
import styles from "./finalcta.module.css";
import { FiArrowRight, FiCheck, FiZap, FiUsers } from "react-icons/fi";

const FinalCTA = () => {
  return (
    <section className={styles.finalCTA}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Start Your <span className={styles.highlight}>Free Trial</span>{" "}
            Today
          </h2>
          <p className={styles.subtitle}>
            Join 5,000+ teams who have already transformed their workflow with
            our platform. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Main CTA Card */}
        <div className={styles.ctaCard}>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>
              Everything you need to scale your business
            </h3>

            <div className={styles.features}>
              <div className={styles.feature}>
                <FiCheck className={styles.featureIcon} />
                <span>Free trial included</span>
              </div>
              <div className={styles.feature}>
                <FiCheck className={styles.featureIcon} />
                <span>No credit card required</span>
              </div>
              <div className={styles.feature}>
                <FiCheck className={styles.featureIcon} />
                <span>Cancel anytime</span>
              </div>
              <div className={styles.feature}>
                <FiCheck className={styles.featureIcon} />
                <span>Full feature access</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className={styles.buttons}>
              <Link to="/signup" className={styles.primaryButton}>
                Start Free Trial
                <FiArrowRight />
              </Link>
              <Link to="/contact" className={styles.secondaryButton}>
                Schedule a Demo
              </Link>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <FiUsers className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>5,000+</span>
                  <span className={styles.statLabel}>Happy Teams</span>
                </div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <FiZap className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>99.9%</span>
                  <span className={styles.statLabel}>Uptime</span>
                </div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>⭐</div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>4.9/5</span>
                  <span className={styles.statLabel}>Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className={styles.visual}>
            <div className={styles.floatingElements}>
              <div className={styles.floatingCard1}>
                <span className={styles.floatingCardIcon}>🚀</span>
                <div>
                  <div className={styles.floatingCardTitle}>Get Started</div>
                  <div className={styles.floatingCardText}>in 2 minutes</div>
                </div>
              </div>
              <div className={styles.floatingCard2}>
                <span className={styles.floatingCardIcon}>💬</span>
                <div>
                  <div className={styles.floatingCardTitle}>24/7 Support</div>
                  <div className={styles.floatingCardText}>
                    Always here to help
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Trust Badges */}
        <div className={styles.trustBadges}>
          <p className={styles.trustText}>Trusted by industry leaders</p>
          <div className={styles.badges}>
            <div className={styles.badgeItem}>SOC 2</div>
            <div className={styles.badgeItem}>GDPR</div>
            <div className={styles.badgeItem}>ISO 27001</div>
            <div className={styles.badgeItem}>HIPAA</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
