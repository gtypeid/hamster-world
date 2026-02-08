import type { QuotaMaster } from '@/types/progression'

/**
 * Mock Quota 데이터
 * 실제 백엔드 연동 전까지 사용
 */
export const mockQuotas: QuotaMaster[] = [
  {
    quotaId: '1',
    quotaKey: 'WEEKLY_SHOPPER',
    name: '주간 쇼핑왕',
    description: '일주일에 5회 주문하면 보너스 포인트 지급',
    cycleType: 'WEEKLY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 5,
    condition: {
      type: 'CREATE_ORDER',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 300,
    sortOrder: 100,
  },
  {
    quotaId: '2',
    quotaKey: 'DAILY_ORDER',
    name: '일일 주문',
    description: '매일 1회 주문 시 포인트 지급',
    cycleType: 'DAILY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 1,
    condition: {
      type: 'CREATE_ORDER',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 50,
    sortOrder: 50,
  },
  {
    quotaId: '3',
    quotaKey: 'WEEKLY_SELLER',
    name: '주간 판매왕',
    description: '일주일에 3개 상품 등록 시 포인트 지급',
    cycleType: 'WEEKLY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 3,
    condition: {
      type: 'CREATE_PRODUCT',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 200,
    sortOrder: 150,
  },
  {
    quotaId: '4',
    quotaKey: 'WEEKLY_REVIEW',
    name: '주간 리뷰왕',
    description: '일주일에 리뷰 3개 작성 시 쿠폰 지급',
    cycleType: 'WEEKLY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 3,
    condition: {
      type: 'CREATE_REVIEW',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'COUPON',
    rewardAmount: 1,
    sortOrder: 120,
  },
  {
    quotaId: '5',
    quotaKey: 'MONTHLY_VIP',
    name: '월간 VIP 고객',
    description: '한 달에 10회 주문 시 특별 보상',
    cycleType: 'MONTHLY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 10,
    condition: {
      type: 'CREATE_ORDER',
      requirement: 1,
      filtersJson: '{"minAmount":"50000"}',
    },
    rewardType: 'POINT',
    rewardAmount: 1000,
    sortOrder: 200,
  },
  {
    quotaId: '6',
    quotaKey: 'DAILY_LOGIN',
    name: '일일 출석 체크',
    description: '매일 로그인 시 포인트 지급',
    cycleType: 'DAILY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 1,
    condition: {
      type: 'USER_LOGIN',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 10,
    sortOrder: 10,
  },
  {
    quotaId: '7',
    quotaKey: 'WEEKLY_REGION_SHOPPER',
    name: '성수동 단골 고객',
    description: '성수동 지역에서 주간 3회 주문 시 포인트 지급',
    cycleType: 'WEEKLY',
    quotaType: 'ACTION_REWARD',
    maxLimit: 3,
    condition: {
      type: 'CREATE_ORDER',
      requirement: 1,
      filtersJson: '{"region":"성수동"}',
    },
    rewardType: 'POINT',
    rewardAmount: 500,
    sortOrder: 110,
  },
]

/**
 * CSV Export용 헬퍼 함수
 */
export function convertQuotaToCSV(quotas: QuotaMaster[]): string {
  const headers = [
    'quota_id',
    'quota_key',
    'name',
    'description',
    'cycle_type',
    'quota_type',
    'max_limit',
    'condition_type',
    'condition_filters',
    'requirement',
    'reward_type',
    'reward_amount',
    'sort_order',
  ].join(',')

  const rows = quotas.map((quota) => {
    return [
      quota.quotaId,
      quota.quotaKey,
      quota.name,
      quota.description,
      quota.cycleType,
      quota.quotaType,
      quota.maxLimit,
      quota.condition.type,
      quota.condition.filtersJson || '{}',
      quota.condition.requirement,
      quota.rewardType || '',
      quota.rewardAmount || '',
      quota.sortOrder,
    ].join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * CSV 다운로드 헬퍼
 */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
