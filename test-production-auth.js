// test-production-auth.js
// Quick test to verify production authentication
// Run this with: node test-production-auth.js

const API_BASE_URL = 'https://www.powerhealthcareit.com';

async function testLogin() {
    console.log('🔐 Testing Production Authentication...');
    console.log(`🔗 API URL: ${API_BASE_URL}\n`);

    // Test 1: Check if login endpoint exists
    try {
        console.log('Testing login endpoint availability...');
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'OPTIONS', // CORS preflight
            headers: {
                'Origin': 'https://expo.dev',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type',
            }
        });

        console.log(`✅ Login endpoint CORS: ${response.status} ${response.statusText}`);

        // Check CORS headers
        const corsHeaders = response.headers.get('Access-Control-Allow-Origin');
        console.log(`🌐 CORS Allow Origin: ${corsHeaders || 'Not set'}`);

    } catch (error) {
        console.log(`❌ CORS test failed: ${error.message}`);
    }

    // Test 2: Try a simple login request (will fail without credentials, but shows if endpoint works)
    try {
        console.log('\nTesting login endpoint response...');
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PoEHR-Mobile-Production-Test/1.0'
            },
            body: JSON.stringify({
                username: 'test',
                password: 'test'
            })
        });

        const status = loginResponse.status;
        console.log(`📝 Login test response: ${status} ${loginResponse.statusText}`);

        if (status === 400 || status === 401) {
            console.log('✅ Login endpoint is working (invalid credentials expected)');
        } else if (status === 200) {
            console.log('⚠️  Login succeeded with test credentials (check your backend security)');
        } else {
            console.log(`⚠️  Unexpected response: ${status}`);
        }

        // Try to read response body
        try {
            const responseData = await loginResponse.text();
            console.log(`📄 Response preview: ${responseData.substring(0, 100)}...`);
        } catch (e) {
            console.log('📄 Could not read response body');
        }

    } catch (error) {
        console.log(`❌ Login test failed: ${error.message}`);
    }

    console.log('\n🎯 Production API Test Summary:');
    console.log('✅ If you see 400/401 responses, your API is working correctly');
    console.log('✅ If you see CORS headers, mobile app should connect fine');
    console.log('❌ If you see network errors, check your backend deployment');
    console.log('\n📱 Next: Test authentication in your mobile app!');
}

testLogin().catch(console.error);
