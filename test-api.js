const fetch = require('node-fetch');

async function testAPI() {
    console.log('Testing API endpoints...');
    
    try {
        // Test health endpoint
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await fetch('https://backend-swimming-pool.onrender.com/api/health');
        console.log('Health status:', healthResponse.status);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('Health data:', healthData);
        }
        
        // Test admin login
        console.log('\n2. Testing admin login...');
        const loginResponse = await fetch('https://backend-swimming-pool.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        console.log('Login status:', loginResponse.status);
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('Login successful, user role:', loginData.user?.role);
            
            if (loginData.token) {
                // Test admin payments endpoint
                console.log('\n3. Testing admin payments endpoint...');
                const paymentsResponse = await fetch('https://backend-swimming-pool.onrender.com/api/admin/payments', {
                    headers: { 'Authorization': `Bearer ${loginData.token}` }
                });
                
                console.log('Payments status:', paymentsResponse.status);
                if (paymentsResponse.ok) {
                    const paymentsData = await paymentsResponse.json();
                    console.log('Payments data length:', paymentsData.payments?.length || 0);
                } else {
                    const errorText = await paymentsResponse.text();
                    console.log('Payments error:', errorText);
                }
            }
        } else {
            const errorText = await loginResponse.text();
            console.log('Login error:', errorText);
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testAPI();