/**
 * Progression Service 타입 정의
 */

// ============================================
// Enums & Constants
// ============================================

export type CycleType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export type QuotaType = 'ACTION_REWARD' | 'ACTION_CONSTRAINT'

export type RewardType = 'POINT' | 'COUPON'

export type MissionType =
  | 'CREATE_ORDER'
  | 'COMPLETE_ORDER'
  | 'CREATE_PRODUCT'
  | 'CREATE_REVIEW'
  | 'CONFIRM_PAYMENT'
  | 'USER_LOGIN'
  | 'TOTAL_PURCHASE_AMOUNT'
  | 'ORDER_COUNT'
  | 'PRODUCT_COUNT'
  | 'REVIEW_COUNT'

export type ArchiveType = 'ORDER' | 'MERCHANT'

export type ProgressType = 'EVENT_BASED' | 'STAT_BASED'

export type PromotionTargetRole = 'CUSTOMER' | 'RIDER'

export type CouponDiscountType = 'FIXED' | 'PERCENTAGE'

// ============================================
// Mission Condition (공통)
// ============================================

export interface MissionCondition {
  type: MissionType
  requirement: number
  currentProgress?: number
  filtersJson?: string // JSON string: {"region":"성수동","timeSlot":"EVENING"}
}

export interface MissionFilters {
  region?: string
  timeSlot?: string
  minAmount?: string
  [key: string]: string | undefined
}

// ============================================
// Quota
// ============================================

export interface QuotaMaster {
  quotaId: string
  quotaKey: string
  name: string
  description: string
  cycleType: CycleType
  quotaType: QuotaType
  maxLimit: number
  condition: MissionCondition
  rewardType?: RewardType
  rewardAmount?: number // POINT일 때 사용
  couponCode?: string // COUPON일 때 사용
  sortOrder: number
}

export interface Quota extends QuotaMaster {
  // Runtime fields (유저별 진행도)
  userId?: string
  consumed?: number
  lastResetAt?: string
}

// ============================================
// Archive
// ============================================

export interface ArchiveMaster {
  archiveId: string
  archiveCode: string
  name: string
  description: string
  archiveType: ArchiveType
  progressType: ProgressType
  condition?: MissionCondition
  statKey?: string // STAT_BASED일 때 사용
  rewardType: RewardType
  rewardAmount: number
  sortOrder: number
}

export interface UserArchiveProgress {
  userId: string
  archiveId: string
  currentProgress: number
  isCompleted: boolean
  claimedAt?: string
}

// ============================================
// Coupon
// ============================================

export interface CouponMaster {
  couponId: string
  couponCode: string // WELCOME_500, NEW_USER_1000 등
  name: string
  description: string
  discountType: CouponDiscountType // FIXED: 정액 할인, PERCENTAGE: 정률 할인
  discountAmount: number // FIXED일 때: 원 단위, PERCENTAGE일 때: % 단위
  minPurchaseAmount?: number // 최소 주문 금액
  maxDiscountAmount?: number // PERCENTAGE일 때 최대 할인 금액
  validDays: number // 발급 후 유효 기간 (일)
  sortOrder: number
}

export interface CouponFormData {
  couponId?: string
  couponCode: string
  name: string
  description: string
  discountType: CouponDiscountType
  discountAmount: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  validDays: number
  sortOrder: number
}

// ============================================
// Season Promotion (BattlePass)
// ============================================

export interface SeasonPromotionMaster {
  promotionId: string
  title: string
  description: string
  targetRole: PromotionTargetRole
  startAt: string // ISO DateTime
  endAt: string   // ISO DateTime
  maxStep: number
  condition: MissionCondition
  basicRewards: Record<number, StepReward>      // step -> reward
  vipBonusRewards: Record<number, StepReward>   // step -> vip bonus
  sortOrder: number
}

export interface StepReward {
  rewardType: RewardType
  rewardAmount: number
}

export interface UserSeasonPromotionProgress {
  userId: string
  promotionId: string
  currentStep: number
  hasVipPass: boolean
  claimedSteps: number[]
  claimedVipSteps: number[]
}

// ============================================
// Form Data (UI용)
// ============================================

export interface QuotaFormData {
  quotaId?: string
  quotaKey: string
  name: string
  description: string
  cycleType: CycleType
  quotaType: QuotaType
  maxLimit: number

  // Condition
  conditionType: MissionType
  conditionRequirement: number
  conditionFilters: MissionFilters

  // Reward
  rewardType?: RewardType
  rewardAmount?: number // POINT일 때 사용
  couponCode?: string // COUPON일 때 사용

  sortOrder: number
}

export interface ArchiveFormData {
  archiveId?: string
  archiveCode: string
  name: string
  description: string
  archiveType: ArchiveType
  progressType: ProgressType

  // Condition (EVENT_BASED)
  conditionType?: MissionType
  conditionRequirement?: number
  conditionFilters?: MissionFilters

  // Stat Key (STAT_BASED)
  statKey?: string

  // Reward
  rewardType: RewardType
  rewardAmount: number

  sortOrder: number
}

export interface SeasonPromotionFormData {
  promotionId?: string
  title: string
  description: string
  targetRole: PromotionTargetRole
  startAt: string
  endAt: string
  maxStep?: number // Calculated from rewards, not user input

  // Condition
  conditionType: MissionType
  conditionRequirement: number
  conditionFilters: MissionFilters

  // Rewards (step -> reward)
  basicRewards: Record<number, StepReward>
  vipBonusRewards: Record<number, StepReward>

  sortOrder: number
}

// ============================================
// CSV Export Format
// ============================================

export interface QuotaCsvRow {
  quota_id: string
  quota_key: string
  name: string
  description: string
  cycle_type: CycleType
  quota_type: QuotaType
  max_limit: number
  condition_type: MissionType
  condition_filters: string // JSON string
  requirement: number
  reward_type?: RewardType
  reward_amount?: number
  sort_order: number
}

export interface ArchiveCsvRow {
  archive_id: string
  archive_code: string
  name: string
  description: string
  archive_type: ArchiveType
  progress_type: ProgressType
  condition_type?: MissionType
  condition_filters?: string
  requirement?: number
  reward_type: RewardType
  reward_amount: number
  sort_order: number
}
