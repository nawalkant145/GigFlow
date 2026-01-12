import jwt from "jsonwebtoken"
import type { IUser } from "../models/User.js"

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || "access-secret"
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || "refresh-secret"
const getAccessExpiry = () => process.env.JWT_ACCESS_EXPIRY || "15m"
const getRefreshExpiry = () => process.env.JWT_REFRESH_EXPIRY || "7d"

export const generateAccessToken = (user: IUser): string => {
  return jwt.sign({ userId: user._id.toString() }, getAccessSecret(), { expiresIn: getAccessExpiry() })
}

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign({ userId: user._id.toString() }, getRefreshSecret(), { expiresIn: getRefreshExpiry() })
}

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, getRefreshSecret()) as { userId: string }
}
