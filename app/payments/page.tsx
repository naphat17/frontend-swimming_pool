"use client"

import { useEffect, useState } from "react"
import UserLayout from "@/components/user-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Receipt, Download, CreditCard, Calendar, DollarSign, CheckCircle, Clock } from "lucide-react"

interface Payment {
  id: number
  amount: any
  status: string
  payment_method: string
  transaction_id: string
  created_at: string
  membership_type?: string
  receipt_url?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const normalizeAmount = (amount: unknown) => {
    const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? 0))
    return Number.isFinite(n) ? n : 0
  }

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("http://localhost:3001/api/payments/user", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setPayments(data.payments || [])
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/payments/${paymentId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
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
      } else {
        toast({
          title: "ไม่สามารถดาวน์โหลดใบเสร็จได้",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดใบเสร็จได้",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
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
        return "สำเร็จ"
      case "pending":
        return "รอดำเนินการ"
      case "failed":
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
        return "บัตรเครดิต"
      case "bank_transfer":
        return "โอนเงิน"
      case "cash":
        return "เงินสด"
      default:
        return method
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
                      {payments.reduce((sum, p) => sum + (p.status === "completed" ? normalizeAmount(p.amount) : 0), 0).toLocaleString()}
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
                      {payments.filter((p) => p.status === "completed").length}
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
                      {payments.filter((p) => p.status === "pending").length}
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
                            {payment.membership_type ? `สมาชิก${payment.membership_type}` : "การชำระเงิน"}
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
                              <span>วันที่: {new Date(payment.created_at).toLocaleDateString("th-TH")}</span>
                            </span>
                          </div>
                          {payment.transaction_id && (
                            <p className="text-xs text-gray-500 mt-2">รหัสอ้างอิง: {payment.transaction_id}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getStatusColor(payment.status)} px-3 py-1 text-sm font-medium`}>
                          {getStatusText(payment.status)}
                        </Badge>
                        {payment.status === "completed" && (
                          <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(payment.id)} className="flex items-center space-x-1">
                            <Download className="h-4 w-4" />
                            <span>ใบเสร็จ</span>
                          </Button>
                        )}
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
    </UserLayout>
  )
}
