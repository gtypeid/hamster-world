import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Services } from './pages/Services';
import { Architecture } from './pages/Architecture';
import { Infrastructure } from './pages/Infrastructure';
import { Documentation } from './pages/Documentation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/hamster-controller">
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/infrastructure" element={<Infrastructure />} />
            <Route path="/docs" element={<Documentation />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
