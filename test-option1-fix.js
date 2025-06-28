#!/usr/bin/env node

// Simple API config for testing
const API_BASE_URL = "http://192.168.1.153:8000";

// Add error handling for fetch
global.fetch = global.fetch || require('node-fetch');

async function testPatientsEndpoint() {
    console.log('🔍 Testing patients API endpoint with Option 1 fix...');
    console.log('🌐 API Base URL:', API_BASE_URL);

    try {
        // Step 1: Login to get token
        console.log('\n📋 Step 1: Logging in...');
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'jsswp2004',
                password: 'krat25Miko!'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('🔑 Access token obtained');

        // Step 2: Test the NEW endpoint /api/users/patients/
        console.log('\n📋 Step 2: Testing /api/users/patients/ endpoint (Option 1 fix)...');
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: {
                'Authorization': `Bearer ${loginData.access}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', patientsResponse.status);

        if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            console.log('✅ SUCCESS! Patients endpoint is working!');
            console.log('📊 Full response data:', JSON.stringify(patientsData, null, 2));
            console.log('📊 Type of response:', typeof patientsData);
            console.log('📊 Is array?', Array.isArray(patientsData));

            if (Array.isArray(patientsData)) {
                console.log('📊 Number of patients found:', patientsData.length);

                if (patientsData.length > 0) {
                    console.log('👤 Sample patient data:');
                    console.log('   - Full first patient:', JSON.stringify(patientsData[0], null, 2));
                }
            } else if (patientsData && patientsData.results) {
                console.log('📊 Paginated response - Number of patients:', patientsData.results.length);
                if (patientsData.results.length > 0) {
                    console.log('👤 Sample patient data:');
                    console.log('   - Full first patient:', JSON.stringify(patientsData.results[0], null, 2));
                }
            }

            console.log('\n🎉 OPTION 1 SUCCESSFUL!');
            console.log('✅ Your mobile app should now be able to load patients using the /api/users/patients/ endpoint');

        } else if (patientsResponse.status === 404) {
            console.log('❌ Still getting 404 - /api/users/patients/ endpoint not found');
            console.log('⚠️  This means Option 1 won\'t work, you\'ll need Option 2 (add backend endpoint)');

        } else {
            const errorText = await patientsResponse.text();
            console.log('❌ Error response:', patientsResponse.status);
            console.log('📄 Error details:', errorText);
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Run the test
testPatientsEndpoint();
