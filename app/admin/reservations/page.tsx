"use client" // ระบุว่าเป็น Client Component สำหรับ Next.js 13+

// นำเข้า React hooks สำหรับจัดการ state และ lifecycle
import { useEffect, useState } from "react"
// นำเข้า custom hook สำหรับจัดการการยืนยันตัวตน
import { useAuth } from "@/components/auth-provider"
// นำเข้า router สำหรับการนำทางระหว่างหน้า
import { useRouter } from "next/navigation"
// นำเข้า layout component สำหรับหน้าผู้ดูแลระบบ
import AdminLayout from "@/components/admin-layout"
// นำเข้า UI components สำหรับการแสดงผล
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// นำเข้า hook สำหรับแสดงข้อความแจ้งเตือน
import { useToast } from "@/hooks/use-toast"
// นำเข้า Dialog components สำหรับ modal popup
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
// นำเข้า Table components สำหรับแสดงข้อมูลในรูปแบบตาราง
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// นำเข้า icons จาก lucide-react
import { Search, Plus, Check, X, Trash2, Calendar, Users, Package, Waves, Clock } from "lucide-react"
// นำเข้า custom component สำหรับแสดงตารางการจอง
import { ReservationTable } from "@/components/ui/reservation-table"
// นำเข้า useRef สำหรับการอ้างอิง DOM element
import { useRef } from "react"
// นำเข้า Tabs components สำหรับการแบ่งแท็บ
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interface สำหรับข้อมูลการจองสระว่ายน้ำ
interface Reservation {
  id: number // รหัสการจอง
  user_name: string // ชื่อผู้จอง
  user_email: string // อีเมลผู้จอง
  pool_name: string // ชื่อสระว่ายน้ำ
  reservation_date: string // วันที่จอง
  start_time: string // เวลาเริ่มต้น
  end_time: string // เวลาสิ้นสุด
  status: string // สถานะการจอง (pending, confirmed, cancelled)
  notes?: string // หมายเหตุเพิ่มเติม (optional)
  created_at: string // วันที่สร้างการจอง
  payment_id?: number // รหัสการชำระเงิน (optional)
  payment_amount?: number // จำนวนเงิน (optional)
  payment_status?: string // สถานะการชำระเงิน (optional)
  payment_method?: string // วิธีการชำระเงิน (optional)
  slip_url?: string // URL ของสลิปการโอนเงิน (optional)
}

// Interface สำหรับข้อมูลการจองตู้เก็บของ
interface LockerReservation {
  id: number // รหัสการจอง
  user_id: number // รหัสผู้ใช้
  username: string // ชื่อผู้ใช้
  first_name: string // ชื่อจริง
  last_name: string // นามสกุล
  user_email: string // อีเมลผู้ใช้
  locker_id: number // รหัสตู้เก็บของ
  locker_code: string // รหัสตู้เก็บของ
  location: string // ตำแหน่งตู้เก็บของ
  reservation_date: string // วันที่จอง
  start_time: string // เวลาเริ่มต้น
  end_time: string // เวลาสิ้นสุด
  status: string // สถานะการจอง
  created_at: string // วันที่สร้างการจอง
  payment_id?: number // รหัสการชำระเงิน (optional)
  payment_amount?: number // จำนวนเงิน (optional)
  payment_status?: string // สถานะการชำระเงิน (optional)
  payment_method?: string // วิธีการชำระเงิน (optional)
  slip_url?: string // URL ของสลิปการโอนเงิน (optional)
}

// Interface สำหรับข้อมูลสระว่ายน้ำ
interface Pool {
  id: number // รหัสสระ
  name: string // ชื่อสระ
  capacity: number // ความจุ
  status: string // สถานะสระ
}

// Interface สำหรับข้อมูลผู้ใช้
interface User {
  id: number // รหัสผู้ใช้
  first_name: string // ชื่อจริง
  last_name: string // นามสกุล
  email: string // อีเมล
}

