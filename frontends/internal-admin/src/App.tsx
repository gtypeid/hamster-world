import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { ProcessTracker } from '@/features/gateway/ProcessTracker'
import { PaymentList } from '@/features/gateway/PaymentList'
import { EventMonitor } from '@/features/gateway/EventMonitor'
import { ResourceTracker } from '@/features/payment/ResourceTracker'
import { TransactionHistory } from '@/features/payment/TransactionHistory'
import { SettlementManagement } from '@/features/payment/SettlementManagement'
import { OrderList } from '@/features/ecommerce/OrderList'
import { DeadLetterList } from '@/features/notification/DeadLetterList'
import { TopologyPage } from '@/pages/TopologyPage'

// Navigation System
import { NavigationProvider } from '@/components/navigation/NavigationContext'
import { SplitLayout } from '@/components/navigation/SplitLayout'
import { TracerPane } from '@/components/navigation/TracerPane'
import { initializeRegistry } from '@/components/navigation/registry/initializeRegistry'

// Auth
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'

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

function AppContent() {
  // Registry 초기화
  useEffect(() => {
    initializeRegistry()
  }, [])

  return (
    <Routes>
      {/* Public Route - Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes - Require DEVELOPER role */}
      {/* Topology Page - Full Screen (No TracerPane) */}
      <Route
        path="/notification/topology"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TopologyPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Other Pages - With SplitLayout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SplitLayout
                mainPane={
                  <Routes>
                    <Route path="/" element={<Navigate to="/ecommerce/orders" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Ecommerce Service */}
                    <Route path="/ecommerce/orders" element={<OrderList />} />

                    {/* Cash Gateway */}
                    <Route path="/gateway/processes" element={<ProcessTracker />} />
                    <Route path="/gateway/payments" element={<PaymentList />} />
                    <Route path="/gateway/events" element={<EventMonitor />} />

                    {/* Payment Service */}
                    <Route path="/payment/resource" element={<ResourceTracker />} />
                    <Route path="/payment/transactions" element={<TransactionHistory />} />
                    <Route path="/payment/settlement" element={<SettlementManagement />} />

                    {/* Notification Service */}
                    <Route path="/notification/deadletter" element={<DeadLetterList />} />
                  </Routes>
                }
                tracerPane={<TracerPane />}
              />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NavigationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
