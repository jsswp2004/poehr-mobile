// config/api.ts
// Replace this URL with your actual Django backend URL
// For local development, use your computer's IP address
// For production, use your deployed backend URL

// export const API_BASE_URL = "http://localhost:8000"; // Local development - only works when testing on same machine
export const API_BASE_URL = "http://192.168.0.36:8000"; // Use computer's IP for mobile device/emulator access
// export const API_BASE_URL = 'http://your-production-url.com';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login/`,
  REGISTER: `${API_BASE_URL}/api/auth/register/`,
  APPOINTMENTS: `${API_BASE_URL}/api/appointments/`,
  PATIENTS: `${API_BASE_URL}/api/users/patients/`, // Updated to correct endpoint
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
