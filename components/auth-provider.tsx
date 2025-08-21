"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: "admin" | "user"
  created_at?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      // Verify token with API
      fetch("http://localhost:3001/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.user) {
              setUser(data.user)
            } else {
              localStorage.removeItem("token")
            }
          } else if (res.status === 401 || res.status === 403) {
            // Token is invalid or expired
            localStorage.removeItem("token")
            setUser(null)
            console.log("Token expired or invalid, removed from storage and cleared user state")
          } else {
            // Other error, but don't remove token yet
            console.error("Failed to verify token:", res.status, res.statusText)
          }
        })
        .catch((error) => {
          console.error("Error verifying token:", error)
          // Don't remove token on network errors, server might be starting up
          // Only remove token if it's actually invalid (handled in response above)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.token) {
        localStorage.setItem("token", data.token)
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