// Component หลักสำหรับหน้าจัดการการจองของผู้ดูแลระบบ
export default function AdminReservationsPage() {
  // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่จาก AuthProvider
  const { user } = useAuth()
  // ใช้สำหรับการนำทางระหว่างหน้า
  const router = useRouter()
  // ใช้สำหรับแสดงข้อความแจ้งเตือน
  const { toast } = useToast()
  
  // State สำหรับเก็บข้อมูลการจองสระว่ายน้ำ
  const [reservations, setReservations] = useState<Reservation[]>([])
  // State สำหรับเก็บข้อมูลการจองตู้เก็บของ
  const [lockerReservations, setLockerReservations] = useState<LockerReservation[]>([])
  // State สำหรับเก็บข้อมูลสระว่ายน้ำทั้งหมด
  const [pools, setPools] = useState<Pool[]>([])
  // State สำหรับเก็บข้อมูลผู้ใช้ทั้งหมด
  const [users, setUsers] = useState<User[]>([])
  // State สำหรับแสดงสถานะการโหลดข้อมูล
  const [loading, setLoading] = useState(true)
  // State สำหรับเก็บคำค้นหา
  const [searchTerm, setSearchTerm] = useState("")
  // State สำหรับกรองตามสถานะ
  const [statusFilter, setStatusFilter] = useState("all")
  // State สำหรับกรองตามวันที่
  const [dateFilter, setDateFilter] = useState("")
  // State สำหรับควบคุมการเปิด/ปิด dialog สร้างการจอง
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  // State สำหรับเก็บวิธีการชำระเงินที่เลือก
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  // State สำหรับเก็บไฟล์สลิปการโอนเงิน
  const [slipFile, setSlipFile] = useState<File | null>(null)
  // Reference สำหรับ input file element
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State สำหรับเก็บข้อมูลการจองใหม่ที่กำลังสร้าง
  const [newReservation, setNewReservation] = useState({
    user_id: "", // รหัสผู้ใช้
    pool_id: "", // รหัสสระ
    reservation_date: "", // วันที่จอง
    start_time: "", // เวลาเริ่มต้น
    end_time: "", // เวลาสิ้นสุด
    payment_method: "", // วิธีการชำระเงิน
    notes: "" // หมายเหตุ
  })

  // useEffect สำหรับตรวจสอบสิทธิ์และโหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
    if (!user) {
      router.push("/login") // ถ้าไม่ได้ล็อกอิน ให้ไปหน้า login
      return
    }
    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
    if (user.role !== "admin") {
      router.push("/") // ถ้าไม่ใช่ admin ให้ไปหน้าหลัก
      return
    }
    // โหลดข้อมูลทั้งหมดที่จำเป็น
    fetchReservations() // ดึงข้อมูลการจองสระ
    fetchLockerReservations() // ดึงข้อมูลการจองตู้เก็บของ
    fetchPools() // ดึงข้อมูลสระทั้งหมด
    fetchUsers() // ดึงข้อมูลผู้ใช้ทั้งหมด
  }, [user, router])

  // ฟังก์ชันสำหรับดึงข้อมูลการจองสระว่ายน้ำ
  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/reservations", {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || []) // อัปเดต state ด้วยข้อมูลที่ได้
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false) // ปิดสถานะ loading
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลการจองตู้เก็บของ
  const fetchLockerReservations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/locker-reservations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLockerReservations(data.reservations || [])
      }
    } catch (error) {
      console.error("Error fetching locker reservations:", error)
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลสระว่ายน้ำทั้งหมด
  const fetchPools = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/pools", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPools(data.pools || [])
      }
    } catch (error) {
      console.error("Error fetching pools:", error)
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // ฟังก์ชันสำหรับสร้างการจองใหม่
  const handleCreateReservation = async () => {
    try {
      // สร้าง FormData สำหรับส่งข้อมูลและไฟล์
      const formData = new FormData()
      Object.entries(newReservation).forEach(([key, value]) => {
        formData.append(key, value) // เพิ่มข้อมูลการจองลงใน FormData
      })
      if (slipFile) {
        formData.append("slip", slipFile) // เพิ่มไฟล์สลิปถ้ามี
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reservations`, {
        method: "POST", // ใช้ POST method สำหรับสร้างข้อมูลใหม่
        body: formData // ส่ง FormData
      })

      if (response.ok) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "สำเร็จ",
          description: "สร้างการจองเรียบร้อยแล้ว"
        })
        setIsCreateDialogOpen(false) // ปิด dialog
        // รีเซ็ตฟอร์มการจองใหม่
        setNewReservation({
          user_id: "",
          pool_id: "",
          reservation_date: "",
          start_time: "",
          end_time: "",
          payment_method: "",
          notes: ""
        })
        setSlipFile(null) // ลบไฟล์สลิป
        fetchReservations() // รีเฟรชข้อมูลการจอง
      } else {
        const error = await response.json()
        // แสดงข้อความผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.message || "ไม่สามารถสร้างการจองได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating reservation:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างการจองได้",
        variant: "destructive"
      })
    }
  }

  // ฟังก์ชันสำหรับอัปเดตสถานะการจองสระ
  const handleUpdateReservationStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/reservations/${id}`, {
        method: "PUT", // ใช้ PUT method ตาม API backend
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }) // ส่งสถานะใหม่
      })

      if (response.ok) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "สำเร็จ",
          description: "อัปเดตสถานะการจองเรียบร้อยแล้ว"
        })
        fetchReservations() // รีเฟรชข้อมูลการจอง
      } else {
        // แสดงข้อความผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถอัปเดตสถานะได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating reservation status:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive"
      })
    }
  }

  // ฟังก์ชันสำหรับอัปเดตสถานะการจองตู้เก็บของ
  const handleUpdateLockerReservationStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/locker-reservations/${id}/confirm`, {
        method: "PUT", // ใช้ PUT method ตาม API backend
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }) // ส่งสถานะใหม่
      })

      if (response.ok) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "สำเร็จ",
          description: "อัปเดตสถานะการจองตู้เก็บของเรียบร้อยแล้ว"
        })
        fetchLockerReservations() // รีเฟรชข้อมูลการจองตู้เก็บของ
      } else {
        // แสดงข้อความผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถอัปเดตสถานะได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating locker reservation status:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive"
      })
    }
  }

  // ฟังก์ชันสำหรับลบการจองสระ
  const handleDeleteReservation = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reservations/${id}`, {
        method: "DELETE" // ใช้ DELETE method สำหรับลบข้อมูล
      })

      if (response.ok) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "สำเร็จ",
          description: "ลบการจองเรียบร้อยแล้ว"
        })
        fetchReservations() // รีเฟรชข้อมูลการจอง
      } else {
        // แสดงข้อความผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบการจองได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting reservation:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการจองได้",
        variant: "destructive"
      })
    }
  }

  // ฟังก์ชันสำหรับลบการจองตู้เก็บของ
  const handleDeleteLockerReservation = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/locker-reservations/${id}`, {
        method: "DELETE" // ใช้ DELETE method สำหรับลบข้อมูล
      })

      if (response.ok) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "สำเร็จ",
          description: "ลบการจองตู้เก็บของเรียบร้อยแล้ว"
        })
        fetchLockerReservations() // รีเฟรชข้อมูลการจองตู้เก็บของ
      } else {
        // แสดงข้อความผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบการจองได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting locker reservation:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการจองได้",
        variant: "destructive"
      })
    }
  }

  // ฟังก์ชันสำหรับแปลงข้อความวิธีการชำระเงินเป็นภาษาไทย
  const getPaymentMethodText = (method: string) => {
    switch (method) {

      case "bank_transfer":
        return "โอนเงิน"
      case "cash":
        return "เงินสด"
      default:
        return method
    }
  }

  // ฟังก์ชันสำหรับกำหนดสีของ Badge ตามสถานะการจอง
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default" // สีเขียว สำหรับยืนยันแล้ว
      case "pending":
        return "secondary" // สีเทา สำหรับรอยืนยัน
      case "cancelled":
        return "destructive" // สีแดง สำหรับยกเลิก
      default:
        return "outline"
    }
  }

  // ฟังก์ชันสำหรับแปลงข้อความสถานะการจองเป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "ยืนยันแล้ว"
      case "pending":
        return "รอยืนยัน"
      case "cancelled":
        return "ยกเลิก"
      default:
        return status
    }
  }

  // ฟังก์ชันสำหรับกำหนดสีของ Badge ตามสถานะการชำระเงิน
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" // สีเขียว สำหรับชำระแล้ว
      case "pending":
        return "secondary" // สีเทา สำหรับรอชำระ
      case "failed":
        return "destructive" // สีแดง สำหรับชำระไม่สำเร็จ
      default:
        return "outline"
    }
  }

  // ฟังก์ชันสำหรับแปลงข้อความสถานะการชำระเงินเป็นภาษาไทย
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "ชำระแล้ว"
      case "pending":
        return "รอชำระ"
      case "failed":
        return "ชำระไม่สำเร็จ"
      default:
        return status
    }
  }

  // กรองข้อมูลการจองสระตามเงื่อนไขการค้นหา สถานะ และวันที่
  const filteredReservations = reservations.filter((reservation) => {
    // ตรวจสอบว่าตรงกับคำค้นหาหรือไม่ (ชื่อผู้ใช้หรือชื่อสระ)
    const matchesSearch = 
      reservation.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.pool_name.toLowerCase().includes(searchTerm.toLowerCase())

    // ตรวจสอบว่าตรงกับตัวกรองสถานะหรือไม่
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    // ตรวจสอบว่าตรงกับตัวกรองวันที่หรือไม่
    const matchesDate = !dateFilter || reservation.reservation_date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  // กรองข้อมูลการจองตู้เก็บของตามเงื่อนไขการค้นหา สถานะ และวันที่
  const filteredLockerReservations = lockerReservations.filter((r) => {
    // ตรวจสอบว่าตรงกับคำค้นหาหรือไม่ (ชื่อ นามสกุล หรือรหัสตู้)
    const matchesSearch = 
      r.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.locker_code.toLowerCase().includes(searchTerm.toLowerCase())

    // ตรวจสอบว่าตรงกับตัวกรองสถานะหรือไม่
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    // ตรวจสอบว่าตรงกับตัวกรองวันที่หรือไม่
    const matchesDate = !dateFilter || r.reservation_date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  // แสดงหน้าจอ loading ขณะที่กำลังโหลดข้อมูล
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ตรวจสอบสิทธิ์ผู้ใช้ - ถ้าไม่ใช่ admin ให้ return null
  if (user?.role !== "admin") {
    return null
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* การ์ดแสดงสถิติการจอง */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* การ์ดแสดงจำนวนการจองสระทั้งหมด */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">การจองสระทั้งหมด</p>
                    <p className="text-3xl font-bold">{reservations.length}</p>
                  </div>
                  <Waves className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            {/* การ์ดแสดงจำนวนการจองตู้เก็บของ */}
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">การจองตู้เก็บของ</p>
                    <p className="text-3xl font-bold">{lockerReservations.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            {/* การ์ดแสดงจำนวนการจองที่ยืนยันแล้ว */}
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">ยืนยันแล้ว</p>
                    <p className="text-3xl font-bold">
                      {/* นับจำนวนการจองทั้งหมดที่มีสถานะ confirmed */}
                      {[...reservations, ...lockerReservations].filter(r => r.status === 'confirmed').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            {/* การ์ดแสดงจำนวนการจองที่รอยืนยัน */}
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">รอยืนยัน</p>
                    <p className="text-3xl font-bold">
                      {/* นับจำนวนการจองทั้งหมดที่มีสถานะ pending */}
                      {[...reservations, ...lockerReservations].filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ส่วนหัวหลักของหน้า */}
          <div className="text-center space-y-4 py-8">
            {/* ไอคอนปฏิทินในวงกลม */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            {/* หัวข้อหลักพร้อม gradient text */}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการการจอง
            </h1>
            {/* คำอธิบายหน้า */}
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              จัดการการจองสระว่ายน้ำและตู้เก็บของ ตรวจสอบสถานะ และอนุมัติการจอง
            </p>
          </div>

          {/* ส่วนค้นหาและกรองข้อมูล */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Search className="h-5 w-5" />
                ค้นหาและกรองข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* ช่องค้นหาข้อความ */}
                <div className="space-y-2">
                  <Label htmlFor="search">ค้นหา</Label>
                  <Input
                    id="search"
                    placeholder="ค้นหาชื่อสมาชิก, สระ, หรือตู้เก็บของ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                {/* ตัวกรองสถานะ */}
                <div className="space-y-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="pending">รอยืนยัน</SelectItem>
                      <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* ตัวกรองวันที่ */}
                <div className="space-y-2">
                  <Label htmlFor="date">วันที่</Label>
                  <Input
                    id="date"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                {/* ปุ่มสร้างการจองใหม่ */}
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        สร้างการจอง
                      </Button>
                    </DialogTrigger>
                    {/* เนื้อหาของ Dialog สำหรับสร้างการจองใหม่ */}
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>สร้างการจองใหม่</DialogTitle>
                        <DialogDescription>
                          กรอกข้อมูลการจองสระว่ายน้ำ
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* เลือกสมาชิก */}
                        <div className="space-y-2">
                          <Label htmlFor="user">สมาชิก</Label>
                          <Select value={newReservation.user_id} onValueChange={(value) => setNewReservation({...newReservation, user_id: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสมาชิก" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.first_name} {user.last_name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* เลือกสระว่ายน้ำ */}
                        <div className="space-y-2">
                          <Label htmlFor="pool">สระว่ายน้ำ</Label>
                          <Select value={newReservation.pool_id} onValueChange={(value) => setNewReservation({...newReservation, pool_id: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสระ" />
                            </SelectTrigger>
                            <SelectContent>
                              {pools.map((pool) => (
                                <SelectItem key={pool.id} value={pool.id.toString()}>
                                  {pool.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* เลือกวันที่จอง */}
                        <div className="space-y-2">
                          <Label htmlFor="date">วันที่</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newReservation.reservation_date}
                            onChange={(e) => setNewReservation({...newReservation, reservation_date: e.target.value})}
                          />
                        </div>
                        {/* เลือกเวลาเริ่มต้นและสิ้นสุด */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_time">เวลาเริ่ม</Label>
                            <Input
                              id="start_time"
                              type="time"
                              value={newReservation.start_time}
                              onChange={(e) => setNewReservation({...newReservation, start_time: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end_time">เวลาสิ้นสุด</Label>
                            <Input
                              id="end_time"
                              type="time"
                              value={newReservation.end_time}
                              onChange={(e) => setNewReservation({...newReservation, end_time: e.target.value})}
                            />
                          </div>
                        </div>
                        {/* เลือกวิธีการชำระเงิน */}
                        <div className="space-y-2">
                          <Label htmlFor="payment_method">วิธีการชำระเงิน</Label>
                          <Select value={newReservation.payment_method} onValueChange={(value) => setNewReservation({...newReservation, payment_method: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกวิธีการชำระ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">เงินสด</SelectItem>
                              <SelectItem value="transfer">โอนเงิน</SelectItem>
                              <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* ช่องหมายเหตุ */}
                        <div className="space-y-2">
                          <Label htmlFor="notes">หมายเหตุ</Label>
                          <Input
                            id="notes"
                            placeholder="หมายเหตุเพิ่มเติม..."
                            value={newReservation.notes}
                            onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})}
                          />
                        </div>
                        {/* ช่องอัปโหลดสลิป (แสดงเมื่อเลือกโอนเงิน) */}
                        {newReservation.payment_method === "transfer" && (
                          <div className="space-y-2">
                            <Label htmlFor="slip">สลิปการโอนเงิน</Label>
                            <Input
                              id="slip"
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                            />
                          </div>
                        )}
                      </div>
                      {/* ปุ่มยกเลิกและสร้างการจอง */}
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          ยกเลิก
                        </Button>
                        <Button onClick={handleCreateReservation} className="bg-blue-600 hover:bg-blue-700">
                          สร้างการจอง
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* แสดงตัวกรองที่ใช้งานอยู่ */}
              {(searchTerm || statusFilter !== "all" || dateFilter) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-gray-600">ตัวกรองที่ใช้:</span>
                  {/* แสดง Badge สำหรับคำค้นหา */}
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ค้นหา: {searchTerm}
                    </Badge>
                  )}
                  {/* แสดง Badge สำหรับตัวกรองสถานะ */}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      สถานะ: {getStatusText(statusFilter)}
                    </Badge>
                  )}
                  {/* แสดง Badge สำหรับตัวกรองวันที่ */}
                  {dateFilter && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      วันที่: {dateFilter}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* แท็บสำหรับแสดงรายการการจอง */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5" />
                รายการการจอง
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tabs สำหรับแยกประเภทการจอง */}
              <Tabs defaultValue="pools" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-50 m-6 mb-0">
                  {/* แท็บการจองสระว่ายน้ำ */}
                  <TabsTrigger value="pools" className="flex items-center gap-2">
                    <Waves className="h-4 w-4" />
                    การจองสระว่ายน้ำ
                    {/* แสดงจำนวนการจองสระที่กรองแล้ว */}
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                      {filteredReservations.length}
                    </Badge>
                  </TabsTrigger>
                  {/* แท็บการจองตู้เก็บของ */}
                  <TabsTrigger value="lockers" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    การจองตู้เก็บของ
                    {/* แสดงจำนวนการจองตู้เก็บของที่กรองแล้ว */}
                    <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                      {filteredLockerReservations.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* เนื้อหาแท็บการจองสระว่ายน้ำ */}
                <TabsContent value="pools" className="p-6 pt-4">
                  {/* ตารางแสดงข้อมูลการจองสระ */}
                  <ReservationTable
                    data={filteredReservations}
                    type="pool"
                    onUpdateStatus={handleUpdateReservationStatus}
                    onDelete={handleDeleteReservation}
                    getStatusBadgeVariant={getStatusBadgeVariant}
                    getStatusText={getStatusText}
                    getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
                    getPaymentStatusText={getPaymentStatusText}
                    getPaymentMethodText={getPaymentMethodText}
                  />
                </TabsContent>

                {/* เนื้อหาแท็บการจองตู้เก็บของ */}
                <TabsContent value="lockers" className="p-6 pt-4">
                  {/* ตารางแสดงข้อมูลการจองตู้เก็บของ */}
                  <ReservationTable
                    data={filteredLockerReservations}
                    type="locker"
                    onUpdateStatus={handleUpdateLockerReservationStatus}
                    onDelete={handleDeleteLockerReservation}
                    getStatusBadgeVariant={getStatusBadgeVariant}
                    getStatusText={getStatusText}
                    getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
                    getPaymentStatusText={getPaymentStatusText}
                    getPaymentMethodText={getPaymentMethodText}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
