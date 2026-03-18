import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Board,
  BoardWithComments,
  BoardSearchParams,
  BoardCreateRequest,
  BoardUpdateRequest
} from '../types/board'
import { apiClient } from '../api/client'

// Query Keys
export const boardKeys = {
  all: ['boards'] as const,
  lists: () => [...boardKeys.all, 'list'] as const,
  list: (params: BoardSearchParams) => [...boardKeys.lists(), params] as const,
  details: () => [...boardKeys.all, 'detail'] as const,
  detail: (publicId: string) => [...boardKeys.details(), publicId] as const,
}

// Fetch boards list (non-paginated) - Public API
export function useBoards(params: BoardSearchParams) {
  return useQuery({
    queryKey: boardKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<Board[]>('/public/boards/list', { params })
      return response.data
    },
    enabled: !!params.productPublicId,
  })
}

// Fetch single board with comments - Public API
export function useBoard(publicId: string | undefined) {
  return useQuery({
    queryKey: boardKeys.detail(publicId || ''),
    queryFn: async () => {
      const response = await apiClient.get<BoardWithComments>(`/public/boards/${publicId}`)
      return response.data
    },
    enabled: !!publicId,
  })
}

// Create board
export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BoardCreateRequest) => {
      const response = await apiClient.post<Board>('/boards', data)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all board lists to refetch
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}

// Update board
export function useUpdateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ publicId, data }: { publicId: string; data: BoardUpdateRequest }) => {
      const response = await apiClient.put<Board>(`/boards/${publicId}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.publicId) })
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}

// Delete board
export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(`/boards/${publicId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}
