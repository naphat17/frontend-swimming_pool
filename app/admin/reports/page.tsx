"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { TrendingUp, Users, CreditCard, Activity, BarChart3 } from "lucide-react"

interface ReportData {
  usageStats: {
    totalReservations: number
    totalMembers: number
    totalRevenue: number
    activeUsers: number
  }
  membershipStats: {
    name: string
    count: number
    percentage: number
  }[]
  revenueByChannel: {
    channel: string
    amount: number
    count: number
  }[]
  userFrequency: {
    userName: string
    frequency: number
    lastVisit: string
  }[]
  monthlyRevenue: {
    month: string
    revenue: number
  }[]
  annualSubscribers: {
    year: number
    subscriberCount: number
    revenue: number
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdminReportsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData>({
    usageStats: {
      totalReservations: 0,
      totalMembers: 0,
      totalRevenue: 0,
      activeUsers: 0
    },
    membershipStats: [],
    revenueByChannel: [],
    userFrequency: [],
    monthlyRevenue: [],
    annualSubscribers: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchReportData()
  }, [user, router])

  const fetchReportData = async () => {
    try {
      setError(null)
      const token = localStorage.getItem("token")
      console.log("Fetching reports with token:", token ? "Present" : "Missing")
      
      if (!token) {
        setError("ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่")
        return
      }
      
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("Reports API response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Reports data received:", data)
        setReportData(data)
      } else {
        const errorText = await response.text()
        console.error("Reports API error:", response.status, errorText)
        
        if (response.status === 401) {
          setError("ไม่มีสิทธิ์เข้าถึงข้อมูลรายงาน กรุณาเข้าสู่ระบบใหม่")
        } else if (response.status === 500) {
          setError("เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง")
        } else {
          setError(`เกิดข้อผิดพลาด: ${response.status} - ${errorText}`)
        }
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ เกิดข้อผิดพลาด</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchReportData()
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  const hasData = reportData.usageStats.totalReservations > 0 || 
                  reportData.usageStats.totalMembers > 0 || 
                  reportData.usageStats.totalRevenue > 0 || 
                  reportData.membershipStats.length > 0 ||
                  reportData.revenueByChannel.length > 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">รายงานและสถิติ</h1>
              <p className="text-blue-100 mt-1">ข้อมูลสถิติการใช้งานและรายงานของระบบ</p>
            </div>
          </div>
        </div>

        {!hasData && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">📊 ยังไม่มีข้อมูลรายงาน</div>
            <p className="text-gray-400 mb-4">
              ข้อมูลรายงานจะแสดงเมื่อมีการจอง สมาชิก หรือการชำระเงินในระบบ
            </p>
            <button 
              onClick={() => {
                setLoading(true)
                fetchReportData()
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              รีเฟรชข้อมูล
            </button>
          </div>
        )}

        {hasData && (
          <>
            {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การจองทั้งหมด</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.usageStats.totalReservations?.toLocaleString() || '0'}</div>
              <p className="text-xs text-blue-100">รายการจองทั้งหมด</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สมาชิกทั้งหมด</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.usageStats.totalMembers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-green-100">สมาชิกที่ลงทะเบียน</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{reportData.usageStats.totalRevenue?.toLocaleString() || '0'}</div>
              <p className="text-xs text-purple-100">รายได้ทั้งหมด</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้งานที่ใช้งาน</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.usageStats.activeUsers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-orange-100">ผู้ใช้งานในเดือนนี้</p>
            </CardContent>
          </Card>
        </div>

            {/* Charts */}
            <Tabs defaultValue="membership" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="membership">สมาชิกตามประเภท</TabsTrigger>
            <TabsTrigger value="revenue">รายได้ตามช่องทาง</TabsTrigger>
            <TabsTrigger value="frequency">ความถี่การใช้งาน</TabsTrigger>
            <TabsTrigger value="monthly">รายได้รายเดือน</TabsTrigger>
            <TabsTrigger value="annual">ผู้สมัครรายปี</TabsTrigger>
          </TabsList>

          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>จำนวนสมาชิกในแต่ละประเภท</CardTitle>
                <CardDescription>แสดงการกระจายของสมาชิกตามประเภทสมาชิก</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={reportData.membershipStats || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.membershipStats?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )) || []}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'จำนวนสมาชิก']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>รายได้จากการชำระเงินในแต่ละช่องทาง</CardTitle>
                <CardDescription>เปรียบเทียบรายได้จากช่องทางการชำระเงินต่างๆ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.revenueByChannel || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="รายได้ (บาท)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frequency">
            <Card>
              <CardHeader>
                <CardTitle>ความถี่การใช้งานของสมาชิกแต่ละคน</CardTitle>
                <CardDescription>แสดงจำนวนครั้งการใช้งานของสมาชิกที่ใช้งานมากที่สุด 10 อันดับแรก</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.userFrequency?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="userName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'จำนวนครั้ง']} />
                    <Legend />
                    <Bar dataKey="frequency" fill="#82ca9d" name="จำนวนครั้งการใช้งาน" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>รายได้รายเดือน</CardTitle>
                <CardDescription>แสดงแนวโน้มรายได้ในแต่ละเดือน</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="รายได้ (บาท)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="annual">
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลผู้สมัครรายปี</CardTitle>
                <CardDescription>แสดงจำนวนผู้สมัครและรายได้ในแต่ละปี</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.annualSubscribers || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'จำนวนผู้สมัคร') return [value.toLocaleString(), name]
                        if (name === 'รายได้') return [`฿${value.toLocaleString()}`, name]
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="subscriberCount" fill="#8884d8" name="จำนวนผู้สมัคร" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="รายได้" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  )
}