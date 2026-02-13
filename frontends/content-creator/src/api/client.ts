import axios from 'axios'

// localhost 폴백 제거: 환경변수 누락 시 조용히 localhost로 요청하면
// AWS 배포 등에서 원인 파악이 어려운 버그가 됨. 누락 시 즉시 에러가 나야 빠르게 해결 가능.
const PROGRESSION_API_URL = import.meta.env.VITE_PROGRESSION_API_URL
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL
const DELIVERY_API_URL = import.meta.env.VITE_DELIVERY_API_URL

/**
 * Keycloak 토큰 가져오기 함수
 * AuthContext에서 이 함수를 호출하여 토큰 제공자를 설정
 */
let getKeycloakToken: (() => string | null) | null = null

export function setKeycloakTokenProvider(provider: () => string | null) {
  getKeycloakToken = provider
}

/**
 * Request interceptor - Add Keycloak JWT token
 */
function createAuthInterceptor(config: any) {
  const token = getKeycloakToken?.()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

/**
 * Response interceptor - Handle common errors
 */
function createResponseInterceptor() {
  return {
    onSuccess: (response: any) => response,
    onError: (error: any) => {
      if (error.response?.status === 401) {
        console.error('[API Client] 401 Unauthorized - Token may be expired')
      }

      if (error.response?.status === 403) {
        console.error('[API Client] 403 Forbidden - Insufficient permissions')
      }

      if (error.response?.status === 500) {
        console.error('[API Client] 500 Server Error:', error.response.data)
      }

      return Promise.reject(error)
    },
  }
}

/**
 * Progression Service API Client
 */
export const progressionClient = axios.create({
  baseURL: PROGRESSION_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

progressionClient.interceptors.request.use(createAuthInterceptor, (error) =>
  Promise.reject(error)
)

const progressionInterceptor = createResponseInterceptor()
progressionClient.interceptors.response.use(
  progressionInterceptor.onSuccess,
  progressionInterceptor.onError
)

/**
 * Payment Service API Client
 */
export const paymentClient = axios.create({
  baseURL: PAYMENT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

paymentClient.interceptors.request.use(createAuthInterceptor, (error) =>
  Promise.reject(error)
)

const paymentInterceptor = createResponseInterceptor()
paymentClient.interceptors.response.use(
  paymentInterceptor.onSuccess,
  paymentInterceptor.onError
)

/**
 * Delivery Service API Client
 */
export const deliveryClient = axios.create({
  baseURL: DELIVERY_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

deliveryClient.interceptors.request.use(createAuthInterceptor, (error) =>
  Promise.reject(error)
)

const deliveryInterceptor = createResponseInterceptor()
deliveryClient.interceptors.response.use(
  deliveryInterceptor.onSuccess,
  deliveryInterceptor.onError
)
