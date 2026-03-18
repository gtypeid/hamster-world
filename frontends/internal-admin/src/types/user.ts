// User Types

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'DEVELOPER'

/**
 * User (Admin API 응답)
 */
export interface User {
  id: number
  publicId: string
  keycloakUserId: string
  username: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}
