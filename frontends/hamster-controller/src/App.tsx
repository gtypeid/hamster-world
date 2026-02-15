import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Infrastructure } from './pages/Infrastructure';

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
          <Infrastructure />
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
