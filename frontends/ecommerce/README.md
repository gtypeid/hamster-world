# Hamster World E-commerce Frontend

햄스터 월드 이커머스 플랫폼의 프론트엔드 애플리케이션입니다.

## 📋 목차
- [기술 스택](#-기술-스택)
- [아키텍처 개요](#-아키텍처-개요)
- [프로젝트 구조](#-프로젝트-구조)
- [환경 설정](#-환경-설정)
- [실행 방법](#-실행-방법)
- [라우팅 구조](#-라우팅-구조)
- [API 연동 상태](#-api-연동-상태)
- [구현 상태](#-구현-상태)
- [다음 작업 항목](#-다음-작업-항목)

---

## 🛠 기술 스택

### Core
- **React 19.2.0** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite 7.2.4** - 빌드 툴 및 개발 서버

### 상태 관리
- **TanStack Query (React Query) 5.90.20** - 서버 상태 관리
- **React Context API** - 전역 상태 (인증, Alert)

### 라우팅
- **React Router DOM 7.13.0** - 클라이언트 사이드 라우팅

### 인증
- **Keycloak JS 26.2.2** - OAuth2/OIDC 인증
  - Realm: `hamster-world`
  - Client ID: `ecommerce-frontend`
  - 역할: `CUSTOMER`, `VENDOR`, `ADMIN`

### 스타일링
- **Tailwind CSS 4.1.18** - 유틸리티 우선 CSS 프레임워크

### HTTP 클라이언트
- **Axios** - API 통신 (JWT 자동 주입)

---

## 🏗️ 아키텍처 개요

### MSA 기반 백엔드 연동
이 프론트엔드는 **Hamster World MSA 아키텍처**의 일부로, 다음 백엔드 서비스들과 통신합니다:

#### 주요 백엔드 서비스
1. **ecommerce-service** (Port 8081)
   - 상품, 장바구니, 주문, 사용자 관리
   - 메인 비즈니스 로직

2. **payment-system** (별도 서비스)
   - 결제 처리 및 PG 연동
   - Event-driven 주문 상태 관리

3. **Keycloak** (Port 8080)
   - 인증 및 권한 관리
   - SSO 제공

### ID 체계 (중요!)
**모든 ID는 `string` 타입입니다 (Snowflake Base62 ID 사용)**

```typescript
// ❌ 잘못된 예
interface Product {
  id: number  // 백엔드는 string publicId를 사용!
}

// ✅ 올바른 예
interface Product {
  id: string  // Snowflake Base62 ID (예: "01HQXYZ...")
}
```

- **DB ID**: 내부적으로 Long 타입이지만, API에서는 노출하지 않음
- **Public ID**: Base62 인코딩된 Snowflake ID를 `string`으로 사용
- **이유**: MSA 환경에서 분산 ID 생성 및 외부 노출용

### 이벤트 기반 주문 흐름
주문 생성 후 상태 변경은 Kafka 이벤트로 처리됩니다:

```
1. POST /orders (주문 생성) → Order 생성 (상태: CREATED)
2. Kafka Event → PaymentRequested
3. payment-system 검증
4. Kafka Event → PaymentApproved/Failed
5. Order 상태 업데이트 (PAYMENT_APPROVED/FAILED)
```

**프론트엔드는 주문 생성만 하고, 상태 변경은 자동으로 처리됩니다.**

---

## 📁 프로젝트 구조

```
src/
├── api/                    # API 레이어 (실제 백엔드 연동)
│   ├── client.ts          # Axios 인스턴스 (JWT 자동 주입)
│   ├── cartApi.ts         # 장바구니 API ✅ 실제 API 연동 완료
│   ├── orderApi.ts        # 주문 API ✅ 실제 API 연동 완료
│   └── productApi.ts      # 상품 API (Mock)
│
├── components/            # 재사용 가능한 컴포넌트
│   ├── admin/            # 관리자 전용 컴포넌트
│   │   └── AdminLayout.tsx
│   ├── common/           # 공통 컴포넌트
│   │   └── ErrorBoundary.tsx
│   ├── home/             # 홈페이지 컴포넌트
│   │   ├── CategoryGrid.tsx
│   │   ├── HeroSection.tsx
│   │   └── ProductGrid.tsx
│   ├── layout/           # 레이아웃 컴포넌트
│   │   └── Header.tsx
│   ├── product/          # 상품 관련 컴포넌트
│   │   ├── ProductInfo.tsx
│   │   └── ProductTabs.tsx
│   └── vendor/           # 판매자 전용 컴포넌트
│       └── VendorLayout.tsx
│
├── contexts/             # React Context
│   ├── AuthContext.tsx   # Keycloak 인증 컨텍스트
│   └── AlertContext.tsx  # Alert/Confirm 모달
│
├── hooks/                # Custom React Query Hooks
│   ├── useCart.ts       # 장바구니 hooks ✅ 실제 API
│   ├── useOrders.ts     # 주문 hooks ✅ 실제 API
│   └── useProducts.ts   # 상품 hooks (Mock)
│
├── lib/                  # 유틸리티
│   └── keycloak.ts      # Keycloak 인스턴스
│
├── pages/                # 페이지 컴포넌트
│   ├── admin/           # 관리자 페이지
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminOrdersPage.tsx
│   │   ├── AdminProductsPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   └── AdminVendorsPage.tsx
│   ├── vendor/          # 판매자 페이지
│   │   ├── VendorDashboardPage.tsx
│   │   ├── VendorOrdersPage.tsx ✅ 실제 API 연동 완료
│   │   ├── VendorProductsPage.tsx
│   │   ├── VendorProductDetailPage.tsx
│   │   ├── VendorSettlementPage.tsx
│   │   └── VendorSettingsPage.tsx
│   ├── CartPage.tsx     # 장바구니 ✅ 실제 API
│   ├── HomePage.tsx     # 홈
│   ├── MyPage.tsx       # 마이페이지 ✅ 주문 내역 실제 API
│   ├── OrderDetailPage.tsx ✅ 주문 상세 (신규 추가)
│   ├── ProductDetailPage.tsx  # 상품 상세
│   └── VendorStorePage.tsx    # 판매자 스토어
│
├── services/            # 비즈니스 로직
│   └── userService.ts   # 사용자 서비스 ✅ 실제 API
│
├── types/               # TypeScript 타입 정의
│   ├── cart.ts         # 장바구니 타입
│   ├── order.ts        # 주문 타입 ✅ 백엔드 Response DTO와 매칭
│   ├── product.ts      # 상품 타입
│   └── user.ts         # 사용자 타입
│
├── App.tsx              # 앱 루트 컴포넌트
└── main.tsx             # 엔트리 포인트
```

---

## ⚙️ 환경 설정

### 환경 변수

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```bash
# Keycloak 설정
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=hamster-world
VITE_KEYCLOAK_CLIENT_ID=ecommerce-frontend

# 백엔드 API URL (ecommerce-service)
VITE_API_BASE_URL=http://localhost:8081/api
```

---

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드
```bash
npm run build
```

### 4. 프로덕션 미리보기
```bash
npm run preview
```

---

## 🗺️ 라우팅 구조

### 쇼핑몰 영역 (Header 포함)
| 경로 | 페이지 | 상태 | 설명 |
|------|--------|------|------|
| `/` | HomePage | 🟡 Mock | 홈페이지 (상품 목록, 카테고리) |
| `/products/:id` | ProductDetailPage | 🟡 Mock | 상품 상세 |
| `/cart` | CartPage | ✅ 실제 API | 장바구니 |
| `/mypage` | MyPage | ✅ 실제 API | 마이페이지 (주문 내역, 회원 정보) |
| `/orders/:orderPublicId` | OrderDetailPage | ✅ 실제 API | 주문 상세 (신규 추가) |
| `/store/:vendorName` | VendorStorePage | 🟡 Mock | 판매자 스토어 |

### 판매자 영역 (별도 레이아웃)
| 경로 | 페이지 | 상태 | 설명 |
|------|--------|------|------|
| `/vendor` | VendorDashboardPage | 🟡 Mock | 판매자 대시보드 |
| `/vendor/products` | VendorProductsPage | 🟡 Mock | 상품 관리 |
| `/vendor/products/:id` | VendorProductDetailPage | 🟡 Mock | 상품 상세 관리 |
| `/vendor/orders` | VendorOrdersPage | ✅ 실제 API | 주문 관리 (필터링, 통계) |
| `/vendor/settlement` | VendorSettlementPage | 🟡 Mock | 정산 관리 |
| `/vendor/settings` | VendorSettingsPage | 🟡 Mock | 스토어 설정 |

### 관리자 영역 (별도 레이아웃)
| 경로 | 페이지 | 상태 | 설명 |
|------|--------|------|------|
| `/admin` | AdminDashboardPage | 🟡 Mock | 관리자 대시보드 |
| `/admin/vendors` | AdminVendorsPage | 🟡 Mock | 판매자 관리 |
| `/admin/products` | AdminProductsPage | 🟡 Mock | 상품 관리 |
| `/admin/orders` | AdminOrdersPage | 🟡 Mock | 주문 모니터링 |
| `/admin/users` | AdminUsersPage | 🟡 Mock | 사용자 관리 |

---

## 🔌 API 연동 상태

### ✅ 완전히 연동된 기능 (실제 백엔드 API)

#### 1. 사용자 정보
- **파일**: `src/services/userService.ts`
- **엔드포인트**: `GET /users/:id`
- **사용처**: MyPage, Header

#### 2. 장바구니
- **파일**: `src/api/cartApi.ts`, `src/hooks/useCart.ts`
- **엔드포인트**:
  - `GET /carts` - 장바구니 조회
  - `POST /carts/items` - 상품 추가
  - `PATCH /carts/items/:itemId` - 수량 수정
  - `DELETE /carts/items/:itemId` - 아이템 삭제
  - `DELETE /carts/items` - 전체 비우기
- **사용처**: CartPage, Header (장바구니 개수)

#### 3. 주문 시스템 (최근 구현 완료!)
- **파일**: `src/api/orderApi.ts`, `src/hooks/useOrders.ts`
- **엔드포인트**:
  - `POST /orders` - 주문 생성 (장바구니 → 주문)
  - `GET /orders` - 내 주문 목록 (필터링 지원)
  - `GET /orders/:orderPublicId` - 내 주문 상세
  - `GET /orders/vendor` - 판매자 주문 목록 (필터링 지원)
  - `GET /orders/vendor/:orderPublicId` - 판매자 주문 상세
  - `POST /orders/:orderPublicId/cancel` - 주문 취소
- **사용처**:
  - CartPage (주문 생성)
  - MyPage (내 주문 내역, 상태/날짜 필터링)
  - OrderDetailPage (주문 상세, 주문 취소)
  - VendorOrdersPage (판매자 주문 관리, 상태/날짜 필터링)

#### 주문 필터링 기능
모든 주문 조회 API는 **쿼리 파라미터**를 통한 필터링을 지원합니다:

```typescript
interface OrderSearchParams {
  status?: OrderStatus      // 주문 상태 필터
  from?: string            // 시작 날짜 (YYYY-MM-DD)
  to?: string              // 종료 날짜 (YYYY-MM-DD)
  page?: number            // 페이지 번호
  size?: number            // 페이지 크기
}
```

**주문 상태 종류**:
- `CREATED` - 주문 생성
- `PAYMENT_REQUESTED` - 결제 요청
- `PAYMENT_APPROVED` - 결제 완료
- `PAYMENT_FAILED` - 결제 실패
- `CANCELED` - 취소됨

### 🟡 Mock 데이터 사용 중

#### 상품 관련
- **파일**: `src/api/productApi.ts`, `src/hooks/useProducts.ts`
- **상태**: Mock 데이터 (8개 상품)
- **TODO**: 백엔드 `/api/product-sync` 연동 필요
- **준비**: 실제 API 호출 코드는 주석 처리되어 준비되어 있음

---

## ✅ 구현 상태

### 완전히 구현된 기능
- ✅ Keycloak 인증 (로그인/로그아웃)
- ✅ 사용자 정보 조회 (실제 API)
- ✅ 장바구니 전체 기능 (실제 API)
  - 조회, 추가, 수량 수정, 삭제, 전체 비우기
- ✅ 주문 생성 (실제 API)
  - 장바구니에서 주문 생성
  - 주문 완료 후 자동으로 장바구니 비워짐
- ✅ 주문 내역 조회 (실제 API)
  - 사용자 주문 목록 (MyPage)
  - 판매자 주문 목록 (VendorOrdersPage)
  - 상태별 필터링
  - 날짜 범위 필터링
- ✅ 주문 상세 페이지 (실제 API)
  - 주문 정보, 상품 목록, 결제 정보
  - 주문 취소 기능
- ✅ 판매자 주문 통계
  - 상태별 주문 개수
  - 총 매출 계산 (판매자 상품만)
- ✅ TanStack Query를 사용한 서버 상태 관리
- ✅ 반응형 디자인

### 부분 구현된 기능
- 🟡 상품 목록/상세 (Mock 데이터)
- 🟡 리뷰 시스템 (조회만 가능, 작성 불가)
- 🟡 판매자 상품 관리 (목록만, CRUD 없음)
- 🟡 판매자 대시보드 (통계 Mock)
- 🟡 관리자 기능 (전부 Mock)

---

## 🎯 다음 작업 항목

### 우선순위 1: 상품 API 연동 (필수)
현재 상품 데이터가 Mock이므로, 실제 백엔드와 연동 필요

#### 작업 내용
1. **상품 목록/상세 API 연동**
   - 파일: `src/api/productApi.ts`
   - 엔드포인트: `GET /api/product-sync`, `GET /api/product-sync/:id`
   - 현재: Mock 데이터 8개 사용 중
   - 준비 상태: 실제 API 코드는 주석 처리되어 있음 (바로 활성화 가능)

2. **타입 검증**
   - 백엔드 Response DTO와 프론트엔드 타입 일치 확인
   - 모든 ID가 `string` 타입인지 확인

### 우선순위 2: 판매자 상품 CRUD
판매자가 상품을 등록/수정/삭제할 수 있어야 함

#### 작업 내용
1. **상품 등록 폼**
   - 파일: `src/pages/vendor/VendorProductsPage.tsx`
   - 현재: 모달은 뜨지만 "상품 등록 폼이 여기에 표시됩니다." 텍스트만
   - 필요: 상품 정보 입력 폼 + 이미지 업로드 + API 연동

2. **상품 수정 폼**
   - 기존 상품 데이터 불러오기
   - 수정 후 API 호출

3. **상품 삭제**
   - 삭제 확인 모달
   - API 호출 후 목록 갱신

4. **필요한 백엔드 엔드포인트**
   - `POST /api/vendor/products` - 상품 등록
   - `PUT /api/vendor/products/:id` - 상품 수정
   - `DELETE /api/vendor/products/:id` - 상품 삭제

### 우선순위 3: 검색 및 필터링
사용자 경험 개선을 위한 기능

#### 작업 내용
1. **검색 기능**
   - 파일: `src/components/layout/Header.tsx`
   - 현재: 검색창만 있고 동작 안함
   - 필요: 검색 결과 페이지 + API 연동

2. **카테고리 필터링**
   - 파일: `src/components/home/CategoryGrid.tsx`
   - 현재: 버튼만 있고 필터링 안됨
   - 필요: 카테고리별 상품 필터링 로직

3. **정렬 기능**
   - 최신순, 인기순, 가격순 등

### 우선순위 4: 리뷰 시스템
상품 신뢰도 향상

#### 작업 내용
1. **리뷰 작성 기능**
   - 파일: `src/components/product/ProductTabs.tsx`
   - 현재: "리뷰 작성하기" 버튼만 있고 모달 없음
   - 필요: 리뷰 작성 모달 + API 연동

2. **리뷰 수정/삭제**
   - 본인이 작성한 리뷰만 수정/삭제 가능

### 우선순위 5: 관리자 기능
플랫폼 운영을 위한 관리 기능

#### 작업 내용
1. **판매자 승인/거부**
   - 파일: `src/pages/admin/AdminVendorsPage.tsx`
   - 현재: 버튼만 있고 동작 안함
   - 필요: API 연동

2. **사용자 정지/해제**
   - 파일: `src/pages/admin/AdminUsersPage.tsx`
   - 필요: API 연동

3. **통계 대시보드**
   - 전체 매출, 주문 통계, 사용자 통계 등

---

## 💡 개발 가이드

### Mock에서 실제 API로 전환하는 방법

#### 예시: 상품 API 전환

**1단계: API 파일 수정**

```typescript
// src/api/productApi.ts

// ❌ Mock 코드 제거/주석
export const productApi = {
  async getProducts(): Promise<Product[]> {
    // await delay(300)  // 제거
    // return products   // 제거

    // ✅ 실제 API 호출 (현재 주석 처리된 코드 활성화)
    try {
      const response = await apiClient.get<Product[]>('/product-sync')
      return response.data
    } catch (error) {
      console.error('Failed to fetch products:', error)
      throw new Error('상품 목록을 불러오는데 실패했습니다')
    }
  }
}
```

**2단계: React Query 확인**

```typescript
// src/hooks/useProducts.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
    // 추가 옵션 설정 가능
    staleTime: 60000,  // 1분간 캐시
    retry: 1,
  })
}
```

**3단계: 타입 확인**

백엔드 Response DTO와 프론트엔드 타입이 일치하는지 확인:

```typescript
// src/types/product.ts
export interface Product {
  id: string            // ✅ Snowflake Base62 ID
  name: string
  price: number
  stock: number
  // ... 백엔드 Response와 동일하게
}
```

### 새로운 API 추가하는 방법

**1단계: 타입 정의**

```typescript
// src/types/yourFeature.ts
export interface YourFeatureResponse {
  id: string
  // ... 필드 정의
}

export interface YourFeatureRequest {
  // ... 요청 필드
}
```

**2단계: API 클라이언트 작성**

```typescript
// src/api/yourFeatureApi.ts
import { apiClient } from './client'
import type { YourFeatureResponse, YourFeatureRequest } from '../types/yourFeature'

export const yourFeatureApi = {
  async getList(): Promise<YourFeatureResponse[]> {
    try {
      const response = await apiClient.get<YourFeatureResponse[]>('/your-endpoint')
      return response.data
    } catch (error) {
      console.error('Failed:', error)
      throw new Error('데이터를 불러오는데 실패했습니다')
    }
  },

  async create(data: YourFeatureRequest): Promise<YourFeatureResponse> {
    try {
      const response = await apiClient.post<YourFeatureResponse>('/your-endpoint', data)
      return response.data
    } catch (error) {
      console.error('Failed:', error)
      throw new Error('생성에 실패했습니다')
    }
  }
}
```

**3단계: React Query Hook 작성**

```typescript
// src/hooks/useYourFeature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { yourFeatureApi } from '../api/yourFeatureApi'
import type { YourFeatureRequest } from '../types/yourFeature'

export function useYourFeatureList() {
  return useQuery({
    queryKey: ['yourFeature'],
    queryFn: () => yourFeatureApi.getList()
  })
}

export function useCreateYourFeature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: YourFeatureRequest) => yourFeatureApi.create(data),
    onSuccess: () => {
      // 캐시 무효화로 자동 리프레시
      queryClient.invalidateQueries({ queryKey: ['yourFeature'] })
    }
  })
}
```

**4단계: 컴포넌트에서 사용**

```typescript
// src/pages/YourPage.tsx
import { useYourFeatureList, useCreateYourFeature } from '../hooks/useYourFeature'

export function YourPage() {
  const { data: items = [], isLoading, error } = useYourFeatureList()
  const createMutation = useCreateYourFeature()

  const handleCreate = async (data: YourFeatureRequest) => {
    try {
      await createMutation.mutateAsync(data)
      alert('생성 완료!')
    } catch (error) {
      alert('생성 실패')
    }
  }

  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>에러 발생</div>

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### API 클라이언트 (apiClient) 사용법

`src/api/client.ts`의 `apiClient`는 Axios 인스턴스로, 자동으로 JWT 토큰을 주입합니다.

```typescript
// GET 요청
const response = await apiClient.get<ResponseType>('/endpoint')

// POST 요청
const response = await apiClient.post<ResponseType>('/endpoint', requestData)

// PUT 요청
const response = await apiClient.put<ResponseType>('/endpoint/:id', requestData)

// DELETE 요청
const response = await apiClient.delete<ResponseType>('/endpoint/:id')

// Query Parameter
const response = await apiClient.get<ResponseType>('/endpoint', {
  params: { status: 'active', page: 0, size: 10 }
})
```

### TanStack Query 사용 팁

#### 1. Query Key 네이밍
```typescript
// ✅ 좋은 예
queryKey: ['orders', 'my', params]           // 내 주문 목록
queryKey: ['orders', 'detail', orderPublicId] // 주문 상세
queryKey: ['orders', 'vendor', params]       // 판매자 주문 목록

// ❌ 나쁜 예
queryKey: ['order']  // 너무 일반적
queryKey: ['orders', orderPublicId, params] // 순서 일관성 없음
```

#### 2. Cache Invalidation
```typescript
// 특정 키만 무효화
queryClient.invalidateQueries({ queryKey: ['orders', 'my'] })

// 모든 orders 무효화
queryClient.invalidateQueries({ queryKey: ['orders'] })
```

#### 3. Optimistic Update
```typescript
const mutation = useMutation({
  mutationFn: updateApi,
  onMutate: async (newData) => {
    // 이전 데이터 백업
    await queryClient.cancelQueries({ queryKey: ['data'] })
    const previousData = queryClient.getQueryData(['data'])

    // 낙관적 업데이트
    queryClient.setQueryData(['data'], newData)

    return { previousData }
  },
  onError: (err, newData, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(['data'], context.previousData)
  },
  onSettled: () => {
    // 성공/실패 상관없이 재조회
    queryClient.invalidateQueries({ queryKey: ['data'] })
  }
})
```

---

## 🐛 알려진 이슈 및 주의사항

### 1. ID 타입은 항상 string
```typescript
// ❌ 잘못된 코드
const productId: number = 123
navigate(`/products/${productId}`)

// ✅ 올바른 코드
const productId: string = "01HQXYZ..."
navigate(`/products/${productId}`)
```

### 2. 주문 상태는 이벤트로 자동 변경됨
프론트엔드에서 주문 상태를 직접 변경하지 않습니다. 결제 시스템이 이벤트를 통해 자동 업데이트합니다.

```typescript
// ❌ 잘못된 접근
// 프론트엔드에서 직접 상태 변경하려고 시도
await orderApi.updateStatus(orderId, 'PAYMENT_APPROVED')

// ✅ 올바른 접근
// 주문만 생성하고, 상태는 자동으로 변경됨
await orderApi.createOrder()
// → 백엔드와 payment-system이 이벤트로 상태 업데이트
```

### 3. Keycloak 서버 필수
Keycloak이 실행 중이어야 로그인/인증이 가능합니다.

```bash
# Keycloak 실행 확인
curl http://localhost:8080/realms/hamster-world
```

### 4. CORS 설정
백엔드에서 프론트엔드 주소를 CORS에 추가해야 합니다.

```yaml
# 백엔드 application.yml
spring:
  web:
    cors:
      allowed-origins: http://localhost:5173
```

---

## 📚 참고 자료

### 공식 문서
- [React 공식 문서](https://react.dev/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Tailwind CSS 문서](https://tailwindcss.com/)
- [Keycloak JavaScript Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [React Router 문서](https://reactrouter.com/)

### 프로젝트 관련
- **백엔드 레포지토리**: (링크 추가 필요)
- **API 문서**: (Swagger/Postman 링크 추가 필요)
- **아키텍처 다이어그램**: (링크 추가 필요)

---

## 📞 문의

프로젝트 관련 문의사항이나 버그 제보는 이슈를 등록해주세요.

---

## 📝 버전 히스토리

### v1.2.0 (2026-02-02)
- ✅ 주문 시스템 실제 API 연동 완료
  - 주문 생성, 조회, 상세, 취소
  - 사용자 주문 내역 (MyPage)
  - 판매자 주문 관리 (VendorOrdersPage)
  - 주문 상세 페이지 (OrderDetailPage) 신규 추가
- ✅ 주문 필터링 기능
  - 상태별 필터링 (CREATED, PAYMENT_APPROVED 등)
  - 날짜 범위 필터링 (시작일, 종료일)
  - 필터 초기화 기능
- ✅ 판매자 주문 통계
  - 상태별 주문 개수 표시
  - 총 매출 계산 (판매자 상품만)

### v1.1.0 (이전)
- ✅ 장바구니 실제 API 연동 완료
- ✅ 사용자 정보 API 연동 완료
- ✅ Keycloak 인증 구현
- ✅ 기본 UI 및 라우팅 구조 완성
