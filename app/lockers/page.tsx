"use client"

import React, { useEffect, useRef, useState } from "react"
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

  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const slipInputRef = useRef<HTMLInputElement>(null)
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [lockerPrice, setLockerPrice] = useState(1500)

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 7)
  const maxDateString = maxDate.toISOString().split("T")[0]

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchReservations(),
          fetchBankAccountNumber(),
          fetchLockerPrice()
        ])
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableLockers()
    }
  }, [selectedDate])

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/lockers/reservations/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLockerReservations(data.reservations || [])
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    }
  }

  const fetchAvailableLockers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/lockers/available?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      const response = await fetch("https://backend-l7q9.onrender.com/api/settings/bank_account_number")
      if (response.ok) {
        const data = await response.json()
        setBankAccountNumber(data.value || "")
      }
    } catch (error) {
      console.error("Error fetching bank account:", error)
    }
  }

  const fetchLockerPrice = async () => {
    try {
      const response = await fetch("https://backend-l7q9.onrender.com/api/settings/locker_price")
      if (response.ok) {
        const data = await response.json()
        setLockerPrice(data.value || 1500)
      }
    } catch (error) {
      console.error("Error fetching locker price:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocker || !selectedDate) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกตู้และวันที่",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      
      // Find the locker ID from the selected locker code
      const selectedLockerObj = availableLockers.find(locker => locker.code === selectedLocker)
      if (!selectedLockerObj) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่พบข้อมูลตู้ที่เลือก",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      const formData = new FormData()
      formData.append("locker_id", selectedLockerObj.id.toString())
      formData.append("reservation_date", selectedDate)
      formData.append("payment_method", paymentMethod)
      formData.append("amount", lockerPrice.toString())
      
      if (paymentMethod === "bank_transfer" && slipFile) {
        formData.append("slip", slipFile)
      }

      const response = await fetch("https://backend-l7q9.onrender.com/api/lockers/reservations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "จองสำเร็จ",
          description: "จองตู้เก็บของเรียบร้อยแล้ว",
        })
        setDialogOpen(false)
        setSelectedLocker("")
        setSelectedDate("")
        setSlipFile(null)
        fetchReservations()
      } else {
        const errorData = await response.json()
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถจองได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/lockers/reservations/${reservationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "ยกเลิกสำเร็จ",
          description: "ยกเลิกการจองเรียบร้อยแล้ว",
        })
        fetchReservations()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถยกเลิกการจองได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    }
  }

  const handleLockerClick = (lockerCode: string) => {
    setSelectedLocker(lockerCode)
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

          <Card className="bg-white/80 backdrop-blur-sm border-blue-100/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-800">
                      เลือกวันที่จอง
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      เลือกวันที่ที่ต้องการใช้ตู้เก็บของ
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  ราคา {lockerPrice.toLocaleString()} บาท/วัน
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                    วันที่
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    max={maxDateString}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">ตู้ที่ว่าง</h2>
            </div>

            {availableLockers.length === 0 && selectedDate ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีตู้ว่าง</h3>
                <p className="text-gray-500 mb-4">ไม่มีตู้เก็บของว่างในวันที่เลือก</p>
                <Button
                  onClick={() => setSelectedDate("")}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  เลือกวันที่ใหม่
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {availableLockers.map((locker) => (
                  <Card
                    key={locker.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedLocker === locker.code
                        ? "ring-2 ring-blue-500 bg-blue-50/50"
                        : "hover:shadow-md bg-white/80 backdrop-blur-sm border-blue-100/50"
                    }`}
                    onClick={() => handleLockerClick(locker.code)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <LockOpen className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              ตู้ {locker.code}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {locker.location}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          ว่าง
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!selectedLocker || !selectedDate}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  จองตู้เก็บของ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-blue-100/50">
                <DialogHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-blue-800">ยืนยันการจอง</DialogTitle>
                      <DialogDescription className="text-blue-600">
                        กรุณาตรวจสอบข้อมูลและเลือกวิธีการชำระเงิน
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">ตู้ที่เลือก</Label>
                      <Select value={selectedLocker} onValueChange={setSelectedLocker}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                          <SelectValue placeholder="เลือกตู้" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLockers.map((locker) => (
                            <SelectItem key={locker.id} value={locker.code}>
                              <div className="flex items-center space-x-2">
                                <LockOpen className="h-4 w-4 text-green-600" />
                                <span>ตู้ {locker.code} - {locker.location}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reservation-date" className="text-sm font-medium text-gray-700">
                        วันที่จอง
                      </Label>
                      <Input
                        id="reservation-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        max={maxDateString}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        readOnly
                      />
                    </div>

                    <Card className="bg-blue-50/50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-800 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2" />
                          วิธีการชำระเงิน
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 p-3 border border-blue-200 rounded-lg bg-white">
                              <Banknote className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium">เงินสด</span>
                            </div>
                            <Button
                              type="button"
                              variant={paymentMethod === "cash" ? "default" : "outline"}
                              className={`w-full ${
                                paymentMethod === "cash"
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
                              }`}
                              onClick={() => setPaymentMethod("cash")}
                            >
                              เลือก
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 p-3 border border-blue-200 rounded-lg bg-white">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium">โอนธนาคาร</span>
                            </div>
                            <Button
                              type="button"
                              variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                              className={`w-full ${
                                paymentMethod === "bank_transfer"
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
                              }`}
                              onClick={() => setPaymentMethod("bank_transfer")}
                            >
                              เลือก
                            </Button>
                          </div>
                        </div>
                        
                        {paymentMethod === "bank_transfer" && (
                          <div className="space-y-3 p-4 bg-white rounded-lg border border-blue-200">
                            <div className="text-sm">
                              <p className="font-medium text-gray-700 mb-1">โอนเงินไปที่:</p>
                              <p className="text-blue-600 font-mono">{bankAccountNumber}</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="slip" className="text-sm font-medium text-gray-700">
                                อัปโหลดสลิปการโอนเงิน
                              </Label>
                              <Input
                                id="slip"
                                type="file"
                                accept="image/*"
                                ref={slipInputRef}
                                onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || (paymentMethod === "bank_transfer" && !slipFile)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {submitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>กำลังจอง...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4" />
                          <span>ยืนยันการจอง</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">การจองของฉัน</h2>
            
            {lockerReservations.length > 0 ? (
              <div className="space-y-4">
                {lockerReservations.map((reservation) => (
                  <Card key={reservation.id} className="bg-white/80 backdrop-blur-sm border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Lock className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              ตู้ {reservation.locker_code}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                {(() => {
                                  const date = new Date(reservation.reservation_date)
                                  const thaiMonths = [
                                    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                                    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                                  ]
                                  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="secondary"
                            className={`${getReservationStatusColor(reservation.status)} border`}
                          >
                            {reservation.status === "confirmed" && "ยืนยันแล้ว"}
                            {reservation.status === "pending" && "รอยืนยัน"}
                            {reservation.status === "cancelled" && "ยกเลิกแล้ว"}
                          </Badge>
                          {reservation.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              ยกเลิก
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100/50 shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Lock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีการจอง</h3>
                  <p className="text-gray-500 mb-6">
                    เริ่มจองตู้เก็บของเพื่อความปลอดภัยของสิ่งของ
                  </p>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg" 
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    เริ่มจอง
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
