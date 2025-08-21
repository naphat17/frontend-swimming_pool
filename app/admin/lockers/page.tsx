"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Loader2, Calendar as CalendarIcon, Lock, LockOpen, Shield, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Locker {
  id: number
  code: string
  location: string
  status: 'available' | 'maintenance' | 'unavailable'
  created_at: string
  updated_at: string
  is_reserved_on_selected_date?: boolean
}

export default function AdminLockersPage() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentLocker, setCurrentLocker] = useState<Locker | null>(null)
  const [formCode, setFormCode] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formStatus, setFormStatus] = useState<'available' | 'maintenance' | 'unavailable'>('available')
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { toast } = useToast()

  useEffect(() => {
    if (selectedDate) {
      fetchLockers(selectedDate)
    }
  }, [selectedDate])

  const fetchLockers = async (date: Date) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const formattedDate = format(date, "yyyy-MM-dd")
      const response = await fetch(`http://localhost:3001/api/lockers?date=${formattedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLockers(data.lockers || [])
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลตู้เก็บของได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching lockers:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (locker: Locker | null = null) => {
    setCurrentLocker(locker)
    setFormCode(locker ? locker.code : "")
    setFormLocation(locker ? locker.location : "")
    setFormStatus(locker ? locker.status : 'available')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setCurrentLocker(null)
    setFormCode("")
    setFormLocation("")
    setFormStatus('available')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const token = localStorage.getItem("token")

    const method = currentLocker ? "PUT" : "POST"
    const url = currentLocker ? `http://localhost:3001/api/lockers/${currentLocker.id}` : "http://localhost:3001/api/lockers"

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: formCode, location: formLocation, status: formStatus }),
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: `ตู้เก็บของถูก${currentLocker ? "อัปเดต" : "เพิ่ม"}เรียบร้อยแล้ว`,
        })
        handleCloseDialog()
        if (selectedDate) {
          fetchLockers(selectedDate)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถดำเนินการได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting locker:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetAllAvailable = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการตั้งค่าตู้เก็บของทั้งหมดให้พร้อมใช้งาน?")) return

    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const response = await fetch("http://localhost:3001/api/lockers/bulk/set-available", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "สำเร็จ",
          description: `ตู้เก็บของทั้งหมดพร้อมใช้งานแล้ว (อัปเดต ${data.updated_count} ตู้)`,
        })
        if (selectedDate) {
          fetchLockers(selectedDate)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถอัปเดตสถานะตู้ได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting all lockers available:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/lockers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({
          title: "สำเร็จ",
          description: "ตู้เก็บของถูกลบเรียบร้อยแล้ว",
        })
        if (selectedDate) {
          fetchLockers(selectedDate)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.message || "ไม่สามารถลบได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting locker:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getLockerIcon = (status: string) => {
    switch (status) {
      case 'available':
        return LockOpen
      case 'maintenance':
        return Settings
      default:
        return Lock
    }
  }

  const getLockerColor = (status: string, isReserved?: boolean) => {
    if (isReserved) {
      return 'bg-red-400 text-white cursor-not-allowed'
    }
    switch (status) {
      case 'available':
        return 'bg-green-400 hover:bg-green-500 text-white'
      case 'maintenance':
        return 'bg-yellow-400 hover:bg-yellow-500 text-gray-800'
      case 'unavailable':
        return 'bg-gray-400 text-gray-600 cursor-not-allowed'
      default:
        return 'bg-gray-300 text-gray-600'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="space-y-8 p-6">
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              จัดการตู้เก็บของ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เพิ่ม แก้ไข และดูสถานะตู้เก็บของ
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>เลือกวันที่</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-3">
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white" 
                  onClick={handleSetAllAvailable}
                  disabled={loading}
                >
                  <LockOpen className="h-4 w-4 mr-2" />
                  ตู้เก็บของพร้อมใช้งานทุกตู้
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มตู้ใหม่
                </Button>
              </div>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>ตู้เก็บของทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-8">
                  {lockers
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((locker) => {
                    const IconComponent = getLockerIcon(locker.status)
                    const isReserved = locker.is_reserved_on_selected_date
                    return (
                      <div key={locker.id} className="text-center">
                        <div
                          className={`w-28 h-36 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 ${getLockerColor(locker.status, isReserved)}`}
                        >
                          <IconComponent className="h-10 w-10 mb-2" />
                          <span className="font-bold text-xl">{locker.code}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-center space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(locker)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(locker.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {currentLocker ? "แก้ไขตู้เก็บของ" : "เพิ่มตู้เก็บของใหม่"}
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600">
                {currentLocker ? "แก้ไขข้อมูลตู้เก็บของ" : "เพิ่มตู้เก็บของใหม่เข้าสู่ระบบ"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="code" className="text-lg font-semibold">
                  รหัสตู้เก็บของ
                </Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="เช่น A1, B2, C3"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="location" className="text-lg font-semibold">
                  ตำแหน่ง
                </Label>
                <Input
                  id="location"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="เช่น ชั้น 1 ฝั่งซ้าย"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="status" className="text-lg font-semibold">
                  สถานะ
                </Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as 'available' | 'maintenance' | 'unavailable')}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available" className="text-lg">พร้อมใช้งาน</SelectItem>
                    <SelectItem value="maintenance" className="text-lg">ซ่อมบำรุง</SelectItem>
                    <SelectItem value="unavailable" className="text-lg">ไม่ว่าง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" size="lg" className="px-8 py-3 text-lg" onClick={handleCloseDialog}>
                  ยกเลิก
                </Button>
                <Button type="submit" size="lg" className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {currentLocker ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มตู้เก็บของ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
