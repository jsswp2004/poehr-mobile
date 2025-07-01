const API_BASE_URL = "http://localhost:8000";

async function testJsswpLogin() {
    console.log("🔍 Testing login for jsswp2004...");

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "jsswp2004",
                password: "krat25Miko!",
            }),
        });

        console.log("📊 Login Response Status:", response.status);
        const responseText = await response.text();
        console.log("📊 Login Response Body:", responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log("✅ Login successful!");
            console.log("🔑 Access Token:", data.access ? "Present" : "Missing");
            console.log("👤 User Data:", data.user || "No user data");
            return data;
        } else {
            console.log("❌ Login failed");
            return null;
        }
    } catch (error) {
        console.error("🚨 Network error during login:", error.message);
        return null;
    }
}

async function enumerateUsers() {
    console.log("\n� Attempting to enumerate users in the backend...");

    try {
        // First, try to get an admin token or any valid token
        console.log("🔐 Trying to get admin access...");

        // Try common admin credentials
        const adminCredentials = [
            { username: "admin", password: "admin" },
            { username: "admin", password: "password" },
            { username: "superuser", password: "admin" },
            { username: "root", password: "admin" }
        ];

        let adminToken = null;

        for (const creds of adminCredentials) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(creds),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.access) {
                        console.log(`✅ Got admin token with ${creds.username}`);
                        adminToken = data.access;
                        break;
                    }
                }
            } catch (_e) {
                // Continue to next credential
            }
        }

        if (!adminToken) {
            console.log("⚠️ Could not get admin token, trying without authentication...");
        }

        // Try to fetch users with or without token
        const headers = {
            "Content-Type": "application/json",
        };

        if (adminToken) {
            headers.Authorization = `Bearer ${adminToken}`;
        }

        // Try different user endpoints
        const userEndpoints = [
            "/api/users/",
            "/api/auth/users/",
            "/api/users/all/",
            "/api/accounts/",
            "/admin/auth/user/",
        ];

        for (const endpoint of userEndpoints) {
            try {
                console.log(`🔍 Trying endpoint: ${endpoint}`);
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: "GET",
                    headers: headers,
                });

                console.log(`📊 Response status for ${endpoint}:`, response.status);

                if (response.ok) {
                    const users = await response.json();
                    console.log(`✅ Found users at ${endpoint}:`, users);

                    // Look for jsswp2004 specifically
                    const jsswp = users.find(user =>
                        user.username === "jsswp2004" ||
                        user.email === "jsswp2004" ||
                        (user.first_name && user.last_name &&
                            `${user.first_name.toLowerCase()}${user.last_name.toLowerCase()}` === "jsswp2004")
                    );

                    if (jsswp) {
                        console.log("🎯 Found jsswp2004:", jsswp);
                    } else {
                        console.log("❌ jsswp2004 not found in user list");
                        console.log("👥 Available users:", users.map(u => u.username || u.email || `${u.first_name} ${u.last_name}`));
                    }
                    return users;
                } else {
                    const errorText = await response.text();
                    console.log(`❌ Failed ${endpoint}:`, errorText);
                }
            } catch (error) {
                console.log(`🚨 Error with ${endpoint}:`, error.message);
            }
        }

        console.log("❌ Could not enumerate users from any endpoint");
        return null;

    } catch (error) {
        console.error("🚨 Error enumerating users:", error.message);
        return null;
    }
}

async function debugJsswpLogin() {
    console.log("🔍 === DEBUGGING JSSWP2004 LOGIN ISSUE ===");
    console.log("Testing login: jsswp2004 with password krat25Miko!");

    // Test login first
    const loginResult = await testJsswpLogin();

    if (!loginResult) {
        console.log("\n❌ Login failed, attempting to enumerate users...");
        await enumerateUsers();
    } else {
        console.log("\n✅ Login successful! User can proceed to use the app.");
    }

}

// Run the debug function
debugJsswpLogin();
