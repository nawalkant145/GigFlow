"use client"

import { Outlet, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import NotificationDropdown from "./NotificationDropdown"
import { Menu, X, Briefcase, LogOut, User, LayoutDashboard, FileText } from "lucide-react"
import { useState } from "react"

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
              <Briefcase className="h-6 w-6" />
              GigFlow
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/gigs" className="text-gray-600 hover:text-indigo-600 transition">
                Browse Gigs
              </Link>
              {user ? (
                <>
                  <Link to="/gigs/new" className="text-gray-600 hover:text-indigo-600 transition">
                    Post a Gig
                  </Link>
                  <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">
                    Dashboard
                  </Link>
                  <Link to="/my-bids" className="text-gray-600 hover:text-indigo-600 transition">
                    My Bids
                  </Link>
                  <NotificationDropdown />
                  <div className="flex items-center gap-3 pl-3 border-l">
                    <span className="text-sm text-gray-600">{user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-500 hover:text-red-600 transition"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/gigs"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-600 hover:text-indigo-600"
              >
                Browse Gigs
              </Link>
              {user ? (
                <>
                  <Link
                    to="/gigs/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
                  >
                    <FileText className="h-4 w-4" />
                    Post a Gig
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/my-bids"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
                  >
                    <User className="h-4 w-4" />
                    My Bids
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 hover:text-indigo-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block bg-indigo-600 text-white px-4 py-2 rounded-lg text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} GigFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
