import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import styles from "./signup.module.css";
import { showError, showSuccess } from "../../utils/swal";
import { API_URL } from "../../config/api";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameChecking, setNameChecking] = useState(false);
  const emailDebounceRef = useRef(null);
  const nameDebounceRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    newsletter: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updated);

    if (name === "password") {
      let s = 0;
      if (value.length >= 8) s += 25;
      if (/[A-Z]/.test(value)) s += 25;
      if (/[0-9]/.test(value)) s += 25;
      if (/[^A-Za-z0-9]/.test(value)) s += 25;
      setPasswordStrength(s);
    }

    if (name === "email") {
      setEmailError("");
      clearTimeout(emailDebounceRef.current);
      const trimmed = value.trim();
      if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setEmailChecking(true);
        emailDebounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch(`${API_URL}/auth/check-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: trimmed }),
            });
            const data = await res.json();
            if (data.exists) setEmailError("This email is already registered.");
          } catch (_) {}
          setEmailChecking(false);
        }, 600);
      }
    }

    if (name === "firstName" || name === "lastName") {
      setNameError("");
      clearTimeout(nameDebounceRef.current);
      const first = (name === "firstName" ? value : updated.firstName).trim();
      const last = (name === "lastName" ? value : updated.lastName).trim();
      if (first && last) {
        setNameChecking(true);
        nameDebounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch(`${API_URL}/auth/check-name`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ firstName: first, lastName: last }),
            });
            const data = await res.json();
            if (data.exists) setNameError("This name is already registered.");
          } catch (_) {}
          setNameChecking(false);
        }, 600);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      await showError("Passwords do not match!");
      return;
    }
    if (emailError) {
      await showError("Please use a different email address.");
      return;
    }
    if (nameError) {
      await showError(
        "This name is already registered. Please use a different name.",
      );
      return;
    }
    if (!formData.acceptTerms) {
      await showError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresApproval) {
          await showSuccess(
            `Thank you, ${formData.firstName}! Your registration has been submitted and is awaiting admin approval.`,
          );
          navigate("/login?message=registration-pending");
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("auth-changed"));
          await showSuccess(
            `Welcome, ${formData.firstName}! Registration successful.`,
          );
          navigate("/pricing");
        }
      } else {
        await showError(data.error || "Registration failed");
      }
    } catch {
      await showError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = () => {
    if (passwordStrength < 50) return "#ef4444";
    if (passwordStrength < 75) return "#f59e0b";
    return "#10b981";
  };
  const strengthText = () => {
    if (passwordStrength < 25) return "Very weak";
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 75) return "Good";
    if (passwordStrength < 100) return "Strong";
    return "Very strong";
  };

  const pw = formData.password;
  const reqs = [
    { label: "8+ characters", met: pw.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(pw) },
    { label: "Number", met: /[0-9]/.test(pw) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(pw) },
  ];

  return (
    <div className={styles.page}>
      {/* ── Left: form side ── */}
      <div className={styles.formPanelLeft}>
        <Link to="/" className={styles.backLink}>
          <FiArrowLeft /> Back to home
        </Link>

        <div className={styles.formWrapWide}>
          <h1 className={styles.formHeading}>Create your account</h1>
          <p className={styles.formSubtext}>
            Start your free trial. No credit card required.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Name row */}
            <div className={styles.nameGrid}>
              <div className={styles.field}>
                <label htmlFor="firstName" className={styles.label}>
                  First name
                </label>
                <div className={styles.inputWrap}>
                  <FiUser className={styles.inputLeadIcon} />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    className={`${styles.input} ${nameError ? styles.inputError : ""}`}
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName" className={styles.label}>
                  Last name
                </label>
                <div className={styles.inputWrap}>
                  <FiUser className={styles.inputLeadIcon} />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    className={`${styles.input} ${nameError ? styles.inputError : ""}`}
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            {nameChecking && (
              <p className={styles.fieldChecking}>Checking name...</p>
            )}
            {nameError && <p className={styles.fieldError}>{nameError}</p>}

            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputWrap}>
                <FiMail className={styles.inputLeadIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@company.com"
                  className={`${styles.input} ${emailError ? styles.inputError : ""}`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {emailChecking && (
                <p className={styles.fieldChecking}>Checking email...</p>
              )}
              {emailError && <p className={styles.fieldError}>{emailError}</p>}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrap}>
                <FiLock className={styles.inputLeadIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Create a strong password"
                  className={styles.input}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {pw && (
                <>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthFill}
                      style={{
                        width: `${passwordStrength}%`,
                        background: strengthColor(),
                      }}
                    />
                  </div>
                  <p className={styles.strengthLabel}>
                    Strength: <strong>{strengthText()}</strong>
                  </p>
                  <div className={styles.reqs}>
                    {reqs.map((r) => (
                      <span
                        key={r.label}
                        className={`${styles.req} ${r.met ? styles.met : ""}`}
                      >
                        <FiCheck style={{ fontSize: 10 }} />
                        {r.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Confirm password */}
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm password
              </label>
              <div className={styles.inputWrap}>
                <FiLock className={styles.inputLeadIcon} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  className={styles.input}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={showConfirmPassword ? "Hide" : "Show"}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className={styles.fieldError}>Passwords do not match</p>
                )}
            </div>

            {/* Checkboxes */}
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className={styles.checkbox}
                required
              />
              <span className={styles.checkText}>
                I agree to the{" "}
                <Link to="/terms" className={styles.checkLink}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className={styles.checkLink}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.checkText}>
                Send me product updates, tips, and offers via email
              </span>
            </label>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>
                  <span className={styles.btnSpinner} /> Creating account...
                </>
              ) : (
                <>
                  Create free account{" "}
                  <FiArrowRight className={styles.btnArrow} />
                </>
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>
          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.footerLink}>
              Sign in here
            </Link>
          </p>

          <div className={styles.secNote} style={{ marginTop: 20 }}>
            <span className={styles.secNoteIcon}>🔒</span>
            <div>
              <p className={styles.secNoteTitle}>Your data is secure</p>
              <p className={styles.secNoteText}>
                We use bank-level encryption and never share your personal
                information with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: dark benefits panel ── */}
      <div className={styles.darkPanel} style={{ width: "42%" }}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.panelInner}>
          <div className={styles.brand}>
            <div
              className={styles.brandIcon}
              style={{ fontWeight: 800, fontSize: 16 }}
            >
              S
            </div>
            <span className={styles.brandName}>SaaSPlatform</span>
          </div>

          <h2 className={styles.panelHeading}>
            Start your free
            <br />
            trial today
          </h2>

          <div className={styles.benefitItem}>
            <span className={styles.benefitEmoji}>🚀</span>
            <div>
              <p className={styles.benefitTitle}>Free trial included</p>
              <p className={styles.benefitDesc}>
                Full access to all features. No credit card required.
              </p>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitEmoji}>💼</span>
            <div>
              <p className={styles.benefitTitle}>For teams of all sizes</p>
              <p className={styles.benefitDesc}>
                From startups to enterprises. Scale as you grow.
              </p>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitEmoji}>🔄</span>
            <div>
              <p className={styles.benefitTitle}>Cancel anytime</p>
              <p className={styles.benefitDesc}>
                No lock-in contracts. Cancel with one click.
              </p>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitEmoji}>👥</span>
            <div>
              <p className={styles.benefitTitle}>5,000+ teams onboarded</p>
              <p className={styles.benefitDesc}>
                Join thousands of successful teams worldwide.
              </p>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statNum}>99.9%</p>
              <p className={styles.statLabel}>Uptime</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statNum}>24/7</p>
              <p className={styles.statLabel}>Support</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statNum}>5K+</p>
              <p className={styles.statLabel}>Teams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
