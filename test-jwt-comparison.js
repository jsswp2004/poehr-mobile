const https = require('https');

// Disable SSL verification for testing (NOT for production)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE_URL = 'https://www.powerhealthcareit.com';

// Simple JWT decoder (just for debugging, not for production)
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const payload = parts[1];
        // Add padding if needed
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString());
        return decoded;
    } catch (error) {
        throw new Error('Failed to decode JWT: ' + error.message);
    }
}

async function makeRequest(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function loginAndDecodeToken(username, password) {
    try {
        console.log(`\n🔐 Logging in as: ${username}`);

        const response = await makeRequest(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.status !== 200) {
            throw new Error(`Login failed: ${response.status}`);
        }

        const token = response.data.access_token || response.data.access;

        if (!token) {
            throw new Error('No access token received');
        }

        // Decode the JWT token
        const decoded = decodeJWT(token);

        console.log(`✅ Login successful for ${username}`);
        console.log(`📋 JWT Token Info:`);
        console.log(`   Username: ${decoded.username}`);
        console.log(`   Role: "${decoded.role}" (type: ${typeof decoded.role})`);
        console.log(`   First Name: ${decoded.first_name}`);
        console.log(`   Last Name: ${decoded.last_name}`);
        console.log(`   Email: ${decoded.email}`);
        console.log(`   User ID: ${decoded.user_id}`);
        console.log(`   Organization: ${decoded.organization}`);
        console.log(`   Organization Name: ${decoded.organization_name}`);

        return {
            username: username,
            role: decoded.role,
            decoded: decoded,
            token: token
        };

    } catch (error) {
        console.error(`❌ Error for ${username}:`, error.message);
        return null;
    }
}

async function compareUsers() {
    console.log('🔍 JWT Token Comparison: adminsuny vs registrarsuny\n');

    // Try different password combinations
    let adminResult = await loginAndDecodeToken('adminsuny', 'changeme');
    if (!adminResult) {
        adminResult = await loginAndDecodeToken('adminsuny', 'admin123');
    }
    if (!adminResult) {
        adminResult = await loginAndDecodeToken('adminsuny', 'krat25Miko!');
    }

    let registrarResult = await loginAndDecodeToken('registrarsuny', 'changeme');
    if (!registrarResult) {
        registrarResult = await loginAndDecodeToken('registrarsuny', 'registrar123');
    }
    if (!registrarResult) {
        registrarResult = await loginAndDecodeToken('registrarsuny', 'krat25Miko!');
    }

    if (adminResult && registrarResult) {
        console.log('\n📊 COMPARISON RESULTS:');
        console.log('='.repeat(50));

        console.log(`Admin Role: "${adminResult.role}" (${typeof adminResult.role})`);
        console.log(`Registrar Role: "${registrarResult.role}" (${typeof registrarResult.role})`);

        console.log(`\nRole Comparison:`);
        console.log(`  Roles match: ${adminResult.role === registrarResult.role}`);
        console.log(`  Admin role === "admin": ${adminResult.role === "admin"}`);
        console.log(`  Registrar role === "registrar": ${registrarResult.role === "registrar"}`);

        console.log(`\nFull Token Comparison:`);
        console.log(`Admin Token Keys:`, Object.keys(adminResult.decoded));
        console.log(`Registrar Token Keys:`, Object.keys(registrarResult.decoded));

        // Check for any differences in token structure
        const adminKeys = Object.keys(adminResult.decoded);
        const registrarKeys = Object.keys(registrarResult.decoded);

        const missingFromRegistrar = adminKeys.filter(key => !registrarKeys.includes(key));
        const missingFromAdmin = registrarKeys.filter(key => !adminKeys.includes(key));

        if (missingFromRegistrar.length > 0) {
            console.log(`Keys missing from registrar token:`, missingFromRegistrar);
        }
        if (missingFromAdmin.length > 0) {
            console.log(`Keys missing from admin token:`, missingFromAdmin);
        }

        console.log('\n🎯 MOBILE APP PERMISSION CHECK SIMULATION:');
        console.log('='.repeat(50));

        // Simulate the mobile app permission check
        function checkPermissions(userRole, username) {
            const hasAccess = (
                userRole === "doctor" ||
                userRole === "admin" ||
                userRole === "system_admin" ||
                userRole === "registrar"
            );

            console.log(`${username}: Role="${userRole}" → Access: ${hasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
            return hasAccess;
        }

        checkPermissions(adminResult.role, 'adminsuny');
        checkPermissions(registrarResult.role, 'registrarsuny');

    } else {
        console.log('❌ Could not complete comparison - login failed for one or both users');
    }
}

// Run the comparison
compareUsers().catch(console.error);
