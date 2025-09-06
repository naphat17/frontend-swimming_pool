"use client" // บังคับให้ component นี้ทำงานฝั่ง client

import type React from "react" // นำเข้า type definitions ของ React

// นำเข้า React hooks และ Next.js utilities
import { useEffect, useState } from "react" // hooks สำหรับจัดการ state และ side effects
import { useSearchParams } from "next/navigation" // hook สำหรับอ่าน URL parameters
import { useAuth } from "@/components/auth-provider" // custom hook สำหรับจัดการ authentication
import { useRouter } from "next/navigation" // hook สำหรับ navigation
import AdminLayout from "@/components/admin-layout" // layout component สำหรับหน้า admin

// นำเข้า UI components จาก shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // components สำหรับแสดงข้อมูลในรูปแบบ card
import { Button } from "@/components/ui/button" // component ปุ่ม
import { Input } from "@/components/ui/input" // component input field
import { Label } from "@/components/ui/label" // component label สำหรับ form
import { Badge } from "@/components/ui/badge" // component สำหรับแสดง status badge
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // components สำหรับ dropdown select
import { useToast } from "@/hooks/use-toast" // hook สำหรับแสดง toast notifications
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog" // components สำหรับ modal dialog
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // components สำหรับแสดงตาราง
import { Search, Plus, Edit, Trash2, UserPlus, Users } from "lucide-react" // icons จาก lucide-react

// Interface สำหรับข้อมูลผู้ใช้
interface User {
  id: number // รหัสผู้ใช้
  username: string // ชื่อผู้ใช้
  email: string // อีเมล
  first_name: string // ชื่อจริง
  last_name: string // นามสกุล
  phone: string // เบอร์โทรศัพท์
  role: string // บทบาท (admin/user)
  status: string // สถานะ (active/inactive)
  created_at: string // วันที่สร้างบัญชี
  membership?: { // ข้อมูลสมาชิกภาพ (optional)
    type: string // ประเภทสมาชิก
    expires_at: string // วันหมดอายุ
    status: string // สถานะสมาชิก
  }
}

// Interface สำหรับประเภทสมาชิกภาพ
interface MembershipType {
  id: number // รหัสประเภทสมาชิก
  name: string // ชื่อประเภทสมาชิก
  duration_days: number // จำนวนวันที่ใช้ได้
}

// Interface สำหรับหมวดหมู่ผู้ใช้
interface UserCategory {
  id: number // รหัสหมวดหมู่
  name: string // ชื่อหมวดหมู่
  description: string // คำอธิบาย
  pay_per_session_price: number // ราคาต่อครั้ง
  annual_price: number // ราคารายปี
}

