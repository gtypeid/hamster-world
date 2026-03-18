import { type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-hamster-ivory">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
