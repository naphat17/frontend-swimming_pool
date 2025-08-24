// Test script for locker price API
const fetch = require('node-fetch');

async function testLockerPriceAPI() {
    console.log('=== Testing Locker Price API ===');
    
    try {
        // Test GET current price
        console.log('\n1. Testing GET current locker price...');
        const getResponse = await fetch('https://backend-l7q9.onrender.com/api/settings/locker_price');
        const getCurrentPrice = await getResponse.json();
        console.log('Current price response:', getCurrentPrice);
        
        // Test PUT update price (requires admin token)
        console.log('\n2. Testing PUT update locker price...');
        console.log('Note: This requires admin authentication');
        console.log('URL: PUT https://backend-l7q9.onrender.com/api/settings/locker_price');
        console.log('Body: { "value": "50" }');
        console.log('Headers: { "Authorization": "Bearer <admin_token>" }');
        
        console.log('\n=== Test completed ===');
        console.log('\nTo test price update:');
        console.log('1. Login as admin to get token');
        console.log('2. Use the token to call PUT /api/settings/locker_price');
        
    } catch (error) {
        console.error('Error testing API:', error.message);
    }
}

testLockerPriceAPI();