// config/api.ts
// Environment-based API configuration

// Development URLs
const DEV_API_BASE_URL = "http://192.168.0.36:8000"; // Your local development server
const DEV_LOCALHOST_URL = "http://localhost:8000"; // Localhost for emulator testing

// Production URL - Update this with your live backend URL
const PROD_API_BASE_URL = "https://www.powerhealthcareit.com"; // ⚠️ REPLACE WITH YOUR ACTUAL PRODUCTION URL

// Environment detection
const isDevelopment = __DEV__;

// Force production URL for testing - TEMPORARY OVERRIDE
// export const API_BASE_URL = isDevelopment
//   ? DEV_API_BASE_URL
//   : PROD_API_BASE_URL;

// TEMPORARILY FORCE PRODUCTION URL FOR TESTING
export const API_BASE_URL = PROD_API_BASE_URL;

// Debug log to confirm URL
console.log("🌐 API Configuration:");
console.log("🔗 Using API URL:", API_BASE_URL);
console.log("🔧 Environment:", isDevelopment ? "development" : "production");

// Alternative URLs for manual override during development
export const LOCALHOST_API_URL = DEV_LOCALHOST_URL;
export const PRODUCTION_API_URL = PROD_API_BASE_URL;

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login/`,
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
