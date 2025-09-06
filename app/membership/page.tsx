"use client" // ระบุว่าเป็น Client Component สำหรับ Next.js

import { useEffect, useState, useRef } from "react" // นำเข้า React hooks สำหรับจัดการ state และ lifecycle
import UserLayout from "@/components/user-layout" // นำเข้า layout component สำหรับผู้ใช้
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // นำเข้า Card components สำหรับแสดงข้อมูลในรูปแบบการ์ด
import { Button } from "@/components/ui/button" // นำเข้า Button component
import { Badge } from "@/components/ui/badge" // นำเข้า Badge component สำหรับแสดงสถานะ
import { useToast } from "@/hooks/use-toast" // นำเข้า hook สำหรับแสดงข้อความแจ้งเตือน
import { Check, Crown, Star, Calendar, CreditCard, Sparkles, Shield, Zap, Gift } from "lucide-react" // นำเข้าไอคอนต่างๆ จาก lucide-react
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // นำเข้า Dialog components สำหรับ modal
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // นำเข้า RadioGroup components สำหรับเลือกตัวเลือก
import { Input } from "@/components/ui/input" // นำเข้า Input component สำหรับรับข้อมูล
import { Label } from "@/components/ui/label" // นำเข้า Label component สำหรับป้ายกำกับ

interface UserMembership { // interface สำหรับกำหนดโครงสร้างข้อมูลสมาชิกภาพของผู้ใช้
  type: string // ประเภทสมาชิกภาพ
  expires_at: string // วันที่หมดอายุ
  status: string // สถานะสมาชิกภาพ (active, expired, pending)
  user_category: string // หมวดหมู่ผู้ใช้
  pay_per_session_price: number // ราคาชำระรายครั้ง
  annual_price: number // ราคาสมาชิกรายปี
  membership_type_id: number // ID ประเภทสมาชิกภาพ
}

interface UserCategory { // interface สำหรับกำหนดโครงสร้างข้อมูลหมวดหมู่ผู้ใช้
  id: number; // ID หมวดหมู่
  name: string; // ชื่อหมวดหมู่
  description: string; // คำอธิบายหมวดหมู่
  pay_per_session_price: number; // ราคาชำระรายครั้งสำหรับหมวดหมู่นี้
  annual_price: number; // ราคาสมาชิกรายปีสำหรับหมวดหมู่นี้
}

