const API_BASE_URL = "http://192.168.1.153:8000";

async function debugAppointmentCreation() {
    console.log("🔍 === DEBUGGING APPOINTMENT CREATION ===");

    try {
        // Login
        console.log("1. Attempting login...");
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

        if (!loginResponse.ok) {
            console.log("❌ Login failed:", loginResponse.status);
            const errorText = await loginResponse.text();
            console.log("Error:", errorText);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful!");

        // Test appointment creation with detailed error reporting
        console.log("\n2. Creating test appointment...");
        const appointmentData = {
            title: "Debug Test Appointment",
            appointment_datetime: "2025-06-28T10:00:00Z",
            provider: 14, // Emily Chen
            patient: 6,   // John Smith
            duration: 30,
            status: "pending",
            clinic_event: 6,
            notes: "Debug test appointment",
        };

        console.log("Sending appointment data:", JSON.stringify(appointmentData, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(appointmentData),
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const appointmentResult = await response.json();
            console.log("✅ Appointment created successfully!");
            console.log("Response data:", JSON.stringify(appointmentResult, null, 2));

            console.log("\n📋 Patient Mapping Check:");
            console.log(`   - Patient ID sent: 6`);
            console.log(`   - Patient ID returned: ${appointmentResult.patient}`);
            console.log(`   - Patient name returned: ${appointmentResult.patient_name}`);

            if (appointmentResult.patient_name === "John Smith") {
                console.log("✅ SUCCESS: Patient mapping is correct!");
            } else {
                console.log("❌ BACKEND BUG: Expected 'John Smith', got:", appointmentResult.patient_name);
            }
        } else {
            console.log("❌ Appointment creation failed!");
            const errorText = await response.text();
            console.log("Error response:", errorText);

            try {
                const errorData = JSON.parse(errorText);
                console.log("Parsed error data:", JSON.stringify(errorData, null, 2));
            } catch (parseError) {
                console.log("Could not parse error as JSON");
            }
        }

    } catch (error) {
        console.error("❌ Network or other error:", error.message);
        console.error("Full error:", error);
    }
}

debugAppointmentCreation();
