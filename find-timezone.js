const API_BASE_URL = "http://192.168.1.153:8000";

async function findCorrectTimezone() {
    console.log("🌍 === FINDING CORRECT TIMEZONE ===");
    console.log("Testing different timezone offsets to find the right one");

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

        // Get current timezone info
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset(); // minutes
        const timezoneOffsetHours = -timezoneOffset / 60; // convert to hours (negative because getTimezoneOffset is opposite)

        console.log(`\n🕐 Current local time info:`);
        console.log(`   Local time: ${now.toLocaleString()}`);
        console.log(`   Timezone offset: ${timezoneOffset} minutes`);
        console.log(`   Timezone offset hours: ${timezoneOffsetHours > 0 ? '+' : ''}${timezoneOffsetHours}`);

        // Format timezone for ISO string
        const sign = timezoneOffsetHours >= 0 ? '+' : '-';
        const absHours = Math.abs(timezoneOffsetHours);
        const timezoneString = `${sign}${absHours.toString().padStart(2, '0')}:00`;

        console.log(`   ISO timezone string: ${timezoneString}`);

        // Test the correct local timezone
        console.log("\n🧪 Testing with ACTUAL local timezone:");
        console.log("   Creating appointment for 4:00 PM with correct timezone");

        const appointmentData = {
            title: "Local Timezone Test - 4 PM",
            appointment_datetime: `2025-06-27T16:00:00${timezoneString}`, // 4 PM with actual local timezone
            provider: 14, // Doctor ID
            patient: 8, // David Wilson User ID
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Testing actual local timezone - should show 4 PM"
        };

        console.log(`   Sending: ${appointmentData.appointment_datetime}`);
        console.log(`   Expected: 4:00 PM local time`);

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
            console.log(`\n✅ Appointment created!`);
            console.log(`   Backend returned: ${responseData.appointment_datetime}`);

            // Test fetching it back
            const fetchResponse = await fetch(`${API_BASE_URL}/api/appointments/${responseData.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (fetchResponse.ok) {
                const fetchedData = await fetchResponse.json();
                const fetchedTime = new Date(fetchedData.appointment_datetime);
                console.log(`\n🔍 Storage check:`);
                console.log(`   Fetched datetime: ${fetchedData.appointment_datetime}`);
                console.log(`   Fetched (local): ${fetchedTime.toLocaleString()}`);
                console.log(`   Fetched (hour): ${fetchedTime.getHours()}:${fetchedTime.getMinutes().toString().padStart(2, '0')}`);

                if (fetchedTime.getHours() === 16) {
                    console.log(`   🎉 SUCCESS! Correct timezone found: ${timezoneString}`);
                    console.log(`   Use this timezone offset in your app: ${timezoneString}`);
                } else {
                    console.log(`   ❌ Still wrong with local timezone`);
                    console.log(`   The backend might have timezone conversion issues`);
                }
            }
        }

    } catch (error) {
        console.error("Error during timezone detection:", error);
    }
}

findCorrectTimezone();
