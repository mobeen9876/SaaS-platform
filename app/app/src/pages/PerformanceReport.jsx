import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiFileText,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiBarChart2,
  FiDownload,
  FiUser,
  FiZap,
  FiTool,
} from "react-icons/fi";
import styles from "./performanceReport.module.css";
import { API_URL } from "../config/api";
import { showError } from "../utils/swal";

const PerformanceReport = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState(() => {
    try {
      const cached = sessionStorage.getItem("perfReport");
      return cached ? JSON.parse(cached).techId || "" : "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(() => {
    try {
      const cached = sessionStorage.getItem("perfReport");
      return cached ? JSON.parse(cached).report : null;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem("perfReport");
      return cached ? JSON.parse(cached).stats : null;
    } catch {
      return null;
    }
  });
  const [notTechnician, setNotTechnician] = useState(false);

  // Technician request state
  const [techRequestStatus, setTechRequestStatus] = useState("none");
  const [techRequestMessage, setTechRequestMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userData || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    const adminCheck = parsedUser.role === "admin";
    setIsAdmin(adminCheck);

    if (adminCheck) {
      fetchTechnicians(token);
    } else {
      // Technician — auto-load their own profile
      fetchMyProfile(token);
    }
    setLoading(false);
  }, [navigate]);

  const fetchTechnicians = async (token) => {
    try {
      const res = await fetch(`${API_URL}/ai-tools/technicians`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTechnicians(data.technicians || []);
    } catch (err) {
      console.error("Error fetching technicians:", err);
    }
  };

  const fetchMyProfile = async (token) => {
    try {
      const res = await fetch(`${API_URL}/ai-tools/technicians/my-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.technicianId) {
        setSelectedTechId(data.technicianId);
      } else {
        // Not a technician — show request card instead of error
        setNotTechnician(true);
        try {
          const profileRes = await fetch(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const profileData = await profileRes.json();
          if (profileData?.success && profileData.user) {
            setTechRequestStatus(
              profileData.user.technicianRequestStatus || "none",
            );
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error("Error fetching my profile:", err);
      setNotTechnician(true);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTechId) {
      await showError("Please select a technician");
      return;
    }

    setGenerating(true);
    setReport(null);
    setStats(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/ai-tools/technicians/${selectedTechId}/report`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      if (res.ok) {
        setReport(data.report);
        setStats(data.stats);
        // Cache so data survives a page refresh
        sessionStorage.setItem(
          "perfReport",
          JSON.stringify({
            report: data.report,
            stats: data.stats,
            techId: selectedTechId,
          }),
        );
      } else {
        await showError(data.error || "Failed to generate report");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      await showError("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!report || !stats) return;

    const resolutionRate =
      stats.totalAssigned > 0
        ? Math.round((stats.totalResolved / stats.totalAssigned) * 100)
        : 0;

    const content = `AI PERFORMANCE REPORT
${"=".repeat(50)}
Generated: ${new Date().toLocaleString()}

TECHNICIAN: ${stats.name}
Email: ${stats.email}
Specializations: ${stats.specializations.join(", ")}

OVERALL SCORE: ${report.overallScore}/10 — ${report.performanceLevel}
TREND: ${report.trend}

EXECUTIVE SUMMARY
${"-".repeat(30)}
${report.executiveSummary}

KEY STATISTICS
${"-".repeat(30)}
Total Issues Assigned : ${stats.totalAssigned}
Total Issues Resolved : ${stats.totalResolved}
Resolution Rate       : ${resolutionRate}%
Currently Active      : ${stats.currentPending}
Avg Resolution Time   : ${stats.avgResolutionHours} hours
Rating                : ${stats.rating}/5.0

STRENGTHS
${"-".repeat(30)}
${report.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

AREAS FOR IMPROVEMENT
${"-".repeat(30)}
${report.areasForImprovement.map((a, i) => `${i + 1}. ${a}`).join("\n")}

PRODUCTIVITY ANALYSIS
${"-".repeat(30)}
${report.productivityAnalysis}

SPECIALIST INSIGHT
${"-".repeat(30)}
${report.specialistInsight}

RECOMMENDATION
${"-".repeat(30)}
${report.recommendation}

${"=".repeat(50)}
Generated by AI Document Generator — Multi-Service AI SaaS Platform`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Performance_Report_${stats.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (trend) => {
    if (trend === "Improving")
      return <FiTrendingUp className={styles.trendUp} />;
    if (trend === "Declining")
      return <FiTrendingDown className={styles.trendDown} />;
    return <FiMinus className={styles.trendStable} />;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#10b981";
    if (score >= 6) return "#3b82f6";
    if (score >= 4) return "#f59e0b";
    return "#ef4444";
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Excellent":
        return "#10b981";
      case "Good":
        return "#3b82f6";
      case "Average":
        return "#f59e0b";
      case "Needs Improvement":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const handleSubmitRequest = async () => {
    setRequestLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/user/request-technician`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: techRequestMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setTechRequestStatus("pending");
        setShowRequestForm(false);
        setTechRequestMessage("");
      } else {
        await showError(data.error || "Failed to submit request");
      }
    } catch {
      await showError("Failed to submit request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/user/request-technician`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechRequestStatus("none");
    } catch {
      await showError("Failed to cancel request");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (notTechnician) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button
              className={styles.backButton}
              onClick={() => navigate("/ai-tools")}
            >
              <FiArrowLeft /> Back to AI Tools
            </button>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                <FiFileText /> AI Document Generator
              </h1>
              <p className={styles.subtitle}>
                Generate AI-powered performance reports for technicians
              </p>
            </div>
          </div>

          <div className={styles.generatorCard}>
            <div className={styles.generatorHeader}>
              <FiTool
                className={styles.generatorIcon}
                style={{ color: "#6366f1" }}
              />
              <div>
                <h2>Become a Technician</h2>
                <p>
                  You need a technician profile to use this tool. Request the
                  role from the admin to get started.
                </p>
              </div>
            </div>

            {techRequestStatus === "none" && (
              <>
                {!showRequestForm ? (
                  <button
                    className={styles.generateBtn}
                    onClick={() => setShowRequestForm(true)}
                  >
                    <FiTool /> Request Technician Role
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "0.95rem",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                      placeholder="Tell the admin why you'd like to become a technician and what skills you have (optional)..."
                      value={techRequestMessage}
                      onChange={(e) => setTechRequestMessage(e.target.value)}
                      rows={3}
                    />
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        className={styles.generateBtn}
                        onClick={handleSubmitRequest}
                        disabled={requestLoading}
                        style={{ flex: 1 }}
                      >
                        {requestLoading ? (
                          "Submitting..."
                        ) : (
                          <>
                            <FiZap /> Submit Request
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowRequestForm(false);
                          setTechRequestMessage("");
                        }}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "10px",
                          color: "#94a3b8",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {techRequestStatus === "pending" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#f59e0b", fontWeight: 500 }}>
                  ⏳ Your request is pending admin review
                </span>
                <button
                  onClick={handleCancelRequest}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Cancel Request
                </button>
              </div>
            )}

            {techRequestStatus === "approved" && (
              <div style={{ color: "#10b981", fontWeight: 500 }}>
                ✅ Your request was approved — refresh the page to access the
                report generator.
              </div>
            )}

            {techRequestStatus === "rejected" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#ef4444", fontWeight: 500 }}>
                  ❌ Your request was not approved
                </span>
                <button
                  className={styles.generateBtn}
                  onClick={() => setTechRequestStatus("none")}
                  style={{ width: "auto", padding: "0.6rem 1.2rem" }}
                >
                  Request Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/ai-tools")}
          >
            <FiArrowLeft /> Back to AI Tools
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <FiFileText /> AI Performance Report Generator
            </h1>
            <p className={styles.subtitle}>
              Generate AI-powered performance reports for technicians
            </p>
          </div>
        </div>

        {/* Generator Card */}
        <div className={styles.generatorCard}>
          <div className={styles.generatorHeader}>
            <FiZap className={styles.generatorIcon} />
            <div>
              <h2>Performance Report Generator</h2>
              <p>
                AI analyses all issue data and generates a detailed performance
                document
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className={styles.selectRow}>
              <label>Select Technician</label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className={styles.select}
              >
                <option value="">— Choose a technician —</option>
                {technicians.map((tech) => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name} ({tech.email}) — Rating: {tech.rating}/5
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.selfInfo}>
              <FiUser />
              <span>Generating report for your own performance</span>
            </div>
          )}

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={generating || !selectedTechId}
          >
            {generating ? (
              <>
                <div className={styles.btnSpinner}></div>
                AI is analysing performance data...
              </>
            ) : (
              <>
                <FiZap /> Generate AI Report
              </>
            )}
          </button>
        </div>

        {/* Report Output */}
        {report && stats && (
          <div className={styles.reportContainer}>
            {/* Report Header */}
            <div className={styles.reportHeader}>
              <div className={styles.reportMeta}>
                <h2>Performance Report</h2>
                <p>
                  {stats.name} · {stats.email}
                </p>
                <p className={styles.reportDate}>
                  Generated: {new Date().toLocaleString()}
                </p>
              </div>
              <button className={styles.downloadBtn} onClick={handleDownload}>
                <FiDownload /> Download Report
              </button>
            </div>

            {/* Score Section */}
            <div className={styles.scoreSection}>
              <div
                className={styles.scoreCircle}
                style={{ borderColor: getScoreColor(report.overallScore) }}
              >
                <span
                  className={styles.scoreNum}
                  style={{ color: getScoreColor(report.overallScore) }}
                >
                  {report.overallScore}
                </span>
                <span className={styles.scoreMax}>/10</span>
              </div>
              <div className={styles.scoreDetails}>
                <span
                  className={styles.levelBadge}
                  style={{
                    backgroundColor: getLevelColor(report.performanceLevel),
                  }}
                >
                  {report.performanceLevel}
                </span>
                <div className={styles.trendRow}>
                  {getTrendIcon(report.trend)}
                  <span>Trend: {report.trend}</span>
                </div>
                <div className={styles.specTags}>
                  {stats.specializations.map((s) => (
                    <span key={s} className={styles.specTag}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <FiBarChart2 className={styles.statIcon} />
                <div className={styles.statValue}>{stats.totalAssigned}</div>
                <div className={styles.statLabel}>Total Assigned</div>
              </div>
              <div className={styles.statBox}>
                <FiCheckCircle
                  className={styles.statIcon}
                  style={{ color: "#10b981" }}
                />
                <div className={styles.statValue}>{stats.totalResolved}</div>
                <div className={styles.statLabel}>Resolved</div>
              </div>
              <div className={styles.statBox}>
                <FiAlertCircle
                  className={styles.statIcon}
                  style={{ color: "#f59e0b" }}
                />
                <div className={styles.statValue}>{stats.currentPending}</div>
                <div className={styles.statLabel}>Active</div>
              </div>
              <div className={styles.statBox}>
                <FiClock
                  className={styles.statIcon}
                  style={{ color: "#3b82f6" }}
                />
                <div className={styles.statValue}>
                  {stats.avgResolutionHours}h
                </div>
                <div className={styles.statLabel}>Avg Resolution</div>
              </div>
              <div className={styles.statBox}>
                <FiStar
                  className={styles.statIcon}
                  style={{ color: "#f59e0b" }}
                />
                <div className={styles.statValue}>{stats.rating}/5</div>
                <div className={styles.statLabel}>Rating</div>
              </div>
              <div className={styles.statBox}>
                <FiBarChart2
                  className={styles.statIcon}
                  style={{ color: "#8b5cf6" }}
                />
                <div className={styles.statValue}>
                  {stats.totalAssigned > 0
                    ? Math.round(
                        (stats.totalResolved / stats.totalAssigned) * 100,
                      )
                    : 0}
                  %
                </div>
                <div className={styles.statLabel}>Resolution Rate</div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Executive Summary</h3>
              <p className={styles.summaryText}>{report.executiveSummary}</p>
            </div>

            {/* Strengths & Improvements */}
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <h3
                  className={styles.sectionTitle}
                  style={{ color: "#10b981" }}
                >
                  <FiCheckCircle /> Strengths
                </h3>
                <ul className={styles.feedbackList}>
                  {report.strengths.map((s, i) => (
                    <li key={i} className={styles.strengthItem}>
                      <span
                        className={styles.bullet}
                        style={{ backgroundColor: "#10b981" }}
                      ></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.section}>
                <h3
                  className={styles.sectionTitle}
                  style={{ color: "#f59e0b" }}
                >
                  <FiAlertCircle /> Areas for Improvement
                </h3>
                <ul className={styles.feedbackList}>
                  {report.areasForImprovement.map((a, i) => (
                    <li key={i} className={styles.improvementItem}>
                      <span
                        className={styles.bullet}
                        style={{ backgroundColor: "#f59e0b" }}
                      ></span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Analysis sections */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Productivity Analysis</h3>
              <p className={styles.analysisText}>
                {report.productivityAnalysis}
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Specialist Insight</h3>
              <p className={styles.analysisText}>{report.specialistInsight}</p>
            </div>

            {/* Recommendation */}
            <div className={styles.recommendationBox}>
              <h3>
                <FiZap /> AI Recommendation
              </h3>
              <p>{report.recommendation}</p>
            </div>

            {/* Issue Type Breakdown */}
            {Object.keys(stats.typeBreakdown).length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Issue Type Breakdown</h3>
                <div className={styles.breakdownGrid}>
                  {Object.entries(stats.typeBreakdown).map(([type, count]) => (
                    <div key={type} className={styles.breakdownItem}>
                      <span className={styles.breakdownType}>{type}</span>
                      <span className={styles.breakdownCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceReport;
