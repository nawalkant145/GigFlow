import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api` || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let accessToken: string | null = null
let isRefreshing = false

export const setAccessToken = (token: string | null) => {
  console.log("[v0] setAccessToken called with:", token ? `${token.substring(0, 20)}...` : null)
  accessToken = token
}

export const getAccessToken = () => accessToken

// Request interceptor to add auth header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  console.log("[v0] Request interceptor - accessToken:", accessToken ? `${accessToken.substring(0, 20)}...` : null)
  console.log("[v0] Request URL:", config.url)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
    console.log("[v0] Authorization header set")
  } else {
    console.log("[v0] No accessToken, skipping Authorization header")
  }
  return config
})

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        setAccessToken(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        setAccessToken(null)
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login"
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
