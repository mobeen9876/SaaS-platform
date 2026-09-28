import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiShield } from "react-icons/fi";
import styles from "./forgotPassword.module.css";
import { API_URL } from "../../config/api";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setOtpSent(true);

        // Show OTP in development
        if (data.otp) {
          console.log("🔢 Admin OTP:", data.otp);
          setMessage(
            `${data.message}\n\n🔢 Development OTP: ${data.otp}\n(Check console for details)`,
          );
        }
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Admin forgot password error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <FiShield className={styles.icon} />
          </div>
          <h1>Admin Password Reset</h1>
          <p>Enter your admin email to receive a password reset OTP</p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Admin Email Address</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className={styles.input}
                />
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </button>
          </form>
        ) : (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✅</div>
            <h2>OTP Sent!</h2>
            <div className={styles.successMessage}>
              {message.split("\n").map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <Link to="/admin-reset-password" className={styles.continueButton}>
              Continue to Reset Password
            </Link>
          </div>
        )}

        <div className={styles.links}>
          <Link to="/login" className={styles.backLink}>
            <FiArrowLeft />
            Back to Login
          </Link>
        </div>

        <div className={styles.helpText}>
          <p>
            <strong>For Development:</strong> OTP codes are logged to the
            browser console. No real emails are sent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
