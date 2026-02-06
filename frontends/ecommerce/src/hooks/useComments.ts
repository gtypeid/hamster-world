import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Comment, CommentCreateRequest, CommentUpdateRequest } from '../types/board'
import { apiClient } from '../api/client'
import { boardKeys } from './useBoards'

// Create comment
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ boardPublicId, data }: { boardPublicId: string; data: CommentCreateRequest }) => {
      const response = await apiClient.post<Comment>(
        `/api/boards/${boardPublicId}/comments`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate board detail to refetch with new comment
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardPublicId) })
      // Invalidate board lists to update comment count
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}

// Update comment
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      boardPublicId,
      commentPublicId,
      data
    }: {
      boardPublicId: string
      commentPublicId: string
      data: CommentUpdateRequest
    }) => {
      const response = await apiClient.put<Comment>(
        `/api/boards/${boardPublicId}/comments/${commentPublicId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardPublicId) })
    },
  })
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      boardPublicId,
      commentPublicId
    }: {
      boardPublicId: string
      commentPublicId: string
    }) => {
      await apiClient.delete(`/api/boards/${boardPublicId}/comments/${commentPublicId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardPublicId) })
    },
  })
}
