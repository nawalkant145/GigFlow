import type { Server, Socket } from "socket.io"
import jwt from "jsonwebtoken"

interface AuthenticatedSocket extends Socket {
  userId?: string
}

export const setupSocket = (io: Server): void => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication required"))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access-secret") as { userId: string }

      socket.userId = decoded.userId
      next()
    } catch (err) {
      next(new Error("Invalid token"))
    }
  })

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`)

    // Join user's personal room for notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
    }

    // Join a gig room to receive updates
    socket.on("join-gig", (gigId: string) => {
      socket.join(`gig:${gigId}`)
    })

    socket.on("leave-gig", (gigId: string) => {
      socket.leave(`gig:${gigId}`)
    })

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`)
    })
  })
}
