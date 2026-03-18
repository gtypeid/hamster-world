/**
 * Merchant 관련 타입 정의
 */

export type MerchantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
export type SettlementCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface MerchantResponse {
  merchantPublicId: string  // Public ID (Snowflake String)
  userPublicId: string  // User의 publicId
  status: MerchantStatus
  cashGatewayMid: string

  // 사업자 정보
  businessName: string
  businessNumber: string
  representativeName: string
  businessAddress: string | null
  businessType: string | null

  // 스토어 정보
  storeName: string
  contactEmail: string
  contactPhone: string
  operatingHours: string | null
  storeDescription: string | null
  storeImageUrl: string | null

  // 정산 정보
  bankName: string
  accountNumber: string
  accountHolder: string
  settlementCycle: SettlementCycle
  platformCommissionRate: number

  // 메타데이터
  createdAt: string | null
  modifiedAt: string | null
}

export interface MerchantCreateRequest {
  // 사업자 정보 (필수)
  businessName: string           // 상호명
  businessNumber: string         // 사업자등록번호
  representativeName: string     // 대표자명
  businessAddress?: string       // 사업장 주소
  businessType?: string          // 업종

  // 스토어 정보 (필수)
  storeName: string              // 스토어명
  contactEmail: string           // 연락처 이메일
  contactPhone: string           // 연락처 전화번호
  operatingHours?: string        // 운영 시간
  storeDescription?: string      // 스토어 소개
  storeImageUrl?: string         // 스토어 이미지 URL

  // 정산 정보 (필수)
  bankName: string               // 은행명
  accountNumber: string          // 계좌번호
  accountHolder: string          // 예금주
  settlementCycle?: SettlementCycle  // 정산 주기 (기본값: WEEKLY)
}

export interface MerchantUpdateRequest {
  // 사업자 정보
  businessName?: string
  businessNumber?: string
  representativeName?: string
  businessAddress?: string
  businessType?: string

  // 스토어 정보
  storeName?: string
  contactEmail?: string
  contactPhone?: string
  operatingHours?: string
  storeDescription?: string
  storeImageUrl?: string

  // 정산 정보
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  settlementCycle?: SettlementCycle
}

/**
 * 판매자 공개 정보 응답 (MerchantSellerInfoResponse.kt)
 *
 * 비로그인 사용자도 접근 가능한 공개 정보만 포함
 * - 민감 정보 제외: 사업자번호, 대표자명, 계좌정보, 정산정보 등
 */
export interface MerchantSellerInfoResponse {
  merchantPublicId: string  // Merchant Public ID
  storeName: string         // 스토어명
  storeDescription: string | null  // 스토어 소개
  storeImageUrl: string | null     // 스토어 이미지
  operatingHours: string | null    // 운영 시간
  businessName: string      // 상호명 (공개)
  contactEmail: string      // 연락처 이메일 (공개)
  contactPhone: string      // 연락처 전화번호 (공개)
}
