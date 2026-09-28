import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiKey, FiArrowLeft, FiShield } from "react-icons/fi";
import styles from "./resetPassword.module.css";
import { API_URL } from "../../config/api";

const AdminResetPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.otp.length !== 6) {
      setError("OTP must be 6 digits");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/reset-password-with-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Admin reset password error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>🎉</div>
            <h1>Admin Password Reset Successful!</h1>
            <p>Your admin password has been reset successfully.</p>
            <p>Redirecting to login page...</p>
            <Link to="/login" className={styles.loginButton}>
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <FiShield className={styles.icon} />
          </div>
          <h1>Reset Admin Password</h1>
          <p>Enter the OTP sent to your admin email and your new password</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Admin Email Address</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="otp">6-Digit OTP Code</label>
            <div className={styles.inputWrapper}>
              <FiKey className={styles.inputIcon} />
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="123456"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                className={styles.input}
              />
            </div>
            <small className={styles.helpText}>
              Check your email or browser console for the OTP code
            </small>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                minLength="6"
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                minLength="6"
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
            {loading ? "Resetting Password..." : "Reset Admin Password"}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/admin-forgot-password" className={styles.backLink}>
            <FiArrowLeft />
            Back to Request OTP
          </Link>
          <Link to="/login" className={styles.loginLink}>
            Back to Login
          </Link>
        </div>

        <div className={styles.helpText}>
          <p>
            <strong>Development Mode:</strong> OTP codes are shown in the
            browser console. In production, check your email for the OTP.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
