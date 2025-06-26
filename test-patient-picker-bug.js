// Test script to debug patient picker issue
// This will help us understand the patient picker behavior

const API_BASE_URL = "http://192.168.1.2:8000";

async function testPatientPickerBug() {
    try {
        // First, get authentication token
        console.log("🔐 Getting authentication token...");
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "admin",
                password: "admin123",
            }),
        });

        if (!loginResponse.ok) {
            throw new Error("Login failed");
        }

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful");

        // Get patients list
        console.log("👥 Fetching patients...");
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/?role=patient`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!patientsResponse.ok) {
            throw new Error("Failed to fetch patients");
        }

        const patientsData = await patientsResponse.json();
        const patients = patientsData.results || patientsData;
        console.log("👥 Patients found:", patients.length);
        patients.forEach((patient, index) => {
            console.log(`  ${index + 1}. ID: ${patient.id}, Name: ${patient.first_name} ${patient.last_name} (${patient.username})`);
        });

        // Get recent appointments to see if patient IDs match
        console.log("\n📅 Fetching recent appointments...");
        const appointmentsResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!appointmentsResponse.ok) {
            throw new Error("Failed to fetch appointments");
        }

        const appointments = await appointmentsResponse.json();
        console.log("📅 Recent appointments found:", appointments.length);
        appointments.slice(0, 5).forEach((appointment, index) => {
            console.log(`  ${index + 1}. Patient ID: ${appointment.patient}, Patient Name: ${appointment.patient_name}, Doctor ID: ${appointment.provider}, Doctor Name: ${appointment.provider_name}`);
        });

        // Test creating an appointment with a specific patient
        console.log("\n🧪 Testing appointment creation...");
        const testPatient = patients[0]; // Use first patient
        if (!testPatient) {
            console.log("❌ No patients available for testing");
            return;
        }

        console.log(`🧪 Creating appointment for patient: ${testPatient.first_name} ${testPatient.last_name} (ID: ${testPatient.id})`);

        const testAppointmentData = {
            title: "Test Appointment",
            appointment_datetime: "2024-12-29T10:00:00Z",
            provider: 14, // Use a known doctor ID
            patient: testPatient.id,
            duration: 30,
            status: "pending",
            clinic_event: 1,
            notes: "Test appointment to debug patient picker",
        };

        console.log("🧪 Appointment data:", testAppointmentData);

        const createResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(testAppointmentData),
        });

        console.log("🧪 Create response status:", createResponse.status);

        if (createResponse.ok) {
            const createdAppointment = await createResponse.json();
            console.log("✅ Test appointment created successfully:");
            console.log("   Created Patient ID:", createdAppointment.patient);
            console.log("   Created Patient Name:", createdAppointment.patient_name);
            console.log("   Expected Patient ID:", testPatient.id);
            console.log("   Expected Patient Name:", `${testPatient.first_name} ${testPatient.last_name}`);

            if (createdAppointment.patient === testPatient.id) {
                console.log("✅ Patient ID matches - backend is working correctly");
            } else {
                console.log("❌ Patient ID mismatch - there may be a frontend issue");
            }
        } else {
            const errorData = await createResponse.text();
            console.log("❌ Failed to create test appointment:", errorData);
        }

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run the test
testPatientPickerBug();
