/**
 * Test script to verify the patient editing functionality
 * This tests the new PATCH endpoint: /api/users/patients/{id}/
 */

const API_BASE_URL = "http://127.0.0.1:8000";

async function testPatientEdit() {
    console.log("🧪 Testing Patient Edit Functionality");
    console.log("=====================================");

    try {
        // Step 1: Test authentication (use your actual credentials)
        console.log("\n1️⃣ Testing login...");
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "admin", // Replace with your username
                password: "admin123", // Replace with your password
            }),
        });

        if (!loginResponse.ok) {
            console.log("❌ Login failed:", loginResponse.status);
            const errorText = await loginResponse.text();
            console.log("Error:", errorText);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful!");

        // Step 2: Get list of patients to find one to edit
        console.log("\n2️⃣ Getting patient list...");
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!patientsResponse.ok) {
            console.log("❌ Failed to get patients:", patientsResponse.status);
            return;
        }

        const patientsData = await patientsResponse.json();
        const patients = Array.isArray(patientsData) ? patientsData : patientsData.results || [];

        if (patients.length === 0) {
            console.log("❌ No patients found to test editing");
            return;
        }

        const testPatient = patients[0];
        console.log(`✅ Found ${patients.length} patients. Testing with patient ID: ${testPatient.id}`);
        console.log(`   Patient: ${testPatient.first_name} ${testPatient.last_name}`);

        // Step 3: Test OPTIONS request to see what methods are supported
        console.log("\n3️⃣ Testing available HTTP methods...");
        const optionsResponse = await fetch(`${API_BASE_URL}/api/users/patients/${testPatient.id}/`, {
            method: "OPTIONS",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (optionsResponse.ok) {
            const allowHeader = optionsResponse.headers.get("Allow");
            console.log("✅ Supported methods:", allowHeader);
        } else {
            console.log("⚠️ OPTIONS request failed:", optionsResponse.status);
        }

        // Step 4: Test GET request for individual patient
        console.log("\n4️⃣ Testing GET individual patient...");
        const getResponse = await fetch(`${API_BASE_URL}/api/users/patients/${testPatient.id}/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (getResponse.ok) {
            const patientData = await getResponse.json();
            console.log("✅ GET individual patient successful!");
            console.log("Patient data:", JSON.stringify(patientData, null, 2));
        } else {
            console.log("❌ GET individual patient failed:", getResponse.status);
            const errorText = await getResponse.text();
            console.log("Error:", errorText);
        }

        // Step 5: Test PATCH request (partial update)
        console.log("\n5️⃣ Testing PATCH (partial update)...");
        const originalPhone = testPatient.phone_number;
        const testPhone = "555-TEST-123";

        const patchResponse = await fetch(`${API_BASE_URL}/api/users/patients/${testPatient.id}/`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone_number: testPhone,
                // Only update phone number to test partial update
            }),
        });

        if (patchResponse.ok) {
            const updatedData = await patchResponse.json();
            console.log("✅ PATCH successful!");
            console.log(`   Phone updated from "${originalPhone}" to "${updatedData.phone_number}"`);

            // Step 6: Revert the change
            console.log("\n6️⃣ Reverting test change...");
            const revertResponse = await fetch(`${API_BASE_URL}/api/users/patients/${testPatient.id}/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone_number: originalPhone,
                }),
            });

            if (revertResponse.ok) {
                console.log("✅ Test change reverted successfully!");
            } else {
                console.log("⚠️ Failed to revert test change. Phone number may remain as:", testPhone);
            }
        } else {
            console.log("❌ PATCH failed:", patchResponse.status);
            const errorText = await patchResponse.text();
            console.log("Error:", errorText);
        }

        console.log("\n🎉 Patient edit test completed!");

    } catch (error) {
        console.error("💥 Test failed with error:", error);
    }
}

// Run the test
testPatientEdit();
