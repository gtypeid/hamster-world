import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <span className="text-9xl block mb-4">😵</span>
            <h1 className="text-3xl font-bold text-hamster-brown mb-4">
              앗! 문제가 발생했어요
            </h1>
            <p className="text-gray-600 mb-2">
              예상치 못한 오류가 발생했습니다.
            </p>
            {this.state.error && (
              <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-300 transition-colors"
              >
                다시 시도
              </button>
              <a
                href="/"
                className="inline-block bg-amber-500 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
              >
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
