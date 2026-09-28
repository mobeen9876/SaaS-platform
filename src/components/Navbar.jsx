import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import styles from "./navbar.module.css";

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const clearAuthStorage = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const notifyAuthChange = () => {
    window.dispatchEvent(new Event("auth-changed"));
  };

  // Helper to safely load auth state
  const loadAuthFromStorage = () => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === "object") {
          setUser(parsed);
          return;
        }
      }
    } catch (e) {
      // ignore parse errors and clear below
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    loadAuthFromStorage();
    // Keep state in sync across tabs/windows and explicit auth change events
    const onStorage = () => loadAuthFromStorage();
    const onAuthChanged = () => loadAuthFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setMobileMenuOpen(false);
    notifyAuthChange();
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* LOGO SECTION */}
        <div className={styles.logoSection}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <span>S</span>
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>SaaS </span>
              <span className={styles.logoAccent}>Platfrom</span>
            </div>
          </Link>
        </div>

        {/* DESKTOP NAVIGATION */}
        <div className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className={styles.navLink}>
              {link.name}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
            </>
          )}
        </div>

        {/* DESKTOP CTA BUTTONS */}
        <div className={styles.ctaButtons}>
          {user ? (
            <>
              <span className={styles.userBadge}>
                Logged in as {user.name || user.firstName || user.email}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.loginBtn}>
                Log In
              </Link>
              <Link to="/signup" className={styles.signupBtn}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuContent}>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              <div className={styles.mobileCta}>
                {user ? (
                  <>
                    <span className={styles.mobileUserBadge}>
                      Logged in as {user.name || user.firstName || user.email}
                    </span>
                    <button
                      className={styles.mobileLogoutBtn}
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={styles.mobileLoginBtn}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      className={styles.mobileSignupBtn}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
