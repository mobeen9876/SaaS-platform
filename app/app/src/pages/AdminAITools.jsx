import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiTool,
  FiActivity,
  FiRefreshCw,
  FiFilter,
  FiUsers,
  FiBarChart2,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import styles from "./adminAITools.module.css";
import { showError, showSuccess, showConfirm } from "../utils/swal";
import { API_URL } from "../config/api";

// ── Pagination helper ──────────────────────────────────────────────────────
const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
};

const IssuesTableWithPagination = ({
  allIssues,
  currentPage,
  setCurrentPage,
  ISSUES_PER_PAGE,
  styles,
  getPriorityColor,
  getStatusColor,
  handleViewIssue,
  handleDeleteIssue,
  handleUpdateStatus,
}) => {
  const totalPages = Math.ceil(allIssues.length / ISSUES_PER_PAGE);
  const paginatedIssues = allIssues.slice(
    (currentPage - 1) * ISSUES_PER_PAGE,
    currentPage * ISSUES_PER_PAGE,
  );
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <>
      <div className={styles.issuesTable}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Submitted By</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIssues.map((issue) => (
              <tr key={issue._id}>
                <td>
                  <div className={styles.issueTitle}>{issue.title}</div>
                  <div className={styles.issueDescription}>
                    {issue.description.substring(0, 60)}...
                  </div>
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <div>{issue.submittedByName}</div>
                    <small>{issue.submittedByEmail}</small>
                  </div>
                </td>
                <td>
                  <span className={styles.typeTag}>{issue.issueType}</span>
                </td>
                <td>
                  <span
                    className={styles.priorityBadge}
                    style={{
                      backgroundColor: getPriorityColor(issue.priority),
                    }}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td>
                  {issue.assignedToName ? (
                    <div className={styles.userInfo}>
                      <div>{issue.assignedToName}</div>
                      <small>{issue.assignedToEmail}</small>
                    </div>
                  ) : (
                    <span className={styles.unassigned}>Unassigned</span>
                  )}
                </td>
                <td>
                  <select
                    value={issue.status}
                    onChange={(e) =>
                      handleUpdateStatus(issue._id, e.target.value)
                    }
                    className={styles.statusSelect}
                    style={{ backgroundColor: getStatusColor(issue.status) }}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td>
                  <div className={styles.dateInfo}>
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                  <small>
                    {new Date(issue.createdAt).toLocaleTimeString()}
                  </small>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => handleViewIssue(issue)}
                      title="View Details"
                    >
                      <FiEye /> View
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteIssue(issue._id, issue.title)}
                      title="Delete Issue"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {(currentPage - 1) * ISSUES_PER_PAGE + 1}–
            {Math.min(currentPage * ISSUES_PER_PAGE, allIssues.length)} of{" "}
            {allIssues.length} issues
          </span>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First page"
            >
              «
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              title="Previous page"
            >
              ‹
            </button>

            {pageNumbers.map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={`${styles.pageBtn} ${
                    currentPage === item ? styles.pageBtnActive : ""
                  }`}
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              ),
            )}

            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              ›
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const AdminAITools = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Issues
  const [allIssues, setAllIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ISSUES_PER_PAGE = 10;

  // Statistics
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Technicians
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  // View Issue Modal
  const [viewingIssue, setViewingIssue] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Add Technician Modal
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    setUser(parsedUser);
    fetchAllIssues();
    fetchStatistics();
    fetchTechnicians();
    setLoading(false);
  }, [navigate]);

  const fetchAllIssues = async () => {
    setLoadingIssues(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterType) params.append("issueType", filterType);

      const response = await fetch(
        `${API_URL}/ai-tools/issues/all?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setAllIssues(data.issues || []);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchStatistics = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/issues/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTechnicians = async () => {
    setLoadingTechnicians(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/technicians`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTechnicians(data.technicians || []);
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
    } finally {
      setLoadingTechnicians(false);
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
        fetchAllIssues();
        fetchStatistics();
      } else {
        await showError(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      await showError("Failed to update status");
    }
  };

  const handleDeleteIssue = async (issueId, issueTitle) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete this issue: "${issueTitle}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/issues/${issueId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess("Issue deleted successfully");
        fetchAllIssues();
        fetchStatistics();
      } else {
        await showError(data.error || "Failed to delete issue");
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
      await showError("Failed to delete issue");
    }
  };

  const handleClearAllIssues = async () => {
    const confirmed = await showConfirm(
      `⚠️ WARNING: This will permanently delete ALL ${allIssues.length} issues and reset technician workloads. This action cannot be undone. Are you absolutely sure?`,
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirmed = await showConfirm(
      "This is your last chance. Click OK to permanently delete all issues.",
    );

    if (!doubleConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/issues/delete/all`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          `Successfully deleted ${data.deletedCount} issues and reset technician workloads`,
        );
        fetchAllIssues();
        fetchStatistics();
        fetchTechnicians();
      } else {
        await showError(data.error || "Failed to clear all issues");
      }
    } catch (error) {
      console.error("Error clearing all issues:", error);
      await showError("Failed to clear all issues");
    }
  };

  const handleViewIssue = (issue) => {
    setViewingIssue(issue);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingIssue(null);
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Filter out users who are already technicians
        const technicianUserIds = technicians.map((t) => t.userId._id);
        const availableUsers = data.users.filter(
          (user) =>
            !technicianUserIds.includes(user._id) && user.role !== "admin",
        );
        setAllUsers(availableUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenAddTechModal = () => {
    setShowAddTechModal(true);
    fetchAllUsers();
  };

  const handleCloseAddTechModal = () => {
    setShowAddTechModal(false);
    setSelectedUserId("");
    setSelectedSpecializations([]);
  };

  const handleToggleSpecialization = (spec) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(
        selectedSpecializations.filter((s) => s !== spec),
      );
    } else {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  const handleAddTechnician = async () => {
    if (!selectedUserId) {
      await showError("Please select a user");
      return;
    }

    if (selectedSpecializations.length === 0) {
      await showError("Please select at least one specialization");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/ai-tools/technicians`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          specializations: selectedSpecializations,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess("Technician added successfully!");
        handleCloseAddTechModal();
        fetchTechnicians();
      } else {
        await showError(data.error || "Failed to add technician");
      }
    } catch (error) {
      console.error("Error adding technician:", error);
      await showError("Failed to add technician");
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchAllIssues();
    }
  }, [filterStatus, filterPriority, filterType]);

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
        <p>Loading Admin AI Tools...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminAIToolsPage}>
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
            <FiTool /> Admin - AI Issue Resolver Dashboard
          </h1>
          <p className={styles.subtitle}>
            Monitor and manage all AI-powered issue resolutions
          </p>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiAlertCircle />
              </div>
              <div className={styles.statContent}>
                <h3>Total Issues</h3>
                <div className={styles.statValue}>{statistics.total}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiClock />
              </div>
              <div className={styles.statContent}>
                <h3>Pending</h3>
                <div className={styles.statValue}>
                  {statistics.byStatus.pending}
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiActivity />
              </div>
              <div className={styles.statContent}>
                <h3>In Progress</h3>
                <div className={styles.statValue}>
                  {statistics.byStatus.assigned +
                    statistics.byStatus.inProgress}
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiCheckCircle />
              </div>
              <div className={styles.statContent}>
                <h3>Resolved</h3>
                <div className={styles.statValue}>
                  {statistics.byStatus.resolved}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersHeader}>
            <h3>
              <FiFilter /> Filters
            </h3>
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterPriority("");
                setFilterType("");
              }}
              className={styles.clearFiltersBtn}
            >
              Clear All
            </button>
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Priorities</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Types</option>
                <option value="technical">Technical</option>
                <option value="maintenance">Maintenance</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="network">Network</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* All Issues */}
        <div className={styles.issuesCard}>
          <div className={styles.cardHeader}>
            <h2>
              <FiBarChart2 /> All Issues ({allIssues.length})
            </h2>
            <div className={styles.headerButtons}>
              <button
                onClick={handleClearAllIssues}
                className={styles.clearAllButton}
                disabled={loadingIssues || allIssues.length === 0}
              >
                <FiTrash2 />
                Clear All Issues
              </button>
              <button
                onClick={() => {
                  fetchAllIssues();
                  fetchStatistics();
                }}
                className={styles.refreshButton}
                disabled={loadingIssues}
              >
                <FiRefreshCw className={loadingIssues ? styles.spinning : ""} />
                Refresh
              </button>
            </div>
          </div>

          {loadingIssues ? (
            <div className={styles.loadingIssues}>
              <div className={styles.spinner}></div>
              <p>Loading issues...</p>
            </div>
          ) : allIssues.length === 0 ? (
            <div className={styles.noIssues}>
              <FiCheckCircle className={styles.noIssuesIcon} />
              <p>No issues found</p>
              <small>Try adjusting your filters</small>
            </div>
          ) : (
            <IssuesTableWithPagination
              allIssues={allIssues}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              ISSUES_PER_PAGE={ISSUES_PER_PAGE}
              styles={styles}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              handleViewIssue={handleViewIssue}
              handleDeleteIssue={handleDeleteIssue}
              handleUpdateStatus={handleUpdateStatus}
            />
          )}
        </div>

        {/* Technicians */}
        <div className={styles.techniciansCard}>
          <div className={styles.cardHeader}>
            <h2>
              <FiUsers /> Technicians ({technicians.length})
            </h2>
            <div className={styles.headerButtons}>
              <button
                onClick={handleOpenAddTechModal}
                className={styles.addTechButton}
              >
                <FiUser />
                Add Technician
              </button>
              <button
                onClick={fetchTechnicians}
                className={styles.refreshButton}
                disabled={loadingTechnicians}
              >
                <FiRefreshCw
                  className={loadingTechnicians ? styles.spinning : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {loadingTechnicians ? (
            <div className={styles.loadingIssues}>
              <div className={styles.spinner}></div>
              <p>Loading technicians...</p>
            </div>
          ) : (
            <div className={styles.techniciansGrid}>
              {technicians.map((tech) => (
                <div key={tech._id} className={styles.technicianCard}>
                  <div className={styles.technicianHeader}>
                    <div className={styles.technicianAvatar}>
                      {tech.name.charAt(0)}
                    </div>
                    <div className={styles.technicianInfo}>
                      <h4>{tech.name}</h4>
                      <p>{tech.email}</p>
                    </div>
                  </div>

                  <div className={styles.technicianStats}>
                    <div className={styles.techStat}>
                      <span>Current Issues</span>
                      <strong>{tech.currentIssuesCount}</strong>
                    </div>
                    <div className={styles.techStat}>
                      <span>Total Resolved</span>
                      <strong>{tech.totalIssuesResolved}</strong>
                    </div>
                    <div className={styles.techStat}>
                      <span>Rating</span>
                      <strong>{tech.rating}/5</strong>
                    </div>
                  </div>

                  <div className={styles.technicianSpecializations}>
                    {tech.specializations.map((spec, index) => (
                      <span key={index} className={styles.specTag}>
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className={styles.technicianStatus}>
                    <span
                      className={`${styles.statusDot} ${
                        tech.isAvailable ? styles.available : styles.unavailable
                      }`}
                    ></span>
                    {tech.isAvailable ? "Available" : "Unavailable"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Issue Modal */}
        {showViewModal && viewingIssue && (
          <div className={styles.modalOverlay} onClick={closeViewModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  <FiAlertCircle /> Issue Details
                </h2>
                <button className={styles.closeButton} onClick={closeViewModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Issue Title */}
                <div className={styles.detailSection}>
                  <h3>{viewingIssue.title}</h3>
                  <div className={styles.badges}>
                    <span
                      className={styles.priorityBadge}
                      style={{
                        backgroundColor: getPriorityColor(
                          viewingIssue.priority,
                        ),
                      }}
                    >
                      {viewingIssue.priority} Priority
                    </span>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: getStatusColor(viewingIssue.status),
                      }}
                    >
                      {viewingIssue.status}
                    </span>
                    <span className={styles.typeBadge}>
                      {viewingIssue.issueType}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className={styles.detailSection}>
                  <h4>Description</h4>
                  <p className={styles.description}>
                    {viewingIssue.description}
                  </p>
                </div>

                {/* AI Analysis */}
                {viewingIssue.aiAnalysis && (
                  <div className={styles.detailSection}>
                    <h4>🤖 AI Analysis</h4>
                    <div className={styles.aiAnalysisBox}>
                      {viewingIssue.aiAnalysis}
                    </div>
                  </div>
                )}

                {/* Submitted By */}
                <div className={styles.detailSection}>
                  <h4>Submitted By</h4>
                  <div className={styles.userDetails}>
                    <p>
                      <strong>Name:</strong> {viewingIssue.submittedByName}
                    </p>
                    <p>
                      <strong>Email:</strong> {viewingIssue.submittedByEmail}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(viewingIssue.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Assigned To */}
                {viewingIssue.assignedToName && (
                  <div className={styles.detailSection}>
                    <h4>Assigned To</h4>
                    <div className={styles.userDetails}>
                      <p>
                        <strong>Technician:</strong>{" "}
                        {viewingIssue.assignedToName}
                      </p>
                      <p>
                        <strong>Email:</strong> {viewingIssue.assignedToEmail}
                      </p>
                      {viewingIssue.assignedAt && (
                        <p>
                          <strong>Assigned On:</strong>{" "}
                          {new Date(viewingIssue.assignedAt).toLocaleString()}
                        </p>
                      )}
                      {viewingIssue.assignmentReason && (
                        <p>
                          <strong>Assignment Reason:</strong>{" "}
                          {viewingIssue.assignmentReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution */}
                {(viewingIssue.status === "resolved" ||
                  viewingIssue.status === "closed") &&
                  viewingIssue.resolvedAt && (
                    <div className={styles.detailSection}>
                      <h4>
                        <FiCheckCircle /> Resolution
                      </h4>
                      <div className={styles.userDetails}>
                        <p>
                          <strong>Resolved On:</strong>{" "}
                          {new Date(viewingIssue.resolvedAt).toLocaleString()}
                        </p>
                        {viewingIssue.resolutionNotes && (
                          <p>
                            <strong>Notes:</strong>{" "}
                            {viewingIssue.resolutionNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Timeline */}
                <div className={styles.detailSection}>
                  <h4>
                    <FiClock /> Timeline
                  </h4>
                  <div className={styles.timeline}>
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineDot}></span>
                      <div>
                        <strong>Created</strong>
                        <p>
                          {new Date(viewingIssue.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {viewingIssue.assignedAt && (
                      <div className={styles.timelineItem}>
                        <span className={styles.timelineDot}></span>
                        <div>
                          <strong>Assigned</strong>
                          <p>
                            {new Date(viewingIssue.assignedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {viewingIssue.resolvedAt && (
                      <div className={styles.timelineItem}>
                        <span className={styles.timelineDot}></span>
                        <div>
                          <strong>Resolved</strong>
                          <p>
                            {new Date(viewingIssue.resolvedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.closeModalBtn}
                  onClick={closeViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Technician Modal */}
        {showAddTechModal && (
          <div
            className={styles.modalOverlay}
            onClick={handleCloseAddTechModal}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  <FiUser /> Add New Technician
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={handleCloseAddTechModal}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Select User */}
                <div className={styles.formGroup}>
                  <label>Select User</label>
                  {loadingUsers ? (
                    <p>Loading users...</p>
                  ) : allUsers.length === 0 ? (
                    <p className={styles.noUsers}>
                      No available users. All users are either already
                      technicians or admins.
                    </p>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className={styles.userSelect}
                    >
                      <option value="">-- Select a user --</option>
                      {allUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Select Specializations */}
                <div className={styles.formGroup}>
                  <label>Specializations (Select at least one)</label>
                  <div className={styles.specializationsGrid}>
                    {[
                      "technical",
                      "software",
                      "hardware",
                      "network",
                      "maintenance",
                      "other",
                    ].map((spec) => (
                      <div
                        key={spec}
                        className={`${styles.specializationOption} ${
                          selectedSpecializations.includes(spec)
                            ? styles.selected
                            : ""
                        }`}
                        onClick={() => handleToggleSpecialization(spec)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSpecializations.includes(spec)}
                          onChange={() => {}}
                        />
                        <span>
                          {spec.charAt(0).toUpperCase() + spec.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={handleCloseAddTechModal}
                >
                  Cancel
                </button>
                <button
                  className={styles.addBtn}
                  onClick={handleAddTechnician}
                  disabled={
                    !selectedUserId || selectedSpecializations.length === 0
                  }
                >
                  <FiUser /> Add Technician
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAITools;
