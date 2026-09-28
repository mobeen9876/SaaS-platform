import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminForgotPassword from "./pages/auth/AdminForgotPassword";
import AdminResetPassword from "./pages/auth/AdminResetPassword";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import FeaturesPage from "./pages/Features";
import AboutPage from "./pages/About";
import Dashboard from "./pages/Dashboard";
import AIToolsMenu from "./pages/AIToolsMenu";
import AITools from "./pages/AITools";
import AdminAITools from "./pages/AdminAITools";
import TechnicianIssues from "./pages/TechnicianIssues";
import PerformanceReport from "./pages/PerformanceReport";
import AssignmentChecker from "./pages/AssignmentChecker";
import "./App.css";

const Home = () => (
  <>
    <Hero />
    <Features />
    <HowItWorks />
    <Testimonials />
    <Pricing />
    <FAQ />
    <FinalCTA />
    <Footer />
  </>
);

const ContactPage = () => (
  <div>
    <Contact />
  </div>
);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbarOnRoutes = ["/dashboard"];
  const shouldShowNavbar = !hideNavbarOnRoutes.includes(location.pathname);

  // Global plan selection guard — redirect approved users without a plan away from public pages
  useEffect(() => {
    const publicPages = ["/", "/about", "/features", "/contact"];
    if (!publicPages.includes(location.pathname)) return;

    // Don't redirect if returning from a Stripe payment (success or cancel)
    const params = new URLSearchParams(location.search);
    if (params.get("payment")) return;

    try {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!userData || !token) return;

      const user = JSON.parse(userData);
      if (user.role === "admin") return;
      if (user.registrationStatus === "approved" && !user.hasSelectedPlan) {
        navigate("/pricing", { replace: true });
      }
    } catch (_) {}
  }, [location.pathname, navigate]);

  return (
    <div className="App">
      {shouldShowNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin-forgot-password"
            element={<AdminForgotPassword />}
          />
          <Route
            path="/admin-reset-password"
            element={<AdminResetPassword />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-tools" element={<AIToolsMenu />} />
          <Route path="/ai-tools/issue-resolver" element={<AITools />} />
          <Route path="/admin-ai-tools" element={<AdminAITools />} />
          <Route path="/technician-issues" element={<TechnicianIssues />} />
          <Route
            path="/ai-tools/document-generator"
            element={<PerformanceReport />}
          />
          <Route
            path="/ai-tools/assignment-checker"
            element={<AssignmentChecker />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
