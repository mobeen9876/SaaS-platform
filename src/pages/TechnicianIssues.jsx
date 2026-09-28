import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiActivity,
  FiRefreshCw,
  FiFilter,
} from "react-icons/fi";
import styles from "./aiTools.module.css";
import { showError, showSuccess } from "../utils/swal";
import { API_URL } from "../config/api";
import IssueChatButton from "../components/IssueChatButton";

const TechnicianIssues = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myIssues, setMyIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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
                    issueId,
                    message,
                  },
                }),
              );
            },
          );

          // Listen for new issue assignments — refresh the list instantly
          // so the technician never has to manually refresh the page.
          channel.bind("issue:assigned", ({ issue: newIssue }) => {
            console.log("🔔 New issue assigned:", newIssue?.title);
            setMyIssues((prev) => {
              // Guard against duplicates if the event fires more than once
              const alreadyExists = prev.some((i) => i._id === newIssue._id);
              if (alreadyExists) return prev;
              return [newIssue, ...prev];
            });
          });
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
    // Clear any stale issues immediately so a previously logged-in technician's
    // data is never visible while the new fetch is in-flight.
    setMyIssues([]);

    // Check if user is logged in
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setCurrentUser(parsedUser);

    // useEffect callbacks can't be async directly — wrap in an inner function
    const init = async () => {
      await fetchMyAssignedIssues();
      setLoading(false);
    };
    init();

    // Wipe state when the component unmounts (e.g. user navigates away or logs out)
    return () => {
      setMyIssues([]);
    };
  }, [navigate, filterStatus]);

  const fetchMyAssignedIssues = async () => {
    setLoadingIssues(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(
        `${API_URL}/ai-tools/issues/my-assigned?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMyIssues(data.issues || []);
      } else {
        await showError(data.error || "Failed to fetch issues");
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      await showError("Failed to fetch issues");
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/ai-tools/issues/${issueId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        await showSuccess("Issue status updated successfully");
        fetchMyAssignedIssues();
      } else {
        await showError(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      await showError("Failed to update status");
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
        <p>Loading...</p>
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
            <FiActivity /> My Assigned Issues
          </h1>
          <p className={styles.subtitle}>
            Issues assigned to you for resolution
          </p>
        </div>

        {/* Filter */}
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <label>
              <FiFilter /> Filter by Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* My Assigned Issues */}
        <div className={styles.myIssuesCard}>
          <div className={styles.cardHeader}>
            <h2>
              <FiActivity /> Assigned Issues ({myIssues.length})
            </h2>
            <button
              onClick={fetchMyAssignedIssues}
              className={styles.refreshButton}
              disabled={loadingIssues}
            >
              <FiRefreshCw className={loadingIssues ? styles.spinning : ""} />
              Refresh
            </button>
          </div>

          {loadingIssues ? (
            <div className={styles.loadingIssues}>
              <div className={styles.spinner}></div>
              <p>Loading your assigned issues...</p>
            </div>
          ) : myIssues.length === 0 ? (
            <div className={styles.noIssues}>
              <FiCheckCircle className={styles.noIssuesIcon} />
              <p>No issues assigned to you</p>
              <small>
                {filterStatus
                  ? "Try changing the filter"
                  : "You're all caught up!"}
              </small>
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

                  <p className={styles.issueDescription}>{issue.description}</p>

                  {issue.aiAnalysis && (
                    <div className={styles.aiAnalysisBox}>
                      <strong>🤖 AI Analysis:</strong>
                      <p>{issue.aiAnalysis}</p>
                    </div>
                  )}

                  <div className={styles.issueFooter}>
                    <div className={styles.issueInfo}>
                      <span>
                        <FiClock />{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      {issue.submittedByName && (
                        <span>
                          <FiUser /> From: {issue.submittedByName}
                        </span>
                      )}
                    </div>
                    <div className={styles.issueType}>
                      <span className={styles.typeTag}>{issue.issueType}</span>
                    </div>
                  </div>

                  {issue.submittedByEmail && (
                    <div className={styles.contactInfo}>
                      📧 Contact: {issue.submittedByEmail}
                    </div>
                  )}

                  {/* Status Update Actions */}
                  <div className={styles.issueActions}>
                    <div className={styles.statusUpdateGroup}>
                      <label>Update Status:</label>
                      <select
                        value={issue.status}
                        onChange={(e) =>
                          handleUpdateStatus(issue._id, e.target.value)
                        }
                        className={styles.statusSelect}
                        style={{
                          backgroundColor: getStatusColor(issue.status),
                        }}
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <IssueChatButton
                      issue={issue}
                      currentUserId={currentUser?._id}
                    />
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
      </div>
    </div>
  );
};

export default TechnicianIssues;
