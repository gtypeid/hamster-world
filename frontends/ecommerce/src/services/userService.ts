import { api } from '../lib/api'
import type { User } from '../types/user'

export const userService = {
  // 현재 로그인한 사용자 정보 조회
  async getCurrentUser(userId: string, token: string): Promise<User> {
    return api.get<User>(`/users/${userId}`, { token })
  },
}
