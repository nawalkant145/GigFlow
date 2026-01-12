"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import toast from "react-hot-toast"
import { useAuth, getAccessToken } from "./AuthContext"
import type { Notification } from "../types"

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const token = getAccessToken()
    if (!token) return

    const newSocket = io({
      auth: { token },
      transports: ["websocket", "polling"],
    })

    newSocket.on("connect", () => {
      setConnected(true)
    })

    newSocket.on("disconnect", () => {
      setConnected(false)
    })

    newSocket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show toast for new notification
      toast(notification.message, {
        icon: getNotificationIcon(notification.type),
        duration: 5000,
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  // Fetch existing notifications on mount
  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/users/me/notifications", {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        })
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
    }

    fetchNotifications()
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/users/me/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      })
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/users/me/notifications/read-all", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "new-bid":
      return "💰"
    case "bid-accepted":
      return "🎉"
    case "bid-rejected":
      return "😔"
    case "gig-hired":
      return "🤝"
    default:
      return "🔔"
  }
}
