import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiUrl, getAuthHeaders } from '@/utils/api';

interface TransactionWithSKU {
  id: number;
  organization_id: number;
  sku_id: number;
  transaction_type: 'in' | 'out';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_number?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  sku_code: string;
  product_name: string;
  description?: string;
  category?: string;
  created_by_name: string;
}

interface TransactionListParams {
  transaction_type?: string;
  sku_id?: number;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

interface CreateTransactionRequest {
  sku_id: number;
  transaction_type: 'in' | 'out';
  quantity: number;
  unit_cost: number;
  reference_number?: string;
  notes?: string;
}

interface TransactionSummary {
  transaction_type: string;
  total_transactions: number;
  total_quantity: number;
  total_value: number;
}

interface SKU {
  id: number;
  sku_code: string;
  product_name: string;
  category?: string;
  is_active: boolean;
}

// API functions
const transactionAPI = {
  list: async (
    params: TransactionListParams = {},
    orgId: string
  ): Promise<TransactionWithSKU[]> => {
    const queryParams = new URLSearchParams();

    if (params.transaction_type)
      queryParams.set('transaction_type', params.transaction_type);
    if (params.sku_id) queryParams.set('sku_id', params.sku_id.toString());
    if (params.category) queryParams.set('category', params.category);
    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.start_date) queryParams.set('start_date', params.start_date);
    if (params.end_date) queryParams.set('end_date', params.end_date);

    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/transactions?${queryParams}`),
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return response.json();
  },

  create: async (
    data: CreateTransactionRequest,
    orgId: string
  ): Promise<TransactionWithSKU> => {
    const response = await fetch(apiUrl(`/api/v1/orgs/${orgId}/transactions`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create transaction');
    }

    return response.json();
  },

  getSummary: async (
    params: TransactionListParams = {},
    orgId: string
  ): Promise<TransactionSummary[]> => {
    const queryParams = new URLSearchParams();

    if (params.sku_id) queryParams.set('sku_id', params.sku_id.toString());
    if (params.category) queryParams.set('category', params.category);
    if (params.start_date) queryParams.set('start_date', params.start_date);
    if (params.end_date) queryParams.set('end_date', params.end_date);

    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/transactions/summary?${queryParams}`),
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transaction summary');
    }

    return response.json();
  },
};