export default function MembershipPage() { // ฟังก์ชัน component หลักสำหรับหน้าสมาชิกภาพ
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null) // state สำหรับเก็บข้อมูลสมาชิกภาพของผู้ใช้
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]); // state สำหรับเก็บรายการหมวดหมู่ผู้ใช้
  const [loading, setLoading] = useState(true) // state สำหรับแสดงสถานะการโหลดข้อมูล
  const [purchasing, setPurchasing] = useState<string | null>(null) // state สำหรับติดตามสถานะการซื้อ
  const { toast } = useToast() // hook สำหรับแสดงข้อความแจ้งเตือน
  const [paymentModal, setPaymentModal] = useState<null | { type: 'session' | 'annual', price: number, categoryId: number }>(null) // state สำหรับควบคุม modal การชำระเงิน
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "">("") // state สำหรับเก็บวิธีการชำระเงินที่เลือก
  const [paymentStep, setPaymentStep] = useState<"choose" | "upload" | "pending" | "done">("choose") // state สำหรับติดตามขั้นตอนการชำระเงิน
  const [createdPayment, setCreatedPayment] = useState<any>(null) // state สำหรับเก็บข้อมูลการชำระเงินที่สร้างแล้ว
  const [slipFile, setSlipFile] = useState<File | null>(null) // state สำหรับเก็บไฟล์สลิปที่อัปโหลด
  const [uploading, setUploading] = useState(false) // state สำหรับแสดงสถานะการอัปโหลดไฟล์
  const fileInputRef = useRef<HTMLInputElement>(null) // ref สำหรับอ้างอิง input file element
  const [bankAccountNumber, setBankAccountNumber] = useState("") // state สำหรับเก็บเลขบัญชีธนาคาร

  useEffect(() => { // useEffect hook ที่ทำงานเมื่อ component mount
    const fetchData = async () => { // ฟังก์ชัน async สำหรับดึงข้อมูล
      try { // เริ่มต้น try-catch block สำหรับจัดการ error
        const token = localStorage.getItem("token") // ดึง token จาก localStorage
        const dashboardResponse = await fetch("https://backend-l7q9.onrender.com/api/user/dashboard", { // เรียก API dashboard
          headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
        })
        if (dashboardResponse.ok) { // ตรวจสอบว่า response สำเร็จ
          const dashboardData = await dashboardResponse.json() // แปลง response เป็น JSON
          setUserMembership(dashboardData.membership) // เซ็ตข้อมูลสมาชิกภาพ
          console.log("User Membership:", dashboardData.membership); // Debug log แสดงข้อมูลสมาชิกภาพ
        } else { // หาก response ไม่สำเร็จ
          console.error("Failed to fetch user dashboard:", dashboardResponse.status, dashboardResponse.statusText); // แสดง error log
        }

        const categoriesResponse = await fetch("https://backend-l7q9.onrender.com/api/memberships/categories"); // เรียก API หมวดหมู่สมาชิกภาพ
        if (categoriesResponse.ok) { // ตรวจสอบว่า response สำเร็จ
          const categoriesData = await categoriesResponse.json(); // แปลง response เป็น JSON
          setUserCategories(categoriesData.categories); // เซ็ตข้อมูลหมวดหมู่
          console.log("User Categories:", categoriesData.categories); // Debug log แสดงข้อมูลหมวดหมู่
        } else { // หาก response ไม่สำเร็จ
          console.error("Failed to fetch user categories:", categoriesResponse.status, categoriesResponse.statusText); // แสดง error log
        }

      } catch (error) { // จัดการ error ที่เกิดขึ้น
        console.error("Error fetching data:", error) // แสดง error log
      } finally { // block ที่ทำงานเสมอไม่ว่าจะสำเร็จหรือ error
        setLoading(false) // เซ็ตสถานะ loading เป็น false
      }
    }

    fetchData() // เรียกใช้ฟังก์ชัน fetchData
    ;(async () => { // IIFE (Immediately Invoked Function Expression) สำหรับดึงเลขบัญชีธนาคาร
      try { // เริ่มต้น try-catch block
        const res = await fetch("https://backend-l7q9.onrender.com/api/settings/bank_account_number") // เรียก API เลขบัญชีธนาคาร
        if (res.ok) { // ตรวจสอบว่า response สำเร็จ
          const data = await res.json() // แปลง response เป็น JSON
          setBankAccountNumber(data.value) // เซ็ตเลขบัญชีธนาคาร
        }
      } catch {} // จัดการ error แบบเงียบๆ
    })() // เรียกใช้ IIFE ทันที
  }, []) // dependency array ว่าง หมายถึงทำงานครั้งเดียวเมื่อ component mount

  // ฟังก์ชันตรวจสอบว่าสมาชิกรายปียังไม่หมดอายุหรือไม่
  const isAnnualMembershipActive = () => { // ฟังก์ชันตรวจสอบสถานะสมาชิกรายปี
    if (!userMembership) return false; // หากไม่มีข้อมูลสมาชิกภาพ ให้คืนค่า false
    
    // ตรวจสอบว่าเป็นสมาชิกรายปี (membership_type_id = 2) และยังไม่หมดอายุ
    if (userMembership.membership_type_id === 2 && userMembership.status === 'active') { // ตรวจสอบว่าเป็นสมาชิกรายปีและสถานะ active
      const expiryDate = new Date(userMembership.expires_at); // แปลงวันหมดอายุเป็น Date object
      const currentDate = new Date(); // สร้าง Date object สำหรับวันปัจจุบัน
      return expiryDate > currentDate; // เปรียบเทียบวันหมดอายุกับวันปัจจุบัน
    }
    
    return false; // คืนค่า false หากไม่ตรงเงื่อนไข
  };

  const handleOpenPaymentModal = (type: 'session' | 'annual', price: number, categoryId: number) => { // ฟังก์ชันเปิด modal การชำระเงิน
    // ตรวจสอบว่าเป็นการสมัครสมาชิกรายปีและมีสมาชิกรายปีที่ยังไม่หมดอายุ
    if (type === 'annual' && isAnnualMembershipActive()) { // ตรวจสอบว่าเป็นการสมัครรายปีและมีสมาชิกรายปีที่ยังใช้งานได้
      const expiryDate = new Date(userMembership!.expires_at); // แปลงวันหมดอายุเป็น Date object
      toast({ // แสดงข้อความแจ้งเตือน
        title: "ไม่สามารถสมัครได้", // หัวข้อข้อความ
        description: `คุณมีสมาชิกรายปีที่ยังไม่หมดอายุ หมดอายุวันที่ ${expiryDate.toLocaleDateString("th-TH")}`, // รายละเอียดข้อความ
        variant: "destructive", // ประเภทข้อความ (error)
      });
      return; // หยุดการทำงานของฟังก์ชัน
    }
    
    setPaymentModal({ type, price, categoryId }) // เซ็ตข้อมูล modal การชำระเงิน
    setPaymentMethod("") // รีเซ็ตวิธีการชำระเงิน
    setPaymentStep("choose") // เซ็ตขั้นตอนเป็น "choose"
    setCreatedPayment(null) // รีเซ็ตข้อมูลการชำระเงินที่สร้าง
    setSlipFile(null) // รีเซ็ตไฟล์สลิป
  }

  const handleCreatePayment = async () => { // ฟังก์ชันสร้างรายการชำระเงิน
    if (!paymentModal || !paymentMethod) return // ตรวจสอบว่ามีข้อมูล modal และวิธีการชำระเงิน
    setPurchasing(paymentModal.type) // เซ็ตสถานะกำลังซื้อ
    try { // เริ่มต้น try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch("https://backend-l7q9.onrender.com/api/memberships/purchase", { // เรียก API สำหรับซื้อสมาชิกภาพ
        method: "POST", // ใช้ method POST
        headers: { // กำหนด headers
          "Content-Type": "application/json", // กำหนดประเภทข้อมูลเป็น JSON
          Authorization: `Bearer ${token}`, // ส่ง token สำหรับ authentication
        },
        body: JSON.stringify({ // แปลงข้อมูลเป็น JSON string
          purchase_type: paymentModal.type, // ประเภทการซื้อ (session หรือ annual)
          payment_method: paymentMethod, // วิธีการชำระเงิน
          user_category_id: paymentModal.categoryId, // ID หมวดหมู่ผู้ใช้ที่เลือก
        }),
      })
      if (response.ok) { // ตรวจสอบว่า response สำเร็จ
        const data = await response.json() // แปลง response เป็น JSON
        setCreatedPayment(data) // เซ็ตข้อมูลการชำระเงินที่สร้าง
        if (paymentMethod === "bank_transfer") { // หากเป็นการโอนผ่านธนาคาร
          setPaymentStep("upload") // เปลี่ยนขั้นตอนเป็น upload สลิป
        } else { // หากเป็นการชำระด้วยเงินสด
          setPaymentStep("pending") // เปลี่ยนขั้นตอนเป็น pending
        }
      } else { // หาก response ไม่สำเร็จ
        const errorData = await response.json() // แปลง error response เป็น JSON
        toast({ // แสดงข้อความแจ้งเตือน error
          title: "ไม่สามารถสร้างรายการชำระเงินได้", // หัวข้อข้อความ
          description: errorData.message || "เกิดข้อผิดพลาด", // รายละเอียดข้อความ
          variant: "destructive", // ประเภทข้อความ (error)
        })
      }
    } catch (error) { // จับ error ที่เกิดขึ้น
      toast({ // แสดงข้อความแจ้งเตือน error
        title: "เกิดข้อผิดพลาด", // หัวข้อข้อความ
        description: "ไม่สามารถดำเนินการได้", // รายละเอียดข้อความ
        variant: "destructive", // ประเภทข้อความ (error)
      })
    }
    setPurchasing(null) // รีเซ็ตสถานะการซื้อ
  }

  const handleUploadSlip = async () => { // ฟังก์ชันอัปโหลดสลิปการโอนเงิน
    if (!createdPayment?.payment_id || !slipFile) return // ตรวจสอบว่ามีไฟล์สลิปและข้อมูลการชำระเงิน
    setUploading(true) // เซ็ตสถานะกำลังอัปโหลดสลิป
    try { // เริ่มต้น try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const formData = new FormData() // สร้าง FormData สำหรับส่งไฟล์
      formData.append("slip", slipFile) // เพิ่มไฟล์สลิปใน FormData
      const response = await fetch(`https://backend-l7q9.onrender.com/api/payments/${createdPayment.payment_id}/upload-slip`, { // เรียก API อัปโหลดสลิป
        method: "POST", // ใช้ method POST
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token สำหรับ authentication
        body: formData, // ส่ง FormData ที่มีไฟล์สลิป
      })
      if (response.ok) { // ตรวจสอบว่า response สำเร็จ
        setPaymentStep("pending") // เปลี่ยนขั้นตอนเป็น pending
        toast({ title: "อัปโหลดสลิปสำเร็จ", description: "รอเจ้าหน้าที่ตรวจสอบ" }) // แสดงข้อความแจ้งเตือนสำเร็จ
      } else { // หาก response ไม่สำเร็จ
        const errorData = await response.json() // แปลง error response เป็น JSON
        toast({ // แสดงข้อความแจ้งเตือน error
          title: "อัปโหลดสลิปไม่สำเร็จ", // หัวข้อข้อความ
          description: errorData.message || "เกิดข้อผิดพลาด", // รายละเอียดข้อความ
          variant: "destructive", // ประเภทข้อความ (error)
        })
      }
    } catch (error) { // จับ error ที่เกิดขึ้น
      toast({ // แสดงข้อความแจ้งเตือน error
        title: "เกิดข้อผิดพลาด", // หัวข้อข้อความ
        description: "ไม่สามารถอัปโหลดสลิปได้", // รายละเอียดข้อความ
        variant: "destructive", // ประเภทข้อความ (error)
      })
    }
    setUploading(false) // เซ็ตสถานะไม่กำลังอัปโหลดสลิป
  }

  const getStatusColor = (status: string) => { // ฟังก์ชันกำหนดสีตามสถานะสมาชิกภาพ
    switch (status) { // switch statement สำหรับตรวจสอบสถานะ
      case "active": // กรณีสถานะใช้งานได้
        return "bg-green-100 text-green-800" // คืนค่าคลาส CSS สีเขียว
      case "expired": // กรณีสถานะหมดอายุ
        return "bg-red-100 text-red-800" // คืนค่าคลาส CSS สีแดง
      case "pending": // กรณีสถานะรอดำเนินการ
        return "bg-yellow-100 text-yellow-800" // คืนค่าคลาส CSS สีเหลือง
      default: // กรณีสถานะอื่นๆ
        return "bg-gray-100 text-gray-800" // คืนค่าคลาส CSS สีเทา
    }
  }

  if (loading) { // ตรวจสอบสถานะการโหลดข้อมูล
    return ( // คืนค่า JSX สำหรับหน้าจอโหลด
      <UserLayout> {/* layout component หลักสำหรับผู้ใช้ */}
        <div className="flex items-center justify-center h-64"> {/* container สำหรับจัดกึ่งกลางแนวตั้งและแนวนอน */}
          <div className="relative"> {/* container สำหรับ spinner แบบ relative positioning */}
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div> {/* spinner พื้นหลังสีฟ้าอ่อน */}
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div> {/* spinner หลักสีฟ้าเข้มที่วางทับ */}
          </div>
        </div>
      </UserLayout>
    )
  }

  return ( // return statement หลักของ component
    <UserLayout> {/* layout component หลักสำหรับผู้ใช้ */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* container หลักที่มีพื้นหลังแบบ gradient */}
        <div className="space-y-8 p-6"> {/* container สำหรับจัดระยะห่างและ padding */}
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8"> {/* section หลักสำหรับแสดงหัวข้อหน้า */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4"> {/* ไอคอนหลักของหน้า */}
              <Crown className="h-8 w-8 text-white" /> {/* ไอคอนมงกุฎสีขาว */}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {/* หัวข้อหลักของหน้าที่มีสี gradient */}
              สมาชิกภาพ {/* ข้อความหัวข้อ */}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto"> {/* คำอธิบายใต้หัวข้อ */}
              จัดการสถานะสมาชิกภาพและเลือกแพ็คเกจที่เหมาะสมกับคุณ {/* ข้อความอธิบาย */}
            </p>
          </div>

          {/* Current Membership Status */}
          {userMembership && ( // ตรวจสอบว่ามีข้อมูลสมาชิกภาพหรือไม่
            <div className="max-w-4xl mx-auto"> {/* container หลักสำหรับแสดงสถานะสมาชิกภาพ */}
              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white"> {/* card หลักที่มีพื้นหลังแบบ gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div> {/* วงกลมตกแต่งด้านบนขวา */}
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div> {/* วงกลมตกแต่งด้านล่างซ้าย */}
                <CardHeader className="relative z-10"> {/* header ของ card */}
                  <div className="flex items-center justify-between"> {/* container สำหรับจัดเรียงข้อมูลแนวนอน */}
                    <div className="flex items-center space-x-3"> {/* ส่วนแสดงข้อมูลสมาชิกภาพ */}
                      <div className="p-3 bg-white/20 rounded-full"> {/* container สำหรับไอคอน */}
                        {userMembership.user_category.includes("ทั่วไป") ?  // ตรวจสอบประเภทผู้ใช้เพื่อแสดงไอคอนที่เหมาะสม
                          <Star className="h-6 w-6" /> :  // ไอคอนดาวสำหรับผู้ใช้ทั่วไป
                          <Crown className="h-6 w-6" /> // ไอคอนมงกุฎสำหรับผู้ใช้พิเศษ
                        }
                      </div>
                      <div> {/* ส่วนแสดงข้อความข้อมูลสมาชิกภาพ */}
                        <CardTitle className="text-2xl font-bold text-white"> {/* หัวข้อแสดงประเภทผู้ใช้ */}
                          {userMembership.user_category} {/* แสดงประเภทผู้ใช้ */}
                        </CardTitle>
                        <CardDescription className="text-blue-100"> {/* คำอธิบายใต้หัวข้อ */}
                          ประเภทสมาชิกปัจจุบันของคุณ {/* ข้อความอธิบาย */}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(userMembership.status)} border-0 px-4 py-2 text-sm font-medium`}> {/* badge แสดงสถานะสมาชิกภาพ */}
                      {userMembership.status === "active" // ตรวจสอบสถานะและแสดงข้อความภาษาไทย
                        ? "ใช้งานได้" // สถานะใช้งานได้
                        : userMembership.status === "expired"
                          ? "หมดอายุ" // สถานะหมดอายุ
                          : "รอดำเนินการ"} {/* สถานะรอดำเนินการ */}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4"> {/* เนื้อหาหลักของ card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* grid layout สำหรับแสดงข้อมูลรายละเอียด */}
                    <div className="flex items-center space-x-3"> {/* ส่วนแสดงประเภทสมาชิกภาพ */}
                      <Shield className="h-5 w-5 text-blue-200" /> {/* ไอคอนโล่ */}
                      <div> {/* container สำหรับข้อความ */}
                        <p className="text-sm text-blue-100">สมาชิกภาพ</p> {/* ป้ายกำกับ */}
                        <p className="text-lg font-semibold">{userMembership.type}</p> {/* แสดงประเภทสมาชิกภาพ */}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3"> {/* ส่วนแสดงวันหมดอายุ */}
                      <Calendar className="h-5 w-5 text-blue-200" /> {/* ไอคอนปฏิทิน */}
                      <div> {/* container สำหรับข้อความ */}
                        <p className="text-sm text-blue-100">หมดอายุ</p> {/* ป้ายกำกับ */}
                        <p className="text-lg font-semibold"> {/* ข้อความแสดงวันหมดอายุ */}
                          {(() => { // IIFE สำหรับจัดการการแสดงวันที่
                            if (!userMembership.expires_at || userMembership.expires_at === 'null' || userMembership.expires_at.trim() === '') { // ตรวจสอบว่ามีวันหมดอายุหรือไม่
                              return 'ไม่ระบุวันที่' // คืนค่าข้อความเมื่อไม่มีวันที่
                            }
                            try { // เริ่มต้น try-catch block สำหรับจัดการ error
                              const dateStr = userMembership.expires_at.toString() // แปลงวันที่เป็น string
                              let date // ตัวแปรสำหรับเก็บ Date object
                              
                              if (dateStr.includes('T')) { // ตรวจสอบรูปแบบ ISO date
                                date = new Date(dateStr) // สร้าง Date object จาก ISO string
                              } else if (dateStr.includes('-')) { // ตรวจสอบรูปแบบ YYYY-MM-DD
                                const [year, month, day] = dateStr.split('-') // แยกส่วนของวันที่
                                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) // สร้าง Date object
                              } else { // รูปแบบอื่นๆ
                                date = new Date(dateStr) // สร้าง Date object โดยตรง
                              }
                              
                              if (isNaN(date.getTime())) { // ตรวจสอบว่า Date object ถูกต้องหรือไม่
                                return 'รูปแบบวันที่ไม่ถูกต้อง' // คืนค่าข้อความ error
                              }
                              
                              return date.toLocaleDateString("th-TH") // แปลงเป็นรูปแบบวันที่ไทย
                            } catch (error) { // จับ error ที่เกิดขึ้น
                              return 'รูปแบบวันที่ไม่ถูกต้อง' // คืนค่าข้อความ error
                            }
                          })() // เรียกใช้ IIFE ทันที
                        }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pricing Section */}
          <div className="max-w-6xl mx-auto space-y-8"> {/* section หลักสำหรับแสดงราคา */}
            <div className="text-center space-y-4"> {/* header ของ pricing section */}
              <h2 className="text-3xl font-bold text-gray-900">แพ็คเกจราคาสำหรับคุณ</h2> {/* หัวข้อหลัก */}
              <p className="text-gray-600">เลือกแพ็คเกจที่เหมาะสมกับการใช้งานของคุณ</p> {/* คำอธิบายใต้หัวข้อ */}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto"> {/* grid layout สำหรับแสดงการ์ดราคา */}
              {userMembership && userMembership.user_category && userMembership.annual_price !== undefined && userMembership.pay_per_session_price !== undefined ? ( // ตรวจสอบว่ามีข้อมูลสมาชิกภาพและราคา
                <> {/* React Fragment */}
                  {/* Pay Per Session Card */}
                  <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group"> {/* การ์ดสำหรับแพ็คเกจรายครั้ง */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div> {/* วงกลมตกแต่งด้านบนขวา */}
                    <CardHeader className="text-center relative z-10 pb-4"> {/* header ของการ์ด */}
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 mx-auto"> {/* container สำหรับไอคอน */}
                        <Zap className="h-6 w-6 text-white" /> {/* ไอคอนฟ้าผ่า */}
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">ชำระรายครั้ง</CardTitle> {/* หัวข้อการ์ด */}
                      <CardDescription className="text-gray-600">เหมาะสำหรับผู้ใช้เป็นครั้งคราว</CardDescription> {/* คำอธิบายการ์ด */}
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10"> {/* เนื้อหาของการ์ด */}
                      <div className="text-center"> {/* ส่วนแสดงราคา */}
                        <div className="flex items-baseline justify-center space-x-1"> {/* container สำหรับราคาและหน่วย */}
                          <span className="text-4xl font-bold text-gray-900"> {/* ราคาหลัก */}
                            ฿{userMembership.pay_per_session_price.toLocaleString()} {/* แสดงราคาต่อครั้งพร้อมจัดรูปแบบตัวเลข */}
                          </span>
                          <span className="text-lg text-gray-600">/ครั้ง</span> {/* หน่วยราคา */}
                        </div>
                      </div>
                      
                      <div className="space-y-3"> {/* รายการสิทธิประโยชน์ */}
                        <div className="flex items-center space-x-3"> {/* รายการที่ 1 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600">ไม่มีค่าผูกมัด</span> {/* ข้อความสิทธิประโยชน์ */}
                        </div>
                        <div className="flex items-center space-x-3"> {/* รายการที่ 2 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600">ยืดหยุ่นในการใช้งาน</span> {/* ข้อความสิทธิประโยชน์ */}
                        </div>
                        <div className="flex items-center space-x-3"> {/* รายการที่ 3 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600">เหมาะสำหรับผู้ใช้เป็นครั้งคราว</span> {/* ข้อความสิทธิประโยชน์ */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Annual Membership Card */}
                  <Card className="relative overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl group bg-gradient-to-br from-purple-50 to-pink-50"> {/* การ์ดสำหรับแพ็คเกจรายปี */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium"> {/* ป้าย "แนะนำ" */}
                      แนะนำ {/* ข้อความแนะนำ */}
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-12 translate-x-12 opacity-50 group-hover:opacity-70 transition-opacity"></div> {/* วงกลมตกแต่งด้านบนขวา */}
                    <CardHeader className="text-center relative z-10 pb-4"> {/* header ของการ์ด */}
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto"> {/* container สำหรับไอคอน */}
                        <Crown className="h-6 w-6 text-white" /> {/* ไอคอนมงกุฎ */}
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">สมาชิกรายปี</CardTitle> {/* หัวข้อการ์ด */}
                      <CardDescription className="text-gray-600">ประหยัดมากกว่าและคุ้มค่าที่สุด + จองสระฟรี 1 ปี!</CardDescription> {/* คำอธิบายการ์ด */}
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10"> {/* เนื้อหาของการ์ด */}
                      <div className="text-center"> {/* ส่วนแสดงราคา */}
                        <div className="flex items-baseline justify-center space-x-1"> {/* container สำหรับราคาและหน่วย */}
                          <span className="text-4xl font-bold text-gray-900"> {/* ราคาหลัก */}
                            ฿{userMembership.annual_price.toLocaleString()} {/* แสดงราคารายปีพร้อมจัดรูปแบบตัวเลข */}
                          </span>
                          <span className="text-lg text-gray-600">/ปี</span> {/* หน่วยราคา */}
                        </div>
                        <div className="mt-2"> {/* ส่วนแสดงการประหยัด */}
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"> {/* badge แสดงเปอร์เซ็นต์ประหยัด */}
                            <Gift className="h-4 w-4 mr-1" /> {/* ไอคอนของขวัญ */}
                            ประหยัด {Math.round(((userMembership.pay_per_session_price * 12) - userMembership.annual_price) / (userMembership.pay_per_session_price * 12) * 100)}% {/* คำนวณและแสดงเปอร์เซ็นต์ประหยัด */}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3"> {/* รายการสิทธิประโยชน์ */}
                        <div className="flex items-center space-x-3"> {/* รายการที่ 1 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600">ใช้งานได้ไม่จำกัด</span> {/* ข้อความสิทธิประโยชน์ */}
                        </div>
                        <div className="flex items-center space-x-3"> {/* รายการที่ 2 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600">ประหยัดกว่าชำระรายครั้ง</span> {/* ข้อความสิทธิประโยชน์ */}
                        </div>
                        <div className="flex items-center space-x-3"> {/* รายการที่ 3 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600 font-medium">จองสระว่ายน้ำฟรี 1 ปีเต็ม (365 วัน)</span> {/* ข้อความสิทธิประโยชน์พิเศษ */}
                        </div>
                        <div className="flex items-center space-x-3"> {/* รายการที่ 4 */}
                          <Check className="h-5 w-5 text-green-500" /> {/* ไอคอนเครื่องหมายถูก */}
                          <span className="text-sm text-gray-600">สิทธิพิเศษสำหรับสมาชิก</span> {/* ข้อความสิทธิประโยชน์ */}
                        </div>
                      </div>

                      {/* แสดงข้อความแจ้งเตือนเมื่อมีสมาชิกรายปีที่ยังไม่หมดอายุ */}
                      {isAnnualMembershipActive() && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                              คุณมีสมาชิกรายปีที่ยังไม่หมดอายุ หมดอายุวันที่{" "}
                              <span className="font-semibold">
                                {(() => {
                                  if (!userMembership.expires_at || userMembership.expires_at === 'null' || userMembership.expires_at.trim() === '') {
                                    return 'ไม่ระบุวันที่'
                                  }
                                  try {
                                    const dateStr = userMembership.expires_at.toString()
                                    let date
                                    
                                    if (dateStr.includes('T')) {
                                      date = new Date(dateStr)
                                    } else if (dateStr.includes('-')) {
                                      const [year, month, day] = dateStr.split('-')
                                      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    } else {
                                      date = new Date(dateStr)
                                    }
                                    
                                    if (isNaN(date.getTime())) {
                                      return 'รูปแบบวันที่ไม่ถูกต้อง'
                                    }
                                    
                                    return date.toLocaleDateString("th-TH")
                                  } catch (error) {
                                    return 'รูปแบบวันที่ไม่ถูกต้อง' 
                                  }
                                 })() 
                                }</span>
                            </p>
                          </div>
                        </div>
                      )}

                      <Button // ปุ่มสำหรับสมัคร/ต่ออายุสมาชิกรายปี
                        className={`w-full font-medium py-3 rounded-lg transition-all duration-300 ${ // คลาส CSS สำหรับปุ่ม
                          isAnnualMembershipActive() // ตรวจสอบว่าสมาชิกรายปียังใช้งานได้อยู่หรือไม่
                            ? "bg-gray-400 cursor-not-allowed text-white" // สไตล์เมื่อปุ่มถูกปิดใช้งาน
                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transform hover:scale-105 shadow-lg" // สไตล์เมื่อปุ่มใช้งานได้
                        }`}
                        onClick={() => { // ฟังก์ชันเมื่อคลิกปุ่ม
                          const categoryId = userCategories.find(cat => cat.name === userMembership.user_category)?.id; // หา ID หมวดหมู่ผู้ใช้
                          if (categoryId) { // ถ้าพบ ID หมวดหมู่
                            handleOpenPaymentModal('annual', userMembership.annual_price, categoryId); // เปิด modal ชำระเงิน
                          } else { // ถ้าไม่พบ ID หมวดหมู่
                            toast({ // แสดงข้อความแจ้งเตือน
                              title: "ไม่พบหมวดหมู่ผู้ใช้", // หัวข้อข้อความ
                              description: "ไม่สามารถดำเนินการชำระเงินได้เนื่องจากไม่พบ ID หมวดหมู่", // รายละเอียดข้อความ
                              variant: "destructive", // ประเภทข้อความ (แสดงเป็นสีแดง)
                            });
                          }
                        }}
                        disabled={purchasing === `annual-${userMembership.user_category}` || isAnnualMembershipActive()} // ปิดใช้งานปุ่มเมื่อกำลังซื้อหรือสมาชิกยังใช้งานได้
                      >
                        {purchasing === `annual-${userMembership.user_category}` ? ( // ถ้ากำลังซื้อสมาชิกรายปี
                          <div className="flex items-center space-x-2"> {/* คอนเทนเนอร์สำหรับแสดงสถานะกำลังโหลด */}
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> {/* ไอคอนหมุนแสดงการโหลด */}
                            <span>กำลังดำเนินการ...</span> {/* ข้อความแสดงสถานะ */}
                          </div>
                        ) : isAnnualMembershipActive() ? ( // ถ้าสมาชิกรายปียังใช้งานได้
                          <div className="flex items-center space-x-2"> {/* คอนเทนเนอร์สำหรับแสดงสถานะสมาชิกยังใช้งานได้ */}
                            <Calendar className="h-4 w-4" /> {/* ไอคอนปฏิทิน */}
                            <span>สมาชิกรายปียังไม่หมดอายุ</span> {/* ข้อความแสดงสถานะ */}
                          </div>
                        ) : ( // ถ้าสามารถสมัครหรือต่ออายุได้
                          <div className="flex items-center space-x-2"> {/* คอนเทนเนอร์สำหรับปุ่มสมัคร/ต่ออายุ */}
                            <Sparkles className="h-4 w-4" /> {/* ไอคอนประกายดาว */}
                            <span>สมัคร/ต่ออายุรายปี</span> {/* ข้อความปุ่ม */}
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : ( // ถ้าไม่พบข้อมูลสมาชิกภาพ
                <Card className="col-span-full text-center py-12 border-2 border-dashed border-gray-300"> {/* การ์ดแสดงข้อความเมื่อไม่พบข้อมูล */}
                  <CardContent className="space-y-4"> {/* เนื้อหาการ์ดพร้อมระยะห่าง */}
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4"> {/* คอนเทนเนอร์ไอคอน */}
                      <Star className="h-8 w-8 text-gray-400" /> {/* ไอคอนดาว */}
                    </div>
                    <p className="text-lg text-gray-600">ไม่พบข้อมูลแพ็คเกจราคาสำหรับประเภทผู้ใช้ของคุณ</p> {/* ข้อความหลัก */}
                    <p className="text-sm text-gray-500">กรุณาติดต่อเจ้าหน้าที่เพื่อขอข้อมูลเพิ่มเติม</p> {/* ข้อความรอง */}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */} {/* Modal สำหรับการชำระเงิน */}
        <Dialog open={!!paymentModal} onOpenChange={open => { if (!open) setPaymentModal(null) }}> {/* Dialog component ที่เปิดเมื่อมี paymentModal */}
          <DialogContent className="max-w-md"> {/* เนื้อหา Dialog ขนาดกลาง */}
            <DialogHeader> {/* ส่วนหัวของ Dialog */}
              <div className="text-center space-y-2"> {/* คอนเทนเนอร์จัดกึ่งกลางพร้อมระยะห่าง */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-2"> {/* คอนเทนเนอร์ไอคอนพร้อมพื้นหลังไล่สี */}
                  <CreditCard className="h-6 w-6 text-white" /> {/* ไอคอนบัตรเครดิต */}
                </div>
                <DialogTitle className="text-xl font-bold">เลือกวิธีชำระเงิน</DialogTitle> {/* หัวข้อ Dialog */}
                <DialogDescription className="text-gray-600"> {/* คำอธิบาย Dialog */}
                  ชำระเงินสำหรับ {paymentModal?.type === 'annual' ? 'สมาชิกรายปี' : 'บริการรายครั้ง'} จำนวน {/* ข้อความแสดงประเภทการชำระเงิน */}
                  <span className="font-bold text-blue-600"> ฿{paymentModal?.price.toLocaleString()}</span> {/* แสดงจำนวนเงิน */}
                </DialogDescription>
              </div>
            </DialogHeader>
            
            {paymentStep === "choose" && ( // ถ้าขั้นตอนคือการเลือกวิธีชำระเงิน
              <div className="space-y-6"> {/* คอนเทนเนอร์หลักพร้อมระยะห่าง */}
                <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)} className="space-y-3"> {/* กลุ่ม Radio Button สำหรับเลือกวิธีชำระเงิน */}
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"> {/* ตัวเลือกเงินสด */}
                    <RadioGroupItem value="cash" id="cash" /> {/* Radio Button สำหรับเงินสด */}
                    <Label htmlFor="cash" className="flex-1 cursor-pointer"> {/* Label สำหรับตัวเลือกเงินสด */}
                      <div className="flex items-center space-x-3"> {/* คอนเทนเนอร์สำหรับเนื้อหาตัวเลือก */}
                        <div className="p-2 bg-green-100 rounded-full"> {/* คอนเทนเนอร์ไอคอนพร้อมพื้นหลังสีเขียว */}
                          <CreditCard className="h-4 w-4 text-green-600" /> {/* ไอคอนบัตรเครดิต */}
                        </div>
                        <div> {/* คอนเทนเนอร์ข้อความ */}
                          <p className="font-medium">เงินสด</p> {/* ชื่อวิธีชำระเงิน */}
                          <p className="text-sm text-gray-600">ชำระที่เคาน์เตอร์</p> {/* คำอธิบายวิธีชำระเงิน */}
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"> {/* ตัวเลือกโอนธนาคาร */}
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" /> {/* Radio Button สำหรับโอนธนาคาร */}
                    <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer"> {/* Label สำหรับตัวเลือกโอนธนาคาร */}
                      <div className="flex items-center space-x-3"> {/* คอนเทนเนอร์สำหรับเนื้อหาตัวเลือก */}
                        <div className="p-2 bg-blue-100 rounded-full"> {/* คอนเทนเนอร์ไอคอนพร้อมพื้นหลังสีน้ำเงิน */}
                          <CreditCard className="h-4 w-4 text-blue-600" /> {/* ไอคอนบัตรเครดิต */}
                        </div>
                        <div> {/* คอนเทนเนอร์ข้อความ */}
                          <p className="font-medium">โอนผ่านธนาคาร</p> {/* ชื่อวิธีชำระเงิน */}
                          <p className="text-sm text-gray-600">อัปโหลดสลิปหลังโอน</p> {/* คำอธิบายวิธีชำระเงิน */}
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                <Button // ปุ่มดำเนินการต่อ 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300" // คลาส CSS สำหรับปุ่ม
                  onClick={handleCreatePayment} //ฟังก์ชันเมื่อคลิกปุ่ม 
                  disabled={!paymentMethod || purchasing === paymentModal?.type} //ปิดใช้งานปุ่มเมื่อไม่ได้เลือกวิธีชำระเงินหรือกำลังซื้อ
                >
                  {purchasing === paymentModal?.type ? ( // ถ้ากำลังซื้อ
                    <div className="flex items-center space-x-2"> {/* คอนเทนเนอร์สำหรับแสดงสถานะกำลังโหลด */}
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> {/* ไอคอนหมุนแสดงการโหลด */}
                      <span>กำลังดำเนินการ...</span> {/* ข้อความแสดงสถานะ */}
                    </div>
                  ) : ( // ถ้าไม่ได้กำลังซื้อ
                    "ดำเนินการต่อ" // ข้อความปุ่ม
                  )}
                </Button>
              </div>
            )}
            
            {paymentStep === "upload" && ( // ถ้าขั้นตอนคือการอัปโหลดสลิป
              <div className="space-y-6"> {/* คอนเทนเนอร์หลักพร้อมระยะห่าง */}
                <div className="text-center space-y-3 p-4 bg-blue-50 rounded-lg"> {/* กล่องข้อมูลบัญชีธนาคาร */}
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full"> {/* คอนเทนเนอร์ไอคอน */}
                    <CreditCard className="h-6 w-6 text-blue-600" /> {/* ไอคอนบัตรเครดิต */}
                  </div>
                  <p className="font-medium">โปรดโอนเงินเข้าบัญชี</p> {/* ข้อความแนะนำ */}
                  <p className="text-2xl font-bold text-blue-600">{bankAccountNumber}</p> {/* เลขบัญชีธนาคาร */}
                  <p className="text-sm text-gray-600">จากนั้นอัปโหลดหลักฐานการโอน (สลิป)</p> {/* คำแนะนำเพิ่มเติม */}
                </div>
                <div className="space-y-3"> {/* คอนเทนเนอร์สำหรับการอัปโหลดไฟล์ */}
                  <Label htmlFor="slip-upload" className="text-sm font-medium">อัปโหลดสลิปการโอน</Label> {/* ป้ายกำกับสำหรับ input file */}
                  <Input ///* Input สำหรับเลือกไฟล์ 
                    id="slip-upload" // ID สำหรับ input
                    type="file" // ประเภท input เป็นไฟล์
                    accept="image/*" // รับเฉพาะไฟล์รูปภาพ
                    ref={fileInputRef} // ref สำหรับอ้างอิง element
                    onChange={e => setSlipFile(e.target.files?.[0] || null)} // ฟังก์ชันเมื่อเลือกไฟล์
                    className="cursor-pointer" // คลาส CSS
                  />
                </div>
                <Button // ปุ่มอัปโหลดสลิป 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300" //คลาส CSS สำหรับปุ่ม 
                  onClick={handleUploadSlip} // ฟังก์ชันเมื่อคลิกปุ่ม 
                  disabled={!slipFile || uploading} //* ปิดใช้งานปุ่มเมื่อไม่มีไฟล์หรือกำลังอัปโหลด 
                >
                  {uploading ? ( // ถ้ากำลังอัปโหลด
                    <div className="flex items-center space-x-2"> {/* คอนเทนเนอร์สำหรับแสดงสถานะกำลังโหลด */}
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> {/* ไอคอนหมุนแสดงการโหลด */}
                      <span>กำลังอัปโหลด...</span> {/* ข้อความแสดงสถานะ */}
                    </div>
                  ) : ( // ถ้าไม่ได้กำลังอัปโหลด
                    "อัปโหลดสลิป" // ข้อความปุ่ม
                  )}
                </Button>
              </div>
            )}
            
            {paymentStep === "pending" && ( // ถ้าขั้นตอนคือรอการยืนยัน
              <div className="space-y-6 text-center"> {/* คอนเทนเนอร์หลักจัดกึ่งกลางพร้อมระยะห่าง */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"> {/* คอนเทนเนอร์ไอคอนสำเร็จ */}
                  <Check className="h-8 w-8 text-green-600" /> {/* ไอคอนเครื่องหมายถูก */}
                </div>
                {paymentMethod === "cash" ? ( // ถ้าเลือกชำระด้วยเงินสด
                  <div className="space-y-2"> {/* คอนเทนเนอร์ข้อความสำหรับเงินสด */}
                    <h3 className="text-lg font-semibold text-gray-900">รอการยืนยัน</h3> {/* หัวข้อสถานะ */}
                    <p className="text-gray-600">โปรดติดต่อเคาน์เตอร์เพื่อยืนยันการชำระเงิน</p> {/* คำแนะนำสำหรับเงินสด */}
                  </div>
                ) : ( // ถ้าเลือกโอนธนาคาร
                  <div className="space-y-2"> {/* คอนเทนเนอร์ข้อความสำหรับโอนธนาคาร */}
                    <h3 className="text-lg font-semibold text-gray-900">อัปโหลดสำเร็จ</h3> {/* หัวข้อสถานะ */}
                    <p className="text-gray-600">กรุณารอเจ้าหน้าที่ตรวจสอบการชำระเงิน</p> {/* คำแนะนำสำหรับโอนธนาคาร */}
                  </div>
                )}
                <Button //* ปุ่มปิด Modal 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300" //* คลาส CSS สำหรับปุ่ม
                  onClick={() => { setPaymentModal(null); window.location.reload() }} //ฟังก์ชันปิด Modal และรีเฟรชหน้า 
                >
                  ปิด {/* ข้อความปุ่ม */}
                </Button>
              </div>
            )}
          </DialogContent> {/* ปิดเนื้อหา Dialog */}
        </Dialog> {/* ปิด Dialog */}
      </div> {/* ปิดคอนเทนเนอร์หลัก */}
    </UserLayout> 
  ) // ปิด return statement
} // ปิดฟังก์ชัน MembershipPage
