"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { format } from "date-fns"
import { Calendar, DollarSign, Tag, User, Clock, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import BidForm from "../components/BidForm"
import api from "../services/api"
import type { Gig, Bid } from "../types"

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [gig, setGig] = useState<Gig | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)

  const isOwner = user && gig && user.id === gig.postedBy._id
  const hasAlreadyBid = bids.some((bid) => user && bid.bidder._id === user.id)

  const fetchGig = useCallback(async () => {
    try {
      const [gigRes, bidsRes] = await Promise.all([api.get(`/gigs/${id}`), api.get(`/gigs/${id}/bids`)])
      setGig(gigRes.data.gig)
      setBids(bidsRes.data.bids)
    } catch (error) {
      console.error("Failed to fetch gig:", error)
      toast.error("Gig not found")
      navigate("/gigs")
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchGig()
  }, [fetchGig])

  // Join gig room for real-time updates
  useEffect(() => {
    if (!socket || !id) return

    socket.emit("join-gig", id)

    socket.on("new-bid", () => {
      fetchGig()
    })

    socket.on("gig-hired", () => {
      fetchGig()
    })

    return () => {
      socket.emit("leave-gig", id)
      socket.off("new-bid")
      socket.off("gig-hired")
    }
  }, [socket, id, fetchGig])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this gig?")) return

    try {
      await api.delete(`/gigs/${id}`)
      toast.success("Gig deleted successfully")
      navigate("/dashboard")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to delete gig")
    }
  }

  const handleAcceptBid = async (bidId: string) => {
    if (!confirm("Accept this bid? This will hire the freelancer and reject all other bids.")) {
      return
    }

    setAcceptingBid(bidId)

    try {
      await api.post(`/gigs/${id}/bids/${bidId}/accept`)
      toast.success("Bid accepted! Freelancer has been hired.")
      fetchGig()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to accept bid")
    } finally {
      setAcceptingBid(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!gig) return null

  const statusColors = {
    open: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gig Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[gig.status]}`}>
                    {gig.status}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {gig.category.replace("-", " ")}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{gig.title}</h1>
              </div>

              {isOwner && gig.status === "open" && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/gigs/${gig._id}/edit`}
                    className="p-2 text-gray-500 hover:text-indigo-600 transition"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-500 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap">{gig.description}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {gig.skillsRequired.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                >
                  <Tag className="h-4 w-4" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bid Form (only for non-owners on open gigs) */}
          {!isOwner && gig.status === "open" && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {hasAlreadyBid ? "You have already bid on this gig" : "Place Your Bid"}
              </h2>
              <BidForm gigId={gig._id} maxBudget={gig.budget} onBidPlaced={fetchGig} disabled={hasAlreadyBid} />
            </div>
          )}

          {/* Bids List (visible to owner) */}
          {isOwner && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bids ({bids.length})</h2>

              {bids.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bids yet</p>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <div
                      key={bid._id}
                      className={`border rounded-lg p-4 ${
                        bid.status === "accepted"
                          ? "border-green-300 bg-green-50"
                          : bid.status === "rejected"
                            ? "border-red-200 bg-red-50 opacity-60"
                            : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{bid.bidder.name}</p>
                              <p className="text-sm text-gray-500">{bid.bidder.email}</p>
                            </div>
                          </div>

                          <p className="text-gray-700 mt-3">{bid.proposal}</p>

                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <DollarSign className="h-4 w-4" />
                              {bid.amount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-4 w-4" />
                              {bid.deliveryTime} days
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {bid.status === "pending" && gig.status === "open" && (
                            <button
                              onClick={() => handleAcceptBid(bid._id)}
                              disabled={acceptingBid === bid._id}
                              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                              {acceptingBid === bid._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Accept
                            </button>
                          )}
                          {bid.status === "accepted" && (
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircle className="h-5 w-5" />
                              Accepted
                            </span>
                          )}
                          {bid.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                              <AlertCircle className="h-5 w-5" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Gig Details Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Budget</span>
                <span className="flex items-center gap-1 text-2xl font-bold text-indigo-600">
                  <DollarSign className="h-6 w-6" />
                  {gig.budget.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Deadline</span>
                <span className="flex items-center gap-1 text-gray-900">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  {format(new Date(gig.deadline), "MMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Bids</span>
                <span className="text-gray-900 font-medium">{bids.length}</span>
              </div>

              <hr />

              <div>
                <span className="text-gray-600 text-sm">Posted by</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{gig.postedBy.name}</p>
                    <p className="text-sm text-gray-500">{format(new Date(gig.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>

              {gig.hiredFreelancer && (
                <>
                  <hr />
                  <div>
                    <span className="text-gray-600 text-sm">Hired Freelancer</span>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{gig.hiredFreelancer.name}</p>
                        <p className="text-sm text-gray-500">{gig.hiredFreelancer.email}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
