export type BoardCategory = 'REVIEW' | 'INQUIRY'

export interface Board {
  publicId: string
  productPublicId: string
  category: BoardCategory
  authorPublicId: string
  authorName: string
  title: string
  content: string
  rating?: number // Only for REVIEW category
  commentCount?: number // 댓글 개수
  createdAt: string
  modifiedAt?: string
}

export interface Comment {
  publicId: string
  boardPublicId: string
  authorPublicId: string
  authorName: string
  content: string
  createdAt: string
  modifiedAt?: string
}

export interface BoardWithComments {
  board: Board
  comments: Comment[]
}

export interface BoardSearchParams {
  productPublicId: string
  category?: BoardCategory
  authorPublicId?: string
  from?: string
  to?: string
  match?: boolean
  sort?: 'ASC' | 'DESC'
  paged?: boolean
  page?: number
  size?: number
}

export interface BoardCreateRequest {
  productPublicId: string
  category: BoardCategory
  title: string
  content: string
  rating?: number
}

export interface BoardUpdateRequest {
  title: string
  content: string
  rating?: number
}

export interface CommentCreateRequest {
  content: string
}

export interface CommentUpdateRequest {
  content: string
}
