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
import Settings from '@/pages/Settings';
import Logs from '@/pages/Logs';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';
import { getValidToken } from '@/contexts/AuthContext';

// Root route - just renders the outlet
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth guard function to check if user is authenticated
function getAuthState() {
  const token = getValidToken();
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
  component: () => (
    <AuthGuard>
      <Layout>
        <Dashboard />
      </Layout>
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
  component: () => (
    <AuthGuard>
      <Layout>
        <SKUs />
      </Layout>
    </AuthGuard>
  ),
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
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
  component: () => (
    <AuthGuard>
      <Layout>
        <Users />
      </Layout>
    </AuthGuard>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <AuthGuard>
      <Layout>
        <Settings />
      </Layout>
    </AuthGuard>
  ),
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logs',
  component: () => (
    <AuthGuard>
      <Layout>
        <Logs />
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
  logsRoute,
]);

// Create the router
export const router = createRouter({ routeTree });
