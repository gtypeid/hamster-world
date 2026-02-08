import type { SeasonPromotionMaster, StepReward } from '@/types/progression'

/**
 * Mock Season Promotion 데이터
 * 실제 백엔드 연동 전까지 사용
 */
export const mockSeasonPromotions: SeasonPromotionMaster[] = [
  // 1. 봄맞이 프로모션 (고객용, 주문 기반)
  {
    promotionId: 'SPRING_2025',
    title: '봄맞이 대축제',
    description: '3월 한 달간 주문할 때마다 스텝이 올라갑니다! 20단계까지 달성하고 푸짐한 보상을 받으세요.',
    targetRole: 'CUSTOMER',
    startAt: '2025-03-01T00:00:00',
    endAt: '2025-03-31T23:59:59',
    maxStep: 20,
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 1,
      filtersJson: '{}',
    },
    basicRewards: {
      1: { rewardType: 'POINT', rewardAmount: 100 },
      3: { rewardType: 'POINT', rewardAmount: 200 },
      5: { rewardType: 'POINT', rewardAmount: 500 },
      7: { rewardType: 'COUPON', rewardAmount: 1 },
      10: { rewardType: 'POINT', rewardAmount: 1000 },
      15: { rewardType: 'COUPON', rewardAmount: 1 },
      20: { rewardType: 'POINT', rewardAmount: 5000 },
    },
    vipBonusRewards: {
      1: { rewardType: 'POINT', rewardAmount: 50 },
      5: { rewardType: 'POINT', rewardAmount: 300 },
      10: { rewardType: 'POINT', rewardAmount: 500 },
      15: { rewardType: 'COUPON', rewardAmount: 1 },
      20: { rewardType: 'POINT', rewardAmount: 3000 },
    },
    sortOrder: 10,
  },

  // 2. 여름 리뷰 이벤트 (고객용, 리뷰 기반)
  {
    promotionId: 'SUMMER_REVIEW_2025',
    title: '여름 리뷰왕 도전',
    description: '6월 한 달간 리뷰를 작성하고 최대 10단계까지 도전하세요!',
    targetRole: 'CUSTOMER',
    startAt: '2025-06-01T00:00:00',
    endAt: '2025-06-30T23:59:59',
    maxStep: 10,
    condition: {
      type: 'CREATE_REVIEW',
      requirement: 1,
      filtersJson: '{}',
    },
    basicRewards: {
      1: { rewardType: 'POINT', rewardAmount: 200 },
      3: { rewardType: 'POINT', rewardAmount: 500 },
      5: { rewardType: 'COUPON', rewardAmount: 1 },
      7: { rewardType: 'POINT', rewardAmount: 1000 },
      10: { rewardType: 'POINT', rewardAmount: 3000 },
    },
    vipBonusRewards: {
      3: { rewardType: 'POINT', rewardAmount: 300 },
      5: { rewardType: 'POINT', rewardAmount: 500 },
      10: { rewardType: 'POINT', rewardAmount: 2000 },
    },
    sortOrder: 20,
  },

  // 3. 라이더 챌린지 - 성수동 5건 달성 (단기)
  {
    promotionId: 'RIDER_SEONGSU_5',
    title: '성수동 5건 달성 챌린지',
    description: '오늘 하루 성수동에서 배달 5건 완료하고 보상 받기!',
    targetRole: 'RIDER',
    startAt: '2026-02-08T00:00:00',
    endAt: '2026-02-08T23:59:59',
    maxStep: 5,
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 1,
      filtersJson: '{"region":"성수동"}',
    },
    basicRewards: {
      1: { rewardType: 'POINT', rewardAmount: 500 },
      3: { rewardType: 'POINT', rewardAmount: 1500 },
      5: { rewardType: 'POINT', rewardAmount: 5000 },
    },
    vipBonusRewards: {
      5: { rewardType: 'POINT', rewardAmount: 2000 },
    },
    sortOrder: 30,
  },

  // 4. 라이더 챌린지 - 강남 10건 챌린지 (주간)
  {
    promotionId: 'RIDER_GANGNAM_10',
    title: '강남 10건 챌린지',
    description: '이번 주 강남에서 배달 10건 완료 시 푸짐한 보상!',
    targetRole: 'RIDER',
    startAt: '2026-02-03T00:00:00',
    endAt: '2026-02-09T23:59:59',
    maxStep: 10,
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 1,
      filtersJson: '{"region":"강남"}',
    },
    basicRewards: {
      3: { rewardType: 'POINT', rewardAmount: 1000 },
      5: { rewardType: 'POINT', rewardAmount: 2000 },
      7: { rewardType: 'POINT', rewardAmount: 3000 },
      10: { rewardType: 'POINT', rewardAmount: 10000 },
    },
    vipBonusRewards: {
      5: { rewardType: 'POINT', rewardAmount: 1000 },
      10: { rewardType: 'POINT', rewardAmount: 5000 },
    },
    sortOrder: 31,
  },

  // 5. 라이더 챌린지 - 런치타임 특급 (시간대)
  {
    promotionId: 'RIDER_LUNCH_RUSH',
    title: '런치타임 특급 챌린지',
    description: '오늘 점심시간(11~14시) 배달 완료하고 추가 보너스 받기!',
    targetRole: 'RIDER',
    startAt: '2026-02-08T11:00:00',
    endAt: '2026-02-08T14:00:00',
    maxStep: 3,
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 1,
      filtersJson: '{"timeSlot":"LUNCH"}',
    },
    basicRewards: {
      1: { rewardType: 'POINT', rewardAmount: 1000 },
      2: { rewardType: 'POINT', rewardAmount: 2000 },
      3: { rewardType: 'POINT', rewardAmount: 5000 },
    },
    vipBonusRewards: {
      3: { rewardType: 'POINT', rewardAmount: 3000 },
    },
    sortOrder: 32,
  },

  // 6. 라이더 챌린지 - 종료된 이벤트
  {
    promotionId: 'RIDER_WEEKEND_ENDED',
    title: '주말 배달왕 (종료)',
    description: '지난 주말 진행된 챌린지입니다.',
    targetRole: 'RIDER',
    startAt: '2026-02-01T00:00:00',
    endAt: '2026-02-02T23:59:59',
    maxStep: 8,
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 1,
      filtersJson: '{}',
    },
    basicRewards: {
      3: { rewardType: 'POINT', rewardAmount: 1000 },
      5: { rewardType: 'POINT', rewardAmount: 3000 },
      8: { rewardType: 'POINT', rewardAmount: 8000 },
    },
    vipBonusRewards: {
      8: { rewardType: 'POINT', rewardAmount: 4000 },
    },
    sortOrder: 33,
  },

  // 7. 종료된 고객 프로모션 (예시)
  {
    promotionId: 'WINTER_2024',
    title: '겨울 특별 프로모션',
    description: '2024년 12월 한 달간 진행된 이벤트입니다.',
    targetRole: 'CUSTOMER',
    startAt: '2024-12-01T00:00:00',
    endAt: '2024-12-31T23:59:59',
    maxStep: 10,
    condition: {
      type: 'CREATE_ORDER',
      requirement: 1,
      filtersJson: '{}',
    },
    basicRewards: {
      1: { rewardType: 'POINT', rewardAmount: 100 },
      5: { rewardType: 'POINT', rewardAmount: 500 },
      10: { rewardType: 'POINT', rewardAmount: 2000 },
    },
    vipBonusRewards: {
      5: { rewardType: 'POINT', rewardAmount: 300 },
      10: { rewardType: 'POINT', rewardAmount: 1000 },
    },
    sortOrder: 40,
  },
]

