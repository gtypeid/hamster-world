import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-dark-bg text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-dark-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
