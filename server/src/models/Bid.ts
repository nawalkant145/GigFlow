import mongoose, { type Document, Schema } from "mongoose"

export interface IBid extends Document {
  _id: mongoose.Types.ObjectId
  gig: mongoose.Types.ObjectId
  bidder: mongoose.Types.ObjectId
  amount: number
  proposal: string
  deliveryTime: number // in days
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt: Date
}

const bidSchema = new Schema<IBid>(
  {
    gig: {
      type: Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    bidder: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [1, "Bid amount must be at least $1"],
    },
    proposal: {
      type: String,
      required: [true, "Proposal is required"],
      minlength: [20, "Proposal must be at least 20 characters"],
      maxlength: [1000, "Proposal cannot exceed 1000 characters"],
    },
    deliveryTime: {
      type: Number,
      required: [true, "Delivery time is required"],
      min: [1, "Delivery time must be at least 1 day"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure one bid per user per gig
bidSchema.index({ gig: 1, bidder: 1 }, { unique: true })
bidSchema.index({ gig: 1, status: 1 })

export const Bid = mongoose.model<IBid>("Bid", bidSchema)
