/**
 * Patient API Test Script
 * 
 * This script tests the patients API endpoint to help debug why the patient list
 * is not populating in the mobile app.
 * 
 * Run with: node test-patients-api.js
 */

const https = require('https');
const http = require('http');

// Configuration - Update these to match your setup
const config = {
    API_BASE_URL: "http://192.168.1.153:8000",
    // Test tokens - You'll need to get these from your app's AsyncStorage or login
    ACCESS_TOKEN: "", // Leave empty - we'll get this from login

    // Test credentials - Update with your test user
    TEST_CREDENTIALS: {
        username: "jsswp2004", // Your doctor/admin username
        password: "krat25Miko!" // Your password
    }
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestModule = urlObj.protocol === 'https:' ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PatientAPI-Test/1.0',
                ...options.headers
            }
        };

        const req = requestModule.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        rawData: data
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
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

async function testServerConnection() {
    log('\n🔗 Testing server connection...', colors.cyan);

    try {
        const response = await makeRequest(`${config.API_BASE_URL}/`);
        log(`✅ Server responded with status: ${response.status}`, colors.green);
        return true;
    } catch (error) {
        log(`❌ Server connection failed: ${error.message}`, colors.red);
        log(`   Check if your Django server is running on ${config.API_BASE_URL}`, colors.yellow);
        return false;
    }
}

async function testLogin() {
    log('\n🔐 Testing login...', colors.cyan);

    try {
        const response = await makeRequest(`${config.API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            body: config.TEST_CREDENTIALS
        });

        log(`📡 Login response status: ${response.status}`);

        if (response.status === 200 && response.data.access) {
            log(`✅ Login successful!`, colors.green);
            log(`🔑 Access token: ${response.data.access.substring(0, 50)}...`);
            config.ACCESS_TOKEN = response.data.access;

            // Decode and display token info
            try {
                const tokenPayload = JSON.parse(Buffer.from(response.data.access.split('.')[1], 'base64').toString());
                log(`👤 User info from token:`, colors.blue);
                log(`   - Username: ${tokenPayload.username}`);
                log(`   - Role: ${tokenPayload.role}`);
                log(`   - User ID: ${tokenPayload.user_id}`);
                log(`   - Email: ${tokenPayload.email || 'N/A'}`);
                log(`   - Organization: ${tokenPayload.organization || 'N/A'}`);
                log(`   - Expires: ${new Date(tokenPayload.exp * 1000).toLocaleString()}`);
            } catch (decodeError) {
                log(`⚠️  Could not decode token: ${decodeError.message}`, colors.yellow);
            }

            return true;
        } else {
            log(`❌ Login failed with status: ${response.status}`, colors.red);
            log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
            return false;
        }
    } catch (error) {
        log(`💥 Login error: ${error.message}`, colors.red);
        return false;
    }
}

async function testPatientsAPI() {
    log('\n👥 Testing patients API...', colors.cyan);

    if (!config.ACCESS_TOKEN) {
        log(`❌ No access token available. Login failed.`, colors.red);
        return false;
    }

    try {
        const response = await makeRequest(`${config.API_BASE_URL}/api/patients/`, {
            headers: {
                'Authorization': `Bearer ${config.ACCESS_TOKEN}`
            }
        });

        log(`📡 Patients API response status: ${response.status}`);
        log(`📊 Response headers:`, colors.blue);
        Object.entries(response.headers).forEach(([key, value]) => {
            log(`   ${key}: ${value}`);
        });

        if (response.status === 200) {
            log(`✅ Patients API successful!`, colors.green);

            if (Array.isArray(response.data)) {
                log(`📊 Number of patients: ${response.data.length}`, colors.green);

                if (response.data.length > 0) {
                    log(`🔍 First patient sample:`, colors.blue);
                    const firstPatient = response.data[0];
                    log(`   ID: ${firstPatient.id}`);
                    log(`   Name: ${firstPatient.first_name} ${firstPatient.last_name}`);
                    log(`   Email: ${firstPatient.email}`);
                    log(`   Phone: ${firstPatient.phone || 'N/A'}`);
                    log(`   Gender: ${firstPatient.gender || 'N/A'}`);
                    log(`   Created: ${firstPatient.created_at}`);

                    log(`\n📋 All patient IDs: ${response.data.map(p => p.id).join(', ')}`);
                } else {
                    log(`⚠️  No patients found in the database`, colors.yellow);
                    log(`   This could be why the mobile app shows an empty list.`, colors.yellow);
                }
            } else {
                log(`⚠️  Response is not an array:`, colors.yellow);
                log(`   ${JSON.stringify(response.data, null, 2)}`);
            }

            return true;
        } else if (response.status === 401) {
            log(`❌ Unauthorized (401). Token might be invalid or expired.`, colors.red);
            return false;
        } else if (response.status === 403) {
            log(`❌ Forbidden (403). User might not have permission to access patients.`, colors.red);
            return false;
        } else if (response.status === 404) {
            log(`❌ Not Found (404). The /api/patients/ endpoint might not exist.`, colors.red);
            return false;
        } else {
            log(`❌ Patients API failed with status: ${response.status}`, colors.red);
            log(`📄 Response: ${response.rawData}`);
            return false;
        }
    } catch (error) {
        log(`💥 Patients API error: ${error.message}`, colors.red);
        return false;
    }
}

async function testOtherEndpoints() {
    log('\n🔍 Testing other API endpoints...', colors.cyan);

    const endpoints = [
        '/api/appointments/',
        '/api/auth/user/', // If this exists
        '/admin/', // Django admin
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${config.API_BASE_URL}${endpoint}`, {
                headers: config.ACCESS_TOKEN ? {
                    'Authorization': `Bearer ${config.ACCESS_TOKEN}`
                } : {}
            });

            log(`📡 ${endpoint}: ${response.status}`,
                response.status < 400 ? colors.green : colors.red);
        } catch (error) {
            log(`💥 ${endpoint}: Error - ${error.message}`, colors.red);
        }
    }
}

