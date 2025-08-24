const fetch = require('node-fetch');

async function testReportsAPI() {
    try {
        console.log('Testing Reports API...');
        
        // First test if API server is running
        const healthResponse = await fetch('https://backend-l7q9.onrender.com/api/health');
        if (!healthResponse.ok) {
            console.error('API server is not running on port 3001');
            return;
        }
        console.log('✓ API server is running');
        
        // Test admin login to get token
        const loginResponse = await fetch('https://backend-l7q9.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            console.error('Failed to login as admin');
            const errorText = await loginResponse.text();
            console.error('Login error:', errorText);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✓ Admin login successful');
        
        // Test reports endpoint
        const reportsResponse = await fetch('https://backend-l7q9.onrender.com/api/admin/reports', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!reportsResponse.ok) {
            console.error('Reports API failed with status:', reportsResponse.status);
            const errorText = await reportsResponse.text();
            console.error('Error response:', errorText);
            return;
        }
        
        const reportsData = await reportsResponse.json();
        console.log('✓ Reports API successful');
        console.log('Reports data structure:');
        console.log('- usageStats:', Object.keys(reportsData.usageStats || {}));
        console.log('- membershipStats count:', (reportsData.membershipStats || []).length);
        console.log('- revenueByChannel count:', (reportsData.revenueByChannel || []).length);
        console.log('- userFrequency count:', (reportsData.userFrequency || []).length);
        console.log('- monthlyRevenue count:', (reportsData.monthlyRevenue || []).length);
        console.log('- annualSubscribers count:', (reportsData.annualSubscribers || []).length);
        
        console.log('\nSample data:');
        console.log('Usage Stats:', reportsData.usageStats);
        
    } catch (error) {
        console.error('Error testing reports API:', error.message);
    }
}

testReportsAPI();