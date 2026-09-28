/**
 * Smart Login Page
 *
 * Flow:
 *  Step 1 — User enters email → hits /api/auth/check-email-role
 *            • Not found   → show "no account" error, stay on step 1
 *            • role=user   → transition to step 2 with USER theme
 *            • role=admin  → transition to step 2 with ADMIN theme
 *  Step 2 — Password field appears, panel morphs to match role
 *            • Submits to /api/auth/login, handles all existing edge cases
 */

import { useState, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiArrowRight,
  FiShield,
  FiUser,
} from "react-icons/fi";
import styles from "./Login.module.css";
import { showError, showSuccess } from "../../utils/swal";
import { API_URL } from "../../config/api";

/* ─── tiny helpers ──────────────────────────────────── */
const ADMIN_PANEL = {
  gradient: "linear-gradient(150deg,#0f0e2e 0%,#1e1b4b 50%,#312e81 100%)",
  heading: "Administrator\nControl Panel",
  sub: "Manage users, review submissions, configure system settings, and monitor platform analytics.",
  trust: [
    { color: "#f87171", text: "Restricted access only" },
    { color: "#fbbf24", text: "All actions are logged" },
    { color: "#34d399", text: "Session expires in 8 hours" },
  ],
};

const USER_PANEL = {
  gradient: "linear-gradient(150deg,#1e1b4b 0%,#312e81 48%,#4c1d95 100%)",
  heading: "Your workspace,\nready when you are.",
  sub: "Sign in to access your dashboard, manage your team, and pick up exactly where you left off.",
  trust: [
    { color: "#34d399", text: "256-bit encryption" },
    { color: "#60a5fa", text: "99.9% uptime SLA" },
    { color: "#f472b6", text: "GDPR compliant" },
  ],
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // step: "email" | "password"
  const [step, setStep] = useState("email");
  const [role, setRole] = useState(null); // null | "user" | "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [pendingPassword, setPendingPassword] = useState(null);
  const pollRef = useRef(null);
  const passwordRef = useRef(null);

  const panel = role === "admin" ? ADMIN_PANEL : USER_PANEL;

  /* pending approval polling */
  useEffect(() => {
    if (!pendingEmail || !pendingPassword) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: pendingEmail,
            password: pendingPassword,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          clearInterval(pollRef.current);
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("auth-changed"));
          navigate("/dashboard");
        }
      } catch (_) {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [pendingEmail, pendingPassword, navigate]);

  /* query string / state messages */
  useEffect(() => {
    if (searchParams.get("message") === "registration-pending") {
      showError("Your registration is pending admin approval.");
    }
    if (location.state?.message) {
      showSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [searchParams, location.state]);

  /* focus password field when step changes */
  useEffect(() => {
    if (step === "password") passwordRef.current?.focus();
  }, [step]);

  /* ── Step 1: check email ── */
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      await showError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      await showError("Please enter a valid email address");
      return;
    }

    setEmailLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/check-email-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!data.exists) {
        await showError(
          "No account found with this email. Please sign up first.",
        );
        return;
      }

      setRole(data.role); // "admin" or "user"
      setStep("password");
    } catch {
      await showError("Cannot connect to the server. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  /* ── Step 2: login ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      await showError("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("auth-changed"));
        await showSuccess(`Welcome back, ${data.user.firstName}!`);
        navigate("/dashboard");
      } else if (data.registrationStatus === "pending") {
        setPendingEmail(email.trim());
        setPendingPassword(password);
        await showError(
          "Your account is pending admin approval. You'll be redirected automatically once approved.",
        );
      } else {
        await showError(data.error || "Invalid password. Please try again.");
      }
    } catch {
      await showError("Cannot connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setRole(null);
    setPassword("");
  };

  /* ── Render ── */
  return (
    <div className={styles.page}>
      {/* ── Left dark panel — morphs between user/admin ── */}
      <div
        className={styles.darkPanel}
        style={{
          background: panel.gradient,
          transition: "background 0.6s ease",
        }}
      >
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.panelInner}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              {role === "admin" ? <FiShield /> : <FiLock />}
            </div>
            <span className={styles.brandName}>SaaSPlatform</span>
          </div>

          <h2 className={styles.panelHeading}>
            {panel.heading.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h2>
          <p className={styles.panelSub}>{panel.sub}</p>

          <div className={styles.trustList}>
            {panel.trust.map((t) => (
              <div key={t.text} className={styles.trustItem}>
                <span
                  className={styles.trustDot}
                  style={{ background: t.color }}
                />
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.formPanel}>
        <Link to="/" className={styles.backLink}>
          <FiArrowLeft /> Back to home
        </Link>

        <div className={styles.formWrap}>
          {/* Role badge — appears after email check */}
          {role && (
            <div className={styles.roleBadge} data-role={role}>
              {role === "admin" ? (
                <>
                  <FiShield /> Administrator Access
                </>
              ) : (
                <>
                  <FiUser /> Team Member
                </>
              )}
            </div>
          )}

          <h1 className={styles.formHeading}>
            {step === "email"
              ? "Welcome back"
              : role === "admin"
                ? "Admin sign in"
                : "Welcome back"}
          </h1>
          <p className={styles.formSubtext}>
            {step === "email"
              ? "Enter your email to continue"
              : `Signing in as ${email}`}
          </p>

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                  Email address
                </label>
                <div className={styles.inputWrap}>
                  <FiMail className={styles.inputLeadIcon} />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@company.com"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={emailLoading}
                style={{ marginTop: 8 }}
              >
                {emailLoading ? (
                  <span className={styles.btnSpinner} />
                ) : (
                  <>
                    Continue <FiArrowRight className={styles.btnArrow} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: Password ── */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} noValidate>
              {/* Email display (read-only) */}
              <div className={styles.field}>
                <label className={styles.label}>Email address</label>
                <div className={styles.inputWrap}>
                  <FiMail className={styles.inputLeadIcon} />
                  <input
                    type="email"
                    className={`${styles.input} ${styles.inputReadonly}`}
                    value={email}
                    readOnly
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    className={styles.changeEmailBtn}
                    onClick={goBackToEmail}
                    title="Change email"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                  <Link
                    to={
                      role === "admin"
                        ? "/admin-forgot-password"
                        : "/forgot-password"
                    }
                    className={styles.forgotLink}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className={styles.inputWrap}>
                  <FiLock className={styles.inputLeadIcon} />
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {role === "user" && (
                <div className={styles.rememberRow}>
                  <label
                    className={styles.checkRow}
                    style={{ marginBottom: 0 }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkText}>
                      Remember me for 30 days
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                className={`${styles.submitBtn} ${role === "admin" ? styles.submitBtnAdmin : ""}`}
                disabled={isLoading}
                style={{ marginTop: 20 }}
              >
                {isLoading ? (
                  <span className={styles.btnSpinner} />
                ) : (
                  <>
                    {role === "admin" ? "Sign in as admin" : "Sign in"}
                    <FiArrowRight className={styles.btnArrow} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer links */}
          {step === "email" && (
            <>
              <div className={styles.divider}>
                <span>or</span>
              </div>
              <p className={styles.footerText}>
                Don't have an account?{" "}
                <Link to="/signup" className={styles.footerLink}>
                  Create one for free
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
