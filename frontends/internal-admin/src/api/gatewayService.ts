import { gatewayClient } from './client'
import type { PaymentProcess, ProcessDetail, Payment } from '@/types/gateway'

/**
 * Cash Gateway API Service
 * - Cash Gateway Service의 API 호출
 *
 * Backend:
 * - GET /api/payment-processes/list → List<PaymentProcessResponse>
 * - GET /api/payment-processes/page → Page<PaymentProcessResponse>
 * - GET /api/payments/list → List<PaymentResponse> (TODO: 백엔드 구현 필요)
 * - GET /api/payments/{publicId} → PaymentResponse (TODO: 백엔드 구현 필요)
 */

/**
 * 전체 프로세스 목록 조회
 *
 * GET /api/payment-processes/list
 */
export async function fetchProcessList(): Promise<PaymentProcess[]> {
  const response = await gatewayClient.get<PaymentProcess[]>('/api/payment-processes/list')
  return response.data
}

/**
 * 프로세스 상세 조회 (with events)
 *
 * TODO: 백엔드에 상세 API 구현 필요
 * GET /api/payment-processes/{publicId}
 *
 * Response 예시:
 * {
 *   process: PaymentProcess,
 *   events: ProcessEvent[],
 *   payment?: Payment
 * }
 */
export async function fetchProcessDetail(publicId: string): Promise<ProcessDetail> {
  // TODO: 백엔드에 상세 API 구현되면 교체
  // const response = await gatewayClient.get<ProcessDetail>(`/api/payment-processes/${publicId}`)
  // return response.data

  // 임시: list에서 찾아서 반환 (events는 빈 배열)
  const processes = await fetchProcessList()
  const process = processes.find((p) => p.publicId === publicId)
  if (!process) {
    throw new Error(`Process not found: ${publicId}`)
  }
  return {
    process,
    events: [],
  }
}

/**
 * Gateway Payment 상세 조회 (Cash Gateway Communication Truth)
 *
 * TODO: 백엔드에 API 구현 필요
 * GET /api/payments/{publicId}
 */
export async function fetchGatewayPayment(publicId: string): Promise<Payment> {
  // TODO: 백엔드 API 구현되면 교체
  // const response = await gatewayClient.get<Payment>(`/api/payments/${publicId}`)
  // return response.data

  // 임시: API 미구현 에러 (Promise.reject로 반환)
  return Promise.reject(new Error(`🚧 Backend API not implemented: GET /api/payments/${publicId}`))
}
