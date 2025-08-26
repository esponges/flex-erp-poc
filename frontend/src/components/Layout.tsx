import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { state, logout } = useAuth()

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
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
              <h1 className="text-xl font-bold text-white">Flex ERP</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
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
        <div className="pl-64 flex-1">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}