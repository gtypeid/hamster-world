import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './features/Dashboard'
import { QuotaManagement } from './features/progression/QuotaManagement'
import { CouponManagement } from './features/progression/CouponManagement'
import { ArchiveManagement } from './features/progression/ArchiveManagement'
import { SeasonPromotionManagement } from './features/progression/SeasonPromotionManagement'
import { RiderPromotionManagement } from './features/delivery/RiderPromotionManagement'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect root to progression */}
              <Route index element={<QuotaManagement />} />

              {/* Progression */}
              <Route path="progression/quotas" element={<QuotaManagement />} />
              <Route path="progression/archives" element={<ArchiveManagement />} />
              <Route path="progression/seasons" element={<SeasonPromotionManagement />} />

              {/* E-commerce */}
              <Route path="ecommerce/coupons" element={<CouponManagement />} />

              {/* Delivery */}
              <Route path="delivery/rider-promotions" element={<RiderPromotionManagement />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hamster-brown mb-2">{title}</h1>
      </div>
      <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
        <div className="text-center text-gray-500 py-12">
          <div className="text-6xl mb-4">🚧</div>
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm mt-2">{title}을 준비 중입니다</p>
        </div>
      </div>
    </div>
  )
}

export default App
