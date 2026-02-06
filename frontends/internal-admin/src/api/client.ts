import axios from 'axios'

// Base URLs for services
const CASH_GATEWAY_API_URL = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8082'
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:8084'
const ECOMMERCE_API_URL = import.meta.env.VITE_ECOMMERCE_API_URL || 'http://localhost:8080'

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
 * Cash Gateway Service API Client
 */
export const gatewayClient = axios.create({
  baseURL: CASH_GATEWAY_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

gatewayClient.interceptors.request.use(createAuthInterceptor, (error) =>
  Promise.reject(error)
)

const gatewayInterceptor = createResponseInterceptor()
gatewayClient.interceptors.response.use(
  gatewayInterceptor.onSuccess,
  gatewayInterceptor.onError
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
 * Ecommerce Service API Client
 */
export const ecommerceClient = axios.create({
  baseURL: ECOMMERCE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

ecommerceClient.interceptors.request.use(createAuthInterceptor, (error) =>
  Promise.reject(error)
)

const ecommerceInterceptor = createResponseInterceptor()
ecommerceClient.interceptors.response.use(
  ecommerceInterceptor.onSuccess,
  ecommerceInterceptor.onError
)
