"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DialogTrigger } from "@/components/ui/dialog"
import { Crown, Users, CheckCircle, Clock, XCircle, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Membership {
  id: number
  user_id: number
  username: string
  first_name: string
  last_name: string
  membership_type_id: number
  membership_type: string
  expires_at: string
  status: string
  created_at: string
}

interface Payment {
  id: number
  user_id: number
  amount: number
  status: string
  payment_method: string
  transaction_id: string
  created_at: string
  slip_url?: string
}

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("")
  const [selected, setSelected] = useState<Membership | null>(null)
  const [editData, setEditData] = useState<Partial<Membership>>({})
  const [editOpen, setEditOpen] = useState(false)
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [slipDialogOpen, setSlipDialogOpen] = useState(false)
  const [slipUrl, setSlipUrl] = useState<string | null>(null)

  const fetchMemberships = async (status?: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      let url = "https://backend-swimming-pool.onrender.com/api/admin/memberships"
      if (status && status !== "all") url += `?status=${status}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setMemberships(data.memberships || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    const token = localStorage.getItem("token")
    const res = await fetch("https://backend-swimming-pool.onrender.com/api/admin/payments", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setPayments(data.payments || [])
    }
  }

  useEffect(() => { fetchMemberships(filter); fetchPayments() }, [filter])

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem("token")
    const res = await fetch(`https://backend-swimming-pool.onrender.com/api/admin/memberships/${id}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      toast({ title: "อนุมัติสมาชิกภาพสำเร็จ" })
      fetchMemberships(filter)
    }
  }
  const handleReject = async (id: number) => {
    const token = localStorage.getItem("token")
    const res = await fetch(`https://backend-swimming-pool.onrender.com/api/admin/memberships/${id}/reject`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      toast({ title: "ปฏิเสธสมาชิกภาพสำเร็จ" })
      fetchMemberships(filter)
    }
  }
  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบสมาชิกภาพนี้?")) return
    const token = localStorage.getItem("token")
    const res = await fetch(`https://backend-swimming-pool.onrender.com/api/admin/memberships/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      toast({ title: "ลบสมาชิกภาพสำเร็จ" })
      fetchMemberships(filter)
    }
  }
  const handleEdit = (m: Membership) => {
    setSelected(m)
    setEditData({ ...m })
    setEditOpen(true)
  }
  const handleEditSave = async () => {
    if (!selected) return
    const token = localStorage.getItem("token")
    const res = await fetch(`https://backend-swimming-pool.onrender.com/api/admin/memberships/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editData),
    })
    if (res.ok) {
      toast({ title: "บันทึกข้อมูลสำเร็จ" })
      setEditOpen(false)
      fetchMemberships(filter)
    }
  }

  // ฟังก์ชันหาหลักฐานการชำระของสมาชิก
  const getMembershipPayment = (membership: Membership) => {
    // หา payment ที่ user_id ตรงกัน และ payment_method เป็น bank_transfer และมี slip_url
    return payments.find(
      (p) => p.user_id === membership.user_id && p.payment_method === "bank_transfer" && p.slip_url
    )
  }

  // เพิ่มฟังก์ชันนับจำนวนสมาชิกแต่ละสถานะ
  const statusCount = memberships.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-300"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "expired": return "bg-gray-100 text-gray-600 border-gray-300"
      case "rejected": return "bg-red-100 text-red-700 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการสมาชิกภาพ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ดูแลและจัดการข้อมูลสมาชิกภาพทั้งหมดในระบบ
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">สมาชิกทั้งหมด</CardTitle>
                <Users className="h-6 w-6 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{memberships.length}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">ใช้งานได้</CardTitle>
                <CheckCircle className="h-6 w-6 text-green-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statusCount["active"] || 0}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-100">รอดำเนินการ</CardTitle>
                <Clock className="h-6 w-6 text-yellow-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statusCount["pending"] || 0}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-100">ถูกปฏิเสธ/หมดอายุ</CardTitle>
                <XCircle className="h-6 w-6 text-red-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(statusCount["rejected"] || 0) + (statusCount["expired"] || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
              <CardTitle className="text-xl font-bold text-gray-900">รายการสมาชิกภาพ</CardTitle>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input placeholder="ค้นหาด้วยชื่อ, ชื่อผู้ใช้..." className="pl-10 w-full" />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="สถานะทั้งหมด" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="active">ใช้งานได้</SelectItem>
                    <SelectItem value="expired">หมดอายุ</SelectItem>
                    <SelectItem value="rejected">ถูกปฏิเสธ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ชื่อ-นามสกุล</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>วันหมดอายุ</TableHead>
                        <TableHead className="text-center">สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberships.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="font-medium">{m.first_name} {m.last_name}</div>
                            <div className="text-sm text-gray-500">{m.username}</div>
                          </TableCell>
                          <TableCell>{m.membership_type}</TableCell>
                          <TableCell>{new Date(m.expires_at).toLocaleDateString("th-TH")}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${statusColor(m.status)}`}>{m.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>ดู/แก้ไข</Button>
                            {getMembershipPayment(m) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="secondary">ดูหลักฐาน</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>หลักฐานการชำระเงิน</DialogTitle>
                                  </DialogHeader>
                                  <img src={getMembershipPayment(m)?.slip_url} alt="slip" className="w-full rounded-md" />
                                </DialogContent>
                              </Dialog>
                            )}
                            {m.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => handleApprove(m.id)}>อนุมัติ</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(m.id)}>ปฏิเสธ</Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}>ลบ</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">แก้ไขข้อมูลสมาชิกภาพ</DialogTitle>
              <DialogDescription>
                สำหรับ {editData.first_name} {editData.last_name} ({editData.username})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membership_type" className="font-medium">ประเภทสมาชิกภาพ (ID)</Label>
                  <Input id="membership_type" type="number" value={editData.membership_type_id || ""} onChange={e => setEditData(d => ({ ...d, membership_type_id: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="font-medium">วันหมดอายุ</Label>
                  <Input id="expires_at" type="date" value={editData.expires_at ? new Date(editData.expires_at).toISOString().split("T")[0] : ""} onChange={e => setEditData(d => ({ ...d, expires_at: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">สถานะ</Label>
                <Select value={editData.status || ""} onValueChange={v => setEditData(d => ({ ...d, status: v }))}>
                  <SelectTrigger id="status"><SelectValue placeholder="เลือกสถานะ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleEditSave} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">บันทึกการเปลี่ยนแปลง</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}