import mongoose, { type Document, Schema } from "mongoose"

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  type: "new-bid" | "bid-accepted" | "bid-rejected" | "gig-hired"
  message: string
  data: {
    gigId?: string
    bidId?: string
    userId?: string
  }
  read: boolean
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["new-bid", "bid-accepted", "bid-rejected", "gig-hired"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      gigId: String,
      bidId: String,
      userId: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({ user: 1, read: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>("Notification", notificationSchema)
