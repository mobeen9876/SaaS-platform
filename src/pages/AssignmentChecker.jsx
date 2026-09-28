import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEye,
  FiCpu,
  FiCheck,
  FiX,
  FiClock,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import styles from "./assignmentChecker.module.css";
import { showError, showSuccess } from "../utils/swal";
import { API_URL } from "../config/api";

const AssignmentChecker = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  const [view, setView] = useState(() => {
    try {
      return sessionStorage.getItem("ac_view") || "list";
    } catch {
      return "list";
    }
  });
  const [selectedAssignment, setSelectedAssignment] = useState(() => {
    try {
      const s = sessionStorage.getItem("ac_selected");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [submissionResult, setSubmissionResult] = useState(() => {
    try {
      const s = sessionStorage.getItem("ac_result");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  const setViewPersisted = (v) => {
    setView(v);
    try {
      sessionStorage.setItem("ac_view", v);
    } catch {}
  };
  const setSelectedPersisted = (a) => {
    setSelectedAssignment(a);
    try {
      sessionStorage.setItem("ac_selected", a ? JSON.stringify(a) : "");
    } catch {}
  };
  const setResultPersisted = (r) => {
    setSubmissionResult(r);
    try {
      sessionStorage.setItem("ac_result", r ? JSON.stringify(r) : "");
    } catch {}
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    deadline: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userData || !token) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    setIsAdmin(parsed.role === "admin");
    fetchAssignments();

    // Clear persisted view when the user leaves this page entirely (e.g. back
    // to AI Tools menu) so that re-entering always lands on the list view.
    return () => {
      try {
        sessionStorage.removeItem("ac_view");
        sessionStorage.removeItem("ac_selected");
        sessionStorage.removeItem("ac_result");
      } catch {}
    };
  }, [navigate]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAssignments(data.assignments);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.requirements.trim()
    ) {
      await showError("Title, description, and requirements are required");
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await showSuccess("Task created successfully!");
        setForm({ title: "", description: "", requirements: "", deadline: "" });
        setViewPersisted("list");
        fetchAssignments();
      } else {
        await showError(data.error || "Failed to create assignment");
      }
    } catch (err) {
      await showError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Delete this assignment? All submissions will be lost.")
    )
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await showSuccess("Assignment deleted");
        fetchAssignments();
      }
    } catch (err) {
      await showError("Failed to delete assignment");
    }
  };

  const handleToggle = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchAssignments();
    } catch (err) {
      await showError("Failed to update assignment");
    }
  };

  const handleViewDetail = async (assignment) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments/${assignment._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPersisted(data.assignment);
        setViewPersisted("detail");
      }
    } catch (err) {
      await showError("Failed to load assignment details");
    }
  };

  const handleViewMyFeedback = async (assignment) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/assignments/${assignment._id}/my-submission`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success && data.submission && data.submission.checked) {
        setSelectedPersisted(assignment);
        setResultPersisted({
          score: data.submission.score,
          grade: data.submission.grade,
          grammarFeedback: data.submission.grammarFeedback,
          contentFeedback: data.submission.contentFeedback,
          mistakes: data.submission.mistakes,
          improvements: data.submission.improvements,
          strengths: data.submission.strengths,
          aiWrittenPercent: data.submission.aiWrittenPercent,
          humanWrittenPercent: data.submission.humanWrittenPercent,
          aiDetectionVerdict: data.submission.aiDetectionVerdict,
          aiDetectionReason: data.submission.aiDetectionReason,
          overallFeedback: data.submission.overallFeedback,
        });
        setViewPersisted("result");
      } else if (data.success && data.submission && !data.submission.checked) {
        await showError(
          "Your submission is still being processed. Please check back shortly.",
        );
      } else {
        await showError("Could not load your feedback.");
      }
    } catch (err) {
      await showError("Failed to load feedback");
    }
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim() || submissionContent.trim().length < 10) {
      await showError("Please write your submission (minimum 10 characters)");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/assignments/${selectedAssignment._id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: submissionContent }),
        },
      );
      const data = await res.json();
      if (data.success) {
        if (data.checked && data.result) {
          setResultPersisted(data.result);
          setViewPersisted("result");
        } else {
          await showSuccess("Submitted! AI check will complete shortly.");
          setViewPersisted("list");
          fetchAssignments();
        }
      } else {
        await showError(data.error || "Failed to submit");
      }
    } catch (err) {
      await showError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#10b981";
    if (score >= 6) return "#3b82f6";
    if (score >= 4) return "#f59e0b";
    return "#ef4444";
  };

  const getAiDetectionColor = (verdict) => {
    if (!verdict) return "#6b7280";
    if (verdict.includes("Human")) return "#10b981";
    if (verdict.includes("Assisted")) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Result View ───
  if (view === "result" && submissionResult) {
    const r = submissionResult;
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => {
                setViewPersisted("list");
                setResultPersisted(null);
                setSelectedPersisted(null);
                setSubmissionContent("");
                fetchAssignments();
              }}
            >
              <FiArrowLeft /> Back to Assignments
            </button>
            <h1 className={styles.title}>📊 AI Feedback Report</h1>
            <p className={styles.subtitle}>
              Your submission has been evaluated by AI
            </p>
          </div>

          <div className={styles.scoreCard}>
            <div
              className={styles.scoreCircle}
              style={{
                borderColor: getScoreColor(r.score),
                color: getScoreColor(r.score),
              }}
            >
              <span className={styles.scoreNum}>{r.score}</span>
              <span className={styles.scoreMax}>/10</span>
            </div>
            <div className={styles.scoreInfo}>
              <div
                className={styles.grade}
                style={{ color: getScoreColor(r.score) }}
              >
                Grade: {r.grade}
              </div>
              <p className={styles.overallFeedback}>{r.overallFeedback}</p>
            </div>
          </div>

          <div
            className={styles.aiDetectionCard}
            style={{ borderColor: getAiDetectionColor(r.aiDetectionVerdict) }}
          >
            <div className={styles.aiDetectionHeader}>
              <FiCpu /> AI Detection Analysis
            </div>
            <div className={styles.aiDetectionBars}>
              <div className={styles.barRow}>
                <span>Human Written</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${r.humanWrittenPercent}%`,
                      background: "#10b981",
                    }}
                  ></div>
                </div>
                <span className={styles.barPct}>{r.humanWrittenPercent}%</span>
              </div>
              <div className={styles.barRow}>
                <span>AI Generated</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${r.aiWrittenPercent}%`,
                      background: "#ef4444",
                    }}
                  ></div>
                </div>
                <span className={styles.barPct}>{r.aiWrittenPercent}%</span>
              </div>
            </div>
            <div
              className={styles.verdict}
              style={{ color: getAiDetectionColor(r.aiDetectionVerdict) }}
            >
              Verdict: {r.aiDetectionVerdict}
            </div>
            {r.aiDetectionReason && (
              <p className={styles.aiDetectionReason}>{r.aiDetectionReason}</p>
            )}
          </div>

          <div className={styles.feedbackGrid}>
            <div className={styles.feedbackCard}>
              <h3>📝 Grammar & Language</h3>
              <p>{r.grammarFeedback}</p>
            </div>
            <div className={styles.feedbackCard}>
              <h3>📖 Content Evaluation</h3>
              <p>{r.contentFeedback}</p>
            </div>
          </div>

          {r.strengths?.length > 0 && (
            <div className={styles.listCard}>
              <h3>✅ Strengths</h3>
              <ul>
                {r.strengths.map((s, i) => (
                  <li key={i}>
                    <FiCheck className={styles.checkIcon} /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {r.mistakes?.length > 0 && (
            <div className={`${styles.listCard} ${styles.mistakesCard}`}>
              <h3>❌ Mistakes Found</h3>
              <ul>
                {r.mistakes.map((m, i) => (
                  <li key={i}>
                    <FiX className={styles.xIcon} /> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {r.improvements?.length > 0 && (
            <div className={`${styles.listCard} ${styles.improvementsCard}`}>
              <h3>💡 Improvements Suggested</h3>
              <ul>
                {r.improvements.map((imp, i) => (
                  <li key={i}>• {imp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Submit View ───
  if (view === "submit" && selectedAssignment) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => {
                setViewPersisted("list");
                setSelectedPersisted(null);
                setSubmissionContent("");
              }}
            >
              <FiArrowLeft /> Back
            </button>
            <h1 className={styles.title}>📝 Submit Work</h1>
            <p className={styles.subtitle}>{selectedAssignment.title}</p>
          </div>
          <div className={styles.assignmentInfo}>
            <h3>Description</h3>
            <p>{selectedAssignment.description}</p>
            <h3>Requirements</h3>
            <p>{selectedAssignment.requirements}</p>
            {selectedAssignment.deadline && (
              <p className={styles.deadline}>
                <FiClock /> Deadline:{" "}
                {new Date(selectedAssignment.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className={styles.submitArea}>
            <h3>Your Work</h3>
            <p className={styles.submitHint}>
              Write your work below. AI will automatically evaluate it for
              quality, completeness, grammar, and AI-generated content
              detection.
            </p>
            <textarea
              className={styles.textarea}
              placeholder="Write your work submission here..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={14}
            />
            <div className={styles.wordCount}>
              {submissionContent.trim().split(/\s+/).filter(Boolean).length}{" "}
              words
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.btnSpinner}></div> Submitting &
                  checking with AI...
                </>
              ) : (
                <>
                  <FiCpu /> Submit for AI Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Detail View (Admin) ───
  if (view === "detail" && selectedAssignment && isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => setViewPersisted("list")}
            >
              <FiArrowLeft /> Back to Assignments
            </button>
            <h1 className={styles.title}>{selectedAssignment.title}</h1>
            <p className={styles.subtitle}>
              {selectedAssignment.submissions.length} submission(s)
            </p>
          </div>
          <div className={styles.assignmentInfo}>
            <p>
              <strong>Description:</strong> {selectedAssignment.description}
            </p>
            <p>
              <strong>Requirements:</strong> {selectedAssignment.requirements}
            </p>
            {selectedAssignment.deadline && (
              <p>
                <FiClock /> <strong>Deadline:</strong>{" "}
                {new Date(selectedAssignment.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
          {selectedAssignment.submissions.length === 0 ? (
            <div className={styles.empty}>
              <FiUsers /> No submissions yet
            </div>
          ) : (
            <div className={styles.submissionsList}>
              <h2>All Submissions</h2>
              {selectedAssignment.submissions.map((sub, i) => (
                <div key={i} className={styles.submissionCard}>
                  <div
                    className={styles.subHeader}
                    onClick={() =>
                      setExpandedSubmission(expandedSubmission === i ? null : i)
                    }
                  >
                    <div className={styles.subInfo}>
                      <strong>{sub.submittedByName}</strong>
                      <span>{sub.submittedByEmail}</span>
                      <span className={styles.subDate}>
                        {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.subRight}>
                      {sub.checked ? (
                        <>
                          <span
                            className={styles.scoreBadge}
                            style={{ background: getScoreColor(sub.score) }}
                          >
                            {sub.score}/10 · {sub.grade}
                          </span>
                          <span
                            className={styles.aiVerdict}
                            style={{
                              color: getAiDetectionColor(
                                sub.aiDetectionVerdict,
                              ),
                            }}
                          >
                            {sub.aiDetectionVerdict}
                          </span>
                        </>
                      ) : (
                        <span className={styles.pendingBadge}>
                          Pending Check
                        </span>
                      )}
                      {expandedSubmission === i ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      )}
                    </div>
                  </div>
                  {expandedSubmission === i && (
                    <div className={styles.subExpanded}>
                      <div className={styles.subContent}>
                        <h4>Submitted Content:</h4>
                        <p>{sub.content}</p>
                      </div>
                      {sub.checked && (
                        <div className={styles.subAiResult}>
                          <div className={styles.aiDetectionMini}>
                            <div className={styles.barRow}>
                              <span>Human</span>
                              <div className={styles.barTrack}>
                                <div
                                  className={styles.barFill}
                                  style={{
                                    width: `${sub.humanWrittenPercent}%`,
                                    background: "#10b981",
                                  }}
                                ></div>
                              </div>
                              <span>{sub.humanWrittenPercent}%</span>
                            </div>
                            <div className={styles.barRow}>
                              <span>AI</span>
                              <div className={styles.barTrack}>
                                <div
                                  className={styles.barFill}
                                  style={{
                                    width: `${sub.aiWrittenPercent}%`,
                                    background: "#ef4444",
                                  }}
                                ></div>
                              </div>
                              <span>{sub.aiWrittenPercent}%</span>
                            </div>
                          </div>
                          <div className={styles.subFeedback}>
                            <p>
                              <strong>Grammar:</strong> {sub.grammarFeedback}
                            </p>
                            <p>
                              <strong>Content:</strong> {sub.contentFeedback}
                            </p>
                            {sub.mistakes?.length > 0 && (
                              <div>
                                <strong>Mistakes:</strong>
                                <ul>
                                  {sub.mistakes.map((m, j) => (
                                    <li key={j}>{m}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p>
                              <strong>Overall:</strong> {sub.overallFeedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Create View (Admin) ───
  if (view === "create" && isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => setViewPersisted("list")}
            >
              <FiArrowLeft /> Back
            </button>
            <h1 className={styles.title}>➕ Create Task</h1>
            <p className={styles.subtitle}>
              Define the task — AI will use your quality criteria to evaluate
              employee submissions
            </p>
          </div>
          <div className={styles.createForm}>
            <div className={styles.formGroup}>
              <label>Task Title *</label>
              <input
                className={styles.input}
                placeholder="e.g. Write a quarterly performance summary"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description *</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe what this task requires from the employee..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Quality Criteria *</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe what a high-quality submission looks like. Be specific — the AI will use this to evaluate the work..."
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
                rows={5}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Deadline (optional)</label>
              <input
                className={styles.input}
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <button
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <>
                  <div className={styles.btnSpinner}></div> Creating...
                </>
              ) : (
                <>
                  <FiPlus /> Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/ai-tools")}
          >
            <FiArrowLeft /> Back to AI Tools
          </button>
          <h1 className={styles.title}>
            <FiCpu /> AI Work Submission Checker
          </h1>
          <p className={styles.subtitle}>
            {isAdmin
              ? "Create tasks for your team and review AI-evaluated work submissions"
              : "View your assigned tasks and submit work for instant AI quality feedback"}
          </p>
        </div>

        {isAdmin && (
          <div className={styles.topActions}>
            <button
              className={styles.createBtn}
              onClick={() => setViewPersisted("create")}
            >
              <FiPlus /> Create New Task
            </button>
          </div>
        )}

        {assignments.length === 0 ? (
          <div className={styles.empty}>
            <FiAlertCircle />
            <p>
              {isAdmin
                ? "No tasks yet. Create one to get started."
                : "No tasks have been assigned yet."}
            </p>
          </div>
        ) : (
          <div className={styles.assignmentGrid}>
            {assignments.map((a) => (
              <div
                key={a._id}
                className={`${styles.assignmentCard} ${!a.isActive ? styles.inactive : ""}`}
              >
                <div className={styles.cardTop}>
                  <h2 className={styles.cardTitle}>{a.title}</h2>
                  {!a.isActive && (
                    <span className={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
                <p className={styles.cardDesc}>{a.description}</p>
                <div className={styles.cardMeta}>
                  {a.deadline && (
                    <span>
                      <FiClock /> {new Date(a.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {isAdmin && (
                    <span>
                      <FiUsers /> {a.submissions?.length || 0} submission(s)
                    </span>
                  )}
                </div>
                {!isAdmin && a.mySubmission && (
                  <div className={styles.mySubmissionStatus}>
                    <FiCheck className={styles.checkIcon} /> Submitted
                    {a.mySubmission.checked && (
                      <span
                        className={styles.scoreBadge}
                        style={{
                          background: getScoreColor(a.mySubmission.score),
                        }}
                      >
                        {a.mySubmission.score}/10 · {a.mySubmission.grade}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.cardActions}>
                  {isAdmin ? (
                    <>
                      <button
                        className={styles.viewBtn}
                        onClick={() => handleViewDetail(a)}
                      >
                        <FiEye /> View Submissions
                      </button>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => handleToggle(a._id)}
                      >
                        {a.isActive ? <FiToggleRight /> : <FiToggleLeft />}{" "}
                        {a.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(a._id)}
                      >
                        <FiTrash2 />
                      </button>
                    </>
                  ) : !a.mySubmission ? (
                    <button
                      className={styles.submitBtn}
                      onClick={() => {
                        setSelectedPersisted(a);
                        setViewPersisted("submit");
                      }}
                    >
                      <FiCpu /> Submit for AI Review
                    </button>
                  ) : (
                    <button
                      className={styles.viewFeedbackBtn}
                      onClick={() => handleViewMyFeedback(a)}
                    >
                      <FiEye /> View My Feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentChecker;
