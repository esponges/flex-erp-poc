import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

// Root route
const rootRoute = createRootRoute({
  component: () => {
    const { state } = useAuth()
    
    // If not authenticated, redirect to login
    if (!state.isAuthenticated && window.location.pathname !== '/login') {
      throw redirect({ to: '/login' })
    }
    
    // If authenticated and on login page, redirect to dashboard
    if (state.isAuthenticated && window.location.pathname === '/login') {
      throw redirect({ to: '/dashboard' })
    }

    return (
      <div>
        {/* This will be replaced by child routes */}
      </div>
    )
  },
})

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

// Default route (redirect to dashboard if authenticated, login if not)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const { state } = useAuth()
    if (state.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})

// Placeholder routes for future phases
const skusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/skus',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">SKUs</h1>
      <p>Coming in Phase 2</p>
    </div>
  ),
})

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <p>Coming in Phase 3</p>
    </div>
  ),
})

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <p>Coming in Phase 4</p>
    </div>
  ),
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <p>Coming in Phase 5</p>
    </div>
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p>Coming in Phase 6</p>
    </div>
  ),
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  skusRoute,
  inventoryRoute,
  transactionsRoute,
  usersRoute,
  settingsRoute,
])

// Create the router
export const router = createRouter({ routeTree })