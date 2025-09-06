// Debug script สำหรับตรวจสอบปัญหา 403 Forbidden เมื่อเข้าถึง /api/admin/pools
// สาเหตุที่เป็นไปได้และวิธีแก้ไข

const jwt = require('jsonwebtoken');
const db = require('./api/config/database');

// ตรวจสอบ JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
console.log('🔑 JWT Secret:', JWT_SECRET);

async function debugAdminAccess() {
    try {
        console.log('\n=== ตรวจสอบปัญหา 403 Forbidden สำหรับ /api/admin/pools ===\n');
        
        // 1. ตรวจสอบว่ามี admin user อยู่ในระบบหรือไม่
        console.log('1. ตรวจสอบ Admin Users ในระบบ:');
        const [adminUsers] = await db.execute(
            "SELECT id, username, email, role, status FROM users WHERE role = 'admin'"
        );
        
        if (adminUsers.length === 0) {
            console.log('❌ ไม่พบ admin user ในระบบ');
            console.log('💡 วิธีแก้ไข: รัน script สร้าง admin');
            console.log('   cd api && node scripts/create-admin.js');
            return;
        }
        
        console.log('✅ พบ Admin Users:');
        adminUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - Status: ${user.status}`);
        });
        
        // 2. ทดสอบการสร้าง token สำหรับ admin
        console.log('\n2. ทดสอบการสร้าง JWT Token สำหรับ Admin:');
        const adminUser = adminUsers[0];
        const testToken = jwt.sign(
            {
                id: adminUser.id,
                username: adminUser.username,
                role: adminUser.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('✅ Token สร้างสำเร็จ:');
        console.log(`   Token: ${testToken.substring(0, 50)}...`);
        
        // 3. ทดสอบการ verify token
        console.log('\n3. ทดสอบการ Verify Token:');
        try {
            const decoded = jwt.verify(testToken, JWT_SECRET);
            console.log('✅ Token verify สำเร็จ:');
            console.log(`   User ID: ${decoded.id}`);
            console.log(`   Username: ${decoded.username}`);
            console.log(`   Role: ${decoded.role}`);
            
            if (decoded.role !== 'admin') {
                console.log('❌ Role ไม่ใช่ admin');
            } else {
                console.log('✅ Role เป็น admin ถูกต้อง');
            }
        } catch (verifyError) {
            console.log('❌ Token verify ล้มเหลว:', verifyError.message);
        }
        
        // 4. แสดงวิธีการใช้งานที่ถูกต้อง
        console.log('\n=== วิธีการใช้งานที่ถูกต้อง ===');
        console.log('1. Login ด้วย admin credentials:');
        console.log('   POST https://backend-l7q9.onrender.com/api/auth/login');
        console.log('   Body: { "username": "admin", "password": "admin123" }');
        console.log('');
        console.log('2. ใช้ token ที่ได้จาก login response:');
        console.log('   GET https://backend-l7q9.onrender.com/api/admin/pools');
        console.log('   Headers: { "Authorization": "Bearer YOUR_TOKEN_HERE" }');
        console.log('');
        console.log('3. ตรวจสอบ token ใน browser:');
        console.log('   - เปิด Developer Tools (F12)');
        console.log('   - ไปที่ Application/Storage > Local Storage');
        console.log('   - ตรวจสอบว่ามี token อยู่หรือไม่');
        console.log('   - ตรวจสอบว่า token ยังไม่หมดอายุ');
        
        console.log('\n=== สาเหตุที่เป็นไปได้ของ 403 Forbidden ===');
        console.log('1. ไม่ได้ส่ง Authorization header');
        console.log('2. Token หมดอายุ (24 ชั่วโมง)');
        console.log('3. Token ไม่ถูกต้อง');
        console.log('4. User role ไม่ใช่ admin');
        console.log('5. JWT_SECRET ไม่ตรงกัน');
        
        console.log('\n=== ตัวอย่างการทดสอบด้วย curl ===');
        console.log('# 1. Login');
        console.log('curl -X POST https://backend-l7q9.onrender.com/api/auth/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{ "username": "admin", "password": "admin123" }\'');
        console.log('');
        console.log('# 2. เข้าถึง admin pools (แทนที่ YOUR_TOKEN ด้วย token จากขั้นตอนที่ 1)');
        console.log('curl -X GET https://backend-l7q9.onrender.com/api/admin/pools \\');
        console.log('  -H "Authorization: Bearer YOUR_TOKEN"');
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    } finally {
        process.exit(0);
    }
}

// เรียกใช้ function
debugAdminAccess();