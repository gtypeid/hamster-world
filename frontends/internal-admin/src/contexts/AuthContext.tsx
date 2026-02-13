import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import Keycloak from 'keycloak-js'
import { setKeycloakTokenProvider } from '../api/client'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id: string
    username: string
    email?: string
    name?: string
    isDeveloper: boolean
  } | null
  login: () => void
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
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

  // Keycloak 토큰에서 DEVELOPER 역할 확인
  const isDeveloperRole = (tokenParsed: any): boolean => {
    const roles = tokenParsed?.realm_access?.roles || []
    return roles.includes('DEVELOPER')
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
        onLoad: 'check-sso', // SSO 체크만 수행 (자동 리다이렉트 안함)
        checkLoginIframe: false,
        // HTTP 환경(AWS IP 직접 접속)에서는 Web Crypto API 사용 불가 → PKCE 비활성화
        ...(window.isSecureContext ? {} : { pkceMethod: '' as any }),
      })
      .then((authenticated) => {
        console.log('[Keycloak] Initialization successful, authenticated:', authenticated)
        setIsAuthenticated(authenticated)

        if (authenticated && keycloak.tokenParsed) {
          const isDeveloper = isDeveloperRole(keycloak.tokenParsed)

          // DEVELOPER 권한이 없으면 로그아웃
          if (!isDeveloper) {
            console.error('[Keycloak] User does not have DEVELOPER role')
            alert('개발자 권한이 필요합니다. DEVELOPER role이 할당되어 있지 않습니다.')
            keycloak.logout()
            setIsLoading(false)
            return
          }

          setUser({
            id: keycloak.tokenParsed.sub || '',
            username: keycloak.tokenParsed.preferred_username || '',
            email: keycloak.tokenParsed.email,
            name: keycloak.tokenParsed.name,
            isDeveloper: true,
          })
          console.log('[Keycloak] Developer user logged in:', keycloak.tokenParsed.preferred_username)
          setIsLoading(false)
        } else {
          // 로그인되지 않은 상태 - 로그인 페이지로 보냄 (라우터에서 처리)
          console.log('[Keycloak] Not authenticated, user should visit /login')
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('[Keycloak] initialization failed:', error)
        setIsLoading(false)
      })

    // Token refresh
    const refreshInterval = setInterval(() => {
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed && keycloak.tokenParsed) {
            const isDeveloper = isDeveloperRole(keycloak.tokenParsed)

            if (!isDeveloper) {
              console.error('[Keycloak] User lost DEVELOPER role')
              keycloak.logout()
              return
            }

            setUser({
              id: keycloak.tokenParsed.sub || '',
              username: keycloak.tokenParsed.preferred_username || '',
              email: keycloak.tokenParsed.email,
              name: keycloak.tokenParsed.name,
              isDeveloper: true,
            })
            console.log('[Keycloak] Token refreshed')
          }
        })
        .catch(() => {
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
      alert('로그인 기능을 사용할 수 없습니다. Keycloak 서버가 실행 중인지 확인해주세요.')
    }
  }

  const logout = () => {
    try {
      keycloak.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
