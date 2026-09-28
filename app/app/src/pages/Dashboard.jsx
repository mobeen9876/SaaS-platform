import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBarChart2,
  FiKey,
  FiPackage,
  FiUser,
  FiLogOut,
  FiSettings,
  FiFileText,
  FiCreditCard,
  FiHelpCircle,
  FiBell,
  FiSearch,
  FiActivity,
  FiDatabase,
  FiUsers,
  FiTrendingUp,
  FiDownload,
  FiUpload,
  FiCalendar,
  FiStar,
  FiShield,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiMail,
  FiLock,
  FiMenu,
  FiUserX,
  FiUserCheck,
  FiRefreshCw,
  FiCheck,
  FiDollarSign,
  FiServer,
  FiGlobe,
  FiAlertCircle,
  FiGrid,
  FiEye,
  FiEyeOff,
  FiPlay,
  FiPause,
  FiMaximize,
  FiMinimize,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiAlertTriangle,
  FiInfo,
  FiTerminal,
  FiClock,
  FiHash,
  FiPieChart,
  FiChevronUp,
  FiChevronDown,
  FiArrowUp,
  FiArrowDown,
  FiZap,
  FiCloud,
  FiLayers,
  FiTool,
} from "react-icons/fi";
import styles from "./dashboard.module.css";
import {
  showConfirm,
  showSuccess,
  showError,
  showPaymentSuccess,
} from "../utils/swal";
import { initializePusher } from "../config/pusher";
import Swal from "sweetalert2";
import { API_URL } from "../config/api";
import { validateToken, logout } from "../utils/authUtils";

import { formatShortDate } from "../utils/dateUtils";

// Simple chart component for real-time data
const SystemChart = ({ data, color, height = 100, title }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.length === 0) return;

    const padding = 20;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, color]);

  return (
    <div className={styles.chartContainer}>
      {title && <div className={styles.chartTitle}>{title}</div>}
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className={styles.chartCanvas}
      />
    </div>
  );
};

