import { Link } from "react-router-dom";
import { FiCheck, FiPlay, FiArrowRight } from "react-icons/fi";
import styles from "./hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      {/* Background decorative elements */}
      <div className={styles.bgCircle1}></div>
      <div className={styles.bgCircle2}></div>

      <div className={styles.container}>
        {/* Left Content */}
        <div className={styles.content}>
          {/* Trust badge */}
          <div className={styles.badge}>
            🚀 Trusted by 5,000+ businesses worldwide
          </div>

          {/* Main headline */}
          <h1 className={styles.headline}>
            The Complete Platform for{" "}
            <span className={styles.highlight}>Modern Teams</span>
          </h1>

          {/* Subheadline */}
          <p className={styles.subheadline}>
            Streamline your workflow, automate repetitive tasks, and collaborate
            seamlessly with our all-in-one SaaS solution designed for
            growth-focused teams.
          </p>

          {/* CTA Buttons */}
          <div className={styles.buttons}>
            <Link to="/signup" className={styles.primaryBtn}>
              Start Free Trial
              <FiArrowRight />
            </Link>
          </div>

          {/* Benefits list */}
          <div className={styles.benefits}>
            <div className={styles.benefitItem}>
              <FiCheck className={styles.checkIcon} />
              <span>No credit card required</span>
            </div>
            <div className={styles.benefitItem}>
              <FiCheck className={styles.checkIcon} />
              <span>Free onboarding & 24/7 support</span>
            </div>
            <div className={styles.benefitItem}>
              <FiCheck className={styles.checkIcon} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Right Visual */}
        <div className={styles.visual}>
          <div className={styles.dashboardMockup}>
            <div className={styles.dashboardHeader}>
              <div className={styles.dots}>
                <span className={styles.dotRed}></span>
                <span className={styles.dotYellow}></span>
                <span className={styles.dotGreen}></span>
              </div>
              <span>Analytics Dashboard</span>
              <div className={styles.userAvatar}>S</div>
            </div>

            <div className={styles.dashboardContent}>
              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <h4>Active Users</h4>
                  <h2>2,453</h2>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <h4>Tasks Completed</h4>
                  <h2>1,247</h2>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={styles.chartArea}>
                <div className={styles.chart}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
