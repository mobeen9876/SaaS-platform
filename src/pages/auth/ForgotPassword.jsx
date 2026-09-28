import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import styles from "./forgotPassword.module.css";
import { showError, showSuccess } from "../../utils/swal";
import { API_URL } from "../../config/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpCode, setOtpCode] = useState(""); // For development display
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);

        // Store OTP for development (will be removed in production)
        if (data.otp) {
          setOtpCode(data.otp);
          console.log("🔑 OTP (for testing):", data.otp);
        }

        await showSuccess(
          data.message ||
            "Password reset instructions have been sent to your email!",
        );
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError(
        "Cannot connect to server. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    setError("");
    setOtpCode("");
    // Automatically trigger the form submission
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  if (emailSent) {
    return (
      <div className={styles.forgotPasswordPage}>
        <div className={styles.container}>
          <Link to="/login" className={styles.backLink}>
            <FiArrowLeft />
            Back to Login
          </Link>

          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <FiCheck />
            </div>
            <h1 className={styles.title}>Check Your Email</h1>
            <p className={styles.subtitle}>
              We've sent a password reset OTP to <strong>{email}</strong>
            </p>

            {/* Development OTP Display */}
            {otpCode && process.env.NODE_ENV !== "production" && (
              <div className={styles.developmentOtp}>
                <div className={styles.otpDisplay}>
                  <h3>🔢 Development OTP:</h3>
                  <div className={styles.otpCode}>{otpCode}</div>
                  <p className={styles.otpNote}>
                    This OTP is shown for development purposes only
                  </p>
                </div>
              </div>
            )}

            <div className={styles.instructions}>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>1</span>
                <p>Check your email inbox for the OTP code</p>
              </div>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>2</span>
                <p>The OTP is valid for 10 minutes</p>
              </div>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>3</span>
                <p>
                  Click the button below to enter your OTP and reset your
                  password
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <Link
                to="/reset-password"
                className={styles.continueButton}
                state={{ email: email }}
              >
                Continue to Reset Password
              </Link>
              <button
                className={styles.resendButton}
                onClick={handleResendEmail}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className={styles.spinning} />
                    Resending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </button>
            </div>

            <div className={styles.helpText}>
              <p>
                <strong>Didn't receive the email?</strong>
              </p>
              <ul>
                <li>Check your spam/junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.container}>
        <Link to="/login" className={styles.backLink}>
          <FiArrowLeft />
          Back to Login
        </Link>

        <div className={styles.forgotPasswordCard}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <FiMail />
            </div>
            <h1 className={styles.title}>Forgot Password?</h1>
            <p className={styles.subtitle}>
              No worries! Enter your email address and we'll send you a 6-digit
              OTP to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <div className={styles.inputGroup}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(""); // Clear error when user types
                  }}
                  className={`${styles.input} ${error ? styles.inputError : ""}`}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
              </div>
              {error && (
                <div className={styles.errorMessage}>
                  <FiAlertCircle />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiRefreshCw className={styles.spinning} />
                  Sending OTP...
                </>
              ) : (
                "Send Reset OTP"
              )}
            </button>
          </form>

          <div className={styles.securityNote}>
            <div className={styles.securityIcon}>
              <FiCheck />
            </div>
            <div className={styles.securityText}>
              <h4>Secure Process</h4>
              <p>
                We'll send a 6-digit OTP to your email that expires in 10
                minutes for your security.
              </p>
            </div>
          </div>

          <div className={styles.footer}>
            <p>
              Remember your password?{" "}
              <Link to="/login" className={styles.loginLink}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
