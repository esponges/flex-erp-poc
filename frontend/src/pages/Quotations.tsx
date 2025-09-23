import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { apiUrl, getAuthHeaders } from '@/utils/api';

interface Quotation {
  id: string;
  organization_id: string;
  quotation_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  sales_person_id?: string;
  sales_person_name?: string;
  creation_date: string;
  validity_period_days: number;
  valid_until: string;
  delivery_terms?: string;
  payment_terms?: string;
  default_margin_percentage: number;
  subtotal: number;
  total_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  created_at: string;
  updated_at: string;
  line_items?: QuotationLineItem[];
}

interface QuotationLineItem {
  id: string;
  quotation_id: string;
  sku_id: string;
  sku_code?: string;
  product_name?: string;
  quantity: number;
  base_price: number;
  item_margin_percentage?: number;
  effective_margin_percentage: number;
  additional_discount_amount: number;
  additional_markup_amount: number;
  unit_price_after_margin: number;
  final_unit_price: number;
  line_total: number;
  created_at: string;
  updated_at: string;
}

// API functions
const quotationAPI = {
  list: async (
    params: QuotationListParams = {},
    orgId: string
  ): Promise<QuotationSummary[]> => {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.set('status', params.status);
    if (params.customerName) queryParams.set('customer_name', params.customerName);
    if (params.search) queryParams.set('search', params.search);
    if (params.dateFrom) queryParams.set('date_from', params.dateFrom.toISOString().split('T')[0]);
    if (params.dateTo) queryParams.set('date_to', params.dateTo.toISOString().split('T')[0]);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/quotations?${queryParams}`),
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch quotations');
    }

    return response.json();
  },

  getById: async (quotationId: string, orgId: string): Promise<Quotation> => {
    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/quotations/${quotationId}`),
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch quotation');
    }

    return response.json();
  },

  updateStatus: async (
    quotationId: string,
    status: string,
    orgId: string
  ): Promise<void> => {
    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/quotations/${quotationId}/status`),
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update quotation status');
    }
  },

  duplicate: async (quotationId: string, orgId: string): Promise<Quotation> => {
    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/quotations/${quotationId}/duplicate`),
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to duplicate quotation');
    }

    return response.json();
  },
};

interface QuotationListParams {
  status?: string | undefined;
  customerName?: string | undefined;
  search?: string | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  page?: number;
  limit?: number;
}

interface QuotationSummary {
  id: string;
  quotation_number: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  creation_date: string;
  valid_until: string;
  sales_person_name?: string;
  line_item_count: number;
}

