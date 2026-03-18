export function HeroSection() {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products-section')
    productsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToCategories = () => {
    const categoriesSection = document.getElementById('categories-section')
    categoriesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="bg-gradient-to-r from-hamster-peach via-hamster-beige to-hamster-ivory py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center gap-4 mb-6">
          <span className="text-6xl animate-bounce">🐹</span>
          <span className="text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>🌰</span>
          <span className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌻</span>
        </div>

        <h2 className="text-5xl font-bold text-hamster-brown mb-4">
          햄스터 나라 최대 마켓에 오신 것을 환영합니다!
        </h2>

        <p className="text-xl text-gray-700 mb-8">
          도토리부터 쳇바퀴까지, 햄스터들이 사랑하는 모든 것
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={scrollToProducts}
            className="bg-amber-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg"
          >
            인기 상품 보기
          </button>
          <button
            onClick={scrollToCategories}
            className="bg-white text-amber-900 border-2 border-amber-500 px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-50 transition-colors shadow-lg"
          >
            카테고리 둘러보기
          </button>
        </div>
      </div>
    </section>
  )
}
