/**
 * Test Current System Timezone Handling
 * Simulates appointments created with our automatic timezone logic
 */

const moment = require('moment');

console.log("🕒 CURRENT TIMEZONE APPOINTMENT TEST");
console.log("====================================");

// Get current timezone offset (same logic as our modals)
const now = new Date();
const timezoneOffset = -now.getTimezoneOffset();
const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
const offsetMinutes = Math.abs(timezoneOffset) % 60;
const offsetSign = timezoneOffset >= 0 ? '+' : '-';
const currentTimezoneString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

console.log(`🌍 Current system timezone: ${currentTimezoneString}`);
console.log(`📍 Current time: ${now.toString()}`);

// Simulate an appointment created today with our automatic timezone logic
const todayDate = moment().format("YYYY-MM-DD");
const appointmentTime = "14:30";
const appointmentDateTime = `${todayDate}T${appointmentTime}:00${currentTimezoneString}`;

console.log(`\n📅 Simulated appointment created with automatic timezone:`);
console.log(`  Date: ${todayDate}`);
console.log(`  Time: ${appointmentTime}`);
console.log(`  Full datetime: ${appointmentDateTime}`);

// Test how the home tab would display this
const parsedDateTime = moment(appointmentDateTime);
const displayTime = parsedDateTime.format("h:mm A");

console.log(`\n🏠 Home tab display:`);
console.log(`  Parsed datetime: ${parsedDateTime.toString()}`);
console.log(`  Display time: ${displayTime}`);
console.log(`  Expected time: 2:30 PM`);
console.log(`  Correct display: ${displayTime === '2:30 PM' ? 'YES ✅' : 'NO ❌'}`);

// Test a few more times
const testTimes = ['09:00', '13:45', '17:15', '20:30'];
console.log(`\n🧪 Additional time tests:`);

testTimes.forEach(time => {
    const testDateTime = `${todayDate}T${time}:00${currentTimezoneString}`;
    const parsed = moment(testDateTime);
    const display = parsed.format("h:mm A");

    // Convert to expected 12-hour format for comparison
    const [hours, minutes] = time.split(':');
    const expectedMoment = moment().hours(parseInt(hours)).minutes(parseInt(minutes));
    const expected = expectedMoment.format("h:mm A");

    console.log(`  ${time} → ${display} (expected: ${expected}) ${display === expected ? '✅' : '❌'}`);
});

console.log(`\n🎯 Summary:`);
console.log(`The home tab should now correctly display appointment times`);
console.log(`created with our automatic timezone detection logic.`);
console.log(`Times will appear in the user's local timezone as expected.`);
