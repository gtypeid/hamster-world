import { useState } from 'react'
import type { StepReward, RewardType } from '@/types/progression'

interface StepRewardTableProps {
  basicRewards: Record<number, StepReward>
  vipBonusRewards: Record<number, StepReward>
  onBasicRewardsChange: (rewards: Record<number, StepReward>) => void
  onVipBonusRewardsChange: (rewards: Record<number, StepReward>) => void
}

export function StepRewardTable({
  basicRewards,
  vipBonusRewards,
  onBasicRewardsChange,
  onVipBonusRewardsChange,
}: StepRewardTableProps) {
  const [isAddingReward, setIsAddingReward] = useState(false)
  const [newStepNumber, setNewStepNumber] = useState<number>(1)

  // Get all steps that have rewards
  const allSteps = Array.from(
    new Set([...Object.keys(basicRewards).map(Number), ...Object.keys(vipBonusRewards).map(Number)])
  ).sort((a, b) => a - b)

  // Calculate maxStep from existing rewards
  const maxStep = allSteps.length > 0 ? Math.max(...allSteps) : 0

  const handleAddReward = () => {
    setIsAddingReward(true)
    // Suggest next step number
    let suggested = maxStep + 1
    if (suggested < 1) suggested = 1
    setNewStepNumber(suggested)
  }

  const handleConfirmAddReward = () => {
    if (newStepNumber < 1 || newStepNumber > 100) {
      alert('스텝 번호는 1~100 사이여야 합니다.')
      return
    }
    if (allSteps.includes(newStepNumber)) {
      alert(`${newStepNumber}단계는 이미 존재합니다. 다른 번호를 입력하세요.`)
      return
    }
    // Just close the modal - user will set rewards in the table
    setIsAddingReward(false)
    // Add empty row by setting a minimal reward
    onBasicRewardsChange({ ...basicRewards, [newStepNumber]: { rewardType: 'POINT', rewardAmount: 0 } })
  }

  const handleCancelAddReward = () => {
    setIsAddingReward(false)
  }

  const handleRemoveStep = (step: number) => {
    const newBasic = { ...basicRewards }
    const newVip = { ...vipBonusRewards }
    delete newBasic[step]
    delete newVip[step]
    onBasicRewardsChange(newBasic)
    onVipBonusRewardsChange(newVip)
  }

  const handleBasicRewardChange = (step: number, reward: StepReward | null) => {
    const newRewards = { ...basicRewards }
    if (reward) {
      newRewards[step] = reward
    } else {
      delete newRewards[step]
    }
    onBasicRewardsChange(newRewards)
  }

  const handleVipRewardChange = (step: number, reward: StepReward | null) => {
    const newRewards = { ...vipBonusRewards }
    if (reward) {
      newRewards[step] = reward
    } else {
      delete newRewards[step]
    }
    onVipBonusRewardsChange(newRewards)
  }

  return (
    <div className="space-y-4">
      {/* Add Reward Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {allSteps.length}개의 스텝에 보상이 설정되어 있습니다.
          {maxStep > 0 && <span className="ml-2 text-hamster-orange font-semibold">(최대 {maxStep}단계)</span>}
        </p>
        <button
          type="button"
          onClick={handleAddReward}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors font-medium"
        >
          + 보상 추가
        </button>
      </div>

      {/* Add Reward Modal */}
      {isAddingReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">보상 추가</h3>
            <p className="text-sm text-gray-600 mb-4">
              몇 단계에 보상을 추가하시겠습니까?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                스텝 번호 (1~100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newStepNumber}
                onChange={(e) => setNewStepNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-hamster-orange"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                현재 사용 중인 스텝: {allSteps.join(', ') || '없음'}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancelAddReward}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmAddReward}
                className="px-4 py-2 text-sm bg-hamster-orange hover:bg-orange-600 text-white rounded transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Table */}
      {allSteps.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm">보상이 설정된 스텝이 없습니다.</p>
          <p className="text-xs mt-1">위의 "보상 추가" 버튼을 눌러 스텝별 보상을 설정하세요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-2 border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">스텝</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  기본 보상
                  <span className="ml-2 text-xs font-normal text-gray-500">(모든 사용자)</span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  VIP 보너스
                  <span className="ml-2 text-xs font-normal text-gray-500">(VIP만)</span>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 w-20">삭제</th>
              </tr>
            </thead>
            <tbody>
              {allSteps.map((step) => {
                const basicReward = basicRewards[step]
                const vipReward = vipBonusRewards[step]

                return (
                  <tr
                    key={step}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-gray-900">{step}단계</td>

                    {/* Basic Reward */}
                    <td className="px-4 py-3">
                      <RewardInput
                        reward={basicReward}
                        onChange={(reward) => handleBasicRewardChange(step, reward)}
                        placeholder="기본 보상 없음"
                      />
                    </td>

                    {/* VIP Bonus */}
                    <td className="px-4 py-3">
                      <RewardInput
                        reward={vipReward}
                        onChange={(reward) => handleVipRewardChange(step, reward)}
                        placeholder="VIP 보너스 없음"
                      />
                    </td>

                    {/* Delete Button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(step)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        title="이 스텝 삭제"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
        <p className="font-semibold text-blue-800 mb-1">💡 보상 설정 안내</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>각 스텝에는 기본 보상과 VIP 보너스를 설정할 수 있습니다.</li>
          <li>기본 보상: 모든 사용자가 받을 수 있는 보상</li>
          <li>VIP 보너스: VIP 패스를 구매한 사용자만 추가로 받는 보상</li>
          <li>둘 다 설정하지 않으면 해당 스텝은 빈 스텝이 됩니다.</li>
        </ul>
      </div>
    </div>
  )
}

// Reward Input Component
interface RewardInputProps {
  reward?: StepReward
  onChange: (reward: StepReward | null) => void
  placeholder: string
}

function RewardInput({ reward, onChange, placeholder }: RewardInputProps) {
  const [hasReward, setHasReward] = useState(!!reward)
  const [rewardType, setRewardType] = useState<RewardType>(reward?.rewardType || 'POINT')
  const [rewardAmount, setRewardAmount] = useState(reward?.rewardAmount || 0)

  const handleToggle = (enabled: boolean) => {
    setHasReward(enabled)
    if (!enabled) {
      onChange(null)
    } else {
      onChange({ rewardType, rewardAmount })
    }
  }

  const handleTypeChange = (type: RewardType) => {
    setRewardType(type)
    if (hasReward) {
      onChange({ rewardType: type, rewardAmount })
    }
  }

  const handleAmountChange = (amount: number) => {
    setRewardAmount(amount)
    if (hasReward) {
      onChange({ rewardType, rewardAmount: amount })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={hasReward}
        onChange={(e) => handleToggle(e.target.checked)}
        className="text-hamster-orange focus:ring-hamster-orange"
      />

      {hasReward ? (
        <>
          <select
            value={rewardType}
            onChange={(e) => handleTypeChange(e.target.value as RewardType)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
          >
            <option value="POINT">포인트</option>
            <option value="COUPON">쿠폰</option>
          </select>
          <input
            type="number"
            min="1"
            value={rewardAmount}
            onChange={(e) => handleAmountChange(parseInt(e.target.value) || 0)}
            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-hamster-orange"
          />
          <span className="text-xs text-gray-600">
            {rewardType === 'POINT' ? '포인트' : '개'}
          </span>
        </>
      ) : (
        <span className="text-xs text-gray-400">{placeholder}</span>
      )}
    </div>
  )
}
