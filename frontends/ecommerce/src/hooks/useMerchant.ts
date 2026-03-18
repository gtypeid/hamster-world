import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantApi } from '../api/merchantApi'
import type { MerchantCreateRequest, MerchantUpdateRequest } from '../types/merchant'

/**
 * 판매자 신청 (머천트 생성)
 */
export function useCreateMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: MerchantCreateRequest) => merchantApi.createMerchant(request),
    onSuccess: () => {
      // 머천트 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['merchant'] })
    }
  })
}

/**
 * 내 머천트 정보 조회
 */
export function useMyMerchant(enabled: boolean = true) {
  return useQuery({
    queryKey: ['merchant', 'me'],
    queryFn: () => merchantApi.getMyMerchant(),
    retry: false, // 404는 정상 케이스이므로 재시도 안함
    enabled // MERCHANT 역할일 때만 호출하도록 제어 가능
  })
}

/**
 * 머천트 정보 수정
 */
export function useUpdateMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, request }: { merchantId: string; request: MerchantUpdateRequest }) =>
      merchantApi.updateMerchant(merchantId, request),
    onSuccess: () => {
      // 머천트 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['merchant', 'me'] })
    }
  })
}
