// Central API configuration
export const API_BASE_URL = import.meta.env['VITE_BACKEND_URL'] || 'http://localhost:8080';

// Helper to construct API URLs
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};