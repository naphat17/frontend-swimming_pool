"use client" // บอกให้ Next.js รู้ว่านี่เป็น Client Component

// นำเข้า React hooks และ Next.js utilities
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// นำเข้า components สำหรับ layout และ authentication
import AdminLayout from "@/components/admin-layout"
import { useAuth } from "@/components/auth-provider"

// นำเข้า UI components จาก shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Loader2, Calendar as CalendarIcon, Lock, LockOpen, Shield, Settings, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns" // สำหรับจัดรูปแบบวันที่
import { cn } from "@/lib/utils" // utility function สำหรับรวม className
import { Badge } from "@/components/ui/badge"

// Interface สำหรับข้อมูลตู้เก็บของ
interface Locker {
  id: number // รหัสตู้เก็บของ
  code: string // รหัสตู้ (เช่น A1, B2)
  location: string // ตำแหน่งของตู้
  status: 'available' | 'maintenance' | 'unavailable' // สถานะตู้: พร้อมใช้งาน | ซ่อมบำรุง | ไม่ว่าง
  created_at: string // วันที่สร้าง
  updated_at: string // วันที่อัปเดตล่าสุด
  is_reserved_on_selected_date?: boolean // ตรวจสอบว่าตู้ถูกจองในวันที่เลือกหรือไม่
}

// Interface สำหรับข้อมูลการจองตู้เก็บของ
interface ReservationInfo {
  user_name: string // ชื่อผู้จอง
  user_email: string // อีเมลผู้จอง
  reservation_date: string // วันที่จอง
  locker_code: string // รหัสตู้ที่จอง
}



