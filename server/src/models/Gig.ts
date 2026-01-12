import mongoose, { type Document, Schema } from "mongoose"

export interface IGig extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description: string
  budget: number
  deadline: Date
  skillsRequired: string[]
  category: string
  status: "open" | "in-progress" | "completed" | "cancelled"
  postedBy: mongoose.Types.ObjectId
  hiredFreelancer?: mongoose.Types.ObjectId
  acceptedBid?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const gigSchema = new Schema<IGig>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: [1, "Budget must be at least $1"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      validate: {
        validator: (value: Date) => value > new Date(),
        message: "Deadline must be in the future",
      },
    },
    skillsRequired: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0 && arr.length <= 10,
        message: "Skills must be between 1 and 10",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["web-development", "mobile-development", "design", "writing", "marketing", "data-science", "other"],
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hiredFreelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acceptedBid: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Index for search and filtering
gigSchema.index({ title: "text", description: "text" })
gigSchema.index({ category: 1, status: 1 })
gigSchema.index({ postedBy: 1 })
gigSchema.index({ budget: 1 })

export const Gig = mongoose.model<IGig>("Gig", gigSchema)
