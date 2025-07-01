// Simple test to verify the exact API endpoint the mobile app uses
const axios = require('axios');

// Import the same API configuration the mobile app uses
const API_BASE_URL = "http://localhost:8000";
const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login/`,
};

console.log('🔧 === TESTING MOBILE APP API CONFIGURATION ===');
console.log(`📍 API_BASE_URL: ${API_BASE_URL}`);
console.log(`📍 LOGIN_ENDPOINT: ${API_ENDPOINTS.LOGIN}`);

async function testConnection() {
    try {
        console.log('\n🌐 Testing basic connectivity...');
        const response = await axios.get(`${API_BASE_URL}/api/`);
        console.log(`✅ Backend accessible: ${response.status}`);

        console.log('\n🔐 Testing login endpoint...');
        const loginTest = await axios.post(API_ENDPOINTS.LOGIN, {
            username: 'jsswp2004',
            password: 'krat25Miko!'
        });
        console.log(`✅ Login works: ${loginTest.status}`);
        console.log('✅ Mobile app configuration is CORRECT!');

    } catch (error) {
        console.log('\n❌ Connection failed!');
        if (error.code === 'ECONNREFUSED') {
            console.log('🔍 Backend is not running or not accessible at localhost:8000');
        } else if (error.response) {
            console.log(`🔍 Server responded with error: ${error.response.status}`);
        } else {
            console.log(`🔍 Network error: ${error.message}`);
        }
    }
}

testConnection();
