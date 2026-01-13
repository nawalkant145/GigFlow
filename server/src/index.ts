import express, { type Request, type Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { createServer } from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.js"
import gigRoutes from "./routes/gigs.js"
import userRoutes from "./routes/users.js"
import { setupSocket } from "./socket/index.js"

// dotenv.config()

// const app = express()
// const httpServer = createServer(app)

// // Socket.io setup
// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     credentials: true,
//   },
// })

// // Make io accessible to routes
// app.set("io", io)

// // Middleware
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     credentials: true,
//   }),
// )
// app.use(express.json())
// app.use(cookieParser())

// // Routes
// app.use("/api/auth", authRoutes)
// app.use("/api/gigs", gigRoutes)
// app.use("/api/users", userRoutes)

// // Health check
// app.get("/api/health", (req: Request, res: Response) => {
//   res.json({ status: "ok" })
// })
dotenv.config()

const allowedOrigins = [
  "http://localhost:5173",
  "https://gig-flow-chi.vercel.app",
]

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

app.set("io", io)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/gigs", gigRoutes)
app.use("/api/users", userRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})


// Setup Socket.io
setupSocket(io)

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/gigflow")
  .then(() => {
    console.log("Connected to MongoDB")
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })
