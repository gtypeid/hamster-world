import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MerchantLayout } from '../../components/merchant/MerchantLayout'
import { useAlert } from '../../contexts/AlertContext'
import { useProducts } from '../../hooks/useProducts'
import { useCreateProduct, useUpdateProduct, useAdjustStock } from '../../hooks/useMerchantProducts'


export function MerchantProductsPage() {
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlert()
  const { data: allProducts = [], isLoading, error } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const adjustStock = useAdjustStock()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  // TODO: 현재 로그인한 판매자의 상품만 필터링 (User 정보 필요)
  const merchantProducts = allProducts

  // 상품 등록/수정 폼 상태
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'FOOD',  // 백엔드 enum 값
    price: '',
    stock: '',
    imageUrl: '',
    description: ''
  })

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      category: 'FOOD',
      price: '',
      stock: '',
      imageUrl: '',
      description: ''
    })
    setEditingProduct(null)
  }

  const handleOpenAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku || '',
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.images?.[0] || '',
      description: product.description || ''
    })
    setShowAddModal(true)
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      showAlert('상품명과 가격은 필수 입력 항목입니다.')
      return
    }

    try {
      if (editingProduct) {
        // 수정 모드 - PUT /api/merchant/products/{id}
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          request: {
            name: formData.name,
            description: formData.description || undefined,
            imageUrl: formData.imageUrl || undefined,
            category: formData.category,
            price: parseFloat(formData.price)
          }
        })
        showAlert(`"${formData.name}" 상품이 수정되었습니다! ✏️`)
      } else {
        // 등록 모드 - POST /api/merchant/products
        if (!formData.sku || !formData.stock) {
          showAlert('신규 등록 시 SKU와 초기 재고는 필수입니다.')
          return
        }

        const initialStock = parseInt(formData.stock)
        if (isNaN(initialStock) || initialStock < 0) {
          showAlert('초기 재고는 0 이상의 숫자여야 합니다.')
          return
        }

        const requestData = {
          sku: formData.sku,
          name: formData.name,
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          category: formData.category,
          price: parseFloat(formData.price),
          initialStock: initialStock
        }

        console.log('[MerchantProductsPage] Creating product with data:', requestData)

        await createProduct.mutateAsync(requestData)
        showAlert(`"${formData.name}" 상품이 등록되었습니다! 🎉`)
      }

      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Product save failed:', error)
      showAlert('상품 저장에 실패했습니다.')
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <MerchantLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <span className="text-7xl animate-bounce block mb-4">🐹</span>
            <p className="text-xl text-gray-600">상품 목록을 불러오는 중...</p>
          </div>
        </div>
      </MerchantLayout>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <MerchantLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <span className="text-7xl block mb-4">😵</span>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              상품 목록을 불러오는데 실패했습니다
            </h2>
            <p className="text-gray-600">
              {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
            </p>
          </div>
        </div>
      </MerchantLayout>
    )
  }

  return (
    <MerchantLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hamster-brown mb-2">
              📦 상품 관리
            </h1>
            <p className="text-gray-600">등록한 상품을 관리하세요</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
          >
            + 상품 등록
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">전체 상품</p>
            <p className="text-2xl font-bold text-hamster-brown">{merchantProducts.length}개</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">판매중</p>
            <p className="text-2xl font-bold text-green-600">{merchantProducts.filter(p => p.stock > 0).length}개</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">품절</p>
            <p className="text-2xl font-bold text-red-600">{merchantProducts.filter(p => p.stock === 0).length}개</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-500 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">이미지</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">가격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">재고</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">리뷰</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {merchantProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => navigate(`/merchant/products/${product.id}`)}
                    className="hover:bg-amber-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-lg w-16 h-16 flex items-center justify-center">
                        <span className="text-3xl">
                          {Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '📦'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-hamster-brown">{product.name}</p>
                      <p className="text-xs text-gray-500">ID: {product.id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {product.price.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        product.stock > 10 ? 'text-green-600' :
                        product.stock > 0 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {product.stock}개
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.reviewCount?.toLocaleString() ?? 0}개
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.stock > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 0 ? '판매중' : '품절'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-hamster-brown">
                  {editingProduct ? '✏️ 상품 수정' : '📦 상품 등록'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* SKU (신규 등록 시에만 입력, 수정 시 비활성) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    SKU (상품 코드) {!editingProduct && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="예: PROD-001"
                    disabled={!!editingProduct}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {editingProduct && (
                    <p className="text-xs text-gray-500 mt-1">SKU는 수정할 수 없습니다</p>
                  )}
                </div>

                {/* 상품명 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    상품명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 프리미엄 도토리 세트"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 카테고리 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      카테고리 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="FOOD">간식</option>
                      <option value="SPORTS">운동기구</option>
                      <option value="FURNITURE">가구</option>
                      <option value="TOYS">장난감</option>
                      <option value="OTHER">기타</option>
                    </select>
                  </div>

                  {/* 가격 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      가격 (원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="15000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 초기 재고 (신규 등록 시에만 표시) */}
                {!editingProduct && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      초기 재고 수량 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      등록 후 재고 조정은 상품 목록에서 "재고 조정" 버튼을 사용하세요
                    </p>
                  </div>
                )}

                {/* 이미지 URL */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    이미지 URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    미입력 시 기본 이미지가 사용됩니다
                  </p>
                </div>

                {/* 상품 설명 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    상품 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="신선하고 맛있는 프리미엄 도토리를 햄스터들에게!"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                  >
                    {editingProduct ? '수정하기' : '등록하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MerchantLayout>
  )
}
