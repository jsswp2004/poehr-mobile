// scripts/test-production-api.js
// Run this script to test your production API endpoints
// Usage: node scripts/test-production-api.js

const API_BASE_URL = 'https://www.powerhealthcareit.com'; // Your production URL

const testEndpoints = async () => {
    console.log('🧪 Testing Production API Endpoints...');
    console.log(`🔗 Base URL: ${API_BASE_URL}\n`);

    const endpoints = [
        { name: 'Health Check', url: '/api/health/', method: 'GET' },
        { name: 'Auth Login', url: '/api/auth/login/', method: 'POST' },
        { name: 'Appointments', url: '/api/appointments/', method: 'GET' },
        { name: 'Patients', url: '/api/users/patients/', method: 'GET' },
        { name: 'Availability', url: '/api/availability/', method: 'GET' },
        { name: 'Doctors', url: '/api/users/doctors/', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint.name}...`);

            const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PoEHR-Mobile-Test/1.0',
                },
            });

            const status = response.status;
            const statusText = response.statusText;

            if (status === 200 || status === 401) { // 401 is expected for auth-required endpoints
                console.log(`  ✅ ${endpoint.name}: ${status} ${statusText}`);
            } else {
                console.log(`  ⚠️  ${endpoint.name}: ${status} ${statusText}`);
            }

        } catch (error) {
            console.log(`  ❌ ${endpoint.name}: ${error.message}`);
        }
    }

    console.log('\n🏁 API Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update API_BASE_URL in config/api.ts');
    console.log('2. Test authentication in mobile app');
    console.log('3. Verify all features work with production backend');
};

testEndpoints().catch(console.error);
