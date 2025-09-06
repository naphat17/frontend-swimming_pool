'use client' // บังคับให้ component นี้ทำงานฝั่ง client

// นำเข้า React hooks สำหรับจัดการ state และ side effects
import { useEffect, useState } from "react"
// นำเข้า layout และ authentication components
import AdminLayout from "@/components/admin-layout"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
// นำเข้า UI components จาก shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// นำเข้า hooks และ icons
import { useToast } from "@/hooks/use-toast"
import { Bell, Plus, Trash2, Check, X } from "lucide-react"

// Interface สำหรับข้อมูลการแจ้งเตือนที่ดึงจากฐานข้อมูล
interface NotificationRow {
  id: number // รหัสประจำตัวการแจ้งเตือน
  user_id: number // รหัสผู้ใช้ที่ได้รับการแจ้งเตือน
  title: string // หัวข้อการแจ้งเตือน
  message: string // ข้อความการแจ้งเตือน
  is_read: 0 | 1 // สถานะการอ่าน (0 = ยังไม่อ่าน, 1 = อ่านแล้ว)
  created_at: string // วันที่สร้างการแจ้งเตือน
  first_name: string // ชื่อจริงของผู้ใช้
  last_name: string // นามสกุลของผู้ใช้
  email: string // อีเมลของผู้ใช้
}

// Interface สำหรับตัวเลือกผู้ใช้ในฟอร์ม
interface UserOption { 
  id: number // รหัสผู้ใช้
  name: string // ชื่อแสดงผลของผู้ใช้
}

// Interface สำหรับการแจ้งเตือนที่จัดกลุ่มตามหัวข้อและข้อความ
interface GroupedNotification {
  title: string; // หัวข้อการแจ้งเตือน
  message: string; // ข้อความการแจ้งเตือน
  created_at: string; // วันที่สร้าง
  recipients: { // รายชื่อผู้รับการแจ้งเตือน
    id: number; // รหัสการแจ้งเตือน
    first_name: string; // ชื่อจริงของผู้รับ
    last_name: string; // นามสกุลของผู้รับ
    email: string; // อีเมลของผู้รับ
    is_read: 0 | 1; // สถานะการอ่าน
  }[];
}

