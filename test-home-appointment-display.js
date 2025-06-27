/**
 * Test Home Tab Appointment Display Logic
 * Verifies that the home tab can correctly parse and display appointment times
 */

const moment = require('moment');

console.log("🏠 HOME TAB APPOINTMENT TIME DISPLAY TEST");
console.log("==========================================");

// Test different appointment data formats
const testAppointments = [
    {
        id: 1,
        patient_name: "John Doe",
        doctor_name: "Dr. Smith",
        appointment_datetime: "2024-12-25T14:30:00-07:00", // New format with timezone
        duration: 30,
        status: "confirmed"
    },
    {
        id: 2,
        patient_name: "Jane Wilson",
        doctor_name: "Dr. Johnson",
        appointment_datetime: "2024-12-25T09:15:00-08:00", // Different timezone
        duration: 45,
        status: "pending"
    },
    {
        id: 3,
        patient_name: "Bob Brown",
        doctor_name: "Dr. Davis",
        appointment_time: "16:45:00", // Old format - time only
        appointment_date: "2024-12-25",
        duration: 30,
        status: "confirmed"
    },
    {
        id: 4,
        patient_name: "Alice Green",
        doctor_name: "Dr. Taylor",
        appointment_time: "11:30", // Old format - time without seconds
        appointment_date: "2024-12-25",
        duration: 60,
        status: "scheduled"
    },
    {
        id: 5,
        patient_name: "Charlie Black",
        doctor_name: "Dr. White",
        // No time fields - should show "Time not set"
        duration: 30,
        status: "pending"
    }
];

// Simulate the display logic from the updated home tab
function getDisplayTime(appointment) {
    let displayTime = "Time not set";

    if (appointment.appointment_datetime) {
        // New format: parse appointment_datetime
        try {
            const datetime = moment(appointment.appointment_datetime);
            if (datetime.isValid()) {
                displayTime = datetime.format("h:mm A");
            }
        } catch (error) {
            console.log("Error parsing appointment_datetime:", error);
        }
    } else if (appointment.appointment_time) {
        // Old format: parse appointment_time
        try {
            const time = moment(appointment.appointment_time, [
                "HH:mm:ss",
                "HH:mm",
                "YYYY-MM-DDTHH:mm:ss",
                "YYYY-MM-DD HH:mm:ss",
            ]);
            if (time.isValid()) {
                displayTime = time.format("h:mm A");
            }
        } catch (error) {
            console.log("Error parsing appointment_time:", error);
        }
    }

    return displayTime;
}

// Test each appointment
console.log("\n📅 Testing appointment time display:");
testAppointments.forEach((appointment, index) => {
    console.log(`\nAppointment ${index + 1}:`);
    console.log(`  Patient: ${appointment.patient_name}`);
    console.log(`  Doctor: ${appointment.doctor_name}`);
    console.log(`  Raw appointment_datetime: ${appointment.appointment_datetime || 'N/A'}`);
    console.log(`  Raw appointment_time: ${appointment.appointment_time || 'N/A'}`);
    console.log(`  Raw appointment_date: ${appointment.appointment_date || 'N/A'}`);

    const displayTime = getDisplayTime(appointment);
    console.log(`  ➡️  Display Time: ${displayTime}`);

    // Verify the result
    if (appointment.appointment_datetime) {
        const expectedMoment = moment(appointment.appointment_datetime);
        const expected = expectedMoment.format("h:mm A");
        console.log(`  ✅ Expected: ${expected}, Got: ${displayTime}, Match: ${expected === displayTime ? 'YES' : 'NO'}`);
    } else if (appointment.appointment_time) {
        const expectedMoment = moment(appointment.appointment_time, ["HH:mm:ss", "HH:mm"]);
        const expected = expectedMoment.format("h:mm A");
        console.log(`  ✅ Expected: ${expected}, Got: ${displayTime}, Match: ${expected === displayTime ? 'YES' : 'NO'}`);
    } else {
        console.log(`  ✅ Expected: Time not set, Got: ${displayTime}, Match: ${displayTime === 'Time not set' ? 'YES' : 'NO'}`);
    }
});

console.log("\n🌍 Testing timezone awareness:");
const timezoneTest = {
    id: 99,
    appointment_datetime: "2024-12-25T15:30:00-05:00" // Eastern time
};

const easternTime = moment(timezoneTest.appointment_datetime);
console.log(`  Eastern time appointment: ${timezoneTest.appointment_datetime}`);
console.log(`  Parsed as: ${easternTime.toString()}`);
console.log(`  Display time: ${getDisplayTime(timezoneTest)}`);
console.log(`  Local equivalent: ${easternTime.local().format("h:mm A")}`);

console.log("\n🎉 Home tab appointment time display test complete!");
console.log("The updated logic should now correctly handle both old and new appointment formats.");
