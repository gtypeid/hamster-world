import { useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { products as initialProducts } from '../../data/products'
import { useAlert } from '../../contexts/AlertContext'

export function AdminProductsPage() {
  const { showAlert, showConfirm } = useAlert()
  const [products, setProducts] = useState(initialProducts.map(p => ({ ...p, hidden: false })))
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null)

  const handleToggleHidden = (productId: string) => {
    setProducts(products.map(p =>
      p.id === productId ? { ...p, hidden: !p.hidden } : p
    ))
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hamster-brown mb-2">
            📦 전체 상품 관리
          </h1>
          <p className="text-gray-600">모든 판매자의 상품을 관리하세요</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">전체 상품</p>
            <p className="text-2xl font-bold text-hamster-brown">{products.length}개</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">판매중</p>
            <p className="text-2xl font-bold text-green-600">{products.filter(p => p.stock > 0).length}개</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">품절</p>
            <p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock === 0).length}개</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">신고된 상품</p>
            <p className="text-2xl font-bold text-yellow-600">0개</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-hamster-brown text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">이미지</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">판매자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">가격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">재고</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">판매량</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">별점</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="bg-gradient-to-br from-hamster-ivory to-hamster-beige rounded-lg w-16 h-16 flex items-center justify-center">
                        <span className="text-3xl">{product.images[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-hamster-brown">{product.name}</p>
                      <p className="text-xs text-gray-500">ID: {product.id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.vendor}
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
                      {product.soldCount.toLocaleString()}개
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium">{product.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          상세
                        </button>
                        <button
                          onClick={async () => {
                            const action = product.hidden ? '노출' : '숨김'
                            if (await showConfirm(`"${product.name}" 상품을 ${action} 처리하시겠습니까?`)) {
                              handleToggleHidden(product.id)
                              showAlert(`상품이 ${action} 처리되었습니다 ${product.hidden ? '👁️' : '🙈'}`)
                            }
                          }}
                          className={`text-sm font-medium ${
                            product.hidden ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          {product.hidden ? '노출' : '숨김'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
