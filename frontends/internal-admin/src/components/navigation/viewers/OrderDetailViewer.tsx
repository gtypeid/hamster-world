import { useState, useEffect } from 'react'
import type { ViewerProps } from '@/types/navigation'
import type { OrderDetail, OrderStatus } from '@/types/order'
import { fetchOrderDetail } from '@/api/orderService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Navigable } from '../Navigable'
import { FieldRenderer } from '../FieldRenderer'

/**
 * OrderDetailViewer
 * - Ecommerce Service의 Order 상세 정보 표시
 * - 주문 아이템 목록
 * - GenericDataViewer에서 data를 전달받아 사용 (API 호출은 GenericDataViewer가 담당)
 */
export function OrderDetailViewer({ id, data: initialData }: ViewerProps) {
  const [order, setOrder] = useState<OrderDetail | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 data가 전달되었으면 API 호출 안함
    if (initialData) {
      setOrder(initialData)
      setIsLoading(false)
      return
    }

    // Fallback: data가 없으면 직접 API 호출 (하위 호환성)
    const loadOrder = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchOrderDetail(id)
        setOrder(data)
      } catch (err) {
        console.error('Failed to load order detail:', err)
        setError('주문 상세 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [id, initialData])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-bold mb-2">❌ 오류 발생</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-500 mt-2">Order ID: {id}</p>
      </div>
    )
  }

  if (!order || !order.orderPublicId) {
    return (
      <div className="text-center text-gray-500">
        <p className="font-bold mb-2">❌ 주문을 찾을 수 없어요</p>
        <p className="text-sm">Order ID: {id}</p>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (order.status) {
      case 'CREATED':
        return 'bg-gray-100 text-gray-800'
      case 'PAYMENT_REQUESTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'PAYMENT_APPROVED':
        return 'bg-blue-100 text-blue-800'
      case 'PAYMENT_FAILED':
        return 'bg-red-100 text-red-800'
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = () => {
    const labels: Record<OrderStatus, string> = {
      CREATED: '생성됨',
      PAYMENT_REQUESTED: '결제 요청',
      PAYMENT_APPROVED: '결제 승인',
      PAYMENT_FAILED: '결제 실패',
      CANCELED: '취소됨',
    }
    return labels[order.status]
  }

  return (
    <div className="space-y-6">
      {/* Order Info */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">📦 주문 정보</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">주문 번호:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">총 금액:</span>
            <span className="text-xl font-bold text-hamster-brown">
              ₩{order.totalPrice.toLocaleString('ko-KR')}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">상품 개수:</span>
            <span className="font-bold">{order.items.length}개</span>
          </div>
        </div>
      </section>

      {/* Order Items */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">
          🛍️ 주문 상품 ({order.items.length}개)
        </h4>

        {order.items.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            주문 상품이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.orderItemPublicId}
                className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-hamster-orange transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  {item.productImageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-800 mb-2">{item.productName}</h5>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                      <div>
                        <span className="text-gray-500">수량:</span>{' '}
                        <span className="font-bold">{item.quantity}개</span>
                      </div>
                      <div>
                        <span className="text-gray-500">가격:</span>{' '}
                        <span className="font-bold text-hamster-brown">
                          ₩{item.price.toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between items-center font-mono">
                        <span>Product ID:</span>
                        <Navigable id={item.productPublicId} type="ecommerce-product-id" />
                      </div>
                      <div className="flex justify-between items-center font-mono">
                        <span>Order Item ID:</span>
                        <span className="text-gray-600">{item.orderItemPublicId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related IDs - Using FieldRenderer */}
      <FieldRenderer viewerType="order-detail" data={order} />

      {/* Timestamps */}
      <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h4 className="text-lg font-bold text-hamster-brown mb-4">⏰ 생성/수정 정보</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">주문일:</span>
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>

          {order.modifiedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">수정일:</span>
              <span className="font-medium">
                {new Date(order.modifiedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
