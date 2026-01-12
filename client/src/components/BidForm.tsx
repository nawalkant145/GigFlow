"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { DollarSign, Clock, Send } from "lucide-react"
import toast from "react-hot-toast"
import api from "../services/api"

interface BidFormProps {
  gigId: string
  maxBudget: number
  onBidPlaced: () => void
  disabled?: boolean
}

export default function BidForm({ gigId, maxBudget, onBidPlaced, disabled }: BidFormProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [proposal, setProposal] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">Please log in to place a bid</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !proposal || !deliveryTime) {
      toast.error("Please fill in all fields")
      return
    }

    if (proposal.length < 20) {
      toast.error("Proposal must be at least 20 characters")
      return
    }

    setLoading(true)

    try {
      await api.post(`/gigs/${gigId}/bids`, {
        amount: Number(amount),
        proposal,
        deliveryTime: Number(deliveryTime),
      })

      toast.success("Bid placed successfully!")
      setAmount("")
      setProposal("")
      setDeliveryTime("")
      onBidPlaced()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to place bid")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Bid Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Up to ${maxBudget}`}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
              max={maxBudget * 2}
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (days)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="e.g., 7"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Proposal</label>
        <textarea
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          placeholder="Describe your approach, relevant experience, and why you're the best fit for this gig..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={4}
          minLength={20}
          maxLength={1000}
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 mt-1">{proposal.length}/1000 characters</p>
      </div>

      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Submit Bid
          </>
        )}
      </button>
    </form>
  )
}
