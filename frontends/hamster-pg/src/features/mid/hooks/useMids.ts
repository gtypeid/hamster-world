import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { midApi } from '@/api/midApi'
import type { CreateMidRequest } from '../types'

// MID 목록 조회
export function useMids() {
  return useQuery({
    queryKey: ['mids'],
    queryFn: midApi.getMids,
  })
}

// MID 생성
export function useCreateMid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMidRequest) => midApi.createMid(data),
    onSuccess: () => {
      // MID 목록 캐시 무효화 → 자동 리페치
      queryClient.invalidateQueries({ queryKey: ['mids'] })
    },
  })
}

// MID 활성화
export function useActivateMid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (midId: string) => midApi.activateMid(midId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mids'] })
    },
  })
}

// MID 비활성화
export function useDeactivateMid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (midId: string) => midApi.deactivateMid(midId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mids'] })
    },
  })
}
