"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import UserLayout from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Edit3,
  Save,
  Camera,
  UserCheck,
  Clock
} from "lucide-react"

interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  date_of_birth: string
  id_card: string
  organization: string
  age: number
  medical_condition: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  profile_photo: string
  created_at: string
  member_number: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const { toast } = useToast()
  const { user: authUser, logout } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          toast({
            title: "ข้อผิดพลาด",
            description: "กรุณาเข้าสู่ระบบใหม่",
            variant: "destructive",
          })
          logout()
          return
        }

        console.log("Fetching profile with token:", token ? token.substring(0, 20) + "..." : "No token")
        
        const response = await fetch("http://localhost:3001/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        console.log("Profile API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          setProfile(data.user)
          console.log("Profile loaded successfully")
        } else if (response.status === 401 || response.status === 403) {
          console.log("Authentication failed, clearing token and redirecting to login")
          localStorage.removeItem("token")
          toast({
            title: "ข้อผิดพลาด",
            description: "Token หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
            variant: "destructive",
          })
          logout()
        } else {
          const errorText = await response.text()
          console.log("Profile API error:", response.status, errorText)
          toast({
            title: "ข้อผิดพลาด",
            description: `ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ (${response.status})`,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "ข้อผิดพลาด",
          description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address,
          organization: profile.organization,
          age: profile.age,
          medical_condition: profile.medical_condition,
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_relationship: profile.emergency_contact_relationship,
          emergency_contact_phone: profile.emergency_contact_phone,
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตข้อมูลสำเร็จ",
          description: "ข้อมูลส่วนตัวได้รับการอัปเดตแล้ว",
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านใหม่ให้ตรงกัน",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      })

      if (response.ok) {
        toast({
          title: "เปลี่ยนรหัสผ่านสำเร็จ",
          description: "รหัสผ่านได้รับการเปลี่ยนแปลงแล้ว",
        })
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        })
      } else {
        const data = await response.json()
        toast({
          title: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
          description: data.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
        variant: "destructive",
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 2MB",
        variant: "destructive",
      })
      return
    }

    setUploadingPhoto(true)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append('profile_photo', file)

      const response = await fetch("http://localhost:3001/api/user/profile/upload-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Update profile state with new photo URL
        if (profile) {
          setProfile({ ...profile, profile_photo: data.profile_photo })
        }
        toast({
          title: "อัปโหลดรูปภาพสำเร็จ",
          description: "รูปโปรไฟล์ได้รับการอัปเดตแล้ว",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload photo")
      }
    } catch (error) {
      console.error("Photo upload error:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดรูปภาพได้",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    )
  }

  if (!profile) {
    return (
      <UserLayout>
        <div className="text-center py-8">
          <p className="text-gray-600">ไม่สามารถโหลดข้อมูลโปรไฟล์ได้</p>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section with Profile Overview */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 rounded-3xl blur-3xl"></div>
          <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Avatar Section */}
                <div className="relative group">
                  <Avatar className="h-24 w-24 ring-4 ring-blue-100 shadow-lg">
                    <AvatarImage src={profile.profile_photo || "/placeholder-user.jpg"} alt="Profile" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="profile-photo-upload"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
                    onClick={() => document.getElementById('profile-photo-upload')?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-500" />
                        <span>@{profile.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-orange-500" />
                        <span>เลขที่สมาชิก: {profile.member_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span>สมาชิกตั้งแต่ {new Date(profile.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      ยืนยันตัวตนแล้ว
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      <Shield className="h-3 w-3 mr-1" />
                      บัญชีปลอดภัย
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 bg-white/80 backdrop-blur-sm border shadow-lg">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Edit3 className="h-4 w-4 mr-2" />
              ข้อมูลส่วนตัว
            </TabsTrigger>
            <TabsTrigger value="password" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              เปลี่ยนรหัสผ่าน
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Personal Information Card */}
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <User className="h-5 w-5 text-blue-600" />
                      ข้อมูลส่วนตัว
                    </CardTitle>
                    <CardDescription>แก้ไขข้อมูลส่วนตัวของคุณ</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="username"
                              value={profile.username}
                              disabled
                              className="pl-10 bg-gray-50/80 border-gray-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">อีเมล</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              value={profile.email}
                              disabled
                              className="pl-10 bg-gray-50/80 border-gray-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">ชื่อ</Label>
                          <Input
                            id="first_name"
                            value={profile.first_name}
                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                            required
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">นามสกุล</Label>
                          <Input
                            id="last_name"
                            value={profile.last_name}
                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                            required
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              value={profile.phone || ""}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">วันเกิด</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="date_of_birth"
                              value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : "ไม่ระบุ"}
                              disabled
                              className="pl-10 bg-gray-50/80 border-gray-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organization" className="text-sm font-medium text-gray-700">สังกัด/หน่วยงาน</Label>
                          <Input
                            id="organization"
                            value={profile.organization || ""}
                            onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age" className="text-sm font-medium text-gray-700">อายุ</Label>
                          <Input
                            id="age"
                            type="number"
                            value={profile.age || ""}
                            onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : 0 })}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            min="1"
                            max="120"
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">ที่อยู่</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="address"
                            value={profile.address || ""}
                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                            className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="medical_condition" className="text-sm font-medium text-gray-700">โรคประจำตัว (ถ้ามี)</Label>
                        <Textarea
                          id="medical_condition"
                          value={profile.medical_condition || ""}
                          onChange={(e) => setProfile({ ...profile, medical_condition: e.target.value })}
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="กรอกโรคประจำตัว หากไม่มีให้เว้นว่าง"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 shadow-lg"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Account Info Sidebar */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      ข้อมูลบัญชี
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">เลขบัตรประชาชน</span>
                        <span className="text-sm font-medium">{profile.id_card || "ไม่ระบุ"}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">สถานะบัญชี</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ใช้งานได้
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">วันที่สมัคร</span>
                        <span className="text-sm font-medium">
                          {new Date(profile.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Emergency Contact Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Phone className="h-5 w-5 text-red-600" />
                      ผู้ติดต่อฉุกเฉิน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล</Label>
                        <Input
                          value={profile.emergency_contact_name || ""}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                          className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                          placeholder="กรอกชื่อ-นามสกุล"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">ความสัมพันธ์</Label>
                        <Input
                          value={profile.emergency_contact_relationship || ""}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_relationship: e.target.value })}
                          className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                          placeholder="เช่น บิดา, มารดา, คู่สมรส"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</Label>
                        <Input
                          value={profile.emergency_contact_phone || ""}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                          className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                          placeholder="กรอกเบอร์โทรศัพท์"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="password">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Shield className="h-5 w-5 text-red-600" />
                    เปลี่ยนรหัสผ่าน
                  </CardTitle>
                  <CardDescription>เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="current_password" className="text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        required
                        className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        required
                        className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        required
                        className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">ข้อควรระวัง</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร</li>
                              <li>ควรประกอบด้วยตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์</li>
                              <li>หลีกเลี่ยงการใช้ข้อมูลส่วนตัวเป็นรหัสผ่าน</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-2 shadow-lg"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {saving ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  )
}
