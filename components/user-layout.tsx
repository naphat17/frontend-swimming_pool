"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Home, User, CreditCard, Calendar, Clock, Receipt, LogOut, Menu, X, Box } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navigation = [
  { name: "หน้าหลัก", href: "/dashboard", icon: Home },
  { name: "ข้อมูลส่วนตัว", href: "/profile", icon: User },
  { name: "สมัครสมาชิก", href: "/membership", icon: CreditCard },
  { name: "จองการใช้งาน", href: "/reservations", icon: Calendar },
  { name: "จองตู้เก็บของ", href: "/lockers", icon: Box },
  { name: "ตารางเวลา", href: "/schedule", icon: Clock },
  { name: "ประวัติการชำระ", href: "/payments", icon: Receipt },
]

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: "url('/555.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-cyan-50/60 to-purple-50/60" />
      <div className="relative z-10">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white/95 backdrop-blur-xl shadow-2xl border-r border-blue-100/50">
          <div className="flex h-16 items-center justify-between px-4 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-cyan-50/80">
            <div className="flex items-center space-x-2">
              <img src="/LOGO.png" alt="Logo" className="h-8 w-8 drop-shadow-md" />
              <h1 className="text-lg font-bold text-blue-700 drop-shadow-sm tracking-wide">โรจนากร</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="hover:bg-blue-100/50 hover:scale-110 transition-all duration-200 rounded-lg">
              <X className="h-5 w-5 text-blue-600" />
            </Button>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-blue-300/30" 
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-md hover:shadow-blue-200/30"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-300 ${
                    isActive ? "text-white drop-shadow-sm" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-110"
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-blue-100/50 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 drop-shadow-sm">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-blue-600 font-medium">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-red-100/50 hover:scale-110 transition-all duration-200 rounded-lg">
                <LogOut className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-xl shadow-2xl border-r border-blue-100/50">
          <div className="flex h-16 items-center px-4 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-cyan-50/80">
            <div className="flex items-center space-x-2">
              <img src="/LOGO.png" alt="Logo" className="h-8 w-8 drop-shadow-md" />
              <h1 className="text-lg font-bold text-blue-700 drop-shadow-sm tracking-wide">สระว่ายน้ำโรจนากร</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-blue-300/30" 
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-md hover:shadow-blue-200/30"
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-300 ${
                    isActive ? "text-white drop-shadow-sm" : "text-gray-500 group-hover:text-blue-600 group-hover:scale-110"
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-blue-100/50 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 drop-shadow-sm">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-blue-600 font-medium">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-red-100/50 hover:scale-110 transition-all duration-200 rounded-lg">
                <LogOut className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-blue-200/50 bg-white/80 backdrop-blur-md px-4 shadow-lg shadow-blue-100/50 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden hover:bg-blue-100/50 hover:scale-110 transition-all duration-200" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-blue-700" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-end">
              <div className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                สระว่ายน้ำโรจนากร
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      </div>
    </div>
  )
}
