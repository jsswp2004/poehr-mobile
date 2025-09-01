// Clear AsyncStorage for testing production login
console.log("🧹 Clearing all stored tokens...");

// For web testing, we need to clear localStorage
if (typeof window !== 'undefined' && window.localStorage) {
    console.log("🌐 Clearing web localStorage...");
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    console.log("✅ Web storage cleared");
}

// Instructions for mobile
console.log("📱 For mobile testing:");
console.log("1. Use the logout button in the app");
console.log("2. Or reinstall the app to clear AsyncStorage");
console.log("3. Or use Expo's 'Erase all content and settings' in dev menu");
