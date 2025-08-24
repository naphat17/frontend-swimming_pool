import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Trash2 } from "lucide-react"

interface ReservationTableProps {
  data: any[]
  type: 'pool' | 'locker'
  onUpdateStatus: (id: number, status: string) => void
  onDelete?: (id: number) => void
  getStatusBadgeVariant: (status: string) => string
  getStatusText: (status: string) => string
  getPaymentStatusBadgeVariant: (status: string) => string
  getPaymentStatusText: (method: string) => string
  getPaymentMethodText: (method: string) => string
}

export function ReservationTable({
  data,
  type,
  onUpdateStatus,
  onDelete,
  getStatusBadgeVariant,
  getStatusText,
  getPaymentStatusBadgeVariant,
  getPaymentStatusText,
  getPaymentMethodText
}: ReservationTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>สมาชิก</TableHead>
            <TableHead>{type === 'pool' ? 'สระ' : 'ตู้'}</TableHead>
            <TableHead>วันที่</TableHead>
            <TableHead>เวลา</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>การชำระเงิน</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">
                  {type === 'pool' 
                    ? (item.user_name || 'ไม่ระบุชื่อ')
                    : `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'
                  }
                </div>
                <div className="text-sm text-gray-500">{item.user_email || 'ไม่ระบุอีเมล'}</div>
              </TableCell>
              <TableCell>
                {type === 'pool' 
                  ? (item.pool_name || 'ไม่ระบุสระ')
                  : `${item.locker_code || 'ไม่ระบุ'} (${item.location || 'ไม่ระบุ'})`
                }
              </TableCell>
              <TableCell>
                {(() => {
                  if (!item.reservation_date || item.reservation_date === 'null' || item.reservation_date === '') {
                    return 'ไม่ระบุวันที่'
                  }
                  try {
                    // ตรวจสอบรูปแบบวันที่ก่อน
                    const dateStr = item.reservation_date.toString()
                    let date
                    
                    if (dateStr.includes('T')) {
                      // ISO format
                      date = new Date(dateStr)
                    } else if (dateStr.includes('-')) {
                      // YYYY-MM-DD format
                      const [year, month, day] = dateStr.split('-')
                      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    } else {
                      // fallback
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
                }
              </TableCell>
              <TableCell>{item.start_time || 'ไม่ระบุ'} - {item.end_time || 'ไม่ระบุ'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(item.status) as any}>
                  {getStatusText(item.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div>฿{item.payment_amount?.toLocaleString() || '-'}</div>
                <div className="text-xs text-gray-500">{getPaymentMethodText(item.payment_method)}</div>
                <Badge variant={getPaymentStatusBadgeVariant(item.payment_status || 'pending') as any} className="mt-1">
                   {getPaymentStatusText(item.payment_status || 'pending')}
                 </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {item.status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onUpdateStatus(item.id, "confirmed")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onUpdateStatus(item.id, "cancelled")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {item.status === "confirmed" && type === 'pool' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onUpdateStatus(item.id, "completed")}
                    >
                      เสร็จสิ้น
                    </Button>
                  )}
                  {type === 'locker' && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      title="ลบการจอง"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {item.slip_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.slip_url, "_blank")}
                    >
                      ดูสลิป
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}