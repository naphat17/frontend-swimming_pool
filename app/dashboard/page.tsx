"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import UserLayout from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, AlertCircle, CreditCard, Waves, Shield, Bell } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  membership: {
    type: string
    expires_at: string
    status: string
    user_category?: string
    pay_per_session_price?: number
    annual_price?: number
    membership_type_id?: number
  } | null
  upcoming_reservations: Array<{
    id: number
    reservation_date: string
    start_time: string
    end_time: string
    pool_name: string
    status: string
  }>
  notifications: Array<{
    id: number
    title: string
    message: string
    created_at: string
    is_read: boolean
  }>
  usage_stats: {
    total_reservations: number
    this_month_reservations: number
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("http://localhost:3001/api/user/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const dashboardData = await response.json()
          setData(dashboardData)
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <UserLayout>
        <div
          className="min-h-screen bg-cover bg-center relative flex items-center justify-center"
          style={{ backgroundImage: "url('/555.png')" }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">กำลังโหลด...</p>
          </div>
        </div>
      </UserLayout>
    )
  }

  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative p-6">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10">
          {/* Welcome Header Card */}
          <Card className="mb-8 shadow-2xl border-0 bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                  <img src="/LOGO.png" alt="Logo" className="relative h-20 w-20 shadow-lg" />
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    ยินดีต้อนรับ, {user?.first_name} {user?.last_name}
                  </h1>
                  <p className="text-xl text-gray-600 font-medium">ภาพรวมการใช้งานระบบสระว่ายน้ำโรจนากร</p>
                  <div className="mt-3 flex items-center justify-center md:justify-start space-x-2">
                    <Waves className="h-5 w-5 text-blue-500 animate-bounce" />
                    <span className="text-sm text-blue-600 font-medium">พร้อมให้บริการ 24/7</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-blue-700 transition-colors">สถานะสมาชิก</p>
                  <div>
                    {data?.membership ? (
                      <Badge className={`text-lg px-4 py-2 shadow-lg ${getMembershipStatusColor(data.membership.status)}`}>
                        {data.membership.status === "active"
                          ? "ใช้งานได้"
                          : data.membership.status === "expired"
                            ? "หมดอายุ"
                            : "รอดำเนินการ"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-lg px-4 py-2 shadow-lg">ไม่มีสมาชิกภาพ</Badge>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-green-700 transition-colors">การจองที่จะมาถึง</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{data?.upcoming_reservations?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-purple-700 transition-colors">การใช้งานเดือนนี้</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{data?.usage_stats?.this_month_reservations || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-orange-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3 group-hover:text-orange-700 transition-colors">การแจ้งเตือน</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {data?.notifications?.filter((n) => !n.is_read).length || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Bell className="h-8 w-8 text-orange-600 group-hover:text-orange-700 group-hover:animate-bounce" />
                </div>
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Membership Status */}
            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl mr-3 shadow-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  สถานะสมาชิกภาพ
                </h2>
                {data?.membership ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                      <span className="font-semibold text-gray-700">ประเภทสมาชิก:</span>
                      <span className="text-blue-600 font-bold text-lg">{data.membership.user_category || data.membership.type}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                      <span className="font-semibold text-gray-700">วันหมดอายุ:</span>
                      <span className="text-gray-900 font-medium">
                        {(() => {
                          // คำนวณวันหมดอายุเป็น 365 วันหลังจากวันสมัคร (created_at)
                          if (user?.created_at) {
                            const createdDate = new Date(user.created_at)
                            const expiryDate = new Date(createdDate)
                            expiryDate.setDate(createdDate.getDate() + 365)
                            return expiryDate.toLocaleDateString("th-TH")
                          }
                          return new Date(data.membership.expires_at).toLocaleDateString("th-TH")
                        })()} 
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                      <span className="font-semibold text-gray-700">สถานะ:</span>
                      <Badge className={`shadow-lg ${getMembershipStatusColor(data.membership.status)}`}>
                        {data.membership.status === "active"
                          ? "ใช้งานได้"
                          : data.membership.status === "expired"
                            ? "หมดอายุ"
                            : "รอดำเนินการ"}
                      </Badge>
                    </div>
                    {data.membership.status === "expired" && (
                      <div className="mt-6">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                          <Link href="/membership">ต่ออายุสมาชิกภาพ</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <CreditCard className="relative mx-auto h-20 w-20 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-xl mb-6">ยังไม่มีสมาชิกภาพ</p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                      <Link href="/membership">สมัครสมาชิก</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Reservations */}
            <Card className="group shadow-xl border-0 bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl mr-3 shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  การจองที่จะมาถึง
                </h2>
                {data?.upcoming_reservations && data.upcoming_reservations.length > 0 ? (
                  <div className="space-y-4">
                    {data.upcoming_reservations.slice(0, 3).map((reservation, index) => (
                      <div key={index} className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-l-4 border-green-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800 text-lg">
                              {reservation.pool_name}
                            </p>
                            <p className="text-gray-600 font-medium">
                              {reservation.reservation_date ? new Date(reservation.reservation_date.split('-').join('/')).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'} {reservation.start_time} - {reservation.end_time}
                            </p>
                          </div>
                          <Badge className={`shadow-lg ${getReservationStatusColor(reservation.status)}`}>
                            {reservation.status === "confirmed"
                              ? "ยืนยันแล้ว"
                              : reservation.status === "pending"
                                ? "รอยืนยัน"
                                : "ยกเลิก"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {data.upcoming_reservations.length > 3 && (
                      <p className="text-center text-gray-500 mt-6 font-medium">
                        และอีก {data.upcoming_reservations.length - 3} การจอง
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <Calendar className="relative mx-auto h-20 w-20 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-xl mb-6">ไม่มีการจองที่จะมาถึง</p>
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                      <Link href="/reservations">จองเลย</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>



          {/* Recent Notifications */}
          {data?.notifications && data.notifications.length > 0 && (
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/95 to-orange-50/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">การแจ้งเตือนล่าสุด</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-4">
                {data.notifications.slice(0, 5).map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${!notification.is_read ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-400" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xl font-semibold text-gray-800">{notification.title}</p>
                          <p className="text-lg text-gray-600 mt-2">{notification.message}</p>
                          <p className="text-base text-gray-500 mt-3">
                            {notification.created_at ? new Date(notification.created_at).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}
                          </p>
                        </div>
                        {!notification.is_read && <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg animate-pulse"></div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
