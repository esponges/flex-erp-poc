import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';

interface InventoryWithSKU {
  id: number;
  organization_id: number;
  sku_id: number;
  quantity: number;
  weighted_cost: number;
  total_value: number;
  is_manual_cost: boolean;
  created_at: string;
  updated_at: string;
  sku_code: string;
  product_name: string;
  description?: string;
  category?: string;
  supplier?: string;
  barcode?: string;
  is_active: boolean;
}

interface InventoryListParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UpdateManualCostRequest {
  weighted_cost: number;
}

// API functions
const inventoryAPI = {
  list: async (
    params: InventoryListParams = {}
  ): Promise<InventoryWithSKU[]> => {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (params.category) queryParams.set('category', params.category);
    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/1100401179193344001/inventory?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    return response.json();
  },

  updateManualCost: async (
    skuId: number,
    data: UpdateManualCostRequest
  ): Promise<InventoryWithSKU> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/1100401179193344001/inventory/sku/${skuId}/cost`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update manual cost');
    }

    return response.json();
  },
};

export function Inventory() {
  const queryClient = useQueryClient(); // add this to context
  const [filters, setFilters] = useState<InventoryListParams>({
    page: 1,
    limit: 50,
  });
  const [editingCost, setEditingCost] = useState<{
    skuId: number;
    cost: number;
  } | null>(null);

  const {
    data: inventory = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryAPI.list(filters),
  });

  console.log({ inventory });

  const updateCostMutation = useMutation({
    mutationFn: ({ skuId, cost }: { skuId: number; cost: number }) =>
      inventoryAPI.updateManualCost(skuId, { weighted_cost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingCost(null);
    },
  });

  const handleCostUpdate = (skuId: number, newCost: number) => {
    updateCostMutation.mutate({ skuId, cost: newCost });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (quantity < 10)
      return { text: 'Low Stock', color: 'text-amber-600 bg-amber-50' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  if (error) {
    return (
      <Layout>
        <div className='p-6'>
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <p className='text-red-600'>
              Error loading inventory: {error.message}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Inventory Management
          </h1>
          <p className='text-gray-600'>
            Track and manage your product inventory
          </p>
        </div>

        {/* Filters */}
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex-1 min-w-64'>
              <input
                type='text'
                placeholder='Search by SKU, product name, or description...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={filters.search || ''}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value || '' })
                }
              />
            </div>
            <div>
              <select
                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={filters.category || ''}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value || '' })
                }
              >
                <option value=''>All Categories</option>
                <option value='Electronics'>Electronics</option>
                <option value='Furniture'>Furniture</option>
                <option value='Stationery'>Stationery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className='bg-white rounded-lg shadow'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Product
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    SKU
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Category
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Quantity
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Cost
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total Value
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const stockStatus = getStockStatus(item.quantity);
                    const isEditing = editingCost?.skuId === item.sku_id;

                    return (
                      <tr key={item.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {item.product_name}
                            </div>
                            {item.description && (
                              <div className='text-sm text-gray-500'>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {item.sku_code}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {item.category || '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {item.quantity}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {isEditing ? (
                            <div className='flex items-center space-x-2'>
                              <input
                                type='number'
                                step='0.01'
                                className='w-20 px-2 py-1 border border-gray-300 rounded text-sm'
                                value={editingCost.cost}
                                onChange={(e) =>
                                  setEditingCost({
                                    ...editingCost,
                                    cost: parseFloat(e.target.value) || 0,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCostUpdate(
                                      item.sku_id,
                                      editingCost.cost
                                    );
                                  } else if (e.key === 'Escape') {
                                    setEditingCost(null);
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  handleCostUpdate(
                                    item.sku_id,
                                    editingCost.cost
                                  )
                                }
                                className='text-green-600 hover:text-green-800'
                                disabled={updateCostMutation.isPending}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingCost(null)}
                                className='text-red-600 hover:text-red-800'
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className='flex items-center space-x-2'>
                              <span>{formatCurrency(item.weighted_cost)}</span>
                              {item.is_manual_cost && (
                                <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                                  Manual
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatCurrency(item.total_value)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                          >
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                          {!isEditing && (
                            <button
                              onClick={() =>
                                setEditingCost({
                                  skuId: item.sku_id,
                                  cost: item.weighted_cost,
                                })
                              }
                              className='text-indigo-600 hover:text-indigo-900'
                            >
                              Edit Cost
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white p-4 rounded-lg border border-gray-200'>
            <div className='text-sm font-medium text-gray-500'>Total Items</div>
            <div className='text-2xl font-bold text-gray-900'>
              {inventory.length}
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200'>
            <div className='text-sm font-medium text-gray-500'>
              Total Inventory Value
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {formatCurrency(
                inventory.reduce((sum, item) => sum + item.total_value, 0)
              )}
            </div>
          </div>
          <div className='bg-white p-4 rounded-lg border border-gray-200'>
            <div className='text-sm font-medium text-gray-500'>
              Low Stock Items
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {inventory.filter((item) => item.quantity < 10).length}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
