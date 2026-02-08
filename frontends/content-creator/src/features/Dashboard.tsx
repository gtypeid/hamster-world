export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hamster-brown mb-2">
          Content Creator Dashboard
        </h1>
        <p className="text-gray-600">
          Hamster World 컨텐츠 제작 및 관리 도구
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Progression */}
        <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
          <div className="text-4xl mb-3">🎮</div>
          <h3 className="text-lg font-bold text-hamster-brown mb-2">
            Progression System
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Quota, Archive, Milestone, Season Promotion 관리
          </p>
          <div className="text-sm text-gray-500">
            <div>• Quota: 주기적 보상 시스템</div>
            <div>• Archive: 업적 시스템</div>
            <div>• Milestone: 다단계 진행</div>
            <div>• Season: 배틀패스 시스템</div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
          <div className="text-4xl mb-3">💰</div>
          <h3 className="text-lg font-bold text-hamster-brown mb-2">
            Payment System
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Coupon (Gacha) 확률 설정
          </p>
          <div className="text-sm text-gray-500">
            <div>• Coupon Editor: 확률 설정</div>
            <div>• Gacha Simulator: 시뮬레이션</div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-lg border-2 border-green-200 p-6">
          <div className="text-4xl mb-3">🚚</div>
          <h3 className="text-lg font-bold text-hamster-brown mb-2">
            Delivery System
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Rider 및 Region 관리
          </p>
          <div className="text-sm text-gray-500">
            <div>• Rider Management: Rider 생성/수정</div>
            <div>• Region Management: Region 관리</div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-hamster-ivory border-2 border-hamster-beige rounded-lg p-6">
        <h3 className="text-lg font-bold text-hamster-brown mb-3">
          📝 Quick Start
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div>1. 좌측 메뉴에서 관리할 항목 선택</div>
          <div>2. Form을 통해 컨텐츠 생성/수정</div>
          <div>3. Preview로 확인 후 저장</div>
          <div>4. CSV Export 또는 DB 저장</div>
        </div>
      </div>
    </div>
  )
}
