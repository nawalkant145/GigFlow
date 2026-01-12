import { Router, type Response } from "express"
import { z } from "zod"
import mongoose from "mongoose"
import { Gig } from "../models/Gig.js"
import { Bid } from "../models/Bid.js"
import { authenticate, type AuthRequest } from "../middleware/auth.js"
import { createNotification } from "../services/notification.js"
import type { Server } from "socket.io"

const router = Router()

// Validation schemas
const createGigSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  budget: z.number().min(1),
  deadline: z.string().transform((val) => new Date(val)),
  skillsRequired: z.array(z.string()).min(1).max(10),
  category: z.enum([
    "web-development",
    "mobile-development",
    "design",
    "writing",
    "marketing",
    "data-science",
    "other",
  ]),
})

const updateGigSchema = createGigSchema.partial()

const createBidSchema = z.object({
  amount: z.number().min(1),
  proposal: z.string().min(20).max(1000),
  deliveryTime: z.number().min(1),
})

// Get all gigs with filtering
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, minBudget, maxBudget, status = "open", search, page = "1", limit = "10" } = req.query

    const query: Record<string, unknown> = { status }

    if (category) query.category = category
    if (minBudget || maxBudget) {
      query.budget = {}
      if (minBudget) (query.budget as Record<string, number>).$gte = Number(minBudget)
      if (maxBudget) (query.budget as Record<string, number>).$lte = Number(maxBudget)
    }
    if (search) {
      query.$text = { $search: search as string }
    }

    const pageNum = Number.parseInt(page as string)
    const limitNum = Number.parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const [gigs, total] = await Promise.all([
      Gig.find(query).populate("postedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Gig.countDocuments(query),
    ])

    res.json({
      gigs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error("Get gigs error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single gig
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate("postedBy", "name email")
      .populate("hiredFreelancer", "name email")

    if (!gig) {
      res.status(404).json({ message: "Gig not found" })
      return
    }

    // Get bids count
    const bidsCount = await Bid.countDocuments({ gig: gig._id })

    res.json({ gig, bidsCount })
  } catch (error) {
    console.error("Get gig error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create gig
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createGigSchema.parse(req.body)

    const gig = await Gig.create({
      ...data,
      postedBy: req.user!._id,
    })

    await gig.populate("postedBy", "name email")

    res.status(201).json({ gig })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.errors })
      return
    }
    console.error("Create gig error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update gig
router.put("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateGigSchema.parse(req.body)

    const gig = await Gig.findById(req.params.id)

    if (!gig) {
      res.status(404).json({ message: "Gig not found" })
      return
    }

    if (gig.postedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this gig" })
      return
    }

    if (gig.status !== "open") {
      res.status(400).json({ message: "Can only update open gigs" })
      return
    }

    Object.assign(gig, data)
    await gig.save()
    await gig.populate("postedBy", "name email")

    res.json({ gig })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.errors })
      return
    }
    console.error("Update gig error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete gig
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gig = await Gig.findById(req.params.id)

    if (!gig) {
      res.status(404).json({ message: "Gig not found" })
      return
    }

    if (gig.postedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this gig" })
      return
    }

    if (gig.status === "in-progress") {
      res.status(400).json({ message: "Cannot delete gig that is in progress" })
      return
    }

    // Delete associated bids
    await Bid.deleteMany({ gig: gig._id })
    await gig.deleteOne()

    res.json({ message: "Gig deleted successfully" })
  } catch (error) {
    console.error("Delete gig error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Place bid on gig
router.post("/:gigId/bids", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createBidSchema.parse(req.body)
    const gigId = req.params.gigId

    const gig = await Gig.findById(gigId).populate("postedBy", "name")

    if (!gig) {
      res.status(404).json({ message: "Gig not found" })
      return
    }

    if (gig.status !== "open") {
      res.status(400).json({ message: "Gig is not accepting bids" })
      return
    }

    // Check if user is the gig owner
    if (gig.postedBy._id.toString() === req.user!._id.toString()) {
      res.status(403).json({ message: "Cannot bid on your own gig" })
      return
    }

    // Check for existing bid
    const existingBid = await Bid.findOne({
      gig: gigId,
      bidder: req.user!._id,
    })

    if (existingBid) {
      res.status(400).json({ message: "You have already placed a bid on this gig" })
      return
    }

    const bid = await Bid.create({
      ...data,
      gig: gigId,
      bidder: req.user!._id,
    })

    await bid.populate("bidder", "name email")

    // Send real-time notification to gig owner
    const io = req.app.get("io") as Server
    await createNotification(
      io,
      gig.postedBy._id.toString(),
      "new-bid",
      `New bid of $${data.amount} on your gig "${gig.title}"`,
      { gigId: gig._id.toString(), bidId: bid._id.toString() },
    )

    // Emit to gig room for real-time updates
    io.to(`gig:${gigId}`).emit("new-bid", {
      bidId: bid._id,
      gigId,
      amount: bid.amount,
      bidder: { name: req.user!.name },
    })

    res.status(201).json({ bid })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.errors })
      return
    }
    if ((error as { code?: number }).code === 11000) {
      res.status(400).json({ message: "You have already placed a bid on this gig" })
      return
    }
    console.error("Place bid error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get bids for a gig
router.get("/:gigId/bids", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bids = await Bid.find({ gig: req.params.gigId }).populate("bidder", "name email").sort({ createdAt: -1 })

    res.json({ bids })
  } catch (error) {
    console.error("Get bids error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Accept bid (with transaction for atomicity - BONUS FEATURE)
router.post("/:gigId/bids/:bidId/accept", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const { gigId, bidId } = req.params

    const gig = await Gig.findById(gigId).session(session)

    if (!gig) {
      await session.abortTransaction()
      res.status(404).json({ message: "Gig not found" })
      return
    }

    if (gig.postedBy.toString() !== req.user!._id.toString()) {
      await session.abortTransaction()
      res.status(403).json({ message: "Only the gig owner can accept bids" })
      return
    }

    if (gig.status !== "open") {
      await session.abortTransaction()
      res.status(400).json({ message: "Gig is not open for hiring" })
      return
    }

    const bid = await Bid.findById(bidId).populate("bidder", "name").session(session)

    if (!bid || bid.gig.toString() !== gigId) {
      await session.abortTransaction()
      res.status(404).json({ message: "Bid not found" })
      return
    }

    if (bid.status !== "pending") {
      await session.abortTransaction()
      res.status(400).json({ message: "Bid is not in pending status" })
      return
    }

    // Update the accepted bid
    bid.status = "accepted"
    await bid.save({ session })

    // Reject all other bids
    await Bid.updateMany({ gig: gigId, _id: { $ne: bidId } }, { status: "rejected" }, { session })

    // Update gig status
    gig.status = "in-progress"
    gig.hiredFreelancer = bid.bidder._id as mongoose.Types.ObjectId
    gig.acceptedBid = bid._id as mongoose.Types.ObjectId
    await gig.save({ session })

    await session.commitTransaction()

    // Send notifications
    const io = req.app.get("io") as Server

    // Notify winning bidder
    await createNotification(
      io,
      bid.bidder._id.toString(),
      "bid-accepted",
      `Congratulations! Your bid on "${gig.title}" has been accepted!`,
      { gigId: gig._id.toString(), bidId: bid._id.toString() },
    )

    // Notify rejected bidders
    const rejectedBids = await Bid.find({
      gig: gigId,
      _id: { $ne: bidId },
    })

    for (const rejectedBid of rejectedBids) {
      await createNotification(
        io,
        rejectedBid.bidder.toString(),
        "bid-rejected",
        `Your bid on "${gig.title}" was not selected.`,
        { gigId: gig._id.toString(), bidId: rejectedBid._id.toString() },
      )
    }

    // Emit gig update
    io.to(`gig:${gigId}`).emit("gig-hired", {
      gigId,
      freelancerId: bid.bidder._id,
      freelancerName: (bid.bidder as unknown as { name: string }).name,
    })

    res.json({
      message: "Bid accepted successfully",
      gig: await Gig.findById(gigId).populate("postedBy", "name email").populate("hiredFreelancer", "name email"),
    })
  } catch (error) {
    await session.abortTransaction()
    console.error("Accept bid error:", error)
    res.status(500).json({ message: "Server error" })
  } finally {
    session.endSession()
  }
})

export default router
