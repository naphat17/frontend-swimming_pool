"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, MapPin, Users, Settings, Wind, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface Pool {
  id: number
  name: string
  description: string
  capacity: number
  status: string
  schedules?: Array<{
    day_of_week: string
    open_time: string
    close_time: string
    is_active: boolean
  }>
}

interface BookingStats {
  date: string
  total_bookings: number
  available_slots: number
  pool_id: number
}

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  bookingStats?: BookingStats
}

const dayNames = {
  monday: "จันทร์",
  tuesday: "อังคาร",
  wednesday: "พุธ",
  thursday: "พฤหัสบดี",
  friday: "ศุกร์",
  saturday: "เสาร์",
  sunday: "อาทิตย์",
}

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function AdminPoolsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [newPoolData, setNewPoolData] = useState({
    name: "",
    description: "",
    capacity: 10,
    status: "available",
  })
  const [schedules, setSchedules] = useState(
    daysOfWeek.map((day) => ({
      day_of_week: day,
      open_time: "06:00",
      close_time: "22:00",
      is_active: true,
    })),
  )
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookingStats, setBookingStats] = useState<BookingStats[]>([])
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedPoolForCalendar, setSelectedPoolForCalendar] = useState<Pool | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchPools()
  }, [user, router])

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
    } finally {
      setLoading(false)
    }
  }

  // Set default pool for calendar when pools are loaded
  useEffect(() => {
    if (pools.length > 0 && !selectedPoolForCalendar) {
      const availablePool = pools.find(pool => pool.status === 'available') || pools[0]
      setSelectedPoolForCalendar(availablePool)
    }
  }, [pools])

  // Fetch calendar data when pool is selected
  useEffect(() => {
    if (selectedPoolForCalendar) {
      fetchCalendarData(selectedPoolForCalendar, currentDate)
    }
  }, [selectedPoolForCalendar, currentDate])

  const fetchCalendarData = async (pool: Pool, date: Date) => {
    setCalendarLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        generateCalendarDays(date, [])
        return
      }

      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      const response = await fetch(`http://localhost:3001/api/admin/booking-stats?pool_id=${pool.id}&year=${year}&month=${month}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBookingStats(data)
        generateCalendarDays(date, data)
      } else {
        generateCalendarDays(date, [])
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      generateCalendarDays(date, [])
    } finally {
      setCalendarLoading(false)
    }
  }

  const generateCalendarDays = (date: Date, bookingStats: BookingStats[]) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const today = new Date()
    const thailandToday = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}))
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      const stats = bookingStats.find(stat => stat.date === dateString)
      
      const todayString = `${thailandToday.getFullYear()}-${String(thailandToday.getMonth() + 1).padStart(2, '0')}-${String(thailandToday.getDate()).padStart(2, '0')}`
      
      days.push({
        date: dateString,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateString === todayString,
        bookingStats: stats
      })
    }
    
    setCalendarData(days)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    if (selectedPoolForCalendar) {
      fetchCalendarData(selectedPoolForCalendar, newDate)
    }
  }



  const fetchPoolSchedule = async (poolId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/pools/${poolId}/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error("Error fetching pool schedule:", error)
    }
  }

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/admin/pools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPoolData),
      })

      if (response.ok) {
        toast({
          title: "เพิ่มสระสำเร็จ",
          description: "สระใหม่ได้รับการเพิ่มเข้าสู่ระบบแล้ว",
        })
        setDialogOpen(false)
        setNewPoolData({
          name: "",
          description: "",
          capacity: 10,
          status: "available",
        })
        fetchPools()
      } else {
        const errorData = await response.json()
        toast({
          title: "เพิ่มสระไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มสระได้",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPool) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/pools/${editingPool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingPool.name,
          description: editingPool.description,
          capacity: editingPool.capacity,
          status: editingPool.status,
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตสระสำเร็จ",
          description: "ข้อมูลสระได้รับการอัปเดตแล้ว",
        })
        setEditingPool(null)
        fetchPools()
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลได้",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPool) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/pools/${selectedPool.id}/schedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedules }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตตารางเวลาสำเร็จ",
          description: "ตารางเวลาได้รับการอัปเดตแล้ว",
        })
        setScheduleDialogOpen(false)
        setSelectedPool(null)
        fetchPools()
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตตารางเวลาได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตตารางเวลาได้",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "เปิดใช้งาน"
      case "maintenance":
        return "ปิดซ่อมบำรุง"
      case "closed":
        return "ปิดใช้งาน"
      default:
        return status
    }
  }

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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
                  <Wind className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  จัดการสระว่ายน้ำ
                </h1>
                <p className="text-blue-100 text-lg sm:text-xl font-medium max-w-3xl mx-auto px-4">
                  เพิ่ม แก้ไข และจัดการข้อมูลสระว่ายน้ำและตารางเวลาอย่างมีประสิทธิภาพ
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end mb-4 sm:mb-6">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-blue-600 bg-white hover:bg-blue-50 transition-all duration-300 shadow-lg hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มสระใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>เพิ่มสระใหม่</DialogTitle>
                    <DialogDescription>กรอกข้อมูลสระว่ายน้ำใหม่</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePool} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">ชื่อสระ</Label>
                      <Input
                        id="name"
                        value={newPoolData.name}
                        onChange={(e) => setNewPoolData({ ...newPoolData, name: e.target.value })}
                        required
                        placeholder="เช่น สระหลัก, สระเด็ก"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">คำอธิบาย</Label>
                      <Input
                        id="description"
                        value={newPoolData.description}
                        onChange={(e) => setNewPoolData({ ...newPoolData, description: e.target.value })}
                        placeholder="คำอธิบายเพิ่มเติม"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">ความจุ (คน)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newPoolData.capacity}
                        onChange={(e) => setNewPoolData({ ...newPoolData, capacity: e.target.value ? Number.parseInt(e.target.value) : 0 })}
                        min="1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">สถานะ</Label>
                      <Select
                        value={newPoolData.status}
                        onValueChange={(value) => setNewPoolData({ ...newPoolData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">เปิดใช้งาน</SelectItem>
                          <SelectItem value="maintenance">ปิดซ่อมบำรุง</SelectItem>
                          <SelectItem value="closed">ปิดใช้งาน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button type="submit">เพิ่มสระ</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="mb-6 sm:mb-8 border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-6 w-6" />
                  </div>
                  ปฏิทินการจองสระว่ายน้ำ
                </CardTitle>
                <CardDescription className="text-emerald-50 text-base">
                  ติดตามและจัดการการจองสระว่ายน้ำในแต่ละวันอย่างมีประสิทธิภาพ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <Label className="text-lg font-semibold text-gray-700">เลือกสระ:</Label>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {pools.map((pool, index) => (
                        <Button
                          key={pool.id}
                          variant={selectedPoolForCalendar?.id === pool.id ? "default" : "outline"}
                          size="sm"
                          className={`transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 py-2 ${
                            selectedPoolForCalendar?.id === pool.id
                              ? `bg-gradient-to-r ${index % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'} text-white shadow-lg transform scale-105`
                              : `border-2 ${index % 2 === 0 ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`
                          }`}
                          onClick={() => setSelectedPoolForCalendar(pool)}
                          disabled={pool.status !== 'available'}
                        >
                          {pool.name}
                          {pool.status !== 'available' && (
                            <span className="ml-1 text-xs opacity-70">(ปิด)</span>
                          )}
                        </Button>
                      ))}
                    </div>
                    {selectedPoolForCalendar && (
                      <Badge variant="secondary" className="text-sm font-medium">
                        ({selectedPoolForCalendar.name})
                      </Badge>
                    )}
                  </div>

                  {selectedPoolForCalendar && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('prev')}
                          className="hover:bg-gray-100"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="text-xl font-bold text-gray-800">
                          {currentDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('next')}
                          className="hover:bg-gray-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {calendarLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                          <div className="grid grid-cols-7 gap-0">
                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day) => (
                              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                                {day}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-0">
                            {calendarData.map((day, index) => (
                              <div
                                key={index}
                                className={`
                                  min-h-[80px] p-2 border-r border-b border-gray-100 transition-all duration-200
                                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-blue-50'}
                                  ${day.isToday ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : ''}
                                `}
                              >
                                <div className="text-sm font-medium mb-1">{day.day}</div>
                                
                                {day.isCurrentMonth && day.bookingStats && (
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className={day.isToday ? 'text-blue-100' : 'text-blue-600'}>จอง:</span>
                                      <span className={`font-bold ${
                                        day.isToday ? 'text-white' : 'text-blue-800'
                                      }`}>
                                        {day.bookingStats.total_bookings}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className={day.isToday ? 'text-green-100' : 'text-green-600'}>ว่าง:</span>
                                      <span className={`font-bold ${
                                        day.isToday ? 'text-white' : 'text-green-800'
                                      }`}>
                                        {day.bookingStats.available_slots}
                                      </span>
                                    </div>
                                    
                                    <div className={`w-full h-1 rounded-full ${
                                      day.bookingStats.available_slots === 0 
                                        ? 'bg-red-400' 
                                        : day.bookingStats.available_slots < 5 
                                        ? 'bg-yellow-400' 
                                        : 'bg-green-400'
                                    }`}></div>
                                  </div>
                                )}
                                
                                {day.isCurrentMonth && !day.bookingStats && (
                                  <div className="text-xs text-gray-500">ไม่มีข้อมูล</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">ว่าง (5+ ช่วง)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">เหลือน้อย (1-4 ช่วง)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">เต็ม</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => (
                <Card key={pool.id} className="group relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 transition-all duration-500 transform hover:scale-105 hover:shadow-3xl rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative z-10 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{pool.name}</CardTitle>
                        <CardDescription className="mt-2 text-gray-600 font-medium">{pool.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getStatusColor(pool.status)} px-3 py-1 text-sm font-semibold rounded-full shadow-sm`}>{getStatusText(pool.status)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">ความจุ: <span className="text-blue-600">{pool.capacity}</span> คน</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => setEditingPool(pool)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        แก้ไข
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                        onClick={() => {
                          setSelectedPool(pool)
                          fetchPoolSchedule(pool.id)
                          setScheduleDialogOpen(true)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        ตารางเวลา
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pools.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Wind className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีสระว่ายน้ำ</h3>
                  <p className="text-gray-500 mb-4">เริ่มต้นโดยการเพิ่มสระว่ายน้ำแรกของคุณ</p>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มสระแรก
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={!!editingPool} onOpenChange={() => setEditingPool(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลสระ</DialogTitle>
              <DialogDescription>อัปเดตข้อมูลสระว่ายน้ำ</DialogDescription>
            </DialogHeader>
            {editingPool && (
              <form onSubmit={handleUpdatePool} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">ชื่อสระ</Label>
                  <Input
                    id="edit-name"
                    value={editingPool.name}
                    onChange={(e) => setEditingPool({ ...editingPool, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">คำอธิบาย</Label>
                  <Input
                    id="edit-description"
                    value={editingPool.description}
                    onChange={(e) => setEditingPool({ ...editingPool, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">ความจุ (คน)</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={editingPool.capacity}
                    onChange={(e) => setEditingPool({ ...editingPool, capacity: e.target.value ? Number.parseInt(e.target.value) : 0 })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">สถานะ</Label>
                  <Select
                    value={editingPool.status}
                    onValueChange={(value) => setEditingPool({ ...editingPool, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">เปิดใช้งาน</SelectItem>
                      <SelectItem value="maintenance">ปิดซ่อมบำรุง</SelectItem>
                      <SelectItem value="closed">ปิดใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingPool(null)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-emerald-700">
                ตั้งค่าเวลาเปิด-ปิดสำหรับ <span className="font-bold text-emerald-600">{selectedPool?.name}</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div className="space-y-3">
                {schedules.map((schedule, index) => (
                  <div key={schedule.day_of_week} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 sm:p-5 border-2 border-gray-100 rounded-2xl bg-gradient-to-r from-white to-emerald-50/30 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 min-w-[100px]">
                      <span className="font-bold text-gray-700 text-sm sm:text-base">{dayNames[schedule.day_of_week as keyof typeof dayNames]}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => {
                          const newSchedules = [...schedules]
                          newSchedules[index].is_active = checked
                          setSchedules(newSchedules)
                        }}
                      />
                    </div>
                    {schedule.is_active && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`open_${schedule.day_of_week}`} className="text-sm font-semibold text-gray-600 w-10">
                            เปิด:
                          </Label>
                          <Input
                            id={`open_${schedule.day_of_week}`}
                            type="time"
                            value={schedule.open_time}
                            onChange={(e) => {
                              const newSchedules = [...schedules]
                              newSchedules[index].open_time = e.target.value
                              setSchedules(newSchedules)
                            }}
                            className="w-24"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`close_${schedule.day_of_week}`} className="text-sm font-semibold text-gray-600 w-10">
                            ปิด:
                          </Label>
                          <Input
                            id={`close_${schedule.day_of_week}`}
                            type="time"
                            value={schedule.close_time}
                            onChange={(e) => {
                              const newSchedules = [...schedules]
                              newSchedules[index].close_time = e.target.value
                              setSchedules(newSchedules)
                            }}
                            className="w-24"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  บันทึกตารางเวลา
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
