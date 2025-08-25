import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { SKUs } from '@/pages/SKUs';
import { Inventory } from '@/pages/Inventory';
import { Transactions } from '@/pages/Transactions';
import { Users } from '@/pages/Users';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';

// Root route - just renders the outlet  
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth guard function to check if user is authenticated
function getAuthState() {
  const token = localStorage.getItem('auth_token');
  return { isAuthenticated: !!token };
}

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: Login,
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  ),
});

// Default route (redirect based on auth status)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    } else {
      throw redirect({ to: '/login' });
    }
  },
  component: () => null, // This won't render due to redirect
});

// Placeholder routes for future phases
const skusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/skus',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AuthGuard>
      <SKUs />
    </AuthGuard>
  ),
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AuthGuard>
      <Layout>
        <Inventory />
      </Layout>
    </AuthGuard>
  ),
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AuthGuard>
      <Layout>
        <Transactions />
      </Layout>
    </AuthGuard>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AuthGuard>
      <Users />
    </AuthGuard>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: () => {
    const { isAuthenticated } = getAuthState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AuthGuard>
      <Layout>
        <div className='space-y-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Settings</h1>
          <div className='bg-white shadow rounded-lg p-6'>
            <p className='text-gray-600'>
              Coming in Phase 6: Field Aliases & Customization
            </p>
            <p className='text-sm text-gray-500 mt-2'>
              This will include custom field names, organization-specific aliases,
              and settings interface.
            </p>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  ),
});

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
]);

// Create the router
export const router = createRouter({ routeTree });
