import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartQuantity, useRemoveFromCart, useClearCart } from '../hooks/useCart'
import { useAuth } from '../contexts/AuthContext'
import { useAlert } from '../contexts/AlertContext'
import { useCreateOrder } from '../hooks/useOrders'

export function CartPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { showAlert, showConfirm } = useAlert()
  const { data: cartItems = [], isLoading, error } = useCart()
  const updateQuantity = useUpdateCartQuantity()
  const removeItem = useRemoveFromCart()
  const clearCart = useClearCart()
  const createOrder = useCreateOrder()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleQuantityChange = (itemId: string, currentQuantity: number, delta: number, maxStock: number) => {
    const newQuantity = currentQuantity + delta
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      updateQuantity.mutate(
        { itemId, quantity: newQuantity },
        {
          onError: (error) => {
            console.error('Failed to update quantity:', error)
            showAlert('수량 변경에 실패했습니다.')
          }
        }
      )
    }
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem.mutate(itemId, {
      onError: (error) => {
        console.error('Failed to remove item:', error)
        showAlert('상품 삭제에 실패했습니다.')
      }
    })
  }

  const handleClearCart = async () => {
    if (await showConfirm('장바구니를 전체 삭제하시겠습니까?')) {
      clearCart.mutate(undefined, {
        onError: (error) => {
          console.error('Failed to clear cart:', error)
          showAlert('장바구니 비우기에 실패했습니다.')
        }
      })
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showAlert('장바구니가 비어있습니다')
      return
    }

    if (await showConfirm(`총 ${totalPrice.toLocaleString()}원을 결제하시겠습니까?`)) {
      try {
        setIsCheckingOut(true)
        const result = await createOrder.mutateAsync()

        showAlert(
          `주문이 생성되었습니다!\n` +
          `주문번호: ${result.order.orderNumber}\n` +
          `금액: ${totalPrice.toLocaleString()}원\n\n` +
          `결제가 처리 중입니다...`
        )

        // 주문 완료 후 홈으로 이동
        navigate('/')
      } catch (error) {
        console.error('Checkout failed:', error)
        showAlert(error instanceof Error ? error.message : '주문 생성에 실패했습니다')
      } finally {
        setIsCheckingOut(false)
      }
    }
  }

  const totalPrice = cartItems.reduce((sum, item) =>
    sum + (item.product.price * item.cartItem.quantity), 0
  )

  const totalItems = cartItems.reduce((sum, item) => sum + item.cartItem.quantity, 0)

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl animate-bounce block mb-4">🐹</span>
          <p className="text-xl text-gray-600">장바구니를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl block mb-4">😵</span>
          <h1 className="text-3xl font-bold text-hamster-brown mb-4">
            데이터를 불러오는데 실패했어요
          </h1>
          <p className="text-gray-600 mb-8">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
          </p>
          <Link
            to="/"
            className="inline-block bg-amber-500 text-white px-8 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 빈 장바구니
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-9xl block mb-4">🛒</span>
          <h1 className="text-3xl font-bold text-hamster-brown mb-4">
            장바구니가 비어있습니다
          </h1>
          <p className="text-gray-600 mb-8">
            맛있는 도토리와 해바라기씨를 담아보세요!
          </p>
          <Link
            to="/"
            className="inline-block bg-amber-500 text-white px-8 py-3 rounded-full font-bold hover:bg-amber-600 transition-colors"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            🛒 장바구니
          </h1>
          <p className="text-gray-600">
            {totalItems}개의 상품이 담겨있습니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Clear All Button */}
            <div className="flex justify-end">
              <button
                onClick={handleClearCart}
                disabled={clearCart.isPending}
                className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
              >
                {clearCart.isPending ? '삭제 중...' : '전체 삭제'}
              </button>
            </div>

            {/* Items List */}
            {cartItems.map(({ product, cartItem }) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    to={`/products/${product.id}`}
                    className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-xl w-32 h-32 flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-6xl">{product.images[0]}</span>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link
                          to={`/products/${product.id}`}
                          className="font-bold text-lg text-hamster-brown hover:text-hamster-orange"
                        >
                          {product.name}
                        </Link>
                        <p className="text-sm text-gray-500">{product.vendor}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(cartItem.id)}
                        disabled={removeItem.isPending}
                        className="text-gray-400 hover:text-red-600 text-xl disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-2xl font-bold text-hamster-orange mb-4">
                      {product.price.toLocaleString()}원
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
                        <button
                          onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity, -1, product.stock)}
                          disabled={cartItem.quantity <= 1 || updateQuantity.isPending}
                          className="w-8 h-8 flex items-center justify-center text-xl font-bold text-gray-600 hover:text-hamster-orange disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-bold">{cartItem.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity, 1, product.stock)}
                          disabled={cartItem.quantity >= product.stock || updateQuantity.isPending}
                          className="w-8 h-8 flex items-center justify-center text-xl font-bold text-gray-600 hover:text-hamster-orange disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">상품 금액</p>
                        <p className="text-xl font-bold text-gray-900">
                          {(product.price * cartItem.quantity).toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {product.stock <= 5 && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ 재고가 {product.stock}개 남았습니다
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-hamster-brown mb-4">
                주문 요약
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>상품 금액</span>
                  <span>{totalPrice.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>배송비</span>
                  <span className="text-green-600 font-medium">무료</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>총 결제 금액</span>
                  <span className="text-hamster-orange">{totalPrice.toLocaleString()}원</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || cartItems.length === 0}
                className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? '결제 진행 중...' : '주문하기'}
              </button>

              <Link
                to="/"
                className="block text-center text-hamster-orange hover:text-amber-600 font-medium"
              >
                쇼핑 계속하기
              </Link>

              {/* Benefits */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>배송비 무료</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>안전한 결제</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>빠른 배송</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