// Component หลักสำหรับจัดการการแจ้งเตือนในระบบ Admin
export default function AdminNotificationsPage() {
  // Hooks สำหรับ authentication และ navigation
  const { user } = useAuth() // ข้อมูลผู้ใช้ที่ล็อกอิน
  const router = useRouter() // สำหรับเปลี่ยนหน้า
  
  // State สำหรับข้อมูลการแจ้งเตือน
  const [notifications, setNotifications] = useState<NotificationRow[]>([]) // ข้อมูลการแจ้งเตือนทั้งหมด
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([]) // การแจ้งเตือนที่จัดกลุ่มแล้ว
  const [loading, setLoading] = useState(true) // สถานะการโหลดข้อมูล
  const [filter, setFilter] = useState<string>("all") // ตัวกรองสถานะการอ่าน
  const [dialogOpen, setDialogOpen] = useState(false) // สถานะการเปิด dialog สร้างการแจ้งเตือน
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false) // สถานะการเปิด dialog รายชื่อผู้รับ
  const [selectedNotification, setSelectedNotification] = useState<GroupedNotification | null>(null) // การแจ้งเตือนที่เลือกดู
  const [users, setUsers] = useState<UserOption[]>([]) // รายชื่อผู้ใช้สำหรับเลือกส่งการแจ้งเตือน
  const [form, setForm] = useState({ user_id: "all", title: "", message: "" }) // ข้อมูลฟอร์มสร้างการแจ้งเตือน
  const { toast } = useToast() // Hook สำหรับแสดงข้อความแจ้งเตือน

  // useEffect สำหรับตรวจสอบสิทธิ์และโหลดข้อมูลเริ่มต้น
  useEffect(() => {
    if (!user) { // ถ้าไม่มีผู้ใช้ล็อกอิน
      router.push('/login') // เปลี่ยนไปหน้า login
      return
    }
    if (user.role !== "admin") { // ถ้าไม่ใช่ admin
      router.push("/dashboard") // เปลี่ยนไปหน้า dashboard
      return
    }
    fetchNotifications() // โหลดข้อมูลการแจ้งเตือน
    fetchUsers() // โหลดรายชื่อผู้ใช้
  }, [user, router, filter])

  // ฟังก์ชันสำหรับดึงข้อมูลการแจ้งเตือนจาก API
  const fetchNotifications = async () => {
    setLoading(true); // เริ่มสถานะการโหลด
    try {
      const token = localStorage.getItem("token"); // ดึง token จาก localStorage
      const query = new URLSearchParams(); // สร้าง query parameters
      if (filter !== "all") query.append("is_read", filter); // เพิ่มตัวกรองถ้าไม่ใช่ "all"
      const res = await fetch(`https://backend-l7q9.onrender.com/api/admin/notifications?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      });
      if (res.ok) { // ถ้าได้ response สำเร็จ
        const data = await res.json(); // แปลงข้อมูลเป็น JSON
        const fetchedNotifications = data.notifications || []; // ดึงข้อมูลการแจ้งเตือน
        setNotifications(fetchedNotifications); // เก็บข้อมูลการแจ้งเตือน

        // จัดกลุ่มการแจ้งเตือนตามหัวข้อและข้อความ
        const grouped = fetchedNotifications.reduce((acc: { [key: string]: GroupedNotification }, notif: NotificationRow) => {
          const key = `${notif.title}-${notif.message}`; // สร้าง key สำหรับจัดกลุ่ม
          if (!acc[key]) { // ถ้ายังไม่มีกลุ่มนี้
            acc[key] = {
              title: notif.title,
              message: notif.message,
              created_at: notif.created_at,
              recipients: [],
            };
          }
          // เพิ่มผู้รับในกลุ่ม
          acc[key].recipients.push({
            id: notif.id,
            first_name: notif.first_name,
            last_name: notif.last_name,
            email: notif.email,
            is_read: notif.is_read,
          });
          return acc;
        }, {});
        setGroupedNotifications(Object.values(grouped)); // เก็บข้อมูลที่จัดกลุ่มแล้ว
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e); // แสดงข้อผิดพลาด
    } finally {
      setLoading(false); // ปิดสถานะการโหลด
    }
  };

  // ฟังก์ชันสำหรับดึงรายชื่อผู้ใช้จาก API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const res = await fetch("https://backend-l7q9.onrender.com/api/admin/users?role=user", {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })
      if (res.ok) { // ถ้าได้ response สำเร็จ
        const data = await res.json() // แปลงข้อมูลเป็น JSON
        // แปลงข้อมูลผู้ใช้เป็นรูปแบบ option และเก็บในรายชื่อผู้ใช้
        setUsers((data.users || []).map((u: any) => ({ id: u.id, name: `${u.first_name} ${u.last_name} (${u.email})` })))
      }
    } catch {} // จัดการข้อผิดพลาด
  }

  // ฟังก์ชันสำหรับส่งการแจ้งเตือนใหม่
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault() // ป้องกันการ submit form แบบปกติ
    try {
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const res = await fetch("https://backend-l7q9.onrender.com/api/admin/notifications", {
        method: "POST", // ใช้ POST method สำหรับสร้างข้อมูลใหม่
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, // ส่ง token ใน header
        body: JSON.stringify({ // แปลงข้อมูลเป็น JSON string
          user_id: form.user_id === "all" ? "all" : Number.parseInt(form.user_id), // รหัสผู้ใช้ ("all" = ส่งให้ทุกคน)
          title: form.title, // หัวข้อการแจ้งเตือน
          message: form.message, // ข้อความการแจ้งเตือน
        }),
      })
      if (res.ok) { // ถ้าส่งสำเร็จ
        toast({ title: "ส่งแจ้งเตือนสำเร็จ" }) // แสดงข้อความสำเร็จ
        setDialogOpen(false) // ปิด dialog
        setForm({ user_id: "all", title: "", message: "" }) // ล้างข้อมูลฟอร์ม
        fetchNotifications() // โหลดข้อมูลการแจ้งเตือนใหม่
      } else {
        toast({ title: "ส่งไม่สำเร็จ", variant: "destructive" }) // แสดงข้อความผิดพลาด
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }) // แสดงข้อความผิดพลาด
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

  // ฟังก์ชันสำหรับลบการแจ้งเตือน
  const deleteRow = async (id: number) => {
    if (!confirm("ต้องการลบการแจ้งเตือนนี้หรือไม่?")) return // ยืนยันการลบ
    try {
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const res = await fetch(`https://backend-l7q9.onrender.com/api/admin/notifications/${id}`, {
        method: "DELETE", // ใช้ DELETE method สำหรับลบข้อมูล
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })
      if (res.ok) fetchNotifications() // โหลดข้อมูลใหม่หลังลบสำเร็จ
    } catch {} // จัดการข้อผิดพลาด
  }

  const handleRowClick = (notification: GroupedNotification) => {
    setSelectedNotification(notification);
    setRecipientsDialogOpen(true);
  };

  // แสดง loading spinner ขณะโหลดข้อมูล
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

  // ตรวจสอบสิทธิ์ admin - ถ้าไม่ใช่ admin จะไม่แสดงอะไร
  if (user?.role !== "admin") return null

  // ส่วน UI หลักของหน้าจัดการการแจ้งเตือน
  return (
    <AdminLayout> {/* Layout หลักสำหรับหน้า Admin */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* พื้นหลังแบบ gradient */}
        <div className="space-y-8 p-6"> {/* Container หลักพร้อม spacing */}
          {/* Hero Section - ส่วนหัวของหน้า */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Bell className="h-8 w-8 text-white" /> {/* ไอคอนระฆัง */}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการการแจ้งเตือน {/* หัวข้อหลัก */}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ส่งและจัดการข้อความแจ้งเตือนถึงสมาชิกทั้งหมด {/* คำอธิบาย */}
            </p>
          </div>

          {/* Card หลักสำหรับแสดงรายการการแจ้งเตือน */}
          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between"> {/* Header ของ Card */}
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">รายการประกาศ ({groupedNotifications.length})</CardTitle> {/* หัวข้อพร้อมจำนวน */}
                <p className="text-gray-600">ประวัติการแจ้งเตือนทั้งหมดที่ส่งถึงสมาชิก</p> {/* คำอธิบาย */}
              </div>
              <div className="flex items-center gap-4"> {/* ส่วนควบคุมด้านขวา */}
                <div className="flex items-center gap-2"> {/* ตัวกรองสถานะ */}
                  <Label className="font-medium">สถานะ:</Label>
                  <Select value={filter} onValueChange={setFilter}> {/* Dropdown สำหรับกรองสถานะ */}
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
                  <Plus className="h-4 w-4 mr-2" /> {/* ไอคอนเพิ่ม */}
                  ส่งแจ้งเตือนใหม่ {/* ข้อความปุ่ม */}
                </Button>
              </div>
            </CardHeader>
            <CardContent> {/* เนื้อหาของ Card */}
              <div className="overflow-x-auto"> {/* Container สำหรับ scroll แนวนอน */}
                <Table> {/* ตารางแสดงรายการการแจ้งเตือน */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">หัวข้อ</TableHead> {/* คอลัมน์หัวข้อ */}
                      <TableHead className="font-semibold">ข้อความ</TableHead> {/* คอลัมน์ข้อความ */}
                      <TableHead className="text-center font-semibold">จำนวนผู้รับ</TableHead> {/* คอลัมน์จำนวนผู้รับ */}
                      <TableHead className="font-semibold">วันที่ส่ง</TableHead> {/* คอลัมน์วันที่ */}
                      <TableHead className="text-right font-semibold">จัดการ</TableHead> {/* คอลัมน์ปุ่มจัดการ */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedNotifications.map((n, i) => ( // วนลูปแสดงการแจ้งเตือนแต่ละรายการ
                      <TableRow key={i} onClick={() => handleRowClick(n)} className="cursor-pointer hover:bg-gray-50"> {/* แถวที่คลิกได้ */}
                        <TableCell className="font-medium">{n.title}</TableCell> {/* แสดงหัวข้อ */}
                        <TableCell className="max-w-sm truncate">{n.message}</TableCell> {/* แสดงข้อความ (ตัดถ้ายาว) */}
                        <TableCell className="text-center">{n.recipients.length}</TableCell> {/* แสดงจำนวนผู้รับ */}
                        <TableCell>{new Date(n.created_at).toLocaleString("th-TH")}</TableCell> {/* แสดงวันที่แบบไทย */}
                        <TableCell className="text-right">
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteRow(n.recipients[0].id); }}> {/* ปุ่มลบ */}
                            <Trash2 className="h-4 w-4" /> {/* ไอคอนถังขยะ */}
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

        {/* Dialog สำหรับแสดงรายชื่อผู้รับการแจ้งเตือน */}
        <Dialog open={recipientsDialogOpen} onOpenChange={setRecipientsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>ผู้รับประกาศ: {selectedNotification?.title}</DialogTitle> {/* หัวข้อ dialog */}
              <DialogDescription>
                รายชื่อผู้ใช้ที่ได้รับประกาศนี้และสถานะการอ่าน {/* คำอธิบาย */}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto"> {/* Container สำหรับ scroll แนวตั้ง */}
              <Table> {/* ตารางแสดงรายชื่อผู้รับ */}
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead> {/* คอลัมน์ชื่อ */}
                    <TableHead>อีเมล</TableHead> {/* คอลัมน์อีเมล */}
                    <TableHead>สถานะ</TableHead> {/* คอลัมน์สถานะการอ่าน */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedNotification?.recipients.map(r => ( // วนลูปแสดงผู้รับแต่ละคน
                    <TableRow key={r.id}>
                      <TableCell>{r.first_name} {r.last_name}</TableCell> {/* แสดงชื่อเต็ม */}
                      <TableCell>{r.email}</TableCell> {/* แสดงอีเมล */}
                      <TableCell>
                        {r.is_read ? ( // ตรวจสอบสถานะการอ่าน
                          <span className="text-green-600">อ่านแล้ว</span> // สีเขียวถ้าอ่านแล้ว
                        ) : (
                          <span className="text-yellow-600">ยังไม่อ่าน</span> // สีเหลืองถ้ายังไม่อ่าน
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog สำหรับสร้างการแจ้งเตือนใหม่ */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">สร้างประกาศใหม่</DialogTitle> {/* หัวข้อ dialog */}
              <DialogDescription>
                สร้างประกาศใหม่เพื่อส่งให้สมาชิกในระบบ {/* คำอธิบาย */}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4"> {/* ฟอร์มสร้างการแจ้งเตือน */}
              <div className="space-y-2"> {/* ส่วนเลือกผู้รับ */}
                <Label htmlFor="user_id" className="font-medium">ผู้รับ</Label>
                <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}> {/* Dropdown เลือกผู้รับ */}
                  <SelectTrigger id="user_id"><SelectValue placeholder="เลือกสมาชิก" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">สมาชิกทั้งหมด</SelectItem> {/* ตัวเลือกส่งให้ทุกคน */}
                    {users.map((u) => ( // วนลูปแสดงรายชื่อผู้ใช้
                      <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"> {/* ส่วนกรอกหัวข้อ */}
                <Label htmlFor="title" className="font-medium">หัวข้อ</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /> {/* Input หัวข้อ */}
              </div>
              <div className="space-y-2"> {/* ส่วนกรอกข้อความ */}
                <Label htmlFor="message" className="font-medium">ข้อความ</Label>
                <Input id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /> {/* Input ข้อความ */}
              </div>
              <div className="flex justify-end gap-3 pt-4"> {/* ส่วนปุ่มควบคุม */}
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button> {/* ปุ่มยกเลิก */}
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">ส่งประกาศ</Button> {/* ปุ่มส่งประกาศ */}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
