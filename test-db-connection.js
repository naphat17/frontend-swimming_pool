const mysql = require('mysql2/promise');
const axios = require('axios');

async function testDatabaseAndAPI() {
    console.log('=== Testing Database Connection ===\n');
    
    try {
        // Test database connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'swimming_pool_db'
        });
        
        console.log('✅ Database connection successful');
        
        // Check if tables exist
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('📋 Available tables:', tableNames);
        
        // Check specific tables
        const requiredTables = ['lockers', 'locker_reservations', 'system_settings', 'users'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length > 0) {
            console.log('❌ Missing tables:', missingTables);
        } else {
            console.log('✅ All required tables exist');
            
            // Test each table
            for (const table of requiredTables) {
                try {
                    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                    console.log(`📊 ${table}: ${rows[0].count} records`);
                } catch (err) {
                    console.log(`❌ Error querying ${table}:`, err.message);
                }
            }
        }
        
        await connection.end();
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return;
    }
    
    console.log('\n=== Testing API Server ===\n');
    
    try {
        // Test health endpoint
        const healthResponse = await axios.get('https://backend-l7q9.onrender.com/api/health');
        console.log('✅ API Server is running:', healthResponse.data);
        
        // Test endpoints without authentication
        try {
            const availableResponse = await axios.get('https://backend-l7q9.onrender.com/api/lockers/available');
            console.log('✅ /api/lockers/available works:', availableResponse.data);
        } catch (err) {
            console.log('❌ /api/lockers/available error:', err.response?.status, err.response?.data || err.message);
        }
        
        try {
            const settingsResponse = await axios.get('https://backend-l7q9.onrender.com/api/settings/bank_account_number');
            console.log('✅ /api/settings/bank_account_number works:', settingsResponse.data);
        } catch (err) {
            console.log('❌ /api/settings/bank_account_number error:', err.response?.status, err.response?.data || err.message);
        }
        
    } catch (error) {
        console.log('❌ API Server connection failed:', error.message);
        console.log('💡 Make sure the API server is running with: cd api && npm start');
    }
}

testDatabaseAndAPI();