import { Router, type Request, type Response } from "express"
import { Gig } from "../models/Gig.js"
import { Bid } from "../models/Bid.js"
import { Notification } from "../models/Notification.js"
import { authenticate, type AuthRequest } from "../middleware/auth.js"
import { markNotificationAsRead, markAllNotificationsAsRead } from "../services/notification.js"

const router = Router()

// Get current user's posted gigs
router.get("/me/gigs", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest
    const gigs = await Gig.find({ postedBy: authReq.user!._id })
      .populate("hiredFreelancer", "name email")
      .sort({ createdAt: -1 })

    res.json({ gigs })
  } catch (error) {
    console.error("Get user gigs error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get current user's bids
router.get("/me/bids", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest
    const bids = await Bid.find({ bidder: authReq.user!._id })
      .populate({
        path: "gig",
        select: "title status budget deadline postedBy",
        populate: { path: "postedBy", select: "name" },
      })
      .sort({ createdAt: -1 })

    res.json({ bids })
  } catch (error) {
    console.error("Get user bids error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user's notifications
router.get("/me/notifications", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest
    const notifications = await Notification.find({ user: authReq.user!._id }).sort({ createdAt: -1 }).limit(50)

    const unreadCount = await Notification.countDocuments({
      user: authReq.user!._id,
      read: false,
    })

    res.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark notification as read
router.patch("/me/notifications/:id/read", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest
    const notification = await markNotificationAsRead(req.params.id, authReq.user!._id.toString())

    if (!notification) {
      res.status(404).json({ message: "Notification not found" })
      return
    }

    res.json({ notification })
  } catch (error) {
    console.error("Mark notification read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark all notifications as read
router.patch("/me/notifications/read-all", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest
    await markAllNotificationsAsRead(authReq.user!._id.toString())
    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Mark all notifications read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
