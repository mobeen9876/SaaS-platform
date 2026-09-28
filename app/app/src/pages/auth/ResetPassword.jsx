import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiLock,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiMail,
  FiKey,
  FiAlertCircle,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import styles from "./resetPassword.module.css";
import { API_URL } from "../../config/api";
import { showError, showSuccess } from "../../utils/swal";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Get email from previous step if available
  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
      setStep(2);
      setOtpSent(true);
    }
  }, [location.state]);

  // OTP timer countdown
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(""); // Clear error when user types

    // Check password strength
    if (name === "newPassword") {
      let strength = 0;
      if (value.length >= 8) strength += 25;
      if (/[A-Z]/.test(value)) strength += 25;
      if (/[0-9]/.test(value)) strength += 25;
      if (/[^A-Za-z0-9]/.test(value)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(formData.email)) {
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
        body: JSON.stringify({ email: formData.email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setStep(2);
        setOtpTimer(600); // 10 minutes countdown
        await showSuccess("OTP has been sent to your email address!");

        // For testing purposes, show the OTP
        if (data.otp) {
          console.log("🔢 OTP (for testing):", data.otp);
        }
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setError(
        "Cannot connect to server. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (passwordStrength < 50) {
      setError("Please choose a stronger password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          data.message || "Password has been reset successfully!",
        );
        navigate("/login", {
          state: {
            message:
              "Password reset successful! You can now login with your new password.",
          },
        });
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError(
        "Cannot connect to server. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "#ef4444"; // red
    if (passwordStrength < 75) return "#f59e0b"; // yellow
    return "#10b981"; // green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Very Weak";
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 75) return "Good";
    if (passwordStrength < 100) return "Strong";
    return "Very Strong";
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.container}>
        <Link to="/login" className={styles.backLink}>
          <FiArrowLeft />
          Back to Login
        </Link>

        <div className={styles.resetPasswordCard}>
          {step === 1 ? (
            // Step 1: Enter Email
            <>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <FiMail />
                </div>
                <h1 className={styles.title}>Reset Your Password</h1>
                <p className={styles.subtitle}>
                  Enter your email address and we'll send you a 6-digit OTP to
                  reset your password.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email Address
                  </label>
                  <div className={styles.inputGroup}>
                    <FiMail className={styles.inputIcon} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
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
                    "Send OTP"
                  )}
                </button>
              </form>
            </>
          ) : (
            // Step 2: Enter OTP and New Password
            <>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <FiKey />
                </div>
                <h1 className={styles.title}>Enter OTP & New Password</h1>
                <p className={styles.subtitle}>
                  We've sent a 6-digit OTP to <strong>{formData.email}</strong>.
                  Enter the OTP and your new password below.
                </p>
                {otpTimer > 0 && (
                  <div className={styles.timerDisplay}>
                    <FiShield />
                    OTP expires in: <strong>{formatTime(otpTimer)}</strong>
                  </div>
                )}
              </div>

              <form onSubmit={handleResetPassword} className={styles.form}>
                {/* OTP Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="otp" className={styles.label}>
                    OTP Code
                  </label>
                  <div className={styles.inputGroup}>
                    <FiKey className={styles.inputIcon} />
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className={`${styles.input} ${styles.otpInput} ${error && error.includes("OTP") ? styles.inputError : ""}`}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      pattern="[0-9]{6}"
                      required
                      autoComplete="one-time-code"
                    />
                  </div>
                  <div className={styles.otpNote}>
                    <p>
                      Check your email inbox and spam folder for the OTP code.
                    </p>
                    <button
                      type="button"
                      className={styles.resendOtp}
                      onClick={() => {
                        setStep(1);
                        setOtpSent(false);
                        setOtpTimer(0);
                        setError("");
                      }}
                      disabled={otpTimer > 540} // Disable for first minute
                    >
                      {otpTimer > 540
                        ? `Resend in ${formatTime(otpTimer - 540)}`
                        : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword" className={styles.label}>
                    New Password
                  </label>
                  <div className={styles.inputGroup}>
                    <FiLock className={styles.inputIcon} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={`${styles.input} ${error && error.includes("password") ? styles.inputError : ""}`}
                      placeholder="Enter your new password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {formData.newPassword && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.strengthBar}>
                        <div
                          className={styles.strengthFill}
                          style={{
                            width: `${passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor(),
                          }}
                        />
                      </div>
                      <span className={styles.strengthText}>
                        Strength: <strong>{getPasswordStrengthText()}</strong>
                      </span>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className={styles.passwordRequirements}>
                    <p className={styles.requirementsTitle}>
                      Password must contain:
                    </p>
                    <ul className={styles.requirementsList}>
                      <li
                        className={
                          formData.newPassword.length >= 8
                            ? styles.requirementMet
                            : ""
                        }
                      >
                        <FiCheck /> At least 8 characters
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(formData.newPassword)
                            ? styles.requirementMet
                            : ""
                        }
                      >
                        <FiCheck /> One uppercase letter
                      </li>
                      <li
                        className={
                          /[0-9]/.test(formData.newPassword)
                            ? styles.requirementMet
                            : ""
                        }
                      >
                        <FiCheck /> One number
                      </li>
                      <li
                        className={
                          /[^A-Za-z0-9]/.test(formData.newPassword)
                            ? styles.requirementMet
                            : ""
                        }
                      >
                        <FiCheck /> One special character
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm New Password
                  </label>
                  <div className={styles.inputGroup}>
                    <FiLock className={styles.inputIcon} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${styles.input} ${error && error.includes("match") ? styles.inputError : ""}`}
                      placeholder="Confirm your new password"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.newPassword !== formData.confirmPassword && (
                      <div className={styles.passwordMismatch}>
                        <FiAlertCircle />
                        Passwords do not match
                      </div>
                    )}
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading || passwordStrength < 50}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className={styles.spinning} />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}

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

export default ResetPassword;
