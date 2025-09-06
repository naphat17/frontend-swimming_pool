"use client" // บอกให้ Next.js รู้ว่าเป็น Client Component ที่ทำงานในฝั่ง browser

import type React from "react" // นำเข้า type ของ React
import { useEffect, useState } from "react" // นำเข้า hooks สำหรับจัดการ state และ side effects
import { useAuth } from "@/components/auth-provider" // นำเข้า hook สำหรับจัดการการยืนยันตัวตน
import { useRouter } from "next/navigation" // นำเข้า router สำหรับการนำทาง
import AdminLayout from "@/components/admin-layout" // นำเข้า layout สำหรับหน้าผู้ดูแลระบบ
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // นำเข้า components สำหรับแสดงการ์ด
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // นำเข้า components สำหรับแสดงแท็บ
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts" // นำเข้า components สำหรับแสดงกราฟ
import { TrendingUp, Users, CreditCard, Activity, BarChart3 } from "lucide-react" // นำเข้าไอคอนต่างๆ

// Interface สำหรับกำหนดโครงสร้างข้อมูลรายงาน
interface ReportData {
  usageStats: { // สถิติการใช้งานโดยรวม
    totalReservations: number // จำนวนการจองทั้งหมด
    totalMembers: number // จำนวนสมาชิกทั้งหมด
    totalRevenue: number // รายได้รวมทั้งหมด
    activeUsers: number // จำนวนผู้ใช้งานที่ใช้งานอยู่
  }
  membershipStats: { // สถิติสมาชิกตามประเภท
    name: string // ชื่อประเภทสมาชิก
    count: number // จำนวนสมาชิก
    percentage: number // เปอร์เซ็นต์
  }[]
  revenueByChannel: { // รายได้จากช่องทางต่างๆ
    channel: string // ชื่อช่องทาง
    amount: number // จำนวนเงิน
    count: number // จำนวนครั้ง
  }[]
  userFrequency: { // ความถี่การใช้งานของผู้ใช้
    userName: string // ชื่อผู้ใช้
    frequency: number // ความถี่การใช้งาน
    lastVisit: string // วันที่เข้าใช้งานล่าสุด
  }[]
  monthlyRevenue: { // รายได้รายเดือน
    month: string // เดือน
    revenue: number // รายได้
  }[]
  annualSubscribers: { // ข้อมูลผู้สมัครรายปี
    year: number // ปี
    subscriberCount: number // จำนวนผู้สมัคร
    revenue: number // รายได้
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'] // สีสำหรับแสดงในกราฟ

// Component หลักสำหรับหน้ารายงานของผู้ดูแลระบบ
export default function AdminReportsPage() {
  const { user } = useAuth() // ดึงข้อมูลผู้ใช้ที่เข้าสู่ระบบ
  const router = useRouter() // ใช้สำหรับการนำทาง
  // State สำหรับเก็บข้อมูลรายงาน พร้อมค่าเริ่มต้น
  const [reportData, setReportData] = useState<ReportData>({
    usageStats: {
      totalReservations: 0,
      totalMembers: 0,
      totalRevenue: 0,
      activeUsers: 0
    },
    membershipStats: [],
    revenueByChannel: [],
    userFrequency: [],
    monthlyRevenue: [],
    annualSubscribers: []
  })
  const [loading, setLoading] = useState(true) // State สำหรับแสดงสถานะการโหลด
  const [error, setError] = useState<string | null>(null) // State สำหรับเก็บข้อความ error

  // useEffect สำหรับตรวจสอบสิทธิ์และโหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    if (user && user.role !== "admin") { // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
      router.push("/dashboard") // ถ้าไม่ใช่ admin ให้ redirect ไปหน้า dashboard
      return
    }

    fetchReportData() // เรียกฟังก์ชันโหลดข้อมูลรายงาน
  }, [user, router])

  // ฟังก์ชันสำหรับดึงข้อมูลรายงานจาก API
  const fetchReportData = async () => {
    try {
      setError(null) // รีเซ็ต error state
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      console.log("Fetching reports with token:", token ? "Present" : "Missing")
      
      if (!token) { // ตรวจสอบว่ามี token หรือไม่
        setError("ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่")
        return
      }
      
      // เรียก API เพื่อดึงข้อมูลรายงาน
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })

      console.log("Reports API response status:", response.status)
      
      if (response.ok) { // ถ้า response สำเร็จ
        const data = await response.json() // แปลง response เป็น JSON
        console.log("Reports data received:", data)
        setReportData(data) // อัพเดท state ด้วยข้อมูลที่ได้
      } else { // ถ้า response ไม่สำเร็จ
        const errorText = await response.text()
        console.error("Reports API error:", response.status, errorText)
        
        // จัดการ error ตาม status code
        if (response.status === 401) {
          setError("ไม่มีสิทธิ์เข้าถึงข้อมูลรายงาน กรุณาเข้าสู่ระบบใหม่")
        } else if (response.status === 500) {
          setError("เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง")
        } else {
          setError(`เกิดข้อผิดพลาด: ${response.status} - ${errorText}`)
        }
      }
    } catch (error) { // จัดการ error ที่เกิดจากการเชื่อมต่อ
      console.error("Error fetching report data:", error)
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต")
    } finally {
      setLoading(false) // ปิดสถานะ loading เมื่อเสร็จสิ้น
    }
  }

  // แสดง loading spinner ขณะโหลดข้อมูล
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // แสดงหน้า error พร้อมปุ่มลองใหม่
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ เกิดข้อผิดพลาด</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => { // ฟังก์ชันสำหรับลองโหลดข้อมูลใหม่
                setError(null)
                setLoading(true)
                fetchReportData()
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ตรวจสอบว่ามีข้อมูลรายงานหรือไม่ เพื่อแสดง UI ที่เหมาะสม
  const hasData = reportData.usageStats.totalReservations > 0 || 
                  reportData.usageStats.totalMembers > 0 || 
                  reportData.usageStats.totalRevenue > 0 || 
                  reportData.membershipStats.length > 0 ||
                  reportData.revenueByChannel.length > 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header - ส่วนหัวของหน้ารายงาน */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8" /> {/* ไอคอนกราฟ */}
            <div>
              <h1 className="text-3xl font-bold">รายงานและสถิติ</h1>
              <p className="text-blue-100 mt-1">ข้อมูลสถิติการใช้งานและรายงานของระบบ</p>
            </div>
          </div>
        </div>

        {/* แสดงข้อความเมื่อไม่มีข้อมูล */}
        {!hasData && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">📊 ยังไม่มีข้อมูลรายงาน</div>
            <p className="text-gray-400 mb-4">
              ข้อมูลรายงานจะแสดงเมื่อมีการจอง สมาชิก หรือการชำระเงินในระบบ
            </p>
            <button 
              onClick={() => { // ปุ่มรีเฟรชข้อมูล
                setLoading(true)
                fetchReportData()
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              รีเฟรชข้อมูล
            </button>
          </div>
        )}

        {hasData && (
          <>
            {/* Overview Cards - การ์ดแสดงสถิติโดยรวม */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* การ์ดแสดงจำนวนการจองทั้งหมด */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การจองทั้งหมด</CardTitle>
              <Activity className="h-4 w-4" /> {/* ไอคอนกิจกรรม */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.usageStats.totalReservations?.toLocaleString() || '0'}</div>
              <p className="text-xs text-blue-100">รายการจองทั้งหมด</p>
            </CardContent>
          </Card>

          {/* การ์ดแสดงจำนวนสมาชิกทั้งหมด */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สมาชิกทั้งหมด</CardTitle>
              <Users className="h-4 w-4" /> {/* ไอคอนผู้ใช้ */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.usageStats.totalMembers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-green-100">สมาชิกที่ลงทะเบียน</p>
            </CardContent>
          </Card>

          {/* การ์ดแสดงรายได้รวม */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
              <CreditCard className="h-4 w-4" /> {/* ไอคอนบัตรเครดิต */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{reportData.usageStats.totalRevenue?.toLocaleString() || '0'}</div>
              <p className="text-xs text-purple-100">รายได้ทั้งหมด</p>
            </CardContent>
          </Card>

          {/* การ์ดแสดงจำนวนผู้ใช้งานที่ใช้งาน */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้งานที่ใช้งาน</CardTitle>
              <TrendingUp className="h-4 w-4" /> {/* ไอคอนแนวโน้มขาขึ้น */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.usageStats.activeUsers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-orange-100">ผู้ใช้งานในเดือนนี้</p>
            </CardContent>
          </Card>
        </div>

            {/* Charts - ส่วนแสดงกราฟต่างๆ */}
            <Tabs defaultValue="membership" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5"> {/* แท็บสำหรับเปลี่ยนกราฟ */}
            <TabsTrigger value="membership">สมาชิกตามประเภท</TabsTrigger>
            <TabsTrigger value="revenue">รายได้ตามช่องทาง</TabsTrigger>
            <TabsTrigger value="frequency">ความถี่การใช้งาน</TabsTrigger>
            <TabsTrigger value="monthly">รายได้รายเดือน</TabsTrigger>
            <TabsTrigger value="annual">ผู้สมัครรายปี</TabsTrigger>
          </TabsList>

          {/* แท็บแสดงกราฟวงกลมสมาชิกตามประเภท */}
          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>จำนวนสมาชิกในแต่ละประเภท</CardTitle>
                <CardDescription>แสดงการกระจายของสมาชิกตามประเภทสมาชิก</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}> 
                  <PieChart> {/* กราฟวงกลม */}
                    <Pie
                      data={reportData.membershipStats || []} // ข้อมูลสมาชิกตามประเภท
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`} // แสดง label พร้อมเปอร์เซ็นต์
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {/* กำหนดสีให้แต่ละส่วนของกราฟ */}
                      {reportData.membershipStats?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )) || []}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'จำนวนสมาชิก']} /> {/* แสดง tooltip เมื่อ hover */}
                    <Legend /> {/* แสดงคำอธิบายสี */}
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* แท็บแสดงกราฟแท่งรายได้ตามช่องทาง */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>รายได้จากการชำระเงินในแต่ละช่องทาง</CardTitle>
                <CardDescription>เปรียบเทียบรายได้จากช่องทางการชำระเงินต่างๆ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.revenueByChannel || []}> {/* กราฟแท่ง */}
                    <CartesianGrid strokeDasharray="3 3" /> {/* เส้นตาราง */}
                    <XAxis dataKey="channel" /> {/* แกน X แสดงช่องทาง */}
                    <YAxis /> {/* แกน Y แสดงจำนวนเงิน */}
                    <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']} /> {/* แสดงข้อมูลเมื่อ hover */}
                    <Legend /> {/* คำอธิบายกราฟ */}
                    <Bar dataKey="amount" fill="#8884d8" name="รายได้ (บาท)" /> {/* แท่งกราฟ */}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* แท็บแสดงกราฟแท่งความถี่การใช้งาน */}
          <TabsContent value="frequency">
            <Card>
              <CardHeader>
                <CardTitle>ความถี่การใช้งานของสมาชิกแต่ละคน</CardTitle>
                <CardDescription>แสดงจำนวนครั้งการใช้งานของสมาชิกที่ใช้งานมากที่สุด 10 อันดับแรก</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.userFrequency?.slice(0, 10) || []}> {/* กราฟแท่งความถี่ */}
                    <CartesianGrid strokeDasharray="3 3" /> {/* เส้นตาราง */}
                    <XAxis dataKey="userName" angle={-45} textAnchor="end" height={100} /> {/* แกน X แสดงชื่อผู้ใช้ */}
                    <YAxis /> {/* แกน Y แสดงจำนวนครั้ง */}
                    <Tooltip formatter={(value) => [value, 'จำนวนครั้ง']} /> {/* แสดงข้อมูลเมื่อ hover */}
                    <Legend /> {/* คำอธิบายกราฟ */}
                    <Bar dataKey="frequency" fill="#82ca9d" name="จำนวนครั้งการใช้งาน" /> {/* แท่งกราฟสีเขียว */}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* แท็บแสดงกราฟเส้นรายได้รายเดือน */}
          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>รายได้รายเดือน</CardTitle>
                <CardDescription>แสดงแนวโน้มรายได้ในแต่ละเดือน</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.monthlyRevenue || []}> {/* กราฟเส้นรายได้รายเดือน */}
                    <CartesianGrid strokeDasharray="3 3" /> {/* เส้นตาราง */}
                    <XAxis dataKey="month" /> {/* แกน X แสดงเดือน */}
                    <YAxis /> {/* แกน Y แสดงจำนวนเงิน */}
                    <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']} /> {/* แสดงข้อมูลเมื่อ hover */}
                    <Legend /> {/* คำอธิบายกราฟ */}
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="รายได้ (บาท)" /> {/* เส้นกราฟสีน้ำเงิน */}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* แท็บแสดงกราฟแท่งข้อมูลผู้สมัครรายปี */}
          <TabsContent value="annual">
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลผู้สมัครรายปี</CardTitle>
                <CardDescription>แสดงจำนวนผู้สมัครและรายได้ในแต่ละปี</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.annualSubscribers || []}> {/* กราฟแท่งข้อมูลผู้สมัครรายปี */}
                    <CartesianGrid strokeDasharray="3 3" /> {/* เส้นตาราง */}
                    <XAxis dataKey="year" /> {/* แกน X แสดงปี */}
                    <YAxis yAxisId="left" orientation="left" /> {/* แกน Y ซ้ายสำหรับจำนวนผู้สมัคร */}
                    <YAxis yAxisId="right" orientation="right" /> {/* แกน Y ขวาสำหรับรายได้ */}
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'จำนวนผู้สมัคร') return [value.toLocaleString(), name]
                        if (name === 'รายได้') return [`฿${value.toLocaleString()}`, name]
                        return [value, name]
                      }}
                    /> {/* แสดงข้อมูลเมื่อ hover */}
                    <Legend /> {/* คำอธิบายกราฟ */}
                    <Bar yAxisId="left" dataKey="subscriberCount" fill="#8884d8" name="จำนวนผู้สมัคร" /> {/* แท่งกราฟสีน้ำเงิน */}
                    <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="รายได้" /> {/* แท่งกราฟสีเขียว */}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs> {/* ปิด Tabs component */}
          </>
        )}
      </div> {/* ปิด container หลัก */}
    </AdminLayout> 
  )
} // ปิดฟังก์ชัน AdminReportsPage

/*
 * หมายเหตุ:
 * - ไฟล์นี้เป็นหน้ารายงานสำหรับผู้ดูแลระบบ
 * - แสดงข้อมูลสถิติต่างๆ ในรูปแบบกราฟและตัวเลข
 * - ใช้ Recharts library สำหรับแสดงกราฟ
 * - มีการตรวจสอบสิทธิ์ผู้ใช้ก่อนแสดงข้อมูล
 * - รองรับการแสดงผลแบบ responsive
 */