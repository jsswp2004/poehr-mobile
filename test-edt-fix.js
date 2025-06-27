const API_BASE_URL = "http://192.168.1.153:8000";

async function testTimezoneFixEDT() {
    console.log("🔧 === TESTING EDT TIMEZONE FIX ===");
    console.log("Testing with -04:00 (EDT) instead of -05:00 (EST)");

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

        // Test the NEW format with EDT timezone
        console.log("\n🧪 Testing NEW EDT format:");
        console.log("   Creating appointment for 4:00 PM with -04:00 timezone");

        const appointmentData = {
            title: "EDT Timezone Test - 4 PM",
            appointment_datetime: "2025-06-27T16:00:00-04:00", // 4 PM EDT - new format
            provider: 14, // Doctor ID
            patient: 8, // David Wilson User ID
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Testing EDT timezone fix - should show 4 PM"
        };

        console.log(`   Sending: ${appointmentData.appointment_datetime}`);
        console.log(`   Expected: 4:00 PM EDT`);

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
            console.log(`   Sent (hour): ${sentTime.getHours()}:${sentTime.getMinutes().toString().padStart(2, '0')}`);
            console.log(`   Returned (hour): ${returnedTime.getHours()}:${returnedTime.getMinutes().toString().padStart(2, '0')}`);

            // Test fetching it back
            console.log(`\n🔍 Fetching back to check storage:`);
            const fetchResponse = await fetch(`${API_BASE_URL}/api/appointments/${responseData.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (fetchResponse.ok) {
                const fetchedData = await fetchResponse.json();
                const fetchedTime = new Date(fetchedData.appointment_datetime);
                console.log(`   Fetched datetime: ${fetchedData.appointment_datetime}`);
                console.log(`   Fetched (local): ${fetchedTime.toLocaleString()}`);
                console.log(`   Fetched (hour): ${fetchedTime.getHours()}:${fetchedTime.getMinutes().toString().padStart(2, '0')}`);

                if (fetchedTime.getHours() === 16) {
                    console.log(`   🎉 SUCCESS! Now showing 4 PM correctly!`);
                } else {
                    console.log(`   ❌ Still wrong: Expected 16:00 (4 PM), got ${fetchedTime.getHours()}:${fetchedTime.getMinutes().toString().padStart(2, '0')}`);
                }
            }

        } else {
            const errorText = await response.text();
            console.log(`   ❌ Failed: ${response.status} - ${errorText}`);
        }

    } catch (error) {
        console.error("Error during EDT timezone test:", error);
    }
}

testTimezoneFixEDT();
