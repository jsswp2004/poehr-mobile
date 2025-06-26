const API_BASE_URL = "http://192.168.1.153:8000";

async function checkPatientMapping() {
    console.log("🔍 === CHECKING PATIENT ID MAPPING ===");

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

        // Fetch patients list
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const patientsData = await patientsResponse.json();
        const patients = patientsData.results || patientsData || [];

        console.log("📋 COMPLETE PATIENT MAPPING:");
        patients.forEach(patient => {
            console.log(`ID: ${patient.id} -> ${patient.first_name} ${patient.last_name} (${patient.username})`);
        });

        // Check specifically for ID 6
        const patient6 = patients.find(p => p.id === 6);
        console.log(`\n🎯 Patient ID 6 maps to: ${patient6 ? `${patient6.first_name} ${patient6.last_name}` : 'NOT FOUND'}`);

        // Check for John Smith
        const johnSmith = patients.find(p => p.first_name === "John" && p.last_name === "Smith");
        console.log(`🎯 John Smith has ID: ${johnSmith ? johnSmith.id : 'NOT FOUND'}`);

        // Check for Michael Brown
        const michaelBrown = patients.find(p => p.first_name === "Michael" && p.last_name === "Brown");
        console.log(`🎯 Michael Brown has ID: ${michaelBrown ? michaelBrown.id : 'NOT FOUND'}`);

        // Direct API call to check patient ID 6
        console.log("\n🔍 DIRECT API CHECK FOR PATIENT ID 6:");
        const patient6Response = await fetch(`${API_BASE_URL}/api/users/patients/6/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (patient6Response.ok) {
            const patient6Data = await patient6Response.json();
            console.log("Patient ID 6 details:", JSON.stringify(patient6Data, null, 2));
        } else {
            console.log("❌ Failed to fetch patient ID 6 directly");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

checkPatientMapping();
