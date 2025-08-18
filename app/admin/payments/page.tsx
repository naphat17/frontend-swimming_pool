"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Check, X, DollarSign, AlertCircle, Settings, TrendingUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Payment {
  id: number
  user_name: string
  user_email: string
  amount: number
  status: string
  payment_method: string
  transaction_id: string
  created_at: string
  membership_type?: string
  notes?: string
  slip_url?: string
  payment_type: string
}

export default function AdminPaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const { toast } = useToast()
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [userCategories, setUserCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [newAnnualPrice, setNewAnnualPrice] = useState('')
  const [newSessionPrice, setNewSessionPrice] = useState('')
  const [lockerPriceDialogOpen, setLockerPriceDialogOpen] = useState(false)
  const [lockerPrice, setLockerPrice] = useState('')
  const [currentLockerPrice, setCurrentLockerPrice] = useState(0)
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [confirmationAction, setConfirmationAction] = useState<"completed" | "failed" | "refunded" | null>(null)


  // Ensure numeric amount for correct calculations and rendering
  const normalizeAmount = (amount: unknown) => {
    const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? 0))
    return Number.isFinite(n) ? n : 0
  }

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchPayments()
    fetchUserCategories()
    fetchLockerPrice()
  }, [user, router, statusFilter, dateFilter])

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token")
      const queryParams = new URLSearchParams()
      if (dateFilter !== "all") {
        queryParams.append("dateFilter", dateFilter)
      }

      const url = `https://backend-swimming-pool.onrender.com/api/admin/payments?${queryParams.toString()}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserCategories = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/admin/user-categories", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUserCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching user categories:", error)
    }
  }

  const fetchLockerPrice = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/settings/locker_price", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentLockerPrice(parseFloat(data.value) || 1500)
      }
    } catch (error) {
      console.error("Error fetching locker price:", error)
      setCurrentLockerPrice(1500) // default price
    }
  }

  const handleUpdateLockerPrice = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/settings/locker_price", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          value: parseFloat(lockerPrice)
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตราคาตู้เก็บของสำเร็จ",
          description: `ราคาตู้เก็บของได้รับการอัปเดตเป็น ฿${parseFloat(lockerPrice).toLocaleString()} แล้ว`,
        })
        fetchLockerPrice()
        setLockerPriceDialogOpen(false)
        setLockerPrice('')
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตราคาตู้เก็บของได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตราคาตู้เก็บของได้",
        variant: "destructive",
      })
    }
  }

  const openLockerPriceDialog = () => {
    setLockerPrice(String(currentLockerPrice))
    setLockerPriceDialogOpen(true)
  }

  const handleUpdateCategoryPrice = async () => {
    if (!selectedCategory) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-swimming-pool.onrender.com/api/admin/user-categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          annual_price: parseFloat(newAnnualPrice),
          pay_per_session_price: parseFloat(newSessionPrice)
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตราคาสำเร็จ",
          description: `ราคาสำหรับ ${selectedCategory.name} ได้รับการอัปเดตแล้ว`,
        })
        fetchUserCategories()
        setPriceDialogOpen(false)
        setSelectedCategory(null)
        setNewAnnualPrice('')
        setNewSessionPrice('')
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตราคาได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตราคาได้",
        variant: "destructive",
      })
    }
  }

  const openCategoryPriceDialog = (category: any) => {
    setSelectedCategory(category)
    setNewAnnualPrice(String(category.annual_price))
    setNewSessionPrice(String(category.pay_per_session_price))
    setPriceDialogOpen(true)
  }

  const openConfirmationDialog = (payment: Payment, action: "completed" | "failed" | "refunded") => {
    setSelectedPayment(payment)
    setConfirmationAction(action)
    setConfirmationDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !confirmationAction) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-swimming-pool.onrender.com/api/admin/payments/${selectedPayment.id}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: confirmationAction }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตสถานะสำเร็จ",
          description: `สถานะการชำระเงินได้รับการเปลี่ยนเป็น ${getStatusText(confirmationAction)}`,
        })
        fetchPayments()
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตสถานะได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive",
      })
    } finally {
      setConfirmationDialogOpen(false)
      setSelectedPayment(null)
      setConfirmationAction(null)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "สำเร็จ"
      case "pending":
        return "รอดำเนินการ"
      case "failed":
        return "ไม่สำเร็จ"
      case "refunded":
        return "คืนเงิน"
      default:
        return status
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "credit_card":
        return "บัตรเครดิต"
      case "bank_transfer":
        return "โอนเงิน"
      case "cash":
        return "เงินสด"
      default:
        return method
    }
  }

  // คำนวณรายได้รวมจาก payment ที่สำเร็จ
  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === "completed" ? normalizeAmount(p.amount) : 0), 0)

  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const completedPayments = payments.filter((p) => p.status === "completed").length
  const failedPayments = payments.filter((p) => p.status === "failed").length
  const refundedPayments = payments.filter((p) => p.status === "refunded").length

  const poolRevenue = payments
    .filter((p) => p.payment_type === "การจองสระว่ายน้ำ" && p.status === "completed")
    .reduce((sum, p) => sum + normalizeAmount(p.amount), 0)

  const lockerRevenue = payments
    .filter((p) => p.payment_type === "การจองตู้เก็บของ" && p.status === "completed")
    .reduce((sum, p) => sum + normalizeAmount(p.amount), 0)

  // สถิติตามประเภทการชำระ
  const poolReservations = payments.filter((p) => p.payment_type === "การจองสระว่ายน้ำ").length
  const lockerPayments = payments.filter((p) => p.payment_type === "การจองตู้เก็บของ").length
  const membershipPayments = payments.filter((p) => p.payment_type.includes("สมาชิกภาพ")).length

  const poolReservationPayments = filteredPayments.filter(p => p.payment_type === 'การจองสระว่ายน้ำ');
  const lockerReservationPayments = filteredPayments.filter(p => p.payment_type === 'การจองตู้เก็บของ');

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
  
  const PaymentTable = ({ payments }: { payments: Payment[] }) => {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สมาชิก</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>จำนวนเงิน</TableHead>
              <TableHead>วิธีชำระ</TableHead>
              <TableHead>รหัสอ้างอิง</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>Slip</TableHead>
              <TableHead>การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={`${payment.id}-${payment.slip_url}`}>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.user_name}</div>
                    <div className="text-sm text-gray-500">{payment.user_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {payment.payment_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">฿{normalizeAmount(payment.amount).toLocaleString()}</TableCell>
                <TableCell>{getPaymentMethodText(payment.payment_method)}</TableCell>
                <TableCell className="font-mono text-sm">{payment.transaction_id}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                </TableCell>
                <TableCell>{new Date(payment.created_at).toLocaleDateString("th-TH")}</TableCell>
                <TableCell>
                  {payment.slip_url ? (
                    <Button size="sm" variant="outline" onClick={() => window.open(payment.slip_url, "_blank")}>ดูสลิป</Button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {payment.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConfirmationDialog(payment, "completed")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConfirmationDialog(payment, "failed")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {payment.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmationDialog(payment, "refunded")}
                      >
                        คืนเงิน
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการการชำระเงิน
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จัดการและยืนยันการชำระเงินของสมาชิก
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">รายได้รวม</CardTitle>
                <DollarSign className="h-6 w-6 text-green-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">฿{totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-100">รอดำเนินการ</CardTitle>
                <AlertCircle className="h-6 w-6 text-yellow-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingPayments}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">สำเร็จ</CardTitle>
                <Check className="h-6 w-6 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedPayments}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-100">ไม่สำเร็จ</CardTitle>
                <X className="h-6 w-6 text-red-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{failedPayments}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-cyan-100">รายได้จากสระว่ายน้ำ</CardTitle>
                <DollarSign className="h-6 w-6 text-cyan-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">฿{poolRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">รายได้จากตู้เก็บของ</CardTitle>
                <DollarSign className="h-6 w-6 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">฿{lockerRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-gray-500 to-gray-700 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-100">จำนวนเงินคืน</CardTitle>
                <AlertCircle className="h-6 w-6 text-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{refundedPayments}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="ค้นหาชื่อสมาชิก, อีเมล, รหัสอ้างอิง, หรือประเภท..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="completed">สำเร็จ</SelectItem>
                    <SelectItem value="failed">ไม่สำเร็จ</SelectItem>
                    <SelectItem value="refunded">คืนเงิน</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="ช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="day">วันนี้</SelectItem>
                    <SelectItem value="week">สัปดาห์นี้</SelectItem>
                    <SelectItem value="month">เดือนนี้</SelectItem>
                    <SelectItem value="year">ปีนี้</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Tables */}
          <div className="space-y-8 max-w-7xl mx-auto">
            <Card className="shadow-lg border-gray-200">
              <CardHeader>
                <CardTitle>การชำระการจองตู้เก็บของ ({lockerReservationPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentTable payments={lockerReservationPayments} />
              </CardContent>
            </Card>

            <Card className="shadow-lg border-gray-200">
              <CardHeader>
                <CardTitle>การชำระการจองสระว่ายน้ำ ({poolReservationPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentTable payments={poolReservationPayments} />
              </CardContent>
            </Card>
          </div>

          {/* Price Setting Dialogs */}
          <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Settings className="h-5 w-5 text-blue-600 mr-2" />
                  แก้ไขราคา: {selectedCategory?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="annual-price">ค่าสมาชิกรายปี (บาท)</Label>
                  <Input
                    id="annual-price"
                    type="number"
                    value={newAnnualPrice}
                    onChange={(e) => setNewAnnualPrice(e.target.value)}
                    placeholder="กรอกราคารายปี"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="session-price">ราคาต่อครั้ง (บาท)</Label>
                  <Input
                    id="session-price"
                    type="number"
                    value={newSessionPrice}
                    onChange={(e) => setNewSessionPrice(e.target.value)}
                    placeholder="กรอกราคาต่อครั้ง"
                    className="mt-1"
                  />
                </div>
                {selectedCategory && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p><strong>ราคาปัจจุบัน:</strong></p>
                    <p>รายปี: ฿{selectedCategory.annual_price.toLocaleString()}</p>
                    <p>ต่อครั้ง: ฿{selectedCategory.pay_per_session_price.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleUpdateCategoryPrice}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  อัปเดตราคา
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={lockerPriceDialogOpen} onOpenChange={setLockerPriceDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Settings className="h-5 w-5 text-purple-600 mr-2" />
                  กำหนดราคาตู้เก็บของ
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="locker-price">ราคาตู้เก็บของต่อวัน (บาท)</Label>
                  <Input
                    id="locker-price"
                    type="number"
                    value={lockerPrice}
                    onChange={(e) => setLockerPrice(e.target.value)}
                    placeholder="กรอกราคาตู้เก็บของ"
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p><strong>ราคาปัจจุบัน:</strong></p>
                  <p>ตู้เก็บของ: ฿{currentLockerPrice.toLocaleString()} ต่อวัน</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLockerPriceDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleUpdateLockerPrice}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  อัปเดตราคา
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ยืนยันการดำเนินการ</DialogTitle>
              </DialogHeader>
              {selectedPayment && (
                <div>
                  <p>คุณต้องการที่จะ{confirmationAction === 'completed' ? 'อนุมัติ' : confirmationAction === 'failed' ? 'ปฏิเสธ' : 'คืนเงิน'}การชำระเงินนี้ใช่หรือไม่?</p>
                  <p><strong>สมาชิก:</strong> {selectedPayment.user_name}</p>
                  <p><strong>จำนวน:</strong> ฿{normalizeAmount(selectedPayment.amount).toLocaleString()}</p>
                  <p><strong>ประเภท:</strong> {selectedPayment.payment_type}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmationDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleConfirmPayment}>ยืนยัน</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  )
}
