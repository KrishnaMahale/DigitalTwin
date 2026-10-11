import axios, { AxiosInstance } from 'axios'

function resolveBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (!envUrl) {
    return 'http://localhost:8000/api'
  }
  let cleaned = envUrl.replace(/\/+$/, '')
  // If the user didn't include /api at the end, append it automatically
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`
  }
  return cleaned
}

export const API_BASE_URL = resolveBaseUrl()

// Safely determine mock mode:
// If explicitly 'false', it's false.
// If explicitly 'true', it's true.
// If unset, use live API if VITE_API_BASE_URL is provided, else fallback to mock.
export const IS_MOCK_API = (() => {
  const flag = String(import.meta.env.VITE_USE_MOCK_API ?? '').toLowerCase().trim()
  if (flag === 'false') return false
  if (flag === 'true') return true
  return !import.meta.env.VITE_API_BASE_URL
})()

export const MOCK_LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY_MS) || 250

if (typeof window !== 'undefined') {
  console.info(`[Grid Twin Engine] Mode: ${IS_MOCK_API ? 'SIMULATED MOCK' : 'LIVE BACKEND'}, Base URL: ${API_BASE_URL}`)
}

/**
 * Production-ready Axios instance pre-configured for FastAPI backend.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

// Request interceptor for optional authentication token injection
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('grid_twin_auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Client Error]:', error?.response?.data || error.message)
    return Promise.reject(error)
  }
)

/**
 * Utility helper to simulate network latency in mock mode.
 */
export const simulateLatency = (ms: number = MOCK_LATENCY): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
