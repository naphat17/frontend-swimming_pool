"use client" // ระบุว่าเป็น Client Component สำหรับ Next.js

import { useEffect, useState } from "react" // นำเข้า hooks สำหรับจัดการ state และ side effects
import { useAuth } from "@/components/auth-provider" // นำเข้า hook สำหรับจัดการการยืนยันตัวตน
import UserLayout from "@/components/user-layout" // นำเข้า layout สำหรับผู้ใช้
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // นำเข้า components สำหรับการ์ด
import { Badge } from "@/components/ui/badge" // นำเข้า component สำหรับแสดงป้ายสถานะ
import { Button } from "@/components/ui/button" // นำเข้า component สำหรับปุ่ม
import { Calendar, Users, AlertCircle, CreditCard, Waves, Shield, Bell } from "lucide-react" // นำเข้าไอคอนต่างๆ
import Link from "next/link" // นำเข้า component สำหรับลิงก์ใน Next.js

interface DashboardData { // กำหนดโครงสร้างข้อมูลสำหรับ dashboard
  membership: { // ข้อมูลสมาชิกภาพ
    type: string // ประเภทสมาชิก
    expires_at: string // วันหมดอายุ
    status: string // สถานะสมาชิก
    user_category?: string // หมวดหมู่ผู้ใช้ (ไม่บังคับ)
    pay_per_session_price?: number // ราคาต่อครั้ง (ไม่บังคับ)
    annual_price?: number // ราคารายปี (ไม่บังคับ)
    membership_type_id?: number // รหัสประเภทสมาชิก (ไม่บังคับ)
  } | null // อาจเป็น null ถ้าไม่มีสมาชิกภาพ
  upcoming_reservations: Array<{ // รายการจองที่จะมาถึง
    id: number // รหัสการจอง
    reservation_date: string // วันที่จอง
    start_time: string // เวลาเริ่ม
    end_time: string // เวลาสิ้นสุด
    pool_name: string // ชื่อสระว่ายน้ำ
    status: string // สถานะการจอง
  }>
  notifications: Array<{ // รายการการแจ้งเตือน
    id: number // รหัสการแจ้งเตือน
    title: string // หัวข้อ
    message: string // ข้อความ
    created_at: string // วันที่สร้าง
    is_read: boolean // สถานะการอ่าน
  }>
  usage_stats: { // สถิติการใช้งาน
    total_reservations: number // จำนวนการจองทั้งหมด
    this_month_reservations: number // จำนวนการจองเดือนนี้
  }
}

