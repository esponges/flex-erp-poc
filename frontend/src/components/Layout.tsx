import { type ReactNode, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { state, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'SKUs', href: '/skus' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Users', href: '/users' },
    { name: 'Activity Logs', href: '/logs' },
    { name: 'Settings', href: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
              <h1 className="text-xl font-bold text-white">Flex ERP</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User info and logout */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-700">
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {state.user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {state.organization?.name}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-64 min-w-0">
          {/* Mobile header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-medium text-gray-900">Flex ERP</h1>
              <div className="w-6" /> {/* Spacer for centering */}
            </div>
          </div>

          <main className="py-4 lg:py-6 min-w-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}