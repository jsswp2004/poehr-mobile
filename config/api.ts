// config/api.ts
// Environment-based API configuration

// Development URLs
const DEV_LOCALHOST_URL = "http://localhost:8000"; // Localhost for emulator testing

// Production URL - Update this with your live backend URL
const PROD_API_BASE_URL = "https://www.powerhealthcareit.com";

// Environment detection
const isDevelopment = __DEV__;

// Defaults to production. To point a dev build at another backend, set
// EXPO_PUBLIC_API_BASE_URL in .env.local (e.g. http://192.168.0.36:8000).
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || PROD_API_BASE_URL;

if (__DEV__) {
  console.log("API base URL:", API_BASE_URL);
}

// Alternative URLs for manual override during development
export const LOCALHOST_API_URL = DEV_LOCALHOST_URL;
export const PRODUCTION_API_URL = PROD_API_BASE_URL;

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login/`,
  // TODO: confirm this path against the Django urls.py (SimpleJWT TokenRefreshView)
  REFRESH: `${API_BASE_URL}/api/auth/token/refresh/`,
  REGISTER: `${API_BASE_URL}/api/auth/register/`,
  APPOINTMENTS: `${API_BASE_URL}/api/appointments/`,
  PATIENTS: `${API_BASE_URL}/api/users/patients/`, // Updated to correct endpoint
  BLOCKED_DATES: `${API_BASE_URL}/api/blocked-dates/`,
};

// Helper function to get headers with authorization
export const getAuthHeaders = async () => {
  const AsyncStorage = await import(
    "@react-native-async-storage/async-storage"
  );
  const token = await AsyncStorage.default.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Debug utility to check current API configuration
export const getAPIConfig = () => ({
  environment: isDevelopment ? "development" : "production",
  currentURL: API_BASE_URL,
  endpoints: API_ENDPOINTS,
});

// Manual URL override function for testing
export const setAPIURL = (url: string) => {
  console.warn(`⚠️ Manually overriding API URL to: ${url}`);
  // Note: This would require updating the module exports dynamically
  // For now, manually update the constants above
};

// Network connectivity test
export const testAPIConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/api/health/`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
};
