/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Safely formats a date string or Date object to a localized date string
 * @param {string|Date} dateValue - The date value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string or fallback message
 */
export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) {
    return options.fallback || "Date not available";
  }

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return options.fallback || "Invalid date";
  }

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options.formatOptions,
  };

  try {
    return date.toLocaleDateString("en-US", defaultOptions);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return options.fallback || "Date formatting error";
  }
};

/**
 * Formats a date for display in a short format (e.g., "Jan 15, 2024")
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} Short formatted date string
 */
export const formatShortDate = (dateValue) => {
  return formatDate(dateValue, {
    formatOptions: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    fallback: "Date not available",
  });
};

/**
 * Formats a date for display in a long format (e.g., "January 15, 2024")
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} Long formatted date string
 */
export const formatLongDate = (dateValue) => {
  return formatDate(dateValue, {
    formatOptions: {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    fallback: "Date not available",
  });
};

/**
 * Formats a date with time for display (e.g., "Jan 15, 2024 at 3:30 PM")
 * @param {string|Date} dateValue - The date value to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateValue) => {
  return formatDate(dateValue, {
    formatOptions: {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
    fallback: "Date not available",
  });
};

/**
 * Checks if a date value is valid
 * @param {string|Date} dateValue - The date value to check
 * @returns {boolean} True if the date is valid
 */
export const isValidDate = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return !isNaN(date.getTime());
};

/**
 * Gets a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} dateValue - The date value
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateValue) => {
  if (!isValidDate(dateValue)) {
    return "Unknown time";
  }

  const date = new Date(dateValue);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};
