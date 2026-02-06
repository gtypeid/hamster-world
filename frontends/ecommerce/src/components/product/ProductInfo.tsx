import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAddToCart } from '../../hooks/useCart'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import type { ProductDetailResponse } from '../../types/api'
import { requireAuth } from '../../utils/auth'

interface ProductInfoProps {
  productDetail: ProductDetailResponse
}

export function ProductInfo({ productDetail }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddToCart()
  const navigate = useNavigate()
  const { showConfirm, showAlert } = useAlert()
  const { user } = useAuth()

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= productDetail.stock) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    addToCart.mutate(
      { productId: productDetail.publicId, quantity },
      {
        onSuccess: async () => {
          if (await showConfirm('장바구니에 추가되었습니다! 🛒\n장바구니로 이동하시겠습니까?')) {
            navigate('/cart')
          }
        },
        onError: (error) => {
          console.error('Failed to add to cart:', error)
          showConfirm(
            error instanceof Error
              ? `장바구니 추가에 실패했습니다.\n${error.message}`
              : '장바구니 추가에 실패했습니다. 다시 시도해주세요.'
          )
        },
      }
    )
  }

  const handleBuyNow = () => {
    addToCart.mutate(
      { productId: productDetail.publicId, quantity },
      {
        onSuccess: () => {
          navigate('/cart')
        },
        onError: (error) => {
          console.error('Failed to add to cart:', error)
          showConfirm(
            error instanceof Error
              ? `구매 실패했습니다.\n${error.message}`
              : '구매에 실패했습니다. 다시 시도해주세요.'
          )
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Category & Merchant */}
      <div className="flex items-center gap-2 text-sm">
        <span className="bg-hamster-beige text-hamster-brown px-3 py-1 rounded-full font-medium">
          {productDetail.category}
        </span>
        <span className="text-gray-500">•</span>
        <Link
          to={`/merchants/${productDetail.merchant.publicId}`}
          className="text-hamster-brown font-medium hover:text-hamster-orange hover:underline"
        >
          {productDetail.merchant.storeName}
        </Link>
      </div>

      {/* Product Name */}
      <h1 className="text-3xl font-bold text-hamster-brown">
        {productDetail.name}
      </h1>

      {/* Price */}
      <div className="border-t border-b border-gray-200 py-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-hamster-orange">
            {Number(productDetail.price).toLocaleString()}원
          </span>
        </div>
      </div>

      {/* Description */}
      {productDetail.description && (
        <p className="text-gray-700 text-lg">
          {productDetail.description}
        </p>
      )}

      {/* Stock */}
      <div className="text-sm">
        <span className="text-gray-600">재고: </span>
        {productDetail.isSoldOut ? (
          <span className="text-red-600 font-medium">품절</span>
        ) : (
          <span className={productDetail.stock > 10 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {productDetail.stock > 10 ? '충분' : `${productDetail.stock}개 남음`}
          </span>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">수량</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-hamster-orange transition-colors flex items-center justify-center text-xl font-bold disabled:opacity-50"
          >
            -
          </button>
          <span className="w-16 text-center text-xl font-bold">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= productDetail.stock}
            className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-hamster-orange transition-colors flex items-center justify-center text-xl font-bold disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Total Price */}
      <div className="bg-hamster-ivory rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">총 금액</span>
          <span className="text-3xl font-bold text-hamster-orange">
            {(Number(productDetail.price) * quantity).toLocaleString()}원
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => requireAuth(user, handleAddToCart, showAlert)}
          disabled={addToCart.isPending}
          className="flex-1 bg-white border-2 border-hamster-orange text-hamster-orange py-4 rounded-xl font-bold text-lg hover:bg-hamster-ivory transition-colors disabled:opacity-50"
        >
          {addToCart.isPending ? '추가 중...' : '🛒 장바구니'}
        </button>
        <button
          onClick={() => requireAuth(user, handleBuyNow, showAlert)}
          disabled={addToCart.isPending}
          className="flex-1 bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {addToCart.isPending ? '처리 중...' : '바로 구매'}
        </button>
      </div>

      {/* Merchant Info */}
      <div className="border-t border-gray-200 pt-6">
        <Link
          to={`/merchants/${productDetail.merchant.publicId}`}
          className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-4xl">🐹</span>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-hamster-brown">{productDetail.merchant.storeName}</h3>
            <p className="text-sm text-gray-600">판매자 정보 보기 →</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
