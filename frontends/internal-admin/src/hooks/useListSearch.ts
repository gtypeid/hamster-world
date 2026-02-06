import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * 리스트 검색 및 하이라이트 Hook
 *
 * "내 아이템 가기" 기능을 위한 공통 Hook
 * - URL 파라미터로 전달된 검색 조건으로 아이템 찾기
 * - 해당 아이템으로 스크롤 + 하이라이트 (3초)
 *
 * @param items - 검색 대상 아이템 배열
 * @param searchConfig - 검색 필드 매핑 { fieldName: (item) => item.value }
 * @param getItemId - 아이템의 고유 ID를 반환하는 함수
 * @param isLoading - 데이터 로딩 중 여부
 */
export function useListSearch<T>(
  items: T[],
  searchConfig: {
    [searchField: string]: (item: T) => string
  },
  getItemId: (item: T) => string,
  isLoading: boolean = false
) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const searchBy = searchParams.get('searchBy')
    const searchValue = searchParams.get('searchValue')

    // 검색 조건이 없거나 로딩 중이거나 아이템이 없으면 스킵
    if (!searchBy || !searchValue || isLoading || items.length === 0) return

    // searchConfig에서 해당 필드의 getter 함수 찾기
    const fieldGetter = searchConfig[searchBy]
    if (!fieldGetter) {
      console.warn(`[useListSearch] Unknown search field: ${searchBy}`)
      setSearchParams({})
      return
    }

    // 조건에 맞는 아이템 찾기
    const targetItem = items.find((item) => fieldGetter(item) === searchValue)

    if (!targetItem) {
      console.warn(`[useListSearch] Item not found: ${searchBy}=${searchValue}`)
      setSearchParams({})
      return
    }

    const itemId = getItemId(targetItem)
    setHighlightedId(itemId)

    // 해당 아이템으로 스크롤
    setTimeout(() => {
      const element = itemRefs.current[itemId]
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 100)

    // 3초 후 하이라이트 제거 & URL 파라미터 제거
    const timer = setTimeout(() => {
      setHighlightedId(null)
      setSearchParams({})
    }, 3000)

    return () => clearTimeout(timer)
  }, [searchParams, isLoading, items, searchConfig, getItemId, setSearchParams])

  return {
    highlightedId,
    itemRefs,
  }
}
