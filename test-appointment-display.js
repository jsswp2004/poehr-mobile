// Test appointment display - check what data is being returned
const API_BASE_URL = "http://192.168.1.153:8000";

async function testAppointmentDisplay() {
    try {
        console.log("🔍 Testing appointment display...");

        // Login
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'jsswp2004',
                password: 'krat25Miko!'
            })
        });

        if (!loginResponse.ok) {
            console.log("❌ Login failed");
            return;
        }

        const loginData = await loginResponse.json();
        const accessToken = loginData.access_token || loginData.access;

        // Get appointments
        const appointmentsResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (appointmentsResponse.ok) {
            const appointments = await appointmentsResponse.json();
            console.log("✅ Got appointments:", appointments.length);

            // Check structure of a recent appointment
            const todayDate = "2025-06-26";
            const todayAppointments = appointments.filter(apt => {
                if (apt.appointment_datetime) {
                    const date = new Date(apt.appointment_datetime).toISOString().split('T')[0];
                    return date === todayDate;
                }
                return false;
            });

            console.log(`📅 Appointments for ${todayDate}:`, todayAppointments.length);

            if (todayAppointments.length > 0) {
                console.log("📝 Sample appointment structure:");
                console.log(JSON.stringify(todayAppointments[0], null, 2));
            }

            // Show all appointment dates
            console.log("\n📋 All appointment dates:");
            appointments.forEach(apt => {
                if (apt.appointment_datetime) {
                    const date = new Date(apt.appointment_datetime).toISOString().split('T')[0];
                    const time = new Date(apt.appointment_datetime).toLocaleTimeString();
                    console.log(`- ID ${apt.id}: ${date} at ${time} - ${apt.title}`);
                }
            });

        } else {
            console.log("❌ Failed to get appointments");
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testAppointmentDisplay();
