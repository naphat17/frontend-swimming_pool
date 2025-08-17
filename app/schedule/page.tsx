"use client"

import { useEffect, useState } from "react"
import UserLayout from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Calendar, Waves, Info, CheckCircle, XCircle, AlertCircle, Phone, Table } from "lucide-react"
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PoolSchedule {
  id: number
  name: string
  description: string
  capacity: number
  status: string
  schedules: Array<{
    day_of_week: string
    open_time: string
    close_time: string
    is_active: boolean
  }>
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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<PoolSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/pool-schedule")
        if (response.ok) {
          const data = await response.json()
          setSchedules(data.schedules || [])
        }
      } catch (error) {
        console.error("Error fetching schedules:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-300"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "closed":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4" />
      case "maintenance":
        return <AlertCircle className="h-4 w-4" />
      case "closed":
        return <XCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
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

  // Filter เฉพาะสระหลัก (เช่น สระหลัก)
  const filteredSchedules = schedules.filter(
    (pool) => !["สระเด็ก", "สระออกกำลังกาย", "สระจากุซซี่"].some((name) => pool.name.includes(name))
  )

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
              ตารางเวลาสระว่ายน้ำ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ตรวจสอบเวลาเปิด-ปิดและสถานะของสระว่ายน้ำแต่ละสระ
            </p>
          </div>

          {/* Pool Status Overview - Similar to membership status card */}
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
                        สระว่ายน้ำทั้งหมด
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        {filteredSchedules.filter(p => p.status === 'available').length} สระพร้อมให้บริการ
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2 text-sm font-medium">
                    เปิดบริการ
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-sm text-blue-100">เวลาทำการ</p>
                      <p className="text-lg font-semibold">06:00 - 22:00</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-sm text-blue-100">เปิดบริการ</p>
                      <p className="text-lg font-semibold">ทุกวัน</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-sm text-blue-100">ความจุรวม</p>
                      <p className="text-lg font-semibold">{filteredSchedules.reduce((sum, pool) => sum + pool.capacity, 0)} คน</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pool Schedules Grid */}
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">ตารางเวลาแต่ละสระ</h2>
              <p className="text-gray-600">เลือกดูรายละเอียดเวลาเปิด-ปิดของแต่ละสระ</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSchedules.map((pool) => (
                <Card key={pool.id} className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900">{pool.name}</CardTitle>
                          <CardDescription className="text-gray-600">{pool.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(pool.status)} px-3 py-2 text-sm font-medium flex items-center space-x-1`}>
                        {getStatusIcon(pool.status)}
                        <span>{getStatusText(pool.status)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        ความจุ: {pool.capacity} คน
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        ตารางเวลาเปิด-ปิด
                      </h4>
                      {pool.schedules && pool.schedules.length > 0 ? (
                        <div className="space-y-2">
                          {pool.schedules.map((schedule, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                schedule.is_active 
                                  ? "bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100" 
                                  : "bg-gray-50 hover:bg-gray-100"
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {dayNames[schedule.day_of_week as keyof typeof dayNames] || schedule.day_of_week}
                              </span>
                              <div className="flex items-center">
                                {schedule.is_active ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-2 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">
                                      {schedule.open_time} - {schedule.close_time}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500 font-medium">ปิด</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">ไม่มีข้อมูลตารางเวลา</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {schedules.length === 0 && (
              <Card className="text-center py-12 border-2 border-dashed border-gray-300 max-w-4xl mx-auto">
                <CardContent className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีข้อมูลตารางเวลา</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามข้อมูลเพิ่มเติม
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Schedule Table Section */}
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">ตารางเวลาเปิด-ปิดรายสัปดาห์</h2>
              <p className="text-gray-600">ดูภาพรวมเวลาเปิด-ปิดของทุกสระในแต่ละวัน</p>
            </div>

            <Card className="overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                    <Table className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">ตารางเวลาทำการ</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <UITable>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold text-gray-900 sticky left-0 bg-gray-50 z-10">สระว่ายน้ำ</TableHead>
                        <TableHead className="text-center font-medium">จันทร์</TableHead>
                        <TableHead className="text-center font-medium">อังคาร</TableHead>
                        <TableHead className="text-center font-medium">พุธ</TableHead>
                        <TableHead className="text-center font-medium">พฤหัสบดี</TableHead>
                        <TableHead className="text-center font-medium">ศุกร์</TableHead>
                        <TableHead className="text-center font-medium">เสาร์</TableHead>
                        <TableHead className="text-center font-medium">อาทิตย์</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((pool, index) => (
                        <TableRow key={pool.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="font-medium sticky left-0 bg-inherit">
                            <div className="flex items-center space-x-2">
                              <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                                <Waves className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{pool.name}</p>
                                <p className="text-xs text-gray-500">จำนวน {pool.capacity} คน</p>
                              </div>
                            </div>
                          </TableCell>
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                            const schedule = pool.schedules?.find(s => s.day_of_week === day)
                            return (
                              <TableCell key={day} className="text-center">
                                {schedule?.is_active ? (
                                  <div className="inline-flex flex-col items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg">
                                    <span className="text-xs font-medium">{schedule.open_time}</span>
                                    <span className="text-xs">-</span>
                                    <span className="text-xs font-medium">{schedule.close_time}</span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-lg text-xs font-medium">
                                    ปิด
                                  </span>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </UITable>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span className="text-gray-600">เปิดบริการ</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span className="text-gray-600">ปิดบริการ</span>
              </div>
            </div>
          </div>

          {/* General Information - Enhanced design */}
          <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">ข้อมูลทั่วไป</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center text-gray-900">
                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                      เวลาทำการ
                    </h4>
                    <p className="text-sm text-gray-600">จันทร์ - อาทิตย์: 06:00 - 22:00</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                      การจองล่วงหน้า
                    </h4>
                    <p className="text-sm text-gray-600">สามารถจองได้สูงสุด 7 วันล่วงหน้า</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center text-gray-900">
                      <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                      การยกเลิกการจอง
                    </h4>
                    <p className="text-sm text-gray-600">สามารถยกเลิกได้ก่อนเวลาใช้งาน 2 ชั่วโมง</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-purple-600" />
                      ติดต่อสอบถาม
                    </h4>
                    <p className="text-sm text-gray-600">โทร: 02-xxx-xxxx</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