export function Quotations() {
  const { state: authState } = useAuth();
  const { formatCurrency } = useTranslation();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<QuotationListParams>({
    page: 1,
    limit: 50,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: quotations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => quotationAPI.list(filters, authState.organization?.id!),
    enabled: !!authState.organization?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ quotationId, status }: { quotationId: string; status: string }) =>
      quotationAPI.updateStatus(quotationId, status, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (quotationId: string) =>
      quotationAPI.duplicate(quotationId, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleStatusUpdate = (quotationId: string, status: string) => {
    updateStatusMutation.mutate({ quotationId, status });
  };

  const handleDuplicate = (quotationId: string) => {
    duplicateMutation.mutate(quotationId);
  };

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <p className='text-red-600'>
            Error loading quotations: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Quotations</h1>
          <p className='mt-1 text-sm text-gray-600'>
            Manage customer quotations and pricing
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <button
            onClick={() => setShowCreateForm(true)}
            className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
          >
            Create Quotation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg border border-gray-200'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <input
              type='text'
              placeholder='Search quotations...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            />
          </div>
          <div>
            <input
              type='text'
              placeholder='Customer name...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={filters.customerName || ''}
              onChange={(e) => setFilters({ ...filters, customerName: e.target.value || undefined })}
            />
          </div>
          <div>
            <select
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            >
              <option value=''>All statuses</option>
              <option value='pending'>Pending</option>
              <option value='accepted'>Accepted</option>
              <option value='rejected'>Rejected</option>
              <option value='expired'>Expired</option>
            </select>
          </div>
          <div>
            <input
              type='date'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
            />
          </div>
        </div>
      </div>

      {/* Quotations Table - Desktop */}
      <div className='bg-white rounded-lg shadow hidden lg:block'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Quotation
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Customer
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Amount
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Created
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Valid Until
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className='px-6 py-4 text-center text-gray-500'>
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-6 py-4 text-center text-gray-500'>
                    No quotations found
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {quotation.quotation_number}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {quotation.line_item_count} item(s)
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{quotation.customer_name}</div>
                      {quotation.sales_person_name && (
                        <div className='text-sm text-gray-500'>by {quotation.sales_person_name}</div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatCurrency(quotation.total_amount)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {new Date(quotation.creation_date).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {new Date(quotation.valid_until).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => handleDuplicate(quotation.id)}
                          className='text-indigo-600 hover:text-indigo-900'
                          disabled={duplicateMutation.isPending}
                        >
                          Duplicate
                        </button>
                        {quotation.status === 'pending' && (
                          <select
                            className='text-sm border border-gray-300 rounded px-2 py-1'
                            defaultValue=''
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusUpdate(quotation.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value=''>Status</option>
                            <option value='accepted'>Accept</option>
                            <option value='rejected'>Reject</option>
                            <option value='expired'>Mark Expired</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotations Cards - Mobile & Tablet */}
      <div className='lg:hidden space-y-4'>
        {isLoading ? (
          <div className='bg-white rounded-lg shadow p-6 text-center text-gray-500'>
            Loading quotations...
          </div>
        ) : quotations.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-6 text-center text-gray-500'>
            No quotations found
          </div>
        ) : (
          quotations.map((quotation) => (
            <div key={quotation.id} className='bg-white rounded-lg shadow p-4'>
              <div className='flex justify-between items-start mb-3'>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-sm font-medium text-gray-900'>
                    {quotation.quotation_number}
                  </h3>
                  <p className='text-sm text-gray-500 mt-1'>
                    {quotation.customer_name}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    {quotation.line_item_count} item(s)
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)} ml-2`}>
                  {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-3 text-sm mb-3'>
                <div>
                  <span className='text-gray-500'>Amount:</span>
                  <span className='ml-1 font-medium'>{formatCurrency(quotation.total_amount)}</span>
                </div>
                <div>
                  <span className='text-gray-500'>Created:</span>
                  <span className='ml-1'>{new Date(quotation.creation_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className='text-gray-500'>Valid Until:</span>
                  <span className='ml-1'>{new Date(quotation.valid_until).toLocaleDateString()}</span>
                </div>
                {quotation.sales_person_name && (
                  <div>
                    <span className='text-gray-500'>Sales Person:</span>
                    <span className='ml-1'>{quotation.sales_person_name}</span>
                  </div>
                )}
              </div>

              <div className='flex justify-end space-x-2'>
                <button
                  onClick={() => handleDuplicate(quotation.id)}
                  className='text-indigo-600 hover:text-indigo-900 text-sm font-medium'
                  disabled={duplicateMutation.isPending}
                >
                  Duplicate
                </button>
                {quotation.status === 'pending' && (
                  <select
                    className='text-sm border border-gray-300 rounded px-2 py-1'
                    defaultValue=''
                    onChange={(e) => {
                      if (e.target.value) {
                        handleStatusUpdate(quotation.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value=''>Change Status</option>
                    <option value='accepted'>Accept</option>
                    <option value='rejected'>Reject</option>
                    <option value='expired'>Mark Expired</option>
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='text-sm font-medium text-gray-500'>Total Quotations</div>
          <div className='text-2xl font-bold text-gray-900'>{quotations.length}</div>
        </div>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='text-sm font-medium text-gray-500'>Pending</div>
          <div className='text-2xl font-bold text-yellow-600'>
            {quotations.filter(q => q.status === 'pending').length}
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='text-sm font-medium text-gray-500'>Accepted</div>
          <div className='text-2xl font-bold text-green-600'>
            {quotations.filter(q => q.status === 'accepted').length}
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <div className='text-sm font-medium text-gray-500'>Total Value</div>
          <div className='text-2xl font-bold text-gray-900'>
            {formatCurrency(quotations.reduce((sum, q) => sum + q.total_amount, 0))}
          </div>
        </div>
      </div>

      {/* Create Form Modal - Placeholder */}
      {showCreateForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Create Quotation</h3>
            <p className='text-gray-600 mb-4'>Quotation creation form will be implemented next.</p>
            <div className='flex justify-end space-x-2'>
              <button
                onClick={() => setShowCreateForm(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}