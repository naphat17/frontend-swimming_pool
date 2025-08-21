"use client"

import type React from "react"

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
import { Search, Plus, Check, X, Trash2, Calendar } from "lucide-react"
import { useRef } from "react"
import { Dialog as BaseDialog } from "@/components/ui/dialog"

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
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [lockerReservations, setLockerReservations] = useState<LockerReservation[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newReservationData, setNewReservationData] = useState({
    user_id: "",
    pool_resource_id: "",
    reservation_date: "",
    start_time: "",
    end_time: "",
    notes: "",
  })
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const slipInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchReservations()
    fetchLockerReservations()
    fetchPools()
    fetchUsers()
    ;(async () => {
      try {
        const res = await fetch("http://localhost:3001/api/settings/bank_account_number")
        if (res.ok) {
          const data = await res.json()
          setBankAccountNumber(data.value)
        }
      } catch {}
    })()
  }, [user, router])

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/admin/reservations", {
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
      const response = await fetch("http://localhost:3001/api/admin/locker-reservations", {
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
      const response = await fetch("http://localhost:3001/api/admin/pools", {
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
      const response = await fetch("http://localhost:3001/api/admin/users?role=user", {
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

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")
      // ส่ง payment_method ไปด้วย
      const response = await fetch("http://localhost:3001/api/admin/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newReservationData,
          user_id: Number.parseInt(newReservationData.user_id),
          pool_resource_id: Number.parseInt(newReservationData.pool_resource_id),
          reservation_date: newReservationData.reservation_date,
          start_time: newReservationData.start_time,
          end_time: newReservationData.end_time,
          notes: newReservationData.notes,
          payment_method: paymentMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // ถ้าเลือกโอนเงิน ให้ upload slip ต่อ
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
          title: "สร้างการจองสำเร็จ",
          description: "การจองใหม่ได้รับการสร้างแล้ว",
        })
        setDialogOpen(false)
        setNewReservationData({
          user_id: "",
          pool_resource_id: "",
          reservation_date: "",
          start_time: "",
          end_time: "",
          notes: "",
        })
        setPaymentMethod("cash")
        setSlipFile(null)
        if (slipInputRef.current) slipInputRef.current.value = ""
        fetchReservations()
      } else {
        const errorData = await response.json()
        toast({
          title: "สร้างการจองไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างการจองได้",
        variant: "destructive",
      })
    }
  }

  const handleUpdateReservationStatus = async (reservationId: number, status: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/reservations/${reservationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตสถานะสำเร็จ",
          description: `สถานะการจองได้รับการเปลี่ยนเป็น ${getStatusText(status)}`,
        })
        fetchReservations()
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
    }
  }

  const handleUpdateLockerReservationStatus = async (reservationId: number, status: "confirmed" | "cancelled") => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/locker-reservations/${reservationId}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        toast({ title: "อัปเดตสถานะสำเร็จ", description: `สถานะการจองตู้ถูกเปลี่ยนเป็น ${getStatusText(status)}` })
        fetchLockerReservations()
      } else {
        toast({ title: "อัปเดตไม่สำเร็จ", description: "ไม่สามารถอัปเดตสถานะการจองตู้ได้", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัปเดตสถานะการจองตู้ได้", variant: "destructive" })
    }
  }

  const handleDeleteLockerReservation = async (reservationId: number) => {
    if (!confirm("ต้องการลบการจองตู้เก็บของนี้หรือไม่?")) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/locker-reservations/${reservationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast({ title: "ลบสำเร็จ", description: "ลบการจองตู้เก็บของแล้ว" })
        fetchLockerReservations()
      } else {
        toast({ title: "ลบไม่สำเร็จ", description: "ไม่สามารถลบรายการได้", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบรายการได้", variant: "destructive" })
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

  const paymentStatusColor = (status?: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-300"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "failed": return "bg-red-100 text-red-800 border-red-300"
      case "refunded": return "bg-blue-100 text-blue-800 border-blue-300"
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

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case "credit_card":
        return "บัตรเครดิต"
      case "bank_transfer":
        return "โอนเงิน"
      case "cash":
        return "เงินสด"
      default:
        return method || "-"
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.pool_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesDate = !dateFilter || reservation.reservation_date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  const filteredLockerReservations = lockerReservations.filter((r) => {
    const matchesSearch =
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการการจอง
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ดูแลและจัดการการจองสระว่ายน้ำและตู้เก็บของทั้งหมด
            </p>
          </div>

          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
              <CardTitle className="text-xl font-bold text-gray-900">รายการการจองทั้งหมด</CardTitle>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="ค้นหาด้วยชื่อ, อีเมล, สระ, ตู้..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="สถานะทั้งหมด" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                    <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full md:w-auto"
                />
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      สร้างการจอง
                    </Button>
                  </DialogTrigger>
                  <Button variant="outline" className="ml-2">
                    ผู้ดูแลประจำวัน
                  </Button>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">สร้างการจองใหม่</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateReservation} className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user_id">สมาชิก</Label>
                          <Select value={newReservationData.user_id} onValueChange={(value) => setNewReservationData({...newReservationData, user_id: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสมาชิก" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pool_resource_id">สระว่ายน้ำ</Label>
                          <Select value={newReservationData.pool_resource_id} onValueChange={(value) => setNewReservationData({...newReservationData, pool_resource_id: value})}>
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
                          <Label htmlFor="reservation_date">วันที่</Label>
                          <Input
                            id="reservation_date"
                            type="date"
                            value={newReservationData.reservation_date}
                            onChange={(e) => setNewReservationData({...newReservationData, reservation_date: e.target.value})}
                            required
                            min={new Date().toISOString().split("T")[0]}
                            max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="start_time">เวลาเริ่มต้น</Label>
                          <Select
                            value={newReservationData.start_time}
                            onValueChange={(value) => {
                              setNewReservationData({
                                ...newReservationData,
                                start_time: value,
                                end_time: "21:00",
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกเวลา" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 8 }, (_, i) => {
                                const hour = 13 + i
                                return (
                                  <SelectItem key={hour} value={`${hour}:00`}>
                                    {`${hour}:00`}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_time">เวลาสิ้นสุด</Label>
                          <Input
                            id="end_time"
                            type="time"
                            value="21:00"
                            readOnly
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_method">วิธีการชำระเงิน</Label>
                          <Input id="payment_method" value="เงินสด" readOnly />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">หมายเหตุ</Label>
                        <textarea
                          id="notes"
                          className="w-full p-2 border rounded-md"
                          rows={3}
                          value={newReservationData.notes}
                          onChange={(e) => setNewReservationData({...newReservationData, notes: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        สร้างการจอง
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Pool Reservations Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">การจองสระ ({filteredReservations.length})</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สมาชิก</TableHead>
                        <TableHead>สระ</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead>เวลา</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>การชำระเงิน</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>
                            <div className="font-medium">{reservation.user_name || 'ไม่ระบุชื่อ'}</div>
                            <div className="text-sm text-gray-500">{reservation.user_email || 'ไม่ระบุอีเมล'}</div>
                          </TableCell>
                          <TableCell>{reservation.pool_name || 'ไม่ระบุสระ'}</TableCell>
                          <TableCell>{reservation.reservation_date && reservation.reservation_date !== 'null' && reservation.reservation_date !== '' ? new Date(reservation.reservation_date.split('-').join('/')).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}</TableCell>
                          <TableCell>{reservation.start_time || 'ไม่ระบุ'} - {reservation.end_time || 'ไม่ระบุ'}</TableCell>
                          <TableCell><Badge className={`${statusColor(reservation.status)}`}>{getStatusText(reservation.status)}</Badge></TableCell>
                          <TableCell>
                            <div>฿{reservation.payment_amount?.toLocaleString() || '-'}</div>
                            <div className="text-xs text-gray-500">{getPaymentMethodText(reservation.payment_method)}</div>
                            <Badge variant="outline" className={`mt-1 ${paymentStatusColor(reservation.payment_status)}`}>{reservation.payment_status || '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {reservation.status === "pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleUpdateReservationStatus(reservation.id, "confirmed")}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleUpdateReservationStatus(reservation.id, "cancelled")}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {reservation.status === "confirmed" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateReservationStatus(reservation.id, "completed")}
                                >
                                  เสร็จสิ้น
                                </Button>
                              )}
                              {reservation.slip_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(reservation.slip_url, "_blank")}
                                >
                                  ดูสลิป
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Locker Reservations Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">การจองตู้เก็บของ ({filteredLockerReservations.length})</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สมาชิก</TableHead>
                        <TableHead>ตู้</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead>เวลา</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>การชำระเงิน</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLockerReservations.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium">{r.first_name || ''} {r.last_name || ''}</div>
                            <div className="text-sm text-gray-500">{r.user_email || 'ไม่ระบุอีเมล'}</div>
                          </TableCell>
                          <TableCell>{r.locker_code || 'ไม่ระบุ'} ({r.location || 'ไม่ระบุ'})</TableCell>
                          <TableCell>{r.reservation_date && r.reservation_date !== 'null' && r.reservation_date !== '' ? new Date(r.reservation_date.split('-').join('/')).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}</TableCell>
                          <TableCell>{r.start_time || 'ไม่ระบุ'} - {r.end_time || 'ไม่ระบุ'}</TableCell>
                          <TableCell><Badge className={`${statusColor(r.status)}`}>{getStatusText(r.status)}</Badge></TableCell>
                          <TableCell>
                            <div>฿{r.payment_amount?.toLocaleString() || '-'}</div>
                            <div className="text-xs text-gray-500">{getPaymentMethodText(r.payment_method)}</div>
                            <Badge variant="outline" className={`mt-1 ${paymentStatusColor(r.payment_status)}`}>{r.payment_status || '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {r.status === "pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleUpdateLockerReservationStatus(r.id, "confirmed")}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleUpdateLockerReservationStatus(r.id, "cancelled")}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLockerReservation(r.id)}
                                title="ลบการจอง"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {r.slip_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(r.slip_url, "_blank")}
                                >
                                  ดูสลิป
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
