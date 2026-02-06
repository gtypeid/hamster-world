import axios from 'axios'

// Base URL for ecommerce service
const ECOMMERCE_API_BASE_URL = import.meta.env.VITE_ECOMMERCE_API_URL || 'http://localhost:8080'

/**
 * Axios 인스턴스 for ecommerce-service
 *
 * 백엔드 서버: http://localhost:8080
 * 인증: Keycloak JWT Bearer Token
 * Resource Server: OAuth2 JWT 검증
 */
export const apiClient = axios.create({
  baseURL: ECOMMERCE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Keycloak 토큰 가져오기 함수
let getKeycloakToken: (() => string | null) | null = null

/**
 * Keycloak 토큰 제공자 등록
 * AuthContext에서 이 함수를 호출하여 토큰 제공자를 설정
 */
export function setKeycloakTokenProvider(provider: () => string | null) {
  getKeycloakToken = provider
}

// Request interceptor - Add Keycloak JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = getKeycloakToken?.()

    // 토큰이 있으면 추가 (로그인 상태)
    // 토큰이 없으면 추가 안함 (비로그인 상태 = Anonymous)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.error('[apiClient] 401 Unauthorized - Token may be expired')
      // Keycloak will handle token refresh automatically
    }

    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      console.error('[apiClient] 403 Forbidden - Insufficient permissions')
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('[apiClient] 500 Server Error:', error.response.data)
    }

    return Promise.reject(error)
  }
)
