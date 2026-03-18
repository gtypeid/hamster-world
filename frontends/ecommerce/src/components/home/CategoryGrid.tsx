const categories = [
  { id: 'all', name: '전체', emoji: '🎪', description: '모든 상품 보기' },
  { id: '간식', name: '간식', emoji: '🌰', description: '도토리, 해바라기씨 등' },
  { id: '집/용품', name: '집/용품', emoji: '🏠', description: '아늑한 햄스터 하우스' },
  { id: '운동기구', name: '운동기구', emoji: '🎡', description: '쳇바퀴, 터널 등' },
  { id: '침구', name: '침구', emoji: '🛏️', description: '톱밥, 목화 등' },
  { id: '장난감', name: '장난감', emoji: '🎾', description: '재미있는 놀이용품' },
]

interface CategoryGridProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function CategoryGrid({ selectedCategory, onSelectCategory }: CategoryGridProps) {
  const handleCategoryClick = (categoryId: string) => {
    onSelectCategory(categoryId)
    // 상품 섹션으로 스크롤
    const productsSection = document.getElementById('products-section')
    productsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 py-12">
      <h3 className="text-3xl font-bold text-hamster-brown mb-8 text-center">
        🌈 카테고리
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`bg-white border-2 rounded-2xl p-6 hover:shadow-lg transition-all group ${
              selectedCategory === category.id
                ? 'border-hamster-orange shadow-lg'
                : 'border-hamster-beige hover:border-hamster-orange'
            }`}
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
              {category.emoji}
            </div>
            <h4 className="font-bold text-hamster-brown text-lg mb-1">
              {category.name}
            </h4>
            <p className="text-sm text-gray-600">
              {category.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
