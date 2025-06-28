const http = require('http');

// Test configuration with your credentials
const config = {
    API_BASE_URL: "http://192.168.1.153:8000",
    USERNAME: "jsswp2004",
    PASSWORD: "krat25Miko!"
};

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
                'User-Agent': 'PatientAPI-Test/1.0',
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

async function testLogin() {
    console.log('\n🔐 Testing login with credentials:');
    console.log(`   Username: ${config.USERNAME}`);
    console.log(`   Password: ${config.PASSWORD.substring(0, 4)}***`);

    try {
        const response = await makeRequest(`${config.API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            body: {
                username: config.USERNAME,
                password: config.PASSWORD
            }
        });

        console.log(`📡 Login response status: ${response.status}`);
        console.log(`📄 Response data:`, response.data);
        console.log(`📄 Raw response:`, response.rawData);

        if (response.status === 200 && response.data && response.data.access) {
            console.log(`✅ Login successful!`);
            console.log(`🔑 Access token: ${response.data.access.substring(0, 50)}...`);
            return response.data.access;
        } else {
            console.log(`❌ Login failed`);
            return null;
        }
    } catch (error) {
        console.log(`💥 Login error: ${error.message}`);
        return null;
    }
}

async function testPatientsAPI(token) {
    console.log('\n👥 Testing patients API...');

    try {
        const response = await makeRequest(`${config.API_BASE_URL}/api/patients/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`📡 Patients API response status: ${response.status}`);
        console.log(`📄 Response data:`, response.data);
        console.log(`📄 Raw response:`, response.rawData);

        if (response.status === 200) {
            console.log(`✅ Patients API successful!`);
            if (Array.isArray(response.data)) {
                console.log(`📊 Number of patients: ${response.data.length}`);
                if (response.data.length > 0) {
                    console.log(`🔍 First patient:`, response.data[0]);
                }
            }
            return true;
        } else {
            console.log(`❌ Patients API failed`);
            return false;
        }
    } catch (error) {
        console.log(`💥 Patients API error: ${error.message}`);
        return false;
    }
}

async function runTest() {
    console.log('🧪 Testing Patient API with your credentials');
    console.log('==========================================');

    // Test login
    const token = await testLogin();
    if (!token) {
        console.log('\n❌ Cannot continue - login failed');
        return;
    }

    // Test patients API
    await testPatientsAPI(token);
}

runTest().catch(console.error);
