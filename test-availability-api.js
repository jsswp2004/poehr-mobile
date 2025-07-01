const API_BASE_URL = "http://192.168.0.36:8000";

async function testAvailabilityAPI() {
    console.log("🔍 === TESTING AVAILABILITY API ===");
    console.log("This script will test the availability API endpoint");

    try {
        // Login first
        console.log("\n🔐 Step 1: Logging in...");
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

        if (!loginResponse.ok) {
            console.error("❌ Login failed:", loginResponse.status);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful!");

        // Step 2: Get doctors list
        console.log("\n👨‍⚕️ Step 2: Fetching doctors...");
        const doctorsResponse = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!doctorsResponse.ok) {
            console.error("❌ Failed to fetch doctors:", doctorsResponse.status);
            return;
        }

        const doctors = await doctorsResponse.json();
        console.log("✅ Doctors fetched:", doctors.length);
        if (doctors.length > 0) {
            console.log("   First doctor:", doctors[0]);
        }

        // Step 3: Test GET availability
        console.log("\n📅 Step 3: Testing GET availability...");
        const getResponse = await fetch(`${API_BASE_URL}/api/availability/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        console.log("GET availability status:", getResponse.status);
        if (getResponse.ok) {
            const availability = await getResponse.json();
            console.log("✅ Availability data:", availability);
        } else {
            const errorText = await getResponse.text();
            console.log("❌ GET error:", errorText);
        }

        // Step 4: Test POST availability (if we have doctors)
        if (doctors.length > 0) {
            console.log("\n📝 Step 4: Testing POST availability...");

            const testPayload = {
                doctor: doctors[0].id,
                start_time: "2024-01-15T08:00:00.000Z",
                end_time: "2024-01-15T17:00:00.000Z",
                is_blocked: false,
                recurrence: "none",
                recurrence_end_date: null,
                block_type: null,
            };

            console.log("Sending payload:", JSON.stringify(testPayload, null, 2));

            const postResponse = await fetch(`${API_BASE_URL}/api/availability/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testPayload),
            });

            console.log("POST availability status:", postResponse.status);

            if (postResponse.ok) {
                const result = await postResponse.json();
                console.log("✅ POST successful:", result);
            } else {
                const errorText = await postResponse.text();
                console.log("❌ POST error:", errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    console.log("📋 Parsed error details:", JSON.stringify(errorJson, null, 2));
                } catch (e) {
                    console.log("📋 Raw error text:", errorText);
                }
            }
        }

    } catch (error) {
        console.error("❌ Test failed with error:", error);
    }
}

// Run the test
testAvailabilityAPI();
