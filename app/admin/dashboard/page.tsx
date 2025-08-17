"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Users, Calendar, DollarSign, TrendingUp, Clock, AlertCircle, Plus, Box, X } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  total_members: number
  active_members: number
  members_diff: number
  today_reservations: number
  yesterday_reservations: number
  reservations_diff: number
  monthly_revenue: number
  today_revenue: number
  yesterday_revenue: number
  available_lockers: number
  total_lockers: number
}

interface RecentActivity {
  id: number
  type: string
  description: string
  created_at: string
  user_name?: string
}

interface Reservation {
  id: number
  reservation_date: string
  reservation_time?: string
  user_name: string
  pool_name: string
  status: string
  payment_status?: string
}

interface Notification {
  id: number
  title: string
  message: string
  type: 'warning' | 'info' | 'success'
  created_at: string
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as "warning" | "info" | "success"
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token")
        
        // Fetch dashboard stats
        const response = await fetch("http://localhost:3001/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setActivities(data.recent_activities || [])
        }

        // Fetch recent reservations
        const reservationsResponse = await fetch("http://localhost:3001/api/admin/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json()
          setReservations(reservationsData.reservations?.slice(0, 5) || [])
        }

        // Fetch notifications
        const notificationsResponse = await fetch("http://localhost:3001/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData.notifications?.slice(0, 1) || [])
        }

        // Locker stats are now included in the dashboard API response

      } catch (error) {
        console.error("Error fetching dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboard()
    }
  }, [user, router])

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: "all",
          title: newNotification.title,
          message: newNotification.message,
        }),
      })

      if (response.ok) {
        toast({
          title: "สร้างประกาศสำเร็จ",
          description: "ประกาศใหม่ได้รับการเพิ่มแล้ว",
        })
        setDialogOpen(false)
        setNewNotification({ title: "", message: "", type: "info" })
        
        // Create a new notification object for immediate display
        const newNotificationObj: Notification = {
          id: Date.now(),
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          created_at: new Date().toISOString()
        }
        
        // Add to notifications immediately for better UX
        setNotifications([newNotificationObj])
        
        // Also refresh from server
        const notificationsResponse = await fetch("http://localhost:3001/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData.notifications?.slice(0, 1) || [])
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถสร้างประกาศได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "ลบประกาศสำเร็จ",
          description: "ประกาศได้รับการลบแล้ว",
        })
        
        // Remove from local state immediately
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        // Also refresh from server
        const notificationsResponse = await fetch("http://localhost:3001/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData.notifications?.slice(0, 1) || [])
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบประกาศได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return <Badge className="bg-green-500 text-white">ชำระแล้ว</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">รอชำระเงิน</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">ยกเลิก</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>
    }
  }

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
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              แดชบอร์ดผู้ดูแลระบบ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ภาพรวมของระบบและข้อมูลสำคัญ
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">สมาชิกทั้งหมด</CardTitle>
                <Users className="h-6 w-6 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_members || 0}</div>
                <p className="text-xs text-blue-200 mt-1">
                  {stats?.members_diff ? (stats.members_diff > 0 ? `+${stats.members_diff}` : `${stats.members_diff}`) : '+0'} จากเดือนที่แล้ว
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">การจองวันนี้</CardTitle>
                <Calendar className="h-6 w-6 text-green-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.today_reservations || 0}</div>
                <p className="text-xs text-green-200 mt-1">
                  {stats?.reservations_diff ? (stats.reservations_diff > 0 ? `+${stats.reservations_diff}` : `${stats.reservations_diff}`) : '+0'} จากเมื่อวาน
                </p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">รายได้วันนี้</CardTitle>
                <DollarSign className="h-6 w-6 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">฿{stats?.today_revenue ? stats.today_revenue.toLocaleString() : '0'}</div>
                <p className="text-xs text-purple-200 mt-1">รายรับรวมวันนี้</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-orange-500 to-red-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">ตู้เก็บของว่าง</CardTitle>
                <Box className="h-6 w-6 text-orange-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.available_lockers || 0}/{stats?.total_lockers || 0}</div>
                <p className="text-xs text-orange-200 mt-1">
                  {stats?.total_lockers ? Math.round(((stats?.available_lockers || 0) / stats.total_lockers) * 100) : 0}% ว่าง
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-xl font-bold text-gray-900">การจองล่าสุด</CardTitle>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มประกาศ
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">วันที่</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">เวลา</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">สมาชิก</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">ประเภท</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reservations.length > 0 ? (
                          reservations.map((reservation) => (
                            <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">{new Date(reservation.reservation_date).toLocaleDateString('th-TH')}</td>
                              <td className="py-3 px-4">{reservation.reservation_time || '13:00 - 15:00'}</td>
                              <td className="py-3 px-4 font-medium text-gray-800">{reservation.user_name}</td>
                              <td className="py-3 px-4">{reservation.pool_name || 'สระหลัก'}</td>
                              <td className="py-3 px-4 text-center">{getStatusBadge(reservation.status)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-500">
                              <p>ไม่มีข้อมูลการจองล่าสุด</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Link href="/admin/reservations">
                      <Button variant="outline" className="transition-all duration-300 hover:bg-gray-100">
                        ดูการจองทั้งหมด
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Link href="/admin/notifications" className="block hover:opacity-90 transition-opacity">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <Card key={notification.id} className={`shadow-lg border-2 ${
                        notification.type === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                        notification.type === 'info' ? 'border-blue-300 bg-blue-50' :
                        'border-green-300 bg-green-50'
                      }`}>
                      <CardHeader className="flex flex-row items-start space-x-3 pb-3">
                        <AlertCircle className={`h-6 w-6 mt-1 ${
                          notification.type === 'warning' ? 'text-yellow-500' :
                          notification.type === 'info' ? 'text-blue-500' :
                          'text-green-500'
                        }`} />
                        <div>
                          <CardTitle className={`text-lg font-bold ${
                            notification.type === 'warning' ? 'text-yellow-800' :
                            notification.type === 'info' ? 'text-blue-800' :
                            'text-green-800'
                          }`}>{notification.title}</CardTitle>
                          <CardDescription className="text-xs">{new Date(notification.created_at).toLocaleString('th-TH')}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${
                          notification.type === 'warning' ? 'text-yellow-700' :
                          notification.type === 'info' ? 'text-blue-700' :
                          'text-green-700'
                        }`}>{notification.message}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="shadow-lg border-gray-200">
                    <CardContent className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีประกาศ</h3>
                      <p className="text-gray-600 text-sm">ยังไม่มีประกาศในขณะนี้</p>
                    </CardContent>
                  </Card>
                )}
              </Link>
            </div>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">สร้างประกาศใหม่</DialogTitle>
              <DialogDescription>
                ประกาศจะแสดงให้ผู้ใช้ทุกคนเห็น
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNotification} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-medium">หัวข้อ</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="เช่น ปิดปรับปรุงสระ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-medium">ข้อความ</Label>
                <Textarea
                  id="message"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="รายละเอียดประกาศ..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="font-medium">ประเภท</Label>
                <select
                  id="type"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as "warning" | "info" | "success" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">ข้อมูล (สีน้ำเงิน)</option>
                  <option value="warning">คำเตือน (สีเหลือง)</option>
                  <option value="success">ข่าวดี (สีเขียว)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  สร้างประกาศ
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
