import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import {
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiInstagram,
  FiGithub,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Features", path: "/features" },
      { label: "Pricing", path: "/pricing" },
      { label: "API", path: "/api" },
      { label: "Documentation", path: "/docs" },
      { label: "Status", path: "/status" },
    ],
    Company: [
      { label: "About", path: "/about" },
      { label: "Blog", path: "/blog" },
      { label: "Careers", path: "/careers" },
      { label: "Press", path: "/press" },
      { label: "Partners", path: "/partners" },
    ],
    Resources: [
      { label: "Help Center", path: "/help" },
      { label: "Community", path: "/community" },
      { label: "Contact", path: "/contact" },
      { label: "Privacy", path: "/privacy" },
      { label: "Terms", path: "/terms" },
    ],
    Solutions: [
      { label: "Marketing", path: "/solutions/marketing" },
      { label: "Sales", path: "/solutions/sales" },
      { label: "Support", path: "/solutions/support" },
      { label: "Engineering", path: "/solutions/engineering" },
      { label: "Operations", path: "/solutions/operations" },
    ],
  };

  const socialLinks = [
    { icon: <FiTwitter />, label: "Twitter", url: "https://twitter.com" },
    { icon: <FiFacebook />, label: "Facebook", url: "https://facebook.com" },
    { icon: <FiLinkedin />, label: "LinkedIn", url: "https://linkedin.com" },
    { icon: <FiInstagram />, label: "Instagram", url: "https://instagram.com" },
    { icon: <FiGithub />, label: "GitHub", url: "https://github.com" },
  ];

  const contactInfo = [
    { icon: <FiMail />, text: "support@example.com" },
    { icon: <FiPhone />, text: "+92 300 1234567" },
    { icon: <FiMapPin />, text: "Karachi, Pakistan" },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Top Section */}
        <div className={styles.topSection}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <span>S</span>
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoMain}>SaaS</span>
                <span className={styles.logoAccent}>Platform</span>
              </div>
            </Link>
            <p className={styles.tagline}>
              Empowering teams worldwide with powerful, intuitive tools to
              streamline workflows and drive growth.
            </p>

            <div className={styles.socialLinks}>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className={styles.socialIcon}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className={styles.linksColumn}>
              <h3 className={styles.columnTitle}>{category}</h3>
              <ul className={styles.linksList}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div className={styles.contactColumn}>
            <h3 className={styles.columnTitle}>Contact Us</h3>
            <ul className={styles.contactList}>
              {contactInfo.map((item, index) => (
                <li key={index} className={styles.contactItem}>
                  <span className={styles.contactIcon}>{item.icon}</span>
                  <span className={styles.contactText}>{item.text}</span>
                </li>
              ))}
            </ul>

            <div className={styles.newsletter}>
              <h4 className={styles.newsletterTitle}>Stay Updated</h4>
              <p className={styles.newsletterText}>
                Subscribe to our newsletter for the latest updates.
              </p>
              <form className={styles.newsletterForm}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={styles.newsletterInput}
                />
                <button type="submit" className={styles.newsletterButton}>
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <div className={styles.copyright}>
            © {currentYear} SaaSPro. All rights reserved.
          </div>

          <div className={styles.legalLinks}>
            <Link to="/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={styles.legalLink}>
              Terms of Service
            </Link>
            <Link to="/cookies" className={styles.legalLink}>
              Cookie Policy
            </Link>
            <Link to="/sitemap" className={styles.legalLink}>
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
