const API_BASE_URL = "http://192.168.1.153:8000";

async function testTimezoneIssue() {
    console.log("🕐 === DEBUGGING TIMEZONE ISSUE ===");
    console.log("Testing appointment creation with different time formats");

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

        // Test different datetime formats
        const testCases = [
            {
                name: "Current Format (No timezone)",
                appointment_datetime: "2025-06-27T15:00:00", // 3 PM
            },
            {
                name: "With Local Timezone",
                appointment_datetime: "2025-06-27T15:00:00-05:00", // 3 PM EST
            },
            {
                name: "ISO Format",
                appointment_datetime: new Date("2025-06-27T15:00:00").toISOString().slice(0, 19), // Remove Z
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n🧪 TEST ${i + 1}: ${testCase.name}`);
            console.log(`   Sending datetime: ${testCase.appointment_datetime}`);

            const appointmentData = {
                title: `Timezone Test ${i + 1}`,
                appointment_datetime: testCase.appointment_datetime,
                provider: 14, // Doctor ID
                patient: 4, // John Smith User ID
                duration: 30,
                status: "pending",
                clinic_event: 6,
                notes: `Testing timezone format: ${testCase.name}`
            };

            const response = await fetch(`${API_BASE_URL}/api/appointments/`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log(`   ✅ Created appointment:`);
                console.log(`      - Sent time: ${testCase.appointment_datetime}`);
                console.log(`      - Backend returned: ${responseData.appointment_datetime}`);
                console.log(`      - Patient: ${responseData.patient_name}`);

                // Parse the returned time
                const sentTime = new Date(testCase.appointment_datetime);
                const returnedTime = new Date(responseData.appointment_datetime);
                const timeDiff = (returnedTime.getTime() - sentTime.getTime()) / (1000 * 60 * 60); // hours

                console.log(`      - Time difference: ${timeDiff} hours`);
                if (Math.abs(timeDiff) > 0.1) {
                    console.log(`      - ❌ TIMEZONE ISSUE DETECTED!`);
                } else {
                    console.log(`      - ✅ Times match correctly`);
                }
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Failed: ${response.status} - ${errorText}`);
            }

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("\n🔍 === ANALYSIS ===");
        console.log("If you see timezone issues:");
        console.log("1. Backend might be converting to UTC automatically");
        console.log("2. We may need to send timezone-aware strings");
        console.log("3. Or the backend needs timezone configuration");

    } catch (error) {
        console.error("Error during timezone test:", error);
    }
}

testTimezoneIssue();
