const fetch = require('node-fetch');

// Base URLs
const baseURL = 'http://192.168.1.153:8000';

// Hardcoded credentials
const credentials = {
    username: 'jsswp2004',
    password: 'krat25Miko!'
};

async function debugPatientMapping() {
    try {
        console.log('🔍 === DEBUGGING PATIENT MAPPING ===');

        // 1. Login to get token
        console.log('1. Attempting login...');
        const loginResponse = await fetch(`${baseURL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginResult = await loginResponse.json();
        const token = loginResult.access;
        console.log('✅ Login successful!');

        // 2. Fetch all patients to see the mapping
        console.log('\n2. Fetching all patients...');
        const patientsResponse = await fetch(`${baseURL}/api/users/patients/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!patientsResponse.ok) {
            throw new Error(`Failed to fetch patients: ${patientsResponse.status}`);
        }

        const patients = await patientsResponse.json();
        console.log('📋 Patients response:', JSON.stringify(patients, null, 2));

        const patientsList = Array.isArray(patients) ? patients : patients.results || [];
        console.log('📋 Patients from /api/users/patients/:');
        patientsList.forEach(patient => {
            console.log(`   ID: ${patient.id}, Name: ${patient.first_name} ${patient.last_name}, User ID: ${patient.user_id}`);
        });

        // 3. Fetch all users to see the mapping
        console.log('\n3. Fetching all users...');
        const usersResponse = await fetch(`${baseURL}/api/users/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!usersResponse.ok) {
            throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        }

        const users = await usersResponse.json();
        console.log('👥 Users response:', JSON.stringify(users, null, 2));

        const usersList = Array.isArray(users) ? users : users.results || [];
        console.log('👥 Users from /api/users/:');
        usersList.forEach(user => {
            if (user.role === 'patient') {
                console.log(`   User ID: ${user.id}, Name: ${user.first_name} ${user.last_name}, Username: ${user.username}`);
            }
        });

        // 4. Check the specific mappings we're testing
        console.log('\n4. Testing specific Patient ID to User mappings:');
        const testCases = [
            { patientId: 6, expectedName: 'John Smith' },
            { patientId: 8, expectedName: 'Michael Brown' },
            { patientId: 10, expectedName: 'David Wilson' }
        ];

        for (const testCase of testCases) {
            const patient = patientsList.find(p => p.id === testCase.patientId);
            if (patient) {
                const user = usersList.find(u => u.id === patient.user_id);
                console.log(`   Patient ID ${testCase.patientId}:`);
                console.log(`     Expected: ${testCase.expectedName}`);
                console.log(`     Patient record: ${patient.first_name} ${patient.last_name} (User ID: ${patient.user_id})`);
                console.log(`     User record: ${user ? `${user.first_name} ${user.last_name}` : 'NOT FOUND'}`);
                console.log(`     Match: ${patient.first_name === testCase.expectedName.split(' ')[0] ? '✅' : '❌'}`);
            } else {
                console.log(`   Patient ID ${testCase.patientId}: NOT FOUND ❌`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause.message);
        }
    }
}

debugPatientMapping();
