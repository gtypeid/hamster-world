import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { AlertProvider } from './contexts/AlertContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { MyPage } from './pages/MyPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { VendorStorePage } from './pages/VendorStorePage'
import { MerchantSellerInfoPage } from './pages/MerchantSellerInfoPage'
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage'
import { VendorProductsPage } from './pages/vendor/VendorProductsPage'
import { VendorProductDetailPage } from './pages/vendor/VendorProductDetailPage'
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage'
import { VendorSettlementPage } from './pages/vendor/VendorSettlementPage'
import { VendorSettingsPage } from './pages/vendor/VendorSettingsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminVendorsPage } from './pages/admin/AdminVendorsPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'

// TanStack Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1분
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
        {/* Shop Routes (with header) */}
        <Route path="/" element={
          <div className="min-h-screen bg-white">
            <Header />
            <HomePage />
          </div>
        } />
        <Route path="/products/:id" element={
          <div className="min-h-screen bg-white">
            <Header />
            <ProductDetailPage />
          </div>
        } />
        <Route path="/cart" element={
          <div className="min-h-screen bg-white">
            <Header />
            <CartPage />
          </div>
        } />
        <Route path="/mypage" element={
          <div className="min-h-screen bg-white">
            <Header />
            <MyPage />
          </div>
        } />
        <Route path="/orders/:orderPublicId" element={
          <div className="min-h-screen bg-white">
            <Header />
            <OrderDetailPage />
          </div>
        } />
        <Route path="/store/:vendorName" element={
          <div className="min-h-screen bg-white">
            <Header />
            <VendorStorePage />
          </div>
        } />
        <Route path="/merchants/:merchantId" element={
          <div className="min-h-screen bg-white">
            <Header />
            <MerchantSellerInfoPage />
          </div>
        } />

        {/* Merchant Routes (without shop header, has its own layout) */}
        <Route path="/merchant" element={<VendorDashboardPage />} />
        <Route path="/merchant/products" element={<VendorProductsPage />} />
        <Route path="/merchant/products/:id" element={<VendorProductDetailPage />} />
        <Route path="/merchant/orders" element={<VendorOrdersPage />} />
        <Route path="/merchant/settlement" element={<VendorSettlementPage />} />
        <Route path="/merchant/settings" element={<VendorSettingsPage />} />

        {/* Admin Routes (without shop header, has its own layout) */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/vendors" element={<AdminVendorsPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AlertProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
