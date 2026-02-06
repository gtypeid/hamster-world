export interface Product {
  id: string
  name: string
  price: number
  images: string[]
  vendor: string
  rating?: number  // 더미 (레거시)
  soldCount?: number  // 더미 (레거시)
  averageRating?: number  // 실제 평균 평점 (백엔드)
  reviewCount: number  // 실제 리뷰 개수 (백엔드)
  description: string
  details: string
  stock: number
  category: string
  sku?: string
  isSoldOut?: boolean
}

export const products: Product[] = [
  {
    id: '1',
    name: '프리미엄 도토리 세트',
    price: 15000,
    images: ['🌰', '🌰', '🌰', '🌰'],
    vendor: '도토리 장수 함돌이',
    rating: 4.9,
    soldCount: 1234,
    category: '간식',
    stock: 50,
    description: '신선하고 맛있는 프리미엄 도토리를 햄스터들에게!',
    details: `
      <h3>상품 상세</h3>
      <p>신선하게 수확한 프리미엄 도토리입니다.</p>
      <ul>
        <li>원산지: 햄스터 숲</li>
        <li>중량: 500g</li>
        <li>유통기한: 제조일로부터 30일</li>
        <li>보관방법: 서늘한 곳에 보관</li>
      </ul>
      <h3>주의사항</h3>
      <p>개봉 후 빠른 시일 내에 드세요.</p>
    `
  },
  {
    id: '2',
    name: '유기농 해바라기씨 1kg',
    price: 12000,
    images: ['🌻', '🌻', '🌻'],
    vendor: '해바라기 농장 함순이',
    rating: 4.8,
    soldCount: 987,
    category: '간식',
    stock: 30,
    description: '건강한 유기농 해바라기씨, 햄스터 영양 간식!',
    details: `
      <h3>상품 상세</h3>
      <p>유기농 인증을 받은 해바라기씨입니다.</p>
      <ul>
        <li>원산지: 햄스터 농장</li>
        <li>중량: 1kg</li>
        <li>유통기한: 제조일로부터 60일</li>
      </ul>
    `
  },
  {
    id: '3',
    name: '럭셔리 쳇바퀴 (소음 제로)',
    price: 35000,
    images: ['🎡', '🎡', '🎡', '🎡', '🎡'],
    vendor: '운동기구 함피트',
    rating: 5.0,
    soldCount: 456,
    category: '운동기구',
    stock: 15,
    description: '소음 없는 프리미엄 쳇바퀴로 밤새 달려보세요!',
    details: `
      <h3>상품 상세</h3>
      <p>완전 무소음 베어링을 사용한 럭셔리 쳇바퀴입니다.</p>
      <ul>
        <li>지름: 20cm</li>
        <li>재질: 고급 플라스틱</li>
        <li>무게: 300g</li>
        <li>특징: 베어링 방식 무소음</li>
      </ul>
    `
  },
  {
    id: '4',
    name: '아늑한 2층 하우스',
    price: 28000,
    images: ['🏠', '🏠', '🏠'],
    vendor: '햄스터 건축가 함집사',
    rating: 4.7,
    soldCount: 678,
    category: '집/용품',
    stock: 20,
    description: '2층 구조의 넓고 아늑한 햄스터 하우스',
    details: `
      <h3>상품 상세</h3>
      <p>햄스터가 편안하게 지낼 수 있는 2층 하우스입니다.</p>
      <ul>
        <li>크기: 25cm x 20cm x 15cm</li>
        <li>재질: 원목</li>
        <li>구조: 2층 + 계단</li>
      </ul>
    `
  },
  {
    id: '5',
    name: '프리미엄 목화 침구',
    price: 8000,
    images: ['🛏️', '🛏️'],
    vendor: '침구왕 함슬립',
    rating: 4.9,
    soldCount: 2341,
    category: '침구',
    stock: 100,
    description: '부드럽고 따뜻한 천연 목화 침구',
    details: `
      <h3>상품 상세</h3>
      <p>100% 천연 목화로 만든 햄스터 침구입니다.</p>
      <ul>
        <li>중량: 50g</li>
        <li>재질: 천연 목화</li>
        <li>특징: 먼지 적음, 흡수력 좋음</li>
      </ul>
    `
  },
  {
    id: '6',
    name: '귀여운 당근 인형',
    price: 5000,
    images: ['🥕', '🥕', '🥕'],
    vendor: '장난감 공방 함토이',
    rating: 4.6,
    soldCount: 543,
    category: '장난감',
    stock: 80,
    description: '햄스터가 좋아하는 당근 모양 인형',
    details: `
      <h3>상품 상세</h3>
      <p>안전한 소재로 만든 당근 인형입니다.</p>
      <ul>
        <li>크기: 10cm</li>
        <li>재질: 무독성 플라스틱</li>
      </ul>
    `
  },
  {
    id: '7',
    name: '건강 간식 믹스',
    price: 18000,
    images: ['🥜', '🥜', '🥜', '🥜'],
    vendor: '건강식품 함웰니스',
    rating: 4.8,
    soldCount: 891,
    category: '간식',
    stock: 45,
    description: '영양 가득한 건강 간식 믹스',
    details: `
      <h3>상품 상세</h3>
      <p>다양한 견과류가 들어있는 건강 믹스입니다.</p>
      <ul>
        <li>구성: 호두, 아몬드, 땅콩 등</li>
        <li>중량: 300g</li>
      </ul>
    `
  },
  {
    id: '8',
    name: '미니 터널 놀이터',
    price: 22000,
    images: ['🎪', '🎪', '🎪'],
    vendor: '놀이터 함플레이',
    rating: 4.9,
    soldCount: 321,
    category: '장난감',
    stock: 25,
    description: '신나게 뛰어놀 수 있는 터널 놀이터',
    details: `
      <h3>상품 상세</h3>
      <p>햄스터가 즐길 수 있는 터널 놀이터입니다.</p>
      <ul>
        <li>길이: 50cm</li>
        <li>재질: 플라스틱</li>
        <li>구성: 터널 3개 연결</li>
      </ul>
    `
  },
]

export const reviews = [
  {
    id: 1,
    productId: '1',
    author: '햄찌사랑',
    rating: 5,
    content: '우리 햄찌가 정말 좋아해요! 매일 도토리만 찾네요 ㅎㅎ',
    date: '2026-01-25',
    images: []
  },
  {
    id: 2,
    productId: '1',
    author: '함스터맘',
    rating: 5,
    content: '신선하고 품질 좋아요. 재구매 의사 있습니다!',
    date: '2026-01-20',
    images: []
  },
  {
    id: 3,
    productId: '1',
    author: '쪼꼬미',
    rating: 4,
    content: '좋긴 한데 가격이 조금 비싼 것 같아요',
    date: '2026-01-15',
    images: []
  },
]
