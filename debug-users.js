const API_BASE_URL = "http://192.168.1.153:8000";

async function debugUsers() {
    console.log("🔍 Debug: Fetching all users to check John Smith and Emily Chen...");

    try {
        // Login first
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
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.access;
        console.log("✅ Login successful!");

        // Fetch doctors
        console.log("\n👨‍⚕️ DOCTORS:");
        const doctorsResponse = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (doctorsResponse.ok) {
            const doctors = await doctorsResponse.json();
            doctors.forEach((doc, index) => {
                console.log(`${index + 1}. ID: ${doc.id} - ${doc.first_name} ${doc.last_name} (${doc.username})`);
            });

            // Check for Emily Chen
            const emilyUser = doctors.find(d =>
                (d.first_name === "Emily" && d.last_name === "Chen") ||
                d.username.toLowerCase().includes("emily") ||
                d.username.toLowerCase().includes("chen")
            );
            console.log("\n🔍 Emily Chen found:", emilyUser ? "YES" : "NO");
            if (emilyUser) {
                console.log("   Emily details:", emilyUser);
            }
        } else {
            console.log("❌ Failed to fetch doctors:", doctorsResponse.status);
        }

        // Fetch patients
        console.log("\n🧑‍🦽 PATIENTS:");
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            const patients = patientsData.results || patientsData || [];
            patients.forEach((patient, index) => {
                console.log(`${index + 1}. ID: ${patient.id} - ${patient.first_name} ${patient.last_name} (${patient.username})`);
            });

            // Check for John Smith
            const johnUser = patients.find(p =>
                (p.first_name === "John" && p.last_name === "Smith") ||
                p.username.toLowerCase().includes("john") ||
                p.username.toLowerCase().includes("smith")
            );
            console.log("\n🔍 John Smith found:", johnUser ? "YES" : "NO");
            if (johnUser) {
                console.log("   John details:", johnUser);
            }
        } else {
            console.log("❌ Failed to fetch patients:", patientsResponse.status);
        }

        // Check the last appointment details
        console.log("\n📋 LAST APPOINTMENT (ID: 29):");
        const appointmentResponse = await fetch(`${API_BASE_URL}/api/appointments/29/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (appointmentResponse.ok) {
            const appointment = await appointmentResponse.json();
            console.log("Full appointment details:", JSON.stringify(appointment, null, 2));
        } else {
            console.log("❌ Failed to fetch appointment details:", appointmentResponse.status);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

debugUsers();
