"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const success = await login(username, password)

    if (success) {
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับเข้าสู่ระบบสระว่ายน้ำโรจนากร",
      })
      router.push("/")
    } else {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: "กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: "url('/555.png')" }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm/0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/LOGO.png" alt="Logo" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">สระว่ายน้ำโรจนากร</CardTitle>
          <CardDescription>เข้าสู่ระบบเพื่อใช้งานระบบจัดการสระว่ายน้ำ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่าน"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              ลืมรหัสผ่าน?
            </Link>
            <div className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                สมัครสมาชิก
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
