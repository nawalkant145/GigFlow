import type { Server } from "socket.io"
import { Notification, type INotification } from "../models/Notification.js"

type NotificationType = "new-bid" | "bid-accepted" | "bid-rejected" | "gig-hired"

interface NotificationData {
  gigId?: string
  bidId?: string
  userId?: string
}

export const createNotification = async (
  io: Server,
  userId: string,
  type: NotificationType,
  message: string,
  data: NotificationData,
): Promise<INotification> => {
  const notification = await Notification.create({
    user: userId,
    type,
    message,
    data,
  })

  // Emit real-time notification
  io.to(`user:${userId}`).emit("notification", {
    id: notification._id,
    type: notification.type,
    message: notification.message,
    data: notification.data,
    createdAt: notification.createdAt,
  })

  return notification
}

export const getUserNotifications = async (userId: string, limit = 20): Promise<INotification[]> => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit)
}

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<INotification | null> => {
  return Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true }, { new: true })
}

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany({ user: userId, read: false }, { read: true })
}
