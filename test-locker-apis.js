const axios = require('axios');

// Test token (you may need to get a real token)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzM2MzM4NzQzLCJleHAiOjE3MzYzNDIzNDN9.example'; // Replace with actual token

async function testAPIs() {
    const baseURL = 'https://backend-l7q9.onrender.com';
    
    console.log('=== Testing Locker APIs ===\n');
    
    // Test 1: Get user locker reservations
    try {
        console.log('1. Testing /api/lockers/reservations/user');
        const response1 = await axios.get(`${baseURL}/api/lockers/reservations/user`, {
            headers: {
                'Authorization': `Bearer ${testToken}`
            }
        });
        console.log('✅ Success:', response1.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
    
    console.log('\n');
    
    // Test 2: Get available lockers
    try {
        console.log('2. Testing /api/lockers/available');
        const response2 = await axios.get(`${baseURL}/api/lockers/available`);
        console.log('✅ Success:', response2.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
    
    console.log('\n');
    
    // Test 3: Get bank account number
    try {
        console.log('3. Testing /api/settings/bank_account_number');
        const response3 = await axios.get(`${baseURL}/api/settings/bank_account_number`);
        console.log('✅ Success:', response3.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
    
    console.log('\n');
    
    // Test 4: Test database connection directly
    try {
        console.log('4. Testing database connection');
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'swimming_pool_db'
        });
        
        // Test lockers table
        const [lockers] = await connection.execute('SELECT COUNT(*) as count FROM lockers');
        console.log('✅ Lockers table count:', lockers[0].count);
        
        // Test locker_reservations table
        const [reservations] = await connection.execute('SELECT COUNT(*) as count FROM locker_reservations');
        console.log('✅ Locker reservations table count:', reservations[0].count);
        
        // Test system_settings table
        const [settings] = await connection.execute('SELECT COUNT(*) as count FROM system_settings');
        console.log('✅ System settings table count:', settings[0].count);
        
        await connection.end();
        
    } catch (error) {
        console.log('❌ Database Error:', error.message);
    }
}

testAPIs();