import { useState, type FormEvent } from 'react'
import { useCreateMid } from '../hooks/useMids'
import { Button } from '@/components/ui/Button'
import { MidSuccessModal } from './MidSuccessModal'
import type { PgMid } from '../types'

interface MidCreateFormProps {
  onSuccess?: () => void
}

export function MidCreateForm({ onSuccess }: MidCreateFormProps) {
  const [merchantName, setMerchantName] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [createdMid, setCreatedMid] = useState<PgMid | null>(null)
  const createMutation = useCreateMid()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!merchantName.trim()) {
      return
    }

    createMutation.mutate(
      { merchantName: merchantName.trim() },
      {
        onSuccess: (data) => {
          setCreatedMid(data)
          setMerchantName('')
          setIsOpen(false)
          onSuccess?.()
        },
      }
    )
  }

  const handleCloseSuccessModal = () => {
    setCreatedMid(null)
  }

  return (
    <>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)}>
          🐹 MID 생성
        </Button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-hamster-brown">
            새 MID 생성
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가맹점명
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hamster-orange focus:border-transparent"
                placeholder="예: 함스터 쇼핑몰"
                disabled={createMutation.isPending}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '생성 중...' : '생성'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsOpen(false)
                  setMerchantName('')
                }}
                disabled={createMutation.isPending}
              >
                취소
              </Button>
            </div>

            {createMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                😵 MID 생성에 실패했어요: {createMutation.error instanceof Error ? createMutation.error.message : '알 수 없는 오류'}
              </div>
            )}
          </form>
        </div>
      )}

      {/* 생성 성공 모달 */}
      <MidSuccessModal
        mid={createdMid}
        onClose={handleCloseSuccessModal}
      />
    </>
  )
}
