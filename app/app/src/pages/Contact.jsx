import { useState } from "react";
import { API_URL } from "../config/api";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaLinkedin,
  FaTwitter,
  FaGithub,
  FaPaperPlane,
  FaHeadset,
  FaComments,
  FaCheckCircle,
} from "react-icons/fa";
import {
  FiSend,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiChevronRight,
  FiGlobe,
  FiCalendar,
} from "react-icons/fi";
import styles from "./contact.module.css";

const contactInfo = [
  {
    icon: <FaPhoneAlt />,
    title: "Phone Support",
    text: "+92 300 1234567",
    subtitle: "Mon-Fri, 9AM-6PM EST",
    color: "#4CAF50",
  },
  {
    icon: <FaEnvelope />,
    title: "Email",
    text: "support@example.com",
    subtitle: "Response within 4 hours",
    color: "#2196F3",
  },
  {
    icon: <FaMapMarkerAlt />,
    title: "Office Location",
    text: "Karachi, Pakistan",
    subtitle: "Remote-first company",
    color: "#FF9800",
  },
  {
    icon: <FaHeadset />,
    title: "Live Chat",
    text: "Chat with our team",
    subtitle: "Available 24/7",
    color: "#9C27B0",
  },
];

const faqs = [
  {
    question: "What's your typical response time?",
    answer:
      "We aim to respond within 1-2 business hours for urgent matters and 4 hours for general inquiries.",
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer:
      "Yes, we provide tailored solutions for enterprise clients. Contact our sales team for a custom quote.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Yes, we offer free trials on all paid plans - 7 days for Professional and 30 days for Enterprise. No credit card required.",
  },
  {
    question: "Where can I find documentation?",
    answer:
      "Visit our documentation portal for guides, API references, and tutorials.",
  },
];

const socialLinks = [
  {
    icon: <FaTwitter />,
    name: "Twitter",
    url: "https://twitter.com/saasplatform",
  },
  {
    icon: <FaLinkedin />,
    name: "LinkedIn",
    url: "https://linkedin.com/company/saasplatform",
  },
  {
    icon: <FaGithub />,
    name: "GitHub",
    url: "https://github.com/saasplatform",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
    agreeToTerms: false,
  });

  const [activeFAQ, setActiveFAQ] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setFormSubmitted(true);
        setTimeout(() => {
          setFormSubmitted(false);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            company: "",
            phone: "",
            subject: "",
            message: "",
            agreeToTerms: false,
          });
        }, 4000);
      } else {
        setSubmitError(data.error || "Failed to send message.");
      }
    } catch {
      setSubmitError("Cannot connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.contactPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span>Get in Touch</span>
          </div>
          <h1 className={styles.pageTitle}>
            Let's Build Something{" "}
            <span className={styles.highlight}>Amazing</span> Together
          </h1>
          <p className={styles.pageSubtitle}>
            Have questions? We're here to help. Our team is ready to assist you
            with implementation, pricing, or any technical questions.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className={styles.contactInfoSection}>
        <div className={styles.contactCards}>
          {contactInfo.map((item, index) => (
            <div key={index} className={styles.contactCard}>
              <div
                className={styles.contactIcon}
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </div>
              <h4 className={styles.contactTitle}>{item.title}</h4>
              <p className={styles.contactText}>{item.text}</p>
              <span className={styles.contactSubtitle}>{item.subtitle}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column - Contact Form */}
        <div className={styles.leftColumn}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                <FaComments /> Send us a Message
              </h3>
              <p className={styles.formSubtitle}>
                Fill out the form below and our team will get back to you as
                soon as possible.
              </p>
            </div>

            {formSubmitted ? (
              <div className={styles.successMessage}>
                <FaCheckCircle className={styles.successIcon} />
                <h4>Message Sent Successfully!</h4>
                <p>
                  Thank you for contacting us. We'll get back to you within 24
                  hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.contactForm}>
                <div className={styles.nameFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiUser /> First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiUser /> Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiMail /> Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div className={styles.nameFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiGlobe /> Company
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Company name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FaPhoneAlt /> Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiMessageSquare /> Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                    placeholder="Tell us about your project or question..."
                    rows="6"
                    required
                  />
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className={styles.checkbox}
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <a href="/terms" className={styles.checkboxLink}>
                        Terms of Service
                      </a>{" "}
                      and acknowledge that my data will be processed in
                      accordance with the
                      <a href="/privacy" className={styles.checkboxLink}>
                        {" "}
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                </div>

                {submitError && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  <FiSend /> {submitting ? "Sending..." : "Send Message"}{" "}
                  {!submitting && <FiChevronRight />}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column - FAQ & Social */}
        <div className={styles.rightColumn}>
          {/* FAQ Section */}
          <div className={styles.faqCard}>
            <h3 className={styles.faqTitle}>
              <FaComments /> Frequently Asked Questions
            </h3>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`${styles.faqItem} ${
                    activeFAQ === index ? styles.active : ""
                  }`}
                  onClick={() => setActiveFAQ(index)}
                >
                  <div className={styles.faqQuestion}>
                    {faq.question}
                    <span className={styles.faqToggle}>
                      {activeFAQ === index ? "−" : "+"}
                    </span>
                  </div>
                  {activeFAQ === index && (
                    <div className={styles.faqAnswer}>{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
            <a href="/faq" className={styles.faqLink}>
              View all FAQs <FiChevronRight />
            </a>
          </div>

          {/* Social Links */}
          <div className={styles.socialCard}>
            <h3 className={styles.socialTitle}>
              <FiGlobe /> Connect With Us
            </h3>
            <p className={styles.socialText}>
              Follow us on social media for updates, tips, and community
              discussions.
            </p>
            <div className={styles.socialLinks}>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <span className={styles.socialIcon}>{social.icon}</span>
                  <span className={styles.socialName}>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className={styles.newsletterCard}>
            <h3 className={styles.newsletterTitle}>
              <FaPaperPlane /> Stay Updated
            </h3>
            <p className={styles.newsletterText}>
              Subscribe to our newsletter for product updates, tips, and
              industry insights.
            </p>
            <form className={styles.newsletterForm}>
              <div className={styles.newsletterInputGroup}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className={styles.newsletterInput}
                  required
                />
                <button type="submit" className={styles.newsletterButton}>
                  Subscribe
                </button>
              </div>
              <p className={styles.newsletterNote}>
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className={styles.footerSection}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} SaaS Platform. All rights reserved.
        </p>
        <div className={styles.footerLinks}>
          <a href="/privacy">Privacy Policy</a>
          <span>•</span>
          <a href="/terms">Terms of Service</a>
          <span>•</span>
          <a href="/security">Security</a>
          <span>•</span>
          <a href="/status">Status</a>
        </div>
      </footer>
    </div>
  );
}
