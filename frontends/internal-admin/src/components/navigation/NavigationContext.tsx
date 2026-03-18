import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { NavigationState, NavigationAction, NavigationItem } from '@/types/navigation'

/**
 * Navigation Context
 * - 전역 네비게이션 상태 관리
 */
interface NavigationContextType {
  state: NavigationState
  navigate: (item: NavigationItem) => void
  goBack: () => void
  goForward: () => void
  clear: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

/**
 * 초기 상태
 */
const initialState: NavigationState = {
  stack: {
    items: [],
    currentIndex: -1,
  },
  isLoading: false,
  error: null,
}

/**
 * Reducer
 */
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NAVIGATE': {
      // 현재 표시 중인 항목과 동일한 ID면 무시
      const currentItem = state.stack.items[state.stack.currentIndex]
      if (
        currentItem &&
        currentItem.id === action.item.id &&
        currentItem.type === action.item.type
      ) {
        return state
      }

      // 스택에서 동일한 ID 찾기
      const existingIndex = state.stack.items.findIndex(
        (item) => item.id === action.item.id && item.type === action.item.type
      )

      // 이미 스택에 있으면 그 위치로 이동 (브라우저 히스토리처럼 항목 유지)
      if (existingIndex !== -1) {
        return {
          ...state,
          stack: {
            ...state.stack,
            currentIndex: existingIndex, // 인덱스만 이동, 항목은 유지
          },
          error: null,
        }
      }

      // 새로운 ID면 현재 위치 이후의 히스토리 제거하고 추가
      const newItems = [
        ...state.stack.items.slice(0, state.stack.currentIndex + 1),
        action.item,
      ]
      return {
        ...state,
        stack: {
          items: newItems,
          currentIndex: newItems.length - 1,
        },
        error: null,
      }
    }

    case 'GO_BACK': {
      if (state.stack.currentIndex <= 0) return state
      return {
        ...state,
        stack: {
          ...state.stack,
          currentIndex: state.stack.currentIndex - 1,
        },
      }
    }

    case 'GO_FORWARD': {
      if (state.stack.currentIndex >= state.stack.items.length - 1) return state
      return {
        ...state,
        stack: {
          ...state.stack,
          currentIndex: state.stack.currentIndex + 1,
        },
      }
    }

    case 'CLEAR': {
      return {
        ...state,
        stack: {
          items: [],
          currentIndex: -1,
        },
        error: null,
      }
    }

    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.isLoading,
      }
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.error,
        isLoading: false,
      }
    }

    default:
      return state
  }
}

/**
 * Provider
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState)

  const navigate = (item: NavigationItem) => {
    dispatch({ type: 'NAVIGATE', item })
  }

  const goBack = () => {
    dispatch({ type: 'GO_BACK' })
  }

  const goForward = () => {
    dispatch({ type: 'GO_FORWARD' })
  }

  const clear = () => {
    dispatch({ type: 'CLEAR' })
  }

  const setLoading = (isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', isLoading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', error })
  }

  return (
    <NavigationContext.Provider
      value={{ state, navigate, goBack, goForward, clear, setLoading, setError }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

/**
 * Hook
 */
export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
