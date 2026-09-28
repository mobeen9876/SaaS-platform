/**
 * Authentication Utilities
 * Helper functions for token validation and auth management
 */

import { API_URL } from "../config/api";

/**
 * Validate if the current token is still valid
 * @returns {Promise<boolean>} True if token is valid, false otherwise
 */
export const validateToken = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.ok;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

/**
 * Clear authentication data and redirect to login
 * @param {Function} navigate - React Router navigate function
 */
export const logout = (navigate) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (navigate) {
    navigate("/login");
  }
};

/**
 * Handle 401 Unauthorized responses globally
 * Automatically clears auth data and redirects to login
 * @param {Response} response - Fetch API response object
 * @param {Function} navigate - React Router navigate function
 * @returns {Response} The original response
 */
export const handle401 = (response, navigate) => {
  if (response.status === 401) {
    console.log("401 Unauthorized - Token expired or invalid");
    logout(navigate);
  }
  return response;
};

/**
 * Enhanced fetch wrapper that handles 401 automatically
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Function} navigate - React Router navigate function
 * @returns {Promise<Response>} Fetch response
 */
export const authFetch = async (url, options = {}, navigate) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && navigate) {
      logout(navigate);
      throw new Error("Authentication expired. Please login again.");
    }

    return response;
  } catch (error) {
    throw error;
  }
};
