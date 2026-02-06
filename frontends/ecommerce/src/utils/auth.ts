import type { User } from '../types/user'

/**
 * 로그인이 필요한 기능을 실행하기 전에 인증 확인
 *
 * @param user 현재 로그인한 사용자 (null이면 비로그인)
 * @param onSuccess 로그인되어 있을 때 실행할 함수
 * @param showAlert 알림 표시 함수
 * @returns 인증 성공 여부
 */
export function requireAuth(
  user: User | null,
  onSuccess: () => void,
  showAlert: (message: string) => void
): boolean {
  if (!user) {
    showAlert('로그인이 필요한 기능입니다. 🔑')
    return false
  }
  onSuccess()
  return true
}
