"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Shield, MapPin, Clock, Waves } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setShowLanding(true)
      } else if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: "url('/555.png')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="text-center relative z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-800 font-semibold text-xl">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!showLanding) {
    return null
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: "url('/555.png')" }}
    >
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Main Content Card */}
      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img src="/LOGO.png" alt="Logo" className="h-20 w-20 animate-float" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-4">
              สระว่ายน้ำโรจนากร
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 font-medium">มหาวิทยาลัยมหาสารคาม</p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Button
                variant="outline"
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/login")}
              >
                เข้าสู่ระบบ
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/register")}
              >
                สมัครสมาชิก
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* สมัครสมาชิก */}
            <div className="text-center group animate-slide-up">
              <div className="bg-blue-50 rounded-2xl p-6 mb-6 group-hover:bg-blue-100 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">สมัครสมาชิก</h3>
              <p className="text-gray-600 text-base mb-4 leading-relaxed">
                สมัครสมาชิกออนไลน์ได้ง่ายๆ<br />
                ราคาประหยัดกว่าได้สิทธิพิเศษ
              </p>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2 font-medium transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/register")}
              >
                สมัครออนไลน์
              </Button>
            </div>

            {/* จองสระว่ายน้ำ */}
            <div className="text-center group animate-slide-up delay-200">
              <div className="bg-green-50 rounded-2xl p-6 mb-6 group-hover:bg-green-100 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">จองสระว่ายน้ำ</h3>
              <p className="text-gray-600 text-base mb-4 leading-relaxed">
                จองใช้สระว่ายน้ำล่วงหน้าได้<br />
                ความสะดวกของคุณ
              </p>
              <Button
                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-2 font-medium transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/login")}
              >
                จองออนไลน์
              </Button>
            </div>

            {/* จองตู้เก็บของ */}
            <div className="text-center group animate-slide-up delay-400">
              <div className="bg-orange-50 rounded-2xl p-6 mb-6 group-hover:bg-orange-100 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">จองตู้เก็บของ</h3>
              <p className="text-gray-600 text-base mb-4 leading-relaxed">
                จองตู้เก็บของสำหรับเก็บสิ่งของ<br />
                ราคาไม่แพงและสะดวกสบาย
              </p>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2 font-medium transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/login")}
              >
                จองตู้เก็บของ
              </Button>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mb-3">
                ค่าธรรมเนียมและค่าบำรุงสระว่ายน้ำ
              </h2>
              <p className="text-gray-600 text-lg">ราคาที่เหมาะสมสำหรับทุกคน</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="py-4 px-4 text-left font-semibold text-base">
                      ประเภทสมาชิก/รายการ
                    </th>
                    <th className="py-4 px-4 text-center font-semibold text-base">
                      ค่าสมาชิกรายปี (บาท)
                    </th>
                    <th className="py-4 px-4 text-center font-semibold text-base">
                      ต่อครั้ง (บาท)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">นักเรียน ร.ร. สาธิต (ฝ่ายประถม) (ก)</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-blue-600">300</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-green-600">20</td>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">นักเรียน ร.ร. สาธิต (ฝ่ายมัธยม) (ข)</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-blue-600">300</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-green-600">30</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">นิสิตมหาวิทยาลัยมหาสารคาม (ข)</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-blue-600">300</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-green-600">30</td>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">บุคลากรมหาวิทยาลัยมหาสารคาม (ข)</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-blue-600">300</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-green-600">30</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">บุคคลภายนอกทั่วไป (เด็ก) (ค)</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-blue-600">400</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-green-600">30</td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">บุคคลภายนอกทั่วไป (ผู้ใหญ่) (ค)</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-blue-600">500</td>
                    <td className="py-3 px-4 text-center font-bold text-lg text-green-600">50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {/* ที่ตั้ง */}
            <div className="flex flex-col items-center group animate-slide-up">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2 text-lg">ที่ตั้ง</h4>
              <p className="text-gray-600">มหาวิทยาลัยมหาสารคาม</p>
            </div>
            
            {/* เวลาเปิด-ปิด */}
            <div className="flex flex-col items-center group animate-slide-up delay-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2 text-lg">เวลาเปิด-ปิด</h4>
              <p className="text-gray-600">06:00 - 20:00 น.</p>
            </div>
            
            {/* สิ่งอำนวยความสะดวก */}
            <div className="flex flex-col items-center group animate-slide-up delay-400">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2 text-lg">สิ่งอำนวยความสะดวก</h4>
              <p className="text-gray-600">สระว่ายน้ำ ตู้เก็บของ ห้องแต่งตัว</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
