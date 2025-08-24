"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Check, X, Trash2, Calendar, Users, Package, Waves, Clock } from "lucide-react"
import { ReservationTable } from "@/components/ui/reservation-table"
import { useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Reservation {
  id: number
  user_name: string
  user_email: string
  pool_name: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  created_at: string
  payment_id?: number
  payment_amount?: number
  payment_status?: string
  payment_method?: string
  slip_url?: string
}

interface LockerReservation {
  id: number
  user_id: number
  username: string
  first_name: string
  last_name: string
  user_email: string
  locker_id: number
  locker_code: string
  location: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  created_at: string
  payment_id?: number
  payment_amount?: number
  payment_status?: string
  payment_method?: string
  slip_url?: string
}

interface Pool {
  id: number
  name: string
  capacity: number
  status: string
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
}

export default function AdminReservationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [lockerReservations, setLockerReservations] = useState<LockerReservation[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newReservation, setNewReservation] = useState({
    user_id: "",
    pool_id: "",
    reservation_date: "",
    start_time: "",
    end_time: "",
    payment_method: "",
    notes: ""
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    if (user.role !== "admin") {
      router.push("/")
      return
    }
    fetchReservations()
    fetchLockerReservations()
    fetchPools()
    fetchUsers()
  }, [user, router])

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/reservations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleCreateReservation = async () => {
    try {
      const formData = new FormData()
      Object.entries(newReservation).forEach(([key, value]) => {
        formData.append(key, value)
      })
      if (slipFile) {
        formData.append("slip", slipFile)
      }

      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "สร้างการจองเรียบร้อยแล้ว"
        })
        setIsCreateDialogOpen(false)
        setNewReservation({
          user_id: "",
          pool_id: "",
          reservation_date: "",
          start_time: "",
          end_time: "",
          payment_method: "",
          notes: ""
        })
        setSlipFile(null)
        fetchReservations()
      } else {
        const error = await response.json()
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

  const handleUpdateReservationStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "อัปเดตสถานะการจองเรียบร้อยแล้ว"
        })
        fetchReservations()
      } else {
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

  const handleUpdateLockerReservationStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/locker-reservations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "อัปเดตสถานะการจองตู้เก็บของเรียบร้อยแล้ว"
        })
        fetchLockerReservations()
      } else {
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

  const handleDeleteReservation = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "ลบการจองเรียบร้อยแล้ว"
        })
        fetchReservations()
      } else {
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

  const handleDeleteLockerReservation = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/locker-reservations/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "ลบการจองตู้เก็บของเรียบร้อยแล้ว"
        })
        fetchLockerReservations()
      } else {
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
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
      default:
        return status
    }
  }

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

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

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = 
      reservation.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.pool_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesDate = !dateFilter || reservation.reservation_date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  const filteredLockerReservations = lockerReservations.filter((r) => {
    const matchesSearch = 
      r.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.locker_code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesDate = !dateFilter || r.reservation_date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

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

  if (user?.role !== "admin") {
    return null
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">ยืนยันแล้ว</p>
                    <p className="text-3xl font-bold">
                      {[...reservations, ...lockerReservations].filter(r => r.status === 'confirmed').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">รอยืนยัน</p>
                    <p className="text-3xl font-bold">
                      {[...reservations, ...lockerReservations].filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการการจอง
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              จัดการการจองสระว่ายน้ำและตู้เก็บของ ตรวจสอบสถานะ และอนุมัติการจอง
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Search className="h-5 w-5" />
                ค้นหาและกรองข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        สร้างการจอง
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>สร้างการจองใหม่</DialogTitle>
                        <DialogDescription>
                          กรอกข้อมูลการจองสระว่ายน้ำ
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
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
                        <div className="space-y-2">
                          <Label htmlFor="date">วันที่</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newReservation.reservation_date}
                            onChange={(e) => setNewReservation({...newReservation, reservation_date: e.target.value})}
                          />
                        </div>
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
                        <div className="space-y-2">
                          <Label htmlFor="notes">หมายเหตุ</Label>
                          <Input
                            id="notes"
                            placeholder="หมายเหตุเพิ่มเติม..."
                            value={newReservation.notes}
                            onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})}
                          />
                        </div>
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

              {/* Applied Filters */}
              {(searchTerm || statusFilter !== "all" || dateFilter) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-gray-600">ตัวกรองที่ใช้:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ค้นหา: {searchTerm}
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      สถานะ: {getStatusText(statusFilter)}
                    </Badge>
                  )}
                  {dateFilter && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      วันที่: {dateFilter}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reservations Tabs */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5" />
                รายการการจอง
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="pools" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-50 m-6 mb-0">
                  <TabsTrigger value="pools" className="flex items-center gap-2">
                    <Waves className="h-4 w-4" />
                    การจองสระว่ายน้ำ
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                      {filteredReservations.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="lockers" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    การจองตู้เก็บของ
                    <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                      {filteredLockerReservations.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pools" className="p-6 pt-4">
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

                <TabsContent value="lockers" className="p-6 pt-4">
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
