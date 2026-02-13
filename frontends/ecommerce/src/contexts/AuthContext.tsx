import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import Keycloak from 'keycloak-js'
import { useAlert } from './AlertContext'
import { setKeycloakTokenProvider } from '../api/client'
import { userService } from '../services/userService'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id: string
    username: string
    email?: string
    name?: string
    role?: 'USER' | 'MERCHANT' | 'ADMIN'
  } | null
  login: () => void
  logout: () => void
  register: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showAlert } = useAlert()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const keycloakRef = useRef<Keycloak | null>(null)
  const initializeRef = useRef(false)

  // Keycloak 인스턴스 초기화
  if (!keycloakRef.current) {
    keycloakRef.current = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    })
  }

  const keycloak = keycloakRef.current

  // Keycloak 토큰에서 역할 추출
  const extractRoleFromToken = (tokenParsed: any): 'USER' | 'MERCHANT' | 'ADMIN' => {
    const roles = tokenParsed?.realm_access?.roles || []

    // 우선순위: ADMIN > MERCHANT > USER
    if (roles.includes('ADMIN')) return 'ADMIN'
    if (roles.includes('MERCHANT')) return 'MERCHANT'
    return 'USER'
  }

  useEffect(() => {
    // 이미 초기화 시도했으면 스킵
    if (initializeRef.current) {
      console.log('[Keycloak] Already initialized, skipping')
      return
    }

    initializeRef.current = true
    console.log('[Keycloak] Starting initialization...')

    // Axios interceptor에 Keycloak 토큰 제공자 등록
    setKeycloakTokenProvider(() => keycloak.token || null)
    console.log('[Keycloak] Token provider registered to axios')

    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        // HTTP 환경(AWS IP 직접 접속)에서는 Web Crypto API 사용 불가 → PKCE 비활성화
        ...(window.isSecureContext ? {} : { pkceMethod: false as any }),
      })
      .then((authenticated) => {
        console.log('[Keycloak] Initialization successful, authenticated:', authenticated)
        setIsAuthenticated(authenticated)

        if (authenticated && keycloak.tokenParsed) {
          const tokenParsed = keycloak.tokenParsed
          const keycloakUserId = tokenParsed.sub || ''
          const keycloakRole = extractRoleFromToken(tokenParsed)

          // 백엔드 User API에서 실제 role 가져오기
          userService.getCurrentUser(keycloakUserId, keycloak.token!)
            .then(backendUser => {
              setUser({
                id: keycloakUserId,
                username: tokenParsed.preferred_username || '',
                email: tokenParsed.email,
                name: tokenParsed.name,
                role: backendUser.role, // 백엔드 User의 role 사용
              })
              console.log('[Keycloak] User role from backend:', backendUser.role)
              setIsLoading(false)
            })
            .catch(() => {
              // 백엔드 API 실패 시 Keycloak 토큰의 role 사용
              setUser({
                id: keycloakUserId,
                username: tokenParsed.preferred_username || '',
                email: tokenParsed.email,
                name: tokenParsed.name,
                role: keycloakRole,
              })
              console.log('[Keycloak] User role from token (fallback):', keycloakRole)
              setIsLoading(false)
            })
        } else {
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('[Keycloak] initialization failed:', error)
        setIsLoading(false)
      })

    // Token refresh
    const refreshInterval = setInterval(() => {
      keycloak.updateToken(70).then((refreshed) => {
        if (refreshed && keycloak.tokenParsed) {
          const tokenParsed = keycloak.tokenParsed
          const keycloakUserId = tokenParsed.sub || ''

          // 토큰이 갱신되면 백엔드 User API에서 최신 role 가져오기
          userService.getCurrentUser(keycloakUserId, keycloak.token!)
            .then(backendUser => {
              setUser({
                id: keycloakUserId,
                username: tokenParsed.preferred_username || '',
                email: tokenParsed.email,
                name: tokenParsed.name,
                role: backendUser.role,
              })
              console.log('[Keycloak] Token refreshed, user role from backend:', backendUser.role)
            })
            .catch(() => {
              // Fallback to Keycloak role
              setUser({
                id: keycloakUserId,
                username: tokenParsed.preferred_username || '',
                email: tokenParsed.email,
                name: tokenParsed.name,
                role: extractRoleFromToken(tokenParsed),
              })
            })
        }
      }).catch(() => {
        console.error('Failed to refresh token')
      })
    }, 60000) // Check every minute

    return () => clearInterval(refreshInterval)
  }, [])

  const login = () => {
    try {
      keycloak.login()
    } catch (error) {
      console.error('Login failed:', error)
      showAlert('로그인 기능을 사용할 수 없습니다. Keycloak 서버가 실행 중인지 확인해주세요.')
    }
  }

  const logout = () => {
    try {
      keycloak.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const register = () => {
    try {
      keycloak.register()
    } catch (error) {
      console.error('Register failed:', error)
      showAlert('회원가입 기능을 사용할 수 없습니다. Keycloak 서버가 실행 중인지 확인해주세요.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        register,
        token: keycloak.token || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
