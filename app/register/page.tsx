"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface UserCategory {
  id: number
  name: string
  description: string
  pay_per_session_price: number
  annual_price: number
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
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
    organization: "",
    age: "",
    gender: "",
    medical_condition: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    profile_photo: null as File | null,
  })
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  const [showPoolFullDialog, setShowPoolFullDialog] = useState(false)
  const [poolAvailability, setPoolAvailability] = useState({ isFull: false, message: '' })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {

    const checkPoolAvailability = async () => {
  try {
    const response = await fetch("https://backend-l7q9.onrender.com/api/pools/availability")
    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch (error) {
    console.error("Error checking pool availability:", error)
  }
  return { isFull: false, message: '' }
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

    fetchUserCategories()
  }, [])

  const validatePassword = (password: string) => {
    const validation = {
      length: password.length >= 8 && password.length <= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*_\-+=?]/.test(password),
    }
    setPasswordValidation(validation)
    return Object.values(validation).every(Boolean)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // ตรวจสอบความยาวของเบอร์โทรศัพท์
    if (name === 'phone' && value.length > 10) {
      return // ไม่อนุญาตให้กรอกเกิน 10 ตัว
    }
    
    // ตรวจสอบความยาวของเลขบัตรประชาชน
    if (name === 'id_card' && value.length > 13) {
      return // ไม่อนุญาตให้กรอกเกิน 13 ตัว
    }
    
    // ตรวจสอบความยาวของเบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน
    if (name === 'emergency_contact_phone' && value.length > 10) {
      return // ไม่อนุญาตให้กรอกเกิน 10 ตัว
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    if (name === 'password') {
      validatePassword(value)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profile_photo: file,
      }))
    }
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      user_category_id: value,
    }))
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านให้ตรงกัน",
        variant: "destructive",
      })
      return
    }

    if (!validatePassword(formData.password)) {
      toast({
        title: "รหัสผ่านไม่ตรงตามเงื่อนไข",
        description: "กรุณาตรวจสอบเงื่อนไขรหัสผ่านให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    if (!formData.user_category_id) {
      toast({
        title: "กรุณาเลือกประเภทผู้ใช้",
        description: "กรุณาเลือกประเภทผู้ใช้ที่ต้องการ",
        variant: "destructive",
      })
      return
    }

    if (!formData.gender) {
      toast({
        title: "กรุณาเลือกเพศ",
        description: "กรุณาเลือกเพศของท่าน",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: "กรุณายอมรับข้อกำหนดการใช้บริการ",
        description: "กรุณาอ่านและยอมรับข้อกำหนดการใช้บริการก่อนสมัครสมาชิก",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('username', formData.username)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('date_of_birth', formData.date_of_birth)
      formDataToSend.append('id_card', formData.id_card)
      formDataToSend.append('user_category_id', formData.user_category_id)
      formDataToSend.append('organization', formData.organization)
      formDataToSend.append('age', formData.age)
      formDataToSend.append('gender', formData.gender)
      formDataToSend.append('medical_condition', formData.medical_condition)
      formDataToSend.append('emergency_contact_name', formData.emergency_contact_name)
      formDataToSend.append('emergency_contact_relationship', formData.emergency_contact_relationship)
      formDataToSend.append('emergency_contact_phone', formData.emergency_contact_phone)
      
      if (formData.profile_photo) {
        formDataToSend.append('profile_photo', formData.profile_photo)
      }

      const response = await fetch("https://backend-l7q9.onrender.com/api/auth/register", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        // สมัครสำเร็จแล้ว ทำการเข้าสู่ระบบอัตโนมัติ
        try {
          const loginResponse = await fetch("https://backend-l7q9.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: formData.username,
              password: formData.password,
            }),
          })

          if (loginResponse.ok) {
            const loginData = await loginResponse.json()
            // เก็บ token ใน localStorage
            localStorage.setItem("token", loginData.token)
            localStorage.setItem("user", JSON.stringify(loginData.user))
            
            toast({
              title: "สมัครสมาชิกสำเร็จ",
              description: "ยินดีต้อนรับเข้าสู่ระบบ กำลังเข้าสู่หน้าหลัก...",
            })
            
            // เปลี่ยนเส้นทางไปยังหน้า dashboard
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
          } else {
            // หากเข้าสู่ระบบไม่สำเร็จ ให้ไปหน้า login
            toast({
              title: "สมัครสมาชิกสำเร็จ",
              description: "กรุณาเข้าสู่ระบบด้วยบัญชีที่สร้างใหม่",
            })
            router.push("/login")
          }
        } catch (loginError) {
          // หากเกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ
          toast({
            title: "สมัครสมาชิกสำเร็จ",
            description: "กรุณาเข้าสู่ระบบด้วยบัญชีที่สร้างใหม่",
          })
          router.push("/login")
        }
      } else {
        const data = await response.json()
        toast({
          title: "สมัครสมาชิกไม่สำเร็จ",
          description: data.message || "เกิดข้อผิดพลาด",
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

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8">
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-full shadow-lg">
                <img src="/LOGO.png" alt="Logo" className="h-20 w-20" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">สมัครสมาชิกใหม่</CardTitle>
            <CardDescription className="text-blue-100 text-lg">กรอกข้อมูลเพื่อสมัครสมาชิกสระว่ายน้ำโรจนากร มหาวิทยาลัยมหาสารคาม</CardDescription>
          </CardHeader>
        <CardContent className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ข้อมูลส่วนตัว */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                ข้อมูลส่วนตัว
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium">ชื่อผู้ใช้ *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="กรอกชื่อผู้ใช้"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">อีเมล *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="กรอกอีเมล"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-gray-700 font-medium">ชื่อ *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    placeholder="กรอกชื่อ"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-gray-700 font-medium">นามสกุล *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    placeholder="กรอกนามสกุล"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">เบอร์โทรศัพท์ ( 10 ตัว)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    maxLength={10}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-gray-700 font-medium">วันเกิด</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_card" className="text-gray-700 font-medium">เลขบัตรประชาชน ( 13 ตัว)</Label>
                  <Input
                    id="id_card"
                    name="id_card"
                    value={formData.id_card}
                    onChange={handleChange}
                    placeholder="กรอกเลขบัตรประชาชน"
                    maxLength={13}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-gray-700 font-medium">สังกัด/หน่วยงาน *</Label>
                  <Input
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    required
                    placeholder="กรอกสังกัด/หน่วยงาน"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-gray-700 font-medium">อายุ *</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    placeholder="กรอกอายุ"
                    min="1"
                    max="120"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700 font-medium">เพศ *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_category" className="text-gray-700 font-medium">ประเภทผู้ใช้ *</Label>
                  <Select value={formData.user_category_id} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
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
            </div>

            {/* ข้อมูลติดต่อ */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ข้อมูลติดต่อ
              </h3>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-700 font-medium">ที่อยู่</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="กรอกที่อยู่"
                  rows={3}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                />
              </div>
            </div>
            {/* ข้อมูลสุขภาพ */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-100">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                ข้อมูลสุขภาพ
              </h3>
              <div className="space-y-2">
                <Label htmlFor="medical_condition" className="text-gray-700 font-medium">โรคประจำตัว (ถ้ามี)</Label>
                <Textarea
                  id="medical_condition"
                  name="medical_condition"
                  value={formData.medical_condition}
                  onChange={handleChange}
                  placeholder="กรอกโรคประจำตัว หากไม่มีให้เว้นว่าง"
                  rows={2}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg"
                />
              </div>
            </div>
            {/* ผู้ติดต่อฉุกเฉิน */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-100">
              <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                ผู้ติดต่อฉุกเฉิน *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name" className="text-gray-700 font-medium">ชื่อ-นามสกุล</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    required
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship" className="text-gray-700 font-medium">ความสัมพันธ์</Label>
                  <Select value={formData.emergency_contact_relationship} onValueChange={(value) => setFormData(prev => ({...prev, emergency_contact_relationship: value}))}>
                    <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg">
                      <SelectValue placeholder="เลือกความสัมพันธ์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="บิดา">บิดา</SelectItem>
                      <SelectItem value="มารดา">มารดา</SelectItem>
                      <SelectItem value="คู่สมรส">คู่สมรส</SelectItem>
                      <SelectItem value="พี่น้อง">พี่น้อง</SelectItem>
                      <SelectItem value="ญาติ">ญาติ</SelectItem>
                      <SelectItem value="เพื่อน">เพื่อน</SelectItem>
                      <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone" className="text-gray-700 font-medium">เบอร์โทรศัพท์ (ไม่เกิน 10 ตัว)</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    required
                    placeholder="กรอกเบอร์โทรศัพท์"
                    maxLength={10}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>
              </div>
            </div>
            {/* รูปโปรไฟล์ */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                รูปโปรไฟล์
              </h3>
              <div className="space-y-2">
                <Label htmlFor="profile_photo" className="text-gray-700 font-medium">อัปโหลดรูปโปรไฟล์ *</Label>
                <div className="text-sm text-gray-600 mb-2">
                  หน้าตรง ไม่สวมแว่นตา ขนาด 1 นิ้ว (ไฟล์ JPG, PNG ขนาดไม่เกิน 2MB)
                </div>
                <Input
                  id="profile_photo"
                  name="profile_photo"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/jpg"
                  required
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                />
              </div>
            </div>
            {/* รหัสผ่าน */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                ตั้งรหัสผ่าน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">รหัสผ่าน *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="กรอกรหัสผ่าน"
                      className="pr-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-2 ${passwordValidation.length ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{passwordValidation.length ? '✓' : '✗'}</span>
                      <span>ความยาว 8-12 ตัวอักษร</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{passwordValidation.uppercase ? '✓' : '✗'}</span>
                      <span>ตัวอักษรพิมพ์ใหญ่ (A-Z) (อย่างน้อย 1 ตัว)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{passwordValidation.lowercase ? '✓' : '✗'}</span>
                      <span>ตัวอักษรพิมพ์เล็ก (a-z) (อย่างน้อย 1 ตัว)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.number ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{passwordValidation.number ? '✓' : '✗'}</span>
                      <span>ตัวเลข (0-9) (อย่างน้อย 1 ตัว)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.special ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{passwordValidation.special ? '✓' : '✗'}</span>
                      <span>อักขระพิเศษ (!@#$%^&*_-+=?) (อย่างน้อย 1 ตัว)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">ยืนยันรหัสผ่าน *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="ยืนยันรหัสผ่าน"
                      className="pr-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold text-blue-600">ข้อกำหนดการใช้บริการสระว่ายน้ำโรจนากร มหาวิทยาลัยมหาสารคาม</Label>
                <div className="bg-blue-50 p-4 rounded-lg space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">1.</span>
                    <span>ข้าพเจ้าจะปฏิบัติตามข้อบังคับ และระเบียบต่าง ๆ ของสระว่ายน้ำโรจนากร มหาวิทยาลัยมหาสารคาม</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">2.</span>
                    <span>ข้าพเจ้าจะรักษาไว้ซึ่งมารยาท และศีลธรรมอันดีงามของสมาชิก</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">3.</span>
                    <span>ข้าพเจ้าจะรับผิดชอบเกี่ยวกับทรัพย์สิน ที่นำติดตัวมาสระด้วยตนเอง หากเกิดชำรุด เสียหาย สูญหาย จะไม่เรียกร้องค่าเสียหายใด ๆ ทั้งสิ้น</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">4.</span>
                    <span>หากเกิดอุบัติเหตุบริเวณสระว่ายน้ำ เจ็บป่วย ได้รับบาดเจ็บ หรือถึงแก่ชีวิต ข้าพเจ้าจะไม่เรียกร้องค่าเสียหายใด ๆ จากมหาวิทยาลัย โดยไม่ถือว่าเป็นความผิดของมหาวิทยาลัย</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 min-w-[20px]">5.</span>
                    <span>ข้าพเจ้ายินดีที่จะชำระค่าบำรุงรายปี และค่าบริการสระว่ายน้ำตามระเบียบที่มหาวิทยาลัยกำหนด</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    required
                  />
                  <Label htmlFor="acceptTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    ข้าพเจ้ายอมรับข้อกำหนดการใช้บริการทั้งหมดข้างต้น *
                  </Label>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังสมัครสมาชิก...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    สมัครสมาชิก
                  </div>
                )}
              </Button>
            </div>
          </form>
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
              <p className="text-gray-700">
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200">
                  เข้าสู่ระบบที่นี่
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Dialog Component สำหรับแจ้งเตือนสระเต็ม */}
      <Dialog open={showPoolFullDialog} onOpenChange={setShowPoolFullDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              สระว่ายน้ำเต็ม
            </DialogTitle>
            <DialogDescription>
              ขออภัย สระว่ายน้ำมีผู้ใช้บริการเต็มแล้วในขณะนี้ กรุณาลองใหม่อีกครั้งในเวลาอื่น หรือดูตารางเวลาการใช้งานเพื่อเลือกช่วงเวลาที่เหมาะสม
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={() => {
                setShowPoolFullDialog(false);
                // เปลี่ยนเส้นทางไปยังหน้าตารางเวลา
                window.location.href = '/schedule';
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              ดูตารางเวลาการใช้งาน
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPoolFullDialog(false)}
              className="w-full"
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      

      </div>
    </div>
  )
}
