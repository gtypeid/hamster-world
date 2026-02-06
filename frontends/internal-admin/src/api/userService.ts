import { ecommerceClient } from './client'
import type { User } from '@/types/user'

/**
 * User Admin API Service
 * - Ecommerce Service의 /admin/users API 호출
 * - DEVELOPER role 필요
 */

/**
 * User 상세 조회 (Public ID로)
 */
export async function fetchUserDetail(publicId: string): Promise<User> {
  const response = await ecommerceClient.get<User>(`/admin/users/${publicId}`)
  return response.data
}
