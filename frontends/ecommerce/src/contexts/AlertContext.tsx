import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface DialogOptions {
  closeOnBackdropClick?: boolean
}

interface Dialog {
  id: string
  message: string
  type: 'alert' | 'confirm'
  closeOnBackdropClick: boolean
  resolve?: (value: boolean) => void
}

interface AlertContextType {
  showAlert: (message: string, options?: DialogOptions) => void
  showConfirm: (message: string, options?: DialogOptions) => Promise<boolean>
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [nextId, setNextId] = useState(0)

  const showAlert = (message: string, options?: DialogOptions) => {
    const id = String(nextId)
    setNextId(nextId + 1)
    setDialogs(prev => [...prev, {
      id,
      message,
      type: 'alert',
      closeOnBackdropClick: options?.closeOnBackdropClick ?? true
    }])
  }

  const showConfirm = (message: string, options?: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = String(nextId)
      setNextId(nextId + 1)
      setDialogs(prev => [...prev, {
        id,
        message,
        type: 'confirm',
        closeOnBackdropClick: options?.closeOnBackdropClick ?? false,
        resolve
      }])
    })
  }

  const closeDialog = (id: string, result?: boolean) => {
    const dialog = dialogs.find(d => d.id === id)
    if (dialog?.resolve && result !== undefined) {
      dialog.resolve(result)
    } else if (dialog?.resolve) {
      // X 버튼이나 backdrop 클릭으로 닫힐 때는 false 반환
      dialog.resolve(false)
    }
    setDialogs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialogs.map(dialog => (
        <div
          key={dialog.id}
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999] animate-fadeIn"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => {
            if (dialog.closeOnBackdropClick) {
              closeDialog(dialog.id)
            }
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X 버튼 - 외벽 클릭으로 닫히지 않는 경우에만 표시 */}
            {!dialog.closeOnBackdropClick && (
              <button
                onClick={() => closeDialog(dialog.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
                aria-label="닫기"
              >
                ✕
              </button>
            )}

            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl">🐹</span>
            </div>
            <p className="text-center text-gray-800 mb-6 whitespace-pre-line">
              {dialog.message}
            </p>
            {dialog.type === 'alert' ? (
              <button
                onClick={() => closeDialog(dialog.id)}
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
              >
                확인
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => closeDialog(dialog.id, false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => closeDialog(dialog.id, true)}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }
  return context
}
