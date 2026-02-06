// Backend PgMid 엔티티와 매칭
export interface PgMid {
  id: number
  midId: string
  merchantName: string
  apiKey: string
  secretKey: string
  isActive: boolean
  createdAt: string
  modifiedAt: string
}

export interface CreateMidRequest {
  merchantName: string
}

export interface MidSearchRequest {
  midId?: string
  merchantName?: string
  isActive?: boolean
  page?: number
  size?: number
}
