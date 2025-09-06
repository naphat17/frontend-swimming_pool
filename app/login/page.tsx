"use client" // ระบุว่าเป็น Client Component สำหรับ Next.js

import type React from "react" // นำเข้า type ของ React

import { useState } from "react" // นำเข้า useState hook สำหรับจัดการ state
import { useRouter } from "next/navigation" // นำเข้า useRouter สำหรับการนำทาง
import { useAuth } from "@/components/auth-provider" // นำเข้า useAuth hook สำหรับการยืนยันตัวตน
import { Button } from "@/components/ui/button" // นำเข้า Button component
import { Input } from "@/components/ui/input" // นำเข้า Input component
import { Label } from "@/components/ui/label" // นำเข้า Label component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // นำเข้า Card components
import { useToast } from "@/hooks/use-toast" // นำเข้า useToast hook สำหรับแสดงข้อความแจ้งเตือน
import Link from "next/link" // นำเข้า Link component สำหรับการนำทาง

export default function LoginPage() { // ส่งออก component หลักของหน้าเข้าสู่ระบบ
  const [username, setUsername] = useState("") // สร้าง state สำหรับเก็บชื่อผู้ใช้
  const [password, setPassword] = useState("") // สร้าง state สำหรับเก็บรหัสผ่าน
  const [loading, setLoading] = useState(false) // สร้าง state สำหรับสถานะการโหลด
  const { login } = useAuth() // ดึงฟังก์ชัน login จาก auth provider
  const router = useRouter() // สร้าง router สำหรับการนำทาง
  const { toast } = useToast() // ดึงฟังก์ชัน toast สำหรับแสดงข้อความแจ้งเตือน

  const handleSubmit = async (e: React.FormEvent) => { // ฟังก์ชันจัดการการส่งฟอร์ม
    e.preventDefault() // ป้องกันการรีเฟรชหน้าเมื่อส่งฟอร์ม
    setLoading(true) // ตั้งสถานะการโหลดเป็น true

    const success = await login(username, password) // เรียกฟังก์ชันเข้าสู่ระบบ

    if (success) { // ถ้าเข้าสู่ระบบสำเร็จ
      toast({ // แสดงข้อความแจ้งเตือนความสำเร็จ
        title: "เข้าสู่ระบบสำเร็จ", // หัวข้อข้อความ
        description: "ยินดีต้อนรับเข้าสู่ระบบสระว่ายน้ำโรจนากร", // รายละเอียดข้อความ
      })
      router.push("/") // นำทางไปหน้าหลัก
    } else { // ถ้าเข้าสู่ระบบไม่สำเร็จ
      toast({ // แสดงข้อความแจ้งเตือนข้อผิดพลาด
        title: "เข้าสู่ระบบไม่สำเร็จ", // หัวข้อข้อความ
        description: "กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน", // รายละเอียดข้อความ
        variant: "destructive", // ประเภทข้อความ (สีแดง)
      })
    }

    setLoading(false) // ตั้งสถานะการโหลดเป็น false
  }

  return ( // ส่งคืน JSX ของ component
    <div // div หลักของหน้า
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative" // คลาส CSS สำหรับจัดรูปแบบ
      style={{ backgroundImage: "url('/555.png')" }} // ตั้งภาพพื้นหลัง
    >
      <div className="absolute inset-0 bg-black/30" /> {/* overlay สีดำโปร่งใส */}
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm/0"> {/* การ์ดหลักของฟอร์ม */}
        <CardHeader className="text-center"> {/* ส่วนหัวของการ์ด */}
          <div className="flex justify-center mb-4"> {/* div สำหรับจัดกึ่งกลางโลโก้ */}
            <img src="/LOGO.png" alt="Logo" className="h-16 w-16" /> {/* รูปโลโก้ */}
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">สระว่ายน้ำโรจนากร</CardTitle> {/* หัวข้อหลัก */}
          <CardDescription>เข้าสู่ระบบเพื่อใช้งานระบบจัดการสระว่ายน้ำ</CardDescription> {/* คำอธิบาย */}
        </CardHeader>
        <CardContent> {/* เนื้อหาของการ์ด */}
          <form onSubmit={handleSubmit} className="space-y-4"> {/* ฟอร์มเข้าสู่ระบบ */}
            <div className="space-y-2"> {/* กลุ่มของ input ชื่อผู้ใช้ */}
              <Label htmlFor="username">ชื่อผู้ใช้</Label> {/* ป้ายชื่อสำหรับ input ชื่อผู้ใช้ */}
              <Input // input สำหรับชื่อผู้ใช้
                id="username" // id ของ input
                type="text" // ประเภทของ input
                value={username} // ค่าของ input จาก state
                onChange={(e) => setUsername(e.target.value)} // ฟังก์ชันเมื่อมีการเปลี่ยนแปลงค่า
                required // บังคับกรอก
                placeholder="กรอกชื่อผู้ใช้" // ข้อความแนะนำ
              />
            </div>
            <div className="space-y-2"> {/* กลุ่มของ input รหัสผ่าน */}
              <Label htmlFor="password">รหัสผ่าน</Label> {/* ป้ายชื่อสำหรับ input รหัสผ่าน */}
              <Input // input สำหรับรหัสผ่าน
                id="password" // id ของ input
                type="password" // ประเภทของ input (ซ่อนข้อความ)
                value={password} // ค่าของ input จาก state
                onChange={(e) => setPassword(e.target.value)} // ฟังก์ชันเมื่อมีการเปลี่ยนแปลงค่า
                required // บังคับกรอก
                placeholder="กรอกรหัสผ่าน" // ข้อความแนะนำ
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}> {/* ปุ่มส่งฟอร์ม */}
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"} {/* ข้อความในปุ่มตามสถานะการโหลด */}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2"> {/* ส่วนลิงก์เพิ่มเติม */}
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline"> {/* ลิงก์ลืมรหัสผ่าน */}
              ลืมรหัสผ่าน? {/* ข้อความลิงก์ */}
            </Link>
            <div className="text-sm text-gray-600"> {/* div สำหรับลิงก์สมัครสมาชิก */}
              ยังไม่มีบัญชี?{" "} {/* ข้อความถาม */}
              <Link href="/register" className="text-blue-600 hover:underline"> {/* ลิงก์สมัครสมาชิก */}
                สมัครสมาชิก {/* ข้อความลิงก์ */}
              </Link>
            </div>
          </div>
        </CardContent> {/* ปิดแท็ก CardContent */}
      </Card> {/* ปิดแท็ก Card */}
    </div> //* ปิดแท็ก div หลัก 
  ) // ปิด return statement
} // ปิดฟังก์ชัน LoginPage
