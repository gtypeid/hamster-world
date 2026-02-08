import type { ArchiveMaster } from '@/types/progression'

/**
 * Mock Archive 데이터
 * 실제 백엔드 연동 전까지 사용
 */
export const mockArchives: ArchiveMaster[] = [
  // EVENT_BASED Archives
  {
    archiveId: '1',
    archiveCode: 'FIRST_ORDER',
    name: '첫 주문 완료',
    description: '첫 번째 주문을 완료하세요',
    archiveType: 'ORDER',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 500,
    sortOrder: 10,
  },
  {
    archiveId: '2',
    archiveCode: 'ORDER_MASTER_10',
    name: '주문왕 - 브론즈',
    description: '주문을 10회 완료하세요',
    archiveType: 'ORDER',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 10,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 2000,
    sortOrder: 20,
  },
  {
    archiveId: '3',
    archiveCode: 'ORDER_MASTER_50',
    name: '주문왕 - 실버',
    description: '주문을 50회 완료하세요',
    archiveType: 'ORDER',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 50,
      filtersJson: '{}',
    },
    rewardType: 'COUPON',
    rewardAmount: 1,
    sortOrder: 30,
  },
  {
    archiveId: '4',
    archiveCode: 'REVIEW_MASTER_5',
    name: '리뷰 마스터',
    description: '리뷰를 5개 작성하세요',
    archiveType: 'ORDER',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'CREATE_REVIEW',
      requirement: 5,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 1000,
    sortOrder: 40,
  },
  {
    archiveId: '5',
    archiveCode: 'REGION_EXPLORER',
    name: '성수동 탐험가',
    description: '성수동 지역에서 10회 주문하세요',
    archiveType: 'ORDER',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'COMPLETE_ORDER',
      requirement: 10,
      filtersJson: '{"region":"성수동"}',
    },
    rewardType: 'POINT',
    rewardAmount: 3000,
    sortOrder: 50,
  },

  // STAT_BASED Archives
  {
    archiveId: '6',
    archiveCode: 'TOTAL_PURCHASE_100K',
    name: '누적 구매 10만원',
    description: '누적 구매 금액 10만원을 달성하세요',
    archiveType: 'ORDER',
    progressType: 'STAT_BASED',
    statKey: 'TOTAL_PURCHASE_AMOUNT',
    rewardType: 'POINT',
    rewardAmount: 5000,
    sortOrder: 60,
  },
  {
    archiveId: '7',
    archiveCode: 'TOTAL_PURCHASE_500K',
    name: '누적 구매 50만원',
    description: '누적 구매 금액 50만원을 달성하세요',
    archiveType: 'ORDER',
    progressType: 'STAT_BASED',
    statKey: 'TOTAL_PURCHASE_AMOUNT',
    rewardType: 'COUPON',
    rewardAmount: 1,
    sortOrder: 70,
  },
  {
    archiveId: '8',
    archiveCode: 'MERCHANT_FIRST_PRODUCT',
    name: '첫 상품 등록',
    description: '첫 번째 상품을 등록하세요',
    archiveType: 'MERCHANT',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'CREATE_PRODUCT',
      requirement: 1,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 1000,
    sortOrder: 80,
  },
  {
    archiveId: '9',
    archiveCode: 'MERCHANT_PRODUCT_MASTER_10',
    name: '상품 마스터',
    description: '상품을 10개 등록하세요',
    archiveType: 'MERCHANT',
    progressType: 'EVENT_BASED',
    condition: {
      type: 'CREATE_PRODUCT',
      requirement: 10,
      filtersJson: '{}',
    },
    rewardType: 'POINT',
    rewardAmount: 5000,
    sortOrder: 90,
  },
  {
    archiveId: '10',
    archiveCode: 'MERCHANT_TOTAL_SALES_1M',
    name: '판매왕 - 골드',
    description: '누적 판매 금액 100만원을 달성하세요',
    archiveType: 'MERCHANT',
    progressType: 'STAT_BASED',
    statKey: 'TOTAL_SALES_AMOUNT',
    rewardType: 'COUPON',
    rewardAmount: 1,
    sortOrder: 100,
  },
]

/**
 * CSV Export용 헬퍼 함수
 */
export function convertArchiveToCSV(archives: ArchiveMaster[]): string {
  const headers = [
    'archive_id',
    'archive_code',
    'name',
    'description',
    'archive_type',
    'progress_type',
    'condition_type',
    'condition_filters',
    'requirement',
    'stat_key',
    'reward_type',
    'reward_amount',
    'sort_order',
  ].join(',')

  const rows = archives.map((archive) => {
    return [
      archive.archiveId,
      archive.archiveCode,
      archive.name,
      archive.description,
      archive.archiveType,
      archive.progressType,
      archive.condition?.type || '',
      archive.condition?.filtersJson || '',
      archive.condition?.requirement || '',
      archive.statKey || '',
      archive.rewardType,
      archive.rewardAmount,
      archive.sortOrder,
    ].join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * CSV 다운로드 헬퍼
 */
export function downloadArchiveCSV(filename: string, content: string) {
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
