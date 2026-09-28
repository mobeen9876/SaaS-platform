import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiKey,
  FiAlertCircle,
  FiCheckCircle,
  FiSend,
  FiClock,
  FiUser,
  FiTool,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";
import styles from "./aiTools.module.css";
import { showError, showSuccess, showConfirm } from "../utils/swal";
import { API_URL } from "../config/api";
import IssueChatButton from "../components/IssueChatButton";

const AITools = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI API Key Setup
  const [aiToolsEnabled, setAiToolsEnabled] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("groq");
  const [verifying, setVerifying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Issue Submission
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User's Issues
  const [myIssues, setMyIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Global Pusher listener for unread message notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let pusherInstance = null;

    const initPusher = async () => {
      try {
        const { initializePusher } = await import("../config/pusher");
        pusherInstance = initializePusher(token);

        // Subscribe to user's personal notification channel
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = userData.id || userData._id;

        if (userId) {
          const channel = pusherInstance.subscribe(`user-${userId}`);

          channel.bind("pusher:subscription_succeeded", () => {
            console.log(
              "✅ Subscribed to user notifications:",
              `user-${userId}`,
            );
          });

          channel.bind("pusher:subscription_error", (error) => {
            console.error("❌ User channel subscription error:", error);
          });

          channel.bind(
            "message:new",
            ({ conversationId, issueId, message }) => {
              console.log("🔔 Global notification - new message:", {
                conversationId,
                issueId,
                from: message.sender?.firstName,
              });

              // Dispatch event for chat buttons
              window.dispatchEvent(
                new CustomEvent("newChatMessage", {
                  detail: {
                    conversationId,
                    issueId, // Include issueId for matching
                    message,
                  },
                }),
              );
            },
          );
        }
      } catch (error) {
        console.error("❌ Error initializing Pusher:", error);
      }
    };

    initPusher();

    return () => {
      if (pusherInstance) {
        console.log("🔌 Disconnecting global Pusher");
        pusherInstance.disconnect();
      }
    };
  }, []);

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

    // Check AI tools status
    checkAIToolsStatus();
  }, [navigate]);

  const checkAIToolsStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAiToolsEnabled(data.aiToolsEnabled);
        setIsAdmin(data.isAdmin);
        if (data.provider) {
          setProvider(data.provider);
        }
        // If API key is needed, redirect back to menu
        if (data.needsApiKey && !data.isAdmin) {
          navigate("/ai-tools");
          return;
        }
        // Only fetch issues if tools are enabled
        if (data.aiToolsEnabled || data.isAdmin) {
          fetchMyIssues();
        }
      }
    } catch (error) {
      console.error("Error checking AI tools status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyApiKey = async () => {
    if (!apiKey.trim()) {
      await showError(
        `Please enter your ${provider === "groq" ? "Groq" : provider === "openai" ? "OpenAI" : "Gemini"} API key`,
      );
      return;
    }

    setVerifying(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/verify-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey, provider }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess("API key verified successfully!");
        setAiToolsEnabled(true);
        setShowApiKeyInput(false);
        setApiKey("");
      } else {
        await showError(data.error || "Failed to verify API key");
      }
    } catch (error) {
      console.error("Error verifying API key:", error);
      await showError("Failed to verify API key. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteApiKey = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to delete your API key? You'll need to add a new one to use AI Tools.",
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/delete-api-key`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          "API key deleted successfully! Redirecting to setup...",
        );
        setAiToolsEnabled(false);
        setShowApiKeyInput(true);
        setApiKey("");
        setProvider("groq"); // Reset to default
        // Redirect to AI Tools menu to reconfigure
        navigate("/ai-tools");
      } else {
        await showError(data.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      await showError("Failed to delete API key. Please try again.");
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();

    if (!issueTitle.trim() || !issueDescription.trim()) {
      await showError("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: issueTitle,
          description: issueDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          `Issue submitted successfully! ${data.issue.assignedTo ? `Assigned to: ${data.issue.assignedTo}` : "Pending assignment"}`,
        );
        setIssueTitle("");
        setIssueDescription("");
        fetchMyIssues(); // Refresh issues list
      } else {
        // Show detailed error with reason if available
        let errorMessage = data.error || "Failed to submit issue";

        if (data.reason) {
          errorMessage += `\n\nReason: ${data.reason}`;
        }

        if (data.provider) {
          errorMessage += `\n\nProvider: ${data.provider}`;
        }

        await showError(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
      await showError(
        "Failed to submit issue. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMyIssues = async () => {
    setLoadingIssues(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/issues/my-issues`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMyIssues(data.issues || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "assigned":
        return "#3b82f6";
      case "in-progress":
        return "#8b5cf6";
      case "resolved":
        return "#10b981";
      case "closed":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "small":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "large":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading AI Tools...</p>
      </div>
    );
  }

  return (
    <div className={styles.aiToolsPage}>
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
          <h1 className={styles.title}>
            <FiTool /> AI Issue Resolver for Organization
          </h1>
          <p className={styles.subtitle}>
            AI-powered issue resolution system - Automatically analyzes,
            categorizes, and assigns issues to the best available technician
          </p>
        </div>

        {/* Main Content */}
        {(aiToolsEnabled || isAdmin) && (
          <>
            {/* Status Banner */}
            <div className={styles.statusBanner}>
              <FiCheckCircle className={styles.statusIcon} />
              <span>
                AI Tools Active -{" "}
                {isAdmin
                  ? "Using admin Groq API key"
                  : `Using your ${provider === "groq" ? "Groq" : provider === "openai" ? "OpenAI" : "Gemini"} API key`}
              </span>
              {!isAdmin && (
                <button
                  className={styles.deleteKeyButton}
                  onClick={handleDeleteApiKey}
                  title="Delete API key and add a new one"
                >
                  🗑️ Delete API Key
                </button>
              )}
            </div>

            {/* Submit Issue Form */}
            <div className={styles.submitIssueCard}>
              <h2>
                <FiAlertCircle /> Submit New Issue
              </h2>
              <p className={styles.cardSubtitle}>
                Describe your issue and our AI will analyze it, determine
                priority, and assign it to the best available technician.
              </p>

              <form onSubmit={handleSubmitIssue} className={styles.issueForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="issueTitle">Issue Title</label>
                  <input
                    type="text"
                    id="issueTitle"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="e.g., Router not working in Conference Room A"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="issueDescription">Issue Description</label>
                  <textarea
                    id="issueDescription"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Provide detailed information about the issue..."
                    className={styles.textarea}
                    rows="6"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitButton}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className={styles.spinning} />
                      Analyzing & Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Submit Issue
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* My Issues */}
            <div className={styles.myIssuesCard}>
              <div className={styles.cardHeader}>
                <h2>
                  <FiActivity /> My Issues
                </h2>
                <button
                  onClick={fetchMyIssues}
                  className={styles.refreshButton}
                  disabled={loadingIssues}
                >
                  <FiRefreshCw
                    className={loadingIssues ? styles.spinning : ""}
                  />
                  Refresh
                </button>
              </div>

              {loadingIssues ? (
                <div className={styles.loadingIssues}>
                  <div className={styles.spinner}></div>
                  <p>Loading your issues...</p>
                </div>
              ) : myIssues.length === 0 ? (
                <div className={styles.noIssues}>
                  <FiCheckCircle className={styles.noIssuesIcon} />
                  <p>No issues submitted yet</p>
                  <small>Submit your first issue using the form above</small>
                </div>
              ) : (
                <div className={styles.issuesList}>
                  {myIssues.map((issue) => (
                    <div key={issue._id} className={styles.issueCard}>
                      <div className={styles.issueHeader}>
                        <h3>{issue.title}</h3>
                        <div className={styles.issueBadges}>
                          <span
                            className={styles.statusBadge}
                            style={{
                              backgroundColor: getStatusColor(issue.status),
                            }}
                          >
                            {issue.status}
                          </span>
                          <span
                            className={styles.priorityBadge}
                            style={{
                              backgroundColor: getPriorityColor(issue.priority),
                            }}
                          >
                            {issue.priority}
                          </span>
                        </div>
                      </div>

                      <p className={styles.issueDescription}>
                        {issue.description}
                      </p>

                      <div className={styles.issueFooter}>
                        <div className={styles.issueInfo}>
                          <span>
                            <FiClock />{" "}
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                          {issue.assignedToName && (
                            <span>
                              <FiUser /> Assigned to: {issue.assignedToName}
                            </span>
                          )}
                        </div>
                        <div className={styles.issueActions}>
                          <div className={styles.issueType}>
                            <span className={styles.typeTag}>
                              {issue.issueType}
                            </span>
                          </div>
                          <IssueChatButton
                            issue={issue}
                            currentUserId={user?._id}
                          />
                        </div>
                      </div>

                      {issue.status === "resolved" && issue.resolvedAt && (
                        <div className={styles.resolvedBanner}>
                          <FiCheckCircle />
                          Resolved on{" "}
                          {new Date(issue.resolvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AITools;
