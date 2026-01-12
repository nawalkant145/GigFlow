import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User, type IUser } from "../models/User.js"

export interface AuthRequest extends Request {
  user?: IUser
}

export interface JwtPayload {
  userId: string
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    console.log("[v0] Auth middleware - authHeader:", authHeader ? `${authHeader.substring(0, 30)}...` : null)
    console.log("[v0] JWT_ACCESS_SECRET loaded:", process.env.JWT_ACCESS_SECRET ? "YES" : "NO")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[v0] No valid auth header found")
      res.status(401).json({ message: "Access token required" })
      return
    }

    const token = authHeader.split(" ")[1]
    console.log("[v0] Token extracted:", token ? `${token.substring(0, 20)}...` : null)

    const secret = process.env.JWT_ACCESS_SECRET || "access-secret"
    console.log("[v0] Using secret (first 10 chars):", secret.substring(0, 10))

    const decoded = jwt.verify(token, secret) as JwtPayload
    console.log("[v0] Token decoded successfully, userId:", decoded.userId)

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      console.log("[v0] User not found in database")
      res.status(401).json({ message: "User not found" })
      return
    }

    console.log("[v0] User authenticated:", user.email)
    req.user = user
    next()
  } catch (error) {
    console.log("[v0] Auth error:", error)
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" })
      return
    }
    res.status(401).json({ message: "Invalid token" })
  }
}
