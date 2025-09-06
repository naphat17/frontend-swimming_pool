"use client" // บอกให้ Next.js รู้ว่านี่เป็น Client Component

// นำเข้า React hooks สำหรับจัดการ state และ side effects
import { useEffect, useState } from "react"
// นำเข้า custom hook สำหรับจัดการการยืนยันตัวตน
import { useAuth } from "@/components/auth-provider"
// นำเข้า router สำหรับการนำทางระหว่างหน้า
import { useRouter } from "next/navigation"
// นำเข้า layout component สำหรับหน้า admin
import AdminLayout from "@/components/admin-layout"
// นำเข้า UI components จาก shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// นำเข้า custom hook สำหรับแสดงข้อความแจ้งเตือน
import { useToast } from "@/hooks/use-toast"
// นำเข้าไอคอนจาก lucide-react
import { Users, Calendar, DollarSign, TrendingUp, Clock, AlertCircle, Plus, Box, X } from "lucide-react"
// นำเข้า Link component สำหรับการนำทาง
import Link from "next/link"

// Interface สำหรับข้อมูลสถิติของ dashboard
interface DashboardStats {
  total_members: number // จำนวนสมาชิกทั้งหมด
  active_members: number // จำนวนสมาชิกที่ใช้งานอยู่
  members_diff: number // ความแตกต่างของจำนวนสมาชิกจากเดือนที่แล้ว
  today_reservations: number // จำนวนการจองวันนี้
  yesterday_reservations: number // จำนวนการจองเมื่อวาน
  reservations_diff: number // ความแตกต่างของการจองจากเมื่อวาน
  monthly_revenue: number // รายได้รายเดือน
  today_revenue: number // รายได้วันนี้
  yesterday_revenue: number // รายได้เมื่อวาน
  total_revenue: number // รายได้รวมทั้งหมด
  available_lockers: number // จำนวนตู้เก็บของที่ว่าง
  total_lockers: number // จำนวนตู้เก็บของทั้งหมด
}

// Interface สำหรับข้อมูลกิจกรรมล่าสุด
interface RecentActivity {
  id: number // รหัสกิจกรรม
  type: string // ประเภทกิจกรรม
  description: string // คำอธิบายกิจกรรม
  created_at: string // วันที่สร้าง
  user_name?: string // ชื่อผู้ใช้ (ไม่บังคับ)
}

// Interface สำหรับข้อมูลการจอง
interface Reservation {
  id: number // รหัสการจอง
  reservation_date: string // วันที่จอง
  reservation_time?: string // เวลาจอง (ไม่บังคับ)
  user_name: string // ชื่อผู้จอง
  pool_name: string // ชื่อสระว่ายน้ำ
  status: string // สถานะการจอง
  payment_status?: string // สถานะการชำระเงิน (ไม่บังคับ)
}

// Interface สำหรับข้อมูลประกาศ
interface Notification {
  id: number // รหัสประกาศ
  title: string // หัวข้อประกาศ
  message: string // ข้อความประกาศ
  type: 'warning' | 'info' | 'success' // ประเภทประกาศ
  created_at: string // วันที่สร้าง
}

