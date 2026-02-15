import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-dark-bg text-gray-100">
      <Header />
      <main className="flex-1 overflow-hidden bg-dark-bg">
        {children}
      </main>
    </div>
  );
}
