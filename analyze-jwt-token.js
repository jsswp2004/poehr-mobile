// Quick JWT token analysis script
const API_BASE_URL = 'https://www.powerhealthcareit.com';

async function testJWTContent() {
    console.log('🔍 Analyzing JWT Token Content for jsswp2004');
    console.log('==============================================');

    const credentials = {
        username: 'jsswp2004',
        password: 'krat25Miko!'
    };

    try {
        console.log('🔐 Logging in to get JWT token...');
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        console.log(`📡 Login Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            const accessToken = data.access;

            if (accessToken) {
                console.log('✅ JWT Token received!');
                console.log(`📏 Token length: ${accessToken.length}`);

                // Decode JWT manually
                try {
                    const parts = accessToken.split('.');
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

                    console.log('\n🔍 JWT TOKEN CONTENTS:');
                    console.log('======================');
                    console.log('Full payload:', JSON.stringify(payload, null, 2));

                    console.log('\n📋 ORGANIZATION ANALYSIS:');
                    console.log('=========================');
                    console.log('Organization field:', payload.organization || 'NOT PRESENT');
                    console.log('Organization type:', typeof payload.organization);

                    console.log('\n👤 USER FIELDS:');
                    console.log('===============');
                    console.log('Username:', payload.username || 'N/A');
                    console.log('First Name:', payload.first_name || 'N/A');
                    console.log('Last Name:', payload.last_name || 'N/A');
                    console.log('Email:', payload.email || 'N/A');
                    console.log('Role:', payload.role || 'N/A');
                    console.log('User ID:', payload.user_id || 'N/A');

                    console.log('\n🔑 ALL TOKEN KEYS:');
                    console.log('==================');
                    Object.keys(payload).forEach(key => {
                        console.log(`${key}: ${typeof payload[key]} = ${JSON.stringify(payload[key])}`);
                    });

                } catch (decodeError) {
                    console.log('❌ Error decoding JWT:', decodeError.message);
                }
            } else {
                console.log('❌ No access token in response');
                console.log('Response:', data);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Login failed:', errorText);
        }
    } catch (error) {
        console.log('💥 Error:', error.message);
    }
}

testJWTContent().catch(console.error);
