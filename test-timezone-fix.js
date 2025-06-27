const API_BASE_URL = "http://192.168.1.153:8000";

async function testTimezoneFixVerification() {
    console.log("🔧 === TESTING TIMEZONE FIX ===");
    console.log("Testing the fix: sending timezone-aware datetime strings");

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

        // Test the new format (what AppointmentModal will now send)
        console.log("\n🧪 Testing NEW FORMAT with timezone (-05:00):");

        const appointmentData = {
            title: "Timezone Fix Test - 3 PM",
            appointment_datetime: "2025-06-27T15:00:00-05:00", // 3 PM EST - new format
            provider: 14, // Doctor ID
            patient: 4, // John Smith User ID
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Testing the timezone fix - should show 3 PM"
        };

        console.log(`   Sending: ${appointmentData.appointment_datetime}`);
        console.log(`   Expected: 3:00 PM EST`);

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
            console.log(`\n✅ Appointment created successfully!`);
            console.log(`   Sent datetime: ${appointmentData.appointment_datetime}`);
            console.log(`   Backend returned: ${responseData.appointment_datetime}`);
            console.log(`   Patient: ${responseData.patient_name}`);

            // Parse times for comparison
            const sentTime = new Date(appointmentData.appointment_datetime);
            const returnedTime = new Date(responseData.appointment_datetime);

            console.log(`\n🕐 Time Analysis:`);
            console.log(`   Sent time (local): ${sentTime.toLocaleString()}`);
            console.log(`   Returned time (local): ${returnedTime.toLocaleString()}`);

            const timeDiff = Math.abs(returnedTime.getTime() - sentTime.getTime()) / (1000 * 60); // minutes
            console.log(`   Time difference: ${timeDiff} minutes`);

            if (timeDiff < 1) {
                console.log(`   🎉 SUCCESS! Times match - timezone issue FIXED!`);
            } else {
                console.log(`   ❌ Still has time difference`);
            }

        } else {
            const errorText = await response.text();
            console.log(`   ❌ Failed: ${response.status} - ${errorText}`);
        }

    } catch (error) {
        console.error("Error during timezone fix verification:", error);
    }
}

testTimezoneFixVerification();