export default function DashboardPage() { // ฟังก์ชันหลักของหน้า Dashboard
  const { user } = useAuth() // ดึงข้อมูลผู้ใช้จาก context
  const [data, setData] = useState<DashboardData | null>(null) // state สำหรับเก็บข้อมูล dashboard
  const [loading, setLoading] = useState(true) // state สำหรับสถานะการโหลด

  useEffect(() => { // Hook สำหรับดึงข้อมูลเมื่อ component โหลด
    const fetchDashboard = async () => { // ฟังก์ชันสำหรับดึงข้อมูล dashboard
      try { // เริ่มต้น try-catch block
        const token = localStorage.getItem("token") // ดึง token จาก localStorage
        const response = await fetch("https://backend-l7q9.onrender.com/api/user/dashboard", { // เรียก API
          headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
        })

        if (response.ok) { // ตรวจสอบว่า response สำเร็จ
          const dashboardData = await response.json() // แปลง response เป็น JSON
          setData(dashboardData) // อัพเดท state ด้วยข้อมูลที่ได้
        }
      } catch (error) { // จับ error ที่เกิดขึ้น
        console.error("Error fetching dashboard:", error) // แสดง error ใน console
      } finally { // block ที่จะทำงานเสมอ
        setLoading(false) // ตั้งสถานะการโหลดเป็น false
      }
    }

    fetchDashboard() // เรียกใช้ฟังก์ชันดึงข้อมูล
  }, []) // dependency array ว่าง หมายถึงทำงานครั้งเดียวเมื่อ component mount

  if (loading) { // ตรวจสอบสถานะการโหลด
    return ( // ส่งคืน JSX สำหรับหน้าโหลด
      <UserLayout> {/* Layout หลักสำหรับผู้ใช้ */}
        <div
          className="min-h-screen bg-cover bg-center relative flex items-center justify-center" // คลาส CSS สำหรับพื้นหลังและการจัดตำแหน่ง
          style={{ backgroundImage: "url('/555.png')" }} // ตั้งค่าภาพพื้นหลัง
        >
          <div className="absolute inset-0 bg-black/30" /> {/* overlay สีดำโปร่งใส */}
          <div className="relative z-10 text-center"> {/* container สำหรับเนื้อหา */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div> {/* ไอคอนหมุนแสดงการโหลด */}
            <p className="text-white text-lg">กำลังโหลด...</p> {/* ข้อความแสดงสถานะ */}
          </div>
        </div>
      </UserLayout>
    )
  }

  const getMembershipStatusColor = (status: string) => { // ฟังก์ชันกำหนดสีตามสถานะสมาชิก
    switch (status) { // ตรวจสอบสถานะ
      case "active": // กรณีสถานะใช้งานได้
        return "bg-green-100 text-green-800" // ส่งคืนคลาสสีเขียว
      case "expired": // กรณีสถานะหมดอายุ
        return "bg-red-100 text-red-800" // ส่งคืนคลาสสีแดง
      case "pending": // กรณีสถานะรอดำเนินการ
        return "bg-yellow-100 text-yellow-800" // ส่งคืนคลาสสีเหลือง
      default: // กรณีอื่นๆ
        return "bg-gray-100 text-gray-800" // ส่งคืนคลาสสีเทา
    }
  }

  const getReservationStatusColor = (status: string) => { // ฟังก์ชันกำหนดสีตามสถานะการจอง
    switch (status) { // ตรวจสอบสถานะ
      case "confirmed": // กรณียืนยันแล้ว
        return "bg-green-100 text-green-800" // ส่งคืนคลาสสีเขียว
      case "pending": // กรณีรอยืนยัน
        return "bg-yellow-100 text-yellow-800" // ส่งคืนคลาสสีเหลือง
      case "cancelled": // กรณียกเลิก
        return "bg-red-100 text-red-800" // ส่งคืนคลาสสีแดง
      default: // กรณีอื่นๆ
        return "bg-gray-100 text-gray-800" // ส่งคืนคลาสสีเทา
    }
  }

  return ( // ส่งคืน JSX สำหรับหน้า dashboard
    <UserLayout> {/* Layout หลักสำหรับผู้ใช้ */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative p-6"> {/* container หลักพร้อมพื้นหลัง gradient */}
        {/* Animated background elements */} {/* องค์ประกอบพื้นหลังแบบเคลื่อนไหว */}
        <div className="absolute inset-0 overflow-hidden"> {/* container สำหรับพื้นหลังแบบเคลื่อนไหว */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div> {/* วงกลมเบลอด้านบนขวา */}
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div> {/* วงกลมเบลอด้านล่างซ้าย */}
        </div>
        
        <div className="relative z-10"> {/* container เนื้อหาหลักที่อยู่เหนือพื้นหลัง */}
          {/* Welcome Header Card */} {/* การ์ดส่วนหัวต้อนรับ */}
          <Card className="mb-8 shadow-2xl border-0 bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]"> {/* การ์ดหลักพร้อมเอฟเฟกต์ */}
            <CardContent className="p-8"> {/* เนื้อหาการ์ดพร้อม padding */}
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6"> {/* container แบบ responsive */}
                <div className="relative"> {/* container สำหรับโลโก้ */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div> {/* เอฟเฟกต์เรืองแสงรอบโลโก้ */}
                  <img src="/LOGO.png" alt="Logo" className="relative h-20 w-20 shadow-lg" /> {/* รูปโลโก้ */}
                </div>
                <div className="text-center md:text-left"> {/* container สำหรับข้อความ */}
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2"> {/* หัวข้อหลักพร้อม gradient text */}
                    ยินดีต้อนรับ, {user?.first_name} {user?.last_name} {/* แสดงชื่อผู้ใช้ */}
                  </h1>
                  <p className="text-xl text-gray-600 font-medium">ภาพรวมการใช้งานระบบสระว่ายน้ำโรจนากร</p> {/* คำอธิบายระบบ */}
                  <div className="mt-3 flex items-center justify-center md:justify-start space-x-2"> {/* container สำหรับสถานะบริการ */}
                    <Waves className="h-5 w-5 text-blue-500 animate-bounce" /> {/* ไอคอนคลื่นแบบเคลื่อนไหว */}
                    <span className="text-sm text-blue-600 font-medium">พร้อมให้บริการ 24/7</span> {/* ข้อความสถานะบริการ */}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */} {/* การ์ดแสดงสถิติ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> {/* grid layout สำหรับการ์ดสถิติ */}
            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1"> {/* การ์ดสถานะสมาชิกพร้อมเอฟเฟกต์ hover */}
            <CardContent className="p-8"> {/* เนื้อหาการ์ดพร้อม padding */}
              <div className="flex items-center"> {/* container แนวนอนสำหรับเนื้อหา */}
                <div className="flex-1"> {/* ส่วนข้อความที่ขยายเต็มพื้นที่ */}
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-blue-700 transition-colors">สถานะสมาชิก</p> {/* หัวข้อการ์ด */}
                  <div> {/* container สำหรับ badge */}
                    {data?.membership ? ( // ตรวจสอบว่ามีข้อมูลสมาชิกหรือไม่
                      <Badge className={`text-lg px-4 py-2 shadow-lg ${getMembershipStatusColor(data.membership.status)}`}> {/* badge แสดงสถานะพร้อมสีตามสถานะ */}
                        {data.membership.status === "active" // ตรวจสอบสถานะและแสดงข้อความภาษาไทย
                          ? "ใช้งานได้" // กรณีใช้งานได้
                          : data.membership.status === "expired" // กรณีหมดอายุ
                            ? "หมดอายุ" // ข้อความหมดอายุ
                            : "รอดำเนินการ"} {/* กรณีอื่นๆ */}
                      </Badge>
                    ) : ( // กรณีไม่มีสมาชิกภาพ
                      <Badge variant="outline" className="text-lg px-4 py-2 shadow-lg">ไม่มีสมาชิกภาพ</Badge> // badge สำหรับไม่มีสมาชิกภาพ
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"> {/* container สำหรับไอคอนพร้อมเอฟเฟกต์ */}
                  <CreditCard className="h-8 w-8 text-blue-600 group-hover:text-blue-700" /> {/* ไอคอนบัตรเครดิต */}
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1"> {/* การ์ดจำนวนการจองที่จะมาถึงพร้อมเอฟเฟกต์ hover */}
            <CardContent className="p-8"> {/* เนื้อหาการ์ดพร้อม padding */}
              <div className="flex items-center"> {/* container แนวนอนสำหรับเนื้อหา */}
                <div className="flex-1"> {/* ส่วนข้อความที่ขยายเต็มพื้นที่ */}
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-green-700 transition-colors">การจองที่จะมาถึง</p> {/* หัวข้อการ์ด */}
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{data?.upcoming_reservations?.length || 0}</p> {/* ตัวเลขจำนวนการจองที่จะมาถึงพร้อม gradient text */}
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"> {/* container สำหรับไอคอนพร้อมเอฟเฟกต์ */}
                  <Calendar className="h-8 w-8 text-green-600 group-hover:text-green-700" /> {/* ไอคอนปฏิทิน */}
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1"> {/* การ์ดการใช้งานเดือนนี้พร้อมเอฟเฟกต์ hover */}
            <CardContent className="p-8"> {/* เนื้อหาการ์ดพร้อม padding */}
              <div className="flex items-center"> {/* container แนวนอนสำหรับเนื้อหา */}
                <div className="flex-1"> {/* ส่วนข้อความที่ขยายเต็มพื้นที่ */}
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-purple-700 transition-colors">การใช้งานเดือนนี้</p> {/* หัวข้อการ์ด */}
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{data?.usage_stats?.this_month_reservations || 0}</p> {/* ตัวเลขการใช้งานเดือนนี้พร้อม gradient text */}
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"> {/* container สำหรับไอคอนพร้อมเอฟเฟกต์ */}
                  <Users className="h-8 w-8 text-purple-600 group-hover:text-purple-700" /> {/* ไอคอนผู้ใช้ */}
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-orange-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1"> {/* การ์ดการแจ้งเตือนที่ยังไม่อ่านพร้อมเอฟเฟกต์ hover */}
            <CardContent className="p-8"> {/* เนื้อหาการ์ดพร้อม padding */}
              <div className="flex items-center"> {/* container แนวนอนสำหรับเนื้อหา */}
                <div className="flex-1"> {/* ส่วนข้อความที่ขยายเต็มพื้นที่ */}
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-orange-700 transition-colors">การแจ้งเตือน</p> {/* หัวข้อการ์ด */}
                  <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"> {/* ตัวเลขการแจ้งเตือนที่ยังไม่อ่านพร้อม gradient text */}
                    {data?.notifications?.filter((n) => !n.is_read).length || 0} {/* กรองเฉพาะการแจ้งเตือนที่ยังไม่อ่าน */}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"> {/* container สำหรับไอคอนพร้อมเอฟเฟกต์ */}
                  <Bell className="h-8 w-8 text-orange-600 group-hover:text-orange-700 group-hover:animate-bounce" /> {/* ไอคอนกระดิ่งพร้อมเอฟเฟกต์เด้ง */}
                </div>
              </div>
            </CardContent>
            </Card>
          </div> {/* ปิด grid สำหรับ stats cards */}

          {/* Detailed Sections */} {/* ส่วนรายละเอียด */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> {/* grid layout สำหรับส่วนรายละเอียด */}
            {/* Membership Status */} {/* ส่วนสถานะสมาชิกภาพ */}
            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500"> {/* การ์ดสถานะสมาชิกภาพพร้อมเอฟเฟกต์ */}
              <CardContent className="p-8"> {/* เนื้อหาการ์ดพร้อม padding */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center"> {/* หัวข้อหลักพร้อม gradient text */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl mr-3 shadow-lg"> {/* container สำหรับไอคอนพร้อม gradient background */}
                    <CreditCard className="h-6 w-6 text-white" /> {/* ไอคอนบัตรเครดิต */}
                  </div>
                  สถานะสมาชิกภาพ {/* ข้อความหัวข้อ */}
                </h2>
                {data?.membership ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                      <span className="font-semibold text-gray-700">ประเภทสมาชิก:</span>
                      <span className="text-blue-600 font-bold text-lg">{data.membership.user_category || data.membership.type}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                      <span className="font-semibold text-gray-700">วันหมดอายุ:</span>
                      <span className="text-gray-900 font-medium">
                        {(() => {
                          // คำนวณวันหมดอายุเป็น 365 วันหลังจากวันสมัคร (created_at)
                          if (user?.created_at) {
                            const createdDate = new Date(user.created_at)
                            const expiryDate = new Date(createdDate)
                            expiryDate.setDate(createdDate.getDate() + 365)
                            return expiryDate.toLocaleDateString("th-TH")
                          }
                          try {
                            const dateStr = data.membership.expires_at.toString()
                            let date
                            
                            if (dateStr.includes('T')) {
                              date = new Date(dateStr)
                            } else if (dateStr.includes('-')) {
                              const [year, month, day] = dateStr.split('-')
                              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                            } else {
                              date = new Date(dateStr)
                            }
                            
                            if (isNaN(date.getTime())) {
                              return 'รูปแบบวันที่ไม่ถูกต้อง'
                            }
                            
                            return date.toLocaleDateString("th-TH")
                          } catch (error) {
                            return 'รูปแบบวันที่ไม่ถูกต้อง'
                          }
                        })()} 
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                      <span className="font-semibold text-gray-700">สถานะ:</span>
                      <Badge className={`shadow-lg ${getMembershipStatusColor(data.membership.status)}`}>
                        {data.membership.status === "active"
                          ? "ใช้งานได้"
                          : data.membership.status === "expired"
                            ? "หมดอายุ"
                            : "รอดำเนินการ"}
                      </Badge>
                    </div>
                    {data.membership.status === "expired" && (
                      <div className="mt-6">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                          <Link href="/membership">ต่ออายุสมาชิกภาพ</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <CreditCard className="relative mx-auto h-20 w-20 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-xl mb-6">ยังไม่มีสมาชิกภาพ</p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                      <Link href="/membership">สมัครสมาชิก</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Reservations */}
            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl mr-3 shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  การจองที่จะมาถึง
                </h2>
                {data?.upcoming_reservations && data.upcoming_reservations.length > 0 ? (
                  <div className="space-y-4">
                    {data.upcoming_reservations.slice(0, 3).map((reservation, index) => (
                      <div key={index} className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-l-4 border-green-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800 text-lg">
                              {reservation.pool_name}
                            </p>
                            <p className="text-gray-600 font-medium">
                              {(() => {
                                if (!reservation.reservation_date || reservation.reservation_date === 'null' || reservation.reservation_date.trim() === '') {
                                  return 'ไม่ระบุวันที่'
                                }
                                try {
                                  const dateStr = reservation.reservation_date.toString()
                                  let date
                                  
                                  if (dateStr.includes('T')) {
                                    date = new Date(dateStr)
                                  } else if (dateStr.includes('-')) {
                                    const [year, month, day] = dateStr.split('-')
                                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                  } else {
                                    date = new Date(dateStr)
                                  }
                                  
                                  if (isNaN(date.getTime())) {
                                    return 'รูปแบบวันที่ไม่ถูกต้อง'
                                  }
                                  
                                  return date.toLocaleDateString("th-TH")
                                } catch (error) {
                                  return 'รูปแบบวันที่ไม่ถูกต้อง'
                                }
                              })()} {reservation.start_time} - {reservation.end_time}
                            </p>
                          </div>
                          <Badge className={`shadow-lg ${getReservationStatusColor(reservation.status)}`}>
                            {reservation.status === "confirmed"
                              ? "ยืนยันแล้ว"
                              : reservation.status === "pending"
                                ? "รอยืนยัน"
                                : "ยกเลิก"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {data.upcoming_reservations.length > 3 && (
                      <p className="text-center text-gray-500 mt-6 font-medium">
                        และอีก {data.upcoming_reservations.length - 3} การจอง
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <Calendar className="relative mx-auto h-20 w-20 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-xl mb-6">ไม่มีการจองที่จะมาถึง</p>
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                      <Link href="/reservations">จองเลย</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Notifications */}
          {data?.notifications && data.notifications.length > 0 && (
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/95 to-orange-50/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">การแจ้งเตือนล่าสุด</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-4">
                {data.notifications.slice(0, 5).map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${!notification.is_read ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-400" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xl font-semibold text-gray-800">{notification.title}</p>
                          <p className="text-lg text-gray-600 mt-2">{notification.message}</p>
                          <p className="text-base text-gray-500 mt-3">
                            {(() => {
                              if (!notification.created_at || notification.created_at === 'null' || notification.created_at.trim() === '') {
                                return 'ไม่ระบุวันที่'
                              }
                              try {
                                const dateStr = notification.created_at.toString()
                                let date
                                
                                if (dateStr.includes('T')) {
                                  date = new Date(dateStr)
                                } else if (dateStr.includes('-')) {
                                  const [year, month, day] = dateStr.split('-')
                                  date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                } else {
                                  date = new Date(dateStr)
                                }
                                
                                if (isNaN(date.getTime())) {
                                  return 'รูปแบบวันที่ไม่ถูกต้อง'
                                }
                                
                                return date.toLocaleDateString("th-TH")
                              } catch (error) {
                                return 'รูปแบบวันที่ไม่ถูกต้อง'
                              }
                            })()}
                          </p>
                        </div>
                        {!notification.is_read && <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg animate-pulse"></div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
