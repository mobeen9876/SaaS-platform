import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiEdit,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiLock,
  FiShield,
  FiPackage,
  FiActivity,
  FiArrowLeft,
  FiUsers,
} from "react-icons/fi";
import styles from "./profile.module.css";
import { showError, showSuccess, showConfirm } from "../utils/swal";
import { formatLongDate, isValidDate } from "../utils/dateUtils";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setProfileData({
      firstName: parsedUser.firstName || "",
      lastName: parsedUser.lastName || "",
      email: parsedUser.email || "",
    });
    setLoading(false);
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!profileData.firstName || !profileData.lastName) {
      await showError("First name and last name are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local storage
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditing(false);

        await showSuccess("Profile updated successfully!");
      } else {
        await showError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      await showError("Failed to update profile. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      await showError("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      await showError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      await showError("New password must be at least 6 characters long");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setChangingPassword(false);

        await showSuccess("Password changed successfully!");
      } else {
        await showError(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      await showError("Failed to change password. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/user/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        await showSuccess("Account deleted successfully");
        navigate("/");
      } else {
        await showError(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      await showError("Failed to delete account. Please try again.");
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/dashboard")}
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <h1 className={styles.title}>My Profile</h1>
        </div>

        <div className={styles.profileContent}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
              <div className={styles.userInfo}>
                <h2>
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className={styles.email}>{user?.email}</p>
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${styles[user?.role]}`}>
                    {user?.role === "admin" ? <FiShield /> : <FiUser />}
                    {user?.role}
                  </span>
                  <span className={`${styles.badge} ${styles.plan}`}>
                    <FiPackage />
                    {user?.plan}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className={styles.profileSection}>
              <div className={styles.sectionHeader}>
                <h3>Profile Information</h3>
                {!editing ? (
                  <button
                    className={styles.editButton}
                    onClick={() => setEditing(true)}
                  >
                    <FiEdit />
                    Edit
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveProfile}
                    >
                      <FiSave />
                      Save
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setEditing(false);
                        setProfileData({
                          firstName: user?.firstName || "",
                          lastName: user?.lastName || "",
                          email: user?.email || "",
                        });
                      }}
                    >
                      <FiX />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <div className={styles.displayValue}>{user?.firstName}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <div className={styles.displayValue}>{user?.lastName}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <div className={styles.displayValue}>
                    <FiMail />
                    {user?.email}
                    <span className={styles.note}>(Cannot be changed)</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Member Since</label>
                  <div className={styles.displayValue}>
                    <FiCalendar />
                    {formatLongDate(user?.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className={styles.profileSection}>
              <div className={styles.sectionHeader}>
                <h3>Security</h3>
                {!changingPassword ? (
                  <button
                    className={styles.editButton}
                    onClick={() => setChangingPassword(true)}
                  >
                    <FiLock />
                    Change Password
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button
                      className={styles.saveButton}
                      onClick={handleChangePassword}
                    >
                      <FiSave />
                      Update Password
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      <FiX />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {changingPassword && (
                <div className={styles.passwordForm}>
                  <div className={styles.formGroup}>
                    <label>Current Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => togglePasswordVisibility("current")}
                      >
                        {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>New Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Confirm New Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className={styles.profileSection}>
              <div className={styles.sectionHeader}>
                <h3>Account Actions</h3>
              </div>

              <div className={styles.dangerZone}>
                <div className={styles.dangerAction}>
                  <div>
                    <h4>Delete Account</h4>
                    <p>
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    className={styles.dangerButton}
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className={styles.activityCard}>
            <h3>
              <FiActivity />
              Account Activity
            </h3>
            <div className={styles.activityList}>
              {isValidDate(user?.createdAt) && (
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    <FiUser />
                  </div>
                  <div className={styles.activityContent}>
                    <h4>Account Created</h4>
                    <p>{formatLongDate(user.createdAt)}</p>
                  </div>
                </div>
              )}

              {isValidDate(user?.lastLogin) && (
                <div className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    <FiActivity />
                  </div>
                  <div className={styles.activityContent}>
                    <h4>Last Login</h4>
                    <p>{formatLongDate(user.lastLogin)}</p>
                  </div>
                </div>
              )}

              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <FiPackage />
                </div>
                <div className={styles.activityContent}>
                  <h4>Current Plan</h4>
                  <p>{user?.plan} plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
