#!/usr/bin/env node

const API_BASE_URL = "http://192.168.1.153:8000";
global.fetch = global.fetch || require('node-fetch');

async function checkAvailableMethods() {
    console.log('🔍 CHECKING AVAILABLE HTTP METHODS');

    try {
        // Login first
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'jsswp2004', password: 'krat25Miko!' })
        });

        const loginData = await loginResponse.json();
        const token = loginData.access;

        // Get a patient ID
        const patientsResponse = await fetch(`${API_BASE_URL}/api/users/patients/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const patientsData = await patientsResponse.json();
        const patients = Array.isArray(patientsData) ? patientsData : patientsData.results || [];
        const patientId = patients[0].id;

        console.log(`\nTesting methods on /api/users/patients/${patientId}/`);

        // Test different HTTP methods
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

        for (const method of methods) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/users/patients/${patientId}/`, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: method === 'POST' || method === 'PUT' || method === 'PATCH' ? JSON.stringify({
                        first_name: 'Test'
                    }) : undefined
                });

                console.log(`${method}: ${response.status} ${response.statusText}`);

                if (method === 'OPTIONS' && response.ok) {
                    const allowHeader = response.headers.get('Allow');
                    if (allowHeader) {
                        console.log(`   Allowed methods: ${allowHeader}`);
                    }
                }
            } catch (error) {
                console.log(`${method}: Error - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

checkAvailableMethods();
