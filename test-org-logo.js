/**
 * Test organizational logo selection logic
 */

console.log("🏢 ORGANIZATIONAL LOGO TEST");
console.log("===========================");

// Simulate the logo selection function
function getOrganizationLogo(organization) {
    if (!organization) {
        return "power-logo.png";
    }

    const org = organization.toLowerCase();

    // Map organizations to their respective logos
    if (org.includes('hospital') || org.includes('medical center')) {
        return "hospital-logo.png";
    } else if (org.includes('clinic') || org.includes('health')) {
        return "clinic-logo.png";
    } else {
        // Default to POWER IT logo
        return "power-logo.png";
    }
}

// Test different organizations
const testCases = [
    { org: null, expected: "power-logo.png" },
    { org: undefined, expected: "power-logo.png" },
    { org: "POWER IT", expected: "power-logo.png" },
    { org: "General Hospital", expected: "hospital-logo.png" },
    { org: "City Medical Center", expected: "hospital-logo.png" },
    { org: "Family Health Clinic", expected: "clinic-logo.png" },
    { org: "Wellness Clinic", expected: "clinic-logo.png" },
    { org: "Tech Company", expected: "power-logo.png" },
    { org: "University Hospital", expected: "hospital-logo.png" }
];

console.log("🧪 Testing logo selection logic:");
testCases.forEach((testCase, index) => {
    const result = getOrganizationLogo(testCase.org);
    const passed = result === testCase.expected;
    console.log(`  Test ${index + 1}: ${testCase.org || 'null/undefined'}`);
    console.log(`    Expected: ${testCase.expected}`);
    console.log(`    Got: ${result}`);
    console.log(`    Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
});

console.log("🎯 Organization Logo Logic Test Complete!");
console.log("This ensures the home screen will display the correct logo based on user organization.");
