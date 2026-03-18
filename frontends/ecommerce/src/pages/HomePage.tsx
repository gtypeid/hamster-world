import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HeroSection } from '../components/home/HeroSection'
import { CategoryGrid } from '../components/home/CategoryGrid'
import { ProductGrid } from '../components/home/ProductGrid'

export function HomePage() {
  const [searchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const searchQuery = searchParams.get('q') || ''

  // URL 검색어가 있으면 카테고리를 'all'로 리셋
  useEffect(() => {
    if (searchQuery) {
      setSelectedCategory('all')
    }
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      {!searchQuery && (
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}
      <ProductGrid
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
      />
    </div>
  )
}
