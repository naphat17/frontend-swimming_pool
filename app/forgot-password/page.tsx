"use client" // บอกให้ Next.js รู้ว่านี่เป็น Client Component

import type React from "react" // นำเข้า type ของ React สำหรับ TypeScript

import { useState } from "react" // นำเข้า useState hook สำหรับจัดการ state
import { Button } from "@/components/ui/button" // นำเข้า Button component
import { Input } from "@/components/ui/input" // นำเข้า Input component
import { Label } from "@/components/ui/label" // นำเข้า Label component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // นำเข้า Card components
import { useToast } from "@/hooks/use-toast" // นำเข้า useToast hook สำหรับแสดงข้อความแจ้งเตือน
import Link from "next/link" // นำเข้า Link component ของ Next.js สำหรับการนำทาง
import { ArrowLeft } from "lucide-react" // นำเข้าไอคอนลูกศรซ้าย

export default function ForgotPasswordPage() { // ส่งออก function หลักของหน้าลืมรหัสผ่าน
  const [email, setEmail] = useState("") // state สำหรับเก็บค่าอีเมลที่ผู้ใช้กรอก
  const [loading, setLoading] = useState(false) // state สำหรับแสดงสถานะการโหลด
  const [sent, setSent] = useState(false) // state สำหรับเช็คว่าส่งอีเมลแล้วหรือยัง
  const { toast } = useToast() // ดึง function toast มาใช้สำหรับแสดงข้อความแจ้งเตือน

  const handleSubmit = async (e: React.FormEvent) => { // function สำหรับจัดการการส่งฟอร์ม
    e.preventDefault() // ป้องกันการ refresh หน้าเมื่อส่งฟอร์ม
    setLoading(true) // เซ็ตสถานะเป็นกำลังโหลด

    try { // เริ่มต้น try-catch block สำหรับจัดการ error
      const response = await fetch("https://backend-l7q9.onrender.com/api/auth/forgot-password", { // ส่ง request ไปยัง API
        method: "POST", // ใช้ HTTP method POST
        headers: { "Content-Type": "application/json" }, // กำหนด header ว่าส่งข้อมูลเป็น JSON
        body: JSON.stringify({ email }), // แปลงข้อมูลอีเมลเป็น JSON string
      })

      if (response.ok) { // ถ้า response สำเร็จ (status 200-299)
        setSent(true) // เซ็ตสถานะว่าส่งอีเมลแล้ว
        toast({ // แสดงข้อความแจ้งเตือนความสำเร็จ
          title: "ส่งอีเมลสำเร็จ", // หัวข้อข้อความ
          description: "กรุณาตรวจสอบอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน", // รายละเอียดข้อความ
        })
      } else { // ถ้า response ไม่สำเร็จ
        const data = await response.json() // แปลง response เป็น JSON
        toast({ // แสดงข้อความแจ้งเตือนข้อผิดพลาด
          title: "เกิดข้อผิดพลาด", // หัวข้อข้อความ
          description: data.message || "ไม่สามารถส่งอีเมลได้", // รายละเอียดข้อความ หรือข้อความเริ่มต้น
          variant: "destructive", // รูปแบบการแสดงผลแบบ error
        })
      }
    } catch (error) { // จับ error ที่เกิดขึ้นระหว่างการส่ง request
      toast({ // แสดงข้อความแจ้งเตือนข้อผิดพลาด
        title: "เกิดข้อผิดพลาด", // หัวข้อข้อความ
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", // รายละเอียดข้อความ
        variant: "destructive", // รูปแบบการแสดงผลแบบ error
      })
    }

    setLoading(false) // เซ็ตสถานะการโหลดเป็น false เมื่อเสร็จสิ้น
  } // จบ function handleSubmit

  return ( // เริ่มต้น return JSX
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4"> {/* container หลักที่มีความสูงเต็มหน้าจอ จัดกึ่งกลาง และมีพื้นหลังไล่สี */}
      <Card className="w-full max-w-md"> {/* Card component ที่มีความกว้างเต็มแต่ไม่เกิน max-width */}
        <CardHeader className="text-center"> {/* ส่วนหัวของ Card จัดกึ่งกลาง */}
          <CardTitle className="text-2xl font-bold text-blue-600">ลืมรหัสผ่าน</CardTitle> {/* หัวข้อหลักของหน้า */}
          <CardDescription>{sent ? "ตรวจสอบอีเมลของคุณ" : "กรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน"}</CardDescription> {/* คำอธิบายที่เปลี่ยนตามสถานะ */}
        </CardHeader> {/* จบส่วนหัวของ Card */}
        <CardContent> {/* เนื้อหาหลักของ Card */}
          {sent ? ( // ถ้าส่งอีเมลแล้ว แสดงหน้าจอยืนยัน
            <div className="text-center space-y-4"> {/* container จัดกึ่งกลางและมีระยะห่างระหว่าง element */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"> {/* วงกลมสีเขียวสำหรับไอคอนสำเร็จ */}
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* ไอคอน checkmark */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> {/* path ของไอคอน checkmark */}
                </svg> {/* จบไอคอน SVG */}
              </div> {/* จบ container ไอคอน */}
              <p className="text-sm text-gray-600"> {/* ข้อความแจ้งว่าส่งอีเมลแล้ว */}
                เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมล <strong>{email}</strong> แล้ว {/* แสดงอีเมลที่ส่งไป */}
              </p> {/* จบข้อความหลัก */}
              <p className="text-xs text-gray-500">หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์ Spam</p> {/* ข้อความแนะนำเพิ่มเติม */}
            </div>
          ) : ( // ถ้ายังไม่ได้ส่งอีเมล แสดงฟอร์ม
            <form onSubmit={handleSubmit} className="space-y-4"> {/* ฟอร์มสำหรับกรอกอีเมล */}
              <div className="space-y-2"> {/* container สำหรับ input field */}
                <Label htmlFor="email">อีเมล</Label> {/* label สำหรับ input อีเมล */}
                <Input // input field สำหรับกรอกอีเมล
                  id="email" // id ของ input
                  type="email" // type เป็น email เพื่อ validation
                  value={email} // ค่าจาก state
                  onChange={(e) => setEmail(e.target.value)} // function สำหรับอัพเดท state เมื่อมีการเปลี่ยนแปลง
                  required // บังคับกรอก
                  placeholder="กรอกอีเมลของคุณ" // ข้อความแนะนำ
                /> {/* จบ Input component */}
              </div> {/* จบ container input */}
              <Button type="submit" className="w-full" disabled={loading}> {/* ปุ่มส่งฟอร์ม กว้างเต็ม disable เมื่อกำลังโหลด */}
                {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"} {/* ข้อความปุ่มเปลี่ยนตามสถานะ */}
              </Button> {/* จบ Button component */}
            </form>
          )} 
          <div className="mt-4 text-center"> {/* container สำหรับลิงก์กลับ จัดกึ่งกลาง */}
            <Link href="/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center"> {/* ลิงก์กลับไปหน้า login */}
              <ArrowLeft className="h-4 w-4 mr-1" /> {/* ไอคอนลูกศรซ้าย */}
              กลับไปหน้าเข้าสู่ระบบ {/* ข้อความลิงก์ */}
            </Link> {/* จบ Link component */}
          </div> {/* จบ container ลิงก์ */}
        </CardContent> {/* จบเนื้อหาของ Card */}
      </Card> {/* จบ Card component */}
    </div> 
  ) // จบ return JSX
} // จบ function ForgotPasswordPage
