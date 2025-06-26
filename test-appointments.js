// Test script to check if appointments are saved in the database
// This will make a direct API call to list appointments

const API_BASE_URL = "http://192.168.1.153:8000";

async function testAppointments() {
    try {
        console.log("🔍 Testing appointments API endpoint...");

        // First, let's try without authentication to see what response we get
        console.log("\n1. Testing without authentication:");
        const unauthResponse = await fetch(`${API_BASE_URL}/api/appointments/`);
        console.log("Status:", unauthResponse.status);
        console.log("Status Text:", unauthResponse.statusText);

        if (unauthResponse.status === 401) {
            console.log("✅ API correctly requires authentication");
        }

        // Try to get the response body
        const unauthText = await unauthResponse.text();
        console.log("Response:", unauthText);

        // Let's also test the Django admin or a simple endpoint to see if the server is running
        console.log("\n2. Testing server connection:");
        try {
            const serverResponse = await fetch(`${API_BASE_URL}/admin/`);
            console.log("Admin page status:", serverResponse.status);
            if (serverResponse.status < 500) {
                console.log("✅ Server is running");
            }
        } catch (error) {
            console.log("❌ Server connection failed:", error.message);
        }

        // Let's also try the Django API root
        console.log("\n3. Testing API root:");
        try {
            const apiResponse = await fetch(`${API_BASE_URL}/api/`);
            console.log("API root status:", apiResponse.status);
            const apiText = await apiResponse.text();
            console.log("API root response:", apiText.substring(0, 200));
        } catch (error) {
            console.log("❌ API root failed:", error.message);
        }

    } catch (error) {
        console.error("❌ Error testing appointments:", error);
    }
}

testAppointments();
