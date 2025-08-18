"use client"

import { useEffect, useState, useRef } from "react"
import UserLayout from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Check, Crown, Star, Calendar, CreditCard, Sparkles, Shield, Zap, Gift } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserMembership {
  type: string
  expires_at: string
  status: string
  user_category: string
  pay_per_session_price: number
  annual_price: number
}

interface UserCategory {
  id: number;
  name: string;
  description: string;
  pay_per_session_price: number;
  annual_price: number;
}

export default function MembershipPage() {
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null)
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const { toast } = useToast()
  const [paymentModal, setPaymentModal] = useState<null | { type: 'session' | 'annual', price: number, categoryId: number }>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "">("")
  const [paymentStep, setPaymentStep] = useState<"choose" | "upload" | "pending" | "done">("choose")
  const [createdPayment, setCreatedPayment] = useState<any>(null)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bankAccountNumber, setBankAccountNumber] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const dashboardResponse = await fetch("https://backend-swimming-pool.onrender.com/api/user/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json()
          setUserMembership(dashboardData.membership)
          console.log("User Membership:", dashboardData.membership); // Debug log
        } else {
          console.error("Failed to fetch user dashboard:", dashboardResponse.status, dashboardResponse.statusText);
        }

        const categoriesResponse = await fetch("https://backend-swimming-pool.onrender.com/api/memberships/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setUserCategories(categoriesData.categories);
          console.log("User Categories:", categoriesData.categories); // Debug log
        } else {
          console.error("Failed to fetch user categories:", categoriesResponse.status, categoriesResponse.statusText);
        }

      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    ;(async () => {
      try {
        const res = await fetch("https://backend-swimming-pool.onrender.com/api/settings/bank_account_number")
        if (res.ok) {
          const data = await res.json()
          setBankAccountNumber(data.value)
        }
      } catch {}
    })()
  }, [])

  const handleOpenPaymentModal = (type: 'session' | 'annual', price: number, categoryId: number) => {
    setPaymentModal({ type, price, categoryId })
    setPaymentMethod("")
    setPaymentStep("choose")
    setCreatedPayment(null)
    setSlipFile(null)
  }

  const handleCreatePayment = async () => {
    if (!paymentModal || !paymentMethod) return
    setPurchasing(paymentModal.type)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://backend-swimming-pool.onrender.com/api/memberships/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchase_type: paymentModal.type,
          payment_method: paymentMethod,
          user_category_id: paymentModal.categoryId, // Pass the selected category ID
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setCreatedPayment(data)
        if (paymentMethod === "bank_transfer") {
          setPaymentStep("upload")
        } else {
          setPaymentStep("pending")
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ไม่สามารถสร้างรายการชำระเงินได้",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    }
    setPurchasing(null)
  }

  const handleUploadSlip = async () => {
    if (!createdPayment?.payment_id || !slipFile) return
    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("slip", slipFile)
      const response = await fetch(`https://backend-swimming-pool.onrender.com/api/payments/${createdPayment.payment_id}/upload-slip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (response.ok) {
        setPaymentStep("pending")
        toast({ title: "อัปโหลดสลิปสำเร็จ", description: "รอเจ้าหน้าที่ตรวจสอบ" })
      } else {
        const errorData = await response.json()
        toast({
          title: "อัปโหลดสลิปไม่สำเร็จ",
          description: errorData.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดสลิปได้",
        variant: "destructive",
      })
    }
    setUploading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              สมาชิกภาพ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              จัดการสถานะสมาชิกภาพและเลือกแพ็คเกจที่เหมาะสมกับคุณ
            </p>
          </div>

          {/* Current Membership Status */}
          {userMembership && (
            <div className="max-w-4xl mx-auto">
              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-full">
                        {userMembership.user_category.includes("ทั่วไป") ? 
                          <Star className="h-6 w-6" /> : 
                          <Crown className="h-6 w-6" />
                        }
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-white">
                          {userMembership.user_category}
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                          ประเภทสมาชิกปัจจุบันของคุณ
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(userMembership.status)} border-0 px-4 py-2 text-sm font-medium`}>
                      {userMembership.status === "active"
                        ? "ใช้งานได้"
                        : userMembership.status === "expired"
                          ? "หมดอายุ"
                          : "รอดำเนินการ"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-100">สมาชิกภาพ</p>
                        <p className="text-lg font-semibold">{userMembership.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-100">หมดอายุ</p>
                        <p className="text-lg font-semibold">
                          {new Date(userMembership.expires_at).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pricing Section */}
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">แพ็คเกจราคาสำหรับคุณ</h2>
              <p className="text-gray-600">เลือกแพ็คเกจที่เหมาะสมกับการใช้งานของคุณ</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {userMembership && userMembership.user_category && userMembership.annual_price !== undefined && userMembership.pay_per_session_price !== undefined ? (
                <>
                  {/* Pay Per Session Card */}
                  <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <CardHeader className="text-center relative z-10 pb-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 mx-auto">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">ชำระรายครั้ง</CardTitle>
                      <CardDescription className="text-gray-600">เหมาะสำหรับผู้ใช้เป็นครั้งคราว</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center space-x-1">
                          <span className="text-4xl font-bold text-gray-900">
                            ฿{userMembership.pay_per_session_price.toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-600">/ครั้ง</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">ไม่มีค่าผูกมัด</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">ยืดหยุ่นในการใช้งาน</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">เหมาะสำหรับผู้ใช้เป็นครั้งคราว</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Annual Membership Card */}
                  <Card className="relative overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl group bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      แนะนำ
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-12 translate-x-12 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <CardHeader className="text-center relative z-10 pb-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">สมาชิกรายปี</CardTitle>
                      <CardDescription className="text-gray-600">ประหยัดมากกว่าและคุ้มค่าที่สุด</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center space-x-1">
                          <span className="text-4xl font-bold text-gray-900">
                            ฿{userMembership.annual_price.toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-600">/ปี</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            <Gift className="h-4 w-4 mr-1" />
                            ประหยัด {Math.round(((userMembership.pay_per_session_price * 12) - userMembership.annual_price) / (userMembership.pay_per_session_price * 12) * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">ใช้งานได้ไม่จำกัด</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">ประหยัดกว่าชำระรายครั้ง</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">สิทธิพิเศษสำหรับสมาชิก</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        onClick={() => {
                          const categoryId = userCategories.find(cat => cat.name === userMembership.user_category)?.id;
                          if (categoryId) {
                            handleOpenPaymentModal('annual', userMembership.annual_price, categoryId);
                          } else {
                            toast({
                              title: "ไม่พบหมวดหมู่ผู้ใช้",
                              description: "ไม่สามารถดำเนินการชำระเงินได้เนื่องจากไม่พบ ID หมวดหมู่",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={purchasing === `annual-${userMembership.user_category}`}
                      >
                        {purchasing === `annual-${userMembership.user_category}` ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>กำลังดำเนินการ...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>สมัคร/ต่ออายุรายปี</span>
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="col-span-full text-center py-12 border-2 border-dashed border-gray-300">
                  <CardContent className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Star className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg text-gray-600">ไม่พบข้อมูลแพ็คเกจราคาสำหรับประเภทผู้ใช้ของคุณ</p>
                    <p className="text-sm text-gray-500">กรุณาติดต่อเจ้าหน้าที่เพื่อขอข้อมูลเพิ่มเติม</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={!!paymentModal} onOpenChange={open => { if (!open) setPaymentModal(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-2">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold">เลือกวิธีชำระเงิน</DialogTitle>
                <DialogDescription className="text-gray-600">
                  ชำระเงินสำหรับ {paymentModal?.type === 'annual' ? 'สมาชิกรายปี' : 'บริการรายครั้ง'} จำนวน 
                  <span className="font-bold text-blue-600"> ฿{paymentModal?.price.toLocaleString()}</span>
                </DialogDescription>
              </div>
            </DialogHeader>
            
            {paymentStep === "choose" && (
              <div className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)} className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">เงินสด</p>
                          <p className="text-sm text-gray-600">ชำระที่เคาน์เตอร์</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">โอนผ่านธนาคาร</p>
                          <p className="text-sm text-gray-600">อัปโหลดสลิปหลังโอน</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300" 
                  onClick={handleCreatePayment} 
                  disabled={!paymentMethod || purchasing === paymentModal?.type}
                >
                  {purchasing === paymentModal?.type ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>กำลังดำเนินการ...</span>
                    </div>
                  ) : (
                    "ดำเนินการต่อ"
                  )}
                </Button>
              </div>
            )}
            
            {paymentStep === "upload" && (
              <div className="space-y-6">
                <div className="text-center space-y-3 p-4 bg-blue-50 rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-medium">โปรดโอนเงินเข้าบัญชี</p>
                  <p className="text-2xl font-bold text-blue-600">{bankAccountNumber}</p>
                  <p className="text-sm text-gray-600">จากนั้นอัปโหลดหลักฐานการโอน (สลิป)</p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="slip-upload" className="text-sm font-medium">อัปโหลดสลิปการโอน</Label>
                  <Input 
                    id="slip-upload"
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={e => setSlipFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300" 
                  onClick={handleUploadSlip} 
                  disabled={!slipFile || uploading}
                >
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>กำลังอัปโหลด...</span>
                    </div>
                  ) : (
                    "อัปโหลดสลิป"
                  )}
                </Button>
              </div>
            )}
            
            {paymentStep === "pending" && (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                {paymentMethod === "cash" ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">รอการยืนยัน</h3>
                    <p className="text-gray-600">โปรดติดต่อเคาน์เตอร์เพื่อยืนยันการชำระเงิน</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">อัปโหลดสำเร็จ</h3>
                    <p className="text-gray-600">กรุณารอเจ้าหน้าที่ตรวจสอบการชำระเงิน</p>
                  </div>
                )}
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-300" 
                  onClick={() => { setPaymentModal(null); window.location.reload() }}
                >
                  ปิด
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  )
}
