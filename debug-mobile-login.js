// Debug script to test the same login flow as the mobile app
const axios = require('axios');

const API_BASE_URL = "http://localhost:8000";
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login/`;

async function testMobileLogin() {
    console.log('🔧 === DEBUGGING MOBILE APP LOGIN FLOW ===');
    console.log(`📍 Using API URL: ${LOGIN_ENDPOINT}`);

    const credentials = {
        username: 'jsswp2004',
        password: 'krat25Miko!'
    };

    console.log(`🔐 Testing login with username: ${credentials.username}`);

    try {
        // Test backend connectivity first
        console.log('\n1️⃣ Testing backend connectivity...');
        const healthCheck = await axios.get(`${API_BASE_URL}/api/`);
        console.log(`✅ Backend is reachable (Status: ${healthCheck.status})`);

        // Test login
        console.log('\n2️⃣ Testing login request...');
        const loginResponse = await axios.post(LOGIN_ENDPOINT, credentials);

        console.log(`✅ Login Response Status: ${loginResponse.status}`);
        console.log(`✅ Login Response Headers:`, loginResponse.headers);

        const { access, refresh } = loginResponse.data;

        if (access && refresh) {
            console.log('✅ Tokens received successfully!');
            console.log(`📝 Access Token Length: ${access.length}`);
            console.log(`📝 Refresh Token Length: ${refresh.length}`);

            // Decode JWT to check user info (similar to mobile app)
            const jwtDecode = require('jsonwebtoken');
            try {
                const decoded = jwtDecode.decode(access);
                console.log('👤 Decoded user info:', decoded);
            } catch (jwtError) {
                console.log('⚠️ JWT decode error:', jwtError.message);
            }

            console.log('\n✅ LOGIN SUCCESSFUL! Mobile app should work with these same credentials.');
        } else {
            console.log('❌ No tokens in response');
            console.log('📄 Full Response:', loginResponse.data);
        }

    } catch (error) {
        console.log('\n❌ LOGIN FAILED!');

        if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`📋 Status Text: ${error.response.statusText}`);
            console.log(`📋 Response Data:`, error.response.data);
            console.log(`📋 Response Headers:`, error.response.headers);

            if (error.response.status === 401) {
                console.log('🔍 This indicates invalid credentials');
            } else if (error.response.status === 404) {
                console.log('🔍 This indicates the login endpoint is not found');
            } else if (error.response.status >= 500) {
                console.log('🔍 This indicates a server error');
            }
        } else if (error.request) {
            console.log('📋 No response received from server');
            console.log('🔍 This could indicate network issues or server not running');
            console.log('📋 Request details:', error.request);
        } else {
            console.log('📋 Error setting up request:', error.message);
        }
    }
}

testMobileLogin().catch(console.error);
