// Final test with the updated mobile app configuration
const axios = require('axios');

// Use the EXACT same configuration as the mobile app now has
const API_BASE_URL = "http://192.168.0.36:8000";
const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login/`,
    REGISTER: `${API_BASE_URL}/api/auth/register/`,
    APPOINTMENTS: `${API_BASE_URL}/api/appointments/`,
    PATIENTS: `${API_BASE_URL}/api/users/patients/`,
    BLOCKED_DATES: `${API_BASE_URL}/api/blocked-dates/`,
};

console.log('🎯 === FINAL TEST: MOBILE APP CONFIGURATION ===');
console.log(`📍 API_BASE_URL: ${API_BASE_URL}`);
console.log(`📍 LOGIN_ENDPOINT: ${API_ENDPOINTS.LOGIN}`);

async function finalTest() {
    try {
        console.log('\n🔥 Testing the EXACT configuration the mobile app will use...');

        // Test 1: Basic connectivity
        const healthCheck = await axios.get(`${API_BASE_URL}/api/`);
        console.log(`✅ Backend accessible: ${healthCheck.status}`);

        // Test 2: Login (what mobile app does)
        const loginResponse = await axios.post(API_ENDPOINTS.LOGIN, {
            username: 'jsswp2004',
            password: 'krat25Miko!'
        });

        console.log(`✅ Login successful: ${loginResponse.status}`);
        const { access, refresh } = loginResponse.data;
        console.log(`✅ Access token received: ${access ? 'YES' : 'NO'}`);
        console.log(`✅ Refresh token received: ${refresh ? 'YES' : 'NO'}`);

        // Test 3: Other endpoints with auth
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`
        };

        const patientsTest = await axios.get(API_ENDPOINTS.PATIENTS, { headers: authHeaders });
        console.log(`✅ Patients endpoint accessible: ${patientsTest.status}`);

        const appointmentsTest = await axios.get(API_ENDPOINTS.APPOINTMENTS, { headers: authHeaders });
        console.log(`✅ Appointments endpoint accessible: ${appointmentsTest.status}`);

        console.log('\n🎉 SUCCESS! Mobile app should work perfectly now!');
        console.log('📱 Try logging in with jsswp2004 / krat25Miko! on your mobile device.');

    } catch (error) {
        console.log('\n❌ Test failed!');
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data:`, error.response.data);
        } else {
            console.log(`Error: ${error.message}`);
        }
    }
}

finalTest();
