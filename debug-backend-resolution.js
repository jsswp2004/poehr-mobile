const API_BASE_URL = "http://192.168.1.153:8000";

async function debugBackendPatientResolution() {
    console.log("🔍 === DEBUGGING BACKEND PATIENT RESOLUTION ===");

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

        // Test 1: Check specific appointment with known patient ID
        console.log("\n📋 TEST 1: Check appointment ID 32 (should be John Smith)");
        const apt32Response = await fetch(`${API_BASE_URL}/api/appointments/32/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (apt32Response.ok) {
            const apt32 = await apt32Response.json();
            console.log("Appointment 32 details:");
            console.log(`  - Patient ID: ${apt32.patient}`);
            console.log(`  - Patient Name: ${apt32.patient_name}`);
            console.log(`  - Provider ID: ${apt32.provider}`);
            console.log(`  - Provider Name: ${apt32.provider_name}`);
        }

        // Test 2: Check patient ID 6 directly
        console.log("\n📋 TEST 2: Direct patient lookup for ID 6");

        // Try different endpoints to see patient ID 6
        const endpoints = [
            `/api/users/patients/`,
            `/api/patients/6/`, // If there's a direct patients endpoint
            `/api/users/6/`, // If there's a users endpoint
        ];

        for (const endpoint of endpoints) {
            console.log(`\n🔍 Trying endpoint: ${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log(`Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Response:", JSON.stringify(data, null, 2));
            } else {
                console.log("Failed");
            }
        }

        // Test 3: Check all appointments to see the pattern
        console.log("\n📋 TEST 3: Check pattern in all appointments");
        const allAptsResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (allAptsResponse.ok) {
            const allApts = await allAptsResponse.json();
            const appointments = allApts.results || allApts || [];

            console.log("Patient ID to Name mapping in appointments:");
            const patientMapping = {};
            appointments.forEach(apt => {
                if (!patientMapping[apt.patient]) {
                    patientMapping[apt.patient] = apt.patient_name;
                }
            });

            Object.keys(patientMapping).forEach(patientId => {
                console.log(`  Patient ID ${patientId} -> ${patientMapping[patientId]}`);
            });
        }

        // Test 4: Create a test appointment with a different patient to see the pattern
        console.log("\n📋 TEST 4: Create test appointment with patient ID 8 (Michael Brown)");
        const testAptData = {
            title: "Test Appointment",
            appointment_datetime: "2025-06-26T18:00:00Z",
            provider: 14, // Emily Chen
            patient: 8,   // Should be Michael Brown
            duration: 30,
            status: "pending",
            clinic_event: 6, // Emergency Visit
            notes: "Test to verify patient mapping",
        };

        const createTestResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(testAptData),
        });

        if (createTestResponse.ok) {
            const testApt = await createTestResponse.json();
            console.log("Test appointment created:");
            console.log(`  - Sent Patient ID: 8 (should be Michael Brown)`);
            console.log(`  - Returned Patient ID: ${testApt.patient}`);
            console.log(`  - Returned Patient Name: ${testApt.patient_name}`);

            if (testApt.patient_name === "Michael Brown" && testApt.patient === 8) {
                console.log("✅ Patient ID 8 resolves correctly to Michael Brown");
            } else {
                console.log("❌ Patient ID 8 resolution is also broken!");
            }
        } else {
            console.log("❌ Failed to create test appointment");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

debugBackendPatientResolution();
