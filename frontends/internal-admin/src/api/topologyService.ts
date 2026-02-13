import type { TopologyResponse } from '@common/topology'
import { mockTopology } from './mockTopology'

// localhost 폴백 제거: 환경변수 누락 시 즉시 에러가 나야 빠르게 해결 가능
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL
const USE_MOCK = true // TODO: 백엔드 연동 시 false로 변경

/**
 * 전체 Kafka 토폴로지 조회
 *
 * GET /topology (Nginx가 /api/ 붙여줌)
 */
export async function fetchTopology(): Promise<TopologyResponse> {
  // Mock 데이터 사용
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay
    return mockTopology
  }

  // 실제 API 호출
  const response = await fetch(`${NOTIFICATION_SERVICE_URL}/topology`, {
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
