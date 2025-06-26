const API_BASE_URL = "http://192.168.1.153:8000";

async function testPatientPickerBug() {
    console.log("🔍 === TESTING PATIENT PICKER BUG ===");
    console.log("🔍 This test simulates the exact appointment creation process");
    console.log("🔍 We'll create an appointment for John Smith with Emily Chen");

    try {
        // Step 1: Login
        console.log("\n📋 STEP 1: Login");
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

        // Step 2: Fetch all required data (like the modal does)
        console.log("\n📋 STEP 2: Fetch doctors, patients, and clinic events");

        // Fetch doctors
        const doctorsResponse = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        const doctors = doctorsResponse.ok ? await doctorsResponse.json() : [];

        // Fetch patients
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        const patientsData = patientsResponse.ok ? await patientsResponse.json() : { results: [] };
        const patients = patientsData.results || patientsData || [];

        // Fetch clinic events
        const clinicEventsResponse = await fetch(`${API_BASE_URL}/api/clinic-events/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        const clinicEventsData = clinicEventsResponse.ok ? await clinicEventsResponse.json() : { results: [] };
        const clinicEvents = clinicEventsData.results || clinicEventsData || [];

        console.log(`✅ Loaded ${doctors.length} doctors, ${patients.length} patients, ${clinicEvents.length} clinic events`);

        // Step 3: Find John Smith and Emily Chen (simulate picker selection)
        console.log("\n📋 STEP 3: Simulate picker selections");

        const johnSmith = patients.find(p =>
            p.first_name === "John" && p.last_name === "Smith"
        );
        const emilyChen = doctors.find(d =>
            d.first_name === "Emily" && d.last_name === "Chen"
        );
        const emergencyVisit = clinicEvents.find(e => e.name === "Emergency Visit");

        console.log("🔍 John Smith found:", johnSmith ? `YES (ID: ${johnSmith.id})` : "NO");
        console.log("🔍 Emily Chen found:", emilyChen ? `YES (ID: ${emilyChen.id})` : "NO");
        console.log("🔍 Emergency Visit found:", emergencyVisit ? `YES (ID: ${emergencyVisit.id})` : "NO");

        if (!johnSmith || !emilyChen || !emergencyVisit) {
            console.log("❌ Cannot proceed - missing required users or clinic event");
            console.log("Available patients:", patients.map(p => `${p.first_name} ${p.last_name} (ID: ${p.id})`));
            console.log("Available doctors:", doctors.map(d => `${d.first_name} ${d.last_name} (ID: ${d.id})`));
            console.log("Available clinic events:", clinicEvents.map(e => `${e.name} (ID: ${e.id})`));
            return;
        }

        // Step 4: Create the appointment data (exactly as the modal does)
        console.log("\n📋 STEP 4: Create appointment data");

        const formData = {
            appointment_date: "2025-06-26",
            appointment_time: "17:30",
            duration: 30,
            status: "pending",
            clinic_event_id: emergencyVisit.id,
            notes: "",
            patient_id: johnSmith.id,
            doctor_id: emilyChen.id,
        };

        console.log("🎯 Form data created:", formData);

        // Validate selections (like the modal does)
        const finalPatient = patients.find(p => p.id === formData.patient_id);
        const finalDoctor = doctors.find(d => d.id === formData.doctor_id);
        const finalClinicEvent = clinicEvents.find(e => e.id === formData.clinic_event_id);

        console.log("🔍 Final validation:");
        console.log(`  - Patient: ${finalPatient ? `${finalPatient.first_name} ${finalPatient.last_name} (ID: ${finalPatient.id})` : 'NOT FOUND'}`);
        console.log(`  - Doctor: ${finalDoctor ? `${finalDoctor.first_name} ${finalDoctor.last_name} (ID: ${finalDoctor.id})` : 'NOT FOUND'}`);
        console.log(`  - Clinic Event: ${finalClinicEvent ? `${finalClinicEvent.name} (ID: ${finalClinicEvent.id})` : 'NOT FOUND'}`);

        // Step 5: Create appointment payload (exactly as the modal does)
        const appointmentData = {
            title: finalClinicEvent.name || "Medical Appointment",
            appointment_datetime: `${formData.appointment_date}T${formData.appointment_time}:00Z`,
            provider: formData.doctor_id,
            patient: formData.patient_id,
            duration: formData.duration,
            status: formData.status,
            clinic_event: formData.clinic_event_id,
            notes: formData.notes || "",
        };

        console.log("\n📋 STEP 5: Final appointment payload:");
        console.log("🎯 Appointment data to send:", JSON.stringify(appointmentData, null, 2));

        // Step 6: Send to backend
        console.log("\n📋 STEP 6: Send to backend");
        const createResponse = await fetch(`${API_BASE_URL}/api/appointments/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(appointmentData),
        });

        console.log("📡 Response status:", createResponse.status);

        if (createResponse.ok) {
            const responseData = await createResponse.json();
            console.log("✅ Appointment created successfully!");
            console.log("📋 Response data:", JSON.stringify(responseData, null, 2));

            // Step 7: Verify what was actually saved
            console.log("\n📋 STEP 7: Verify what was saved");
            const verifyResponse = await fetch(`${API_BASE_URL}/api/appointments/${responseData.id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (verifyResponse.ok) {
                const savedAppointment = await verifyResponse.json();
                console.log("🔍 Actually saved appointment:", JSON.stringify(savedAppointment, null, 2));

                // Compare what we sent vs what was saved
                console.log("\n🔍 COMPARISON:");
                console.log(`  - Sent patient ID: ${appointmentData.patient}`);
                console.log(`  - Saved patient ID: ${savedAppointment.patient}`);
                console.log(`  - Sent patient name: John Smith`);
                console.log(`  - Saved patient name: ${savedAppointment.patient_name}`);
                console.log(`  - Sent provider ID: ${appointmentData.provider}`);
                console.log(`  - Saved provider ID: ${savedAppointment.provider}`);
                console.log(`  - Sent provider name: Emily Chen`);
                console.log(`  - Saved provider name: ${savedAppointment.provider_name}`);

                if (savedAppointment.patient_name !== "John Smith") {
                    console.log("❌ BUG CONFIRMED: Wrong patient saved!");
                    console.log("❌ Expected: John Smith");
                    console.log(`❌ Got: ${savedAppointment.patient_name}`);
                } else {
                    console.log("✅ Patient saved correctly");
                }
            } else {
                console.log("❌ Failed to verify saved appointment");
            }
        } else {
            const errorText = await createResponse.text();
            console.log("❌ Failed to create appointment:", createResponse.status);
            console.log("❌ Error:", errorText);
        }

    } catch (error) {
        console.error("❌ Error in test:", error.message);
    }
}

testPatientPickerBug();
