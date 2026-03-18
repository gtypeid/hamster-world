import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { PgMid } from '../types'

interface MidSuccessModalProps {
  mid: PgMid | null
  onClose: () => void
}

export function MidSuccessModal({ mid, onClose }: MidSuccessModalProps) {
  if (!mid) return null

  return (
    <Modal
      isOpen={!!mid}
      onClose={onClose}
      title="🐹 MID가 생성되었어요!"
      footer={
        <Button onClick={onClose}>
          확인
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">생성이 완료되었습니다!</p>
            <p className="text-sm text-green-600 mt-1">
              아래 정보를 안전하게 보관해주세요.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              MID ID
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all">
              {mid.midId}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              가맹점명
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              {mid.merchantName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Secret Key (API Key)
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all">
              {mid.apiKey}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
