import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface SKU {
  id: number;
  organization_id: number;
  sku_code: string;
  product_name: string;
  description?: string;
  category?: string;
  supplier?: string;
  barcode?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSKURequest {
  sku_code: string;
  product_name: string;
  description?: string;
  category?: string;
  supplier?: string;
  barcode?: string;
}

interface UpdateSKURequest {
  product_name: string;
  description?: string;
  category?: string;
  supplier?: string;
  barcode?: string;
}

interface SKUListParams {
  includeDeactivated?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Mock API functions (will connect to real API when backend is ready)
const skuAPI = {
  list: async (
    params: SKUListParams = {},
    orgId: string
  ): Promise<{ skus: SKU[] }> => {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();

    if (params.includeDeactivated)
      queryParams.set('includeDeactivated', 'true');
    if (params.category) queryParams.set('category', params.category);
    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/${orgId}/skus?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch SKUs');
    }

    return response.json();
  },

  create: async (data: CreateSKURequest, orgId: string): Promise<SKU> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/${orgId}/skus`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create SKU');
    }

    return response.json();
  },

  update: async (id: number, data: UpdateSKURequest, orgId: string): Promise<SKU> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/${orgId}/skus/${id}`,
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
      throw new Error(error.error || 'Failed to update SKU');
    }

    return response.json();
  },

  updateStatus: async (id: number, isActive: boolean, orgId: string): Promise<SKU> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/${orgId}/skus/${id}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update SKU status');
    }

    return response.json();
  },
};

export function SKUs() {
  const { state: authState } = useAuth();
  const [filters, setFilters] = useState<SKUListParams>({
    includeDeactivated: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSKU, setEditingSKU] = useState<SKU | null>(null);

  const queryClient = useQueryClient(); // add this to context

  const { data, isLoading, error } = useQuery({
    queryKey: ['skus', filters],
    queryFn: () => skuAPI.list(filters, authState.organization?.id!),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSKURequest) => skuAPI.create(data, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      setShowAddModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSKURequest }) =>
      skuAPI.update(id, data, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      setEditingSKU(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      skuAPI.updateStatus(id, isActive, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    },
  });

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || '' }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilters((prev) => ({ ...prev, category: category || '' }));
  };

  const toggleIncludeDeactivated = () => {
    setFilters((prev) => ({
      ...prev,
      includeDeactivated: !prev.includeDeactivated,
    }));
  };

  const skus = data?.skus || [];
  const categories = [
    ...new Set(skus.map((sku) => sku.category).filter(Boolean)),
  ];

  return (
    <Layout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>SKUs</h1>
            <p className='mt-1 text-sm text-gray-600'>
              Manage your Stock Keeping Units (products)
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
          >
            Add SKU
          </button>
        </div>

        {/* Filters */}
        <div className='bg-white shadow rounded-lg'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Search
                </label>
                <input
                  type='text'
                  placeholder='Search SKUs...'
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                >
                  <option value=''>All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex items-end'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={filters.includeDeactivated}
                    onChange={toggleIncludeDeactivated}
                    className='rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Include inactive SKUs
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SKU Table */}
        <div className='bg-white shadow rounded-lg overflow-hidden'>
          {isLoading && (
            <div className='p-6 text-center'>
              <div className='text-sm text-gray-600'>Loading SKUs...</div>
            </div>
          )}

          {error && (
            <div className='p-6 text-center'>
              <div className='text-sm text-red-600'>
                Error: {(error as Error).message}
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      SKU Code
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Product Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Category
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Supplier
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
                  {skus.map((sku) => (
                    <tr key={sku.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {sku.sku_code}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {sku.product_name}
                        </div>
                        {sku.description && (
                          <div className='text-sm text-gray-500'>
                            {sku.description}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {sku.category || '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {sku.supplier || '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sku.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sku.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                        <button
                          onClick={() => setEditingSKU(sku)}
                          className='text-indigo-600 hover:text-indigo-900'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: sku.id,
                              isActive: !sku.is_active,
                            })
                          }
                          disabled={statusMutation.isPending}
                          className={`${
                            sku.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {sku.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {skus.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-6 py-4 text-center text-sm text-gray-500'
                      >
                        No SKUs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add SKU Modal */}
        {showAddModal && (
          <AddSKUModal
            onClose={() => setShowAddModal(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            error={createMutation.error as Error | null}
          />
        )}

        {/* Edit SKU Modal */}
        {editingSKU && (
          <EditSKUModal
            sku={editingSKU}
            onClose={() => setEditingSKU(null)}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editingSKU.id, data })
            }
            isLoading={updateMutation.isPending}
            error={updateMutation.error as Error | null}
          />
        )}
      </div>
    </Layout>
  );
}

// Add SKU Modal Component
function AddSKUModal({
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: CreateSKURequest) => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const [formData, setFormData] = useState<CreateSKURequest>({
    sku_code: '',
    product_name: '',
    description: '',
    category: '',
    supplier: '',
    barcode: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku_code || !formData.product_name) return;

    // Remove empty strings
    const cleanData = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== '')
    ) as CreateSKURequest;

    onSubmit(cleanData);
  };

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-lg max-w-md w-full'>
        <form onSubmit={handleSubmit}>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>Add New SKU</h3>
          </div>

          <div className='px-6 py-4 space-y-4'>
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='text-sm text-red-600'>{error.message}</div>
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                SKU Code *
              </label>
              <input
                type='text'
                required
                value={formData.sku_code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku_code: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='e.g. ELEC-001'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Product Name *
              </label>
              <input
                type='text'
                required
                value={formData.product_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    product_name: e.target.value,
                  }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Category
              </label>
              <input
                type='text'
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='e.g. Electronics'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Supplier
              </label>
              <input
                type='text'
                value={formData.supplier}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Barcode
              </label>
              <input
                type='text'
                value={formData.barcode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, barcode: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>
          </div>

          <div className='px-6 py-4 border-t border-gray-200 flex justify-end space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                isLoading || !formData.sku_code || !formData.product_name
              }
              className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
            >
              {isLoading ? 'Creating...' : 'Create SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit SKU Modal Component
function EditSKUModal({
  sku,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  sku: SKU;
  onClose: () => void;
  onSubmit: (data: UpdateSKURequest) => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const [formData, setFormData] = useState<UpdateSKURequest>({
    product_name: sku.product_name,
    description: sku.description || '',
    category: sku.category || '',
    supplier: sku.supplier || '',
    barcode: sku.barcode || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name) return;

    // Remove empty strings
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value || undefined])
    ) as UpdateSKURequest;

    onSubmit(cleanData);
  };

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-lg max-w-md w-full'>
        <form onSubmit={handleSubmit}>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Edit SKU: {sku.sku_code}
            </h3>
          </div>

          <div className='px-6 py-4 space-y-4'>
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='text-sm text-red-600'>{error.message}</div>
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Product Name *
              </label>
              <input
                type='text'
                required
                value={formData.product_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    product_name: e.target.value,
                  }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Category
              </label>
              <input
                type='text'
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Supplier
              </label>
              <input
                type='text'
                value={formData.supplier}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Barcode
              </label>
              <input
                type='text'
                value={formData.barcode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, barcode: e.target.value }))
                }
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>
          </div>

          <div className='px-6 py-4 border-t border-gray-200 flex justify-end space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading || !formData.product_name}
              className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
            >
              {isLoading ? 'Updating...' : 'Update SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
