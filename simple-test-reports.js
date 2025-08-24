// Simple test for reports API
const https = require('https');
const http = require('http');

// Disable SSL verification for localhost
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testReports() {
    console.log('=== Testing Reports API ===\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing Health API...');
        const healthResponse = await makeRequest('https://backend-l7q9.onrender.com/api/health');
        console.log(`   Status: ${healthResponse.status}`);
        console.log(`   Response: ${healthResponse.data}`);
        
        if (healthResponse.status !== 200) {
            console.log('❌ API server is not running properly');
            return;
        }
        console.log('✅ API server is running\n');
        
        // Test 2: Admin login
        console.log('2. Testing Admin Login...');
        const loginResponse = await makeRequest('https://backend-l7q9.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        
        console.log(`   Status: ${loginResponse.status}`);
        
        if (loginResponse.status !== 200) {
            console.log(`❌ Login failed: ${loginResponse.data}`);
            return;
        }
        
        const loginData = JSON.parse(loginResponse.data);
        const token = loginData.token;
        console.log(`✅ Login successful for: ${loginData.user.email}\n`);
        
        // Test 3: Reports API
        console.log('3. Testing Reports API...');
        const reportsResponse = await makeRequest('https://backend-l7q9.onrender.com/api/admin/reports', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`   Status: ${reportsResponse.status}`);
        
        if (reportsResponse.status !== 200) {
            console.log(`❌ Reports API failed: ${reportsResponse.data}`);
            return;
        }
        
        const reportsData = JSON.parse(reportsResponse.data);
        console.log('✅ Reports API successful\n');
        
        // Display data summary
        console.log('=== Reports Data Summary ===');
        console.log('Usage Stats:', reportsData.usageStats);
        console.log('Membership Stats count:', (reportsData.membershipStats || []).length);
        console.log('Revenue by Channel count:', (reportsData.revenueByChannel || []).length);
        console.log('User Frequency count:', (reportsData.userFrequency || []).length);
        console.log('Monthly Revenue count:', (reportsData.monthlyRevenue || []).length);
        console.log('Annual Subscribers count:', (reportsData.annualSubscribers || []).length);
        
        if (reportsData.membershipStats && reportsData.membershipStats.length > 0) {
            console.log('\nSample Membership Stats:');
            reportsData.membershipStats.slice(0, 3).forEach(item => {
                console.log(`  - ${item.name}: ${item.count} (${item.percentage}%)`);
            });
        }
        
        if (reportsData.revenueByChannel && reportsData.revenueByChannel.length > 0) {
            console.log('\nSample Revenue by Channel:');
            reportsData.revenueByChannel.slice(0, 3).forEach(item => {
                console.log(`  - ${item.channel}: ${item.amount} THB (${item.count} transactions)`);
            });
        }
        
        console.log('\n🎉 All tests passed! Reports API is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testReports();