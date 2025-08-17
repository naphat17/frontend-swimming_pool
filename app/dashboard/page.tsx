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
      <div
        className="min-h-screen bg-cover bg-center relative p-6"
        style={{ backgroundImage: "url('/555.png')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10">
          {/* Welcome Header Card */}
          <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex justify-center mb-4">
                  <img src="/LOGO.png" alt="Logo" className="h-16 w-16" />
                </div>
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-blue-600">
                    ยินดีต้อนรับ, {user?.first_name} {user?.last_name}
                  </h1>
                  <p className="text-lg text-gray-600">ภาพรวมการใช้งานระบบสระว่ายน้ำโรจนากร</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3">สถานะสมาชิก</p>
                  <div>
                    {data?.membership ? (
                      <Badge className={`text-lg px-4 py-2 ${getMembershipStatusColor(data.membership.status)}`}>
                        {data.membership.status === "active"
                          ? "ใช้งานได้"
                          : data.membership.status === "expired"
                            ? "หมดอายุ"
                            : "รอดำเนินการ"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-lg px-4 py-2">ไม่มีสมาชิกภาพ</Badge>
                    )}
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3">การจองที่จะมาถึง</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.upcoming_reservations?.length || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3">การใช้งานเดือนนี้</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.usage_stats?.this_month_reservations || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-600 mb-3">การแจ้งเตือน</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data?.notifications?.filter((n) => !n.is_read).length || 0}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Membership Status */}
          {data?.membership && (
            <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl font-bold text-gray-900">สถานะสมาชิกภาพ</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">ประเภท: {data.membership.type}</p>
                  <p className="text-lg text-gray-600">
                    หมดอายุ: {new Date(data.membership.expires_at).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <Badge className={`text-lg px-6 py-3 ${getMembershipStatusColor(data.membership.status)}`}>
                  {data.membership.status === "active"
                    ? "ใช้งานได้"
                    : data.membership.status === "expired"
                      ? "หมดอายุ"
                      : "รอดำเนินการ"}
                </Badge>
              </div>
              {data.membership.status === "expired" && (
                <div className="mt-6">
                  <Button size="lg" className="px-8 py-3 text-lg" asChild>
                    <Link href="/membership">ต่ออายุสมาชิกภาพ</Link>
                  </Button>
                </div>
              )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Reservations */}
          <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">การจองที่จะมาถึง</CardTitle>
            </div>
            <CardDescription className="text-lg text-gray-600">รายการการจองในอนาคต</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {data?.upcoming_reservations && data.upcoming_reservations.length > 0 ? (
              <div className="space-y-4">
                {data.upcoming_reservations.map((reservation) => (
                  <Card key={reservation.id} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-800">{reservation.pool_name}</p>
                            <p className="text-lg text-gray-600">
                              {new Date(reservation.reservation_date).toLocaleDateString("th-TH")} {reservation.start_time}{" "}
                              - {reservation.end_time}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-lg px-4 py-2 ${getReservationStatusColor(reservation.status)}`}>
                          {reservation.status === "confirmed"
                            ? "ยืนยันแล้ว"
                            : reservation.status === "pending"
                              ? "รอยืนยัน"
                              : "ยกเลิก"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-center pt-4">
                  <Button variant="outline" size="lg" className="px-8 py-3 text-lg" asChild>
                    <Link href="/reservations">ดูการจองทั้งหมด</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <p className="text-xl text-gray-600 mb-6">ไม่มีการจองที่จะมาถึง</p>
                <Button size="lg" className="px-8 py-3 text-lg" asChild>
                  <Link href="/reservations">จองการใช้งาน</Link>
                </Button>
              </div>
            )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          {data?.notifications && data.notifications.length > 0 && (
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl font-bold text-gray-900">การแจ้งเตือนล่าสุด</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-4">
                {data.notifications.slice(0, 5).map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-2 transition-colors ${!notification.is_read ? "bg-blue-50 border-blue-300" : "border-gray-200"}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xl font-semibold text-gray-800">{notification.title}</p>
                          <p className="text-lg text-gray-600 mt-2">{notification.message}</p>
                          <p className="text-base text-gray-500 mt-3">
                            {new Date(notification.created_at).toLocaleDateString("th-TH")}
                          </p>
                        </div>
                        {!notification.is_read && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
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
