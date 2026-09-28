import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiTool,
  FiAlertCircle,
  FiCpu,
  FiZap,
  FiArrowRight,
  FiShield,
  FiKey,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import styles from "./aiToolsMenu.module.css";
import { showError, showSuccess } from "../utils/swal";
import { API_URL } from "../config/api";

const AIToolsMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiToolsEnabled, setAiToolsEnabled] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("groq");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setIsAdmin(parsedUser.role === "admin");

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
        if (data.provider) {
          setProvider(data.provider);
        }
        if (data.needsApiKey) {
          setShowApiKeyInput(true);
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
        await showSuccess("API key verified successfully! AI Tools unlocked.");
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

  const aiTools = [
    {
      id: 1,
      name: "AI Issue Resolver for Organization",
      description:
        "Intelligent issue tracking and resolution system powered by AI. Automatically analyzes, categorizes, and assigns issues to the best available technician.",
      icon: <FiAlertCircle />,
      userPath: "/ai-tools/issue-resolver",
      adminPath: "/admin-ai-tools",
      color: "#3b82f6",
      features: [
        "AI-powered issue analysis",
        "Smart technician assignment",
        "Priority detection",
        "Real-time tracking",
      ],
      adminFeatures: [
        "Monitor all issues",
        "Manage technicians",
        "View statistics",
        "Override assignments",
      ],
    },
    {
      id: 2,
      name: "AI Work Submission Checker",
      description:
        "Create tasks for your team and evaluate submitted work with AI. Get instant quality scores, grammar feedback, content analysis, and AI-written content detection.",
      icon: <FiCpu />,
      userPath: "/ai-tools/assignment-checker",
      adminPath: "/ai-tools/assignment-checker",
      color: "#8b5cf6",
      features: [
        "Submit work for AI review",
        "Instant quality scoring",
        "Detailed AI feedback",
        "AI-written content detection",
      ],
      adminFeatures: [
        "Create tasks & work briefs",
        "View all employee submissions",
        "AI quality scoring",
        "AI-written content detection",
      ],
    },
    {
      id: 3,
      name: "AI Performance Report Generator",
      description:
        "Generate AI-powered performance reports for technicians. Analyse issue history, resolution rates, and productivity to produce detailed professional documents.",
      icon: <FiZap />,
      userPath: "/ai-tools/document-generator",
      adminPath: "/ai-tools/document-generator",
      color: "#10b981",
      features: [
        "AI-generated performance reports",
        "Resolution rate analysis",
        "Strengths & improvement areas",
        "Downloadable report files",
      ],
      adminFeatures: [
        "Generate reports for any technician",
        "Full performance scoring (0–10)",
        "Productivity & trend analysis",
        "Downloadable report files",
      ],
    },
  ];

  const handleToolClick = (tool) => {
    if (tool.comingSoon) {
      return;
    }
    // Navigate to appropriate path based on user role
    const path = isAdmin ? tool.adminPath : tool.userPath;
    navigate(path);
  };

  if (loading) {
    return (
      <div className={styles.aiToolsMenuPage}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading AI Tools...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show API Key Setup for non-admin users who haven't configured their key
  if (!isAdmin && !aiToolsEnabled && showApiKeyInput) {
    return (
      <div className={styles.aiToolsMenuPage}>
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
              <FiLock /> Unlock AI Tools
            </h1>
            <p className={styles.subtitle}>
              Configure your AI API key to access all AI-powered features
            </p>
          </div>

          {/* API Key Setup Card */}
          <div className={styles.apiKeySetup}>
            <div className={styles.setupCard}>
              <div className={styles.setupIcon}>
                <FiKey />
              </div>
              <h2>Setup Required</h2>
              <p className={styles.setupDescription}>
                To unlock AI Tools, you need to provide your own AI API key.
                Your key will be securely stored and used only for your
                requests.
              </p>

              <div className={styles.providerSelection}>
                <label>Select AI Provider:</label>
                <div className={styles.providerButtons}>
                  <button
                    type="button"
                    className={`${styles.providerButton} ${provider === "groq" ? styles.active : ""}`}
                    onClick={() => setProvider("groq")}
                  >
                    Groq
                  </button>
                  <button
                    type="button"
                    className={`${styles.providerButton} ${provider === "openai" ? styles.active : ""}`}
                    onClick={() => setProvider("openai")}
                  >
                    OpenAI
                  </button>
                  <button
                    type="button"
                    className={`${styles.providerButton} ${provider === "gemini" ? styles.active : ""}`}
                    onClick={() => setProvider("gemini")}
                  >
                    Gemini
                  </button>
                </div>
              </div>

              <div className={styles.apiKeyInput}>
                <input
                  type="password"
                  placeholder={
                    provider === "groq"
                      ? "Enter your Groq API key (gsk_...)"
                      : provider === "openai"
                        ? "Enter your OpenAI API key (sk-...)"
                        : "Enter your Gemini API key (AIza...)"
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={styles.input}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleVerifyApiKey();
                    }
                  }}
                />
                <button
                  onClick={handleVerifyApiKey}
                  disabled={verifying}
                  className={styles.verifyButton}
                >
                  {verifying ? (
                    <>
                      <FiRefreshCw className={styles.spinning} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FiKey />
                      Verify & Unlock
                    </>
                  )}
                </button>
              </div>

              <div className={styles.apiKeyHelp}>
                <h4>
                  How to get your{" "}
                  {provider === "groq"
                    ? "Groq"
                    : provider === "openai"
                      ? "OpenAI"
                      : "Gemini"}{" "}
                  API key:
                </h4>
                {provider === "groq" ? (
                  <ol>
                    <li>
                      Visit{" "}
                      <a
                        href="https://console.groq.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        console.groq.com
                      </a>
                    </li>
                    <li>Sign in or create a free account</li>
                    <li>Navigate to the API Keys section</li>
                    <li>Click "Create API Key"</li>
                    <li>Copy and paste it here</li>
                    <li className={styles.highlight}>
                      ✨ No credit card required - completely free!
                    </li>
                  </ol>
                ) : provider === "openai" ? (
                  <ol>
                    <li>
                      Visit{" "}
                      <a
                        href="https://platform.openai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        platform.openai.com
                      </a>
                    </li>
                    <li>Sign in or create an account</li>
                    <li>Navigate to API Keys section</li>
                    <li>Create a new secret key</li>
                    <li>Copy and paste it here</li>
                  </ol>
                ) : (
                  <ol>
                    <li>
                      Visit{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        makersuite.google.com/app/apikey
                      </a>
                    </li>
                    <li>Sign in with your Google account</li>
                    <li>Click "Create API Key"</li>
                    <li>Copy the generated key</li>
                    <li>Paste it here</li>
                  </ol>
                )}
              </div>

              <div className={styles.securityNote}>
                <FiShield />
                <p>
                  Your API key is encrypted and stored securely. It will only be
                  used for your AI requests and never shared with anyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.aiToolsMenuPage}>
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
            <FiTool /> AI Tools Suite
            {isAdmin && (
              <span className={styles.adminBadge}>
                <FiShield /> Admin
              </span>
            )}
          </h1>
          <p className={styles.subtitle}>
            {isAdmin
              ? "Monitor and manage AI-powered tools for your organization"
              : "Choose from our collection of AI-powered tools to enhance your productivity"}
          </p>
        </div>

        {/* Tools Grid */}
        <div className={styles.toolsGrid}>
          {aiTools.map((tool) => (
            <div
              key={tool.id}
              className={`${styles.toolCard} ${tool.comingSoon ? styles.comingSoon : ""}`}
              onClick={() => handleToolClick(tool)}
              style={{ borderColor: tool.color }}
            >
              {tool.comingSoon && (
                <div className={styles.comingSoonBadge}>Coming Soon</div>
              )}

              <div
                className={styles.toolIcon}
                style={{
                  backgroundColor: `${tool.color}20`,
                  color: tool.color,
                }}
              >
                {tool.icon}
              </div>

              <h2 className={styles.toolName}>{tool.name}</h2>
              <p className={styles.toolDescription}>{tool.description}</p>

              <div className={styles.toolFeatures}>
                <h4>{isAdmin ? "Admin Capabilities:" : "Key Features:"}</h4>
                <ul>
                  {(isAdmin ? tool.adminFeatures : tool.features).map(
                    (feature, index) => (
                      <li key={index}>{feature}</li>
                    ),
                  )}
                </ul>
              </div>

              {!tool.comingSoon && (
                <button
                  className={styles.launchButton}
                  style={{ backgroundColor: tool.color }}
                >
                  {isAdmin ? "Open Admin Dashboard" : "Launch Tool"}{" "}
                  <FiArrowRight />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>🚀 More Tools Coming Soon</h3>
            <p>
              We're constantly developing new AI-powered tools to help your
              organization work smarter. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolsMenu;
