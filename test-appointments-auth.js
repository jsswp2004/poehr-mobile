// Enhanced test script to check appointments with authentication
const API_BASE_URL = "http://192.168.1.153:8000";

async function testAppointmentsWithAuth() {
    try {
        console.log("🔍 Testing appointments with authentication...");

        // Step 1: Login to get access token
        console.log("🔐 Logging in with credentials...");
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

        console.log("Login response status:", loginResponse.status);

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log("❌ Login failed:", errorText);
            return;
        }

        const loginData = await loginResponse.json();
        console.log("✅ Login successful!");

        const accessToken = loginData.access_token || loginData.access;
        if (!accessToken) {
            console.log("❌ No access token received");
            console.log("Login response:", loginData);
            return;
        }

        console.log("🔑 Access token received:", accessToken.substring(0, 20) + "...");

        // Step 2: Fetch appointments with token
        console.log("\n📋 Fetching appointments...");
        const appointmentsResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log("Appointments response status:", appointmentsResponse.status);

        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            console.log("✅ Appointments retrieved successfully!");
            console.log("� Number of appointments:", appointmentsData.length || appointmentsData.results?.length || 0);

            if (appointmentsData.length > 0 || appointmentsData.results?.length > 0) {
                const appointments = appointmentsData.results || appointmentsData;
                console.log("\n📝 Your appointments:");
                appointments.forEach((appointment, index) => {
                    console.log(`\n${index + 1}. Appointment ID: ${appointment.id}`);
                    console.log(`   Title: ${appointment.title}`);
                    console.log(`   Date/Time: ${appointment.appointment_datetime}`);
                    console.log(`   Patient: ${appointment.patient_name || appointment.patient}`);
                    console.log(`   Doctor: ${appointment.doctor_name || appointment.provider}`);
                    console.log(`   Status: ${appointment.status}`);
                    console.log(`   Notes: ${appointment.notes || 'None'}`);
                });
            } else {
                console.log("📝 No appointments found.");
            }
        } else {
            const errorText = await appointmentsResponse.text();
            console.log("❌ Failed to fetch appointments:", errorText);
        }

        console.log("\n📝 Other ways to verify appointments:");
        console.log("1. Django Admin: " + API_BASE_URL + "/admin/ (login with superuser)");
        console.log("2. Check the React Native app logs when creating appointments");
        console.log("3. Use Django shell to query the database directly");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testAppointmentsWithAuth();
