import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Layout } from '@/components/Layout';

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
  component: Dashboard,
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
    <Layout>
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold text-gray-900'>SKUs</h1>
        <div className='bg-white shadow rounded-lg p-6'>
          <p className='text-gray-600'>Coming in Phase 2: SKU Management</p>
          <p className='text-sm text-gray-500 mt-2'>
            This will include SKU CRUD operations, product catalog management,
            and organization scoping.
          </p>
        </div>
      </div>
    </Layout>
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
    <Layout>
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Inventory</h1>
        <div className='bg-white shadow rounded-lg p-6'>
          <p className='text-gray-600'>
            Coming in Phase 3: Inventory & Calculated Fields
          </p>
          <p className='text-sm text-gray-500 mt-2'>
            This will include inventory tracking, weighted cost calculations,
            and manual adjustments.
          </p>
        </div>
      </div>
    </Layout>
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
    <Layout>
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Transactions</h1>
        <div className='bg-white shadow rounded-lg p-6'>
          <p className='text-gray-600'>Coming in Phase 4: Transaction System</p>
          <p className='text-sm text-gray-500 mt-2'>
            This will include in/out transactions, automatic inventory updates,
            and business rule enforcement.
          </p>
        </div>
      </div>
    </Layout>
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
    <Layout>
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Users</h1>
        <div className='bg-white shadow rounded-lg p-6'>
          <p className='text-gray-600'>
            Coming in Phase 5: User Management & Permissions
          </p>
          <p className='text-sm text-gray-500 mt-2'>
            This will include user CRUD operations, role-based access control,
            and field-level permissions.
          </p>
        </div>
      </div>
    </Layout>
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