/**
 * CSV Export용 헬퍼 함수
 */
export function convertSeasonPromotionToCSV(promotions: SeasonPromotionMaster[]): string {
  const headers = [
    'promotion_id',
    'title',
    'description',
    'target_role',
    'start_at',
    'end_at',
    'max_step',
    'condition_type',
    'condition_requirement',
    'condition_filters',
    'sort_order',
  ].join(',')

  const rows = promotions.map((promo) => {
    return [
      promo.promotionId,
      `"${promo.title}"`,
      `"${promo.description}"`,
      promo.targetRole,
      promo.startAt,
      promo.endAt,
      promo.maxStep,
      promo.condition.type,
      promo.condition.requirement,
      `"${promo.condition.filtersJson}"`,
      promo.sortOrder,
    ].join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * 보상 CSV Export (별도 파일)
 */
export function convertRewardsToCSV(promotions: SeasonPromotionMaster[]): string {
  const headers = ['promotion_id', 'step', 'is_vip_bonus', 'reward_type', 'reward_amount'].join(',')

  const rows: string[] = []

  promotions.forEach((promo) => {
    // Basic rewards
    Object.entries(promo.basicRewards).forEach(([step, reward]) => {
      rows.push([promo.promotionId, step, 'false', reward.rewardType, reward.rewardAmount].join(','))
    })

    // VIP bonus rewards
    Object.entries(promo.vipBonusRewards).forEach(([step, reward]) => {
      rows.push([promo.promotionId, step, 'true', reward.rewardType, reward.rewardAmount].join(','))
    })
  })

  return [headers, ...rows].join('\n')
}

/**
 * CSV 다운로드 헬퍼
 */
export function downloadSeasonPromotionCSV(filename: string, content: string) {
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