export default function AdminLockersPage() {
  // State สำหรับจัดการข้อมูลตู้เก็บของ
  const [lockers, setLockers] = useState<Locker[]>([]) // รายการตู้เก็บของทั้งหมด
  const [loading, setLoading] = useState(true) // สถานะการโหลดข้อมูล
  const [dialogOpen, setDialogOpen] = useState(false) // สถานะการเปิด/ปิด dialog สำหรับเพิ่ม/แก้ไขตู้
  const [currentLocker, setCurrentLocker] = useState<Locker | null>(null) // ตู้ที่กำลังแก้ไข
  
  // State สำหรับ form ข้อมูลตู้เก็บของ
  const [formCode, setFormCode] = useState("") // รหัสตู้ในฟอร์ม
  const [formLocation, setFormLocation] = useState("") // ตำแหน่งตู้ในฟอร์ม
  const [formStatus, setFormStatus] = useState<'available' | 'maintenance' | 'unavailable'>('available') // สถานะตู้ในฟอร์ม
  const [submitting, setSubmitting] = useState(false) // สถานะการส่งข้อมูล
  
  // State สำหรับการเลือกวันที่และการจอง
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()) // วันที่ที่เลือกดู
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false) // สถานะการเปิด/ปิด dialog ข้อมูลการจอง
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo | null>(null) // ข้อมูลการจอง
  const [loadingReservation, setLoadingReservation] = useState(false) // สถานะการโหลดข้อมูลการจอง
  
  // State สำหรับการตั้งราคา
  const [priceDialogOpen, setPriceDialogOpen] = useState(false) // สถานะการเปิด/ปิด dialog ตั้งราคา
  const [currentPrice, setCurrentPrice] = useState("30") // ราคาปัจจุบัน
  const [settingPrice, setSettingPrice] = useState(false) // สถานะการตั้งราคา

  // Hooks สำหรับ toast notification, authentication และ navigation
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // ตรวจสอบสิทธิ์ผู้ใช้ - ต้องเป็น admin เท่านั้น
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "ไม่มีสิทธิ์เข้าถึง",
        description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ",
        variant: "destructive",
      })
      router.push('/login')
      return
    }
  }, [user, authLoading, router, toast])

  // เมื่อเปลี่ยนวันที่ที่เลือก ให้โหลดข้อมูลตู้เก็บของใหม่
  useEffect(() => {
    if (selectedDate) {
      fetchLockers(selectedDate)
    }
  }, [selectedDate])



  // ฟังก์ชันดึงข้อมูลตู้เก็บของจาก API ตามวันที่ที่เลือก
  const fetchLockers = async (date: Date) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const formattedDate = format(date, "yyyy-MM-dd") // จัดรูปแบบวันที่
      const response = await fetch(`https://backend-l7q9.onrender.com/api/lockers?date=${formattedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLockers(data.lockers || []) // อัปเดตรายการตู้เก็บของ
      } else if (response.status === 403) {
        // กรณีไม่มีสิทธิ์เข้าถึง
        toast({
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ",
          variant: "destructive",
        })
        router.push('/login')
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลตู้เก็บของได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching lockers:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันดึงข้อมูลการจองตู้เก็บของ
  const fetchReservationInfo = async (lockerId: number, date: Date) => {
    setLoadingReservation(true)
    try {
      const token = localStorage.getItem("token")
      const formattedDate = format(date, "yyyy-MM-dd")
      const url = `https://backend-l7q9.onrender.com/api/lockers/${lockerId}/reservation?date=${formattedDate}`
      console.log('Fetching reservation from URL:', url)
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Reservation data:', data)
        setReservationInfo(data.reservation) // เก็บข้อมูลการจอง
        setReservationDialogOpen(true) // เปิด dialog แสดงข้อมูลการจอง
      } else {
        const errorData = await response.text()
        console.log('Error response:', errorData)
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลการจองได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching reservation info:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoadingReservation(false)
    }
  }

  // ฟังก์ชันจัดการเมื่อคลิกที่ตู้เก็บของ
  const handleLockerClick = (locker: Locker) => {
    console.log('Locker clicked:', locker)
    console.log('Is reserved:', locker.is_reserved_on_selected_date)
    console.log('Selected date:', selectedDate)
    // ถ้าตู้ถูกจองในวันที่เลือก ให้แสดงข้อมูลการจอง
    if (locker.is_reserved_on_selected_date && selectedDate) {
      console.log('Fetching reservation info for locker:', locker.id)
      fetchReservationInfo(locker.id, selectedDate)
    } else {
      console.log('Locker is not reserved or no date selected')
    }
  }

  // ฟังก์ชันปิด dialog ข้อมูลการจอง
  const handleCloseReservationDialog = () => {
    setReservationDialogOpen(false)
    setReservationInfo(null) // ล้างข้อมูลการจอง
  }

  // ฟังก์ชันตั้งราคาตู้เก็บของ
  const handleSetPrice = async () => {
    console.log("=== handleSetPrice START ===")
    console.log("handleSetPrice called with currentPrice:", currentPrice)
    console.log("settingPrice:", settingPrice)
    console.log("parseFloat(currentPrice):", parseFloat(currentPrice))
    console.log("validation check:", !currentPrice || isNaN(parseFloat(currentPrice)) || parseFloat(currentPrice) < 0)
    
    // ตรวจสอบความถูกต้องของราคา
    if (!currentPrice || isNaN(parseFloat(currentPrice)) || parseFloat(currentPrice) < 0) {
      console.log("Validation failed, returning early")
      return
    }
    
    console.log("Setting settingPrice to true")
    setSettingPrice(true) // เริ่มกระบวนการตั้งราคา
    try {
      const token = localStorage.getItem("token")
      console.log("Token:", token ? "exists" : "missing")
      
      // ส่งคำขอ API เพื่ออัปเดตราคา
      const response = await fetch(`https://backend-l7q9.onrender.com/api/settings/locker_price`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          value: currentPrice
        }),
      })
      
      console.log("Response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("Success response:", responseData)
        toast({
          title: "สำเร็จ",
          description: `ตั้งราคาตู้เก็บของเป็น ${currentPrice} บาทต่อวันเรียบร้อยแล้ว`,
        })
        setPriceDialogOpen(false) // ปิด dialog
      } else {
        const errorData = await response.json()
        console.log("Error response:", errorData)
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถตั้งราคาได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting price:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      console.log("Setting settingPrice to false")
      setSettingPrice(false) // สิ้นสุดกระบวนการตั้งราคา
    }
  }

  // ฟังก์ชันดึงราคาปัจจุบันของตู้เก็บของ
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch(`https://backend-l7q9.onrender.com/api/settings/locker_price`)
      if (response.ok) {
        const data = await response.json()
        setCurrentPrice(data.value || "30") // ตั้งราคาเริ่มต้นเป็น 30 บาทถ้าไม่มีข้อมูล
      }
    } catch (error) {
      console.error("Error fetching current price:", error)
    }
  }

  // ฟังก์ชันเปิด dialog ตั้งราคา
  const handleOpenPriceDialog = () => {
    fetchCurrentPrice() // ดึงราคาปัจจุบันก่อนเปิด dialog
    setPriceDialogOpen(true)
  }

  // ฟังก์ชันเปิด dialog สำหรับเพิ่ม/แก้ไขตู้เก็บของ
  const handleOpenDialog = (locker: Locker | null = null) => {
    setCurrentLocker(locker) // ตั้งค่าตู้ที่กำลังแก้ไข (null = เพิ่มใหม่)
    setFormCode(locker ? locker.code : "") // ตั้งค่ารหัสตู้ในฟอร์ม
    setFormLocation(locker ? locker.location : "") // ตั้งค่าตำแหน่งในฟอร์ม
    setFormStatus(locker ? locker.status : 'available') // ตั้งค่าสถานะในฟอร์ม
    setDialogOpen(true)
  }

  // ฟังก์ชันปิด dialog และล้างข้อมูลฟอร์ม
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setCurrentLocker(null) // ล้างตู้ที่กำลังแก้ไข
    setFormCode("") // ล้างรหัสตู้
    setFormLocation("") // ล้างตำแหน่ง
    setFormStatus('available') // รีเซ็ตสถานะเป็นพร้อมใช้งาน
  }

  // ฟังก์ชันส่งข้อมูลฟอร์ม (เพิ่ม/แก้ไขตู้เก็บของ)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true) // เริ่มกระบวนการส่งข้อมูล
    const token = localStorage.getItem("token")

    // กำหนด method และ URL ตามว่าเป็นการเพิ่มใหม่หรือแก้ไข
    const method = currentLocker ? "PUT" : "POST"
    const url = currentLocker ? `https://backend-l7q9.onrender.com/api/lockers/${currentLocker.id}` : "https://backend-l7q9.onrender.com/api/lockers"

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: formCode, location: formLocation, status: formStatus }),
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: `ตู้เก็บของถูก${currentLocker ? "อัปเดต" : "เพิ่ม"}เรียบร้อยแล้ว`,
        })
        handleCloseDialog() // ปิด dialog
        if (selectedDate) {
          fetchLockers(selectedDate) // โหลดข้อมูลตู้เก็บของใหม่
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถดำเนินการได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting locker:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false) // สิ้นสุดกระบวนการส่งข้อมูล
    }
  }

  // ฟังก์ชันตั้งค่าตู้เก็บของทั้งหมดให้พร้อมใช้งาน
  const handleSetAllAvailable = async () => {
    // ขอยืนยันจากผู้ใช้ก่อนดำเนินการ
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการตั้งค่าตู้เก็บของทั้งหมดให้พร้อมใช้งาน?")) return

    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      // ส่งคำขอ API เพื่ออัปเดตสถานะตู้ทั้งหมด
      const response = await fetch("https://backend-l7q9.onrender.com/api/lockers/bulk/set-available", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "สำเร็จ",
          description: `ตู้เก็บของทั้งหมดพร้อมใช้งานแล้ว (อัปเดต ${data.updated_count} ตู้)`,
        })
        if (selectedDate) {
          fetchLockers(selectedDate) // โหลดข้อมูลใหม่
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถอัปเดตสถานะตู้ได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting all lockers available:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันลบตู้เก็บของ
  const handleDelete = async (id: number) => {
    // ขอยืนยันจากผู้ใช้ก่อนลบ
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/lockers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "ตู้เก็บของถูกลบเรียบร้อยแล้ว",
        })
        if (selectedDate) {
          fetchLockers(selectedDate) // โหลดข้อมูลใหม่หลังลบ
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถลบได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting locker:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }



  // ฟังก์ชันกำหนดไอคอนตามสถานะตู้เก็บของ
  const getLockerIcon = (status: string) => {
    switch (status) {
      case 'available':
        return LockOpen // ไอคอนแม่กุญแจเปิด (พร้อมใช้งาน)
      case 'maintenance':
        return Settings // ไอคอนเฟือง (ซ่อมบำรุง)
      default:
        return Lock // ไอคอนแม่กุญแจปิด (เริ่มต้น)
    }
  }

  // ฟังก์ชันกำหนดสีตามสถานะตู้เก็บของ
  const getLockerColor = (status: string, isReserved?: boolean) => {
    if (isReserved) {
      return 'bg-red-400 text-white cursor-not-allowed' // สีแดง (ถูกจอง)
    }
    switch (status) {
      case 'available':
        return 'bg-green-400 hover:bg-green-500 text-white' // สีเขียว (พร้อมใช้งาน)
      case 'maintenance':
        return 'bg-yellow-400 hover:bg-yellow-500 text-gray-800' // สีเหลือง (ซ่อมบำรุง)
      case 'unavailable':
        return 'bg-gray-400 text-gray-600 cursor-not-allowed' // สีเทา (ไม่ว่าง)
      default:
        return 'bg-gray-300 text-gray-600' // สีเทาอ่อน (เริ่มต้น)
    }
  }

  // แสดงหน้าจอ loading ขณะโหลดข้อมูล
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    )
  }

  // ส่วนหลักของ component
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* หัวข้อหน้าและคำอธิบาย */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการตู้เก็บของ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เพิ่ม แก้ไข และดูสถานะตู้เก็บของ
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* ส่วนเลือกวันที่และปุ่มต่างๆ */}
            <div className="flex justify-between items-center mb-6">
              {/* ปุ่มเลือกวันที่ */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>เลือกวันที่</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {/* กลุ่มปุ่มจัดการ */}
              <div className="flex gap-3">
                {/* ปุ่มตั้งค่าทั้งหมดให้พร้อมใช้งาน */}
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white" 
                  onClick={handleSetAllAvailable}
                  disabled={loading}
                >
                  <LockOpen className="h-4 w-4 mr-2" />
                  ตู้เก็บของพร้อมใช้งานทุกตู้
                </Button>
                {/* ปุ่มตั้งราคา */}
                <Button 
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white" 
                  onClick={handleOpenPriceDialog}
                  disabled={loading}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  ตั้งราคาตู้เก็บของ
                </Button>
                {/* ปุ่มเพิ่มตู้ใหม่ */}
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มตู้ใหม่
                </Button>
              </div>
            </div>

            {/* การ์ดแสดงตู้เก็บของทั้งหมด */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>ตู้เก็บของทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                {/* กริดแสดงตู้เก็บของ */}
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-8">
                  {/* แสดงรายการตู้เก็บของ เรียงตามรหัสตู้ */}
                  {lockers
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((locker) => {
                    const IconComponent = getLockerIcon(locker.status)
                    const isReserved = locker.is_reserved_on_selected_date
                    return (
                      <div key={locker.id} className="text-center">
                        {/* ตัวตู้เก็บของ */}
                        <div
                          className={`w-28 h-36 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 ${getLockerColor(locker.status, isReserved)} ${isReserved ? 'cursor-pointer' : ''}`}
                          onClick={() => handleLockerClick(locker)}
                        >
                          <IconComponent className="h-10 w-10 mb-2" />
                          <span className="font-bold text-xl">{locker.code}</span>
                        </div>
                        {/* ปุ่มแก้ไขและลบ */}
                        <div className="mt-2">
                          <div className="flex justify-center space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(locker)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(locker.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog สำหรับเพิ่ม/แก้ไขตู้เก็บของ */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {currentLocker ? "แก้ไขตู้เก็บของ" : "เพิ่มตู้เก็บของใหม่"}
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600">
                {currentLocker ? "แก้ไขข้อมูลตู้เก็บของ" : "เพิ่มตู้เก็บของใหม่เข้าสู่ระบบ"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ฟิลด์รหัสตู้เก็บของ */}
              <div className="space-y-3">
                <Label htmlFor="code" className="text-lg font-semibold">
                  รหัสตู้เก็บของ
                </Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="เช่น A1, B2, C3"
                  required
                />
              </div>
              {/* ฟิลด์ตำแหน่งตู้ */}
              <div className="space-y-3">
                <Label htmlFor="location" className="text-lg font-semibold">
                  ตำแหน่ง
                </Label>
                <Input
                  id="location"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="เช่น ชั้น 1 ฝั่งซ้าย"
                  required
                />
              </div>
              {/* ฟิลด์สถานะตู้ */}
              <div className="space-y-3">
                <Label htmlFor="status" className="text-lg font-semibold">
                  สถานะ
                </Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'available' | 'maintenance' | 'unavailable')}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available" className="text-lg">พร้อมใช้งาน</SelectItem>
                    <SelectItem value="maintenance" className="text-lg">ซ่อมบำรุง</SelectItem>
                    <SelectItem value="unavailable" className="text-lg">ไม่ว่าง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* ปุ่มยกเลิกและบันทึก */}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" size="lg" className="px-8 py-3 text-lg" onClick={handleCloseDialog}>
                  ยกเลิก
                </Button>
                <Button type="submit" size="lg" className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {currentLocker ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มตู้เก็บของ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog สำหรับตั้งราคาตู้เก็บของ */}
        <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                ตั้งราคาตู้เก็บของ
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600">
                กำหนดราคาตู้เก็บของต่อวัน (บาท)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* ฟิลด์ราคาต่อวัน */}
              <div className="space-y-3">
                <Label htmlFor="price" className="text-lg font-semibold">
                  ราคาต่อวัน (บาท)
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="กรอกราคาต่อวัน"
                  className="text-lg"
                />
              </div>
            </div>
            {/* ปุ่มยกเลิกและบันทึกราคา */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPriceDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  console.log("Button clicked!")
                  console.log("Current state - settingPrice:", settingPrice, "currentPrice:", currentPrice)
                  console.log("currentPrice type:", typeof currentPrice)
                  console.log("parseFloat(currentPrice):", parseFloat(currentPrice))
                  console.log("isNaN check:", isNaN(parseFloat(currentPrice)))
                  console.log("Button disabled?", settingPrice || !currentPrice || isNaN(parseFloat(currentPrice)) || parseFloat(currentPrice) < 0)
                  handleSetPrice()
                }}
                disabled={settingPrice || !currentPrice || isNaN(parseFloat(currentPrice)) || parseFloat(currentPrice) < 0}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white"
              >
                {settingPrice ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกราคา"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog สำหรับแสดงข้อมูลการจอง */}
        <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                ข้อมูลการจองตู้เก็บของ
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600">
                รายละเอียดการจองของผู้ใช้
              </DialogDescription>
            </DialogHeader>
            {/* แสดงข้อมูลการจองหรือสถานะการโหลด */}
            {loadingReservation ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : reservationInfo ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">รหัสตู้</Label>
                  <p className="text-lg font-semibold">{reservationInfo.locker_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">ชื่อผู้จอง</Label>
                  <p className="text-lg">{reservationInfo.user_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">อีเมล</Label>
                  <p className="text-lg">{reservationInfo.user_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">วันที่จอง</Label>
                  <p className="text-lg">{format(new Date(reservationInfo.reservation_date), "dd/MM/yyyy")}</p>
                </div>
              </div>
            ) : (
              <p>ไม่พบข้อมูลการจอง</p>
            )}
            {/* ปุ่มปิด Dialog */}
            <DialogFooter>
              <Button type="button" onClick={handleCloseReservationDialog}>
                ปิด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  )
}

// ส่งออก component เป็น default export สำหรับใช้งานในหน้าอื่น
