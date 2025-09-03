// Test script to check user organization mappings
const API_BASE_URL = 'https://www.powerhealthcareit.com';

async function checkUserOrganizations() {
    console.log('🏥 Checking User Organization Mappings');
    console.log('======================================');

    // Test users (if you have test accounts, add them here)
    const testUsers = [
        { username: 'jsswp2004', password: 'krat25Miko!', expectedOrg: 'SUNY Downstate?' }
    ];

    for (const user of testUsers) {
        console.log(`\n👤 Testing user: ${user.username}`);
        console.log(`   Expected org: ${user.expectedOrg}`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    password: user.password
                })
            });

            if (response.ok) {
                const data = await response.json();
                const payload = JSON.parse(Buffer.from(data.access.split('.')[1], 'base64').toString());

                console.log('✅ Login successful');
                console.log(`   📋 Organization ID: ${payload.organization_id}`);
                console.log(`   📋 Organization Name: ${payload.organization_name}`);
                console.log(`   📋 Organization Type: ${payload.organization_type}`);
                console.log(`   📋 User Role: ${payload.role}`);

                // Check if this matches expectation
                if (user.expectedOrg.includes('SUNY') && !payload.organization_name.includes('SUNY')) {
                    console.log('   ⚠️  MISMATCH: Expected SUNY Downstate but got', payload.organization_name);
                } else if (!user.expectedOrg.includes('SUNY') && payload.organization_name.includes('POWER')) {
                    console.log('   ✅ Organization matches expectation');
                }

            } else {
                console.log('❌ Login failed:', response.status);
            }
        } catch (error) {
            console.log('💥 Error:', error.message);
        }
    }

    console.log('\n🎯 DIAGNOSIS:');
    console.log('=============');
    console.log('1. Frontend looks for "organization" field but JWT has "organization_name"');
    console.log('2. jsswp2004 is assigned to "POWER Healthcare Systems" in backend');
    console.log('3. Need to either:');
    console.log('   a) Fix frontend to use organization_name, or');
    console.log('   b) Fix backend to use correct organization for this user');
}

checkUserOrganizations().catch(console.error);