const skuAPI = {
  list: async (orgId: string): Promise<{ skus: SKU[] }> => {
    const response = await fetch(apiUrl(`/api/v1/orgs/${orgId}/skus`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch SKUs');
    }

    return response.json();
  },
};

export function Transactions() {
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionListParams>({
    page: 1,
    limit: 50,
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionAPI.list(filters, authState.organization?.id!),
  });

  const { data: summary = [] } = useQuery({
    queryKey: ['transaction-summary', filters],
    queryFn: () =>
      transactionAPI.getSummary(filters, authState.organization?.id!),
  });

  const { data: skusData } = useQuery({
    queryKey: ['skus'],
    queryFn: () => skuAPI.list(authState.organization?.id!),
  });

  const skus = skusData?.skus || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      transactionAPI.create(data, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddModal(false);
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <p className='text-red-600'>
            Error loading transactions: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Transaction Management
          </h1>
          <p className='text-gray-600'>
            Track inventory in and out transactions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium self-start sm:self-auto'
        >
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {summary.map((item) => (
          <div
            key={item.transaction_type}
            className='bg-white p-4 rounded-lg border border-gray-200'
          >
            <div className='text-sm font-medium text-gray-500'>
              {item.transaction_type === 'in' ? 'Inbound' : 'Outbound'}{' '}
              Transactions
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {item.total_transactions}
            </div>
            <div className='text-sm text-gray-500'>
              {item.total_quantity} units • {formatCurrency(item.total_value)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg border border-gray-200'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <input
              type='text'
              placeholder='Search by SKU, product name, reference, or notes...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={filters.search || ''}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value || '' })
              }
            />
          </div>
          <div className='w-full sm:w-auto'>
            <select
              className='w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={filters.transaction_type || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  transaction_type: e.target.value || '',
                })
              }
            >
              <option value=''>All Types</option>
              <option value='in'>Inbound</option>
              <option value='out'>Outbound</option>
            </select>
          </div>
          <div className='w-full sm:w-auto'>
            <select
              className='w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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

      {/* Transactions Table - Desktop */}
      <div className='bg-white rounded-lg shadow hidden lg:block'>
        <div className='overflow-x-auto max-w-full'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Type
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Product
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  SKU
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Quantity
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Unit Cost
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Total Cost
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Reference
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className='px-6 py-4 text-center text-gray-500'
                  >
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className='px-6 py-4 text-center text-gray-500'
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.transaction_type === 'in'
                            ? 'text-green-800 bg-green-100'
                            : 'text-red-800 bg-red-100'
                        }`}
                      >
                        {transaction.transaction_type === 'in' ? 'IN' : 'OUT'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {transaction.product_name}
                        </div>
                        {transaction.description && (
                          <div className='text-sm text-gray-500'>
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {transaction.sku_code}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {transaction.quantity}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatCurrency(transaction.unit_cost)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatCurrency(transaction.total_cost)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {transaction.reference_number || '-'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {transaction.created_by_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Cards - Mobile & Tablet */}
      <div className='lg:hidden space-y-4'>
        {isLoading ? (
          <div className='bg-white rounded-lg shadow p-6 text-center text-gray-500'>
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-6 text-center text-gray-500'>
            No transactions found
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className='bg-white rounded-lg shadow p-4'
            >
              <div className='flex justify-between items-start mb-3'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.transaction_type === 'in'
                          ? 'text-green-800 bg-green-100'
                          : 'text-red-800 bg-red-100'
                      }`}
                    >
                      {transaction.transaction_type === 'in' ? 'IN' : 'OUT'}
                    </span>
                    <h3 className='text-sm font-medium text-gray-900 truncate'>
                      {transaction.product_name}
                    </h3>
                  </div>
                  <p className='text-sm text-gray-500 mb-1'>
                    SKU: {transaction.sku_code}
                  </p>
                  {transaction.description && (
                    <p className='text-xs text-gray-400 mb-2 line-clamp-2'>
                      {transaction.description}
                    </p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3 text-sm mb-3'>
                <div>
                  <span className='text-gray-500'>Quantity:</span>
                  <span className='ml-1 font-medium'>
                    {transaction.quantity}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500'>Unit Cost:</span>
                  <span className='ml-1 font-medium'>
                    {formatCurrency(transaction.unit_cost)}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500'>Total Cost:</span>
                  <span className='ml-1 font-medium'>
                    {formatCurrency(transaction.total_cost)}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500'>Reference:</span>
                  <span className='ml-1 font-medium'>
                    {transaction.reference_number || '-'}
                  </span>
                </div>
              </div>

              <div className='border-t pt-3 text-xs text-gray-400'>
                <div className='flex justify-between items-center'>
                  <span>Created by {transaction.created_by_name}</span>
                  <span>{formatDate(transaction.created_at)}</span>
                </div>
                {transaction.notes && (
                  <div className='mt-2'>
                    <span className='text-gray-500'>Notes:</span>
                    <p className='text-gray-600 mt-1'>{transaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-screen overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold'>Add Transaction</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                // TODO: abstract this
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  sku_id: parseInt(formData.get('sku_id') as string),
                  transaction_type: formData.get('transaction_type') as
                    | 'in'
                    | 'out',
                  quantity: parseInt(formData.get('quantity') as string),
                  unit_cost: parseFloat(formData.get('unit_cost') as string),
                  reference_number:
                    (formData.get('reference_number') as string) || '',
                  notes: (formData.get('notes') as string) || '',
                });
              }}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  SKU <span className='text-red-500'>*</span>
                </label>
                <select
                  name='sku_id'
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select SKU</option>
                  {skus
                    .filter((sku) => sku.is_active)
                    .map((sku) => (
                      <option key={sku.id} value={sku.id}>
                        {sku.sku_code} - {sku.product_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Transaction Type <span className='text-red-500'>*</span>
                </label>
                <select
                  name='transaction_type'
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select Type</option>
                  <option value='in'>Inbound (Receive Stock)</option>
                  <option value='out'>Outbound (Remove Stock)</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Quantity <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='quantity'
                  min='1'
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Unit Cost <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='unit_cost'
                  min='0'
                  step='0.01'
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Reference Number
                </label>
                <input
                  type='text'
                  name='reference_number'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Notes
                </label>
                <textarea
                  name='notes'
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                ></textarea>
              </div>

              {createMutation.error && (
                <div className='text-red-600 text-sm'>
                  {createMutation.error.message}
                </div>
              )}

              <div className='flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowAddModal(false)}
                  className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={createMutation.isPending}
                  className='w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50'
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
