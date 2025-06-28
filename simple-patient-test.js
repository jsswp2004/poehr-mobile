/**
 * Simple Patient API Test
 * 
 * This script tests the patients API with proper handling of special characters
 * Run with: node simple-patient-test.js
 */

const http = require('http');

// Configuration
const API_BASE_URL = "http://192.168.1.153:8000";
const CREDENTIALS = {
    username: "jsswp2004",
    password: "krat25Miko!"
};

// Make HTTP request helper
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 8000,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        rawData: data
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: null,
                        rawData: data,
                        parseError: error.message
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testLogin() {
    console.log('🔐 Testing login with credentials...');
    console.log(`   Username: ${CREDENTIALS.username}`);
    console.log(`   Password: ${CREDENTIALS.password.substring(0, 4)}****`);

    // Try different field name combinations
    const loginAttempts = [
        { username: CREDENTIALS.username, password: CREDENTIALS.password },
        { email: CREDENTIALS.username, password: CREDENTIALS.password },
        { user: CREDENTIALS.username, pass: CREDENTIALS.password }
    ];

    for (let i = 0; i < loginAttempts.length; i++) {
        const attempt = loginAttempts[i];
        console.log(`\n🔄 Attempt ${i + 1}: ${JSON.stringify(Object.keys(attempt))}`);

        try {
            const response = await makeRequest(`${API_BASE_URL}/api/auth/login/`, {
                method: 'POST',
                body: attempt
            });

            console.log(`📡 Login response status: ${response.status}`);
            console.log(`📡 Response data:`, response.rawData);

            if (response.status === 200 && response.data && response.data.access) {
                console.log('✅ Login successful!');
                console.log(`🔑 Access token received (length: ${response.data.access.length})`);
                return response.data.access;
            } else if (response.status === 400) {
                console.log(`❌ Bad request: ${response.rawData}`);
            } else {
                console.log(`❌ Status ${response.status}: ${response.rawData}`);
            }
        } catch (error) {
            console.log(`💥 Login error: ${error.message}`);
        }
    }

    return null;
}

async function testPatientsAPI(token) {
    console.log('\n👥 Testing patients API...');

    try {
        const response = await makeRequest(`${API_BASE_URL}/api/patients/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`📡 Patients API response status: ${response.status}`);

        if (response.status === 200) {
            if (Array.isArray(response.data)) {
                console.log(`✅ Success! Found ${response.data.length} patients`);

                if (response.data.length > 0) {
                    console.log('\n🔍 First patient:');
                    const first = response.data[0];
                    console.log(`   ID: ${first.id}`);
                    console.log(`   Name: ${first.first_name} ${first.last_name}`);
                    console.log(`   Email: ${first.email}`);
                } else {
                    console.log('⚠️  No patients found in database');
                }
                return true;
            } else {
                console.log('⚠️  Response is not an array');
                console.log(`   Data: ${JSON.stringify(response.data)}`);
                return false;
            }
        } else {
            console.log(`❌ API failed with status: ${response.status}`);
            console.log(`📄 Error: ${response.rawData}`);
            return false;
        }
    } catch (error) {
        console.log(`💥 API error: ${error.message}`);
        return false;
    }
}

async function runTest() {
    console.log('🧪 Simple Patient API Test');
    console.log('===========================');
    console.log(`🌐 API URL: ${API_BASE_URL}`);

    // Step 1: Login
    const token = await testLogin();
    if (!token) {
        console.log('\n❌ Cannot continue - login failed');
        return;
    }

    // Step 2: Test patients API
    const success = await testPatientsAPI(token);

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Login: ${token ? '✅' : '❌'}`);
    console.log(`Patients API: ${success ? '✅' : '❌'}`);

    if (token && success) {
        console.log('\n🎉 All tests passed! The API is working.');
    } else {
        console.log('\n❌ Some tests failed. Check the errors above.');
    }
}

// Run the test
runTest().catch(error => {
    console.log(`\n💥 Unexpected error: ${error.message}`);
    console.error(error);
});
