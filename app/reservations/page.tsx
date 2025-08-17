"use client"

import type React from "react"

import { useEffect, useState } from "react"
import UserLayout from "@/components/user-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Plus, Trash2, MapPin, Users, CreditCard, CheckCircle, XCircle, AlertCircle, Sparkles, Waves, Crown, Shield, Gift, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRef } from "react"
import { useAuth } from "@/components/auth-provider" // Import useAuth

interface Reservation {
  id: number
  reservation_date: string
  start_time: string
  end_time: string
  pool_name: string
  status: string
  notes?: string
}

interface Pool {
  id: number
  name: string
  capacity: number
  status: string
}

interface UserMembership {
  type: string
  expires_at: string
  status: string
  user_category: string
  pay_per_session_price: number
  annual_price: number
}

interface UserCategory {
  id: number
  name: string
  description: string
  pay_per_session_price: number
  annual_price: number
}

export default function ReservationsPage() {
  const { user } = useAuth() // Get user from auth context
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null)
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedPool, setSelectedPool] = useState("")
  const [notes, setNotes] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const slipInputRef = useRef<HTMLInputElement>(null)
  const [bankAccountNumber, setBankAccountNumber] = useState("")

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 7)
  const maxDateString = maxDate.toISOString().split("T")[0]

  useEffect(() => {
    const fetchData = async () => {
      await fetchReservations()
      await fetchPools()
      await fetchBankAccountNumber()
      await fetchUserMembershipAndCategories()
      setLoading(false)
    }
    fetchData()
  }, [])

  const fetchUserMembershipAndCategories = async () => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        console.error("No token found, user needs to login")
        return
      }

      const dashboardResponse = await fetch("http://localhost:3001/api/user/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        setUserMembership(dashboardData.membership)
        console.log("Reservations - User Membership:", dashboardData.membership); // Debug log
      } else if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
        console.error("Authentication failed, redirecting to login")
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      } else {
        console.error("Reservations - Failed to fetch user dashboard:", dashboardResponse.status, dashboardResponse.statusText);
      }

      const categoriesResponse = await fetch("http://localhost:3001/api/memberships/categories")
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setUserCategories(categoriesData.categories)
        console.log("Reservations - User Categories:", categoriesData.categories); // Debug log
      } else {
        console.error("Reservations - Failed to fetch user categories:", categoriesResponse.status, categoriesResponse.statusText);
      }
    } catch (error) {
      console.error("Error fetching user membership or categories:", error)
    }
  }

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        console.error("No token found, user needs to login")
        return
      }

      const response = await fetch("http://localhost:3001/api/reservations/user", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      } else if (response.status === 401 || response.status === 403) {
        console.error("Authentication failed, redirecting to login")
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      } else {
        console.error("Failed to fetch reservations:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPools = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/pools/status")
      if (response.ok) {
        const data = await response.json()
        setPools(data.pools || [])
      }
    } catch (error) {
      console.error("Error fetching pools:", error)
    }
  }

  const fetchBankAccountNumber = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/settings/bank_account_number")
      if (response.ok) {
        const data = await response.json()
        setBankAccountNumber(data.value)
      }
    } catch (error) {
      console.error("Error fetching bank account number:", error)
    }
  }

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedPool) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "เลือกวันที่และสระที่ต้องการจอง",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const currentUserCategory = userCategories.find(cat => cat.name === userMembership?.user_category);
    const isAnnualMember = userMembership?.status === 'active' && userMembership?.type === 'Annual';
    const requiresPayment = !isAnnualMember;
    let paymentAmount = 0;

    if (requiresPayment && currentUserCategory) {
      paymentAmount = currentUserCategory.pay_per_session_price;
    }

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        window.location.href = "/login"
        return
      }

      const response = await fetch("http://localhost:3001/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pool_resource_id: Number.parseInt(selectedPool),
          reservation_date: selectedDate,
          start_time: "13:00",
          end_time: "21:00",
          notes: notes,
          payment_method: requiresPayment ? paymentMethod : "system",
          amount: requiresPayment ? paymentAmount : 0,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (paymentMethod === "bank_transfer" && slipFile && data.paymentId) {
          const formData = new FormData()
          formData.append("slip", slipFile)
          await fetch(`http://localhost:3001/api/payments/${data.paymentId}/upload-slip`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })
        }
        toast({
          title: "จองสำเร็จ",
          description: "การจองของคุณถูกบันทึกแล้ว",
        })
        setDialogOpen(false)
        setSelectedDate("")
        setSelectedPool("")
        setNotes("")
        setPaymentMethod("cash")
        setSlipFile(null)
        if (slipInputRef.current) slipInputRef.current.value = ""
        fetchReservations()
      } else if (response.status === 401 || response.status === 403) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      } else {
        const errorData = await response.json()
        toast({
          title: "จองไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm("คุณต้องการยกเลิกการจองนี้หรือไม่?")) return

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        window.location.href = "/login"
        return
      }

      const response = await fetch(`http://localhost:3001/api/reservations/${reservationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "ยกเลิกการจองสำเร็จ",
          description: "การจองได้รับการยกเลิกแล้ว",
        })
        fetchReservations()
      } else if (response.status === 401 || response.status === 403) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      } else {
        toast({
          title: "ยกเลิกไม่สำเร็จ",
          description: "ไม่สามารถยกเลิกการจองได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-300"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled": return "bg-red-100 text-red-800 border-red-300"
      case "completed": return "bg-blue-100 text-blue-800 border-blue-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "ยืนยันแล้ว"
      case "pending":
        return "รอยืนยัน"
      case "cancelled":
        return "ยกเลิก"
      case "completed":
        return "เสร็จสิ้น"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              การจองของฉัน
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จัดการการจองใช้งานสระว่ายน้ำและติดตามสถานะการจอง
            </p>
          </div>

          {/* Current Membership Status - Similar to membership page */}
          {userMembership && (
            <div className="max-w-4xl mx-auto">
              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-full">
                        <Waves className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-white">
                          สถานะการจอง
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                          ข้อมูลสมาชิกและการจองของคุณ
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${userMembership.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} border-0 px-4 py-2 text-sm font-medium`}>
                      {userMembership.status === "active" ? "ใช้งานได้" : "รอดำเนินการ"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-100">ประเภทสมาชิก</p>
                        <p className="text-lg font-semibold">{userMembership.user_category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Crown className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-100">แพ็คเกจ</p>
                        <p className="text-lg font-semibold">{userMembership.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-100">หมดอายุ</p>
                        <p className="text-lg font-semibold">
                          {new Date(userMembership.expires_at).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">จัดการการจอง</h2>
              <p className="text-gray-600">จองสระว่ายน้ำและติดตามสถานะการจองของคุณ</p>
            </div>
            
            <div className="flex justify-center mb-8">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    จองใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-2">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <DialogTitle className="text-xl font-bold">จองสระว่ายน้ำ</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        เลือกวันที่ สระ และวิธีชำระเงินสำหรับการจองของคุณ
                      </DialogDescription>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleSubmitReservation} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium">วันที่</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        max={maxDateString}
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        <p className="text-sm font-medium text-blue-800">
                            เวลาทำการ: 13:00 น. - 21:00 น.
                        </p>
                        <p className="text-xs text-gray-600">
                            การจองจะเป็นไปตามเวลาทำการของสระ
                        </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pool" className="text-sm font-medium">เลือกสระ</Label>
                      <Select value={selectedPool} onValueChange={setSelectedPool} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกสระที่ต้องการจอง" />
                        </SelectTrigger>
                        <SelectContent>
                          {pools
                            .filter((pool) => pool.status === "available")
                            .map((pool) => (
                              <SelectItem key={pool.id} value={pool.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span>{pool.name}</span>
                                  <span className="text-gray-500">
                                    (<Users className="h-3 w-3 inline mr-1" />{pool.capacity} คน)
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Display pricing based on user's membership and category */}
                    {userMembership && userCategories.length > 0 && (
                      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold text-blue-800 flex items-center">
                            <CreditCard className="h-5 w-5 mr-2" />
                            ข้อมูลการชำระเงิน
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {userMembership.status === 'active' && userMembership.type === 'Annual' ? (
                            <div className="flex items-center space-x-3 p-3 bg-green-100 rounded-lg">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">สมาชิกรายปี</p>
                                <p className="text-sm text-green-700">
                                  ไม่ต้องชำระเงินสำหรับการจองนี้
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-3 bg-white rounded-lg border">
                                <p className="text-sm text-gray-600">
                                  ประเภทสมาชิก: <span className="font-semibold text-gray-900">{userMembership.user_category}</span>
                                </p>
                                <p className="text-lg font-bold text-blue-600 mt-1">
                                  ฿{userCategories.find(cat => cat.name === userMembership.user_category)?.pay_per_session_price.toLocaleString() || 'N/A'} ต่อครั้ง
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="payment_method" className="text-sm font-medium">วิธีชำระเงิน</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกวิธีชำระเงิน" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">
                                      <div className="flex items-center space-x-2">
                                        <CreditCard className="h-4 w-4 text-green-600" />
                                        <span>เงินสด (ชำระที่เคาน์เตอร์)</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="bank_transfer">
                                      <div className="flex items-center space-x-2">
                                        <CreditCard className="h-4 w-4 text-blue-600" />
                                        <span>โอนผ่านบัญชีธนาคาร</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {paymentMethod === "bank_transfer" && (
                                <div className="space-y-3 p-3 bg-blue-50 rounded-lg border">
                                  <div className="text-center">
                                    <p className="text-sm text-gray-600">โอนเงินเข้าบัญชี</p>
                                    <p className="text-lg font-bold text-blue-600">{bankAccountNumber}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="slip" className="text-sm font-medium">อัปโหลดหลักฐานการชำระเงิน</Label>
                                    <input
                                      ref={slipInputRef}
                                      type="file"
                                      accept="image/*"
                                      id="slip"
                                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                      onChange={e => setSlipFile(e.target.files?.[0] || null)}
                                      required
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium">หมายเหตุ (ไม่บังคับ)</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="หมายเหตุเพิ่มเติมสำหรับการจอง"
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>กำลังจอง...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>จอง</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Reservations List - Similar to membership page layout */}
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">รายการจองของคุณ</h2>
                <p className="text-gray-600">ติดตามและจัดการการจองทั้งหมด</p>
              </div>
              
              {reservations.length > 0 ? (
                <div className="grid gap-6 max-w-4xl mx-auto">
                  {reservations.map((reservation) => (
                    <Card key={reservation.id} className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                              <Waves className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                {reservation.pool_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                  {new Date(reservation.reservation_date).toLocaleDateString("th-TH")}
                                </span>
                              </div>
                              {reservation.notes && (
                                <div className="flex items-start space-x-2 mt-2">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">หมายเหตุ:</span> {reservation.notes}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={`${statusColor(reservation.status)} px-3 py-2 text-sm font-medium flex items-center space-x-1`}>
                              {getStatusIcon(reservation.status)}
                              <span>{getStatusText(reservation.status)}</span>
                            </Badge>
                            {(reservation.status === "pending" || reservation.status === "confirmed") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="hover:scale-105 transition-transform"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="col-span-full text-center py-12 border-2 border-dashed border-gray-300 max-w-4xl mx-auto">
                  <CardContent className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีการจอง</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      เริ่มจองการใช้งานสระว่ายน้ำได้เลย เพื่อเพลิดเพลินกับการว่ายน้ำ
                    </p>
                    <Button
                      onClick={() => setDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      จองใหม่
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
