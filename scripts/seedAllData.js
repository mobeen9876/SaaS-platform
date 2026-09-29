/**
 * Full Seed Script — Users, Issues, Assignments
 * Run on Railway Console: node scripts/seedAllData.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, default: "user" },
  plan: { type: String, default: "free" },
  apiKey: { type: String, default: "" },
  paymentStatus: { type: String, default: "active" },
  isActive: { type: Boolean, default: true },
  registrationStatus: { type: String, default: "approved" },
  technicianRequestStatus: { type: String, default: "none" },
  hasSelectedPlan: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const issueSchema = new mongoose.Schema({
  title: String, description: String,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedByName: String, submittedByEmail: String,
  issueType: { type: String, default: "technical" },
  priority: { type: String, default: "medium" },
  aiAnalysis: { type: String, default: "" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedToName: String, assignedToEmail: String,
  assignedAt: Date, assignmentReason: String,
  status: { type: String, default: "pending" },
  resolvedAt: Date, resolutionNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const submissionSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedByName: String, submittedByEmail: String,
  content: String,
  submittedAt: { type: Date, default: Date.now },
  checked: { type: Boolean, default: true },
  score: Number, grade: String,
  grammarFeedback: String, contentFeedback: String,
  mistakes: [String], improvements: [String], strengths: [String],
  aiWrittenPercent: Number, humanWrittenPercent: Number,
  aiDetectionVerdict: String, overallFeedback: String,
  checkedAt: Date,
});

const assignmentSchema = new mongoose.Schema({
  title: String, description: String, requirements: String,
  deadline: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdByName: String,
  isActive: { type: Boolean, default: true },
  submissions: [submissionSchema],
}, { timestamps: true });

const technicianSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  name: String, email: String,
  specializations: [String],
  isAvailable: { type: Boolean, default: true },
  currentIssuesCount: { type: Number, default: 0 },
  totalIssuesResolved: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Issue = mongoose.model("Issue", issueSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);
const Technician = mongoose.model("Technician", technicianSchema);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const regularUsers = [
  { firstName: "Ali", lastName: "Hassan", email: "ali.hassan@example.com", plan: "pro" },
  { firstName: "Zara", lastName: "Ahmed", email: "zara.ahmed@example.com", plan: "enterprise" },
  { firstName: "Bilal", lastName: "Chaudhry", email: "bilal.chaudhry@example.com", plan: "free" },
  { firstName: "Ayesha", lastName: "Siddiqui", email: "ayesha.siddiqui@example.com", plan: "pro" },
  { firstName: "Omar", lastName: "Sheikh", email: "omar.sheikh@example.com", plan: "enterprise" },
];

const issueTemplates = [
  {
    title: "Login page not loading on mobile",
    description: "Users on iOS devices are experiencing a blank screen when trying to access the login page. The issue started after the latest update.",
    issueType: "software", priority: "large",
    aiAnalysis: "This appears to be a CSS compatibility issue with iOS Safari. The login page uses flexbox properties that may not be fully supported.",
    status: "resolved",
    resolutionNotes: "Fixed CSS viewport height issue on iOS. Deployed hotfix v1.2.1.",
  },
  {
    title: "API response time exceeding 5 seconds",
    description: "The /api/user/profile endpoint is taking more than 5 seconds to respond during peak hours. This is affecting the user experience significantly.",
    issueType: "technical", priority: "large",
    aiAnalysis: "Database query optimization needed. The profile endpoint is making multiple unindexed queries.",
    status: "in-progress",
  },
  {
    title: "Email notifications not being sent",
    description: "Users are not receiving email notifications for account approval. The issue seems to be with the email service configuration.",
    issueType: "software", priority: "medium",
    aiAnalysis: "SMTP configuration may have changed. Email service credentials should be verified.",
    status: "assigned",
  },
  {
    title: "Dashboard charts not rendering",
    description: "The analytics dashboard charts are showing blank spaces instead of data visualizations. Console shows a JavaScript error.",
    issueType: "software", priority: "medium",
    aiAnalysis: "Chart library version conflict detected. The current version may be incompatible with the React version in use.",
    status: "pending",
  },
  {
    title: "Network connectivity drops in office",
    description: "Multiple users in the main office are experiencing intermittent network drops every 30-45 minutes. Restarting the router temporarily fixes it.",
    issueType: "network", priority: "large",
    aiAnalysis: "Router firmware may need updating. DHCP lease conflicts detected in the network logs.",
    status: "pending",
  },
  {
    title: "Printer hardware malfunction",
    description: "The office laser printer is showing a paper jam error even when there is no paper jam. The error persists after manual inspection.",
    issueType: "hardware", priority: "small",
    aiAnalysis: "Paper sensor may be faulty. Physical inspection and sensor cleaning recommended.",
    status: "resolved",
    resolutionNotes: "Cleaned paper sensor. Printer functioning normally.",
  },
  {
    title: "Database backup failing nightly",
    description: "Automated database backups have been failing for the past 3 days. The backup script exits with error code 1.",
    issueType: "technical", priority: "large",
    aiAnalysis: "Disk space on backup server is critically low (95% used). Old backups need to be archived.",
    status: "in-progress",
  },
  {
    title: "SSL certificate expiring soon",
    description: "The SSL certificate for the main domain is expiring in 7 days. Auto-renewal failed due to DNS configuration issue.",
    issueType: "network", priority: "large",
    aiAnalysis: "DNS CAA record is blocking Let's Encrypt certificate issuance. DNS configuration update required.",
    status: "assigned",
  },
];

const assignmentTemplates = [
  {
    title: "Web Development Fundamentals — Assignment 1",
    description: "This assignment covers the basics of HTML, CSS, and JavaScript. Students should demonstrate their understanding of semantic HTML and responsive design.",
    requirements: "1. Create a responsive landing page\n2. Use semantic HTML5 elements\n3. Implement CSS Grid or Flexbox layout\n4. Add basic JavaScript interactivity\n5. Minimum 300 words of original content",
    daysFromNow: 14,
    submissions: [
      {
        submitterIndex: 0,
        content: "I created a landing page using HTML5 semantic elements including header, nav, main, and footer. The layout uses CSS Flexbox for the navigation and CSS Grid for the main content area. I added a JavaScript scroll animation and a contact form with validation. The page is fully responsive and tested on mobile devices.",
        score: 8, grade: "B+",
        grammarFeedback: "Good grammar overall with minor punctuation errors.",
        contentFeedback: "Strong understanding of semantic HTML. Could improve JavaScript complexity.",
        strengths: ["Good semantic HTML usage", "Clean CSS layout", "Responsive design"],
        improvements: ["Add more JavaScript interactivity", "Improve accessibility"],
        mistakes: ["Missing alt attributes on images", "Form lacks proper error messages"],
        aiWrittenPercent: 15, humanWrittenPercent: 85,
        aiDetectionVerdict: "Mostly human written",
        overallFeedback: "Good work overall. The responsive design is well implemented.",
      },
      {
        submitterIndex: 1,
        content: "My landing page implementation focuses on modern design principles. I used CSS custom properties for theming and implemented a dark mode toggle. The JavaScript includes a smooth scroll feature and dynamic content loading. Semantic elements are used throughout.",
        score: 9, grade: "A",
        grammarFeedback: "Excellent grammar and clear writing.",
        contentFeedback: "Outstanding implementation with creative additions like dark mode.",
        strengths: ["Creative dark mode implementation", "Clean code structure", "Advanced CSS usage"],
        improvements: ["Could add more documentation"],
        mistakes: [],
        aiWrittenPercent: 5, humanWrittenPercent: 95,
        aiDetectionVerdict: "Human written",
        overallFeedback: "Excellent work! The dark mode feature shows initiative.",
      },
    ],
  },
  {
    title: "Database Design — Assignment 2",
    description: "Design a normalized database schema for an e-commerce platform. Include ER diagrams and SQL queries.",
    requirements: "1. Design ER diagram with minimum 5 entities\n2. Normalize to 3NF\n3. Write CREATE TABLE statements\n4. Include 5 sample queries\n5. Document relationships and constraints",
    daysFromNow: 21,
    submissions: [
      {
        submitterIndex: 2,
        content: "I designed a database for an e-commerce platform with entities: Users, Products, Orders, OrderItems, and Categories. The schema is normalized to 3NF. I created proper foreign key relationships and included indexes for performance. Sample queries include product search, order history, and revenue reports.",
        score: 7, grade: "B",
        grammarFeedback: "Clear and concise technical writing.",
        contentFeedback: "Good normalization. Could add more complex queries.",
        strengths: ["Proper normalization", "Good use of indexes", "Clear documentation"],
        improvements: ["Add more complex JOIN queries", "Include stored procedures"],
        mistakes: ["Missing cascade delete rules", "Could optimize query performance"],
        aiWrittenPercent: 20, humanWrittenPercent: 80,
        aiDetectionVerdict: "Mostly human written",
        overallFeedback: "Solid database design. Normalization is correct.",
      },
    ],
  },
  {
    title: "API Development — Assignment 3",
    description: "Build a RESTful API for a task management system using Node.js and Express. Include authentication and CRUD operations.",
    requirements: "1. Implement JWT authentication\n2. Create CRUD endpoints for tasks\n3. Add input validation\n4. Write API documentation\n5. Include error handling",
    daysFromNow: 30,
    submissions: [],
  },
  {
    title: "React Frontend — Assignment 4",
    description: "Build a React application that consumes a public API. Demonstrate state management and component design.",
    requirements: "1. Use React hooks (useState, useEffect)\n2. Fetch data from a public API\n3. Implement loading and error states\n4. Create reusable components\n5. Add routing with React Router",
    daysFromNow: 10,
    submissions: [
      {
        submitterIndex: 3,
        content: "I built a weather app using the OpenWeatherMap API. The app uses useState for managing weather data and useEffect for API calls. I created reusable components for WeatherCard, SearchBar, and ForecastChart. Error states show user-friendly messages and loading spinners improve UX.",
        score: 9, grade: "A",
        grammarFeedback: "Well-written technical description.",
        contentFeedback: "Excellent React implementation with good component design.",
        strengths: ["Clean component structure", "Good state management", "Error handling"],
        improvements: ["Could add unit tests"],
        mistakes: [],
        aiWrittenPercent: 8, humanWrittenPercent: 92,
        aiDetectionVerdict: "Human written",
        overallFeedback: "Excellent React application. Clean and maintainable code.",
      },
    ],
  },
  {
    title: "Cloud Deployment — Assignment 5",
    description: "Deploy a full-stack application to a cloud platform. Document the deployment process and configuration.",
    requirements: "1. Deploy frontend to Vercel or Netlify\n2. Deploy backend to Railway or Render\n3. Use environment variables properly\n4. Set up a cloud database\n5. Write deployment documentation",
    daysFromNow: -2, // already past deadline
    submissions: [
      {
        submitterIndex: 4,
        content: "I deployed my MERN stack application with the frontend on Vercel and backend on Railway. MongoDB Atlas handles the database. I configured environment variables for both platforms and documented the complete deployment process including CI/CD pipeline setup.",
        score: 10, grade: "A+",
        grammarFeedback: "Professional writing style.",
        contentFeedback: "Perfect implementation. Excellent documentation.",
        strengths: ["Complete deployment pipeline", "Professional documentation", "Security best practices"],
        improvements: [],
        mistakes: [],
        aiWrittenPercent: 3, humanWrittenPercent: 97,
        aiDetectionVerdict: "Human written",
        overallFeedback: "Outstanding work! Best deployment documentation in the class.",
      },
    ],
  },
];

// ─── Main Seed ────────────────────────────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB Atlas\n");

  const password = await bcrypt.hash("User@2026", 10);

  // 1. Create regular users
  console.log("👥 Creating regular users...");
  const createdUsers = [];
  for (const u of regularUsers) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({
        ...u,
        password,
        apiKey: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });
      console.log(`   ✅ Created: ${u.email} (${u.plan})`);
    } else {
      console.log(`   ⏭️  Exists: ${u.email}`);
    }
    createdUsers.push(user);
  }

  // 2. Get admin user
  const admin = await User.findOne({ role: "admin" });
  if (!admin) { console.error("❌ Admin not found!"); process.exit(1); }
  console.log(`\n👑 Admin found: ${admin.email}`);

  // 3. Get technicians
  const technicians = await Technician.find().populate("userId");
  console.log(`\n🔧 Found ${technicians.length} technicians`);

  // 4. Create issues
  console.log("\n🐛 Creating issues...");
  let issueCount = 0;
  for (let i = 0; i < issueTemplates.length; i++) {
    const t = issueTemplates[i];
    const existing = await Issue.findOne({ title: t.title });
    if (existing) { console.log(`   ⏭️  Issue exists: ${t.title}`); continue; }

    const submitter = createdUsers[i % createdUsers.length];
    const techIndex = i % (technicians.length || 1);
    const tech = technicians[techIndex];

    const issueData = {
      title: t.title,
      description: t.description,
      submittedBy: submitter._id,
      submittedByName: `${submitter.firstName} ${submitter.lastName}`,
      submittedByEmail: submitter.email,
      issueType: t.issueType,
      priority: t.priority,
      aiAnalysis: t.aiAnalysis,
      status: t.status,
      createdAt: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)), // stagger dates
    };

    if (tech && ["assigned", "in-progress", "resolved"].includes(t.status)) {
      issueData.assignedTo = tech.userId._id;
      issueData.assignedToName = tech.name;
      issueData.assignedToEmail = tech.email;
      issueData.assignedAt = new Date();
      issueData.assignmentReason = `Auto-assigned based on ${t.issueType} specialization`;
    }

    if (t.status === "resolved") {
      issueData.resolvedAt = new Date();
      issueData.resolutionNotes = t.resolutionNotes;
    }

    await Issue.create(issueData);
    console.log(`   ✅ Created issue: "${t.title}" [${t.status}]`);
    issueCount++;
  }

  // 5. Create assignments
  console.log("\n📋 Creating assignments...");
  let assignCount = 0;
  for (const a of assignmentTemplates) {
    const existing = await Assignment.findOne({ title: a.title });
    if (existing) { console.log(`   ⏭️  Assignment exists: ${a.title}`); continue; }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + a.daysFromNow);

    const submissions = a.submissions.map(s => ({
      submittedBy: createdUsers[s.submitterIndex]._id,
      submittedByName: `${createdUsers[s.submitterIndex].firstName} ${createdUsers[s.submitterIndex].lastName}`,
      submittedByEmail: createdUsers[s.submitterIndex].email,
      content: s.content,
      submittedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      checked: true,
      score: s.score,
      grade: s.grade,
      grammarFeedback: s.grammarFeedback,
      contentFeedback: s.contentFeedback,
      strengths: s.strengths,
      improvements: s.improvements,
      mistakes: s.mistakes,
      aiWrittenPercent: s.aiWrittenPercent,
      humanWrittenPercent: s.humanWrittenPercent,
      aiDetectionVerdict: s.aiDetectionVerdict,
      overallFeedback: s.overallFeedback,
      checkedAt: new Date(),
    }));

    await Assignment.create({
      title: a.title,
      description: a.description,
      requirements: a.requirements,
      deadline,
      createdBy: admin._id,
      createdByName: `${admin.firstName} ${admin.lastName}`,
      isActive: a.daysFromNow > 0,
      submissions,
    });
    console.log(`   ✅ Created assignment: "${a.title}" (${submissions.length} submissions)`);
    assignCount++;
  }

  console.log(`
╔════════════════════════════════════════╗
║         SEED COMPLETE ✅               ║
╠════════════════════════════════════════╣
║  👥 Users created:       ${createdUsers.length}            ║
║  🐛 Issues created:      ${issueCount}            ║
║  📋 Assignments created: ${assignCount}            ║
╠════════════════════════════════════════╣
║  🔑 User password: User@2026           ║
╚════════════════════════════════════════╝
  `);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
