// controllers/adminSystemController.js
import User from "../models/User.js";

// Get system-wide stats for admin overview
export const getSystemStats = async (req, res) => {
  try {
    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get user growth data (last 7 days)
    const userGrowth = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      userGrowth.push({
        date: startOfDay.toLocaleDateString("en-US", { weekday: "short" }),
        count,
      });
    }

    // Get plan distribution
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ plan: "free" });
    const proUsers = await User.countDocuments({ plan: "pro" });
    const enterpriseUsers = await User.countDocuments({ plan: "enterprise" });
    const adminUsers = await User.countDocuments({ plan: "admin" });

    // Get active users (logged in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeSessions = await User.countDocuments({
      lastLogin: { $gte: twentyFourHoursAgo },
    });

    // Get API usage stats
    const apiUsageResult = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$apiUsage", 0] } },
        },
      },
    ]);

    // Get recent registrations
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        userGrowth,
        planDistribution: {
          free: freeUsers,
          pro: proUsers,
          enterprise: enterpriseUsers,
          admin: adminUsers,
        },
        activeSessions,
        totalApiCalls: apiUsageResult[0]?.total || 0,
        serverLoad: Math.floor(Math.random() * 30) + 40, // Mock data
        uptime: 99.9,
        recentRegistrations,
        totalUsers,
      },
    });
  } catch (error) {
    console.error("❌ System stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system stats",
    });
  }
};

// Get system logs
export const getSystemLogs = async (req, res) => {
  try {
    // Mock system logs - in production, this would come from a Logs collection
    const mockLogs = [
      {
        id: 1,
        level: "info",
        message: "User authentication successful",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: "john@example.com",
        action: "LOGIN",
      },
      {
        id: 2,
        level: "warn",
        message: "API rate limit warning for user",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: "jane@example.com",
        action: "API_LIMIT",
      },
      {
        id: 3,
        level: "info",
        message: "Daily database backup completed successfully",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        user: "system",
        action: "BACKUP",
      },
      {
        id: 4,
        level: "error",
        message: "Payment processing failed - invalid card",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        user: "bob@example.com",
        action: "PAYMENT",
      },
      {
        id: 5,
        level: "info",
        message: "New user registration",
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        user: "newuser@example.com",
        action: "REGISTER",
      },
    ];

    res.json({
      success: true,
      logs: mockLogs,
      total: mockLogs.length,
    });
  } catch (error) {
    console.error("❌ System logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system logs",
    });
  }
};

// Get revenue stats
export const getRevenueStats = async (req, res) => {
  try {
    // Get paid users count
    const proUsers = await User.countDocuments({ plan: "pro" });
    const enterpriseUsers = await User.countDocuments({ plan: "enterprise" });

    // Calculate revenue (mock for now)
    const monthlyRevenue = proUsers * 29 + enterpriseUsers * 99;
    const activeSubscriptions = proUsers + enterpriseUsers;
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ plan: "free" });

    // Calculate conversion rate
    const conversionRate =
      totalUsers > 0
        ? ((activeSubscriptions / (totalUsers - freeUsers)) * 100).toFixed(1)
        : 0;

    // Mock growth and churn rates
    const monthlyGrowth = 12.5;
    const churnRate = 2.5;

    const revenueData = {
      monthlyRevenue,
      monthlyGrowth,
      activeSubscriptions,
      churnRate,
      conversionRate: parseFloat(conversionRate),
      revenueByPlan: {
        pro: proUsers * 29,
        enterprise: enterpriseUsers * 99,
      },
    };

    res.json({
      success: true,
      revenue: revenueData,
    });
  } catch (error) {
    console.error("❌ Revenue stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch revenue stats",
    });
  }
};
