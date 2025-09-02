import { getValidToken } from "@/contexts/AuthContext";

// Central API configuration
const BACKEND_URL = import.meta.env['VITE_BACKEND_URL'];

export const API_BASE_URL = BACKEND_URL || (() => {
  console.warn('⚠️ VITE_BACKEND_URL not set, using localhost');
  return 'http://localhost:8080';
})();

// Helper to construct API URLs
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

// Helper to get auth headers
export const getAuthHeaders = () => {
  return {
    'Authorization': `Bearer ${getValidToken()}`,
    'Content-Type': 'application/json',
  };
};
