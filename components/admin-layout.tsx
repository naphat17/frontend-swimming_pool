"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Calendar, MapPin, CreditCard, Settings, LogOut, Menu, X, Award, KeyRound, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navigation = [
  { name: "แดชบอร์ด", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "จัดการสมาชิก", href: "/admin/members", icon: Users },
  { name: "จัดการการจอง", href: "/admin/reservations", icon: Calendar },
  { name: "จัดการสระ", href: "/admin/pools", icon: MapPin },
  { name: "จัดการตู้เก็บของ", href: "/admin/lockers", icon: KeyRound },
  { name: "จัดการการชำระ", href: "/admin/payments", icon: CreditCard },
  { name: "รายงานและสถิติ", href: "/admin/reports", icon: BarChart3 },
  { name: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-emerald-800 via-green-800 to-emerald-900 shadow-2xl backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 border-b border-emerald-600/30 bg-gradient-to-r from-emerald-700/20 to-green-700/20">
            <div className="flex items-center space-x-2">
              <img src="/LOGO.png" alt="Logo" className="h-8 w-8 filter brightness-0 invert drop-shadow-lg" />
              <h1 className="text-lg font-bold text-white drop-shadow-md tracking-wide">ผู้ดูแลระบบ</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-white hover:bg-emerald-600/50 hover:scale-110 transition-all duration-200">
              <X className="h-5 w-5" />
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
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30" 
                      : "text-emerald-100 hover:bg-gradient-to-r hover:from-emerald-700/50 hover:to-green-700/50 hover:text-white hover:shadow-md hover:shadow-emerald-500/20"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-300 ${
                    isActive ? "text-white drop-shadow-sm" : "text-emerald-200 group-hover:text-white group-hover:scale-110"
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-emerald-600/30 p-4 bg-gradient-to-r from-emerald-800/30 to-green-800/30">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white drop-shadow-sm">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-emerald-200 font-medium">ผู้ดูแลระบบ</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-red-500/50 hover:scale-110 transition-all duration-200 rounded-lg">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-emerald-800 via-green-800 to-emerald-900 shadow-2xl backdrop-blur-sm">
          <div className="flex h-16 items-center px-4 border-b border-emerald-600/30 bg-gradient-to-r from-emerald-700/20 to-green-700/20">
            <div className="flex items-center space-x-2">
              <img src="/LOGO.png" alt="Logo" className="h-8 w-8 filter brightness-0 invert drop-shadow-lg" />
              <h1 className="text-lg font-bold text-white drop-shadow-md tracking-wide">ผู้ดูแลระบบ</h1>
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
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30" 
                      : "text-emerald-100 hover:bg-gradient-to-r hover:from-emerald-700/50 hover:to-green-700/50 hover:text-white hover:shadow-md hover:shadow-emerald-500/20"
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-300 ${
                    isActive ? "text-white drop-shadow-sm" : "text-emerald-200 group-hover:text-white group-hover:scale-110"
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-emerald-600/30 p-4 bg-gradient-to-r from-emerald-800/30 to-green-800/30">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white drop-shadow-sm">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-emerald-200 font-medium">ผู้ดูแลระบบ</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-red-500/50 hover:scale-110 transition-all duration-200 rounded-lg">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-emerald-200/50 bg-white/80 backdrop-blur-md px-4 shadow-lg shadow-emerald-100/50 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden hover:bg-emerald-100 hover:scale-110 transition-all duration-200" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-emerald-700" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-end space-x-4">
              <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">ผู้ดูแลระบบ</span>
              <Button variant="outline" size="sm" onClick={logout} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:scale-105 transition-all duration-200">
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
