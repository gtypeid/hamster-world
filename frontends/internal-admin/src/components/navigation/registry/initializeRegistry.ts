import { ViewerRegistry } from './ViewerRegistry'
import { RelationRegistry } from './RelationRegistry'
import { ProcessDetailViewer } from '../viewers/ProcessDetailViewer'
import { ProductDetailViewer } from '../viewers/ProductDetailViewer'
import { EcommerceProductDetailViewer } from '../viewers/EcommerceProductDetailViewer'
import { OrderDetailViewer } from '../viewers/OrderDetailViewer'
import { UserDetailViewer } from '../viewers/UserDetailViewer'

// API Services
import { fetchProductDetail } from '@/api/productService'
import { fetchEcommerceProductDetail } from '@/api/ecommerceProductService'
import { fetchOrderDetail } from '@/api/orderService'
import { fetchUserDetail } from '@/api/userService'

/**
 * Registry 초기화
 * - 앱 시작 시 한 번만 호출
 * - 모든 뷰어와 관계 등록
 */
export function initializeRegistry() {
  // ===== Viewer 등록 =====

  // Process Detail (Cash Gateway) - TODO: API 구현 후 fetcher 추가
  ViewerRegistry.register({
    type: 'process-detail',
    title: 'PaymentProcess 상세',
    component: ProcessDetailViewer,
    service: 'gateway',
    // fetcher: fetchProcessDetail, // TODO: Cash Gateway API 구현 후 추가
  })

  // Product Detail (Payment Service) - Event Sourcing 포함
  ViewerRegistry.register({
    type: 'product-detail',
    title: 'Product 상세',
    component: ProductDetailViewer,
    service: 'payment',
    fetcher: fetchProductDetail, // Payment Service API
    myItem: {
      searchBy: (id) => ({ field: 'publicId', value: id }),
    },
  })

  // Ecommerce Product Detail
  ViewerRegistry.register({
    type: 'ecommerce-product-detail',
    title: 'Ecommerce Product 상세',
    component: EcommerceProductDetailViewer,
    service: 'ecommerce', // Ecommerce Service 소속
    fetcher: fetchEcommerceProductDetail, // Ecommerce Service API
    myItem: {
      searchBy: (id) => ({ field: 'ecommerceProductId', value: id }),
      listRoute: '/payment/resource', // Payment 자원 관리 페이지에서 보임
    },
  })

  // Order Detail (Ecommerce Service)
  ViewerRegistry.register({
    type: 'order-detail',
    title: 'Order 상세',
    component: OrderDetailViewer,
    service: 'ecommerce',
    fetcher: fetchOrderDetail, // Ecommerce Service Admin API
    myItem: {
      searchBy: (id) => ({ field: 'orderPublicId', value: id }),
    },
  })

  // User Detail (Ecommerce Service)
  ViewerRegistry.register({
    type: 'user-detail',
    title: 'User 상세',
    component: UserDetailViewer,
    service: 'ecommerce',
    fetcher: fetchUserDetail, // Ecommerce Service Admin API
    myItem: {
      searchBy: (id) => ({ field: 'publicId', value: id }),
    },
  })

  // TODO: 추가 뷰어 등록
  // ViewerRegistry.register({
  //   type: 'payment-detail',
  //   title: 'Payment 상세',
  //   icon: '💳',
  //   component: PaymentDetailViewer,
  // })

  // ViewerRegistry.register({
  //   type: 'event-timeline',
  //   title: 'Event Timeline',
  //   icon: '📡',
  //   component: EventTimelineViewer,
  // })

  // ViewerRegistry.register({
  //   type: 'trace-timeline',
  //   title: 'Trace Timeline',
  //   icon: '🔗',
  //   component: TraceTimelineViewer,
  // })

  // ===== Relation 등록 =====

  // Cash Gateway Relations
  RelationRegistry.register({
    from: 'process-id',
    to: 'order-id',
    type: 'belongs-to',
    label: 'Process → Order',
    field: 'orderPublicId', // API 응답에서 이 필드를 찾음
  })

  RelationRegistry.register({
    from: 'process-id',
    to: 'user-id',
    type: 'belongs-to',
    label: 'Process → User',
    field: 'userPublicId',
  })

  RelationRegistry.register({
    from: 'process-id',
    to: 'payment-id',
    type: 'has-one',
    label: 'Process → Payment',
    field: 'paymentPublicId',
  })

  RelationRegistry.register({
    from: 'process-id',
    to: 'event-id',
    type: 'has-many',
    label: 'Process → Events',
    // field 없음 - 백엔드 API에서 ProcessDetail.events 배열로 제공
  })

  // Payment Service Relations
  RelationRegistry.register({
    from: 'product-id',
    to: 'ecommerce-product-id',
    type: 'references',
    label: 'Product → Ecommerce Product',
    field: 'ecommerceProductId',
  })

  // Ecommerce Service Relations
  RelationRegistry.register({
    from: 'ecommerce-product-id',
    to: 'product-id',
    type: 'has-many',
    label: 'Ecommerce Product → Payment Products',
    // TODO: fetch 함수로 구현 (백엔드에서 ecommerceProductId로 Payment Product 목록 조회)
    fetch: async (ecommerceProductId: string) => {
      // 임시: Mock 데이터
      console.log(`Fetching payment products for ecommerce product: ${ecommerceProductId}`)
      return ['PROD_1aB2cD3eF4gH5iJ6', 'PROD_2bC3dE4fG5hI6jK7']
    },
  })

  RelationRegistry.register({
    from: 'product-id',
    to: 'product-record-id',
    type: 'has-many',
    label: 'Product → Records (Event Sourcing)',
    // field 없음 - 백엔드 API에서 ResourceDetail.records 배열로 제공
  })

  // Event Relations
  RelationRegistry.register({
    from: 'event-id',
    to: 'trace-id',
    type: 'traces-to',
    label: 'Event → Trace',
    field: 'traceId',
  })

  RelationRegistry.register({
    from: 'trace-id',
    to: 'event-id',
    type: 'grouped-by',
    label: 'Trace → Events',
    // fetch 함수로 구현 (백엔드에서 traceId로 모든 이벤트 조회)
    fetch: async (traceId: string) => {
      // TODO: 실제 API 호출
      console.log(`Fetching events for trace: ${traceId}`)
      return []
    },
  })

  console.log('✅ Navigation Registry initialized')
}
