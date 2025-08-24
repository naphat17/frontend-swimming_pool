'use client'

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Bell, Plus, Trash2, Check, X } from "lucide-react"

interface NotificationRow {
  id: number
  user_id: number
  title: string
  message: string
  is_read: 0 | 1
  created_at: string
  first_name: string
  last_name: string
  email: string
}

interface UserOption { id: number; name: string }

interface GroupedNotification {
  title: string;
  message: string;
  created_at: string;
  recipients: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_read: 0 | 1;
  }[];
}

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<GroupedNotification | null>(null)
  const [users, setUsers] = useState<UserOption[]>([])
  const [form, setForm] = useState({ user_id: "all", title: "", message: "" })
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }
    fetchNotifications()
    fetchUsers()
  }, [user, router, filter])

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams();
      if (filter !== "all") query.append("is_read", filter);
      const res = await fetch(`https://backend-l7q9.onrender.com/api/admin/notifications?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedNotifications = data.notifications || [];
        setNotifications(fetchedNotifications);

        const grouped = fetchedNotifications.reduce((acc: { [key: string]: GroupedNotification }, notif: NotificationRow) => {
          const key = `${notif.title}-${notif.message}`;
          if (!acc[key]) {
            acc[key] = {
              title: notif.title,
              message: notif.message,
              created_at: notif.created_at,
              recipients: [],
            };
          }
          acc[key].recipients.push({
            id: notif.id,
            first_name: notif.first_name,
            last_name: notif.last_name,
            email: notif.email,
            is_read: notif.is_read,
          });
          return acc;
        }, {});
        setGroupedNotifications(Object.values(grouped));
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("https://backend-l7q9.onrender.com/api/admin/users?role=user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers((data.users || []).map((u: any) => ({ id: u.id, name: `${u.first_name} ${u.last_name} (${u.email})` })))
      }
    } catch {}
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("https://backend-l7q9.onrender.com/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: form.user_id === "all" ? "all" : Number.parseInt(form.user_id),
          title: form.title,
          message: form.message,
        }),
      })
      if (res.ok) {
        toast({ title: "ส่งแจ้งเตือนสำเร็จ" })
        setDialogOpen(false)
        setForm({ user_id: "all", title: "", message: "" })
        fetchNotifications()
      } else {
        toast({ title: "ส่งไม่สำเร็จ", variant: "destructive" })
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
    }
  }

  const updateRead = async (id: number, is_read: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`https://backend-l7q9.onrender.com/api/admin/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_read }),
      })
      if (res.ok) fetchNotifications()
    } catch {}
  }

  const deleteRow = async (id: number) => {
    if (!confirm("ต้องการลบการแจ้งเตือนนี้หรือไม่?")) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`https://backend-l7q9.onrender.com/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchNotifications()
    } catch {}
  }

  const handleRowClick = (notification: GroupedNotification) => {
    setSelectedNotification(notification);
    setRecipientsDialogOpen(true);
  };

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

  if (user?.role !== "admin") return null

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการการแจ้งเตือน
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ส่งและจัดการข้อความแจ้งเตือนถึงสมาชิกทั้งหมด
            </p>
          </div>

          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">รายการประกาศ ({groupedNotifications.length})</CardTitle>
                <p className="text-gray-600">ประวัติการแจ้งเตือนทั้งหมดที่ส่งถึงสมาชิก</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">สถานะ:</Label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="false">ยังไม่อ่าน</SelectItem>
                      <SelectItem value="true">อ่านแล้ว</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ส่งแจ้งเตือนใหม่
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">หัวข้อ</TableHead>
                      <TableHead className="font-semibold">ข้อความ</TableHead>
                      <TableHead className="text-center font-semibold">จำนวนผู้รับ</TableHead>
                      <TableHead className="font-semibold">วันที่ส่ง</TableHead>
                      <TableHead className="text-right font-semibold">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedNotifications.map((n, i) => (
                      <TableRow key={i} onClick={() => handleRowClick(n)} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">{n.title}</TableCell>
                        <TableCell className="max-w-sm truncate">{n.message}</TableCell>
                        <TableCell className="text-center">{n.recipients.length}</TableCell>
                        <TableCell>{new Date(n.created_at).toLocaleString("th-TH")}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteRow(n.recipients[0].id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={recipientsDialogOpen} onOpenChange={setRecipientsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>ผู้รับประกาศ: {selectedNotification?.title}</DialogTitle>
              <DialogDescription>
                รายชื่อผู้ใช้ที่ได้รับประกาศนี้และสถานะการอ่าน
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedNotification?.recipients.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.first_name} {r.last_name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {r.is_read ? (
                          <span className="text-green-600">อ่านแล้ว</span>
                        ) : (
                          <span className="text-yellow-600">ยังไม่อ่าน</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">สร้างประกาศใหม่</DialogTitle>
              <DialogDescription>
                สร้างประกาศใหม่เพื่อส่งให้สมาชิกในระบบ
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="user_id" className="font-medium">ผู้รับ</Label>
                <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                  <SelectTrigger id="user_id"><SelectValue placeholder="เลือกสมาชิก" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">สมาชิกทั้งหมด</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="font-medium">หัวข้อ</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-medium">ข้อความ</Label>
                <Input id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">ส่งประกาศ</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