// Component หลักสำหรับหน้า Dashboard ของ Admin
export default function AdminDashboardPage() {
  const { user } = useAuth() // ดึงข้อมูลผู้ใช้จาก AuthProvider
  const router = useRouter() // ใช้สำหรับการนำทางระหว่างหน้า
  const { toast } = useToast() // ใช้สำหรับแสดงข้อความแจ้งเตือน
  
  // State สำหรับเก็บข้อมูลสถิติของ dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null)
  // State สำหรับเก็บข้อมูลกิจกรรมล่าสุด
  const [activities, setActivities] = useState<RecentActivity[]>([])
  // State สำหรับเก็บข้อมูลการจองล่าสุด
  const [reservations, setReservations] = useState<Reservation[]>([])
  // State สำหรับเก็บข้อมูลประกาศ
  const [notifications, setNotifications] = useState<Notification[]>([])
  // State สำหรับควบคุมสถานะการโหลดข้อมูล
  const [loading, setLoading] = useState(true)
  // State สำหรับควบคุมการเปิด/ปิด dialog สร้างประกาศ
  const [dialogOpen, setDialogOpen] = useState(false)
  // State สำหรับเก็บข้อมูลประกาศใหม่ที่จะสร้าง
  const [newNotification, setNewNotification] = useState({
    title: "", // หัวข้อประกาศ
    message: "", // ข้อความประกาศ
    type: "info" as "warning" | "info" | "success" // ประเภทประกาศ
  })

  // useEffect สำหรับตรวจสอบสิทธิ์และโหลดข้อมูล dashboard เมื่อ component mount
  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่ ถ้าไม่ใช่ให้ redirect ไปหน้า dashboard ปกติ
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // ฟังก์ชันสำหรับดึงข้อมูล dashboard จาก API
    const fetchDashboard = async () => {
      try {
        // ดึง token จาก localStorage สำหรับการยืนยันตัวตน
        const token = localStorage.getItem("token")
        
        // ดึงข้อมูลสถิติ dashboard
        const response = await fetch("https://backend-l7q9.onrender.com/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.stats) // เซ็ตข้อมูลสถิติ
          setActivities(data.recent_activities || []) // เซ็ตข้อมูลกิจกรรมล่าสุด
        }

        // ดึงข้อมูลการจองล่าสุด
        const reservationsResponse = await fetch("https://backend-l7q9.onrender.com/api/admin/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json()
          // เก็บเฉพาะ 5 รายการแรกของการจอง
          setReservations(reservationsData.reservations?.slice(0, 5) || [])
        }

        // ดึงข้อมูลประกาศ
        const notificationsResponse = await fetch("https://backend-l7q9.onrender.com/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          // เก็บเฉพาะ 1 รายการแรกของประกาศ
          setNotifications(notificationsData.notifications?.slice(0, 1) || [])
        }

        // ข้อมูลสถิติตู้เก็บของจะรวมอยู่ใน dashboard API response แล้ว

      } catch (error) {
        console.error("Error fetching dashboard:", error) // แสดง error ใน console
      } finally {
        setLoading(false) // เซ็ตสถานะการโหลดเป็น false เมื่อเสร็จสิ้น
      }
    }

    // เรียกใช้ฟังก์ชัน fetchDashboard เมื่อมีข้อมูลผู้ใช้
    if (user) {
      fetchDashboard()
    }
  }, [user, router]) // dependency array - จะ re-run เมื่อ user หรือ router เปลี่ยน

  // ฟังก์ชันสำหรับจัดการการสร้างประกาศใหม่
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault() // ป้องกันการ refresh หน้าเมื่อ submit form
    
    try {
      // ดึง token สำหรับการยืนยันตัวตน
      const token = localStorage.getItem("token")
      // ส่งคำขอ POST ไปยัง API เพื่อสร้างประกาศใหม่
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: "all", // ส่งประกาศให้ผู้ใช้ทุกคน
          title: newNotification.title, // หัวข้อประกาศ
          message: newNotification.message, // ข้อความประกาศ
        }),
      })

      if (response.ok) {
        // แสดงข้อความแจ้งเตือนเมื่อสร้างประกาศสำเร็จ
        toast({
          title: "สร้างประกาศสำเร็จ",
          description: "ประกาศใหม่ได้รับการเพิ่มแล้ว",
        })
        setDialogOpen(false) // ปิด dialog
        setNewNotification({ title: "", message: "", type: "info" }) // รีเซ็ตฟอร์ม
        
        // สร้าง object ประกาศใหม่สำหรับแสดงผลทันที
        const newNotificationObj: Notification = {
          id: Date.now(), // ใช้ timestamp เป็น id ชั่วคราว
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          created_at: new Date().toISOString() // วันที่ปัจจุบัน
        }
        
        // เพิ่มประกาศใหม่ลงใน state ทันทีเพื่อ UX ที่ดีขึ้น
        setNotifications([newNotificationObj])
        
        // ดึงข้อมูลประกาศจากเซิร์ฟเวอร์อีกครั้งเพื่อให้แน่ใจว่าข้อมูลถูกต้อง
        const notificationsResponse = await fetch("https://backend-l7q9.onrender.com/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData.notifications?.slice(0, 1) || [])
        }
      } else {
        // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถสร้างประกาศได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      // แสดงข้อความแจ้งเตือนเมื่อไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    }
  }

  // ฟังก์ชันสำหรับจัดการการลบประกาศ
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      // ดึง token สำหรับการยืนยันตัวตน
      const token = localStorage.getItem("token")
      // ส่งคำขอ DELETE ไปยัง API เพื่อลบประกาศ
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        // แสดงข้อความแจ้งเตือนเมื่อลบประกาศสำเร็จ
        toast({
          title: "ลบประกาศสำเร็จ",
          description: "ประกาศได้รับการลบแล้ว",
        })
        
        // ลบประกาศออกจาก state ทันทีเพื่อ UX ที่ดีขึ้น
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        // ดึงข้อมูลประกาศจากเซิร์ฟเวอร์อีกครั้งเพื่อให้แน่ใจว่าข้อมูลถูกต้อง
        const notificationsResponse = await fetch("https://backend-l7q9.onrender.com/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData.notifications?.slice(0, 1) || [])
        }
      } else {
        // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาดในการลบ
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบประกาศได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      // แสดงข้อความแจ้งเตือนเมื่อไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    }
  }

  // ฟังก์ชันสำหรับสร้าง Badge แสดงสถานะการจอง
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return <Badge className="bg-green-500 text-white">ชำระแล้ว</Badge> // สีเขียวสำหรับสถานะที่ยืนยันแล้ว
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">รอชำระเงิน</Badge> // สีเหลืองสำหรับสถานะรอดำเนินการ
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">ยกเลิก</Badge> // สีแดงสำหรับสถานะยกเลิก
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge> // สีเทาสำหรับสถานะอื่นๆ
    }
  }

  // แสดง loading spinner ขณะที่กำลังโหลดข้อมูล
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            {/* Loading spinner แบบ double ring */}
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ตรวจสอบสิทธิ์ผู้ใช้ - ถ้าไม่ใช่ admin ให้ return null (ไม่แสดงอะไร)
  if (user?.role !== "admin") {
    return null
  }

  // ส่วน JSX หลักของ component
  return (
    <AdminLayout> {/* Layout wrapper สำหรับหน้า admin */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* Background gradient */}
        <div className="space-y-8 p-6"> {/* Container หลักพร้อม spacing และ padding */}
          {/* Hero Section - ส่วนหัวของหน้า */}
          <div className="text-center space-y-4 py-8">
            {/* ไอคอนหลักของ dashboard */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            {/* หัวข้อหลักพร้อม gradient text */}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              แดชบอร์ดผู้ดูแลระบบ
            </h1>
            {/* คำอธิบายใต้หัวข้อ */}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ภาพรวมของระบบและข้อมูลสำคัญ
            </p>
          </div>

          {/* Stats Cards - การ์ดแสดงสถิติต่างๆ ของระบบ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto"> {/* Grid layout responsive สำหรับแสดงการ์ดสถิติ */}
            {/* การ์ดแสดงจำนวนสมาชิกทั้งหมด */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">สมาชิกทั้งหมด</CardTitle> {/* หัวข้อการ์ด */}
                <Users className="h-6 w-6 text-blue-200" /> {/* ไอคอนผู้ใช้ */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_members || 0}</div> {/* แสดงจำนวนสมาชิกทั้งหมด */}
                <p className="text-xs text-blue-200 mt-1">
                  {stats?.members_diff ? (stats.members_diff > 0 ? `+${stats.members_diff}` : `${stats.members_diff}`) : '+0'} จากเดือนที่แล้ว {/* แสดงการเปลี่ยนแปลงจากเดือนที่แล้ว */}
                </p>
              </CardContent>
            </Card>
            {/* การ์ดแสดงจำนวนการจองวันนี้ */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">การจองวันนี้</CardTitle> {/* หัวข้อการ์ด */}
                <Calendar className="h-6 w-6 text-green-200" /> {/* ไอคอนปฏิทิน */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.today_reservations || 0}</div> {/* แสดงจำนวนการจองวันนี้ */}
                <p className="text-xs text-green-200 mt-1">
                  {stats?.reservations_diff ? (stats.reservations_diff > 0 ? `+${stats.reservations_diff}` : `${stats.reservations_diff}`) : '+0'} จากเมื่อวาน {/* แสดงการเปลี่ยนแปลงจากเมื่อวาน */}
                </p>
              </CardContent>
            </Card>
            {/* การ์ดแสดงรายได้วันนี้ */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">รายได้วันนี้</CardTitle> {/* หัวข้อการ์ด */}
                <DollarSign className="h-6 w-6 text-purple-200" /> {/* ไอคอนเงิน */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">฿{stats?.today_revenue ? stats.today_revenue.toLocaleString() : '0'}</div> {/* แสดงรายได้วันนี้ */}
                <p className="text-xs text-purple-200 mt-1">รายรับรวมวันนี้</p> {/* คำอธิบายรายได้ */}
              </CardContent>
            </Card>
            {/* การ์ดแสดงรายได้รวมทั้งหมด */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-100">รายได้รวม</CardTitle> {/* หัวข้อการ์ด */}
                <TrendingUp className="h-6 w-6 text-yellow-200" /> {/* ไอคอนกราฟเพิ่มขึ้น */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">฿{stats?.total_revenue ? stats.total_revenue.toLocaleString() : '0'}</div> {/* แสดงรายได้รวมทั้งหมด */}
                <p className="text-xs text-yellow-200 mt-1">รวมค่าสมัครรายปี</p> {/* คำอธิบายรายได้รวม */}
              </CardContent>
            </Card>
            {/* การ์ดแสดงสถานะตู้เก็บของ */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-orange-500 to-red-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">ตู้เก็บของว่าง</CardTitle> {/* หัวข้อการ์ด */}
                <Box className="h-6 w-6 text-orange-200" /> {/* ไอคอนกล่อง */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.available_lockers || 0}/{stats?.total_lockers || 0}</div> {/* แสดงจำนวนตู้ว่าง/ทั้งหมด */}
                <p className="text-xs text-orange-200 mt-1">
                  {stats?.total_lockers ? Math.round(((stats?.available_lockers || 0) / stats.total_lockers) * 100) : 0}% ว่าง {/* แสดงเปอร์เซ็นต์ตู้ว่าง */}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid - ส่วนเนื้อหาหลักแบ่งเป็น 2 คอลัมน์ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"> {/* Grid layout responsive 3 คอลัมน์ */}
            {/* ส่วนซ้าย - แสดงการจองล่าสุด (ใช้พื้นที่ 2 คอลัมน์) */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300"> {/* การ์ดแสดงการจองล่าสุด */}
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-blue-600" /> {/* ไอคอนปฏิทิน */}
                    <CardTitle className="text-xl font-bold text-gray-900">การจองล่าสุด</CardTitle> {/* หัวข้อการ์ด */}
                  </div>
                  {/* ปุ่มเพิ่มประกาศใหม่ */}
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> {/* ไอคอนเพิ่ม */}
                    เพิ่มประกาศ
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* ตารางแสดงข้อมูลการจองล่าสุด */}
                  <div className="overflow-x-auto"> {/* Container สำหรับ responsive table */}
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">วันที่</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">เวลา</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">สมาชิก</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">ประเภท</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reservations.length > 0 ? (
                          reservations.map((reservation) => (
                            <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                {(() => {
                                  if (!reservation.reservation_date || reservation.reservation_date === 'null' || reservation.reservation_date === '') {
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
                                    
                                    return date.toLocaleDateString('th-TH')
                                  } catch (error) {
                                    return 'รูปแบบวันที่ไม่ถูกต้อง'
                                  }
                                })()
                                }
                              </td>
                              <td className="py-3 px-4">{reservation.reservation_time || '13:00 - 15:00'}</td>
                              <td className="py-3 px-4 font-medium text-gray-800">{reservation.user_name}</td>
                              <td className="py-3 px-4">{reservation.pool_name || 'สระหลัก'}</td>
                              <td className="py-3 px-4 text-center">{getStatusBadge(reservation.status)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-500">
                              <p>ไม่มีข้อมูลการจองล่าสุด</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Link href="/admin/reservations">
                      <Button variant="outline" className="transition-all duration-300 hover:bg-gray-100">
                        ดูการจองทั้งหมด
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ส่วนขวา - แสดงประกาศและการแจ้งเตือน (ใช้พื้นที่ 1 คอลัมน์) */}
            <div className="space-y-6"> {/* Container สำหรับประกาศ */}
              {/* Link ไปยังหน้าจัดการประกาศทั้งหมด */}
              <Link href="/admin/notifications" className="block hover:opacity-90 transition-opacity">
                {/* แสดงประกาศล่าสุด หรือข้อความว่าไม่มีประกาศ */}
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <Card key={notification.id} className={`shadow-lg border-2 ${
                        notification.type === 'warning' ? 'border-yellow-300 bg-yellow-50' : // สีเหลืองสำหรับคำเตือน
                        notification.type === 'info' ? 'border-blue-300 bg-blue-50' : // สีน้ำเงินสำหรับข้อมูล
                        'border-green-300 bg-green-50' // สีเขียวสำหรับข่าวดี
                      }`}>
                      <CardHeader className="flex flex-row items-start space-x-3 pb-3">
                        <AlertCircle className={`h-6 w-6 mt-1 ${
                          notification.type === 'warning' ? 'text-yellow-500' :
                          notification.type === 'info' ? 'text-blue-500' :
                          'text-green-500'
                        }`} />
                        <div>
                          <CardTitle className={`text-lg font-bold ${
                            notification.type === 'warning' ? 'text-yellow-800' :
                            notification.type === 'info' ? 'text-blue-800' :
                            'text-green-800'
                          }`}>{notification.title}</CardTitle>
                          <CardDescription className="text-xs">{new Date(notification.created_at).toLocaleString('th-TH')}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${
                          notification.type === 'warning' ? 'text-yellow-700' :
                          notification.type === 'info' ? 'text-blue-700' :
                          'text-green-700'
                        }`}>{notification.message}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="shadow-lg border-gray-200">
                    <CardContent className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีประกาศ</h3>
                      <p className="text-gray-600 text-sm">ยังไม่มีประกาศในขณะนี้</p>
                    </CardContent>
                  </Card>
                )}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Dialog สำหรับสร้างประกาศใหม่ */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg"> {/* Modal content */}
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">สร้างประกาศใหม่</DialogTitle> {/* หัวข้อ modal */}
              <DialogDescription>
                ประกาศจะแสดงให้ผู้ใช้ทุกคนเห็น {/* คำอธิบาย modal */}
              </DialogDescription>
            </DialogHeader>
            {/* ฟอร์มสำหรับสร้างประกาศใหม่ */}
            <form onSubmit={handleCreateNotification} className="space-y-6 pt-4">
              {/* ฟิลด์หัวข้อประกาศ */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-medium">หัวข้อ</Label> {/* ป้ายกำกับ */}
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })} // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                  placeholder="เช่น ปิดปรับปรุงสระ" // ตัวอย่างข้อความ
                  required // ฟิลด์บังคับ
                />
              </div>
              {/* ฟิลด์ข้อความประกาศ */}
              <div className="space-y-2">
                <Label htmlFor="message" className="font-medium">ข้อความ</Label> {/* ป้ายกำกับ */}
                <Textarea
                  id="message"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })} // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                  placeholder="รายละเอียดประกาศ..." // ตัวอย่างข้อความ
                  rows={4} // จำนวนแถวของ textarea
                  required // ฟิลด์บังคับ
                />
              </div>
              {/* ฟิลด์เลือกประเภทประกาศ */}
              <div className="space-y-2">
                <Label htmlFor="type" className="font-medium">ประเภท</Label> {/* ป้ายกำกับ */}
                <select
                  id="type"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as "warning" | "info" | "success" })} // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" // สไตล์ dropdown
                >
                  <option value="info">ข้อมูล (สีน้ำเงิน)</option> {/* ตัวเลือกประเภทข้อมูล */}
                  <option value="warning">คำเตือน (สีเหลือง)</option> {/* ตัวเลือกประเภทคำเตือน */}
                  <option value="success">ข่าวดี (สีเขียว)</option> {/* ตัวเลือกประเภทข่าวดี */}
                </select>
              </div>
              {/* ปุ่มควบคุมฟอร์ม */}
              <div className="flex justify-end space-x-3 pt-4"> {/* Container สำหรับปุ่ม */}
                {/* ปุ่มยกเลิก */}
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                {/* ปุ่มสร้างประกาศ */}
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  สร้างประกาศ
                </Button>
              </div>
             </form> {/* ปิดฟอร์มสร้างประกาศ */}
           </DialogContent> {/* ปิด dialog content */}
        </Dialog>
      </div>
    </AdminLayout>
  )
}
