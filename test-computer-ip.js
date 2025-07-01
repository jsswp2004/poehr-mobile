// Test the backend with the computer's actual IP address
const axios = require('axios');

const COMPUTER_IP = "192.168.0.36";
const API_BASE_URL = `http://${COMPUTER_IP}:8000`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login/`;

console.log('🔧 === TESTING BACKEND WITH COMPUTER IP ADDRESS ===');
console.log(`📍 Computer IP: ${COMPUTER_IP}`);
console.log(`📍 API_BASE_URL: ${API_BASE_URL}`);
console.log(`📍 LOGIN_ENDPOINT: ${LOGIN_ENDPOINT}`);

async function testWithComputerIP() {
    try {
        console.log('\n🌐 Testing backend connectivity with computer IP...');
        const response = await axios.get(`${API_BASE_URL}/api/`);
        console.log(`✅ Backend accessible via IP: ${response.status}`);

        console.log('\n🔐 Testing login with computer IP...');
        const loginTest = await axios.post(LOGIN_ENDPOINT, {
            username: 'jsswp2004',
            password: 'krat25Miko!'
        });
        console.log(`✅ Login works via IP: ${loginTest.status}`);
        console.log('✅ Mobile devices should be able to connect to this IP!');

    } catch (error) {
        console.log('\n❌ Connection to computer IP failed!');
        if (error.code === 'ECONNREFUSED') {
            console.log('🔍 Backend is not accessible via the computer IP address');
            console.log('🔍 This could be due to:');
            console.log('   - Firewall blocking the connection');
            console.log('   - Backend only listening on localhost');
            console.log('   - Network configuration issues');
        } else if (error.response) {
            console.log(`🔍 Server responded with error: ${error.response.status}`);
        } else {
            console.log(`🔍 Network error: ${error.message}`);
        }
    }
}

testWithComputerIP();
