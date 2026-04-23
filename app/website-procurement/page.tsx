// src/app/page.tsx
import { ChatInterface } from '@/components/ChatInterface'
import { SupplierPanel } from '@/components/SupplierPanel'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950">
      {/* Sidebar navigation (simplified) */}
      <nav className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-4 flex-shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center mb-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        {/* Nav icons */}
        {[
          {
            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            label: 'Home',
            active: false,
          },
          {
            icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
            label: 'Chat',
            active: true,
          },
          {
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            label: 'Orders',
            active: false,
          },
          {
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
            label: 'Suppliers',
            active: false,
          },
        ].map(({ icon, label, active }) => (
          <button
            key={label}
            title={label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
          </button>
        ))}
      </nav>

      {/* Main content area */}
      <main className="flex-1 flex min-w-0">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white text-sm">
                Dashboard Pengadaan
              </h1>
              <p className="text-xs text-slate-500">AI-powered procurement assistant</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-2.5 py-1">
                ✓ Gemma Connected
              </span>
            </div>
          </header>

          {/* Chat interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>

        {/* Supplier panel sidebar */}
        <SupplierPanel />
      </main>
    </div>
  )
}
