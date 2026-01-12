"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Plus, Briefcase, Clock, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import api from "../services/api"
import type { Gig } from "../types"

export default function DashboardPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const { data } = await api.get("/users/me/gigs")
        setGigs(data.gigs)
      } catch (error) {
        console.error("Failed to fetch gigs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGigs()
  }, [])

  const stats = {
    total: gigs.length,
    open: gigs.filter((g) => g.status === "open").length,
    inProgress: gigs.filter((g) => g.status === "in-progress").length,
    completed: gigs.filter((g) => g.status === "completed").length,
  }

  const statusColors = {
    open: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-1 text-gray-600">Manage your posted gigs</p>
        </div>
        <Link
          to="/gigs/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5" />
          Post a Gig
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Gigs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gigs List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : gigs.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs yet</h3>
          <p className="text-gray-600 mb-6">Post your first gig to find talented freelancers</p>
          <Link
            to="/gigs/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5" />
            Post a Gig
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gig</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hired
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gigs.map((gig) => (
                <tr key={gig._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/gigs/${gig._id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                      {gig.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[gig.status]}`}>
                      {gig.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">${gig.budget.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{format(new Date(gig.deadline), "MMM d, yyyy")}</td>
                  <td className="px-6 py-4">
                    {gig.hiredFreelancer ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {gig.hiredFreelancer.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <XCircle className="h-4 w-4" />
                        Not hired
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
