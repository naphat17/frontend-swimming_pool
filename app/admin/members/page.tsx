"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, UserPlus, Users } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  status: string
  created_at: string
  membership?: {
    type: string
    expires_at: string
    status: string
  }
}

interface MembershipType {
  id: number
  name: string
  duration_days: number
}

interface UserCategory {
  id: number
  name: string
  description: string
  pay_per_session_price: number
  annual_price: number
}

export default function AdminMembersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserData, setNewUserData] = useState({
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
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [extendData, setExtendData] = useState({
    membership_type_id: "",
    duration_days: 30,
  })
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchUsers()
    fetchMembershipTypes()
    fetchUserCategories()
    // open add dialog if redirected with add=1
    const add = searchParams.get("add")
    if (add === "1") {
      setDialogOpen(true)
    }
  }, [user, router])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembershipTypes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/membership-types", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setMembershipTypes(data.membership_types || [])
      }
    } catch (error) {
      console.error("Error fetching membership types:", error)
    }
  }

  const fetchUserCategories = async () => {
    try {
      const response = await fetch("https://backend-l7q9.onrender.com/api/memberships/categories")
      if (response.ok) {
        const data = await response.json()
        setUserCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching user categories:", error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newUserData.password !== newUserData.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านให้ตรงกัน",
        variant: "destructive",
      })
      return
    }

    if (!newUserData.user_category_id) {
      toast({
        title: "กรุณาเลือกประเภทผู้ใช้",
        description: "กรุณาเลือกประเภทผู้ใช้ที่ต้องการ",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUserData.username,
          email: newUserData.email,
          password: newUserData.password,
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          phone: newUserData.phone,
          address: newUserData.address,
          date_of_birth: newUserData.date_of_birth,
          id_card: newUserData.id_card,
          user_category_id: parseInt(newUserData.user_category_id),
          role: newUserData.role,
        }),
      })

      if (response.ok) {
        toast({
          title: "เพิ่มผู้ใช้สำเร็จ",
          description: "ผู้ใช้ใหม่ได้รับการเพิ่มเข้าสู่ระบบแล้ว",
        })
        setDialogOpen(false)
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
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast({
          title: "เพิ่มผู้ใช้ไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มผู้ใช้ได้",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
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
        setEditingUser(null)
        fetchUsers()
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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("คุณต้องการลบผู้ใช้นี้หรือไม่?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "ลบผู้ใช้สำเร็จ",
          description: "ผู้ใช้ได้รับการลบออกจากระบบแล้ว",
        })
        fetchUsers()
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

  const handleExtendMembership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/users/${selectedUser.id}/extend-membership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(extendData),
      })

      if (response.ok) {
        toast({
          title: "ต่ออายุสมาชิกสำเร็จ",
          description: "สมาชิกภาพได้รับการต่ออายุแล้ว",
        })
        setExtendDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "user":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการสมาชิก
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จัดการข้อมูลสมาชิกและผู้ใช้งานระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">สมาชิกทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">ใช้งานได้</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => u.status === 'active').length}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 text-white transition-transform transform hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-100">ไม่ใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.filter(u => u.status === 'inactive').length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-7xl mx-auto shadow-lg border-gray-200">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>รายการผู้ใช้ ({filteredUsers.length})</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มผู้ใช้ใหม่
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