// Component หลักสำหรับหน้าจัดการสมาชิก (เฉพาะ admin เท่านั้น)
export default function AdminMembersPage() {
  // Hooks สำหรับ authentication และ navigation
  const { user } = useAuth() // ข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const router = useRouter() // สำหรับเปลี่ยนหน้า
  const searchParams = useSearchParams() // สำหรับอ่าน URL parameters
  
  // State สำหรับข้อมูลหลัก
  const [users, setUsers] = useState<User[]>([]) // รายการผู้ใช้ทั้งหมด
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]) // ประเภทสมาชิกภาพ
  const [loading, setLoading] = useState(true) // สถานะการโหลดข้อมูล
  
  // State สำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState("") // คำค้นหา
  const [statusFilter, setStatusFilter] = useState("all") // กรองตามสถานะ
  const [roleFilter, setRoleFilter] = useState("all") // กรองตามบทบาท
  
  // State สำหรับ Dialog และ Modal
  const [dialogOpen, setDialogOpen] = useState(false) // สถานะเปิด/ปิด dialog เพิ่มผู้ใช้
  const [editingUser, setEditingUser] = useState<User | null>(null) // ผู้ใช้ที่กำลังแก้ไข
  const [extendDialogOpen, setExtendDialogOpen] = useState(false) // สถานะเปิด/ปิด dialog ต่ออายุสมาชิก
  const [selectedUser, setSelectedUser] = useState<User | null>(null) // ผู้ใช้ที่เลือกสำหรับต่ออายุ
  
  // State สำหรับข้อมูลฟอร์มเพิ่มผู้ใช้ใหม่
  const [newUserData, setNewUserData] = useState({
    username: "", // ชื่อผู้ใช้
    email: "", // อีเมล
    password: "", // รหัสผ่าน
    confirmPassword: "", // ยืนยันรหัสผ่าน
    first_name: "", // ชื่อจริง
    last_name: "", // นามสกุล
    phone: "", // เบอร์โทรศัพท์
    address: "", // ที่อยู่
    date_of_birth: "", // วันเกิด
    id_card: "", // เลขบัตรประชาชน
    user_category_id: "", // รหัสหมวดหมู่ผู้ใช้
    role: "user", // บทบาท (default เป็น user)
  })
  
  // State สำหรับข้อมูลเพิ่มเติม
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]) // หมวดหมู่ผู้ใช้
  const [extendData, setExtendData] = useState({
    membership_type_id: "", // รหัสประเภทสมาชิกสำหรับต่ออายุ
    duration_days: 30, // จำนวนวันที่ต่ออายุ (default 30 วัน)
  })
  
  const { toast } = useToast() // Hook สำหรับแสดง notification

  // useEffect สำหรับการตั้งค่าเริ่มต้นเมื่อ component โหลด
  useEffect(() => {
    // ตรวจสอบสิทธิ์ admin - ถ้าไม่ใช่ admin ให้ redirect ไปหน้า dashboard
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // โหลดข้อมูลเริ่มต้น
    fetchUsers() // โหลดรายการผู้ใช้
    fetchMembershipTypes() // โหลดประเภทสมาชิกภาพ
    fetchUserCategories() // โหลดหมวดหมู่ผู้ใช้
    
    // เปิด dialog เพิ่มผู้ใช้ถ้ามี parameter add=1 ใน URL
    const add = searchParams.get("add")
    if (add === "1") {
      setDialogOpen(true)
    }
  }, [user, router])

  // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมดจาก API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || []) // อัปเดต state ด้วยข้อมูลผู้ใช้
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false) // ปิดสถานะ loading
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลประเภทสมาชิกภาพ
  const fetchMembershipTypes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/membership-types", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setMembershipTypes(data.membership_types || []) // อัปเดต state ด้วยประเภทสมาชิกภาพ
      }
    } catch (error) {
      console.error("Error fetching membership types:", error)
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลหมวดหมู่ผู้ใช้
  const fetchUserCategories = async () => {
    try {
      const response = await fetch("https://backend-l7q9.onrender.com/api/memberships/categories")
      if (response.ok) {
        const data = await response.json()
        setUserCategories(data.categories || []) // อัปเดต state ด้วยหมวดหมู่ผู้ใช้
      }
    } catch (error) {
      console.error("Error fetching user categories:", error)
    }
  }

  // ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault() // ป้องกันการ submit form แบบปกติ

    // ตรวจสอบว่ารหัสผ่านและการยืนยันรหัสผ่านตรงกันหรือไม่
    if (newUserData.password !== newUserData.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านให้ตรงกัน",
        variant: "destructive",
      })
      return
    }

    // ตรวจสอบว่าได้เลือกประเภทผู้ใช้แล้วหรือไม่
    if (!newUserData.user_category_id) {
      toast({
        title: "กรุณาเลือกประเภทผู้ใช้",
        description: "กรุณาเลือกประเภทผู้ใช้ที่ต้องการ",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token") // ดึง token สำหรับ authentication
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/users", {
      method: "POST", // ใช้ POST method สำหรับสร้างผู้ใช้ใหม่
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ // ส่งข้อมูลผู้ใช้ใหม่ในรูปแบบ JSON
          username: newUserData.username,
          email: newUserData.email,
          password: newUserData.password,
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          phone: newUserData.phone,
          address: newUserData.address,
          date_of_birth: newUserData.date_of_birth,
          id_card: newUserData.id_card,
          user_category_id: parseInt(newUserData.user_category_id), // แปลงเป็น number
          role: newUserData.role,
        }),
      })

      if (response.ok) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "เพิ่มผู้ใช้สำเร็จ",
          description: "ผู้ใช้ใหม่ได้รับการเพิ่มเข้าสู่ระบบแล้ว",
        })
        setDialogOpen(false) // ปิด dialog
        // รีเซ็ตฟอร์มกลับเป็นค่าเริ่มต้น
        setNewUserData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          first_name: "",
          last_name: "",
          phone: "",
          address: "",
          date_of_birth: "",
          id_card: "",
          user_category_id: "",
          role: "user",
        })
        fetchUsers() // โหลดข้อมูลผู้ใช้ใหม่
      } else {
        // แสดงข้อความผิดพลาดจาก server
        const errorData = await response.json()
        toast({
          title: "เพิ่มผู้ใช้ไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      // แสดงข้อความผิดพลาดทั่วไป
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มผู้ใช้ได้",
        variant: "destructive",
      })
    }
  }

  // ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault() // ป้องกันการ submit form แบบปกติ
    if (!editingUser) return // ตรวจสอบว่ามีผู้ใช้ที่กำลังแก้ไขหรือไม่

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/users/${editingUser.id}`, {
        method: "PUT", // ใช้ PUT method สำหรับอัปเดตข้อมูล
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ // ส่งเฉพาะข้อมูลที่อนุญาตให้แก้ไข
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          phone: editingUser.phone,
          status: editingUser.status,
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตผู้ใช้สำเร็จ",
          description: "ข้อมูลผู้ใช้ได้รับการอัปเดตแล้ว",
        })
        setEditingUser(null) // ล้างข้อมูลผู้ใช้ที่กำลังแก้ไข
        fetchUsers() // โหลดข้อมูลผู้ใช้ใหม่
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      // แสดงข้อความผิดพลาดทั่วไป
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลได้",
        variant: "destructive",
      })
    }
  }

  // ฟังก์ชันสำหรับลบผู้ใช้
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("คุณต้องการลบผู้ใช้นี้หรือไม่?")) return // ยืนยันการลบ

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/users/${userId}`, {
        method: "DELETE", // ใช้ DELETE method สำหรับลบข้อมูล
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "ลบผู้ใช้สำเร็จ",
          description: "ผู้ใช้ได้รับการลบออกจากระบบแล้ว",
        })
        fetchUsers() // โหลดข้อมูลผู้ใช้ใหม่
      } else {
        toast({
          title: "ลบไม่สำเร็จ",
          description: "ไม่สามารถลบผู้ใช้ได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
      })
    }
  }

  // ฟังก์ชันสำหรับต่ออายุสมาชิกภาพ
  const handleExtendMembership = async (e: React.FormEvent) => {
    e.preventDefault() // ป้องกันการ submit form แบบปกติ
    if (!selectedUser) return // ตรวจสอบว่ามีผู้ใช้ที่เลือกหรือไม่

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/users/${selectedUser.id}/extend-membership`, {
        method: "POST", // ใช้ POST method สำหรับต่ออายุสมาชิก
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(extendData), // ส่งข้อมูลการต่ออายุ
      })

      if (response.ok) {
        toast({
          title: "ต่ออายุสมาชิกสำเร็จ",
          description: "สมาชิกภาพได้รับการต่ออายุแล้ว",
        })
        setExtendDialogOpen(false) // ปิด dialog
        setSelectedUser(null) // ล้างผู้ใช้ที่เลือก
        fetchUsers() // โหลดข้อมูลผู้ใช้ใหม่
      } else {
        toast({
          title: "ต่ออายุไม่สำเร็จ",
          description: "ไม่สามารถต่ออายุสมาชิกได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถต่ออายุสมาชิกได้",
        variant: "destructive",
      })
    }
  }

  // กรองข้อมูลผู้ใช้ตามเงื่อนไขการค้นหาและตัวกรอง
  const filteredUsers = users.filter((user) => {
    // ตรวจสอบการค้นหาในชื่อ, นามสกุล, อีเมล, และชื่อผู้ใช้
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter // ตรวจสอบตัวกรองสถานะ
    const matchesRole = roleFilter === "all" || user.role === roleFilter // ตรวจสอบตัวกรองบทบาท

    return matchesSearch && matchesStatus && matchesRole // ต้องผ่านเงื่อนไขทั้งหมด
  })

  // ฟังก์ชันกำหนดสีสำหรับแสดงสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800" // สีเขียวสำหรับสถานะ active
      case "inactive":
        return "bg-red-100 text-red-800" // สีแดงสำหรับสถานะ inactive
      default:
        return "bg-gray-100 text-gray-800" // สีเทาสำหรับสถานะอื่นๆ
    }
  }

  // ฟังก์ชันกำหนดสีสำหรับแสดงบทบาท
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800" // สีม่วงสำหรับ admin
      case "user":
        return "bg-blue-100 text-blue-800" // สีน้ำเงินสำหรับ user
      default:
        return "bg-gray-100 text-gray-800" // สีเทาสำหรับบทบาทอื่นๆ
    }
  }

  // แสดง loading spinner ขณะโหลดข้อมูล
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    )
  }

  // ตรวจสอบสิทธิ์ admin - ถ้าไม่ใช่ admin จะไม่แสดงหน้านี้
  if (user?.role !== "admin") {
    return null
  }

  // ส่วน JSX ที่แสดงหน้าตาของ component
  return (
    <AdminLayout> {/* Layout หลักสำหรับหน้า admin */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* พื้นหลังแบบ gradient */}
        <div className="space-y-8 p-6">
          {/* ส่วนหัวของหน้า */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Users className="h-8 w-8 text-white" /> {/* ไอคอนผู้ใช้ */}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการสมาชิก {/* หัวข้อหลัก */}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จัดการข้อมูลสมาชิกและผู้ใช้งานระบบ {/* คำอธิบายหน้า */}
            </p>
          </div>

          {/* ส่วนแสดงสถิติแบบ card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Card แสดงจำนวนสมาชิกทั้งหมด */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">สมาชิกทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div> {/* แสดงจำนวนผู้ใช้ทั้งหมด */}
              </CardContent>
            </Card>
            {/* Card แสดงจำนวนสมาชิกที่ใช้งานได้ */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">ใช้งานได้</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => u.status === 'active').length}</div> {/* นับผู้ใช้ที่มีสถานะ active */}
              </CardContent>
            </Card>
            {/* Card แสดงจำนวนสมาชิกที่ไม่ใช้งาน */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-100">ไม่ใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => u.status === 'inactive').length}</div> {/* นับผู้ใช้ที่มีสถานะ inactive */}
              </CardContent>
            </Card>
          </div>

          {/* ส่วนแสดงรายการผู้ใช้และฟอร์มเพิ่มผู้ใช้ใหม่ */}
          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>รายการผู้ใช้ ({filteredUsers.length})</CardTitle> {/* แสดงจำนวนผู้ใช้ที่กรองแล้ว */}
              {/* Dialog สำหรับเพิ่มผู้ใช้ใหม่ */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มผู้ใช้ใหม่ {/* ปุ่มเปิด dialog */}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                    <DialogDescription>กรอกข้อมูลผู้ใช้ใหม่</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">ชื่อผู้ใช้ *</Label>
                        <Input
                          id="username"
                          name="username"
                          value={newUserData.username}
                          onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                          required
                          placeholder="กรอกชื่อผู้ใช้"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">อีเมล *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          required
                          placeholder="กรอกอีเมล"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first_name">ชื่อ *</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={newUserData.first_name}
                          onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                          required
                          placeholder="กรอกชื่อ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">นามสกุล *</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={newUserData.last_name}
                          onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                          required
                          placeholder="กรอกนามสกุล"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={newUserData.phone}
                          onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                          placeholder="กรอกเบอร์โทรศัพท์"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">วันเกิด</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={newUserData.date_of_birth}
                          onChange={(e) => setNewUserData({ ...newUserData, date_of_birth: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="id_card">เลขบัตรประชาชน</Label>
                        <Input
                          id="id_card"
                          name="id_card"
                          value={newUserData.id_card}
                          onChange={(e) => setNewUserData({ ...newUserData, id_card: e.target.value })}
                          placeholder="กรอกเลขบัตรประชาชน"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user_category">ประเภทผู้ใช้ *</Label>
                        <Select
                          value={newUserData.user_category_id}
                          onValueChange={(value) => setNewUserData({ ...newUserData, user_category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกประเภทผู้ใช้" />
                          </SelectTrigger>
                          <SelectContent>
                            {userCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">ที่อยู่</Label>
                      <Input
                        id="address"
                        name="address"
                        value={newUserData.address}
                        onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                        placeholder="กรอกที่อยู่"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">รหัสผ่าน *</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                          required
                          placeholder="กรอกรหัสผ่าน"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={newUserData.confirmPassword}
                          onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                          required
                          placeholder="ยืนยันรหัสผ่าน"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">บทบาท</Label>
                      <Select
                        value={newUserData.role}
                        onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">ผู้ใช้</SelectItem>
                          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button type="submit">เพิ่มผู้ใช้</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="ค้นหาชื่อ, อีเมล, หรือชื่อผู้ใช้..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">ใช้งานได้</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="บทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกบทบาท</SelectItem>
                    <SelectItem value="user">ผู้ใช้</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อ-นามสกุล</TableHead>
                      <TableHead>อีเมล</TableHead>
                      <TableHead>เบอร์โทร</TableHead>
                      <TableHead>บทบาท</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>สมาชิกภาพ</TableHead>
                      <TableHead>วันที่สมัคร</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => (
                      <TableRow key={`${user.id}-${index}`}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>{user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status === "active" ? "ใช้งานได้" : "ไม่ใช้งาน"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.membership ? (
                            <div>
                              <div className="text-sm font-medium">{user.membership.type}</div>
                              <div className="text-xs text-gray-500">
                                หมดอายุ: {user.membership?.expires_at ? new Date(user.membership.expires_at).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">ไม่มี</span>
                          )}
                        </TableCell>
                        <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setExtendDialogOpen(true)
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
                <DialogDescription>แก้ไขข้อมูลส่วนตัวของผู้ใช้</DialogDescription>
              </DialogHeader>
              {editingUser && (
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_first_name">ชื่อ</Label>
                      <Input
                        id="edit_first_name"
                        value={editingUser.first_name}
                        onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_last_name">นามสกุล</Label>
                      <Input
                        id="edit_last_name"
                        value={editingUser.last_name}
                        onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_phone">เบอร์โทรศัพท์</Label>
                    <Input
                      id="edit_phone"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_status">สถานะ</Label>
                    <Select
                      value={editingUser.status}
                      onValueChange={(value) => setEditingUser({ ...editingUser, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">ใช้งานได้</SelectItem>
                        <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit">บันทึก</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Extend Membership Dialog */}
          <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>ต่ออายุสมาชิกภาพ</DialogTitle>
                <DialogDescription>
                  ต่ออายุสมาชิกภาพสำหรับ {selectedUser?.first_name} {selectedUser?.last_name}
                </DialogDescription>
              </DialogHeader>
              {selectedUser?.membership && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">สมาชิกภาพปัจจุบัน</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>ประเภท:</strong> {selectedUser.membership.type}</p>
                    <p><strong>สถานะ:</strong> {selectedUser.membership.status === 'active' ? 'ใช้งานได้' : 'ไม่ใช้งาน'}</p>
                    <p><strong>หมดอายุ:</strong> {selectedUser.membership?.expires_at ? new Date(selectedUser.membership.expires_at).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}</p>
                  </div>
                </div>
              )}
              <form onSubmit={handleExtendMembership} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="membership_type">ประเภทสมาชิก</Label>
                  <Select
                    value={extendData.membership_type_id}
                    onValueChange={(value) => setExtendData({ ...extendData, membership_type_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทสมาชิก" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} ({type.duration_days} วัน)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_days">จำนวนวัน</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    value={extendData.duration_days}
                    onChange={(e) => setExtendData({ ...extendData, duration_days: e.target.value ? Number.parseInt(e.target.value) : 0 })}
                    min="1"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setExtendDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">ต่ออายุ</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  )
}