async function runAllTests() {
    log('🧪 Starting Patient API Test Suite', colors.magenta);
    log('=====================================', colors.magenta);

    // Print configuration
    log(`\n⚙️  Configuration:`, colors.blue);
    log(`   API Base URL: ${config.API_BASE_URL}`);
    log(`   Test Username: ${config.TEST_CREDENTIALS.username}`);

    // Test 1: Server connection
    const serverOk = await testServerConnection();
    if (!serverOk) {
        log('\n❌ Cannot continue - server is not reachable', colors.red);
        return;
    }

    // Test 2: Login
    const loginOk = await testLogin();
    if (!loginOk) {
        log('\n❌ Cannot continue - login failed', colors.red);
        log('   Check your credentials in the config section of this file', colors.yellow);
        return;
    }

    // Test 3: Patients API
    const patientsOk = await testPatientsAPI();

    // Test 4: Other endpoints
    await testOtherEndpoints();

    // Summary
    log('\n📊 Test Summary:', colors.magenta);
    log('================', colors.magenta);
    log(`Server Connection: ${serverOk ? '✅' : '❌'}`, serverOk ? colors.green : colors.red);
    log(`Login: ${loginOk ? '✅' : '❌'}`, loginOk ? colors.green : colors.red);
    log(`Patients API: ${patientsOk ? '✅' : '❌'}`, patientsOk ? colors.green : colors.red);

    if (serverOk && loginOk && patientsOk) {
        log('\n🎉 All tests passed! The API is working correctly.', colors.green);
        log('   If the mobile app still shows no patients, check:', colors.blue);
        log('   1. Mobile app is using the same API URL', colors.blue);
        log('   2. Mobile app user has the same role (doctor/admin)', colors.blue);
        log('   3. Mobile app token is not expired', colors.blue);
        log('   4. Mobile app console logs for more details', colors.blue);
    } else {
        log('\n❌ Some tests failed. Check the errors above.', colors.red);
    }
}

// Instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log('Patient API Test Script', colors.magenta);
    log('=======================', colors.magenta);
    log('');
    log('This script tests the patients API to help debug mobile app issues.');
    log('');
    log('Setup:');
    log('1. Update the config section with your API URL and test credentials');
    log('2. Make sure your Django server is running');
    log('3. Run: node test-patients-api.js');
    log('');
    log('Options:');
    log('  --help, -h    Show this help message');
    process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
    log(`\n💥 Unexpected error: ${error.message}`, colors.red);
    console.error(error);
});
