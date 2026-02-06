import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Navigable } from '@/components/navigation/Navigable'
import { fetchOrderList } from '@/api/orderService'
import type { OrderListItem, OrderStatus } from '@/types/order'

export function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchOrderList()
        setOrders(data)
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError('주문 목록을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  // URL 파라미터에서 searchBy 읽고 해당 아이템 찾아서 스크롤/하이라이트
  useEffect(() => {
    const searchByField = searchParams.get('searchBy')
    const searchValue = searchParams.get('searchValue')

    if (!searchByField || !searchValue || isLoading || orders.length === 0) return

    // searchBy 조건에 맞는 Order 찾기
    let targetOrder: OrderListItem | undefined
    if (searchByField === 'orderPublicId') {
      targetOrder = orders.find((o) => o.orderPublicId === searchValue)
    }

    if (!targetOrder) {
      console.warn(`Order not found: ${searchByField}=${searchValue}`)
      setSearchParams({})
      return
    }

    setHighlightedId(targetOrder.orderPublicId)

    // 해당 아이템으로 스크롤 (헤더 영역 고려)
    setTimeout(() => {
      const element = orderRefs.current[targetOrder.orderPublicId]
      if (element) {
        const headerOffset = 200
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    }, 100)

    // 3초 후 하이라이트 제거 & URL 파라미터 제거
    const timer = setTimeout(() => {
      setHighlightedId(null)
      setSearchParams({})
    }, 3000)

    return () => clearTimeout(timer)
  }, [searchParams, isLoading, orders, setSearchParams])

  const filteredOrders =
    filter === 'ALL'
      ? orders
      : orders.filter((order) => order.status === filter)

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-bold mb-2">❌ 오류 발생</p>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">주문 관리</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <FilterButton
            active={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            label="전체"
            count={orders.length}
          />
          <FilterButton
            active={filter === 'CREATED'}
            onClick={() => setFilter('CREATED')}
            label="생성됨"
            count={orders.filter((o) => o.status === 'CREATED').length}
            color="gray"
          />
          <FilterButton
            active={filter === 'PAYMENT_FAILED'}
            onClick={() => setFilter('PAYMENT_FAILED')}
            label="결제 실패"
            count={orders.filter((o) => o.status === 'PAYMENT_FAILED').length}
            color="red"
          />
          <FilterButton
            active={filter === 'PAYMENT_COMPLETED'}
            onClick={() => setFilter('PAYMENT_COMPLETED')}
            label="결제 완료"
            count={orders.filter((o) => o.status === 'PAYMENT_COMPLETED').length}
            color="blue"
          />
          <FilterButton
            active={filter === 'PREPARING'}
            onClick={() => setFilter('PREPARING')}
            label="준비 중"
            count={orders.filter((o) => o.status === 'PREPARING').length}
            color="yellow"
          />
          <FilterButton
            active={filter === 'SHIPPED'}
            onClick={() => setFilter('SHIPPED')}
            label="배송 중"
            count={orders.filter((o) => o.status === 'SHIPPED').length}
            color="purple"
          />
          <FilterButton
            active={filter === 'DELIVERED'}
            onClick={() => setFilter('DELIVERED')}
            label="배송 완료"
            count={orders.filter((o) => o.status === 'DELIVERED').length}
            color="green"
          />
          <FilterButton
            active={filter === 'CANCELLED'}
            onClick={() => setFilter('CANCELLED')}
            label="취소됨"
            count={orders.filter((o) => o.status === 'CANCELLED').length}
            color="gray"
          />
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            해당하는 주문이 없습니다
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isHighlighted = highlightedId === order.orderPublicId
            return (
              <div
                key={order.orderPublicId}
                ref={(el) => (orderRefs.current[order.orderPublicId] = el)}
                className={`transition-all duration-500 ${
                  isHighlighted ? 'ring-4 ring-blue-500 ring-offset-2 rounded-lg' : ''
                }`}
              >
                <OrderCard order={order} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: 'gray' | 'red' | 'blue' | 'yellow' | 'purple' | 'green'
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  color = 'orange',
}: FilterButtonProps) {
  const colorStyles = {
    gray: active ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    red: active ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
    blue: active ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    yellow: active ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    purple: active ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    green: active ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
    orange: active ? 'bg-hamster-orange text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${colorStyles[color]}`}
    >
      {label} ({count})
    </button>
  )
}

interface OrderCardProps {
  order: OrderListItem
}

function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {order.orderNumber}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* IDs Section */}
      <div className="space-y-2 text-xs mb-4 font-mono">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
          <span className="text-gray-500 flex-shrink-0">Order ID:</span>
          <Navigable id={order.orderPublicId} type="order-id" />
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
          <span className="text-gray-500 flex-shrink-0">User ID:</span>
          <Navigable id={order.userPublicId} type="user-id" />
        </div>

        {order.gatewayPaymentPublicId && (
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
            <span className="text-gray-500 flex-shrink-0">Gateway Payment ID:</span>
            <Navigable id={order.gatewayPaymentPublicId} type="process-id" />
          </div>
        )}
      </div>

      {/* Price & Item Count */}
      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {order.itemCount}개 상품
        </p>
        <p className="text-lg font-bold text-gray-800">
          ₩{order.totalPrice.toLocaleString('ko-KR')}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
    CREATED: { label: '생성됨', className: 'bg-gray-100 text-gray-700' },
    PAYMENT_FAILED: { label: '결제 실패', className: 'bg-red-100 text-red-700' },
    PAYMENT_COMPLETED: { label: '결제 완료', className: 'bg-blue-100 text-blue-700' },
    PREPARING: { label: '준비 중', className: 'bg-yellow-100 text-yellow-700' },
    SHIPPED: { label: '배송 중', className: 'bg-purple-100 text-purple-700' },
    DELIVERED: { label: '배송 완료', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: '취소됨', className: 'bg-gray-100 text-gray-700' },
    REFUNDED: { label: '환불됨', className: 'bg-gray-100 text-gray-700' },
  }

  const { label, className } = statusStyles[status]

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>
      {label}
    </span>
  )
}
