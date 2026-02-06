import { apiClient } from './client'
import type { PgMid, CreateMidRequest } from '@/features/mid/types'

export const midApi = {
  // MID 생성
  createMid: async (data: CreateMidRequest): Promise<PgMid> => {
    const response = await apiClient.post<PgMid>('/api/mid', data)
    return response.data
  },

  // MID 상세 조회
  getMid: async (midId: string): Promise<PgMid> => {
    const response = await apiClient.get<PgMid>(`/api/mid/${midId}`)
    return response.data
  },

  // MID 목록 조회 (List)
  getMids: async (): Promise<PgMid[]> => {
    const response = await apiClient.get<PgMid[]>('/api/mid/list')
    return response.data
  },

  // MID 활성화
  activateMid: async (midId: string): Promise<PgMid> => {
    const response = await apiClient.post<PgMid>(`/api/mid/${midId}/activate`)
    return response.data
  },

  // MID 비활성화
  deactivateMid: async (midId: string): Promise<PgMid> => {
    const response = await apiClient.post<PgMid>(`/api/mid/${midId}/deactivate`)
    return response.data
  },
}
