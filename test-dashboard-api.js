const fetch = require('node-fetch');

async function testDashboardAPI() {
    console.log('=== ทดสอบ API Dashboard ===\n');
    
    try {
        // ทดสอบการเข้าสู่ระบบ admin
        console.log('1. ทดสอบการเข้าสู่ระบบ admin...');
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
            console.log('❌ ไม่สามารถเข้าสู่ระบบได้:', loginResponse.status);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ เข้าสู่ระบบสำเร็จ');
        
        const token = loginData.token;
        
        // ทดสอบ API dashboard
        console.log('\n2. ทดสอบ API dashboard...');
        const dashboardResponse = await fetch('https://backend-l7q9.onrender.com/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!dashboardResponse.ok) {
            console.log('❌ ไม่สามารถดึงข้อมูล dashboard ได้:', dashboardResponse.status);
            const errorText = await dashboardResponse.text();
            console.log('Error:', errorText);
            return;
        }
        
        const dashboardData = await dashboardResponse.json();
        console.log('✅ ดึงข้อมูล dashboard สำเร็จ');
        
        // แสดงข้อมูลสถิติ
        console.log('\n=== ข้อมูลสถิติ Dashboard ===');
        const stats = dashboardData.stats;
        
        console.log(`📊 สมาชิกทั้งหมด: ${stats.total_members || 0}`);
        console.log(`👥 สมาชิกที่ใช้งาน: ${stats.active_members || 0}`);
        console.log(`📅 การจองวันนี้: ${stats.today_reservations || 0}`);
        console.log(`💰 รายได้วันนี้: ฿${(stats.today_revenue || 0).toLocaleString()}`);
        console.log(`💰 รายได้เดือนนี้: ฿${(stats.monthly_revenue || 0).toLocaleString()}`);
        console.log(`💰 รายได้รวมทั้งหมด (รวมค่าสมัครรายปี): ฿${(stats.total_revenue || 0).toLocaleString()}`);
        console.log(`🏠 ตู้เก็บของว่าง: ${stats.available_lockers || 0}/${stats.total_lockers || 0}`);
        
        // ตรวจสอบว่ามี total_revenue หรือไม่
        if (stats.total_revenue !== undefined) {
            console.log('\n✅ total_revenue ถูกส่งมาจาก API แล้ว');
            if (stats.total_revenue > 0) {
                console.log('✅ มีข้อมูลรายได้รวมในระบบ');
            } else {
                console.log('⚠️  ยังไม่มีข้อมูลรายได้ในระบบ (total_revenue = 0)');
            }
        } else {
            console.log('❌ total_revenue ไม่ถูกส่งมาจาก API');
        }
        
        // แสดงข้อมูลกิจกรรมล่าสุด
        console.log('\n=== กิจกรรมล่าสุด ===');
        const activities = dashboardData.recent_activities || [];
        if (activities.length > 0) {
            activities.slice(0, 3).forEach((activity, index) => {
                console.log(`${index + 1}. ${activity.description} - ${activity.user_name || 'ไม่ระบุ'}`);
            });
        } else {
            console.log('ไม่มีกิจกรรมล่าสุด');
        }
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }
}

// เรียกใช้ฟังก์ชันทดสอบ
testDashboardAPI();