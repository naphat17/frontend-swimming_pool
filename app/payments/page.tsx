"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import UserLayout from "@/components/user-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Receipt, Download, CreditCard, Calendar, DollarSign, CheckCircle, Clock, X, Printer, Trash2, Eye, Hash, FileX, MessageSquare, AlertCircle } from "lucide-react"

interface Payment {
  id: number
  amount: any
  status: string
  payment_method: string
  transaction_id: string
  created_at: string
  membership_type?: string
  payment_category?: string
  slip_url?: string
  receipt_url?: string
  notes?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRejectPayment, setSelectedRejectPayment] = useState<Payment | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  const normalizeAmount = (amount: unknown) => {
    const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? 0))
    return Number.isFinite(n) ? n : 0
  }

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          toast({
            title: "ข้อผิดพลาด",
            description: "กรุณาเข้าสู่ระบบใหม่",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        const response = await fetch("https://backend-l7q9.onrender.com/api/payments/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.payments && Array.isArray(data.payments)) {
            setPayments(data.payments)
          } else {
            setPayments([])
            toast({
              title: "แจ้งเตือน",
              description: "ไม่พบข้อมูลการชำระเงิน",
            })
          }
        } else if (response.status === 401) {
          toast({
            title: "ข้อผิดพลาด",
            description: "กรุณาเข้าสู่ระบบใหม่",
            variant: "destructive",
          })
          localStorage.removeItem("token")
          router.push("/login")
        } else {
          const errorData = await response.json().catch(() => ({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" }))
          toast({
            title: "ข้อผิดพลาด",
            description: errorData.message || "ไม่สามารถดึงข้อมูลการชำระเงินได้",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
        toast({
          title: "ข้อผิดพลาด",
          description: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const handleShowReceipt = (payment: Payment) => {
    if (!payment || !payment.id) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ข้อมูลการชำระเงินไม่ถูกต้อง",
        variant: "destructive",
      })
      return
    }
    setSelectedPayment(payment)
    setIsReceiptOpen(true)
  }

  const handleDownloadReceipt = async (paymentId: number) => {
    if (!paymentId || paymentId <= 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสการชำระเงินไม่ถูกต้อง",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`https://backend-l7q9.onrender.com/api/payments/${paymentId}/receipt`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.receipt_url) {
          window.open(data.receipt_url, "_blank")
        } else {
          // Handle PDF download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `receipt-${paymentId}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } else if (response.status === 401) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        router.push("/login")
      } else if (response.status === 404) {
        toast({
          title: "ไม่พบใบเสร็จ",
          description: "ไม่พบใบเสร็จสำหรับการชำระเงินนี้",
          variant: "destructive",
        })
      } else {
        const errorData = await response.json().catch(() => ({ message: "เกิดข้อผิดพลาดในการดาวน์โหลด" }))
        toast({
          title: "ไม่สามารถดาวน์โหลดใบเสร็จได้",
          description: errorData.message || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error downloading receipt:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
        variant: "destructive",
      })
    }
  }

  const handleDeletePayment = async (paymentId: number, transactionId: string) => {
    if (!paymentId || paymentId <= 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสการชำระเงินไม่ถูกต้อง",
        variant: "destructive",
      })
      return
    }

    if (!transactionId || transactionId.trim() === "") {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสอ้างอิงไม่ถูกต้อง",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`คุณต้องการลบรายการชำระเงิน รหัสอ้างอิง: ${transactionId} หรือไม่?`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`https://backend-l7q9.onrender.com/api/payments/${paymentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Remove payment from state
        setPayments(payments.filter(p => p.id !== paymentId))
        toast({
          title: "ลบรายการสำเร็จ",
          description: `ลบรายการ ${transactionId} เรียบร้อยแล้ว`,
        })
      } else if (response.status === 401) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        router.push("/login")
      } else if (response.status === 403) {
        toast({
          title: "ไม่มีสิทธิ์",
          description: "คุณไม่มีสิทธิ์ลบรายการนี้",
          variant: "destructive",
        })
      } else if (response.status === 404) {
        toast({
          title: "ไม่พบรายการ",
          description: "ไม่พบรายการชำระเงินที่ต้องการลบ",
          variant: "destructive",
        })
      } else {
        const data = await response.json().catch(() => ({ message: "เกิดข้อผิดพลาดในการลบรายการ" }))
        toast({
          title: "ไม่สามารถลบรายการได้",
          description: data.message || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
        variant: "destructive",
      })
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  const openRejectDialog = (payment: Payment) => {
    setSelectedRejectPayment(payment)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleRejectPayment = async () => {
    if (!selectedRejectPayment || !rejectReason.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกเหตุผลการตีกลับ",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`https://backend-l7q9.onrender.com/api/payments/${selectedRejectPayment.id}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reject_reason: rejectReason.trim(),
        }),
      })

      if (response.ok) {
        // Update payment status in local state
        setPayments(payments.map(p => 
          p.id === selectedRejectPayment.id 
            ? { ...p, status: 'failed', notes: rejectReason.trim() }
            : p
        ))
        
        setRejectDialogOpen(false)
        setSelectedRejectPayment(null)
        setRejectReason('')
        
        toast({
          title: "ตีกลับสลิปสำเร็จ",
          description: "ได้ส่งการแจ้งเตือนให้ผู้ใช้แล้ว",
        })
      } else if (response.status === 401) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        router.push("/login")
      } else {
        const errorData = await response.json().catch(() => ({ message: "เกิดข้อผิดพลาดในการตีกลับสลิป" }))
        toast({
          title: "ไม่สามารถตีกลับสลิปได้",
          description: errorData.message || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting payment:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
      case "success":
        return "bg-green-100 text-green-800"
      case "pending":
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return "สำเร็จ"
      case "approved":
        return "อนุมัติแล้ว/สำเร็จ"
      case "pending":
      case "waiting":
        return "รอดำเนินการ"
      case "failed":
      case "cancelled":
        return "ไม่สำเร็จ"
      case "refunded":
        return "คืนเงิน"
      default:
        return status
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "credit_card":
      case "card":
        return "บัตรเครดิต"
      case "bank_transfer":
      case "transfer":
        return "โอนเงิน"
      case "cash":
        return "เงินสด"
      case "qr_code":
      case "qr":
        return "QR Code"
      case "promptpay":
        return "พร้อมเพย์"
      default:
        return method || "ไม่ระบุ"
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
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ประวัติการชำระเงิน
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              รายการการชำระเงินและใบเสร็จทั้งหมดของคุณ
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100">ยอดรวมทั้งหมด</p>
                    <p className="text-2xl font-bold">
                      ฿
                      {payments.reduce((sum, p) => sum + ((p.status === "completed" || p.status === "approved" || p.status === "success") ? normalizeAmount(p.amount) : 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-100">การชำระสำเร็จ</p>
                    <p className="text-2xl font-bold">
                      {payments.filter((p) => p.status === "completed" || p.status === "approved" || p.status === "success").length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-100">รอดำเนินการ</p>
                    <p className="text-2xl font-bold">
                      {payments.filter((p) => p.status === "pending" || p.status === "waiting").length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments List */}
          <div className="max-w-6xl mx-auto space-y-4">
            {payments.length > 0 ? (
              payments.map((payment, index) => (
                <Card key={`${payment.id}-${index}`} className="relative overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
                          <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {payment.membership_type || "การชำระเงิน"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span>จำนวน: ฿{normalizeAmount(payment.amount).toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <CreditCard className="h-4 w-4 text-gray-500" />
                              <span>วิธีชำระ: {getPaymentMethodText(payment.payment_method)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>วันที่: {payment.created_at ? new Date(payment.created_at).toLocaleDateString("th-TH") : 'ไม่ระบุวันที่'}</span>
                            </span>
                          </div>
                          {payment.transaction_id && (
                            <p className="text-xs text-gray-500 mt-2">รหัสอ้างอิง: {payment.transaction_id}</p>
                          )}
                          {payment.status === "failed" && payment.notes && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-red-700">เหตุผลการตีกลับ:</p>
                                  <p className="text-xs text-red-600 mt-1">{payment.notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getStatusColor(payment.status)} px-3 py-1 text-sm font-medium`}>
                          {getStatusText(payment.status)}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {(payment.status === "completed" || payment.status === "approved" || payment.status === "success") && (
                            <Button variant="outline" size="sm" onClick={() => handleShowReceipt(payment)} className="flex items-center space-x-1">
                              <Receipt className="h-4 w-4" />
                              <span>ใบเสร็จ</span>
                            </Button>
                          )}

                          {payment.status === "failed" && payment.slip_url && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openRejectDialog(payment)}
                              className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <FileX className="h-4 w-4" />
                              <span>ดูเหตุผลการตีกลับ</span>
                            </Button>
                          )}

                          {(payment.transaction_id === "TXN1755610866233" || payment.transaction_id === "TXN1755610914481") && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeletePayment(payment.id, payment.transaction_id)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>ลบ</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full text-center py-12 border-2 border-dashed border-gray-300">
                <CardContent className="space-y-4">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประวัติการชำระเงิน</h3>
                  <p className="text-gray-600">เมื่อคุณชำระเงินแล้ว ประวัติจะแสดงที่นี่</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Popup */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">ใบเสร็จรับเงิน</DialogTitle>
            <DialogDescription>รายละเอียดใบเสร็จการชำระเงิน</DialogDescription>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrintReceipt} className="flex items-center space-x-1">
                <Printer className="h-4 w-4" />
                <span>พิมพ์</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectedPayment && handleDownloadReceipt(selectedPayment.id)} className="flex items-center space-x-1">
                <Download className="h-4 w-4" />
                <span>ดาวน์โหลด</span>
              </Button>
            </div>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="bg-white p-8 space-y-6" id="receipt-content">
              {/* Header */}
              <div className="text-center border-b pb-6">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">Swimming Pool Management System</h1>
                <p className="text-gray-600">ใบเสร็จรับเงิน / Receipt</p>
                <p className="text-sm text-gray-500 mt-2">เลขที่ใบเสร็จ: #{selectedPayment.id.toString().padStart(6, '0')}</p>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">รายละเอียดการชำระเงิน</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ประเภท:</span>
                      <span className="font-medium">
                        {selectedPayment.membership_type || 'การชำระเงิน'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">วิธีชำระ:</span>
                      <span className="font-medium">
                        {getPaymentMethodText(selectedPayment.payment_method)}
                      </span>
                    </div>
                    {selectedPayment.transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">รหัสอ้างอิง:</span>
                        <span className="font-medium">{selectedPayment.transaction_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">สถานะ:</span>
                      <Badge className="bg-green-100 text-green-800 px-2 py-1 text-xs">
                        {selectedPayment.status === "approved" ? "อนุมัติแล้ว/สำเร็จ" : "ชำระเงินสำเร็จ"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">วันที่และเวลา</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">วันที่ชำระ:</span>
                      <span className="font-medium">{new Date(selectedPayment.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เวลา:</span>
                      <span className="font-medium">{new Date(selectedPayment.created_at).toLocaleTimeString('th-TH')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">จำนวนเงินรวม</span>
                  <span className="text-2xl font-bold text-blue-600">฿{normalizeAmount(selectedPayment.amount).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  ({normalizeAmount(selectedPayment.amount) === 1200 ? 'หนึ่งพันสองร้อยบาทถ้วน' :
                    normalizeAmount(selectedPayment.amount) === 500 ? 'ห้าร้อยบาทถ้วน' :
                    normalizeAmount(selectedPayment.amount) === 100 ? 'หนึ่งร้อยบาทถ้วน' :
                    'จำนวนเงินตามที่ระบุ'})
                </p>
              </div>

              {/* Footer */}
              <div className="border-t pt-6 text-center space-y-2">
                <p className="text-sm text-gray-600">ขอบคุณที่ใช้บริการ Swimming Pool Management System</p>
                <p className="text-xs text-gray-500">ใบเสร็จนี้ออกโดยระบบอัตโนมัติ ไม่ต้องลงลายมือชื่อ</p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <span>การชำระเงินได้รับการยืนยันแล้ว</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <FileX className="h-5 w-5" />
              <span>เหตุผลการตีกลับสลิป</span>
            </DialogTitle>
            <DialogDescription>ดูเหตุผลที่สลิปการชำระเงินถูกตีกลับ</DialogDescription>
          </DialogHeader>
          
          {selectedRejectPayment && (
            <div className="space-y-4">
              {/* Payment Info */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">รายการ:</span>
                  <span className="font-medium">{selectedRejectPayment.membership_type || 'การชำระเงิน'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">จำนวนเงิน:</span>
                  <span className="font-medium">฿{normalizeAmount(selectedRejectPayment.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">รหัสอ้างอิง:</span>
                  <span className="font-medium">{selectedRejectPayment.transaction_id}</span>
                </div>
              </div>

              {/* Rejection Reason Display */}
              {selectedRejectPayment.notes ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">เหตุผลการตีกลับ:</Label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{selectedRejectPayment.notes}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reject-reason" className="text-sm font-medium flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>เหตุผลการตีกลับ</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="กรุณาระบุเหตุผลการตีกลับสลิป..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              ปิด
            </Button>
            {selectedRejectPayment && !selectedRejectPayment.notes && (
              <Button 
                onClick={handleRejectPayment} 
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ตีกลับสลิป
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  )
}
