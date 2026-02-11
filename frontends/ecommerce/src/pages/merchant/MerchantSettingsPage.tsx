import { useState, useEffect } from 'react'
import { MerchantLayout } from '../../components/merchant/MerchantLayout'
import { useAlert } from '../../contexts/AlertContext'
import { useMyMerchant, useUpdateMerchant } from '../../hooks/useMerchant'
import type { SettlementCycle } from '../../types/merchant'

/**
 * 판매자 스토어 설정 페이지
 *
 * ## 기능
 * - 가맹점 기본 정보 설정
 * - 사업자 정보 설정
 * - 정산 정보 설정
 * - 스토어 운영 정보 설정
 */
export function MerchantSettingsPage() {
  const { showAlert } = useAlert()
  const { data: merchant, isLoading, error } = useMyMerchant()
  const updateMerchant = useUpdateMerchant()

  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    storeDescription: '',
    storeImageUrl: '',
    contactEmail: '',
    contactPhone: '',
    businessHours: ''
  })

  const [businessInfo, setBusinessInfo] = useState({
    businessNumber: '',
    businessName: '',
    ceoName: '',
    businessAddress: '',
    businessType: ''
  })

  const [settlementInfo, setSettlementInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    settlementCycle: 'WEEKLY' as SettlementCycle,
    feeRate: 0
  })

  const [isEditing, setIsEditing] = useState(false)

  // 머천트 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (merchant) {
      setStoreInfo({
        storeName: merchant.storeName,
        storeDescription: merchant.storeDescription || '',
        storeImageUrl: merchant.storeImageUrl || '',
        contactEmail: merchant.contactEmail,
        contactPhone: merchant.contactPhone,
        businessHours: merchant.operatingHours || ''
      })

      setBusinessInfo({
        businessNumber: merchant.businessNumber,
        businessName: merchant.businessName,
        ceoName: merchant.representativeName,
        businessAddress: merchant.businessAddress || '',
        businessType: merchant.businessType || ''
      })

      setSettlementInfo({
        bankName: merchant.bankName,
        accountNumber: merchant.accountNumber,
        accountHolder: merchant.accountHolder,
        settlementCycle: merchant.settlementCycle,
        feeRate: Number(merchant.platformCommissionRate)
      })
    }
  }, [merchant])

  const handleSave = async () => {
    if (!merchant) {
      showAlert('머천트 정보를 찾을 수 없습니다.')
      return
    }

    try {
      await updateMerchant.mutateAsync({
        merchantId: merchant.merchantPublicId,
        request: {
          // 스토어 정보
          storeName: storeInfo.storeName,
          storeDescription: storeInfo.storeDescription || undefined,
          storeImageUrl: storeInfo.storeImageUrl || undefined,
          contactEmail: storeInfo.contactEmail,
          contactPhone: storeInfo.contactPhone,
          operatingHours: storeInfo.businessHours || undefined,
          // 사업자 정보
          businessName: businessInfo.businessName,
          businessNumber: businessInfo.businessNumber,
          representativeName: businessInfo.ceoName,
          businessAddress: businessInfo.businessAddress || undefined,
          businessType: businessInfo.businessType || undefined,
          // 정산 정보
          bankName: settlementInfo.bankName,
          accountNumber: settlementInfo.accountNumber,
          accountHolder: settlementInfo.accountHolder,
          settlementCycle: settlementInfo.settlementCycle
        }
      })
      showAlert('스토어 설정이 저장되었습니다!')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update merchant:', error)
      showAlert('스토어 설정 저장에 실패했습니다.')
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <MerchantLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <span className="text-7xl animate-bounce block mb-4">🐹</span>
            <p className="text-xl text-gray-600">스토어 정보를 불러오는 중...</p>
          </div>
        </div>
      </MerchantLayout>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <MerchantLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <span className="text-7xl block mb-4">⚠️</span>
            <p className="text-xl text-gray-600 mb-4">스토어 정보를 불러오는데 실패했습니다.</p>
            <p className="text-sm text-gray-500">{String(error)}</p>
          </div>
        </div>
      </MerchantLayout>
    )
  }

  // 머천트가 없는 경우
  if (!merchant) {
    return (
      <MerchantLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <span className="text-7xl block mb-4">🏪</span>
            <p className="text-xl text-gray-600 mb-4">등록된 스토어 정보가 없습니다.</p>
            <p className="text-sm text-gray-500">먼저 판매자 신청을 완료해주세요.</p>
          </div>
        </div>
      </MerchantLayout>
    )
  }

  return (
    <MerchantLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hamster-brown mb-2">스토어 설정</h1>
            <p className="text-gray-600">가맹점 정보 및 정산 설정을 관리합니다</p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                  저장하기
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
              >
                수정하기
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 스토어 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-hamster-brown mb-6 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              스토어 기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  스토어명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeInfo.storeName}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  연락처 이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={storeInfo.contactEmail}
                  onChange={(e) => setStoreInfo({ ...storeInfo, contactEmail: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  연락처 전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={storeInfo.contactPhone}
                  onChange={(e) => setStoreInfo({ ...storeInfo, contactPhone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  운영 시간
                </label>
                <input
                  type="text"
                  value={storeInfo.businessHours}
                  onChange={(e) => setStoreInfo({ ...storeInfo, businessHours: e.target.value })}
                  disabled={!isEditing}
                  placeholder="예: 평일 09:00 - 18:00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  스토어 소개
                </label>
                <textarea
                  value={storeInfo.storeDescription}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeDescription: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  스토어 이미지 URL
                </label>
                <input
                  type="text"
                  value={storeInfo.storeImageUrl}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeImageUrl: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://example.com/store-image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* 사업자 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-hamster-brown mb-6 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              사업자 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  사업자 등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessInfo.businessNumber}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessNumber: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  상호명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  대표자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessInfo.ceoName}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, ceoName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  업태
                </label>
                <input
                  type="text"
                  value={businessInfo.businessType}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessType: e.target.value })}
                  disabled={!isEditing}
                  placeholder="예: 도소매업"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  사업장 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessInfo.businessAddress}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessAddress: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* 정산 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-hamster-brown mb-6 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              정산 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  은행명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settlementInfo.bankName}
                  onChange={(e) => setSettlementInfo({ ...settlementInfo, bankName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  계좌번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settlementInfo.accountNumber}
                  onChange={(e) => setSettlementInfo({ ...settlementInfo, accountNumber: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  예금주 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settlementInfo.accountHolder}
                  onChange={(e) => setSettlementInfo({ ...settlementInfo, accountHolder: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  정산 주기
                </label>
                <select
                  value={settlementInfo.settlementCycle}
                  onChange={(e) => setSettlementInfo({ ...settlementInfo, settlementCycle: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                >
                  <option value="DAILY">일정산</option>
                  <option value="WEEKLY">주정산</option>
                  <option value="MONTHLY">월정산</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  플랫폼 수수료율
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settlementInfo.feeRate}
                    disabled
                    className="w-32 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <span className="text-gray-600">%</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (플랫폼에서 관리하는 항목입니다)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 스토어 운영 상태 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-hamster-brown mb-6 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              스토어 운영 설정
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">스토어 공개 상태</h3>
                  <p className="text-sm text-gray-600">스토어를 고객에게 공개합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">주문 접수 자동 승인</h3>
                  <p className="text-sm text-gray-600">새로운 주문을 자동으로 승인합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  )
}
