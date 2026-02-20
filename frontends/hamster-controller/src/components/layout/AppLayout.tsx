import { useState } from 'react';
import { Header } from './Header';
import { WelcomeModal } from '../WelcomeModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-dark-bg text-gray-100">
      <Header onHelpClick={() => setHelpOpen(true)} />
      <main className="flex-1 overflow-hidden bg-dark-bg">
        {children}
      </main>
      <WelcomeModal
        forceOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
