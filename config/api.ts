// config/api.ts
// Replace this URL with your actual Django backend URL
// For local development, use your computer's IP address
// For production, use your deployed backend URL

export const API_BASE_URL = "http://192.168.1.153:8000"; // Local development - use computer's IP
// export const API_BASE_URL = "http://localhost:8000"; // Use this for web browser testing
// export const API_BASE_URL = 'http://your-production-url.com';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login/`,
  REGISTER: `${API_BASE_URL}/api/auth/register/`,
  APPOINTMENTS: `${API_BASE_URL}/api/appointments/`,
  PATIENTS: `${API_BASE_URL}/api/patients/`,
  BLOCKED_DATES: `${API_BASE_URL}/api/blocked-dates/`,
};

// Helper function to get headers with authorization
export const getAuthHeaders = async () => {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  const token = await AsyncStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
