/**
 * API Configuration
 * Centralized API endpoint management
 */

// Get base URL from environment variable
// Falls back to localhost:3000 if not set
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Export the full API URL (base + /api)
export const API_URL = `${BASE_URL}/api`;

// Export base URL (without /api) for special cases
export const BACKEND_BASE_URL = BASE_URL;

// Export default (API root)
export default API_URL;
