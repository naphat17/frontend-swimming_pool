"use client" // ใช้ Client Component เพื่อให้สามารถใช้ React hooks และ state ได้

import { useEffect, useState } from "react" // React hooks สำหรับจัดการ state และ lifecycle
import { useAuth } from "@/components/auth-provider" // Hook สำหรับจัดการ authentication
import { useRouter } from "next/navigation" // Next.js router สำหรับ navigation
import AdminLayout from "@/components/admin-layout" // Layout component สำหรับหน้า admin
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Card components สำหรับแสดงข้อมูล
import { Button } from "@/components/ui/button" // Button component
import { Input } from "@/components/ui/input" // Input component สำหรับรับข้อมูล
import { Badge } from "@/components/ui/badge" // Badge component สำหรับแสดงสถานะ
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Select dropdown components
import { useToast } from "@/hooks/use-toast" // Hook สำหรับแสดง toast notifications
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // Table components สำหรับแสดงข้อมูลในรูปแบบตาราง
import { Search, Check, X, DollarSign, AlertCircle, Settings, TrendingUp, Users, Package, Waves, FileX, MessageSquare } from "lucide-react" // Icons จาก Lucide React
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog" // Dialog components สำหรับ modal
import { Label } from "@/components/ui/label" // Label component สำหรับ form labels
import { Textarea } from "@/components/ui/textarea" // Textarea component สำหรับข้อความยาว
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Tabs components สำหรับแสดงข้อมูลแบบแท็บ

// Interface สำหรับกำหนดโครงสร้างข้อมูลการชำระเงิน
interface Payment {
  id: number // รหัสการชำระเงิน
  user_name: string // ชื่อผู้ใช้
  user_email: string // อีเมลผู้ใช้
  amount: number // จำนวนเงิน
  status: string // สถานะการชำระเงิน (pending, completed, failed, refunded)
  payment_method: string // วิธีการชำระเงิน (credit_card, bank_transfer, cash)
  transaction_id: string // รหัสอ้างอิงการทำรายการ
  created_at: string // วันที่สร้างรายการ
  membership_type?: string // ประเภทสมาชิกภาพ (optional)
  notes?: string // หมายเหตุ (optional)
  slip_url?: string // URL ของสลิปการโอนเงิน (optional)
  payment_type: string // ประเภทการชำระเงิน (การจองสระว่ายน้ำ, การจองตู้เก็บของ, สมาชิกรายปี)
}

