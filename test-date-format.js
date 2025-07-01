const API_BASE_URL = "http://192.168.0.36:8000";

async function testDateFormat() {
    console.log("🔍 === TESTING DATE FORMAT FOR RECURRENCE_END_DATE ===");
    console.log("This script will test the correct date format for recurrence_end_date");

    try {
        // Login
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "jsswp2004",
                password: "krat25Miko!",
            }),
        });

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful!");

        // Get doctors
        const doctorsResponse = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const doctors = await doctorsResponse.json();
        console.log(`✅ Found ${doctors.length} doctors`);

        if (doctors.length === 0) {
            console.log("❌ No doctors found");
            return;
        }

        // Test 1: With recurrence = "none" (should send null)
        console.log("\n📝 Test 1: Recurrence = 'none' (recurrence_end_date = null)");
        const payload1 = {
            doctor: doctors[0].id,
            start_time: "2024-01-15T08:00:00.000Z",
            end_time: "2024-01-15T17:00:00.000Z",
            is_blocked: false,
            recurrence: "none",
            recurrence_end_date: null,
            block_type: null,
        };

        console.log("Payload:", JSON.stringify(payload1, null, 2));

        const response1 = await fetch(`${API_BASE_URL}/api/availability/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload1),
        });

        console.log("Response status:", response1.status);
        if (response1.ok) {
            const result1 = await response1.json();
            console.log("✅ Test 1 SUCCESS:", result1);
        } else {
            const error1 = await response1.text();
            console.log("❌ Test 1 FAILED:", error1);
        }

        // Test 2: With recurrence = "weekly" and YYYY-MM-DD format
        console.log("\n📝 Test 2: Recurrence = 'weekly' with YYYY-MM-DD format");
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
        const dateString = endDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        const payload2 = {
            doctor: doctors[0].id,
            start_time: "2024-01-16T09:00:00.000Z",
            end_time: "2024-01-16T18:00:00.000Z",
            is_blocked: true,
            recurrence: "weekly",
            recurrence_end_date: dateString, // YYYY-MM-DD format
            block_type: "Meeting",
        };

        console.log("Payload:", JSON.stringify(payload2, null, 2));
        console.log("Date format used:", dateString);

        const response2 = await fetch(`${API_BASE_URL}/api/availability/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload2),
        });

        console.log("Response status:", response2.status);
        if (response2.ok) {
            const result2 = await response2.json();
            console.log("✅ Test 2 SUCCESS:", result2);
        } else {
            const error2 = await response2.text();
            console.log("❌ Test 2 FAILED:", error2);
        }

        // Test 3: With full ISO string (should fail)
        console.log("\n📝 Test 3: Recurrence = 'daily' with full ISO format (should fail)");
        const fullIsoDate = new Date().toISOString();

        const payload3 = {
            doctor: doctors[0].id,
            start_time: "2024-01-17T10:00:00.000Z",
            end_time: "2024-01-17T19:00:00.000Z",
            is_blocked: true,
            recurrence: "daily",
            recurrence_end_date: fullIsoDate, // Full ISO format (should fail)
            block_type: "Vacation",
        };

        console.log("Payload:", JSON.stringify(payload3, null, 2));
        console.log("Full ISO format used:", fullIsoDate);

        const response3 = await fetch(`${API_BASE_URL}/api/availability/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload3),
        });

        console.log("Response status:", response3.status);
        if (response3.ok) {
            const result3 = await response3.json();
            console.log("✅ Test 3 UNEXPECTED SUCCESS:", result3);
        } else {
            const error3 = await response3.text();
            console.log("❌ Test 3 EXPECTED FAILURE:", error3);
        }

        console.log("\n🎯 SUMMARY:");
        console.log("- For recurrence = 'none': use null");
        console.log("- For other recurrence types: use YYYY-MM-DD format");
        console.log("- Full ISO datetime strings should be avoided");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

testDateFormat();
