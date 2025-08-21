# 🏊‍♂️ ระบบจัดการสระว่ายน้ำโรจนากร - คู่มือการติดตั้ง

คู่มือการติดตั้งและใช้งานระบบจัดการสระว่ายน้ำโรจนากร ที่ครอบคลุมทั้ง Frontend (Next.js) และ Backend (Express.js + MySQL)

## 📋 สารบัญ

1. [ความต้องการของระบบ](#ความต้องการของระบบ)
2. [การติดตั้งเบื้องต้น](#การติดตั้งเบื้องต้น)
3. [การตั้งค่าฐานข้อมูล](#การตั้งค่าฐานข้อมูล)
4. [การติดตั้ง Backend API](#การติดตั้ง-backend-api)
5. [การติดตั้ง Frontend](#การติดตั้ง-frontend)
6. [การรันระบบ](#การรันระบบ)
7. [บัญชีทดสอบ](#บัญชีทดสอบ)
8. [การแก้ไขปัญหา](#การแก้ไขปัญหา)
9. [คุณสมบัติของระบบ](#คุณสมบัติของระบบ)

---

## 🖥 ความต้องการของระบบ

### Software Requirements
- **Node.js** v18.0.0 หรือใหม่กว่า
- **npm** v8.0.0 หรือใหม่กว่า
- **MySQL** v8.0 หรือใหม่กว่า
- **XAMPP/WAMP/MAMP** (สำหรับ phpMyAdmin)
- **Git** (สำหรับ clone repository)

### Hardware Requirements
- **RAM**: อย่างน้อย 4GB
- **Storage**: อย่างน้อย 2GB ว่าง
- **CPU**: Intel i3 หรือเทียบเท่า

---

## 🚀 การติดตั้งเบื้องต้น

### 1. ติดตั้ง Node.js
\`\`\`bash
# ตรวจสอบเวอร์ชัน Node.js
node --version

# ตรวจสอบเวอร์ชัน npm
npm --version
\`\`\`

หากยังไม่มี Node.js ให้ดาวน์โหลดจาก: https://nodejs.org/

### 2. ติดตั้ง XAMPP
1. ดาวน์โหลด XAMPP จาก: https://www.apachefriends.org/
2. ติดตั้งและเปิด XAMPP Control Panel
3. เริ่มต้น Apache และ MySQL services

### 3. Clone Repository
\`\`\`bash
# Clone โปรเจค
git clone <repository-url>
cd swimming-pool-system

# หรือดาวน์โหลดและแตกไฟล์ ZIP
\`\`\`

---

## 🗄 การตั้งค่าฐานข้อมูล

### วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)
\`\`\`bash
cd api
npm install
npm run init-db
\`\`\`

### วิธีที่ 2: ใช้ phpMyAdmin
1. เปิด http://localhost/phpmyadmin
2. สร้างฐานข้อมูลใหม่ชื่อ `swimming_pool_db`
3. Import ไฟล์ `api/database/schema.sql`
4. Import ไฟล์ `api/database/sample_data.sql`

### วิธีที่ 3: ใช้ MySQL Command Line
\`\`\`bash
# เข้าสู่ MySQL
mysql -u root -p

# สร้างฐานข้อมูล
CREATE DATABASE swimming_pool_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
mysql -u root -p swimming_pool_db < api/database/schema.sql

# Import sample data
mysql -u root -p swimming_pool_db < api/database/sample_data.sql
\`\`\`

---

## ⚙️ การติดตั้ง Backend API

### 1. ติดตั้ง Dependencies
\`\`\`bash
cd api
npm install
\`\`\`

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์ `api`:

\`\`\`env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (เปลี่ยนในการใช้งานจริง)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=swimming_pool_db
DB_PORT=3306

# CORS
CORS_ORIGIN=http://localhost:3001
\`\`\`

### 3. ทดสอบการเชื่อมต่อ
\`\`\`bash
# ทดสอบ API
npm run dev

# ตรวจสอบ Health Check
curl http://localhost:3001/api/health
\`\`\`

---

## 🎨 การติดตั้ง Frontend

### 1. ติดตั้ง Dependencies
\`\`\`bash
# กลับไปที่ root directory
cd ..
npm install
\`\`\`

### 2. ตั้งค่า Environment Variables (ถ้าจำเป็น)
สร้างไฟล์ `.env.local` ในโฟลเดอร์หลัก:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

### 3. Build และทดสอบ
\`\`\`bash
# Development mode
npm run dev

# Production build (ถ้าต้องการ)
npm run build
npm start
\`\`\`

---

## 🏃‍♂️ การรันระบบ

### การรันแบบ Development

#### Terminal 1: Backend API
\`\`\`bash
cd api
npm run dev
\`\`\`
✅ API จะรันที่: http://localhost:3001

#### Terminal 2: Frontend
\`\`\`bash
npm run dev
\`\`\`
✅ Frontend จะรันที่: http://localhost:3001

### การรันแบบ Production
\`\`\`bash
# Build frontend
npm run build

# Start frontend
npm start

# Start backend (terminal ใหม่)
cd api
npm start
\`\`\`

---

## 👥 บัญชีทดสอบ

หลังจากรัน `npm run init-db` แล้ว สามารถใช้บัญชีเหล่านี้ได้:

### 👨‍💼 Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **สิทธิ์**: จัดการระบบทั้งหมด

### 👤 User Accounts
- **Username**: `user1`
- **Password**: `user123`
- **สิทธิ์**: ใช้งานทั่วไป

---

## 🔗 URLs สำคัญ

| Service | URL | คำอธิบาย |
|---------|-----|----------|
| Frontend | http://localhost:3001 | หน้าเว็บหลัก |
| Backend API | http://localhost:3001 | API Server |
| Health Check | http://localhost:3001/api/health | ตรวจสอบสถานะ API |
| phpMyAdmin | http://localhost/phpmyadmin | จัดการฐานข้อมูล |

---

## 🛠 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. Port ถูกใช้งานแล้ว
\`\`\`bash
# ตรวจสอบ process ที่ใช้ port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Mac/Linux)
kill -9 <PID>
\`\`\`

#### 2. MySQL Connection Error
\`\`\`bash
# ตรวจสอบ MySQL service
# Windows (XAMPP)
- เปิด XAMPP Control Panel
- Start MySQL service

# ตรวจสอบการเชื่อมต่อ
mysql -u root -p -h localhost
\`\`\`

#### 3. Database ไม่มีข้อมูล
\`\`\`bash
cd api
npm run init-db
\`\`\`

#### 4. JWT Token Error
- ตรวจสอบ `JWT_SECRET` ในไฟล์ `.env`
- ลบ token ใน localStorage และ login ใหม่

#### 5. CORS Error
- ตรวจสอบ `CORS_ORIGIN` ในไฟล์ `.env`
- ตรวจสอบว่า Frontend รันที่ port 3000

### การ Debug

#### Backend Logs
\`\`\`bash
cd api
npm run dev
# ดู console logs สำหรับ errors
\`\`\`

#### Frontend Logs
\`\`\`bash
npm run dev
# เปิด Browser Developer Tools (F12)
# ดู Console tab สำหรับ errors
\`\`\`

#### Database Logs
- เปิด phpMyAdmin
- ไปที่ tab "Status" เพื่อดู MySQL logs

---

## 🎯 คุณสมบัติของระบบ

### 👤 สำหรับผู้ใช้ทั่วไป
- ✅ สมัครสมาชิก/เข้าสู่ระบบ
- ✅ จัดการข้อมูลส่วนตัว
- ✅ ซื้อสมาชิกภาพ (รายปี/เป็นครั้ง)
- ✅ จองการใช้งานสระ
- ✅ ดูตารางเวลาสระ
- ✅ ดูประวัติการชำระเงิน
- ✅ แดชบอร์ดส่วนตัว

### 👨‍💼 สำหรับผู้ดูแลระบบ
- ✅ จัดการสมาชิก
- ✅ จัดการการจอง
- ✅ จัดการสระและตารางเวลา
- ✅ จัดการการชำระเงิน
- ✅ ตั้งค่าระบบ
- ✅ แดชบอร์ดผู้ดูแล
- ✅ รายงานและสถิติ

### 🔐 ความปลอดภัย
- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Role-based Access Control
- ✅ SQL Injection Protection
- ✅ CORS Configuration

---

## 📊 โครงสร้างฐานข้อมูล

### ตารางหลัก
- `users` - ข้อมูลผู้ใช้
- `membership_types` - ประเภทสมาชิก
- `memberships` - สมาชิกภาพของผู้ใช้
- `pool_resources` - ข้อมูลสระว่ายน้ำ
- `pool_schedules` - ตารางเวลาสระ
- `reservations` - การจองใช้งาน
- `payments` - ข้อมูลการชำระเงิน
- `notifications` - การแจ้งเตือน
- `system_settings` - การตั้งค่าระบบ

---

## 🔄 การอัปเดตระบบ

### อัปเดต Dependencies
\`\`\`bash
# Frontend
npm update

# Backend
cd api
npm update
\`\`\`

### อัปเดตฐานข้อมูล
\`\`\`bash
cd api
npm run init-db
\`\`\`

### Backup ฐานข้อมูล
\`\`\`bash
# Export database
mysqldump -u root -p swimming_pool_db > backup.sql

# Import database
mysql -u root -p swimming_pool_db < backup.sql
\`\`\`

---

## 📞 การติดต่อและสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ [การแก้ไขปัญหา](#การแก้ไขปัญหา) ก่อน
2. ดู logs ใน console
3. ตรวจสอบการตั้งค่า environment variables
4. ทดสอบการเชื่อมต่อฐานข้อมูล

---

## ✅ Checklist การติดตั้ง

- [ ] ติดตั้ง Node.js และ npm
- [ ] ติดตั้ง XAMPP/MySQL
- [ ] Clone/Download โปรเจค
- [ ] ติดตั้ง dependencies (Frontend & Backend)
- [ ] ตั้งค่าไฟล์ .env
- [ ] สร้างฐานข้อมูล MySQL
- [ ] รัน init-database script
- [ ] ทดสอบ Backend API
- [ ] ทดสอบ Frontend
- [ ] ทดสอบ login ด้วยบัญชีตัวอย่าง

---

## 🎉 เสร็จสิ้น!

ระบบจัดการสระว่ายน้ำโรจนากรพร้อมใช้งานแล้ว! 🏊‍♂️

**Happy Swimming!** 🌊✨
