import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User, type IUser } from "../models/User.js"

export interface AuthRequest extends Request {
  user?: IUser
}

export interface JwtPayload {
  userId: string
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access token required" })
      return
    }

    const token = authHeader.split(" ")[1]
    const secret = process.env.JWT_ACCESS_SECRET || "access-secret"
    const decoded = jwt.verify(token, secret) as JwtPayload

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      res.status(401).json({ message: "User not found" })
      return
    }
    ;(req as AuthRequest).user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" })
      return
    }
    res.status(401).json({ message: "Invalid token" })
  }
}
