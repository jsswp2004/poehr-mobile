const API_BASE_URL = "http://192.168.1.153:8000";

async function testNewApproach() {
    console.log("🔍 === TESTING NEW USER_ID APPROACH ===");
    console.log("This script will test sending user_id instead of patient_id");

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

        // Get patients to see the mapping
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const patientsData = await patientsResponse.json();
        const patients = patientsData.results || patientsData || [];

        console.log("\n📋 Patient to User ID mappings:");
        patients.forEach(patient => {
            console.log(`   ${patient.first_name} ${patient.last_name}: Patient ID ${patient.id} -> User ID ${patient.user_id}`);
        });

        // Test cases using the NEW approach (send user_id instead of patient_id)
        const testCases = [
            {
                patientName: 'John Smith',
                patientId: 6,
                userId: 4  // From our debug data: Patient ID 6 = John Smith with User ID 4
            },
            {
                patientName: 'Michael Brown',
                patientId: 8,
                userId: 6  // From our debug data: Patient ID 8 = Michael Brown with User ID 6
            },
            {
                patientName: 'David Wilson',
                patientId: 10,
                userId: 8  // From our debug data: Patient ID 10 = David Wilson with User ID 8
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n🧪 TEST ${i + 1}: Create appointment with ${testCase.patientName}`);
            console.log(`   Sending User ID ${testCase.userId} (instead of Patient ID ${testCase.patientId})`);

            const appointmentData = {
                title: `Test Appointment for ${testCase.patientName}`,
                appointment_datetime: `2025-06-28T${10 + i}:00:00Z`,
                provider: 14, // Dr Emily Chen
                patient: testCase.userId, // THIS IS THE KEY CHANGE: Use user_id instead of patient_id
                duration: 30,
                status: "pending",
                clinic_event: 6,
                notes: `Test appointment using user_id approach`
            };

            console.log(`   Appointment data:`, JSON.stringify(appointmentData, null, 2));

            const response = await fetch(`${API_BASE_URL}/api/appointments/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ ${testCase.patientName} appointment created:`);
                console.log(`      - User ID sent: ${testCase.userId}`);
                console.log(`      - Patient ID returned: ${result.patient}`);
                console.log(`      - Patient name returned: ${result.patient_name}`);

                if (result.patient_name === testCase.patientName) {
                    console.log(`   🎉 SUCCESS: Expected '${testCase.patientName}', got: ${result.patient_name}`);
                } else {
                    console.log(`   ❌ FAILED: Expected '${testCase.patientName}', got: ${result.patient_name}`);
                }
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Failed to create ${testCase.patientName} appointment:`);
                console.log(`      Status: ${response.status}`);
                console.log(`      Error: ${errorText}`);
            }
        }

        console.log("\n🔍 === SUMMARY ===");
        console.log("If all tests show 🎉 SUCCESS, the new user_id approach is working!");
        console.log("If any tests show ❌ FAILED, we still need to debug further.");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testNewApproach();
