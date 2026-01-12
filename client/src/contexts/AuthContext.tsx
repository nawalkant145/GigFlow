"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from "react"
import api, { setAccessToken, getAccessToken } from "../services/api"
import type { User } from "../types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  const fetchUser = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      // Try to refresh token first
      console.log("[v0] Attempting to refresh token...")
      const { data: refreshData } = await api.post("/auth/refresh")
      console.log("[v0] Refresh response:", refreshData)
      setAccessToken(refreshData.accessToken)

      const { data } = await api.get("/auth/me")
      console.log("[v0] /auth/me response:", data)
      setUser(data.user)
    } catch (error) {
      console.log("[v0] fetchUser error:", error)
      setUser(null)
      setAccessToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    console.log("[v0] Login called for:", email)
    const { data } = await api.post("/auth/login", { email, password })
    console.log("[v0] Login response:", data)
    console.log("[v0] accessToken from login:", data.accessToken ? `${data.accessToken.substring(0, 20)}...` : null)
    setAccessToken(data.accessToken)
    setUser(data.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { getAccessToken }
