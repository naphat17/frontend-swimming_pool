"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Settings, CreditCard, Shield, Users } from "lucide-react"

interface Setting {
  setting_key: string
  setting_value: string
  description?: string
}

interface MembershipType {
  id: number
  name: string
  description: string
  price: number
  duration_days: number
}

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<Setting[]>([])
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<MembershipType | null>(null)
  const [newMembershipData, setNewMembershipData] = useState({
    name: "",
    description: "",
    price: 0,
    duration_days: 30,
  })
  const [systemSettings, setSystemSettings] = useState({
    pool_name: "",
    max_reservation_days: "7",
    reservation_cancel_hours: "2",
    contact_phone: "",
    contact_email: "",
    bank_account_number: "",
    bank_name: "",
    account_name: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchSettings()
    fetchMembershipTypes()
  }, [user, router])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])

        const settingsObj = data.settings.reduce((acc: any, setting: Setting) => {
          acc[setting.setting_key] = setting.setting_value
          return acc
        }, {})

        setSystemSettings({
          pool_name: settingsObj.pool_name || "สระว่ายน้ำโรจนากร",
          max_reservation_days: settingsObj.max_reservation_days || "7",
          reservation_cancel_hours: settingsObj.reservation_cancel_hours || "2",
          contact_phone: settingsObj.contact_phone || "",
          contact_email: settingsObj.contact_email || "",
          bank_account_number: settingsObj.bank_account_number || "",
          bank_name: settingsObj.bank_name || "",
          account_name: settingsObj.account_name || "",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembershipTypes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/admin/membership-types", {
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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")
      const settingsArray = Object.entries(systemSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }))

      const response = await fetch("http://localhost:3001/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: settingsArray }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตการตั้งค่าสำเร็จ",
          description: "การตั้งค่าระบบได้รับการอัปเดตแล้ว",
        })
        fetchSettings()
      } else {
        toast({
          title: "อัปเดตไม่สำเร็จ",
          description: "ไม่สามารถอัปเดตการตั้งค่าได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตการตั้งค่าได้",
        variant: "destructive",
      })
    }
  }

  const handleCreateMembershipType = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/admin/membership-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMembershipData),
      })

      if (response.ok) {
        toast({
          title: "เพิ่มประเภทสมาชิกสำเร็จ",
          description: "ประเภทสมาชิกใหม่ได้รับการเพิ่มแล้ว",
        })
        setDialogOpen(false)
        setNewMembershipData({
          name: "",
          description: "",
          price: 0,
          duration_days: 30,
        })
        fetchMembershipTypes()
      } else {
        const errorData = await response.json()
        toast({
          title: "เพิ่มไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มประเภทสมาชิกได้",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMembershipType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMembership) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/admin/membership-types/${editingMembership.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingMembership.name,
          description: editingMembership.description,
          price: editingMembership.price,
          duration_days: editingMembership.duration_days,
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตประเภทสมาชิกสำเร็จ",
          description: "ข้อมูลประเภทสมาชิกได้รับการอัปเดตแล้ว",
        })
        setEditingMembership(null)
        fetchMembershipTypes()
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
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              การตั้งค่าระบบ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จัดการการตั้งค่าระบบ ประเภทสมาชิก และช่องทางการชำระเงิน
            </p>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-200/80 backdrop-blur-sm p-2 rounded-xl">
              <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Shield className="h-5 w-5" />
                ทั่วไป
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Users className="h-5 w-5" />
                ประเภทสมาชิก
              </TabsTrigger>
              <TabsTrigger value="payment-channels" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <CreditCard className="h-5 w-5" />
                ช่องทางชำระเงิน
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">การตั้งค่าทั่วไป</CardTitle>
                  <CardDescription>จัดการการตั้งค่าพื้นฐานของระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="pool_name" className="font-medium">ชื่อสระว่ายน้ำ</Label>
                        <Input
                          id="pool_name"
                          value={systemSettings.pool_name}
                          onChange={(e) => setSystemSettings({ ...systemSettings, pool_name: e.target.value })}
                          placeholder="ชื่อสระว่ายน้ำ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_reservation_days" className="font-medium">จองล่วงหน้าได้สูงสุด (วัน)</Label>
                        <Input
                          id="max_reservation_days"
                          type="number"
                          value={systemSettings.max_reservation_days}
                          onChange={(e) => setSystemSettings({ ...systemSettings, max_reservation_days: e.target.value })}
                          min="1"
                          max="30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reservation_cancel_hours" className="font-medium">ยกเลิกการจองก่อนเวลา (ชั่วโมง)</Label>
                        <Input
                          id="reservation_cancel_hours"
                          type="number"
                          value={systemSettings.reservation_cancel_hours}
                          onChange={(e) =>
                            setSystemSettings({ ...systemSettings, reservation_cancel_hours: e.target.value })
                          }
                          min="1"
                          max="48"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_phone" className="font-medium">เบอร์โทรติดต่อ</Label>
                        <Input
                          id="contact_phone"
                          value={systemSettings.contact_phone}
                          onChange={(e) => setSystemSettings({ ...systemSettings, contact_phone: e.target.value })}
                          placeholder="02-xxx-xxxx"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="contact_email" className="font-medium">อีเมลติดต่อ</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={systemSettings.contact_email}
                          onChange={(e) => setSystemSettings({ ...systemSettings, contact_email: e.target.value })}
                          placeholder="contact@example.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">บันทึกการตั้งค่า</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment-channels" className="mt-6">
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">ช่องทางการชำระเงิน</CardTitle>
                  <CardDescription>จัดการข้อมูลช่องทางการชำระเงินสำหรับการโอน</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name" className="font-medium">ชื่อธนาคาร</Label>
                        <Input
                          id="bank_name"
                          value={systemSettings.bank_name}
                          onChange={(e) => setSystemSettings({ ...systemSettings, bank_name: e.target.value })}
                          placeholder="เช่น ธนาคารกรุงเทพ, ธนาคารกสิกรไทย"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account_name" className="font-medium">ชื่อบัญชี</Label>
                        <Input
                          id="account_name"
                          value={systemSettings.account_name}
                          onChange={(e) => setSystemSettings({ ...systemSettings, account_name: e.target.value })}
                          placeholder="ชื่อเจ้าของบัญชี"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_account_number" className="font-medium">เลขบัญชีธนาคาร</Label>
                      <Input
                        id="bank_account_number"
                        value={systemSettings.bank_account_number}
                        onChange={(e) => setSystemSettings({ ...systemSettings, bank_account_number: e.target.value })}
                        placeholder="เลขบัญชีธนาคารสำหรับโอนเงิน"
                      />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">บันทึกช่องทางการชำระเงิน</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership" className="mt-6">
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">ประเภทสมาชิก</CardTitle>
                      <CardDescription>จัดการประเภทและราคาสมาชิก</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                          เพิ่มประเภทใหม่
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>เพิ่มประเภทสมาชิกใหม่</DialogTitle>
                          <DialogDescription>กรอกข้อมูลประเภทสมาชิกใหม่</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateMembershipType} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">ชื่อประเภท</Label>
                            <Input
                              id="name"
                              value={newMembershipData.name}
                              onChange={(e) => setNewMembershipData({ ...newMembershipData, name: e.target.value })}
                              required
                              placeholder="เช่น รายเดือน, รายปี"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">คำอธิบาย</Label>
                            <Input
                              id="description"
                              value={newMembershipData.description}
                              onChange={(e) =>
                                setNewMembershipData({ ...newMembershipData, description: e.target.value })
                              }
                              placeholder="คำอธิบายเพิ่มเติม"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="price">ราคา (บาท)</Label>
                              <Input
                                id="price"
                                type="number"
                                value={newMembershipData.price}
                                onChange={(e) =>
                                  setNewMembershipData({ ...newMembershipData, price: e.target.value ? Number.parseInt(e.target.value) : 0 })
                                }
                                min="0"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="duration_days">ระยะเวลา (วัน)</Label>
                              <Input
                                id="duration_days"
                                type="number"
                                value={newMembershipData.duration_days}
                                onChange={(e) =>
                                  setNewMembershipData({
                                    ...newMembershipData,
                                    duration_days: e.target.value ? Number.parseInt(e.target.value) : 0,
                                  })
                                }
                                min="1"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                              ยกเลิก
                            </Button>
                            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">เพิ่มประเภท</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ชื่อประเภท</TableHead>
                          <TableHead>คำอธิบาย</TableHead>
                          <TableHead>ราคา</TableHead>
                          <TableHead>ระยะเวลา</TableHead>
                          <TableHead>การดำเนินการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membershipTypes.map((type) => (
                          <TableRow key={type.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell>{type.description}</TableCell>
                            <TableCell>฿{type.price.toLocaleString()}</TableCell>
                            <TableCell>{type.duration_days} วัน</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingMembership(type)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => {
                                    if (confirm("คุณต้องการลบประเภทสมาชิกนี้หรือไม่?")) {
                                      // Handle delete
                                    }
                                  }}
                                >
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
            </TabsContent>
          </Tabs>

          {/* Edit Membership Type Dialog */}
          <Dialog open={!!editingMembership} onOpenChange={() => setEditingMembership(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>แก้ไขประเภทสมาชิก</DialogTitle>
              </DialogHeader>
              {editingMembership && (
                <form onSubmit={handleUpdateMembershipType} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">ชื่อประเภท</Label>
                    <Input
                      id="edit_name"
                      value={editingMembership.name}
                      onChange={(e) => setEditingMembership({ ...editingMembership, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_description">คำอธิบาย</Label>
                    <Input
                      id="edit_description"
                      value={editingMembership.description}
                      onChange={(e) => setEditingMembership({ ...editingMembership, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_price">ราคา (บาท)</Label>
                      <Input
                        id="edit_price"
                        type="number"
                        value={editingMembership.price}
                        onChange={(e) =>
                          setEditingMembership({ ...editingMembership, price: e.target.value ? Number.parseInt(e.target.value) : 0 })
                        }
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_duration_days">ระยะเวลา (วัน)</Label>
                      <Input
                        id="edit_duration_days"
                        type="number"
                        value={editingMembership.duration_days}
                        onChange={(e) =>
                          setEditingMembership({ ...editingMembership, duration_days: e.target.value ? Number.parseInt(e.target.value) : 0 })
                        }
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditingMembership(null)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">บันทึก</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  )
}
