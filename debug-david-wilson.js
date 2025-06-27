const API_BASE_URL = "http://192.168.1.153:8000";

async function debugActualAppointmentCreation() {
    console.log("🔍 === DEBUGGING ACTUAL APPOINTMENT ISSUE ===");
    console.log("Testing the exact scenario: David Wilson at 4 PM today");

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

        // Get patients to find David Wilson's user_id
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const patientsData = await patientsResponse.json();
        const patients = patientsData.results || patientsData || [];

        console.log("\n📋 Looking for David Wilson:");
        const davidWilson = patients.find(p =>
            p.first_name === "David" && p.last_name === "Wilson"
        );

        if (davidWilson) {
            console.log(`   Found: ${davidWilson.first_name} ${davidWilson.last_name}`);
            console.log(`   Patient ID: ${davidWilson.id}`);
            console.log(`   User ID: ${davidWilson.user_id}`);
        } else {
            console.log("   ❌ David Wilson not found in patients list");
            console.log("   Available patients:");
            patients.slice(0, 5).forEach(p => {
                console.log(`     - ${p.first_name} ${p.last_name} (ID: ${p.id}, User ID: ${p.user_id})`);
            });
            return;
        }

        // Test the EXACT format that AppointmentModal now sends
        console.log("\n🧪 Testing EXACT AppointmentModal format:");
        console.log("   Creating appointment for 4:00 PM today");

        const appointmentData = {
            title: "Medical Appointment",
            appointment_datetime: "2025-06-27T16:00:00-05:00", // 4 PM EST - exact format from AppointmentModal
            provider: 14, // Doctor ID
            patient: davidWilson.user_id, // David Wilson's User ID
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Debug test - should show 4 PM"
        };

        console.log(`   Appointment data being sent:`);
        console.log(`     - Date/Time: ${appointmentData.appointment_datetime}`);
        console.log(`     - Patient: ${davidWilson.first_name} ${davidWilson.last_name} (User ID: ${appointmentData.patient})`);
        console.log(`     - Expected display time: 4:00 PM`);

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
            console.log(`\n✅ Appointment created! Backend response:`);
            console.log(`   ID: ${responseData.id}`);
            console.log(`   Patient: ${responseData.patient_name}`);
            console.log(`   Sent time: ${appointmentData.appointment_datetime}`);
            console.log(`   Backend returned: ${responseData.appointment_datetime}`);

            // Parse and analyze the times
            const sentDate = new Date(appointmentData.appointment_datetime);
            const returnedDate = new Date(responseData.appointment_datetime);

            console.log(`\n🕐 Time Analysis:`);
            console.log(`   Sent (local time): ${sentDate.toLocaleString()}`);
            console.log(`   Returned (local time): ${returnedDate.toLocaleString()}`);
            console.log(`   Sent (hour): ${sentDate.getHours()}:${sentDate.getMinutes().toString().padStart(2, '0')}`);
            console.log(`   Returned (hour): ${returnedDate.getHours()}:${returnedDate.getMinutes().toString().padStart(2, '0')}`);

            const hourDiff = returnedDate.getHours() - sentDate.getHours();
            console.log(`   Hour difference: ${hourDiff}`);

            if (Math.abs(hourDiff) > 0) {
                console.log(`   ❌ TIME MISMATCH DETECTED!`);
                console.log(`   Expected: 4 PM (16:00)`);
                console.log(`   Backend processed as: ${returnedDate.getHours()}:${returnedDate.getMinutes().toString().padStart(2, '0')}`);
            } else {
                console.log(`   ✅ Times match correctly`);
            }

            // Now let's fetch this appointment back to see how it's stored
            console.log(`\n🔍 Fetching appointment back from backend:`);
            const fetchResponse = await fetch(`${API_BASE_URL}/api/appointments/${responseData.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (fetchResponse.ok) {
                const fetchedData = await fetchResponse.json();
                console.log(`   Fetched appointment_datetime: ${fetchedData.appointment_datetime}`);

                const fetchedDate = new Date(fetchedData.appointment_datetime);
                console.log(`   Fetched (local time): ${fetchedDate.toLocaleString()}`);
                console.log(`   Fetched (hour): ${fetchedDate.getHours()}:${fetchedDate.getMinutes().toString().padStart(2, '0')}`);

                if (fetchedDate.getHours() !== 16) {
                    console.log(`   ❌ STORAGE ISSUE: Expected 16:00 (4 PM), got ${fetchedDate.getHours()}:${fetchedDate.getMinutes().toString().padStart(2, '0')}`);
                } else {
                    console.log(`   ✅ Storage is correct: 4 PM`);
                }
            }

        } else {
            const errorText = await response.text();
            console.log(`   ❌ Failed: ${response.status} - ${errorText}`);
        }

    } catch (error) {
        console.error("Error during debugging:", error);
    }
}

debugActualAppointmentCreation();
