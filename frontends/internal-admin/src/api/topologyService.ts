import type { TopologyResponse } from '@/types/topology'
import { mockTopology } from './mockTopology'

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8084'
const USE_MOCK = true // TODO: 백엔드 연동 시 false로 변경

/**
 * 전체 Kafka 토폴로지 조회
 *
 * GET /api/topology
 */
export async function fetchTopology(): Promise<TopologyResponse> {
  // Mock 데이터 사용
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay
    return mockTopology
  }

  // 실제 API 호출
  const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/topology`, {
    headers: {
      'Content-Type': 'application/json',
      // TODO: Auth header 추가
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch topology: ${response.statusText}`)
  }

  return response.json()
}
