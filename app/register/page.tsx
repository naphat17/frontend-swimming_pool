"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  })
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/memberships/categories")
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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

    if (!formData.user_category_id) {
      toast({
        title: "กรุณาเลือกประเภทผู้ใช้",
        description: "กรุณาเลือกประเภทผู้ใช้ที่ต้องการ",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth,
          id_card: formData.id_card,
          user_category_id: parseInt(formData.user_category_id),
        }),
      })

      if (response.ok) {
        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "กรุณาเข้าสู่ระบบด้วยบัญชีที่สร้างใหม่",
        })
        router.push("/login")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/LOGO.png" alt="Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">สมัครสมาชิกใหม่</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อสมัครสมาชิกสระว่ายน้ำโรจนากร</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">ชื่อผู้ใช้ *</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="กรอกอีเมล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">ชื่อ *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="กรอกชื่อ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">นามสกุล *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="กรอกนามสกุล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">วันเกิด</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_card">เลขบัตรประชาชน</Label>
                <Input
                  id="id_card"
                  name="id_card"
                  value={formData.id_card}
                  onChange={handleChange}
                  placeholder="กรอกเลขบัตรประชาชน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_category">ประเภทผู้ใช้ *</Label>
                <Select value={formData.user_category_id} onValueChange={handleCategoryChange}>
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
                value={formData.address}
                onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="ยืนยันรหัสผ่าน"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
