import { Link } from "react-router-dom"
import { Calendar, DollarSign, Tag } from "lucide-react"
import type { Gig } from "../types"
import { format } from "date-fns"

interface GigCardProps {
  gig: Gig
}

export default function GigCard({ gig }: GigCardProps) {
  const statusColors = {
    open: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <Link to={`/gigs/${gig._id}`} className="block bg-white rounded-xl border hover:shadow-lg transition p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[gig.status]}`}>
              {gig.status}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
              {gig.category.replace("-", " ")}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">{gig.title}</h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{gig.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
            <DollarSign className="h-5 w-5" />
            {gig.budget.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {gig.skillsRequired.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs"
          >
            <Tag className="h-3 w-3" />
            {skill}
          </span>
        ))}
        {gig.skillsRequired.length > 4 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
            +{gig.skillsRequired.length - 4} more
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Posted by {gig.postedBy.name}</span>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Due {format(new Date(gig.deadline), "MMM d, yyyy")}</span>
        </div>
      </div>
    </Link>
  )
}
