const API_BASE_URL = "http://192.168.1.153:8000";

async function testBackendFix() {
    console.log("🔍 === TESTING BACKEND FIX ===");
    console.log("This script will verify if the backend patient resolution is fixed");

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

        // Test 1: Create appointment with John Smith (Patient ID 6)
        console.log("\n📋 TEST 1: Create appointment with John Smith (Patient ID 6)");
        const johnSmithApt = {
            title: "Test - John Smith",
            appointment_datetime: "2025-06-26T19:00:00Z",
            provider: 14, // Emily Chen
            patient: 6,   // John Smith
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Backend fix test - John Smith",
        };

        const johnResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(johnSmithApt),
        });

        if (johnResponse.ok) {
            const johnApt = await johnResponse.json();
            console.log("📋 John Smith appointment created:");
            console.log(`   - Patient ID sent: 6`);
            console.log(`   - Patient ID returned: ${johnApt.patient}`);
            console.log(`   - Patient name returned: ${johnApt.patient_name}`);

            if (johnApt.patient_name === "John Smith") {
                console.log("✅ SUCCESS: John Smith (ID 6) resolves correctly!");
            } else {
                console.log("❌ FAILED: Expected 'John Smith', got:", johnApt.patient_name);
            }
        } else {
            console.log("❌ Failed to create John Smith appointment");
        }

        // Test 2: Create appointment with Michael Brown (Patient ID 8)
        console.log("\n📋 TEST 2: Create appointment with Michael Brown (Patient ID 8)");
        const michaelBrownApt = {
            title: "Test - Michael Brown",
            appointment_datetime: "2025-06-26T19:30:00Z",
            provider: 14, // Emily Chen
            patient: 8,   // Michael Brown
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Backend fix test - Michael Brown",
        };

        const michaelResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(michaelBrownApt),
        });

        if (michaelResponse.ok) {
            const michaelApt = await michaelResponse.json();
            console.log("📋 Michael Brown appointment created:");
            console.log(`   - Patient ID sent: 8`);
            console.log(`   - Patient ID returned: ${michaelApt.patient}`);
            console.log(`   - Patient name returned: ${michaelApt.patient_name}`);

            if (michaelApt.patient_name === "Michael Brown") {
                console.log("✅ SUCCESS: Michael Brown (ID 8) resolves correctly!");
            } else {
                console.log("❌ FAILED: Expected 'Michael Brown', got:", michaelApt.patient_name);
            }
        } else {
            console.log("❌ Failed to create Michael Brown appointment");
        }

        // Test 3: Create appointment with David Wilson (Patient ID 10)
        console.log("\n📋 TEST 3: Create appointment with David Wilson (Patient ID 10)");
        const davidWilsonApt = {
            title: "Test - David Wilson",
            appointment_datetime: "2025-06-26T20:00:00Z",
            provider: 14, // Emily Chen
            patient: 10,  // David Wilson
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Backend fix test - David Wilson",
        };

        const davidResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(davidWilsonApt),
        });

        if (davidResponse.ok) {
            const davidApt = await davidResponse.json();
            console.log("📋 David Wilson appointment created:");
            console.log(`   - Patient ID sent: 10`);
            console.log(`   - Patient ID returned: ${davidApt.patient}`);
            console.log(`   - Patient name returned: ${davidApt.patient_name}`);

            if (davidApt.patient_name === "David Wilson") {
                console.log("✅ SUCCESS: David Wilson (ID 10) resolves correctly!");
            } else {
                console.log("❌ FAILED: Expected 'David Wilson', got:", davidApt.patient_name);
            }
        } else {
            console.log("❌ Failed to create David Wilson appointment");
        }

        console.log("\n🎯 === SUMMARY ===");
        console.log("If all tests show ✅ SUCCESS, the backend fix is working!");
        console.log("If any tests show ❌ FAILED, the backend still needs fixing.");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testBackendFix();
