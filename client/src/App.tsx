import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import GigsPage from "./pages/GigsPage"
import GigDetailPage from "./pages/GigDetailPage"
import CreateGigPage from "./pages/CreateGigPage"
import EditGigPage from "./pages/EditGigPage"
import DashboardPage from "./pages/DashboardPage"
import MyBidsPage from "./pages/MyBidsPage"
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="gigs" element={<GigsPage />} />
        <Route path="gigs/:id" element={<GigDetailPage />} />
        <Route
          path="gigs/new"
          element={
            <ProtectedRoute>
              <CreateGigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="gigs/:id/edit"
          element={
            <ProtectedRoute>
              <EditGigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bids"
          element={
            <ProtectedRoute>
              <MyBidsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