// Gauge component for metrics
const MetricGauge = ({ value, max = 100, color, label, unit = "%" }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={styles.gaugeContainer}>
      <div className={styles.gauge}>
        <div
          className={styles.gaugeFill}
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        ></div>
      </div>
      <div className={styles.gaugeInfo}>
        <span className={styles.gaugeValue}>
          {value}
          {unit}
        </span>
        <span className={styles.gaugeLabel}>{label}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [adminPanelView, setAdminPanelView] = useState("users");
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile drawer state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileChangingPassword, setProfileChangingPassword] = useState(false);
  const [profilePasswordData, setProfilePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileShowPasswords, setProfileShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const adminDropdownRef = useRef(null);
  const [userFilter, setUserFilter] = useState("all"); // all, pending, approved, rejected
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // Controls whether the admin panel is shown (vs overview)
  const showAdminPanel = activeTab === "admin" && user?.role === "admin";
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [timeRange, setTimeRange] = useState("5m");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data streams
  const [cpuUsage, setCpuUsage] = useState([]);
  const [memoryUsage, setMemoryUsage] = useState([]);
  const [networkTraffic, setNetworkTraffic] = useState([]);
  const [apiRequests, setApiRequests] = useState([]);
  const [activeConnections, setActiveConnections] = useState(0);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseTime: 0,
    errorRate: 0,
    throughput: 0,
    latency: 0,
  });

  // Admin state variables
  const [adminUsers, setAdminUsers] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    freeUsers: 0,
    conversionRate: 0,
  });

  // Technician state variables
  const [isTechnician, setIsTechnician] = useState(false);
  const [technicianIssuesCount, setTechnicianIssuesCount] = useState({
    total: 0,
    pending: 0,
    new: 0,
  });
  const [hasNewTechIssue, setHasNewTechIssue] = useState(false);
  const prevTechIssuesRef = useRef(0);

  // Technician request state
  const [techRequestStatus, setTechRequestStatus] = useState("none"); // none | pending | approved | rejected
  const [techRequestMessage, setTechRequestMessage] = useState("");
  const [showTechRequestForm, setShowTechRequestForm] = useState(false);
  const [techRequestLoading, setTechRequestLoading] = useState(false);

  // Technician management
  const [technicians, setTechnicians] = useState([]);
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [selectedUserForTech, setSelectedUserForTech] = useState(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);

  // System stats for admin
  const [systemStats, setSystemStats] = useState({
    userGrowth: [],
    planDistribution: { free: 0, pro: 0, enterprise: 0, admin: 0 },
    activeSessions: 0,
    totalApiCalls: 0,
    serverLoad: 0,
    uptime: 0,
    recentRegistrations: 0,
    totalUsers: 0,
    cpuLoad: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkIn: 0,
    networkOut: 0,
    databaseConnections: 0,
    cacheHitRate: 0,
  });

  const [revenueStats, setRevenueStats] = useState({
    monthlyRevenue: 0,
    monthlyGrowth: 0,
    activeSubscriptions: 0,
    churnRate: 0,
    conversionRate: 0,
    totalRevenue: 0,
    avgRevenuePerUser: 0,
  });

  const [systemLogs, setSystemLogs] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // User overview data - DYNAMIC
  const [userOverviewData, setUserOverviewData] = useState({
    apiUsage: { used: 0, total: 10000, percentage: 0 },
    storage: { used: 0, total: 100, unit: "GB" },
    activeProjects: 0,
    teamMembers: 0,
    recentActivity: [],
    userStats: null,
  });

  // User stats
  const [userStats, setUserStats] = useState({
    apiCalls: { used: 0, total: 10000, percentage: 0 },
    storage: { used: 0, total: 100, unit: "GB" },
    activeProjects: 0,
    teamMembers: 0,
  });

  // Refs for intervals
  const updateIntervalRef = useRef(null);
  const dataStreamIntervalRef = useRef(null);
  const alertCheckIntervalRef = useRef(null);
  const userDataIntervalRef = useRef(null);
  const pusherRef = useRef(null);

  // Reset tab based on role on every mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const isAdmin = parsedUser.role === "admin";
      setActiveTab(isAdmin ? "admin" : "overview");
      setAdminExpanded(isAdmin);
    }
  }, []);

  // Handle clicking outside admin dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target)
      ) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Real-time admin notifications via Pusher
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialize Pusher and subscribe to the admin channel
    const pusherInstance = initializePusher(token);
    pusherRef.current = pusherInstance;

    const channel = pusherInstance.subscribe("admin-channel");

    channel.bind("new-registration", (data) => {
      const newUser = data?.user;

      setPendingRegistrations((prev) => {
        if (prev.some((u) => String(u._id) === String(newUser?.id)))
          return prev;
        return [
          {
            _id: newUser?.id,
            firstName: newUser?.firstName,
            lastName: newUser?.lastName,
            email: newUser?.email,
            plan: newUser?.plan || "free",
            createdAt: newUser?.createdAt || new Date().toISOString(),
            registrationStatus: "pending",
          },
          ...prev,
        ];
      });

      setAdminStats((prev) => ({
        ...prev,
        totalUsers: (prev.totalUsers || 0) + 1,
      }));
    });

    channel.bind("technician-request", (data) => {
      const reqUser = data?.user;
      if (!reqUser) return;
      setTechnicianRequests((prev) => {
        if (prev.some((r) => String(r._id) === String(reqUser.id))) return prev;
        return [
          {
            _id: reqUser.id,
            firstName: reqUser.firstName,
            lastName: reqUser.lastName,
            email: reqUser.email,
            plan: reqUser.plan || "free",
            technicianRequestMessage: reqUser.message || "",
            technicianRequestedAt:
              reqUser.requestedAt || new Date().toISOString(),
          },
          ...prev,
        ];
      });
    });

    return () => {
      channel.unbind_all();
      pusherInstance.unsubscribe("admin-channel");
      pusherInstance.disconnect();
      pusherRef.current = null;
    };
  }, [user]);

  // User-side: listen for technician request approval/rejection
  useEffect(() => {
    if (!user || user.role === "admin") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const pusherInstance = initializePusher(token);
    const channel = pusherInstance.subscribe(`user-${user.id || user._id}`);

    channel.bind("technician-request-approved", () => {
      setTechRequestStatus("approved");
    });

    channel.bind("technician-request-rejected", () => {
      setTechRequestStatus("rejected");
    });

    return () => {
      channel.unbind_all();
      pusherInstance.unsubscribe(`user-${user.id || user._id}`);
      pusherInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      navigate("/login");
      return;
    }

    // Check if redirected from successful payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const isPaymentReturn = paymentStatus === "success";

    if (isPaymentReturn) {
      window.history.replaceState({}, document.title, "/dashboard");

      // Show the success modal immediately — don't make the user wait
      // We'll read the plan from localStorage as a best-guess while polling confirms
      const cachedUser = JSON.parse(userData || "{}");
      showPaymentSuccess(
        cachedUser.plan && cachedUser.plan !== "free" ? cachedUser.plan : "pro",
        cachedUser.billingCycle || "monthly",
      );

      // Poll the backend in the background to sync the confirmed plan
      let attempts = 0;
      const maxAttempts = 8; // try for ~16 seconds
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (data?.success && data.user) {
            const updatedUser = {
              id: data.user._id || data.user.id,
              ...data.user,
            };

            // Webhook has fired — sync the confirmed plan silently
            if (
              data.user.plan !== "free" ||
              data.user.subscriptionStatus === "trialing" ||
              data.user.subscriptionStatus === "active"
            ) {
              clearInterval(pollInterval);
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
              window.dispatchEvent(new Event("auth-changed"));
            } else if (attempts >= maxAttempts) {
              // Webhook never arrived — update state but warn the user
              clearInterval(pollInterval);
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
              showError(
                "Payment was received by Stripe but your plan hasn't been activated yet. Please wait a moment and refresh the page, or contact support if this persists.",
              );
            }
          }
        } catch (err) {
          if (attempts >= maxAttempts) clearInterval(pollInterval);
        }
      }, 2000);
    }

    // Validate token and fetch fresh profile from server
    const initializeDashboard = async () => {
      try {
        const isValid = await validateToken();

        if (!isValid) {
          await showError("Your session has expired. Please login again.");
          logout(navigate);
          return;
        }

        // Always fetch fresh profile from server — never trust stale localStorage
        // for the plan guard decision
        let freshUser = null;
        try {
          const res = await fetch(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data?.success && data.user) {
            freshUser = {
              id: data.user._id || data.user.id,
              ...data.user,
            };
            // Sync localStorage with fresh data
            localStorage.setItem("user", JSON.stringify(freshUser));
          }
        } catch (_) {}

        const parsedUser = freshUser || JSON.parse(userData);

        // Enforce plan selection for non-admin users who haven't chosen a plan
        // Skip this guard if the user just returned from a Stripe payment
        if (
          parsedUser.role !== "admin" &&
          !parsedUser.hasSelectedPlan &&
          !isPaymentReturn
        ) {
          navigate("/pricing");
          return;
        }

        setUser(parsedUser);
        // Load technician request status from fresh profile
        if (parsedUser.role !== "admin") {
          setTechRequestStatus(parsedUser.technicianRequestStatus || "none");
        }
        setProfileData({
          firstName: parsedUser.firstName || "",
          lastName: parsedUser.lastName || "",
          email: parsedUser.email || "",
        });
        setLoading(false);

        // Set tab based on role
        setActiveTab(parsedUser.role === "admin" ? "admin" : "overview");

        // Initialize real-time data
        initializeRealTimeData();

        // If admin, fetch admin data immediately
        if (parsedUser.role === "admin") {
          fetchAdminData();
          fetchTechnicians();
        } else {
          fetchUserData();
          startUserDataUpdates();
          checkIfTechnician();
        }

        if (parsedUser.role === "admin") {
          startRealTimeUpdates();
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        logout(navigate);
      }
    };

    initializeDashboard();

    // Cleanup on unmount
    return () => {
      stopRealTimeUpdates();
      stopUserDataUpdates();
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [navigate]);

  // Check if user is a technician and fetch their issues
  const checkIfTechnician = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/ai-tools/issues/my-assigned/count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setIsTechnician(true);
        setTechnicianIssuesCount({
          total: data.total || 0,
          pending: data.pending || 0,
          new: data.new || 0,
        });
        prevTechIssuesRef.current = data.new;

        // Poll for new issues every 30 seconds
        setInterval(async () => {
          const res = await fetch(
            `${API_URL}/ai-tools/issues/my-assigned/count`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (res.ok) {
            const newData = await res.json();
            setTechnicianIssuesCount({
              total: newData.total || 0,
              pending: newData.pending || 0,
              new: newData.new || 0,
            });

            // Check for new issues
            if (newData.new > prevTechIssuesRef.current) {
              setHasNewTechIssue(true);
              playNotificationSound();
              setTimeout(() => {
                setHasNewTechIssue(false);
              }, 800);
            }
            prevTechIssuesRef.current = newData.new;
          }
        }, 30000);
      }
    } catch (error) {
      console.error("Error checking technician status:", error);
      setIsTechnician(false);
    }
  };

  // Fetch admin data when admin tab is active or when user is admin
  useEffect(() => {
    if (user?.role === "admin") {
      if (activeTab === "admin" || activeTab === "overview") {
        fetchAdminData();
      }
    }
  }, [activeTab, user]);

  // Fetch user data when tab is overview and user is not admin
  useEffect(() => {
    if (user?.role !== "admin" && activeTab === "overview") {
      fetchUserData();
    }
  }, [activeTab, user]);

  // Start/stop real-time updates based on toggle
  useEffect(() => {
    if (
      realTimeUpdates &&
      user?.role === "admin" &&
      activeTab === "admin" &&
      adminPanelView === "system"
    ) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => {
      stopRealTimeUpdates();
    };
  }, [realTimeUpdates, activeTab, adminPanelView, user]);

  // Start/stop user data updates
  const startUserDataUpdates = () => {
    stopUserDataUpdates();
    userDataIntervalRef.current = setInterval(() => {
      updateUserData();
    }, 5000); // Update every 5 seconds
  };

  const stopUserDataUpdates = () => {
    if (userDataIntervalRef.current) {
      clearInterval(userDataIntervalRef.current);
      userDataIntervalRef.current = null;
    }
  };

  const initializeRealTimeData = () => {
    // Initialize with sample data
    const initialData = Array.from({ length: 20 }, () => ({
      cpu: 30 + Math.random() * 50,
      memory: 40 + Math.random() * 40,
      network: 10 + Math.random() * 50,
      api: 100 + Math.random() * 400,
    }));

    setCpuUsage(initialData.map((d) => d.cpu));
    setMemoryUsage(initialData.map((d) => d.memory));
    setNetworkTraffic(initialData.map((d) => d.network));
    setApiRequests(initialData.map((d) => d.api));

    // Initialize system stats with realistic values
    setSystemStats((prev) => ({
      ...prev,
      cpuLoad: 45.5,
      memoryUsage: 62.3,
      diskUsage: 75.8,
      networkIn: 245.6,
      networkOut: 189.3,
      activeSessions: 156,
      serverLoad: 58.2,
      totalApiCalls: 1254300,
      uptime: 99.95,
      databaseConnections: 48,
      cacheHitRate: 92.4,
    }));

    // Initialize performance metrics
    setPerformanceMetrics({
      responseTime: 125.4,
      errorRate: 0.23,
      throughput: 2350,
      latency: 42.8,
    });

    // Initialize alerts
    setSystemAlerts([
      {
        id: 1,
        type: "success",
        message: "All systems operational",
        time: "2 minutes ago",
      },
      {
        id: 2,
        type: "info",
        message: "Scheduled maintenance completed",
        time: "1 hour ago",
      },
      {
        id: 3,
        type: "warning",
        message: "Memory usage above 70%",
        time: "3 hours ago",
      },
    ]);

    // Initialize revenue stats
    setRevenueStats({
      monthlyRevenue: 45280,
      monthlyGrowth: 12.5,
      activeSubscriptions: 342,
      churnRate: 2.3,
      conversionRate: 15.8,
      totalRevenue: 452800,
      avgRevenuePerUser: 132.4,
    });
  };

  const updateUserData = () => {
    // Simulate dynamic user data updates
    setUserStats((prev) => {
      const newApiCalls = Math.min(
        prev.apiCalls.total,
        prev.apiCalls.used + Math.floor(Math.random() * 10),
      );
      const newStorage = Math.min(
        prev.storage.total,
        prev.storage.used + Math.random() * 0.1,
      );

      return {
        apiCalls: {
          ...prev.apiCalls,
          used: newApiCalls,
          percentage: (newApiCalls / prev.apiCalls.total) * 100,
        },
        storage: {
          ...prev.storage,
          used: parseFloat(newStorage.toFixed(1)),
          percentage: (newStorage / prev.storage.total) * 100,
        },
        activeProjects: Math.max(
          0,
          Math.min(10, prev.activeProjects + (Math.random() > 0.5 ? 1 : -1)),
        ),
        teamMembers: Math.max(
          0,
          Math.min(10, prev.teamMembers + (Math.random() > 0.7 ? 1 : 0)),
        ),
      };
    });
  };

  const startRealTimeUpdates = () => {
    // Clear existing intervals
    stopRealTimeUpdates();

    // Update system metrics every 2 seconds
    updateIntervalRef.current = setInterval(() => {
      updateSystemMetrics();
      updatePerformanceMetrics();
      if (Math.random() < 0.1) generateRandomAlert();
    }, 2000);

    // Simulate data stream every second
    dataStreamIntervalRef.current = setInterval(() => {
      updateDataStreams();
    }, 1000);

    // Check for critical alerts every 30 seconds
    alertCheckIntervalRef.current = setInterval(() => {
      checkCriticalAlerts();
    }, 30000);
  };

  const stopRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    if (dataStreamIntervalRef.current) {
      clearInterval(dataStreamIntervalRef.current);
      dataStreamIntervalRef.current = null;
    }
    if (alertCheckIntervalRef.current) {
      clearInterval(alertCheckIntervalRef.current);
      alertCheckIntervalRef.current = null;
    }
  };

  const updateSystemMetrics = () => {
    // Generate realistic system metrics with slight variations
    const newCpuLoad = Math.max(
      10,
      Math.min(95, (systemStats?.cpuLoad || 45.5) + (Math.random() - 0.5) * 10),
    );
    const newMemoryUsage = Math.max(
      30,
      Math.min(
        90,
        (systemStats?.memoryUsage || 62.3) + (Math.random() - 0.5) * 5,
      ),
    );
    const newDiskUsage = Math.max(
      50,
      Math.min(85, (systemStats?.diskUsage || 75.8) + (Math.random() - 0.1)),
    );
    const newNetworkIn = Math.max(
      100,
      Math.min(
        500,
        (systemStats?.networkIn || 245.6) + (Math.random() - 0.5) * 50,
      ),
    );
    const newNetworkOut = Math.max(
      80,
      Math.min(
        400,
        (systemStats?.networkOut || 189.3) + (Math.random() - 0.5) * 40,
      ),
    );
    const newActiveSessions = Math.max(
      100,
      Math.min(
        300,
        (systemStats?.activeSessions || 156) +
          Math.floor((Math.random() - 0.5) * 10),
      ),
    );

    setSystemStats((prev) => ({
      ...prev,
      cpuLoad: parseFloat(newCpuLoad.toFixed(1)),
      memoryUsage: parseFloat(newMemoryUsage.toFixed(1)),
      diskUsage: parseFloat(newDiskUsage.toFixed(1)),
      networkIn: parseFloat(newNetworkIn.toFixed(1)),
      networkOut: parseFloat(newNetworkOut.toFixed(1)),
      activeSessions: newActiveSessions,
      serverLoad: parseFloat(((newCpuLoad + newMemoryUsage) / 2).toFixed(1)),
      totalApiCalls:
        (prev.totalApiCalls || 1254300) + Math.floor(Math.random() * 100),
      databaseConnections: Math.max(
        20,
        Math.min(
          80,
          (prev.databaseConnections || 48) +
            Math.floor((Math.random() - 0.5) * 5),
        ),
      ),
      cacheHitRate: Math.max(
        85,
        Math.min(99, (prev.cacheHitRate || 92.4) + (Math.random() - 0.5)),
      ),
    }));
  };

  const updatePerformanceMetrics = () => {
    setPerformanceMetrics((prev) => ({
      responseTime: Math.max(
        50,
        Math.min(
          300,
          (prev.responseTime || 125.4) + (Math.random() - 0.5) * 20,
        ),
      ),
      errorRate: Math.max(
        0,
        Math.min(2, (prev.errorRate || 0.23) + (Math.random() - 0.5) * 0.1),
      ),
      throughput: Math.max(
        1000,
        Math.min(5000, (prev.throughput || 2350) + (Math.random() - 0.5) * 200),
      ),
      latency: Math.max(
        10,
        Math.min(100, (prev.latency || 42.8) + (Math.random() - 0.5) * 10),
      ),
    }));
  };

  const updateDataStreams = () => {
    // Update CPU usage stream
    setCpuUsage((prev) => {
      const newValue = Math.max(
        20,
        Math.min(90, (prev[prev.length - 1] || 50) + (Math.random() - 0.5) * 5),
      );
      return [...prev.slice(1), newValue];
    });

    // Update memory usage stream
    setMemoryUsage((prev) => {
      const newValue = Math.max(
        30,
        Math.min(85, (prev[prev.length - 1] || 60) + (Math.random() - 0.5) * 3),
      );
      return [...prev.slice(1), newValue];
    });

    // Update network traffic stream
    setNetworkTraffic((prev) => {
      const newValue = Math.max(
        5,
        Math.min(
          60,
          (prev[prev.length - 1] || 30) + (Math.random() - 0.5) * 10,
        ),
      );
      return [...prev.slice(1), newValue];
    });

    // Update API requests stream
    setApiRequests((prev) => {
      const newValue = Math.max(
        50,
        Math.min(
          500,
          (prev[prev.length - 1] || 250) + (Math.random() - 0.5) * 50,
        ),
      );
      return [...prev.slice(1), newValue];
    });

    // Update active connections
    setActiveConnections((prev) => {
      const change = Math.random() > 0.5 ? 1 : -1;
      return Math.max(0, Math.min(100, prev + change));
    });
  };

  const generateRandomAlert = () => {
    const alerts = [
      {
        type: "warning",
        message: "High memory usage detected on container-03",
      },
      {
        type: "info",
        message: "New user session established from new location",
      },
      { type: "success", message: "Auto-scaling triggered for increased load" },
      { type: "error", message: "Database connection pool nearing capacity" },
      { type: "warning", message: "API response time above threshold" },
      { type: "info", message: "Backup job completed successfully" },
      { type: "success", message: "Load balancer health check passed" },
    ];

    const alert = alerts[Math.floor(Math.random() * alerts.length)];
    const newAlert = {
      id: Date.now(),
      ...alert,
      time: "Just now",
    };

    setSystemAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
  };

  const checkCriticalAlerts = () => {
    if ((systemStats?.cpuLoad || 0) > 85) {
      const alert = {
        id: Date.now(),
        type: "error",
        message: `Critical: CPU load at ${systemStats?.cpuLoad || 0}%`,
        time: "Just now",
      };
      setSystemAlerts((prev) => [alert, ...prev.slice(0, 4)]);
      if ((systemStats?.cpuLoad || 0) > 90) {
        showError(`Critical CPU Alert: ${systemStats?.cpuLoad || 0}% usage!`);
      }
    }

    if ((systemStats?.memoryUsage || 0) > 85) {
      const alert = {
        id: Date.now(),
        type: "error",
        message: `Critical: Memory usage at ${systemStats?.memoryUsage || 0}%`,
        time: "Just now",
      };
      setSystemAlerts((prev) => [alert, ...prev.slice(0, 4)]);
    }
  };

  const handleClearAlert = (id) => {
    setSystemAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const handleClearAllAlerts = () => {
    setSystemAlerts([]);
    showSuccess("All alerts cleared!");
  };

  const handleRefreshMetrics = () => {
    updateSystemMetrics();
    updatePerformanceMetrics();
    if (user?.role === "admin") {
      fetchAdminData();
    } else {
      fetchUserData();
    }
    showSuccess("Metrics refreshed successfully!");
  };

  const handleExportMetrics = () => {
    const metrics = {
      timestamp: new Date().toISOString(),
      systemStats,
      performanceMetrics,
      alerts: systemAlerts,
      timeRange,
    };

    const blob = new Blob([JSON.stringify(metrics, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess("Metrics exported successfully!");
  };

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(console.log);
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      if (user?.role === "admin") {
        startRealTimeUpdates();
      } else {
        startUserDataUpdates();
      }
    } else {
      if (user?.role === "admin") {
        stopRealTimeUpdates();
      } else {
        stopUserDataUpdates();
      }
    }
  };

  // Fetch user data function
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      // Simulate API call with realistic data
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      // Generate realistic user data based on user plan
      const plan = userData.plan || "free";
      let apiTotal = 10000;
      let storageTotal = 100;

      if (plan === "pro") {
        apiTotal = 50000;
        storageTotal = 500;
      } else if (plan === "enterprise") {
        apiTotal = 100000;
        storageTotal = 1000;
      }

      // Simulate API call response
      setTimeout(() => {
        const apiUsed = Math.floor(Math.random() * apiTotal * 0.3) + 1000;
        const storageUsed = parseFloat(
          (Math.random() * storageTotal * 0.2 + 2).toFixed(1),
        );

        setUserStats({
          apiCalls: {
            used: apiUsed,
            total: apiTotal,
            percentage: (apiUsed / apiTotal) * 100,
          },
          storage: {
            used: storageUsed,
            total: storageTotal,
            unit: "GB",
            percentage: (storageUsed / storageTotal) * 100,
          },
          activeProjects: Math.floor(Math.random() * 5) + 1,
          teamMembers: Math.floor(Math.random() * 8) + 2,
        });

        // Update user overview data
        setUserOverviewData({
          apiUsage: {
            used: apiUsed,
            total: apiTotal,
            percentage: (apiUsed / apiTotal) * 100,
          },
          storage: { used: storageUsed, total: storageTotal, unit: "GB" },
          activeProjects: Math.floor(Math.random() * 5) + 1,
          teamMembers: Math.floor(Math.random() * 8) + 2,
          recentActivity: [
            {
              id: 1,
              action: "API key created",
              time: "2 hours ago",
              icon: <FiKey />,
            },
            {
              id: 2,
              action: "Project updated",
              time: "Yesterday",
              icon: <FiPackage />,
            },
            {
              id: 3,
              action: "Plan upgraded",
              time: "2 days ago",
              icon: <FiTrendingUp />,
            },
            {
              id: 4,
              action: "New team member added",
              time: "1 week ago",
              icon: <FiUsers />,
            },
          ],
          userStats: null,
        });
      }, 500);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to static data
      setUserStats({
        apiCalls: { used: 1250, total: 10000, percentage: 12.5 },
        storage: { used: 2.5, total: 100, unit: "GB" },
        activeProjects: 3,
        teamMembers: 5,
      });
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    const confirmed = await showConfirm(
      `Are you sure you want to change this user's role to ${newRole}?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(data.message || "User role updated successfully!");
        fetchAdminData();
      } else {
        await showError(data.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      await showError("Failed to update user role");
    }
  };

  const handleUpdateUserPlan = async (userId, newPlan) => {
    const targetUser = adminUsers.find((u) => u._id === userId);
    if (targetUser?.role === "admin") {
      await showError("Cannot change plan for admin users");
      return;
    }

    const confirmed = await showConfirm(
      `Are you sure you want to change this user's plan to ${newPlan}?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/admin/users/${userId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(data.message || "User plan updated successfully!");
        fetchAdminData();
      } else {
        await showError(data.error || "Failed to update user plan");
      }
    } catch (error) {
      console.error("Error updating user plan:", error);
      await showError("Failed to update user plan");
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    const action = isActive ? "deactivate" : "activate";
    const confirmed = await showConfirm(
      `Are you sure you want to ${action} this user?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/users/${userId}/toggle-status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        await showSuccess(`User ${action}d successfully!`);
        fetchAdminData();
      } else {
        const errorData = await response.json();
        await showError(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      await showError("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await showConfirm(
      "Are you sure you want to permanently delete this user? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(data.message || "User deleted successfully!");
        fetchAdminData();
        fetchTechnicians(); // Refresh technicians list
      } else {
        await showError(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      await showError("Failed to delete user");
    }
  };

  // Fetch technicians list
  const fetchTechnicians = async () => {
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
    }
  };

  // Check if user is already a technician
  const isUserTechnician = (userId) => {
    return technicians.some(
      (tech) => tech.userId._id === userId || tech.userId === userId,
    );
  };

  // Handle make technician
  const handleMakeTechnician = (userItem) => {
    setSelectedUserForTech(userItem);
    setSelectedSpecializations([]);
    setShowAddTechModal(true);
  };

  // Handle toggle specialization
  const handleToggleSpecialization = (spec) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(
        selectedSpecializations.filter((s) => s !== spec),
      );
    } else {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  // Handle add technician
  const handleAddTechnician = async () => {
    if (!selectedUserForTech) {
      await showError("No user selected");
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
          userId: selectedUserForTech._id,
          specializations: selectedSpecializations,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          `${selectedUserForTech.firstName} ${selectedUserForTech.lastName} is now a technician!`,
        );
        setShowAddTechModal(false);
        setSelectedUserForTech(null);
        setSelectedSpecializations([]);
        fetchTechnicians();
      } else {
        await showError(data.error || "Failed to add technician");
      }
    } catch (error) {
      console.error("Error adding technician:", error);
      await showError("Failed to add technician");
    }
  };

  // Handle close modal
  const handleCloseAddTechModal = () => {
    setShowAddTechModal(false);
    setSelectedUserForTech(null);
    setSelectedSpecializations([]);
  };

  // Handle revoke technician
  const handleRevokeTechnician = async (userItem) => {
    const confirmed = await showConfirm(
      `Are you sure you want to revoke technician status from ${userItem.firstName} ${userItem.lastName}? All assigned issues will be unassigned.`,
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/ai-tools/technicians/${userItem._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          `${userItem.firstName} ${userItem.lastName} is no longer a technician. ${data.unassignedIssues || 0} issues were unassigned.`,
        );
        fetchTechnicians();
      } else {
        await showError(data.error || "Failed to revoke technician status");
      }
    } catch (error) {
      console.error("Error revoking technician:", error);
      await showError("Failed to revoke technician status");
    }
  };

  // Registration management functions
  const handleApproveRegistration = async (userId, userName) => {
    const confirmed = await showConfirm(
      `Are you sure you want to approve ${userName}'s registration?`,
    );
    if (!confirmed) return;

    // Remove from list immediately — no waiting for server round-trip
    setPendingRegistrations((prev) => prev.filter((u) => u._id !== userId));

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/registrations/${userId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Revert on failure
        fetchAdminData();
        await showError(data.error || "Failed to approve registration");
      }
    } catch (error) {
      console.error("Error approving registration:", error);
      fetchAdminData();
      await showError("Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (userId, userName) => {
    const reason = prompt(`Why are you rejecting ${userName}'s registration?`);
    if (reason === null) return;

    const confirmed = await showConfirm(
      `Are you sure you want to reject ${userName}'s registration?`,
    );
    if (!confirmed) return;

    // Remove from list immediately
    setPendingRegistrations((prev) => prev.filter((u) => u._id !== userId));

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/registrations/${userId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Revert on failure
        fetchAdminData();
        await showError(data.error || "Failed to reject registration");
      }
    } catch (error) {
      console.error("Error rejecting registration:", error);
      fetchAdminData();
      await showError("Failed to reject registration");
    }
  };

  // Admin reset user password
  const handleResetUserPassword = async (userId, userName, userEmail) => {
    // Use SweetAlert2 for better UX
    const { value: newPassword } = await Swal.fire({
      title: "Reset Password",
      html: `
        <div style="text-align: left; margin-bottom: 1rem;">
          <strong>User:</strong> ${userName}<br>
          <strong>Email:</strong> ${userEmail}
        </div>
        <input 
          id="swal-input-password" 
          class="swal2-input" 
          type="password" 
          placeholder="Enter new password (min 6 characters)"
          style="margin-bottom: 0.5rem;"
        >
        <div style="font-size: 0.8rem; color: #666; text-align: left;">
          Password requirements:
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li>At least 6 characters</li>
            <li>Recommended: Include uppercase, lowercase, numbers, and symbols</li>
          </ul>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Reset Password",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f59e0b",
      preConfirm: () => {
        const password = document.getElementById("swal-input-password").value;
        if (!password) {
          Swal.showValidationMessage("Please enter a password");
          return false;
        }
        if (password.length < 6) {
          Swal.showValidationMessage(
            "Password must be at least 6 characters long",
          );
          return false;
        }
        return password;
      },
    });

    if (!newPassword) return; // User cancelled

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/admin/reset-user-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await showSuccess(data.message || "Password reset successfully!");
        console.log("✅ Password reset for:", userEmail);
      } else {
        await showError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting user password:", error);
      await showError("Failed to reset user password");
    }
  };

  const fetchAdminData = async () => {
    if (user?.role !== "admin") return;

    console.log("🔄 Fetching admin data...");
    setLoadingAdmin(true);
    try {
      const token = localStorage.getItem("token");
      console.log("📝 Token:", token ? "Present" : "Missing");
      console.log("🌐 API_URL:", API_URL);

      // Fetch admin stats - simulate if API fails
      try {
        console.log("📊 Fetching admin stats from:", `${API_URL}/admin/stats`);
        const statsResponse = await fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📊 Admin stats response status:", statsResponse.status);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log("✅ Admin stats loaded:", statsData);
          setAdminStats(statsData.stats);
        } else {
          const errorData = await statsResponse.json();
          console.error(
            "❌ Admin stats failed:",
            statsResponse.status,
            errorData,
          );
        }
      } catch (error) {
        console.error("❌ Admin stats error:", error);
        // Simulate admin stats
        setAdminStats({
          totalUsers: 1250,
          activeUsers: 987,
          freeUsers: 650,
          conversionRate: 12.5,
        });
      }

      // Fetch system stats - simulate if API fails
      try {
        const systemResponse = await fetch(`${API_URL}/admin/system-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          setSystemStats((prev) => ({
            ...prev,
            ...systemData.stats,
          }));
        }
      } catch (error) {
        // Use current system stats
      }

      // Fetch revenue stats - simulate if API fails
      try {
        const revenueResponse = await fetch(`${API_URL}/admin/revenue-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (revenueResponse.ok) {
          const revenueData = await revenueResponse.json();
          setRevenueStats(revenueData.revenue);
        }
      } catch (error) {
        // Use current revenue stats
      }

      // Fetch all users - simulate if API fails
      try {
        const usersResponse = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setAdminUsers(usersData.users);
        } else {
          simulateAdminData();
        }
      } catch (error) {
        simulateAdminData();
      }

      // Fetch pending registrations
      try {
        const pendingResponse = await fetch(
          `${API_URL}/admin/pending-registrations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingRegistrations(pendingData.pendingUsers || []);
        } else {
          setPendingRegistrations([]);
        }
      } catch (error) {
        console.error("Error fetching pending registrations:", error);
        setPendingRegistrations([]);
      }

      // Fetch technician requests (so badge shows on refresh)
      try {
        const techRes = await fetch(`${API_URL}/admin/technician-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const techData = await techRes.json();
        if (techRes.ok) setTechnicianRequests(techData.requests || []);
      } catch (error) {
        console.error("Error fetching technician requests:", error);
      }

      // Fetch system logs - simulate if API fails
      try {
        const logsResponse = await fetch(`${API_URL}/admin/system-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setSystemLogs(logsData.logs || []);
        }
      } catch (error) {
        // Generate sample logs
        const sampleLogs = [
          {
            id: 1,
            level: "info",
            message: "System startup completed",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 2,
            level: "info",
            message: "User authentication successful",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: 3,
            level: "warning",
            message: "High memory usage detected",
            timestamp: new Date(Date.now() - 900000).toISOString(),
          },
          {
            id: 4,
            level: "info",
            message: "Database backup initiated",
            timestamp: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: 5,
            level: "info",
            message: "API request processed",
            timestamp: new Date(Date.now() - 300000).toISOString(),
          },
        ];
        setSystemLogs(sampleLogs);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      simulateAdminData();
    } finally {
      setLoadingAdmin(false);
    }
  };

  const simulateAdminData = () => {
    // Simulate admin data for demo purposes
    const simulatedUsers = Array.from({ length: 15 }, (_, i) => ({
      _id: `user-${i}`,
      firstName: ["John", "Jane", "Bob", "Alice", "Charlie", "Diana"][i % 6],
      lastName: ["Doe", "Smith", "Johnson", "Williams", "Brown", "Jones"][
        i % 6
      ],
      email: `user${i}@example.com`,
      role: i === 0 ? "admin" : "user",
      plan: ["free", "pro", "enterprise"][i % 3],
      isActive: Math.random() > 0.2,
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }));

    setAdminUsers(simulatedUsers);
    setAdminStats({
      totalUsers: 1250,
      activeUsers: 987,
      freeUsers: 650,
      conversionRate: 12.5,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleGoToProfile = () => {
    setShowProfile(true);
  };

  const handleProfileSave = async () => {
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
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileEditing(false);
        await showSuccess("Profile updated successfully!");
      } else {
        await showError(data.error || "Failed to update profile");
      }
    } catch {
      await showError("Failed to update profile.");
    }
  };

  const handleProfilePasswordChange = async () => {
    if (
      !profilePasswordData.currentPassword ||
      !profilePasswordData.newPassword ||
      !profilePasswordData.confirmPassword
    ) {
      await showError("Please fill in all password fields");
      return;
    }
    if (
      profilePasswordData.newPassword !== profilePasswordData.confirmPassword
    ) {
      await showError("New passwords do not match");
      return;
    }
    if (profilePasswordData.newPassword.length < 6) {
      await showError("Password must be at least 6 characters");
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
          currentPassword: profilePasswordData.currentPassword,
          newPassword: profilePasswordData.newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setProfilePasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setProfileChangingPassword(false);
        await showSuccess("Password changed successfully!");
      } else {
        await showError(data.error || "Failed to change password");
      }
    } catch {
      await showError("Failed to change password.");
    }
  };

  // Filter users based on selected filter
  const getFilteredUsers = () => {
    if (userFilter === "all") {
      return adminUsers;
    } else if (userFilter === "pending") {
      return adminUsers.filter((user) => user.registrationStatus === "pending");
    } else if (userFilter === "approved") {
      return adminUsers.filter(
        (user) =>
          user.registrationStatus === "approved" || !user.registrationStatus,
      );
    } else if (userFilter === "rejected") {
      return adminUsers.filter(
        (user) => user.registrationStatus === "rejected",
      );
    }
    return adminUsers;
  };

  const filteredUsers = getFilteredUsers();

  // Get user counts for each status
  const getUserCounts = () => {
    const all = adminUsers.length;
    const pending = adminUsers.filter(
      (user) => user.registrationStatus === "pending",
    ).length;
    const approved = adminUsers.filter(
      (user) =>
        user.registrationStatus === "approved" || !user.registrationStatus,
    ).length;
    const rejected = adminUsers.filter(
      (user) => user.registrationStatus === "rejected",
    ).length;

    return { all, pending, approved, rejected };
  };

  const userCounts = getUserCounts();

  // Notification sound effect (optional)
  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  // Track previous pending count to detect new notifications
  const prevPendingCountRef = useRef(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    if (
      user?.role === "admin" &&
      pendingRegistrations.length > prevPendingCountRef.current
    ) {
      // New notification detected
      if (prevPendingCountRef.current > 0) {
        // Don't play sound on initial load
        playNotificationSound();
        setHasNewNotification(true);

        // Remove the new notification class after animation
        setTimeout(() => {
          setHasNewNotification(false);
        }, 800);
      }
    }
    prevPendingCountRef.current = pendingRegistrations.length;
  }, [pendingRegistrations.length, user?.role]);

  // Handle registration status update
  const handleUpdateRegistrationStatus = async (userId, newStatus) => {
    const targetUser = adminUsers.find((u) => u._id === userId);
    if (!targetUser) return;

    const confirmed = await showConfirm(
      `Are you sure you want to change ${targetUser.firstName} ${targetUser.lastName}'s registration status to "${newStatus}"?`,
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/users/${userId}/registration-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ registrationStatus: newStatus }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        await showSuccess(
          data.message || "Registration status updated successfully!",
        );
        fetchAdminData();
      } else {
        await showError(data.error || "Failed to update registration status");
      }
    } catch (error) {
      console.error("Error updating registration status:", error);
      await showError("Failed to update registration status");
    }
  };

  const recentActivity = [
    { id: 1, action: "API key created", time: "2 hours ago", icon: <FiKey /> },
    {
      id: 2,
      action: "Project updated",
      time: "Yesterday",
      icon: <FiPackage />,
    },
    {
      id: 3,
      action: "Plan upgraded",
      time: "2 days ago",
      icon: <FiTrendingUp />,
    },
    {
      id: 4,
      action: "New team member added",
      time: "1 week ago",
      icon: <FiUsers />,
    },
  ];

  const quickLinks = [
    {
      icon: <FiFileText />,
      label: "Documentation",
      description: "API docs & guides",
    },
    {
      icon: <FiHelpCircle />,
      label: "Support",
      description: "Get help & contact",
    },
    { icon: <FiActivity />, label: "Status", description: "System status" },
    {
      icon: <FiDownload />,
      label: "Export Data",
      description: "Download reports",
    },
  ];

  const planFeatures = {
    free: ["100 API calls/day", "Basic analytics", "Email support"],
    pro: [
      "Unlimited API calls",
      "Advanced analytics",
      "Priority support",
      "Team collaboration",
    ],
    enterprise: [
      "Everything in Pro",
      "Dedicated support",
      "Custom solutions",
      "SLA guarantee",
    ],
    admin: [
      "Full system access",
      "User management",
      "System monitoring",
      "Revenue analytics",
      "Unlimited everything",
    ],
  };

  const renderPlanDisplay = () => {
    if (user?.role === "admin") {
      return null;
    }

    return (
      <div className={styles.sidebarPlan}>
        <div className={styles.planBadge}>
          <FiStar />
          <span>{user?.plan?.toUpperCase()} PLAN</span>
        </div>
        <p>
          You're on the <strong>{user?.plan}</strong> plan
        </p>
        <button
          onClick={() => navigate("/pricing")}
          className={styles.upgradeBtn}
        >
          Upgrade Plan
        </button>
      </div>
    );
  };

  const renderAdminOverview = () => (
    <>
      <div className={styles.welcomeHeader}>
        <div>
          <h1>Welcome back, Administrator! 👋</h1>
          <p className={styles.welcomeSubtitle}>
            System overview and quick access to management tools.
          </p>
        </div>
        <div className={styles.dateDisplay}>
          <FiCalendar />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Admin Overview Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.stat1}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div className={styles.statTrend}>Total</div>
          </div>
          <h3>Total Users</h3>
          <div className={styles.statValue}>{adminStats?.totalUsers || 0}</div>
          <p className={styles.statLabel}>Registered users</p>
        </div>

        <div className={`${styles.statCard} ${styles.stat2}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.statTrend}>Active</div>
          </div>
          <h3>Active Users</h3>
          <div className={styles.statValue}>{adminStats?.activeUsers || 0}</div>
          <p className={styles.statLabel}>Currently active</p>
        </div>

        <div className={`${styles.statCard} ${styles.stat3}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiCreditCard />
            </div>
            <div className={styles.statTrend}>Paid</div>
          </div>
          <h3>Paid Users</h3>
          <div className={styles.statValue}>
            {(adminStats?.totalUsers || 0) - (adminStats?.freeUsers || 0)}
          </div>
          <p className={styles.statLabel}>On paid plans</p>
        </div>

        <div className={`${styles.statCard} ${styles.stat4}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiBarChart2 />
            </div>
            <div className={styles.statTrend}>Growth</div>
          </div>
          <h3>Conversion Rate</h3>
          <div className={styles.statValue}>
            {adminStats?.conversionRate || 0}%
          </div>
          <p className={styles.statLabel}>Free to paid</p>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className={styles.adminOverviewActions}>
        <h3>Quick Actions</h3>
        <div className={styles.adminActionGrid}>
          <button
            className={styles.adminOverviewBtn}
            onClick={() => setActiveTab("admin")}
          >
            <FiUsers /> Manage Users
          </button>
          <button
            className={styles.adminOverviewBtn}
            onClick={() => {
              setActiveTab("admin");
              setAdminPanelView("system");
            }}
          >
            <FiServer /> System Monitor
          </button>
          <button className={styles.adminOverviewBtn}>
            <FiDatabase /> Backup System
          </button>
          <button className={styles.adminOverviewBtn}>
            <FiSettings /> System Settings
          </button>
        </div>
      </div>

      {/* Recent User Activity */}
      <div className={styles.adminRecentActivity}>
        <h3>Recent User Registrations</h3>
        <div className={styles.activityList}>
          {adminUsers.slice(0, 4).map((userItem) => (
            <div key={userItem._id} className={styles.activityItem}>
              <div className={styles.userAvatar}>
                {userItem.firstName?.charAt(0)}
                {userItem.lastName?.charAt(0)}
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityAction}>
                  <strong>
                    {userItem.firstName} {userItem.lastName}
                  </strong>
                </p>
                <p className={styles.activityTime}>{userItem.email}</p>
              </div>
              <span
                className={`${styles.statusBadge} ${
                  userItem.role === "admin"
                    ? styles.adminBadge
                    : userItem.plan === "free"
                      ? styles.planFreeBadge
                      : userItem.plan === "pro"
                        ? styles.planProBadge
                        : styles.planEnterpriseBadge
                }`}
              >
                {userItem.role === "admin"
                  ? "ADMIN"
                  : userItem.plan?.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // Technician request handlers (user side)
  const handleSubmitTechRequest = async () => {
    setTechRequestLoading(true);
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
        setShowTechRequestForm(false);
        setTechRequestMessage("");
      } else {
        await showError(data.error || "Failed to submit request");
      }
    } catch {
      await showError("Failed to submit request");
    } finally {
      setTechRequestLoading(false);
    }
  };

  const handleCancelTechRequest = async () => {
    const confirmed = await showConfirm("Cancel your technician request?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/user/request-technician`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTechRequestStatus("none");
    } catch {
      await showError("Failed to cancel request");
    }
  };

  // Admin: technician request management
  const [technicianRequests, setTechnicianRequests] = useState([]);
  const [techRequestSpecializations, setTechRequestSpecializations] = useState(
    {},
  );

  const fetchTechnicianRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/technician-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTechnicianRequests(data.requests || []);
    } catch {}
  };

  const handleApproveTechRequest = async (userId, userName) => {
    const specs = techRequestSpecializations[userId];
    if (!specs || specs.length === 0) {
      await showError(
        "Please select at least one specialization before approving",
      );
      return;
    }
    // Remove immediately
    setTechnicianRequests((prev) => prev.filter((r) => r._id !== userId));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/admin/technician-requests/${userId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ specializations: specs }),
        },
      );
      if (!res.ok) {
        fetchTechnicianRequests();
        await showError("Failed to approve request");
      }
    } catch {
      fetchTechnicianRequests();
      await showError("Failed to approve request");
    }
  };

  const handleRejectTechRequest = async (userId) => {
    setTechnicianRequests((prev) => prev.filter((r) => r._id !== userId));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/admin/technician-requests/${userId}/reject`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        fetchTechnicianRequests();
        await showError("Failed to reject request");
      }
    } catch {
      fetchTechnicianRequests();
    }
  };

  const TECH_SPECIALIZATIONS = [
    "technical",
    "software",
    "hardware",
    "network",
    "maintenance",
    "other",
  ];

  const renderUserOverview = () => (
    <>
      <div className={styles.welcomeHeader}>
        <div>
          <h1>Welcome back, {user?.firstName}! 👋</h1>
          <p className={styles.welcomeSubtitle}>
            Here's what's happening with your account today.
          </p>
        </div>
        <div className={styles.dateDisplay}>
          <FiCalendar />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.stat1}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiActivity />
            </div>
            <div className={styles.statTrend}>
              {userStats.apiCalls.percentage > 80
                ? "⚠️ High"
                : userStats.apiCalls.percentage > 50
                  ? "↗️ Moderate"
                  : "↘️ Normal"}
            </div>
          </div>
          <h3>API Usage</h3>
          <div className={styles.statValue}>
            {userStats.apiCalls.used.toLocaleString()}/
            {userStats.apiCalls.total.toLocaleString()}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${userStats.apiCalls.percentage}%`,
                backgroundColor:
                  userStats.apiCalls.percentage > 80
                    ? "#ef4444"
                    : userStats.apiCalls.percentage > 50
                      ? "#f59e0b"
                      : "#10b981",
              }}
            ></div>
          </div>
          <p className={styles.statLabel}>API calls this month</p>
        </div>

        <div className={`${styles.statCard} ${styles.stat2}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiDatabase />
            </div>
            <div className={styles.statTrend}>
              {userStats.storage.percentage > 80
                ? "⚠️ High"
                : userStats.storage.percentage > 50
                  ? "↗️ Moderate"
                  : "↘️ Normal"}
            </div>
          </div>
          <h3>Storage</h3>
          <div className={styles.statValue}>
            {userStats.storage.used} {userStats.storage.unit}/
            {userStats.storage.total} {userStats.storage.unit}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${userStats.storage.percentage}%`,
                backgroundColor:
                  userStats.storage.percentage > 80
                    ? "#ef4444"
                    : userStats.storage.percentage > 50
                      ? "#f59e0b"
                      : "#10b981",
              }}
            ></div>
          </div>
          <p className={styles.statLabel}>Storage used</p>
        </div>

        <div className={`${styles.statCard} ${styles.stat3}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiPackage />
            </div>
            <div className={styles.statTrend}>
              {userStats.activeProjects > 8 ? "⚠️ High" : "Active"}
            </div>
          </div>
          <h3>Active Projects</h3>
          <div className={styles.statValue}>{userStats.activeProjects}</div>
          <div className={styles.projectList}>
            <span className={styles.projectTag}>Project Alpha</span>
            <span className={styles.projectTag}>Project Beta</span>
            {userStats.activeProjects > 2 && (
              <span className={styles.projectTag}>
                +{userStats.activeProjects - 2} more
              </span>
            )}
          </div>
          <p className={styles.statLabel}>Currently running</p>
        </div>

        <div className={`${styles.statCard} ${styles.stat4}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div className={styles.statTrend}>Team</div>
          </div>
          <h3>Team Members</h3>
          <div className={styles.statValue}>{userStats.teamMembers}</div>
          <div className={styles.teamAvatars}>
            {Array.from({ length: Math.min(userStats.teamMembers, 5) }).map(
              (_, i) => (
                <div key={i} className={styles.teamAvatar}>
                  {String.fromCharCode(65 + i)}
                </div>
              ),
            )}
            {userStats.teamMembers > 5 && (
              <div className={styles.teamAvatarMore}>
                +{userStats.teamMembers - 5}
              </div>
            )}
          </div>
          <p className={styles.statLabel}>Active team members</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoColumn}>
        {/* Recent Activity */}
        <div className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <button className={styles.viewAllBtn}>View All →</button>
          </div>
          <div className={styles.activityList}>
            {userOverviewData.recentActivity.length > 0
              ? userOverviewData.recentActivity.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{activity.icon}</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityAction}>{activity.action}</p>
                      <p className={styles.activityTime}>{activity.time}</p>
                    </div>
                  </div>
                ))
              : recentActivity.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{activity.icon}</div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityAction}>{activity.action}</p>
                      <p className={styles.activityTime}>{activity.time}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.linksCard}>
          <div className={styles.cardHeader}>
            <h3>Quick Links</h3>
          </div>
          <div className={styles.linksGrid}>
            {quickLinks.map((link, index) => (
              <button
                key={index}
                className={styles.linkCard}
                onClick={() => {
                  if (index === 0) navigate("/docs");
                  else if (index === 1) navigate("/support");
                  else if (index === 2) navigate("/status");
                  else handleExportMetrics();
                }}
              >
                <div className={styles.linkIcon}>{link.icon}</div>
                <div className={styles.linkContent}>
                  <h4>{link.label}</h4>
                  <p>{link.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className={styles.planDetails}>
        <div className={styles.cardHeader}>
          <h3>Your Plan Details</h3>
          <button
            onClick={() => navigate("/pricing")}
            className={styles.upgradeBtn}
          >
            Upgrade Plan
          </button>
        </div>
        <div className={styles.planContent}>
          <div className={styles.planInfo}>
            <div className={styles.planName}>
              <h2>{user?.plan?.toUpperCase()} Plan</h2>
              <span className={styles.planPrice}>
                {user?.plan === "free"
                  ? "Free"
                  : user?.plan === "pro"
                    ? "$29/month"
                    : "$99/month"}
              </span>
            </div>
            <div className={styles.planFeatures}>
              <h4>Included Features:</h4>
              <ul>
                {(planFeatures[user?.plan] || []).map((feature, index) => (
                  <li key={index}>
                    <FiCheck /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={styles.planUsage}>
            <h4>Usage Summary</h4>
            <div className={styles.usageItem}>
              <span>API Calls</span>
              <span>
                {userStats.apiCalls.used.toLocaleString()}/
                {userStats.apiCalls.total.toLocaleString()}
              </span>
            </div>
            <div className={styles.usageItem}>
              <span>Storage</span>
              <span>
                {userStats.storage.used}
                {userStats.storage.unit}/{userStats.storage.total}
                {userStats.storage.unit}
              </span>
            </div>
            <div className={styles.usageItem}>
              <span>Projects</span>
              <span>{userStats.activeProjects}/10</span>
            </div>
            <div className={styles.usageItem}>
              <span>Team Members</span>
              <span>{userStats.teamMembers}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technician Request Card */}
      {!isTechnician && (
        <div className={styles.techRequestCard}>
          <div className={styles.techRequestHeader}>
            <div className={styles.techRequestIcon}>
              <FiTool />
            </div>
            <div>
              <h3>Become a Technician</h3>
              <p>
                Help resolve issues submitted by other users and grow your
                technical skills.
              </p>
            </div>
          </div>

          {techRequestStatus === "none" && (
            <>
              {!showTechRequestForm ? (
                <button
                  className={styles.techRequestBtn}
                  onClick={() => setShowTechRequestForm(true)}
                >
                  Request Technician Role
                </button>
              ) : (
                <div className={styles.techRequestForm}>
                  <textarea
                    className={styles.techRequestTextarea}
                    placeholder="Tell the admin why you'd like to become a technician and what skills you have (optional)..."
                    value={techRequestMessage}
                    onChange={(e) => setTechRequestMessage(e.target.value)}
                    rows={3}
                  />
                  <div className={styles.techRequestActions}>
                    <button
                      className={styles.techRequestSubmitBtn}
                      onClick={handleSubmitTechRequest}
                      disabled={techRequestLoading}
                    >
                      {techRequestLoading ? "Submitting..." : "Submit Request"}
                    </button>
                    <button
                      className={styles.techRequestCancelBtn}
                      onClick={() => {
                        setShowTechRequestForm(false);
                        setTechRequestMessage("");
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
            <div className={styles.techRequestStatus}>
              <span className={styles.techStatusPending}>
                ⏳ Request pending admin review
              </span>
              <button
                className={styles.techRequestCancelBtn}
                onClick={handleCancelTechRequest}
              >
                Cancel Request
              </button>
            </div>
          )}

          {techRequestStatus === "approved" && (
            <div className={styles.techRequestStatus}>
              <span className={styles.techStatusApproved}>
                ✅ Request approved — you are now a technician!
              </span>
            </div>
          )}

          {techRequestStatus === "rejected" && (
            <div className={styles.techRequestStatus}>
              <span className={styles.techStatusRejected}>
                ❌ Request was not approved
              </span>
              <button
                className={styles.techRequestBtn}
                onClick={() => setTechRequestStatus("none")}
              >
                Request Again
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderSystemMonitor = () => (
    <div
      className={`${styles.systemMonitor} ${
        fullscreen ? styles.fullscreen : ""
      }`}
    >
      <div className={styles.systemHeader}>
        <div>
          <h2>
            <FiServer /> System Monitor
            {realTimeUpdates && (
              <span className={styles.liveBadge}>● LIVE</span>
            )}
          </h2>
          <p className={styles.adminSubtitle}>
            Real-time system health and performance monitoring
          </p>
        </div>

        <div className={styles.systemControls}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Auto-refresh:</span>
            <button
              className={`${styles.toggleBtn} ${
                autoRefresh ? styles.active : ""
              }`}
              onClick={toggleAutoRefresh}
            >
              <span className={styles.toggleSlider}></span>
            </button>
          </div>

          <button
            className={styles.controlBtn}
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
            title={realTimeUpdates ? "Pause updates" : "Resume updates"}
          >
            {realTimeUpdates ? <FiPause /> : <FiPlay />}
          </button>

          <button
            className={styles.controlBtn}
            onClick={handleRefreshMetrics}
            title="Refresh metrics"
          >
            <FiRefreshCw className={loadingAdmin ? styles.spinning : ""} />
          </button>

          <select
            className={styles.timeRangeSelect}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="5m">Last 5 minutes</option>
            <option value="30m">Last 30 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
          </select>

          <button
            className={styles.controlBtn}
            onClick={handleExportMetrics}
            title="Export metrics"
          >
            <FiDownload />
          </button>

          <button
            className={styles.controlBtn}
            onClick={toggleFullscreen}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>

      {/* System Health Grid */}
      <div className={styles.healthGrid}>
        <div className={styles.healthCard}>
          <div className={styles.healthHeader}>
            <FiCpu />
            <span>CPU Load</span>
            <span className={styles.healthTrend}>
              {(systemStats?.cpuLoad || 0) > 80
                ? "⚠️ High"
                : (systemStats?.cpuLoad || 0) > 60
                  ? "↗️ Moderate"
                  : "↘️ Normal"}
            </span>
          </div>
          <div className={styles.healthStatus}>
            <span
              className={styles.statusDot}
              style={{
                backgroundColor:
                  (systemStats?.cpuLoad || 0) > 80
                    ? "#ef4444"
                    : (systemStats?.cpuLoad || 0) > 60
                      ? "#f59e0b"
                      : "#10b981",
              }}
            ></span>
            {(systemStats?.cpuLoad || 0).toFixed(1)}%
          </div>
          <MetricGauge
            value={systemStats?.cpuLoad || 0}
            max={100}
            color={
              (systemStats?.cpuLoad || 0) > 80
                ? "#ef4444"
                : (systemStats?.cpuLoad || 0) > 60
                  ? "#f59e0b"
                  : "#10b981"
            }
            label="Current load"
          />
          <SystemChart
            data={cpuUsage}
            color="#6366f1"
            title="CPU Usage History"
          />
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthHeader}>
            <FiHardDrive />
            <span>Memory Usage</span>
          </div>
          <div className={styles.healthStatus}>
            <span
              className={styles.statusDot}
              style={{
                backgroundColor:
                  (systemStats?.memoryUsage || 0) > 85
                    ? "#ef4444"
                    : (systemStats?.memoryUsage || 0) > 70
                      ? "#f59e0b"
                      : "#10b981",
              }}
            ></span>
            {(systemStats?.memoryUsage || 0).toFixed(1)}%
          </div>
          <MetricGauge
            value={systemStats?.memoryUsage || 0}
            max={100}
            color={
              (systemStats?.memoryUsage || 0) > 85
                ? "#ef4444"
                : (systemStats?.memoryUsage || 0) > 70
                  ? "#f59e0b"
                  : "#10b981"
            }
            label="Used memory"
          />
          <SystemChart
            data={memoryUsage}
            color="#10b981"
            title="Memory Usage History"
          />
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthHeader}>
            <FiDatabase />
            <span>Disk Usage</span>
          </div>
          <div className={styles.healthStatus}>
            <span
              className={styles.statusDot}
              style={{
                backgroundColor:
                  (systemStats?.diskUsage || 0) > 90
                    ? "#ef4444"
                    : (systemStats?.diskUsage || 0) > 75
                      ? "#f59e0b"
                      : "#10b981",
              }}
            ></span>
            {(systemStats?.diskUsage || 0).toFixed(1)}%
          </div>
          <MetricGauge
            value={systemStats?.diskUsage || 0}
            max={100}
            color={
              (systemStats?.diskUsage || 0) > 90
                ? "#ef4444"
                : (systemStats?.diskUsage || 0) > 75
                  ? "#f59e0b"
                  : "#10b981"
            }
            label="Storage used"
          />
          <div className={styles.diskInfo}>
            <div className={styles.diskStat}>
              <span>Total</span>
              <strong>500 GB</strong>
            </div>
            <div className={styles.diskStat}>
              <span>Free</span>
              <strong>
                {Math.round(500 * (1 - (systemStats?.diskUsage || 0) / 100))} GB
              </strong>
            </div>
            <div className={styles.diskStat}>
              <span>Used</span>
              <strong>
                {Math.round((500 * (systemStats?.diskUsage || 0)) / 100)} GB
              </strong>
            </div>
          </div>
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthHeader}>
            <FiWifi />
            <span>Network Traffic</span>
          </div>
          <div className={styles.healthStatus}>
            <span className={styles.statusOnline}>●</span>
            Active
          </div>
          <div className={styles.networkStats}>
            <div className={styles.networkStat}>
              <FiDownload />
              <div>
                <span className={styles.networkLabel}>Inbound</span>
                <span className={styles.networkValue}>
                  {typeof systemStats?.networkIn === "number"
                    ? systemStats.networkIn.toFixed(1)
                    : "0.0"}{" "}
                  MB/s
                </span>
              </div>
            </div>
            <div className={styles.networkStat}>
              <FiUpload />
              <div>
                <span className={styles.networkLabel}>Outbound</span>
                <span className={styles.networkValue}>
                  {typeof systemStats?.networkOut === "number"
                    ? systemStats.networkOut.toFixed(1)
                    : "0.0"}{" "}
                  MB/s
                </span>
              </div>
            </div>
          </div>
          <SystemChart
            data={networkTraffic}
            color="#8b5cf6"
            title="Network Activity"
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className={styles.performanceGrid}>
        <div className={styles.performanceCard}>
          <h3>
            <FiActivity /> Performance Metrics
          </h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <div
                className={styles.metricIcon}
                style={{ background: "#3b82f620" }}
              >
                <FiClock />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Response Time</span>
                <span className={styles.metricValue}>
                  {typeof performanceMetrics?.responseTime === "number"
                    ? performanceMetrics.responseTime.toFixed(1)
                    : "0.0"}
                  ms
                </span>
                <span className={styles.metricTrend}>
                  {(performanceMetrics?.responseTime || 0) > 200
                    ? "↑ High"
                    : "✓ Normal"}
                </span>
              </div>
            </div>

            <div className={styles.metricItem}>
              <div
                className={styles.metricIcon}
                style={{ background: "#ef444420" }}
              >
                <FiAlertTriangle />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Error Rate</span>
                <span className={styles.metricValue}>
                  {typeof performanceMetrics?.errorRate === "number"
                    ? performanceMetrics.errorRate.toFixed(2)
                    : "0.00"}
                  %
                </span>
                <span className={styles.metricTrend}>
                  {(performanceMetrics?.errorRate || 0) > 1
                    ? "↑ High"
                    : "✓ Normal"}
                </span>
              </div>
            </div>

            <div className={styles.metricItem}>
              <div
                className={styles.metricIcon}
                style={{ background: "#10b98120" }}
              >
                <FiTrendingUp />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Throughput</span>
                <span className={styles.metricValue}>
                  {typeof performanceMetrics?.throughput === "number"
                    ? performanceMetrics.throughput.toFixed(0)
                    : "0"}{" "}
                  req/s
                </span>
                <span className={styles.metricTrend}>
                  {(performanceMetrics?.throughput || 0) > 3000
                    ? "↑ High"
                    : "✓ Normal"}
                </span>
              </div>
            </div>

            <div className={styles.metricItem}>
              <div
                className={styles.metricIcon}
                style={{ background: "#8b5cf620" }}
              >
                <FiHash />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Active Connections</span>
                <span className={styles.metricValue}>{activeConnections}</span>
                <span className={styles.metricTrend}>
                  {activeConnections > 80 ? "↑ High" : "✓ Normal"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.additionalMetrics}>
            <div className={styles.additionalMetric}>
              <span>Database Connections:</span>
              <strong>{systemStats?.databaseConnections || 0}</strong>
            </div>
            <div className={styles.additionalMetric}>
              <span>Cache Hit Rate:</span>
              <strong>
                {typeof systemStats?.cacheHitRate === "number"
                  ? systemStats.cacheHitRate.toFixed(1)
                  : "0.0"}
                %
              </strong>
            </div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className={styles.revenueCard}>
          <h3>
            <FiDollarSign /> Revenue Overview
          </h3>
          <div className={styles.revenueGrid}>
            <div className={styles.revenueItem}>
              <div className={styles.revenueLabel}>Monthly Revenue</div>
              <div className={styles.revenueValue}>
                ${(revenueStats?.monthlyRevenue || 0).toLocaleString()}
              </div>
              <div className={styles.revenueTrend}>
                <FiTrendingUp /> +{revenueStats?.monthlyGrowth || 0}%
              </div>
            </div>

            <div className={styles.revenueItem}>
              <div className={styles.revenueLabel}>Active Subscriptions</div>
              <div className={styles.revenueValue}>
                {revenueStats?.activeSubscriptions || 0}
              </div>
              <div className={styles.revenueSubLabel}>Paid users</div>
            </div>

            <div className={styles.revenueItem}>
              <div className={styles.revenueLabel}>Churn Rate</div>
              <div className={styles.revenueValue}>
                {revenueStats?.churnRate || 0}%
              </div>
              <div className={styles.revenueSubLabel}>Monthly</div>
            </div>

            <div className={styles.revenueItem}>
              <div className={styles.revenueLabel}>Avg. Revenue/User</div>
              <div className={styles.revenueValue}>
                $
                {typeof revenueStats?.avgRevenuePerUser === "number"
                  ? revenueStats.avgRevenuePerUser.toFixed(2)
                  : "0.00"}
              </div>
              <div className={styles.revenueSubLabel}>Per month</div>
            </div>
          </div>

          <div className={styles.revenueChart}>
            <SystemChart
              data={apiRequests}
              color="#f59e0b"
              title="API Requests per minute"
            />
          </div>
        </div>
      </div>

      {/* Alerts and Logs */}
      <div className={styles.alertsLogsGrid}>
        {/* Real-time Alerts */}
        <div className={styles.alertsCard}>
          <div className={styles.alertsHeader}>
            <h3>
              <FiAlertCircle /> System Alerts
            </h3>
            <div className={styles.alertsControls}>
              <span className={styles.alertsCount}>{systemAlerts.length}</span>
              <button
                className={styles.clearAlertsBtn}
                onClick={handleClearAllAlerts}
                disabled={systemAlerts.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className={styles.alertsList}>
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`${styles.alertItem} ${styles[alert.type]}`}
              >
                <div className={styles.alertContent}>
                  <div className={styles.alertIcon}>
                    {alert.type === "error" && <FiAlertTriangle />}
                    {alert.type === "warning" && <FiAlertCircle />}
                    {alert.type === "info" && <FiInfo />}
                    {alert.type === "success" && <FiCheck />}
                  </div>
                  <div className={styles.alertMessage}>
                    {alert.message}
                    <span className={styles.alertTime}>{alert.time}</span>
                  </div>
                </div>
                <button
                  className={styles.alertDismiss}
                  onClick={() => handleClearAlert(alert.id)}
                >
                  ×
                </button>
              </div>
            ))}

            {systemAlerts.length === 0 && (
              <div className={styles.noAlerts}>
                <FiCheck className={styles.noAlertsIcon} />
                <p>All systems normal</p>
                <small>No active alerts</small>
              </div>
            )}
          </div>
        </div>

        {/* System Logs */}
        <div className={styles.systemLogs}>
          <div className={styles.logsHeader}>
            <h3>
              <FiTerminal /> System Logs
            </h3>
            <div className={styles.logsControls}>
              <button
                className={styles.logsFilter}
                onClick={() => setSystemLogs([])}
                disabled={systemLogs.length === 0}
              >
                Clear Logs
              </button>
              <button className={styles.viewAllBtn}>View All →</button>
            </div>
          </div>

          <div className={styles.logsContainer}>
            {systemLogs.slice(0, 8).map((log, index) => (
              <div key={log.id || index} className={styles.logItem}>
                <span
                  className={`${styles.logLevel} ${
                    styles[log.level || "info"]
                  }`}
                >
                  {log.level || "INFO"}
                </span>
                <span className={styles.logMessage}>
                  {log.message || "System operation"}
                </span>
                <span className={styles.logTime}>
                  {new Date(log.timestamp || new Date()).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    },
                  )}
                </span>
              </div>
            ))}

            {systemLogs.length === 0 && (
              <div className={styles.noLogs}>
                <FiTerminal className={styles.noLogsIcon} />
                <p>No system logs available</p>
                <small>Logs will appear here as they are generated</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Server Status */}
      <div className={styles.serverStatus}>
        <h3>
          <FiServer /> Server Cluster Status
        </h3>
        <div className={styles.serversGrid}>
          {[
            {
              name: "web-01",
              region: "US-East",
              cpu: 45,
              memory: 62,
              status: "healthy",
            },
            {
              name: "web-02",
              region: "US-East",
              cpu: 52,
              memory: 58,
              status: "healthy",
            },
            {
              name: "db-01",
              region: "US-East",
              cpu: 38,
              memory: 71,
              status: "warning",
            },
            {
              name: "cache-01",
              region: "US-West",
              cpu: 28,
              memory: 45,
              status: "healthy",
            },
            {
              name: "api-01",
              region: "EU-West",
              cpu: 65,
              memory: 68,
              status: "healthy",
            },
          ].map((server) => (
            <div key={server.name} className={styles.serverCard}>
              <div className={styles.serverHeader}>
                <div
                  className={`${styles.serverStatusDot} ${
                    styles[server.status]
                  }`}
                ></div>
                <span className={styles.serverName}>{server.name}</span>
                <span className={styles.serverRegion}>{server.region}</span>
              </div>

              <div className={styles.serverMetrics}>
                <div className={styles.serverMetric}>
                  <span>CPU</span>
                  <span>{server.cpu}%</span>
                </div>
                <div className={styles.serverMetric}>
                  <span>Memory</span>
                  <span>{server.memory}%</span>
                </div>
                <div className={styles.serverMetric}>
                  <span>Status</span>
                  <span
                    className={`${styles.statusText} ${styles[server.status]}`}
                  >
                    {server.status.charAt(0).toUpperCase() +
                      server.status.slice(1)}
                  </span>
                </div>
              </div>

              <button className={styles.serverAction}>
                <FiSettings /> Manage
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Summary */}
      <div className={styles.systemSummary}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>
            <FiGlobe />
          </div>
          <div className={styles.summaryContent}>
            <h4>System Uptime</h4>
            <p className={styles.summaryValue}>{systemStats?.uptime || 0}%</p>
            <p className={styles.summaryLabel}>Last 30 days</p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>
            <FiUsers />
          </div>
          <div className={styles.summaryContent}>
            <h4>Active Sessions</h4>
            <p className={styles.summaryValue}>
              {systemStats?.activeSessions || 0}
            </p>
            <p className={styles.summaryLabel}>Current users</p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>
            <FiActivity />
          </div>
          <div className={styles.summaryContent}>
            <h4>API Requests</h4>
            <p className={styles.summaryValue}>
              {systemStats?.totalApiCalls
                ? (systemStats.totalApiCalls / 1000).toFixed(1) + "K"
                : "0K"}
            </p>
            <p className={styles.summaryLabel}>This month</p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>
            <FiCloud />
          </div>
          <div className={styles.summaryContent}>
            <h4>Server Load</h4>
            <p className={styles.summaryValue}>
              {systemStats?.serverLoad || 0}%
            </p>
            <p className={styles.summaryLabel}>Average</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.dashboardLoading}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
        <p className={styles.loadingSubtitle}>
          Getting everything ready for you
        </p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Top Navigation Bar */}
      <nav className={styles.topNav}>
        <div className={styles.navLeft}>
          <button
            className={styles.hamburgerBtn}
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>

          <button
            className={styles.backButton}
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to Home"
          >
            <FiArrowLeft className={styles.backIcon} />
          </button>

          <div className={styles.logo}>
            <span className={styles.logoIcon}>🚀</span>
            <span className={styles.logoText}>SaaS Dashboard</span>
          </div>
        </div>

        <div className={styles.navRight}>
          {/* Notification Bell - Show for admins (registrations + technician requests) */}
          {user?.role === "admin" &&
            (() => {
              const totalPending =
                pendingRegistrations.length + technicianRequests.length;
              return (
                <div className={styles.notificationBell}>
                  <button
                    className={`${styles.bellButton} ${
                      totalPending > 0 ? styles.hasNotifications : ""
                    } ${hasNewNotification ? styles.newNotification : ""}`}
                    onClick={() => {
                      // Go to whichever has pending items, registrations takes priority
                      if (pendingRegistrations.length > 0) {
                        setAdminPanelView("registrations");
                      } else {
                        setAdminPanelView("technician-requests");
                      }
                      setActiveTab("admin");
                    }}
                    title={`${totalPending} pending request${totalPending !== 1 ? "s" : ""}`}
                  >
                    <FiBell className={styles.bellIcon} />
                    {totalPending > 0 && (
                      <span className={styles.notificationBadge}>
                        {totalPending > 99 ? "99+" : totalPending}
                      </span>
                    )}
                  </button>

                  {/* Notification Tooltip */}
                  {totalPending > 0 && (
                    <div className={styles.notificationTooltip}>
                      <div className={styles.tooltipHeader}>
                        <strong>
                          {totalPending} pending request
                          {totalPending !== 1 ? "s" : ""}
                        </strong>
                      </div>
                      <div className={styles.tooltipContent}>
                        {pendingRegistrations.length > 0 && (
                          <div
                            className={styles.tooltipItem}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setAdminPanelView("registrations");
                              setActiveTab("admin");
                            }}
                          >
                            <span className={styles.tooltipName}>
                              📋 Registration Requests
                            </span>
                            <span className={styles.tooltipEmail}>
                              {pendingRegistrations.length} pending
                            </span>
                          </div>
                        )}
                        {technicianRequests.length > 0 && (
                          <div
                            className={styles.tooltipItem}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setAdminPanelView("technician-requests");
                              setActiveTab("admin");
                            }}
                          >
                            <span className={styles.tooltipName}>
                              🔧 Technician Requests
                            </span>
                            <span className={styles.tooltipEmail}>
                              {technicianRequests.length} pending
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={styles.tooltipFooter}>
                        Click to view requests
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* Notification Bell - Show for technicians (assigned issues) */}
          {isTechnician && user?.role !== "admin" && (
            <div className={styles.notificationBell}>
              <button
                className={`${styles.bellButton} ${
                  technicianIssuesCount.new > 0 ? styles.hasNotifications : ""
                } ${hasNewTechIssue ? styles.newNotification : ""}`}
                onClick={() => navigate("/technician-issues")}
                title={`${technicianIssuesCount.new} new issue${technicianIssuesCount.new !== 1 ? "s" : ""} assigned`}
              >
                <FiBell className={styles.bellIcon} />
                {technicianIssuesCount.new > 0 && (
                  <span className={styles.notificationBadge}>
                    {technicianIssuesCount.new > 99
                      ? "99+"
                      : technicianIssuesCount.new}
                  </span>
                )}
              </button>

              {/* Notification Tooltip */}
              {technicianIssuesCount.new > 0 && (
                <div className={styles.notificationTooltip}>
                  <div className={styles.tooltipHeader}>
                    <strong>
                      {technicianIssuesCount.new} new issue
                      {technicianIssuesCount.new !== 1 ? "s" : ""}
                    </strong>
                  </div>
                  <div className={styles.tooltipContent}>
                    <div className={styles.tooltipItem}>
                      <span className={styles.tooltipName}>
                        Total Assigned: {technicianIssuesCount.total}
                      </span>
                      <span className={styles.tooltipEmail}>
                        Pending: {technicianIssuesCount.pending}
                      </span>
                    </div>
                  </div>
                  <div className={styles.tooltipFooter}>
                    Click to view your assigned issues
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.userMenu}>
            <div className={styles.navUserInfo}>
              <span className={styles.userName}>
                {user?.role === "admin"
                  ? "Administrator"
                  : `${user?.firstName} ${user?.lastName}`}
              </span>
            </div>
            <div className={styles.userActions}>
              <button
                onClick={handleGoToProfile}
                className={styles.iconBtn}
                title="Profile"
              >
                <FiUser />
              </button>
              <button
                onClick={handleLogout}
                className={styles.iconBtnLogout}
                title="Logout"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobileOpen : ""}`}
      >
        <div className={styles.sidebarMenu}>
          {user?.role === "admin" && (
            <>
              <button
                className={`${styles.menuItem} ${
                  activeTab === "admin" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("admin")}
              >
                <FiShield /> Admin Dashboard
              </button>

              <div className={styles.adminSubMenu}>
                <button
                  className={`${styles.adminSubItem} ${activeTab === "admin" && adminPanelView === "users" ? styles.adminSubActive : ""}`}
                  onClick={() => {
                    setActiveTab("admin");
                    setAdminPanelView("users");
                  }}
                >
                  <FiUsers /> User Management
                </button>
                <button
                  className={`${styles.adminSubItem} ${activeTab === "admin" && adminPanelView === "registrations" ? styles.adminSubActive : ""}`}
                  onClick={() => {
                    setActiveTab("admin");
                    setAdminPanelView("registrations");
                  }}
                >
                  <FiUserCheck /> Registration Requests
                  {pendingRegistrations.length > 0 && (
                    <span className={styles.adminSubBadge}>
                      {pendingRegistrations.length}
                    </span>
                  )}
                </button>
                <button
                  className={`${styles.adminSubItem} ${activeTab === "admin" && adminPanelView === "technician-requests" ? styles.adminSubActive : ""}`}
                  onClick={() => {
                    setActiveTab("admin");
                    setAdminPanelView("technician-requests");
                    fetchTechnicianRequests();
                  }}
                >
                  <FiTool /> Technician Requests
                  {technicianRequests.length > 0 && (
                    <span className={styles.adminSubBadge}>
                      {technicianRequests.length}
                    </span>
                  )}
                </button>
                <button
                  className={`${styles.adminSubItem} ${activeTab === "admin" && adminPanelView === "system" ? styles.adminSubActive : ""}`}
                  onClick={() => {
                    setActiveTab("admin");
                    setAdminPanelView("system");
                  }}
                >
                  <FiServer /> System Monitor
                </button>
              </div>
            </>
          )}

          <button
            className={styles.menuItem}
            onClick={() => navigate("/ai-tools")}
          >
            <FiZap /> AI Tools
          </button>

          <button
            className={`${styles.menuItem} ${
              activeTab === "overview" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <FiBarChart2 /> Overview
          </button>
        </div>

        {renderPlanDisplay()}
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {showAdminPanel ? (
          <div className={styles.adminPanel}>
            {adminPanelView === "users" ? (
              <>
                {/* Users Management Table */}
                <div className={styles.usersTableCard}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableHeaderLeft}>
                      <h3>
                        User Management
                        {userFilter !== "all" && (
                          <span
                            className={`${styles.filterBadge} ${styles[userFilter]}`}
                          >
                            {userFilter === "pending" && "⏳ Pending"}
                            {userFilter === "approved" && "✅ Approved"}
                            {userFilter === "rejected" && "❌ Rejected"}
                          </span>
                        )}
                      </h3>
                      <div className={styles.userFilterDropdown}>
                        <select
                          value={userFilter}
                          onChange={(e) => {
                            setUserFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={styles.filterSelect}
                        >
                          <option value="all">📊 All Users</option>
                          <option value="approved">✅ Approved Users</option>
                          <option value="pending">⏳ Pending Users</option>
                          <option value="rejected">❌ Rejected Users</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.tableActions}>
                      {userFilter !== "all" && (
                        <button
                          className={styles.clearFilterBtn}
                          onClick={() => setUserFilter("all")}
                          title="Clear filter"
                        >
                          Clear Filter
                        </button>
                      )}
                      <button
                        className={styles.refreshBtn}
                        onClick={fetchAdminData}
                        disabled={loadingAdmin}
                      >
                        <FiRefreshCw /> Refresh
                      </button>
                    </div>
                  </div>

                  {loadingAdmin ? (
                    <div className={styles.loadingContainer}>
                      <div className={styles.adminSpinner}></div>
                      <p>Loading user data...</p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.tableContainer}>
                        <table className={styles.usersTable}>
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Plan</th>
                              <th>AI Provider</th>
                              <th>Registration</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers
                              .slice(
                                (currentPage - 1) * USERS_PER_PAGE,
                                currentPage * USERS_PER_PAGE,
                              )
                              .map((userItem) => (
                                <tr
                                  key={userItem._id}
                                  className={
                                    userItem._id === user?.id
                                      ? styles.currentUser
                                      : ""
                                  }
                                >
                                  <td>
                                    <div className={styles.userCell}>
                                      <div className={styles.userAvatar}>
                                        {userItem.firstName?.charAt(0)}
                                        {userItem.lastName?.charAt(0)}
                                      </div>
                                      <div>
                                        <strong>
                                          {userItem.firstName}{" "}
                                          {userItem.lastName}
                                        </strong>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{userItem.email}</td>
                                  <td>
                                    <select
                                      value={userItem.role}
                                      onChange={(e) =>
                                        handleUpdateUserRole(
                                          userItem._id,
                                          e.target.value,
                                        )
                                      }
                                      className={`${styles.roleSelect} ${
                                        userItem.role === "admin"
                                          ? styles.adminRole
                                          : styles.userRole
                                      }`}
                                      disabled={userItem._id === user?.id}
                                    >
                                      <option value="user">User</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </td>
                                  <td>
                                    {userItem.role === "admin" ? (
                                      <span className={styles.adminPlanBadge}>
                                        ADMIN
                                      </span>
                                    ) : !userItem.hasSelectedPlan &&
                                      userItem.plan === "free" ? (
                                      <span className={styles.noPlanBadge}>
                                        — No Plan
                                      </span>
                                    ) : (
                                      <select
                                        value={userItem.plan}
                                        onChange={(e) =>
                                          handleUpdateUserPlan(
                                            userItem._id,
                                            e.target.value,
                                          )
                                        }
                                        className={`${styles.planSelect} ${
                                          userItem.plan === "free"
                                            ? styles.planFree
                                            : userItem.plan === "pro"
                                              ? styles.planPro
                                              : styles.planEnterprise
                                        }`}
                                        disabled={userItem._id === user?.id}
                                      >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">
                                          Enterprise
                                        </option>
                                      </select>
                                    )}
                                  </td>
                                  <td>
                                    {userItem.aiApiKeyVerified ? (
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "5px",
                                          color: "#10b981",
                                          fontWeight: "500",
                                        }}
                                      >
                                        ✓{" "}
                                        {userItem.aiProvider?.toUpperCase() ||
                                          "N/A"}
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          color: "#9ca3af",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        No API Key
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <select
                                      value={
                                        userItem.registrationStatus ||
                                        "approved"
                                      }
                                      onChange={(e) =>
                                        handleUpdateRegistrationStatus(
                                          userItem._id,
                                          e.target.value,
                                        )
                                      }
                                      className={`${styles.statusSelect} ${
                                        styles[
                                          `status${userItem.registrationStatus || "approved"}`
                                        ]
                                      }`}
                                      disabled={
                                        userItem._id === user?.id ||
                                        userItem.role === "admin"
                                      }
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="approved">Approved</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  </td>
                                  <td>
                                    <span
                                      className={`${styles.statusBadge} ${
                                        userItem.isActive
                                          ? styles.statusActive
                                          : styles.statusInactive
                                      }`}
                                    >
                                      {userItem.isActive
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </td>
                                  <td>
                                    <div className={styles.actionButtons}>
                                      {isUserTechnician(userItem._id) &&
                                      userItem.role !== "admin" ? (
                                        <button
                                          className={`${styles.actionBtn} ${styles.revokeTechnicianBtn}`}
                                          onClick={() =>
                                            handleRevokeTechnician(userItem)
                                          }
                                          title="Revoke Technician Status"
                                        >
                                          <FiUserX />
                                        </button>
                                      ) : !isUserTechnician(userItem._id) &&
                                        userItem.role !== "admin" ? (
                                        <button
                                          className={`${styles.actionBtn} ${styles.technicianBtn}`}
                                          onClick={() =>
                                            handleMakeTechnician(userItem)
                                          }
                                          title="Make Technician"
                                        >
                                          <FiUsers />
                                        </button>
                                      ) : null}

                                      <button
                                        className={`${styles.actionBtn} ${styles.passwordResetBtn}`}
                                        onClick={() =>
                                          handleResetUserPassword(
                                            userItem._id,
                                            `${userItem.firstName} ${userItem.lastName}`,
                                            userItem.email,
                                          )
                                        }
                                        title="Reset user password"
                                        disabled={userItem._id === user?.id}
                                      >
                                        <FiKey />
                                      </button>

                                      <button
                                        className={styles.actionBtn}
                                        onClick={() =>
                                          handleToggleUserStatus(
                                            userItem._id,
                                            userItem.isActive,
                                          )
                                        }
                                        title={
                                          userItem.isActive
                                            ? "Deactivate"
                                            : "Activate"
                                        }
                                        disabled={userItem._id === user?.id}
                                      >
                                        {userItem.isActive ? (
                                          <FiUserX />
                                        ) : (
                                          <FiUserCheck />
                                        )}
                                      </button>

                                      <button
                                        className={styles.actionBtn}
                                        onClick={() =>
                                          handleDeleteUser(userItem._id)
                                        }
                                        title={
                                          userItem._id === user?.id
                                            ? "You cannot delete your own account"
                                            : "Delete user"
                                        }
                                        disabled={userItem._id === user?.id}
                                      >
                                        <FiTrash2 />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      {filteredUsers.length === 0 && (
                        <div className={styles.noUsers}>
                          <p>
                            {userFilter === "all"
                              ? "No users found"
                              : userFilter === "pending"
                                ? "No pending users found"
                                : userFilter === "approved"
                                  ? "No approved users found"
                                  : "No rejected users found"}
                          </p>
                        </div>
                      )}

                      {filteredUsers.length > USERS_PER_PAGE && (
                        <div className={styles.pagination}>
                          <button
                            className={styles.pageBtn}
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            ‹ Prev
                          </button>

                          {Array.from(
                            {
                              length: Math.ceil(
                                filteredUsers.length / USERS_PER_PAGE,
                              ),
                            },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <button
                              key={page}
                              className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ""}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            className={styles.pageBtn}
                            onClick={() =>
                              setCurrentPage((p) =>
                                Math.min(
                                  Math.ceil(
                                    filteredUsers.length / USERS_PER_PAGE,
                                  ),
                                  p + 1,
                                ),
                              )
                            }
                            disabled={
                              currentPage ===
                              Math.ceil(filteredUsers.length / USERS_PER_PAGE)
                            }
                          >
                            Next ›
                          </button>

                          <span className={styles.pageInfo}>
                            {(currentPage - 1) * USERS_PER_PAGE + 1}–
                            {Math.min(
                              currentPage * USERS_PER_PAGE,
                              filteredUsers.length,
                            )}{" "}
                            of {filteredUsers.length}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : adminPanelView === "registrations" ? (
              <>
                {/* Registration Requests */}
                <div className={styles.registrationHeader}>
                  <h3>Pending Registration Requests</h3>
                  <div className={styles.registrationStats}>
                    <span className={styles.pendingCount}>
                      {pendingRegistrations.length} pending requests
                    </span>
                  </div>
                </div>

                {pendingRegistrations.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FiUserCheck className={styles.emptyIcon} />
                    <h4>No Pending Registrations</h4>
                    <p>All registration requests have been processed.</p>
                  </div>
                ) : (
                  <div className={styles.registrationsList}>
                    {pendingRegistrations.map((request) => (
                      <div
                        key={request._id}
                        className={styles.registrationCard}
                      >
                        <div className={styles.registrationInfo}>
                          <div className={styles.userAvatar}>
                            {request.firstName.charAt(0)}
                            {request.lastName.charAt(0)}
                          </div>
                          <div className={styles.userDetails}>
                            <h4>
                              {request.firstName} {request.lastName}
                            </h4>
                            <p className={styles.userEmail}>{request.email}</p>
                            <div className={styles.registrationMeta}>
                              <span className={styles.registrationDate}>
                                <FiCalendar />
                                Requested: {formatShortDate(request.createdAt)}
                              </span>
                              <span className={styles.registrationPlan}>
                                <FiPackage />
                                Plan: {request.plan}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.registrationActions}>
                          <button
                            className={`${styles.registrationActionBtn} ${styles.approveBtn}`}
                            onClick={() =>
                              handleApproveRegistration(
                                request._id,
                                `${request.firstName} ${request.lastName}`,
                              )
                            }
                          >
                            <FiUserCheck />
                            Approve
                          </button>
                          <button
                            className={`${styles.registrationActionBtn} ${styles.rejectBtn}`}
                            onClick={() =>
                              handleRejectRegistration(
                                request._id,
                                `${request.firstName} ${request.lastName}`,
                              )
                            }
                          >
                            <FiUserX />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : adminPanelView === "technician-requests" ? (
              <>
                {/* Technician Role Requests */}
                <div className={styles.registrationHeader}>
                  <h3>Technician Role Requests</h3>
                  <div className={styles.registrationStats}>
                    <span className={styles.pendingCount}>
                      {technicianRequests.length} pending requests
                    </span>
                  </div>
                </div>

                {technicianRequests.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FiTool className={styles.emptyIcon} />
                    <h4>No Pending Technician Requests</h4>
                    <p>No users have requested the technician role.</p>
                  </div>
                ) : (
                  <div className={styles.registrationsList}>
                    {technicianRequests.map((request) => (
                      <div
                        key={request._id}
                        className={styles.registrationCard}
                      >
                        <div className={styles.registrationInfo}>
                          <div className={styles.userAvatar}>
                            {request.firstName.charAt(0)}
                            {request.lastName.charAt(0)}
                          </div>
                          <div className={styles.userDetails}>
                            <h4>
                              {request.firstName} {request.lastName}
                            </h4>
                            <p className={styles.userEmail}>{request.email}</p>
                            {request.technicianRequestMessage && (
                              <p className={styles.techRequestMsg}>
                                "{request.technicianRequestMessage}"
                              </p>
                            )}
                            <div className={styles.registrationMeta}>
                              <span className={styles.registrationDate}>
                                <FiCalendar />
                                Requested:{" "}
                                {formatShortDate(request.technicianRequestedAt)}
                              </span>
                              <span className={styles.registrationPlan}>
                                <FiPackage />
                                Plan: {request.plan}
                              </span>
                            </div>
                            {/* Specialization picker */}
                            <div className={styles.specPicker}>
                              <p className={styles.specPickerLabel}>
                                Assign specializations:
                              </p>
                              <div className={styles.specPickerTags}>
                                {TECH_SPECIALIZATIONS.map((spec) => (
                                  <button
                                    key={spec}
                                    className={`${styles.specTag} ${
                                      (
                                        techRequestSpecializations[
                                          request._id
                                        ] || []
                                      ).includes(spec)
                                        ? styles.specTagActive
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const current =
                                        techRequestSpecializations[
                                          request._id
                                        ] || [];
                                      const updated = current.includes(spec)
                                        ? current.filter((s) => s !== spec)
                                        : [...current, spec];
                                      setTechRequestSpecializations((prev) => ({
                                        ...prev,
                                        [request._id]: updated,
                                      }));
                                    }}
                                  >
                                    {spec}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.registrationActions}>
                          <button
                            className={`${styles.registrationActionBtn} ${styles.approveBtn}`}
                            onClick={() =>
                              handleApproveTechRequest(
                                request._id,
                                `${request.firstName} ${request.lastName}`,
                              )
                            }
                          >
                            <FiUserCheck /> Approve
                          </button>
                          <button
                            className={`${styles.registrationActionBtn} ${styles.rejectBtn}`}
                            onClick={() => handleRejectTechRequest(request._id)}
                          >
                            <FiUserX /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : adminPanelView === "system" ? (
              renderSystemMonitor()
            ) : (
              renderSystemMonitor()
            )}
          </div>
        ) : /* Regular Dashboard Content */
        user?.role === "admin" ? (
          renderAdminOverview()
        ) : (
          renderUserOverview()
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer className={styles.statusBar}>
        <div className={styles.statusItem}>
          <div className={`${styles.statusDot} ${styles.online}`}></div>
          <span>
            System Status: <strong>Operational</strong>
          </span>
        </div>
        <div className={styles.statusItem}>
          <span>
            Last Updated:{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className={styles.statusItem}>
          <span>API Version: v1.2.3</span>
        </div>
        {realTimeUpdates && user?.role === "admin" && (
          <div className={styles.statusItem}>
            <span className={styles.liveIndicator}>● LIVE</span>
          </div>
        )}
      </footer>

      {/* Add Technician Modal */}
      {showAddTechModal && selectedUserForTech && (
        <div className={styles.modalOverlay} onClick={handleCloseAddTechModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>
                <FiUsers /> Make {selectedUserForTech.firstName}{" "}
                {selectedUserForTech.lastName} a Technician
              </h2>
              <button
                className={styles.closeButton}
                onClick={handleCloseAddTechModal}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.userInfoModal}>
                <div className={styles.userAvatar}>
                  {selectedUserForTech.firstName?.charAt(0)}
                  {selectedUserForTech.lastName?.charAt(0)}
                </div>
                <div>
                  <h4>
                    {selectedUserForTech.firstName}{" "}
                    {selectedUserForTech.lastName}
                  </h4>
                  <p>{selectedUserForTech.email}</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Select Specializations (at least one)</label>
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
                disabled={selectedSpecializations.length === 0}
              >
                <FiUsers /> Make Technician
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {showProfile && (
        <div
          className={styles.profileOverlay}
          onClick={() => setShowProfile(false)}
        >
          <div
            className={styles.profileDrawer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h2>My Profile</h2>
              <button
                className={styles.drawerClose}
                onClick={() => setShowProfile(false)}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Avatar + name */}
              <div className={styles.drawerAvatar}>
                <div className={styles.avatarCircle}>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </div>
                <div>
                  <h3>
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <span className={styles.drawerRole}>{user?.role}</span>
                </div>
              </div>

              {/* Profile Info */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h4>Profile Information</h4>
                  {!profileEditing ? (
                    <button
                      className={styles.drawerEditBtn}
                      onClick={() => setProfileEditing(true)}
                    >
                      <FiEdit /> Edit
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className={styles.drawerSaveBtn}
                        onClick={handleProfileSave}
                      >
                        <FiSave /> Save
                      </button>
                      <button
                        className={styles.drawerCancelBtn}
                        onClick={() => {
                          setProfileEditing(false);
                          setProfileData({
                            firstName: user?.firstName || "",
                            lastName: user?.lastName || "",
                            email: user?.email || "",
                          });
                        }}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.drawerFormGrid}>
                  <div className={styles.drawerFormGroup}>
                    <label>First Name</label>
                    {profileEditing ? (
                      <input
                        className={styles.drawerInput}
                        name="firstName"
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData((p) => ({
                            ...p,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <div className={styles.drawerValue}>
                        {user?.firstName}
                      </div>
                    )}
                  </div>
                  <div className={styles.drawerFormGroup}>
                    <label>Last Name</label>
                    {profileEditing ? (
                      <input
                        className={styles.drawerInput}
                        name="lastName"
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData((p) => ({
                            ...p,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <div className={styles.drawerValue}>{user?.lastName}</div>
                    )}
                  </div>
                  <div
                    className={styles.drawerFormGroup}
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <label>Email</label>
                    <div className={styles.drawerValue}>
                      <FiMail /> {user?.email}{" "}
                      <span className={styles.drawerNote}>
                        (Cannot be changed)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionHeader}>
                  <h4>Security</h4>
                  {!profileChangingPassword ? (
                    <button
                      className={styles.drawerEditBtn}
                      onClick={() => setProfileChangingPassword(true)}
                    >
                      <FiLock /> Change Password
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className={styles.drawerSaveBtn}
                        onClick={handleProfilePasswordChange}
                      >
                        <FiSave /> Update
                      </button>
                      <button
                        className={styles.drawerCancelBtn}
                        onClick={() => {
                          setProfileChangingPassword(false);
                          setProfilePasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
                {profileChangingPassword && (
                  <div className={styles.drawerFormGrid}>
                    {["currentPassword", "newPassword", "confirmPassword"].map(
                      (field) => (
                        <div
                          key={field}
                          className={styles.drawerFormGroup}
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <label>
                            {field === "currentPassword"
                              ? "Current Password"
                              : field === "newPassword"
                                ? "New Password"
                                : "Confirm Password"}
                          </label>
                          <div className={styles.drawerPasswordWrap}>
                            <input
                              className={styles.drawerInput}
                              type={
                                profileShowPasswords[
                                  field
                                    .replace("Password", "")
                                    .replace("current", "current")
                                    .replace("new", "new")
                                    .replace("confirm", "confirm")
                                ]
                                  ? "text"
                                  : "password"
                              }
                              value={profilePasswordData[field]}
                              onChange={(e) =>
                                setProfilePasswordData((p) => ({
                                  ...p,
                                  [field]: e.target.value,
                                }))
                              }
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className={styles.drawerEyeBtn}
                              onClick={() => {
                                const k =
                                  field === "currentPassword"
                                    ? "current"
                                    : field === "newPassword"
                                      ? "new"
                                      : "confirm";
                                setProfileShowPasswords((p) => ({
                                  ...p,
                                  [k]: !p[k],
                                }));
                              }}
                            >
                              {profileShowPasswords[
                                field === "currentPassword"
                                  ? "current"
                                  : field === "newPassword"
                                    ? "new"
                                    : "confirm"
                              ] ? (
                                <FiEyeOff />
                              ) : (
                                <FiEye />
                              )}
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
