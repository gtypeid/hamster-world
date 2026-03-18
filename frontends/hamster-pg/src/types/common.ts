export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