// Component หลักสำหรับหน้าจัดการการชำระเงินของ Admin
export default function AdminPaymentsPage() {
  const { user } = useAuth() // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const router = useRouter() // Router สำหรับ navigation
  const [payments, setPayments] = useState<Payment[]>([]) // State เก็บรายการการชำระเงินทั้งหมด
  const [loading, setLoading] = useState(true) // State สำหรับแสดงสถานะ loading
  const [searchTerm, setSearchTerm] = useState("") // State สำหรับคำค้นหา
  const [statusFilter, setStatusFilter] = useState("all") // State สำหรับกรองตามสถานะ
  const [dateFilter, setDateFilter] = useState("all") // State สำหรับกรองตามวันที่
  const { toast } = useToast() // Hook สำหรับแสดง toast notifications
  const [priceDialogOpen, setPriceDialogOpen] = useState(false) // State สำหรับเปิด/ปิด dialog แก้ไขราคา
  const [userCategories, setUserCategories] = useState<any[]>([]) // State เก็บข้อมูลประเภทผู้ใช้
  const [selectedCategory, setSelectedCategory] = useState<any>(null) // State เก็บประเภทผู้ใช้ที่เลือก
  const [newAnnualPrice, setNewAnnualPrice] = useState('') // State สำหรับราคาสมาชิกรายปีใหม่
  const [newSessionPrice, setNewSessionPrice] = useState('') // State สำหรับราคาต่อครั้งใหม่

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false) // State สำหรับเปิด/ปิด dialog ยืนยัน
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null) // State เก็บการชำระเงินที่เลือก
  const [confirmationAction, setConfirmationAction] = useState<"completed" | "failed" | "refunded" | null>(null) // State เก็บการกระทำที่จะดำเนินการ




  // ฟังก์ชันสำหรับแปลงจำนวนเงินให้เป็นตัวเลขที่ถูกต้อง เพื่อใช้ในการคำนวณและแสดงผล
  const normalizeAmount = (amount: unknown) => {
    const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? 0)) // แปลงเป็นตัวเลข
    return Number.isFinite(n) ? n : 0 // ตรวจสอบว่าเป็นตัวเลขที่ถูกต้อง ถ้าไม่ใช่ให้คืนค่า 0
  }

  // useEffect สำหรับตรวจสอบสิทธิ์และโหลดข้อมูลเมื่อ component mount หรือเมื่อ dependencies เปลี่ยนแปลง
  useEffect(() => {
    if (user && user.role !== "admin") { // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
      router.push("/dashboard") // ถ้าไม่ใช่ admin ให้ redirect ไปหน้า dashboard
      return
    }

    fetchPayments() // โหลดข้อมูลการชำระเงิน
    fetchUserCategories() // โหลดข้อมูลประเภทผู้ใช้
  }, [user, router, statusFilter, dateFilter]) // dependencies ที่จะทำให้ useEffect ทำงานใหม่เมื่อมีการเปลี่ยนแปลง



  // ฟังก์ชันสำหรับดึงข้อมูลการชำระเงินจาก API
  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token") // ดึง authentication token จาก localStorage
      
      if (!token) { // ตรวจสอบว่ามี token หรือไม่
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please login again.",
          variant: "destructive",
        })
        router.push("/login") // redirect ไปหน้า login
        return
      }
      
      const queryParams = new URLSearchParams() // สร้าง query parameters
      if (dateFilter !== "all") {
        queryParams.append("dateFilter", dateFilter) // เพิ่ม date filter ถ้ามีการเลือก
      }

      const url = `https://backend-l7q9.onrender.com/api/admin/payments?${queryParams.toString()}` // สร้าง URL สำหรับ API call
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })

      if (response.ok) { // ถ้า response สำเร็จ
        const data = await response.json()
        setPayments(data.payments || []) // อัปเดต state ด้วยข้อมูลที่ได้รับ
      } else if (response.status === 401 || response.status === 403) { // ถ้า authentication ล้มเหลว
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        })
        localStorage.removeItem("token") // ลบ token ที่หมดอายุ
        router.push("/login") // redirect ไปหน้า login
      } else { // ถ้ามี error อื่นๆ
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        toast({
          title: "Error",
          description: `Failed to fetch payments: ${errorData.message || response.statusText}`,
          variant: "destructive",
        })
      }
    } catch (error) { // จัดการ network errors
      console.error("Error fetching payments:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please check if the API server is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false) // ปิดสถานะ loading
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลประเภทผู้ใช้จาก API
  const fetchUserCategories = async () => {
    try {
      const token = localStorage.getItem("token") // ดึง authentication token
      
      if (!token) { // ถ้าไม่มี token ให้หยุดการทำงาน
        return
      }
      
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/user-categories", {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })

      if (response.ok) { // ถ้า response สำเร็จ
        const data = await response.json()
        setUserCategories(data.categories || []) // อัปเดต state ด้วยข้อมูลประเภทผู้ใช้
      } else if (response.status === 401 || response.status === 403) { // ถ้า authentication ล้มเหลว
        console.log("Authentication failed for user categories")
      }
    } catch (error) { // จัดการ errors
      console.error("Error fetching user categories:", error)
    }
  }





  // ฟังก์ชันสำหรับอัปเดตราคาของประเภทผู้ใช้
  const handleUpdateCategoryPrice = async () => {
    if (!selectedCategory) return // ตรวจสอบว่ามีการเลือกประเภทผู้ใช้หรือไม่

    try {
      const token = localStorage.getItem("token") // ดึง authentication token
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/user-categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ส่ง token ใน header
        },
        body: JSON.stringify({ // ส่งข้อมูลราคาใหม่
          annual_price: parseFloat(newAnnualPrice), // ราคาสมาชิกรายปี
          pay_per_session_price: parseFloat(newSessionPrice) // ราคาต่อครั้ง
        }),
      })

      if (response.ok) { // ถ้าอัปเดตสำเร็จ
        toast({
          title: "อัปเดตราคาสำเร็จ",
          description: `ราคาสำหรับ ${selectedCategory.name} ได้รับการอัปเดตแล้ว`,
        })
        fetchUserCategories() // โหลดข้อมูลประเภทผู้ใช้ใหม่
        setPriceDialogOpen(false) // ปิด dialog
        setSelectedCategory(null) // รีเซ็ตการเลือกประเภท
        setNewAnnualPrice('') // รีเซ็ตราคารายปี
        setNewSessionPrice('') // รีเซ็ตราคาต่อครั้ง
      } else { // ถ้ามี error
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตราคาได้",
          variant: "destructive",
        })
      }
    } catch (error) { // จัดการ network errors
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตราคาได้",
        variant: "destructive",
      })
    }
  }

  // ฟังก์ชันสำหรับเปิด dialog แก้ไขราคาประเภทผู้ใช้
  const openCategoryPriceDialog = (category: any) => {
    setSelectedCategory(category) // เซ็ตประเภทที่เลือก
    setNewAnnualPrice(String(category.annual_price)) // เซ็ตราคารายปีปัจจุบัน
    setNewSessionPrice(String(category.pay_per_session_price)) // เซ็ตราคาต่อครั้งปัจจุบัน
    setPriceDialogOpen(true) // เปิด dialog
  }

  // ฟังก์ชันสำหรับเปิด dialog ยืนยันการดำเนินการกับการชำระเงิน
  const openConfirmationDialog = (payment: Payment, action: "completed" | "failed" | "refunded") => {
    setSelectedPayment(payment) // เซ็ตการชำระเงินที่เลือก
    setConfirmationAction(action) // เซ็ตการกระทำที่จะดำเนินการ (สำเร็จ/ไม่สำเร็จ/คืนเงิน)
    setConfirmationDialogOpen(true) // เปิด dialog ยืนยัน
  }



  // ฟังก์ชันสำหรับยืนยันและอัปเดตสถานะการชำระเงิน
  const handleConfirmPayment = async () => {
    if (!selectedPayment || !confirmationAction) return // ตรวจสอบว่ามีการเลือกการชำระเงินและการกระทำ

    try {
      const token = localStorage.getItem("token") // ดึง authentication token
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/payments/${selectedPayment.id}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ส่ง token ใน header
        },
        body: JSON.stringify({ status: confirmationAction }), // ส่งสถานะใหม่
      })

      if (response.ok) { // ถ้าอัปเดตสำเร็จ
        toast({
          title: "อัปเดตสถานะสำเร็จ",
          description: `สถานะการชำระเงินได้รับการเปลี่ยนเป็น ${getStatusText(confirmationAction)}`,
        })
        fetchPayments() // โหลดข้อมูลการชำระเงินใหม่
      } else { // ถ้ามี error
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตสถานะได้",
          variant: "destructive",
        })
      }
    } catch (error) { // จัดการ network errors
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive",
      })
    } finally { // ทำความสะอาด state เมื่อเสร็จสิ้น
      setConfirmationDialogOpen(false) // ปิด dialog
      setSelectedPayment(null) // รีเซ็ตการเลือกการชำระเงิน
      setConfirmationAction(null) // รีเซ็ตการกระทำ
    }
  }

  // ฟังก์ชันสำหรับกรองข้อมูลการชำระเงินตามเงื่อนไขการค้นหาและสถานะ
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = // ตรวจสอบว่าข้อมูลตรงกับคำค้นหาหรือไม่
      payment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || // ค้นหาจากชื่อผู้ใช้
      payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) || // ค้นหาจากอีเมล
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) || // ค้นหาจากรหัสอ้างอิง
      payment.payment_type.toLowerCase().includes(searchTerm.toLowerCase()) // ค้นหาจากประเภทการชำระเงิน

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter // ตรวจสอบว่าตรงกับสถานะที่เลือกหรือไม่

    return matchesSearch && matchesStatus // คืนค่าเฉพาะรายการที่ตรงกับทั้งสองเงื่อนไข
  })

  // ฟังก์ชันสำหรับกำหนดสีของ Badge ตามสถานะการชำระเงิน
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": // สำเร็จ - สีเขียว
        return "bg-green-100 text-green-800"
      case "pending": // รอดำเนินการ - สีเหลือง
        return "bg-yellow-100 text-yellow-800"
      case "failed": // ไม่สำเร็จ - สีแดง
        return "bg-red-100 text-red-800"
      case "refunded": // คืนเงิน - สีน้ำเงิน
        return "bg-blue-100 text-blue-800"
      default: // สถานะอื่นๆ - สีเทา
        return "bg-gray-100 text-gray-800"
    }
  }

  // ฟังก์ชันสำหรับแปลงสถานะเป็นข้อความภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": // แปลงเป็น "สำเร็จ"
        return "สำเร็จ"
      case "pending": // แปลงเป็น "รอดำเนินการ"
        return "รอดำเนินการ"
      case "failed": // แปลงเป็น "ไม่สำเร็จ"
        return "ไม่สำเร็จ"
      case "refunded": // แปลงเป็น "คืนเงิน"
        return "คืนเงิน"
      default: // คืนค่าสถานะเดิมถ้าไม่ตรงกับเงื่อนไขใดๆ
        return status
    }
  }

  // ฟังก์ชันสำหรับแปลงวิธีการชำระเงินเป็นข้อความภาษาไทย
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "credit_card": // แปลงเป็น "บัตรเครดิต"
        return "บัตรเครดิต"
      case "bank_transfer": // แปลงเป็น "โอนเงิน"
        return "โอนเงิน"
      case "cash": // แปลงเป็น "เงินสด"
        return "เงินสด"
      default: // คืนค่าวิธีการชำระเงินเดิมถ้าไม่ตรงกับเงื่อนไขใดๆ
        return method
    }
  }

  // คำนวณรายได้รวมจากการชำระเงินที่สำเร็จเท่านั้น
  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === "completed" ? normalizeAmount(p.amount) : 0), 0)

  // นับจำนวนการชำระเงินตามสถานะต่างๆ
  const pendingPayments = payments.filter((p) => p.status === "pending").length // จำนวนรายการรอดำเนินการ
  const completedPayments = payments.filter((p) => p.status === "completed").length // จำนวนรายการสำเร็จ
  const failedPayments = payments.filter((p) => p.status === "failed").length // จำนวนรายการไม่สำเร็จ
  const refundedPayments = payments.filter((p) => p.status === "refunded").length // จำนวนรายการคืนเงิน

  // คำนวณรายได้แยกตามประเภทการชำระเงิน (เฉพาะรายการที่สำเร็จ)
  const poolRevenue = payments
    .filter((p) => p.payment_type === "การจองสระว่ายน้ำ" && p.status === "completed") // กรองเฉพาะการจองสระที่สำเร็จ
    .reduce((sum, p) => sum + normalizeAmount(p.amount), 0) // รวมจำนวนเงิน

  const lockerRevenue = payments
    .filter((p) => p.payment_type === "การจองตู้เก็บของ" && p.status === "completed") // กรองเฉพาะการจองตู้ที่สำเร็จ
    .reduce((sum, p) => sum + normalizeAmount(p.amount), 0) // รวมจำนวนเงิน

  const annualMembershipRevenue = payments
    .filter((p) => p.payment_type === "สมาชิกรายปี" && p.status === "completed") // กรองเฉพาะสมาชิกรายปีที่สำเร็จ
    .reduce((sum, p) => sum + normalizeAmount(p.amount), 0) // รวมจำนวนเงิน

  // สถิติจำนวนการชำระเงินตามประเภท (ทุกสถานะ)
  const poolReservations = payments.filter((p) => p.payment_type === "การจองสระว่ายน้ำ").length // จำนวนการจองสระทั้งหมด
  const lockerPayments = payments.filter((p) => p.payment_type === "การจองตู้เก็บของ").length // จำนวนการจองตู้ทั้งหมด
  const membershipPayments = payments.filter((p) => p.payment_type.includes("สมาชิกภาพ")).length // จำนวนการชำระสมาชิกภาพทั้งหมด
  const annualMembershipPayments = payments.filter((p) => p.payment_type === "สมาชิกรายปี").length // จำนวนสมาชิกรายปีทั้งหมด

  // รายการการชำระเงินที่ผ่านการกรองแล้ว แยกตามประเภท
  const poolReservationPayments = filteredPayments.filter(p => p.payment_type === 'การจองสระว่ายน้ำ'); // รายการจองสระที่ผ่านการกรอง
  const lockerReservationPayments = filteredPayments.filter(p => p.payment_type === 'การจองตู้เก็บของ'); // รายการจองตู้ที่ผ่านการกรอง
  const annualMembershipPaymentsList = filteredPayments.filter(p => p.payment_type === 'สมาชิกรายปี'); // รายการสมาชิกรายปีที่ผ่านการกรอง

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (user?.role !== "admin") {
    return null
  }
  
  const PaymentTable = ({ payments, title, icon, color, isLoading = false }: { payments: Payment[], title: string, icon: React.ReactNode, color: string, isLoading?: boolean }) => {
    // Loading State
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">สมาชิก</TableHead>
                    <TableHead className="font-semibold text-gray-700">ประเภท</TableHead>
                    <TableHead className="font-semibold text-gray-700">จำนวนเงิน</TableHead>
                    <TableHead className="font-semibold text-gray-700">วิธีชำระ</TableHead>
                    <TableHead className="font-semibold text-gray-700">รหัสอ้างอิง</TableHead>
                    <TableHead className="font-semibold text-gray-700">สถานะ</TableHead>
                    <TableHead className="font-semibold text-gray-700">วันที่</TableHead>
                    <TableHead className="font-semibold text-gray-700">Slip</TableHead>
                    <TableHead className="font-semibold text-gray-700">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(3)].map((_, index) => (
                    <TableRow key={index} className="hover:bg-gray-50/50">
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )
    }

    // Empty State
    if (payments.length === 0) {
      return (
        <div className="text-center py-16 px-6">
          <div className="relative">
            <div className={`inline-flex items-center justify-center w-20 h-20 ${color} rounded-full mb-6 opacity-20 animate-pulse`}>
              {icon}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 ${color} rounded-full opacity-60`}>
                {icon}
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">ไม่มีข้อมูลการชำระเงิน</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            ยังไม่มีรายการชำระเงินสำหรับ{title}ในขณะนี้ 
            <br />ข้อมูลจะแสดงที่นี่เมื่อมีการชำระเงิน
          </p>
          <div className="flex justify-center space-x-4">
            <div className="flex items-center text-sm text-gray-400">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              ระบบจะอัปเดตอัตโนมัติ
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-800 py-4">สมาชิก</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">ประเภท</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">จำนวนเงิน</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">วิธีชำระ</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">รหัสอ้างอิง</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">สถานะ</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">วันที่</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">Slip</TableHead>
                <TableHead className="font-semibold text-gray-800 py-4">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment, index) => (
                <TableRow 
                  key={`${payment.id}-${payment.slip_url}`} 
                  className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:shadow-md transition-shadow`}>
                        {payment.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{payment.user_name}</div>
                        <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{payment.user_email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="text-xs font-medium border-gray-300 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105">
                      {payment.payment_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-bold text-lg text-green-600 group-hover:text-green-700 transition-colors">฿{normalizeAmount(payment.amount).toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 group-hover:text-gray-800 transition-colors font-medium">{getPaymentMethodText(payment.payment_method)}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <code className="bg-gray-100 group-hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-mono transition-colors shadow-sm">{payment.transaction_id}</code>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={`${getStatusColor(payment.status)} shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105`}>{getStatusText(payment.status)}</Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 group-hover:text-gray-800 transition-colors font-medium">{(() => {
                      if (!payment.created_at || payment.created_at === 'null' || payment.created_at.trim() === '') {
                        return 'ไม่ระบุวันที่'
                      }
                      try {
                        const dateStr = payment.created_at.toString()
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
                    })()}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex space-x-2">
                      {payment.slip_url ? (
                        <>
                          <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md" onClick={() => window.open(payment.slip_url, "_blank")}>
                            ดูสลิป
                          </Button>
                          {payment.status === "pending" && (
                             <span className="text-gray-400">รอดำเนินการ</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex space-x-2">
                      {payment.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                            onClick={() => openConfirmationDialog(payment, "completed")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                            onClick={() => openConfirmationDialog(payment, "failed")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {payment.status === "completed" && (
                        <>
                          {/* ซ่อนปุ่มคืนเงินสำหรับสมาชิกรายปี (transaction_id ขึ้นต้นด้วย ANN_) */}
                          {!payment.transaction_id.startsWith('ANN_') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                              onClick={() => openConfirmationDialog(payment, "refunded")}
                            >
                              คืนเงิน
                            </Button>
                          )}

                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-60"></div>
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
              <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>
            
            <div className="relative text-center space-y-6 py-12 px-4">
              {/* Icon with enhanced animation */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full mb-6 shadow-2xl transform hover:scale-110 transition-all duration-300 animate-bounce">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              
              {/* Enhanced title with better typography */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  จัดการการชำระเงิน
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
              </div>
              
              {/* Enhanced description */}
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium">
                ระบบจัดการและยืนยันการชำระเงินของสมาชิกอย่างมีประสิทธิภาพ
                <br />
                <span className="text-lg text-gray-500">ติดตามสถานะ อนุมัติการชำระ และจัดการรายได้ทั้งหมดในที่เดียว</span>
              </p>
              
              {/* Quick stats preview */}
              <div className="flex justify-center items-center space-x-8 mt-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>รายได้รวม ฿{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>รอดำเนินการ {pendingPayments} รายการ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>สำเร็จ {completedPayments} รายการ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-green-500 to-teal-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-green-100 group-hover:text-white transition-colors duration-300">รายได้รวม</CardTitle>
                <DollarSign className="h-6 w-6 text-green-200 group-hover:text-white group-hover:rotate-12 transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">฿{totalRevenue.toLocaleString()}</div>
                <div className="text-xs text-green-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">รายได้ทั้งหมด</div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up animation-delay-200">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-yellow-100 group-hover:text-white transition-colors duration-300">รอดำเนินการ</CardTitle>
                <AlertCircle className="h-6 w-6 text-yellow-200 group-hover:text-white group-hover:animate-pulse transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">{pendingPayments}</div>
                <div className="text-xs text-yellow-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">รายการที่รอ</div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up animation-delay-400">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-blue-100 group-hover:text-white transition-colors duration-300">สำเร็จ</CardTitle>
                <Check className="h-6 w-6 text-blue-200 group-hover:text-white group-hover:scale-125 transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">{completedPayments}</div>
                <div className="text-xs text-blue-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">รายการสำเร็จ</div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-red-500 to-pink-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up animation-delay-600">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-red-100 group-hover:text-white transition-colors duration-300">ไม่สำเร็จ</CardTitle>
                <X className="h-6 w-6 text-red-200 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">{failedPayments}</div>
                <div className="text-xs text-red-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">รายการไม่สำเร็จ</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-cyan-100 group-hover:text-white transition-colors duration-300">รายได้จากสระว่ายน้ำ</CardTitle>
                <Waves className="h-6 w-6 text-cyan-200 group-hover:text-white group-hover:animate-bounce transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">฿{poolRevenue.toLocaleString()}</div>
                <div className="text-xs text-cyan-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">จากการจองสระ</div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up animation-delay-200">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-purple-100 group-hover:text-white transition-colors duration-300">รายได้จากตู้เก็บของ</CardTitle>
                <Package className="h-6 w-6 text-purple-200 group-hover:text-white group-hover:rotate-12 transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">฿{lockerRevenue.toLocaleString()}</div>
                <div className="text-xs text-purple-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">จากการจองตู้</div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up animation-delay-400">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-emerald-100 group-hover:text-white transition-colors duration-300">รายได้จากสมาชิกรายปี</CardTitle>
                <TrendingUp className="h-6 w-6 text-emerald-200 group-hover:text-white group-hover:scale-125 transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">฿{annualMembershipRevenue.toLocaleString()}</div>
                <div className="text-sm text-emerald-100 mt-1 group-hover:text-white transition-colors duration-300">{annualMembershipPayments} รายการ</div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-gray-500 to-gray-700 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up animation-delay-600">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors duration-300">จำนวนเงินคืน</CardTitle>
                <AlertCircle className="h-6 w-6 text-gray-200 group-hover:text-white group-hover:animate-pulse transition-all duration-300" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold group-hover:scale-110 transition-transform duration-300">{refundedPayments}</div>
                <div className="text-xs text-gray-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">รายการคืนเงิน</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters Section */}
          <Card className="max-w-7xl mx-auto shadow-xl border-0 bg-gradient-to-r from-slate-50 to-gray-50 backdrop-blur-sm animate-fade-in-up animation-delay-800">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Search className="h-5 w-5 mr-2" />
                ตัวกรองและค้นหา
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Search Input - Takes more space on larger screens */}
                <div className="lg:col-span-6 xl:col-span-7">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">ค้นหาข้อมูล</Label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <Input
                      placeholder="ค้นหาชื่อสมาชิก, อีเมล, รหัสอ้างอิง, หรือประเภท..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="lg:col-span-3 xl:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">สถานะ</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-gray-200">
                      <SelectItem value="all" className="hover:bg-blue-50">ทุกสถานะ</SelectItem>
                      <SelectItem value="pending" className="hover:bg-yellow-50">รอดำเนินการ</SelectItem>
                      <SelectItem value="completed" className="hover:bg-green-50">สำเร็จ</SelectItem>
                      <SelectItem value="failed" className="hover:bg-red-50">ไม่สำเร็จ</SelectItem>
                      <SelectItem value="refunded" className="hover:bg-gray-50">คืนเงิน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date Filter */}
                <div className="lg:col-span-3 xl:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">ช่วงเวลา</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="เลือกช่วงเวลา" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-gray-200">
                      <SelectItem value="all" className="hover:bg-blue-50">ทั้งหมด</SelectItem>
                      <SelectItem value="day" className="hover:bg-blue-50">วันนี้</SelectItem>
                      <SelectItem value="week" className="hover:bg-blue-50">สัปดาห์นี้</SelectItem>
                      <SelectItem value="month" className="hover:bg-blue-50">เดือนนี้</SelectItem>
                      <SelectItem value="year" className="hover:bg-blue-50">ปีนี้</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters Button */}
                <div className="lg:col-span-12 xl:col-span-1 flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="w-full lg:w-auto h-11 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  >
                    <X className="h-4 w-4 mr-2 lg:mr-0" />
                    <span className="lg:hidden">ล้างตัวกรอง</span>
                  </Button>
                </div>
              </div>
              
              {/* Filter Summary */}
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-600 font-medium">ตัวกรองที่ใช้:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        ค้นหา: {searchTerm}
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                        สถานะ: {statusFilter === 'pending' ? 'รอดำเนินการ' : statusFilter === 'completed' ? 'สำเร็จ' : statusFilter === 'failed' ? 'ไม่สำเร็จ' : 'คืนเงิน'}
                      </Badge>
                    )}
                    {dateFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                        เวลา: {dateFilter === 'day' ? 'วันนี้' : dateFilter === 'week' ? 'สัปดาห์นี้' : dateFilter === 'month' ? 'เดือนนี้' : 'ปีนี้'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              

            </CardContent>
          </Card>

          {/* Payment Management Tabs */}
          <div className="max-w-7xl mx-auto">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-2xl font-bold">
                  <DollarSign className="h-7 w-7 mr-3" />
                  จัดการการชำระเงิน
                </CardTitle>
                <p className="text-blue-100 mt-2">เลือกประเภทการชำระเงินที่ต้องการจัดการ</p>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="annual" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 my-2 rounded-lg justify-center items-center" style={{marginLeft: '5px', marginRight: '5px'}}>
                    <TabsTrigger 
                      value="annual" 
                      className="flex items-center space-x-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-200 py-2 px-1 rounded-md font-medium"
                    >
                      <Users className="h-5 w-5" />
                      <span className="hidden sm:inline">สมาชิกรายปี</span>
                      <span className="sm:hidden">สมาชิก</span>
                      <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700 data-[state=active]:bg-white data-[state=active]:text-emerald-600 text-xs px-1">
                        {annualMembershipPaymentsList.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="locker" 
                      className="flex items-center space-x-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all duration-200 py-2 px-1 rounded-md font-medium"
                    >
                      <Package className="h-5 w-5" />
                      <span className="hidden sm:inline">จองตู้เก็บของ</span>
                      <span className="sm:hidden">ตู้</span>
                      <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 data-[state=active]:bg-white data-[state=active]:text-purple-600 text-xs px-1">
                        {lockerReservationPayments.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pool" 
                      className="flex items-center space-x-0.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all duration-200 py-2 px-0.5 rounded-md font-medium"
                    >
                      <Waves className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">จองสระว่ายน้ำ</span>
                      <span className="sm:hidden text-sm">สระ</span>
                      <Badge variant="secondary" className="ml-0.5 bg-cyan-100 text-cyan-700 data-[state=active]:bg-white data-[state=active]:text-cyan-600 text-xs px-0.5">
                        {poolReservationPayments.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="annual" className="p-6 pt-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 mb-4 border border-emerald-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-800">การชำระสมาชิกรายปี</h3>
                          <p className="text-sm text-emerald-600">จัดการการชำระเงินสำหรับสมาชิกภาพรายปี</p>
                        </div>
                      </div>
                    </div>
                    <PaymentTable 
                      payments={annualMembershipPaymentsList} 
                      title="การชำระสมาชิกรายปี"
                      icon={<Users className="h-6 w-6" />}
                      color="bg-gradient-to-r from-emerald-500 to-green-600"
                      isLoading={loading}
                    />
                  </TabsContent>

                  <TabsContent value="locker" className="p-6 pt-4">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-4 border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-800">การชำระการจองตู้เก็บของ</h3>
                          <p className="text-sm text-purple-600">จัดการการชำระเงินสำหรับการจองตู้เก็บของ</p>
                        </div>
                      </div>
                    </div>
                    <PaymentTable 
                      payments={lockerReservationPayments} 
                      title="การชำระการจองตู้เก็บของ"
                      icon={<Package className="h-6 w-6" />}
                      color="bg-gradient-to-r from-purple-500 to-indigo-600"
                      isLoading={loading}
                    />
                  </TabsContent>

                  <TabsContent value="pool" className="p-6 pt-4">
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 mb-4 border border-cyan-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-500 rounded-lg">
                          <Waves className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-cyan-800">การชำระการจองสระว่ายน้ำ</h3>
                          <p className="text-sm text-cyan-600">จัดการการชำระเงินสำหรับการจองสระว่ายน้ำ</p>
                        </div>
                      </div>
                    </div>
                    <PaymentTable 
                      payments={poolReservationPayments} 
                      title="การชำระการจองสระว่ายน้ำ"
                      icon={<Waves className="h-6 w-6" />}
                      color="bg-gradient-to-r from-cyan-500 to-blue-600"
                      isLoading={loading}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>





          {/* Price Setting Dialogs */}
          <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
            <DialogContent className="max-w-md transform transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
              <DialogHeader className="pb-4 border-b border-gray-100">
                <DialogTitle className="flex items-center text-xl font-semibold">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  แก้ไขราคา: {selectedCategory?.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">
                  ปรับปรุงราคาสมาชิกภาพสำหรับหมวดหมู่ที่เลือก
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="annual-price" className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    ค่าสมาชิกรายปี (บาท)
                  </Label>
                  <Input
                    id="annual-price"
                    type="number"
                    value={newAnnualPrice}
                    onChange={(e) => setNewAnnualPrice(e.target.value)}
                    placeholder="กรอกราคารายปี"
                    className="mt-1 h-11 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-price" className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
                    ราคาต่อครั้ง (บาท)
                  </Label>
                  <Input
                    id="session-price"
                    type="number"
                    value={newSessionPrice}
                    onChange={(e) => setNewSessionPrice(e.target.value)}
                    placeholder="กรอกราคาต่อครั้ง"
                    className="mt-1 h-11 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                {selectedCategory && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                      <p className="font-semibold text-blue-800">ราคาปัจจุบัน</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">รายปี:</span>
                        <span className="font-bold text-green-700">฿{selectedCategory.annual_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ต่อครั้ง:</span>
                        <span className="font-bold text-blue-700">฿{selectedCategory.pay_per_session_price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="pt-6 border-t border-gray-100 space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPriceDialogOpen(false)}
                  className="flex-1 h-11 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleUpdateCategoryPrice}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  อัปเดตราคา
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>





          <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
            <DialogContent className="max-w-md transform transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
              <DialogHeader className={`pb-4 border-b ${
                confirmationAction === 'completed' ? 'border-green-100' :
                confirmationAction === 'failed' ? 'border-red-100' :
                'border-orange-100'
              }`}>
                <DialogTitle className="flex items-center text-xl font-semibold">
                  <div className={`p-2 rounded-lg mr-3 ${
                    confirmationAction === 'completed' ? 'bg-green-100' :
                    confirmationAction === 'failed' ? 'bg-red-100' :
                    'bg-orange-100'
                  }`}>
                    {confirmationAction === 'completed' && <Check className="h-6 w-6 text-green-600" />}
                    {confirmationAction === 'failed' && <X className="h-6 w-6 text-red-600" />}
                    {confirmationAction === 'refunded' && <AlertCircle className="h-6 w-6 text-orange-600" />}
                  </div>
                  ยืนยันการดำเนินการ
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">
                  {confirmationAction === 'completed' && 'อนุมัติการชำระเงินและอัปเดตสถานะ'}
                  {confirmationAction === 'failed' && 'ปฏิเสธการชำระเงินและอัปเดตสถานะ'}
                  {confirmationAction === 'refunded' && 'ดำเนินการคืนเงินและอัปเดตสถานะ'}
                </DialogDescription>
              </DialogHeader>
              {selectedPayment && (
                <div className="space-y-4">
                  <div className={`bg-gradient-to-r p-4 rounded-lg animate-in fade-in-0 slide-in-from-top-2 duration-300 ${
                    confirmationAction === 'completed' ? 'from-green-50 to-emerald-50 border border-green-200' :
                    confirmationAction === 'failed' ? 'from-red-50 to-pink-50 border border-red-200' :
                    'from-orange-50 to-yellow-50 border border-orange-200'
                  }`}>
                    <div className="flex items-center mb-3">
                      {confirmationAction === 'completed' && <Check className="h-5 w-5 text-green-600 mr-2" />}
                      {confirmationAction === 'failed' && <X className="h-5 w-5 text-red-600 mr-2" />}
                      {confirmationAction === 'refunded' && <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />}
                      <p className="text-lg font-semibold">
                        คุณต้องการที่จะ
                        <span className={`font-bold ${
                          confirmationAction === 'completed' ? 'text-green-700' :
                          confirmationAction === 'failed' ? 'text-red-700' :
                          'text-orange-700'
                        }`}>
                          {confirmationAction === 'completed' ? ' อนุมัติ ' : confirmationAction === 'failed' ? ' ปฏิเสธ ' : ' คืนเงิน '}
                        </span>
                        การชำระเงินนี้ใช่หรือไม่?
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          สมาชิก:
                        </span>
                        <span className="font-semibold text-gray-800">{selectedPayment.user_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          จำนวน:
                        </span>
                        <span className={`font-bold text-lg ${
                          confirmationAction === 'completed' ? 'text-green-700' :
                          confirmationAction === 'failed' ? 'text-red-700' :
                          'text-orange-700'
                        }`}>฿{normalizeAmount(selectedPayment.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          ประเภท:
                        </span>
                        <span className="font-semibold text-gray-800">{selectedPayment.payment_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="pt-6 border-t border-gray-100 space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmationDialogOpen(false)}
                  className="flex-1 h-11 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleConfirmPayment}
                  className={`flex-1 h-11 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${
                    confirmationAction === 'completed' ? 'bg-green-600 hover:bg-green-700' :
                    confirmationAction === 'failed' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {confirmationAction === 'completed' && <Check className="h-4 w-4 mr-2" />}
                  {confirmationAction === 'failed' && <X className="h-4 w-4 mr-2" />}
                  {confirmationAction === 'refunded' && <AlertCircle className="h-4 w-4 mr-2" />}
                  ยืนยัน
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


        </div>
      </div>
    </AdminLayout>
  )
}
