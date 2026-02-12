import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { AppLayout } from './components/layout/AppLayout'
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

export default App
