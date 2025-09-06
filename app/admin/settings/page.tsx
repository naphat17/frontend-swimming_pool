"use client" // ระบุว่าเป็น Client Component ใน Next.js

import type React from "react" // นำเข้า type React สำหรับ TypeScript
import { useEffect, useState } from "react" // นำเข้า hooks useEffect และ useState จาก React
import { useAuth } from "@/components/auth-provider" // นำเข้า custom hook สำหรับการจัดการ authentication
import { useRouter } from "next/navigation" // นำเข้า useRouter สำหรับการนำทางใน Next.js
import AdminLayout from "@/components/admin-layout" // นำเข้า layout component สำหรับหน้า admin
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // นำเข้า Card components จาก UI library
import { Button } from "@/components/ui/button" // นำเข้า Button component
import { Input } from "@/components/ui/input" // นำเข้า Input component
import { Label } from "@/components/ui/label" // นำเข้า Label component
import { useToast } from "@/hooks/use-toast" // นำเข้า custom hook สำหรับแสดง toast notifications
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // นำเข้า Tabs components
import {
  Dialog, // นำเข้า Dialog component สำหรับ modal
  DialogContent, // เนื้อหาของ Dialog
  DialogDescription, // คำอธิบายใน Dialog
  DialogHeader, // ส่วนหัวของ Dialog
  DialogTitle, // ชื่อเรื่องของ Dialog
  DialogTrigger, // ปุ่มที่ใช้เปิด Dialog
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // นำเข้า Table components
import { Plus, Edit, Trash2, Settings, CreditCard, Shield, Users } from "lucide-react" // นำเข้า icons จาก lucide-react

interface Setting { // กำหนด interface สำหรับข้อมูลการตั้งค่า
  setting_key: string // คีย์ของการตั้งค่า
  setting_value: string // ค่าของการตั้งค่า
  description?: string // คำอธิบาย (optional)
}

interface MembershipType { // กำหนด interface สำหรับข้อมูลประเภทสมาชิก
  id: number // ID ของประเภทสมาชิก
  name: string // ชื่อประเภทสมาชิก
  description: string // คำอธิบายประเภทสมาชิก
  price: number // ราคาของประเภทสมาชิก
  duration_days: number // ระยะเวลาของสมาชิกเป็นวัน
}

export default function AdminSettingsPage() { // ฟังก์ชัน component หลักของหน้าการตั้งค่า admin
  const { user, loading: authLoading } = useAuth() // ดึงข้อมูล user และสถานะ loading จาก auth context
  const router = useRouter() // สร้าง router instance สำหรับการนำทาง
  const [settings, setSettings] = useState<Setting[]>([]) // state สำหรับเก็บข้อมูลการตั้งค่า
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]) // state สำหรับเก็บข้อมูลประเภทสมาชิก
  const [loading, setLoading] = useState(true) // state สำหรับสถานะการโหลดข้อมูล
  const [dialogOpen, setDialogOpen] = useState(false) // state สำหรับควบคุมการเปิด/ปิด dialog
  const [editingMembership, setEditingMembership] = useState<MembershipType | null>(null) // state สำหรับเก็บข้อมูลสมาชิกที่กำลังแก้ไข
  const [newMembershipData, setNewMembershipData] = useState({ // state สำหรับข้อมูลสมาชิกใหม่
    name: "", // ชื่อประเภทสมาชิกใหม่
    description: "", // คำอธิบายประเภทสมาชิกใหม่
    price: 0, // ราคาประเภทสมาชิกใหม่
    duration_days: 30, // ระยะเวลาเริ่มต้น 30 วัน
  })
  const [systemSettings, setSystemSettings] = useState({ // state สำหรับการตั้งค่าระบบ
    pool_name: "", // ชื่อสระว่ายน้ำ
    max_reservation_days: "7", // จำนวนวันสูงสุดที่จองล่วงหน้าได้
    reservation_cancel_hours: "2", // จำนวนชั่วโมงก่อนที่จะยกเลิกการจองได้
    contact_phone: "", // เบอร์โทรติดต่อ
    contact_email: "", // อีเมลติดต่อ
    bank_account_number: "", // เลขบัญชีธนาคาร
    bank_name: "", // ชื่อธนาคาร
    account_name: "", // ชื่อบัญชี
  })
  const { toast } = useToast() // ดึงฟังก์ชัน toast สำหรับแสดงการแจ้งเตือน

  useEffect(() => { // useEffect สำหรับตรวจสอบสิทธิ์และโหลดข้อมูลเมื่อ component mount
    if (!authLoading && (!user || user.role !== "admin")) { // ตรวจสอบว่าไม่ใช่ admin
      toast({ // แสดง toast แจ้งเตือน
        title: "ไม่มีสิทธิ์เข้าถึง", // ชื่อเรื่องของการแจ้งเตือน
        description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ", // รายละเอียดการแจ้งเตือน
        variant: "destructive", // ประเภทของ toast (สีแดง)
      })
      router.push("/login") // นำทางไปหน้า login
      return // หยุดการทำงานของฟังก์ชัน
    }

    if (user && user.role === "admin") { // ถ้าเป็น admin
      fetchSettings() // เรียกฟังก์ชันดึงข้อมูลการตั้งค่า
      fetchMembershipTypes() // เรียกฟังก์ชันดึงข้อมูลประเภทสมาชิก
    }
  }, [user, authLoading, router, toast]) // dependencies ของ useEffect

  // Show loading while checking authentication
  if (authLoading) { // ถ้ากำลังตรวจสอบ authentication
    return ( // แสดง loading screen
      <AdminLayout> {/* ใช้ AdminLayout เป็น wrapper */}
        <div className="flex items-center justify-center min-h-screen"> {/* container สำหรับ loading */}
          <div className="text-center"> {/* จัดข้อความให้อยู่กลาง */}
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div> {/* spinner animation */}
            <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p> {/* ข้อความแสดงสถานะ */}
          </div>
        </div>
      </AdminLayout>
    )
  }

  const fetchSettings = async () => { // ฟังก์ชันสำหรับดึงข้อมูลการตั้งค่าจาก API
    try { // เริ่ม try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/settings", { // เรียก API
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })

      if (response.ok) { // ถ้า response สำเร็จ
        const data = await response.json() // แปลง response เป็น JSON
        setSettings(data.settings || []) // อัปเดต settings state

        const settingsObj = data.settings.reduce((acc: any, setting: Setting) => { // แปลง array เป็น object
          acc[setting.setting_key] = setting.setting_value // กำหนดค่าตาม key
          return acc // return accumulator
        }, {})

        setSystemSettings({ // อัปเดต systemSettings state
          pool_name: settingsObj.pool_name || "สระว่ายน้ำโรจนากร", // ชื่อสระ หรือค่าเริ่มต้น
          max_reservation_days: settingsObj.max_reservation_days || "7", // วันจองสูงสุด หรือค่าเริ่มต้น
          reservation_cancel_hours: settingsObj.reservation_cancel_hours || "2", // ชั่วโมงยกเลิก หรือค่าเริ่มต้น
          contact_phone: settingsObj.contact_phone || "", // เบอร์โทร หรือค่าว่าง
          contact_email: settingsObj.contact_email || "", // อีเมล หรือค่าว่าง
          bank_account_number: settingsObj.bank_account_number || "", // เลขบัญชี หรือค่าว่าง
          bank_name: settingsObj.bank_name || "", // ชื่อธนาคาร หรือค่าว่าง
          account_name: settingsObj.account_name || "", // ชื่อบัญชี หรือค่าว่าง
        })
      } else if (response.status === 403) { // ถ้าไม่มีสิทธิ์
        toast({ // แสดง toast แจ้งเตือน
          title: "ไม่มีสิทธิ์เข้าถึง", // ชื่อเรื่อง
          description: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
        router.push("/login") // นำทางไปหน้า login
      } else { // ถ้าเกิดข้อผิดพลาดอื่นๆ
        toast({ // แสดง toast แจ้งเตือน
          title: "ข้อผิดพลาด", // ชื่อเรื่อง
          description: "ไม่สามารถดึงข้อมูลการตั้งค่าได้", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
      }
    } catch (error) { // จับ error
      console.error("Error fetching settings:", error) // log error ไปยัง console
    } finally { // block ที่จะทำงานเสมอ
      setLoading(false) // ตั้งค่า loading เป็น false
    }
  }

  const fetchMembershipTypes = async () => { // ฟังก์ชันสำหรับดึงข้อมูลประเภทสมาชิกจาก API
    try { // เริ่ม try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/membership-types", { // เรียก API
        headers: { Authorization: `Bearer ${token}` }, // ส่ง token ใน header
      })

      if (response.ok) { // ถ้า response สำเร็จ
        const data = await response.json() // แปลง response เป็น JSON
        setMembershipTypes(data.membership_types || []) // อัปเดต membershipTypes state
      } else if (response.status === 403) { // ถ้าไม่มีสิทธิ์
        toast({ // แสดง toast แจ้งเตือน
          title: "ไม่มีสิทธิ์เข้าถึง", // ชื่อเรื่อง
          description: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
        router.push("/login") // นำทางไปหน้า login
      } else { // ถ้าเกิดข้อผิดพลาดอื่นๆ
        toast({ // แสดง toast แจ้งเตือน
          title: "ข้อผิดพลาด", // ชื่อเรื่อง
          description: "ไม่สามารถดึงข้อมูลประเภทสมาชิกได้", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
      }
    } catch (error) { // จับ error
      console.error("Error fetching membership types:", error) // log error ไปยัง console
    }
  }

  const handleUpdateSettings = async (e: React.FormEvent) => { // ฟังก์ชันสำหรับอัปเดตการตั้งค่า
    e.preventDefault() // ป้องกันการ submit form แบบปกติ

    try { // เริ่ม try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const settingsArray = Object.entries(systemSettings).map(([key, value]) => ({ // แปลง object เป็น array
        setting_key: key, // กำหนด key
        setting_value: value, // กำหนด value
      }))

      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/settings", { // เรียก API
        method: "PUT", // ใช้ method PUT
        headers: { // กำหนด headers
          "Content-Type": "application/json", // ประเภทข้อมูล
          Authorization: `Bearer ${token}`, // token สำหรับ authorization
        },
        body: JSON.stringify({ settings: settingsArray }), // แปลงข้อมูลเป็น JSON string
      })

      if (response.ok) { // ถ้า response สำเร็จ
        toast({ // แสดง toast แจ้งเตือน
          title: "อัปเดตการตั้งค่าสำเร็จ", // ชื่อเรื่อง
          description: "การตั้งค่าระบบได้รับการอัปเดตแล้ว", // รายละเอียด
        })
        fetchSettings() // เรียกฟังก์ชันดึงข้อมูลใหม่
      } else { // ถ้าเกิดข้อผิดพลาด
        toast({ // แสดง toast แจ้งเตือน
          title: "อัปเดตไม่สำเร็จ", // ชื่อเรื่อง
          description: "ไม่สามารถอัปเดตการตั้งค่าได้", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
      }
    } catch (error) { // จับ error
      toast({ // แสดง toast แจ้งเตือน
        title: "เกิดข้อผิดพลาด", // ชื่อเรื่อง
        description: "ไม่สามารถอัปเดตการตั้งค่าได้", // รายละเอียด
        variant: "destructive", // ประเภท toast
      })
    }
  }

  const handleCreateMembershipType = async (e: React.FormEvent) => { // ฟังก์ชันสำหรับสร้างประเภทสมาชิกใหม่
    e.preventDefault() // ป้องกันการ submit form แบบปกติ

    try { // เริ่ม try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch("https://backend-l7q9.onrender.com/api/admin/membership-types", { // เรียก API
        method: "POST", // ใช้ method POST
        headers: { // กำหนด headers
          "Content-Type": "application/json", // ประเภทข้อมูล
          Authorization: `Bearer ${token}`, // token สำหรับ authorization
        },
        body: JSON.stringify(newMembershipData), // แปลงข้อมูลเป็น JSON string
      })

      if (response.ok) { // ถ้า response สำเร็จ
        toast({ // แสดง toast แจ้งเตือน
          title: "เพิ่มประเภทสมาชิกสำเร็จ", // ชื่อเรื่อง
          description: "ประเภทสมาชิกใหม่ได้รับการเพิ่มแล้ว", // รายละเอียด
        })
        setDialogOpen(false) // ปิด dialog
        setNewMembershipData({ // รีเซ็ตข้อมูลฟอร์ม
          name: "", // ชื่อเป็นค่าว่าง
          description: "", // คำอธิบายเป็นค่าว่าง
          price: 0, // ราคาเป็น 0
          duration_days: 30, // ระยะเวลาเป็น 30 วัน
        })
        fetchMembershipTypes() // เรียกฟังก์ชันดึงข้อมูลใหม่
      } else { // ถ้าเกิดข้อผิดพลาด
        const errorData = await response.json() // ดึงข้อมูล error
        toast({ // แสดง toast แจ้งเตือน
          title: "เพิ่มไม่สำเร็จ", // ชื่อเรื่อง
          description: errorData.message || "เกิดข้อผิดพลาด", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
      }
    } catch (error) { // จับ error
      toast({ // แสดง toast แจ้งเตือน
        title: "เกิดข้อผิดพลาด", // ชื่อเรื่อง
        description: "ไม่สามารถเพิ่มประเภทสมาชิกได้", // รายละเอียด
        variant: "destructive", // ประเภท toast
      })
    }
  }

  const handleUpdateMembershipType = async (e: React.FormEvent) => { // ฟังก์ชันสำหรับอัปเดตประเภทสมาชิก
    e.preventDefault() // ป้องกันการ submit form แบบปกติ
    if (!editingMembership) return // ถ้าไม่มีข้อมูลที่กำลังแก้ไข ให้หยุด

    try { // เริ่ม try-catch block
      const token = localStorage.getItem("token") // ดึง token จาก localStorage
      const response = await fetch(`https://backend-l7q9.onrender.com/api/admin/membership-types/${editingMembership.id}`, { // เรียก API
        method: "PUT", // ใช้ method PUT
        headers: { // กำหนด headers
          "Content-Type": "application/json", // ประเภทข้อมูล
          Authorization: `Bearer ${token}`, // token สำหรับ authorization
        },
        body: JSON.stringify({ // แปลงข้อมูลเป็น JSON string
          name: editingMembership.name, // ชื่อประเภทสมาชิก
          description: editingMembership.description, // คำอธิบาย
          price: editingMembership.price, // ราคา
          duration_days: editingMembership.duration_days, // ระยะเวลา
        }),
      })

      if (response.ok) { // ถ้า response สำเร็จ
        toast({ // แสดง toast แจ้งเตือน
          title: "อัปเดตประเภทสมาชิกสำเร็จ", // ชื่อเรื่อง
          description: "ข้อมูลประเภทสมาชิกได้รับการอัปเดตแล้ว", // รายละเอียด
        })
        setEditingMembership(null) // รีเซ็ตข้อมูลที่กำลังแก้ไข
        fetchMembershipTypes() // เรียกฟังก์ชันดึงข้อมูลใหม่
      } else { // ถ้าเกิดข้อผิดพลาด
        toast({ // แสดง toast แจ้งเตือน
          title: "อัปเดตไม่สำเร็จ", // ชื่อเรื่อง
          description: "ไม่สามารถอัปเดตข้อมูลได้", // รายละเอียด
          variant: "destructive", // ประเภท toast
        })
      }
    } catch (error) { // จับ error
      toast({ // แสดง toast แจ้งเตือน
        title: "เกิดข้อผิดพลาด", // ชื่อเรื่อง
        description: "ไม่สามารถอัปเดตข้อมูลได้", // รายละเอียด
        variant: "destructive", // ประเภท toast
      })
    }
  }

  if (loading) { // ถ้ากำลังโหลดข้อมูล
    return ( // แสดง loading screen
      <AdminLayout> {/* ใช้ AdminLayout เป็น wrapper */}
        <div className="flex items-center justify-center h-64"> {/* container สำหรับ loading */}
          <div className="relative"> {/* container สำหรับ spinner */}
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div> {/* spinner พื้นหลัง */}
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div> {/* spinner หลัก */}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (user?.role !== "admin") { // ถ้าไม่ใช่ admin
    return null // ไม่แสดงอะไร
  }

  return ( // return JSX ของ component
    <AdminLayout> {/* ใช้ AdminLayout เป็น wrapper */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* container หลักพร้อม background gradient */}
        <div className="space-y-8 p-6 max-w-7xl mx-auto"> {/* container สำหรับเนื้อหา */}
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8"> {/* ส่วนหัวของหน้า */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg"> {/* icon container */}
              <Settings className="h-8 w-8 text-white" /> {/* icon การตั้งค่า */}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {/* หัวข้อหลัก */}
              การตั้งค่าระบบ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto"> {/* คำอธิบายหน้า */}
              จัดการการตั้งค่าระบบ ประเภทสมาชิก และช่องทางการชำระเงิน
            </p>
          </div>

          <Tabs defaultValue="general" className="w-full"> {/* Tabs component */}
            <TabsList className="grid w-full grid-cols-3 bg-gray-200/80 backdrop-blur-sm p-2 rounded-xl"> {/* รายการ tabs */}
              <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"> {/* tab ทั่วไป */}
                <Shield className="h-5 w-5" /> {/* icon */}
                ทั่วไป
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"> {/* tab ประเภทสมาชิก */}
                <Users className="h-5 w-5" /> {/* icon */}
                ประเภทสมาชิก
              </TabsTrigger>
              <TabsTrigger value="payment-channels" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg"> {/* tab ช่องทางชำระเงิน */}
                <CreditCard className="h-5 w-5" /> {/* icon */}
                ช่องทางชำระเงิน
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6"> {/* เนื้อหา tab ทั่วไป */}
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300"> {/* Card component */}
                <CardHeader> {/* ส่วนหัวของ Card */}
                  <CardTitle className="text-xl font-bold text-gray-900">การตั้งค่าทั่วไป</CardTitle> {/* ชื่อเรื่อง */}
                  <CardDescription>จัดการการตั้งค่าพื้นฐานของระบบ</CardDescription> {/* คำอธิบาย */}
                </CardHeader>
                <CardContent> {/* เนื้อหาของ Card */}
                  <form onSubmit={handleUpdateSettings} className="space-y-6"> {/* ฟอร์มการตั้งค่า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* grid layout */}
                      <div className="space-y-2"> {/* input group */}
                        <Label htmlFor="pool_name" className="font-medium">ชื่อสระว่ายน้ำ</Label> {/* label */}
                        <Input // input field
                          id="pool_name" // id ของ input
                          value={systemSettings.pool_name} // ค่าจาก state
                          onChange={(e) => setSystemSettings({ ...systemSettings, pool_name: e.target.value })} // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                          placeholder="ชื่อสระว่ายน้ำ" // placeholder text
                        />
                      </div>
                      <div className="space-y-2"> {/* input group */}
                        <Label htmlFor="max_reservation_days" className="font-medium">จองล่วงหน้าได้สูงสุด (วัน)</Label> {/* label */}
                        <Input // input field
                          id="max_reservation_days" // id ของ input
                          type="number" // ประเภท input เป็นตัวเลข
                          value={systemSettings.max_reservation_days} // ค่าจาก state
                          onChange={(e) => setSystemSettings({ ...systemSettings, max_reservation_days: e.target.value })} // อัปเดต state
                          min="1" // ค่าต่ำสุด
                          max="30" // ค่าสูงสุด
                        />
                      </div>
                      <div className="space-y-2"> {/* input group */}
                        <Label htmlFor="reservation_cancel_hours" className="font-medium">ยกเลิกการจองก่อนเวลา (ชั่วโมง)</Label> {/* label */}
                        <Input // input field
                          id="reservation_cancel_hours" // id ของ input
                          type="number" // ประเภท input เป็นตัวเลข
                          value={systemSettings.reservation_cancel_hours} // ค่าจาก state
                          onChange={(e) => // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                            setSystemSettings({ ...systemSettings, reservation_cancel_hours: e.target.value })
                          }
                          min="1" // ค่าต่ำสุด
                          max="48" // ค่าสูงสุด
                        />
                      </div>
                      <div className="space-y-2"> {/* input group */}
                        <Label htmlFor="contact_phone" className="font-medium">เบอร์โทรติดต่อ</Label> {/* label */}
                        <Input // input field
                          id="contact_phone" // id ของ input
                          value={systemSettings.contact_phone} // ค่าจาก state
                          onChange={(e) => setSystemSettings({ ...systemSettings, contact_phone: e.target.value })} // อัปเดต state
                          placeholder="02-xxx-xxxx" // placeholder text
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2"> {/* input group ที่ครอบคลุม 2 columns */}
                        <Label htmlFor="contact_email" className="font-medium">อีเมลติดต่อ</Label> {/* label */}
                        <Input // input field
                          id="contact_email" // id ของ input
                          type="email" // ประเภท input เป็นอีเมล
                          value={systemSettings.contact_email} // ค่าจาก state
                          onChange={(e) => setSystemSettings({ ...systemSettings, contact_email: e.target.value })} // อัปเดต state
                          placeholder="contact@example.com" // placeholder text
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4"> {/* container สำหรับปุ่ม */}
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">บันทึกการตั้งค่า</Button> {/* ปุ่มบันทึก */}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment-channels" className="mt-6"> {/* เนื้อหา tab ช่องทางชำระเงิน */}
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300"> {/* Card component */}
                <CardHeader> {/* ส่วนหัวของ Card */}
                  <CardTitle className="text-xl font-bold text-gray-900">ช่องทางการชำระเงิน</CardTitle> {/* ชื่อเรื่อง */}
                  <CardDescription>จัดการข้อมูลช่องทางการชำระเงินสำหรับการโอน</CardDescription> {/* คำอธิบาย */}
                </CardHeader>
                <CardContent> {/* เนื้อหาของ Card */}
                  <form onSubmit={handleUpdateSettings} className="space-y-6"> {/* ฟอร์มการตั้งค่า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* grid layout */}
                      <div className="space-y-2"> {/* input group */}
                        <Label htmlFor="bank_name" className="font-medium">ชื่อธนาคาร</Label> {/* label */}
                        <Input // input field
                          id="bank_name" // id ของ input
                          value={systemSettings.bank_name} // ค่าจาก state
                          onChange={(e) => setSystemSettings({ ...systemSettings, bank_name: e.target.value })} // อัปเดต state
                          placeholder="เช่น ธนาคารกรุงเทพ, ธนาคารกสิกรไทย" // placeholder text
                        />
                      </div>
                      <div className="space-y-2"> {/* input group */}
                        <Label htmlFor="account_name" className="font-medium">ชื่อบัญชี</Label> {/* label */}
                        <Input // input field
                          id="account_name" // id ของ input
                          value={systemSettings.account_name} // ค่าจาก state
                          onChange={(e) => setSystemSettings({ ...systemSettings, account_name: e.target.value })} // อัปเดต state
                          placeholder="ชื่อเจ้าของบัญชี" // placeholder text
                        />
                      </div>
                    </div>
                    <div className="space-y-2"> {/* input group */}
                      <Label htmlFor="bank_account_number" className="font-medium">เลขบัญชีธนาคาร</Label> {/* label */}
                      <Input // input field
                        id="bank_account_number" // id ของ input
                        value={systemSettings.bank_account_number} // ค่าจาก state
                        onChange={(e) => setSystemSettings({ ...systemSettings, bank_account_number: e.target.value })} // อัปเดต state
                        placeholder="เลขบัญชีธนาคารสำหรับโอนเงิน" // placeholder text
                      />
                    </div>
                    <div className="flex justify-end pt-4"> {/* container สำหรับปุ่ม */}
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">บันทึกช่องทางการชำระเงิน</Button> {/* ปุ่มบันทึก */}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership" className="mt-6"> {/* เนื้อหา tab ประเภทสมาชิก */}
              <Card className="shadow-lg border-gray-200 hover:border-blue-300 transition-all duration-300"> {/* Card component */}
                <CardHeader> {/* ส่วนหัวของ Card */}
                  <div className="flex justify-between items-center"> {/* container สำหรับ header */}
                    <div> {/* ส่วนซ้าย */}
                      <CardTitle className="text-xl font-bold text-gray-900">ประเภทสมาชิก</CardTitle> {/* ชื่อเรื่อง */}
                      <CardDescription>จัดการประเภทและราคาสมาชิก</CardDescription> {/* คำอธิบาย */}
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}> {/* Dialog สำหรับเพิ่มประเภทใหม่ */}
                      <DialogTrigger asChild> {/* ปุ่มเปิด Dialog */}
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"> {/* ปุ่มเพิ่ม */}
                          <Plus className="h-4 w-4 mr-2" /> {/* icon plus */}
                          เพิ่มประเภทใหม่
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md"> {/* เนื้อหาของ Dialog */}
                        <DialogHeader> {/* ส่วนหัวของ Dialog */}
                          <DialogTitle>เพิ่มประเภทสมาชิกใหม่</DialogTitle> {/* ชื่อเรื่อง */}
                          <DialogDescription>กรอกข้อมูลประเภทสมาชิกใหม่</DialogDescription> {/* คำอธิบาย */}
                        </DialogHeader>
                        <form onSubmit={handleCreateMembershipType} className="space-y-4 pt-4"> {/* ฟอร์มเพิ่มประเภทใหม่ */}
                          <div className="space-y-2"> {/* input group */}
                            <Label htmlFor="name">ชื่อประเภท</Label> {/* label */}
                            <Input // input field
                              id="name" // id ของ input
                              value={newMembershipData.name} // ค่าจาก state
                              onChange={(e) => setNewMembershipData({ ...newMembershipData, name: e.target.value })} // อัปเดต state
                              required // จำเป็นต้องกรอก
                              placeholder="เช่น รายเดือน, รายปี" // placeholder text
                            />
                          </div>
                          <div className="space-y-2"> {/* input group */}
                            <Label htmlFor="description">คำอธิบาย</Label> {/* label */}
                            <Input // input field
                              id="description" // id ของ input
                              value={newMembershipData.description} // ค่าจาก state
                              onChange={(e) => // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                                setNewMembershipData({ ...newMembershipData, description: e.target.value })
                              }
                              placeholder="คำอธิบายเพิ่มเติม" // placeholder text
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4"> {/* grid layout สำหรับ 2 columns */}
                            <div className="space-y-2"> {/* input group */}
                              <Label htmlFor="price">ราคา (บาท)</Label> {/* label */}
                              <Input // input field
                                id="price" // id ของ input
                                type="number" // ประเภท input เป็นตัวเลข
                                value={newMembershipData.price} // ค่าจาก state
                                onChange={(e) => // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                                  setNewMembershipData({ ...newMembershipData, price: e.target.value ? Number.parseInt(e.target.value) : 0 })
                                }
                                min="0" // ค่าต่ำสุด
                                required // จำเป็นต้องกรอก
                              />
                            </div>
                            <div className="space-y-2"> {/* input group */}
                              <Label htmlFor="duration_days">ระยะเวลา (วัน)</Label> {/* label */}
                              <Input // input field
                                id="duration_days" // id ของ input
                                type="number" // ประเภท input เป็นตัวเลข
                                value={newMembershipData.duration_days} // ค่าจาก state
                                onChange={(e) => // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                                  setNewMembershipData({
                                    ...newMembershipData,
                                    duration_days: e.target.value ? Number.parseInt(e.target.value) : 0,
                                  })
                                }
                                min="1" // ค่าต่ำสุด
                                required // จำเป็นต้องกรอก
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-4"> {/* container สำหรับปุ่ม */}
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}> {/* ปุ่มยกเลิก */}
                              ยกเลิก
                            </Button>
                            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">เพิ่มประเภท</Button> {/* ปุ่มเพิ่ม */}
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent> {/* เนื้อหาของ Card */}
                  <div className="overflow-x-auto"> {/* container สำหรับ table ที่ scroll ได้ */}
                    <Table> {/* Table component */}
                      <TableHeader> {/* ส่วนหัวของ table */}
                        <TableRow> {/* แถวหัวตาราง */}
                          <TableHead>ชื่อประเภท</TableHead> {/* หัวคอลัมน์ */}
                          <TableHead>คำอธิบาย</TableHead> {/* หัวคอลัมน์ */}
                          <TableHead>ราคา</TableHead> {/* หัวคอลัมน์ */}
                          <TableHead>ระยะเวลา</TableHead> {/* หัวคอลัมน์ */}
                          <TableHead>การดำเนินการ</TableHead> {/* หัวคอลัมน์ */}
                        </TableRow>
                      </TableHeader>
                      <TableBody> {/* เนื้อหาของ table */}
                        {membershipTypes.map((type) => ( // วนลูปแสดงข้อมูลประเภทสมาชิก
                          <TableRow key={type.id} className="hover:bg-gray-50"> {/* แถวข้อมูล */}
                            <TableCell className="font-medium">{type.name}</TableCell> {/* เซลล์ชื่อประเภท */}
                            <TableCell>{type.description}</TableCell> {/* เซลล์คำอธิบาย */}
                            <TableCell>฿{type.price.toLocaleString()}</TableCell> {/* เซลล์ราคา */}
                            <TableCell>{type.duration_days} วัน</TableCell> {/* เซลล์ระยะเวลา */}
                            <TableCell> {/* เซลล์การดำเนินการ */}
                              <div className="flex space-x-2"> {/* container สำหรับปุ่ม */}
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingMembership(type)}> {/* ปุ่มแก้ไข */}
                                  <Edit className="h-4 w-4" /> {/* icon แก้ไข */}
                                </Button>
                                <Button // ปุ่มลบ
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => { // เมื่อคลิกปุ่มลบ
                                    if (confirm("คุณต้องการลบประเภทสมาชิกนี้หรือไม่?")) { // แสดง confirm dialog
                                      // Handle delete
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" /> {/* icon ลบ */}
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
          <Dialog open={!!editingMembership} onOpenChange={() => setEditingMembership(null)}> {/* Dialog สำหรับแก้ไขประเภทสมาชิก */}
            <DialogContent className="sm:max-w-md"> {/* เนื้อหาของ Dialog */}
              <DialogHeader> {/* ส่วนหัวของ Dialog */}
                <DialogTitle>แก้ไขประเภทสมาชิก</DialogTitle> {/* ชื่อเรื่อง */}
                <DialogDescription>แก้ไขข้อมูลประเภทสมาชิกที่เลือก</DialogDescription> {/* คำอธิบาย */}
              </DialogHeader>
              {editingMembership && ( // ถ้ามีข้อมูลที่กำลังแก้ไข
                <form onSubmit={handleUpdateMembershipType} className="space-y-4 pt-4"> {/* ฟอร์มแก้ไข */}
                  <div className="space-y-2"> {/* input group */}
                    <Label htmlFor="edit_name">ชื่อประเภท</Label> {/* label */}
                    <Input // input field
                      id="edit_name" // id ของ input
                      value={editingMembership.name} // ค่าจาก state
                      onChange={(e) => setEditingMembership({ ...editingMembership, name: e.target.value })} // อัปเดต state
                      required // จำเป็นต้องกรอก
                    />
                  </div>
                  <div className="space-y-2"> {/* input group */}
                    <Label htmlFor="edit_description">คำอธิบาย</Label> {/* label */}
                    <Input // input field
                      id="edit_description" // id ของ input
                      value={editingMembership.description} // ค่าจาก state
                      onChange={(e) => setEditingMembership({ ...editingMembership, description: e.target.value })} // อัปเดต state
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4"> {/* grid layout สำหรับ 2 columns */}
                    <div className="space-y-2"> {/* input group */}
                      <Label htmlFor="edit_price">ราคา (บาท)</Label> {/* label */}
                      <Input // input field
                        id="edit_price" // id ของ input
                        type="number" // ประเภท input เป็นตัวเลข
                        value={editingMembership.price} // ค่าจาก state
                        onChange={(e) => // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                          setEditingMembership({ ...editingMembership, price: e.target.value ? Number.parseInt(e.target.value) : 0 })
                        }
                        min="0" // ค่าต่ำสุด
                        required // จำเป็นต้องกรอก
                      />
                    </div>
                    <div className="space-y-2"> {/* input group */}
                      <Label htmlFor="edit_duration_days">ระยะเวลา (วัน)</Label> {/* label */}
                      <Input // input field
                        id="edit_duration_days" // id ของ input
                        type="number" // ประเภท input เป็นตัวเลข
                        value={editingMembership.duration_days} // ค่าจาก state
                        onChange={(e) => // อัปเดต state เมื่อมีการเปลี่ยนแปลง
                          setEditingMembership({ ...editingMembership, duration_days: e.target.value ? Number.parseInt(e.target.value) : 0 })
                        }
                        min="1" // ค่าต่ำสุด
                        required // จำเป็นต้องกรอก
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4"> {/* container สำหรับปุ่ม */}
                    <Button type="button" variant="outline" onClick={() => setEditingMembership(null)}> {/* ปุ่มยกเลิก */}
                      ยกเลิก
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">บันทึก</Button> {/* ปุ่มบันทึก */}
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  )
} // ปิดฟังก์ชัน component
