const API_BASE_URL = "http://127.0.0.1:8000";

async function testPatientEdit() {
    console.log("🧪 Testing Patient Edit Backend Support");
    console.log("API Base URL:", API_BASE_URL);

    try {
        // Step 1: Login to get auth token
        console.log("\n1️⃣ Logging in...");
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'jsswp2004',
                password: 'krat25Miko!'
            })
        });

        if (!loginResponse.ok) {
            console.log("❌ Login failed:", loginResponse.status);
            const errorText = await loginResponse.text();
            console.log("Error details:", errorText);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful! Token:", token.substring(0, 20) + "...");

        // Step 2: Get list of patients
        console.log("\n2️⃣ Getting patients list...");
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!patientsResponse.ok) {
            console.log("❌ Failed to get patients:", patientsResponse.status);
            return;
        }

        const patientsData = await patientsResponse.json();
        const patients = Array.isArray(patientsData) ? patientsData : patientsData.results || [];
        console.log(`✅ Found ${patients.length} patients`);

        if (patients.length === 0) {
            console.log("⚠️ No patients found to test editing");
            return;
        }

        const testPatient = patients[0];
        console.log(`📝 Will test editing patient: ${testPatient.first_name} ${testPatient.last_name} (ID: ${testPatient.id})`);

        // Step 3: Test PATCH request to update patient
        console.log("\n3️⃣ Testing patient PATCH update...");
        const originalFirstName = testPatient.first_name;
        const testFirstName = `${originalFirstName}_TEST_${Date.now()}`;

        const patchResponse = await fetch(`${API_BASE_URL}/api/users/patients/${testPatient.id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                first_name: testFirstName,
                last_name: testPatient.last_name,
                email: testPatient.email,
                // Only update first_name for testing
            })
        });

        console.log(`📡 PATCH Response Status: ${patchResponse.status}`);

        if (patchResponse.ok) {
            const updatedPatient = await patchResponse.json();
            console.log("✅ PATCH Update successful!");
            console.log(`🔄 Updated first_name: ${originalFirstName} → ${updatedPatient.first_name}`);

            // Step 4: Restore original name
            console.log("\n4️⃣ Restoring original name...");
            const restoreResponse = await fetch(`${API_BASE_URL}/api/users/patients/${testPatient.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: originalFirstName,
                    last_name: testPatient.last_name,
                    email: testPatient.email,
                })
            });

            if (restoreResponse.ok) {
                console.log("✅ Original name restored successfully!");
                console.log("\n🎉 BACKEND EDIT FUNCTIONALITY IS WORKING!");
                console.log("✅ The mobile app can now safely enable patient editing");
            } else {
                console.log("⚠️ Failed to restore original name, but edit functionality works");
            }

        } else {
            const errorText = await patchResponse.text();
            console.log("❌ PATCH Update failed!");
            console.log("Error details:", errorText);

            if (patchResponse.status === 405) {
                console.log("💡 Error 405 = Method Not Allowed - PATCH not supported on this endpoint");
            } else if (patchResponse.status === 404) {
                console.log("💡 Error 404 = Endpoint not found - Check URL pattern");
            }
        }

    } catch (error) {
        console.log("💥 Test failed with error:", error.message);
        console.log("This might be a network connectivity issue");
    }
}

// Run the test
testPatientEdit().then(() => {
    console.log("\n🏁 Test completed");
}).catch(error => {
    console.log("💥 Test script error:", error);
});
