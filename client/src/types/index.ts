export interface User {
  id: string
  name: string
  email: string
}

export interface Gig {
  _id: string
  title: string
  description: string
  budget: number
  deadline: string
  skillsRequired: string[]
  category: string
  status: "open" | "in-progress" | "completed" | "cancelled"
  postedBy: {
    _id: string
    name: string
    email: string
  }
  hiredFreelancer?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface Bid {
  _id: string
  gig: string | Gig
  bidder: {
    _id: string
    name: string
    email: string
  }
  amount: number
  proposal: string
  deliveryTime: number
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

export interface Notification {
  _id: string
  type: "new-bid" | "bid-accepted" | "bid-rejected" | "gig-hired"
  message: string
  data: {
    gigId?: string
    bidId?: string
  }
  read: boolean
  createdAt: string
}
