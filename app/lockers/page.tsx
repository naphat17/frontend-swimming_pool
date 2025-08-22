"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import UserLayout from "@/components/user-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Plus, Trash2, Lock, LockOpen, Shield, AlertCircle, CreditCard, Banknote, Crown, Sparkles, Check, CheckCircle, XCircle, Gift } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Locker {
  id: number
  code: string
  location: string
  status: string
}

interface LockerReservation {
  id: number
  locker_code: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
}

export default function LockerReservationsPage() {
  const [lockerReservations, setLockerReservations] = useState<LockerReservation[]>([])
  const [availableLockers, setAvailableLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedLocker, setSelectedLocker] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  // Payment states (fixed amount 30 THB)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const slipInputRef = useRef<HTMLInputElement>(null)
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [lockerPrice, setLockerPrice] = useState(1500) // default price

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 7)
  const maxDateString = maxDate.toISOString().split("T")[0]

  useEffect(() => {
    fetchLockerReservations()
    fetchAvailableLockers()
    fetchBankAccountNumber()
    fetchLockerPrice()
  }, [])

  const fetchLockerReservations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/lockers/reservations/user", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setLockerReservations(data.reservations || [])
      }
    } catch (error) {
      console.error("Error fetching locker reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableLockers = async () => {
    try {
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/lockers/available")
      if (response.ok) {
        const data = await response.json()
        setAvailableLockers(data.lockers || [])
      }
    } catch (error) {
      console.error("Error fetching available lockers:", error)
    }
  }

  const fetchBankAccountNumber = async () => {
    try {
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/settings/bank_account_number")
      if (response.ok) {
        const data = await response.json()
        setBankAccountNumber(data.value)
      }
    } catch (error) {
      console.error("Error fetching bank account number:", error)
    }
  }

  const fetchLockerPrice = async () => {
    try {
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/settings/locker-price/current")
      if (response.ok) {
        const data = await response.json()
        setLockerPrice(parseFloat(data.price?.price) || 30)
      }
    } catch (error) {
      console.error("Error fetching locker price:", error)
      setLockerPrice(30) // fallback to default
    }
  }

  const handleLockerClick = (locker: Locker) => {
    if (locker.status === 'available') {
      setSelectedLocker(locker.id.toString());
      setDialogOpen(true);
    }
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLocker || !selectedDate) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "เลือกตู้และวันที่ที่ต้องการจอง",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

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

      const response = await fetch("https://backend-swimming-pool.onrender.com/api/lockers/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          locker_id: Number.parseInt(selectedLocker),
          reservation_date: selectedDate,
          payment_method: paymentMethod,
          amount: lockerPrice, // use dynamic price
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (paymentMethod === "bank_transfer" && slipFile && data.paymentId) {
          const formData = new FormData()
          formData.append("slip", slipFile)
          await fetch(`https://backend-swimming-pool.onrender.com/api/payments/${data.paymentId}/upload-slip`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })
        }
        toast({
          title: "จองตู้สำเร็จ",
          description: "การจองตู้ของคุณถูกบันทึกแล้ว",
        })
        setDialogOpen(false)
        setSelectedLocker("")
        setSelectedDate("")
        setPaymentMethod("cash")
        setSlipFile(null)
        if (slipInputRef.current) slipInputRef.current.value = ""
        fetchLockerReservations()
        fetchAvailableLockers()
      } else {
        const errorData = await response.json()
        toast({
          title: "จองตู้ไม่สำเร็จ",
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
    if (!confirm("คุณต้องการยกเลิกการจองตู้นี้หรือไม่?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-swimming-pool.onrender.com/api/lockers/reservations/${reservationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "ยกเลิกการจองตู้สำเร็จ",
          description: "การจองตู้ได้รับการยกเลิกแล้ว",
        })
        fetchLockerReservations()
      } else {
        toast({
          title: "ยกเลิกไม่สำเร็จ",
          description: "ไม่สามารถยกเลิกการจองตู้ได้",
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

  const getLockerIcon = (status: string) => {
    return status === 'available' ? LockOpen : Lock
  }

  const getLockerColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-green-300'
      case 'occupied':
        return 'bg-red-100 text-red-800 border-2 border-red-300 cursor-not-allowed'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 cursor-not-allowed'
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'ว่าง'
      case 'occupied':
        return 'ไม่ว่าง'
      case 'maintenance':
        return 'ซ่อมแซม'
      default:
        return status
    }
  }

  const getReservationStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-300"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled": return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
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
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ตู้เก็บของ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จองและจัดการตู้เก็บของสำหรับความปลอดภัยของสิ่งของ
            </p>
          </div>

          {/* Service Info Card - Similar to membership status */}
          <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">
                        บริการตู้เก็บของ
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        ตู้เก็บของขนาด 30x30x60 ซม. พร้อมระบบล็อคอัตโนมัติ ใช้งานได้ตลอดวัน
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2 text-sm font-medium">
                    พร้อมใช้งาน
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-sm text-blue-100">ระยะเวลา</p>
                      <p className="text-lg font-semibold">ต่อวัน</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-sm text-blue-100">ราคา</p>
                      <p className="text-lg font-semibold">฿{lockerPrice.toLocaleString()} ต่อวัน</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-sm text-blue-100">ความปลอดภัย</p>
                      <p className="text-lg font-semibold">ล็อคอัตโนมัติ</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Lockers Section */}
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">ตู้เก็บของที่พร้อมใช้งาน</h2>
              <p className="text-gray-600">เลือกตู้เก็บของที่ต้องการจอง</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {availableLockers.map((locker) => {
                const IconComponent = getLockerIcon(locker.status)
                return (
                  <Card 
                    key={locker.id} 
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg group cursor-pointer ${getLockerColor(locker.status)}`}
                    onClick={() => handleLockerClick(locker)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{locker.code}</p>
                          <p className="text-sm opacity-80">{locker.location}</p>
                        </div>
                        <Badge 
                          variant={locker.status === 'available' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {getStatusText(locker.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Book Locker Button */}
            <div className="flex justify-center">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    จองตู้เก็บของ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-2">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <DialogTitle className="text-xl font-bold">จองตู้เก็บของ</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        เลือกตู้และวันที่ พร้อมชำระเงินค่าบริการ
                      </DialogDescription>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleSubmitReservation} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="locker" className="text-sm font-medium">เลือกตู้</Label>
                      <Select value={selectedLocker} onValueChange={setSelectedLocker} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกตู้ที่ต้องการจอง" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLockers.map((locker) => (
                            <SelectItem key={locker.id} value={locker.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span>{locker.code} - {locker.location}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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

                    {/* Payment section */}
                    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-blue-800 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2" />
                          ข้อมูลการชำระเงิน
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">ราคาค่าบริการตู้เก็บของ</p>
                              <p className="text-2xl font-bold text-blue-600">฿{lockerPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">ระยะเวลา</p>
                              <p className="text-lg font-semibold text-gray-900">ต่อวัน</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">วิธีชำระเงิน</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant={paymentMethod === "cash" ? "default" : "outline"}
                              className="h-16 flex flex-col items-center space-y-2"
                              onClick={() => setPaymentMethod("cash")}
                            >
                              <Banknote className="h-5 w-5" />
                              <span className="text-sm">จ่ายด้วยเงินสด</span>
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                              className="h-16 flex flex-col items-center space-y-2"
                              onClick={() => setPaymentMethod("bank_transfer")}
                            >
                              <CreditCard className="h-5 w-5" />
                              <span className="text-sm">โอนธนาคาร</span>
                            </Button>
                          </div>
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
                                onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                                required
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

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
                            <span>จองและชำระเงิน</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Reservations History - Similar to membership page layout */}
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">การจองของคุณ</h2>
              <p className="text-gray-600">ติดตามและจัดการการจองตู้เก็บของ</p>
            </div>
            
            {lockerReservations.length > 0 ? (
              <div className="grid gap-6 max-w-4xl mx-auto">
                {lockerReservations.map((reservation) => (
                  <Card key={reservation.id} className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                              <Lock className="h-5 w-5 mr-2 text-blue-600" />
                              ตู้: {reservation.locker_code}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                {reservation.reservation_date ? new Date(reservation.reservation_date.split('-').join('/')).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getReservationStatusColor(reservation.status)} px-3 py-2 text-sm font-medium flex items-center space-x-1`}>
                            {getReservationStatusIcon(reservation.status)}
                            <span>{reservation.status}</span>
                          </Badge>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="hover:scale-105 transition-transform"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                    <Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีการจองตู้</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    เริ่มจองตู้เก็บของเพื่อความปลอดภัยของสิ่งของ
                  </p>
                  <Button 
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    จองตู้ใหม่
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
