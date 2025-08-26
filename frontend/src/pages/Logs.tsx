import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  Clock,
  User,
  Package,
  Filter,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';

interface ChangeLog {
  id: number;
  organization_id: number;
  user_id: number;
  entity_type: string;
  entity_id?: number;
  sku_id?: number;
  change_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  metadata?: any;
  created_at: string;
  user_name?: string;
  sku_code?: string;
  sku_name?: string;
}

interface ActivitySummary {
  total_changes: number;
  recent_changes: number;
  top_users: Array<{
    user_id: number;
    user_name: string;
    changes: number;
  }>;
  changes_by_type: Record<string, number>;
  recent_activity: ChangeLog[];
}

const changeTypeColors = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  activate: 'bg-emerald-100 text-emerald-800',
  deactivate: 'bg-orange-100 text-orange-800',
  manual_cost_update: 'bg-purple-100 text-purple-800',
};

const entityTypeIcons = {
  sku: Package,
  inventory: BarChart3,
  transaction: TrendingUp,
  user: User,
  field_alias: Filter,
};

export default function Logs() {
  const { state: authState } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedChangeType, setSelectedChangeType] = useState('');

  // Get organization ID and token from auth context
  const orgId = authState.organization?.id;
  const token = authState.token;

  // Fetch activity summary
  const { data: activitySummary, isLoading: summaryLoading } = useQuery<ActivitySummary>({
    queryKey: ['activity-summary', orgId, selectedPeriod],
    queryFn: async () => {
      if (!orgId || !token) {
        throw new Error('No organization ID or token available');
      }
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${orgId}/activity-summary?last_days=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch activity summary');
      }
      return response.json();
    },
    enabled: !!orgId && !!token,
  });

  // Fetch change logs
  const { data: changeLogs = [], isLoading: logsLoading, refetch } = useQuery<ChangeLog[]>({
    queryKey: ['change-logs', orgId, selectedPeriod, selectedEntityType, selectedChangeType],
    queryFn: async () => {
      if (!orgId || !token) {
        throw new Error('No organization ID or token available');
      }
      const params = new URLSearchParams({
        last_days: selectedPeriod,
        limit: '100',
      });
      
      if (selectedEntityType) {
        params.append('entity_type', selectedEntityType);
      }
      if (selectedChangeType) {
        params.append('change_type', selectedChangeType);
      }

      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${orgId}/change-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch change logs');
      }
      return response.json();
    },
    enabled: !!orgId && !!token,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getChangeDescription = (log: ChangeLog) => {
    const entityName = log.sku_code || log.entity_type;
    
    switch (log.change_type) {
      case 'create':
        return `Created ${log.entity_type} ${entityName}`;
      case 'update':
        return `Updated ${log.entity_type} ${entityName}`;
      case 'delete':
        return `Deleted ${log.entity_type} ${entityName}`;
      case 'activate':
        return `Activated ${log.entity_type} ${entityName}`;
      case 'deactivate':
        return `Deactivated ${log.entity_type} ${entityName}`;
      case 'manual_cost_update':
        return `Updated cost for ${entityName}`;
      default:
        return `${log.change_type} on ${log.entity_type} ${entityName}`;
    }
  };

  // Show loading state while auth is initializing
  if (authState.isInitializing) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!authState.isAuthenticated || !orgId || !token) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Please log in to access activity logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Activity Logs</h1>
      </div>

      {/* Activity Summary Cards */}
      {activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Changes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activitySummary.total_changes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Last 24h</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activitySummary.recent_changes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activitySummary.top_users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Most Common</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.entries(activitySummary.changes_by_type || {})
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="sku">SKUs</option>
                <option value="inventory">Inventory</option>
                <option value="transaction">Transactions</option>
                <option value="user">Users</option>
                <option value="field_alias">Settings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Type
              </label>
              <select
                value={selectedChangeType}
                onChange={(e) => setSelectedChangeType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Changes</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
                <option value="activate">Activated</option>
                <option value="deactivate">Deactivated</option>
              </select>
            </div>

            <div className="ml-auto">
              <button
                onClick={() => refetch()}
                disabled={logsLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log List */}
        <div className="p-6">
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : changeLogs.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Recent Activity ({changeLogs.length} entries)
              </h3>
              <div className="space-y-3">
                {changeLogs.map((log) => {
                  const EntityIcon = entityTypeIcons[log.entity_type as keyof typeof entityTypeIcons] || Activity;
                  
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <EntityIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {log.user_name || `User ${log.user_id}`}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              changeTypeColors[log.change_type as keyof typeof changeTypeColors] ||
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {log.change_type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {getChangeDescription(log)}
                        </p>
                        
                        {log.reason && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {log.reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No activity found for the selected period</p>
              <p className="text-sm mt-1">Try adjusting your filters or time period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}