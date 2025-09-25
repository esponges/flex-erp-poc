import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { apiUrl, getAuthHeaders } from '@/utils/api';

// todo: move to types file
interface InventoryItem {
  id: string;
  sku_id: string;
  organization_id: string;
  sku_code: string;
  product_name: string;
  description: string;
  category: string;
  supplier: string;
  barcode: string | null;
  quantity: number;
  weighted_cost: number;
  total_value: number;
  is_active: boolean;
  is_manual_cost: boolean;
  created_at: string;
  updated_at: string;
}

interface QuotationLineItemForm {
  sku_id: string;
  quantity: number;
  item_margin_percentage?: number | undefined;
  additional_discount_amount: number;
  additional_markup_amount: number;
}

interface CreateQuotationRequest {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  validity_period_days: number;
  delivery_terms?: string;
  payment_terms?: string;
  default_margin_percentage: number;
  notes?: string;
  line_items: QuotationLineItemForm[];
}

interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId?: string; // For editing
}

// API functions
const inventoryAPI = {
  list: async (orgId: string): Promise<InventoryItem[]> => {
    const response = await fetch(apiUrl(`/api/v1/orgs/${orgId}/inventory`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    return response.json();
  },
};

const quotationAPI = {
  create: async (data: CreateQuotationRequest, orgId: string) => {
    const response = await fetch(apiUrl(`/api/v1/orgs/${orgId}/quotations`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create quotation');
    }

    return response.json();
  },

  getById: async (quotationId: string, orgId: string) => {
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

  update: async (quotationId: string, data: any, orgId: string) => {
    const response = await fetch(
      apiUrl(`/api/v1/orgs/${orgId}/quotations/${quotationId}`),
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update quotation');
    }

    return response.json();
  },
};

export function QuotationForm({
  isOpen,
  onClose,
  quotationId,
}: QuotationFormProps) {
  const { state: authState } = useAuth();
  const { t, formatCurrency } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateQuotationRequest>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    validity_period_days: 30,
    delivery_terms: '',
    payment_terms: '',
    default_margin_percentage: 0,
    notes: '',
    line_items: [],
  });

  const [showItemSelector, setShowItemSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch inventory items for selection
  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery(
    {
      queryKey: ['inventory', authState.organization?.id],
      queryFn: () => inventoryAPI.list(authState.organization?.id!),
      enabled: !!authState.organization?.id && isOpen,
    }
  );

  // Fetch existing quotation if editing
  const { data: existingQuotation } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () =>
      quotationAPI.getById(quotationId!, authState.organization?.id!),
    enabled: !!quotationId && !!authState.organization?.id && isOpen,
  });

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateQuotationRequest) =>
      quotationAPI.create(data, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      onClose();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      quotationAPI.update(quotationId!, data, authState.organization?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
      onClose();
    },
  });

  // Load existing quotation data
  useEffect(() => {
    if (existingQuotation && quotationId) {
      setFormData({
        customer_name: existingQuotation.customer_name,
        customer_email: existingQuotation.customer_email || '',
        customer_phone: existingQuotation.customer_phone || '',
        customer_address: existingQuotation.customer_address || '',
        validity_period_days: existingQuotation.validity_period_days,
        delivery_terms: existingQuotation.delivery_terms || '',
        payment_terms: existingQuotation.payment_terms || '',
        default_margin_percentage: existingQuotation.default_margin_percentage,
        notes: existingQuotation.notes || '',
        line_items:
          existingQuotation.line_items?.map((item: any) => ({
            sku_id: item.sku_id,
            quantity: item.quantity,
            item_margin_percentage: item.item_margin_percentage,
            additional_discount_amount: item.additional_discount_amount,
            additional_markup_amount: item.additional_markup_amount,
          })) || [],
      });
    }
  }, [existingQuotation, quotationId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowItemSelector(false);
      }
    };

    if (showItemSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [showItemSelector]);

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: '',
      validity_period_days: 30,
      delivery_terms: '',
      payment_terms: '',
      default_margin_percentage: 0,
      notes: '',
      line_items: [],
    });
  };

  const filteredItems = inventoryItems
    .filter((item) => item.is_active)
    .filter((item) => {
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        item.sku_code?.toLowerCase().includes(searchLower) ||
        item.product_name?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    });

  const addLineItem = (inventoryItem: InventoryItem) => {
    // Check if item already exists
    const exists = formData.line_items.some(
      (item) => item.sku_id === inventoryItem.sku_id
    );
    if (exists) return;

    setFormData((prev) => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          sku_id: inventoryItem.sku_id,
          quantity: 1,
          item_margin_percentage: undefined,
          additional_discount_amount: 0,
          additional_markup_amount: 0,
        },
      ],
    }));
    setShowItemSelector(false);
    setSearchTerm(''); // Clear search when item is added
  };

  const updateLineItem = (
    index: number,
    updates: Partial<QuotationLineItemForm>
  ) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const getInventoryItemBySku = (skuId: string) => {
    return inventoryItems.find((item) => item.sku_id === skuId);
  };

  const calculateLineItemPrice = (lineItem: QuotationLineItemForm) => {
    const inventoryItem = getInventoryItemBySku(lineItem.sku_id);
    if (!inventoryItem) return { unitPrice: 0, lineTotal: 0 };

    const basePrice = inventoryItem.weighted_cost;
    const effectiveMargin =
      lineItem.item_margin_percentage ?? formData.default_margin_percentage;
    const priceAfterMargin = basePrice + (basePrice * effectiveMargin) / 100;
    const finalUnitPrice = Math.max(
      0,
      priceAfterMargin +
        lineItem.additional_markup_amount -
        lineItem.additional_discount_amount
    );

    return {
      unitPrice: finalUnitPrice,
      lineTotal: finalUnitPrice * lineItem.quantity,
    };
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      const { lineTotal } = calculateLineItemPrice(item);
      return sum + lineTotal;
    }, 0);

    return { subtotal, total: subtotal };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.line_items.length === 0) {
      alert(t('quotationForm.validation.atLeastOneItem'));
      return;
    }

    if (quotationId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const { subtotal, total } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {quotationId ? t('quotationForm.editTitle') : t('quotationForm.createTitle')}
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Customer Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.customerName')} *
                </label>
                <input
                  type='text'
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer_name: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.customerEmail')}
                </label>
                <input
                  type='email'
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer_email: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.customerPhone')}
                </label>
                <input
                  type='tel'
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer_phone: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.validityPeriod')} *
                </label>
                <input
                  type='number'
                  required
                  min='1'
                  max='365'
                  value={formData.validity_period_days}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validity_period_days: parseInt(e.target.value) || 30,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t('quotationForm.fields.customerAddress')}
              </label>
              <textarea
                rows={2}
                value={formData.customer_address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_address: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {/* Terms and Margin */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.defaultMargin')} *
                </label>
                <input
                  type='number'
                  required
                  step='0.01'
                  min='-100'
                  max='1000'
                  value={formData.default_margin_percentage || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      default_margin_percentage:
                        e.target.value === ''
                          ? 0
                          : parseFloat(e.target.value) || 0,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.deliveryTerms')}
                </label>
                <input
                  type='text'
                  value={formData.delivery_terms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      delivery_terms: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('quotationForm.fields.paymentTerms')}
                </label>
                <input
                  type='text'
                  value={formData.payment_terms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      payment_terms: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className='flex justify-between items-center mb-3'>
                <h3 className='text-lg font-medium text-gray-900'>
                  {t('quotationForm.lineItems.title')}
                </h3>
                <div className='relative' ref={dropdownRef}>
                  <button
                    type='button'
                    onClick={() => setShowItemSelector(!showItemSelector)}
                    className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
                  >
                    {t('quotationForm.lineItems.addItem')}
                    <svg
                      className='ml-1 h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>

                  {/* TODO: Use a virtualized list component (e.g., react-window) for better performance with large inventories */}
                  {showItemSelector && (
                    <div className='absolute right-0 mt-1 w-96 bg-white rounded-md shadow-lg border border-gray-200 z-10'>
                      <div className='p-3 border-b border-gray-200'>
                        <input
                          type='text'
                          placeholder={t('quotationForm.lineItems.searchPlaceholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm'
                          autoFocus
                        />
                      </div>
                      <div className='max-h-64 overflow-y-auto'>
                        {isLoadingInventory ? (
                          <div className='p-4 text-center text-gray-500 text-sm'>
                            {t('quotationForm.lineItems.loadingInventory')}
                          </div>
                        ) : filteredItems.length === 0 ? (
                          <div className='p-4 text-center text-gray-500 text-sm'>
                            {searchTerm
                              ? t('quotationForm.lineItems.noItemsFound')
                              : t('quotationForm.lineItems.noItemsAvailable')}
                          </div>
                        ) : (
                          <div className='divide-y divide-gray-100'>
                            {filteredItems.map((item) => (
                              <div
                                key={item.id}
                                className='p-3 hover:bg-gray-50 cursor-pointer text-sm'
                                onClick={() => addLineItem(item)}
                              >
                                <div className='flex justify-between items-start'>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-medium text-gray-900 truncate'>
                                      {item.sku_code} - {item.product_name}
                                    </div>
                                    {item.description && (
                                      <div className='text-xs text-gray-600 mt-1 truncate'>
                                        {item.description}
                                      </div>
                                    )}
                                    <div className='flex items-center space-x-3 mt-1 text-xs text-gray-500'>
                                      {item.category && (
                                        <span>{t('quotationForm.lineItems.category')}: {item.category}</span>
                                      )}
                                      <span>{t('quotationForm.lineItems.quantity')}: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className='text-right ml-2'>
                                    <div className='text-sm font-medium text-gray-900'>
                                      {formatCurrency(item.weighted_cost)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {formData.line_items.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  {t('quotationForm.lineItems.noItemsAdded')}
                </div>
              ) : (
                <div className='space-y-4'>
                  {formData.line_items.map((lineItem, index) => {
                    const inventoryItem = getInventoryItemBySku(
                      lineItem.sku_id
                    );
                    const { unitPrice, lineTotal } =
                      calculateLineItemPrice(lineItem);

                    return (
                      <div
                        key={index}
                        className='border border-gray-200 rounded-lg p-4'
                      >
                        <div className='flex justify-between items-start mb-3'>
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              {inventoryItem?.sku_code} -{' '}
                              {inventoryItem?.product_name}
                            </h4>
                            <p className='text-sm text-gray-500'>
                              {t('quotationForm.lineItems.baseCost')}: {formatCurrency(inventoryItem?.weighted_cost || 0)} |
                              {t('quotationForm.lineItems.available')}: {inventoryItem?.quantity}
                            </p>
                          </div>
                          <button
                            type='button'
                            onClick={() => removeLineItem(index)}
                            className='text-red-600 hover:text-red-800'
                          >
                            {t('quotationForm.lineItems.remove')}
                          </button>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              {t('quotationForm.lineItems.quantity')} *
                            </label>
                            <input
                              type='number'
                              required
                              min='0.01'
                              step='0.01'
                              value={lineItem.quantity}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                              className='w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              {t('quotationForm.lineItems.itemMargin')}
                            </label>
                            <input
                              type='number'
                              step='0.01'
                              min='-100'
                              max='1000'
                              placeholder={t('quotationForm.lineItems.defaultMarginPlaceholder', { margin: formData.default_margin_percentage })}
                              value={lineItem.item_margin_percentage || ''}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  item_margin_percentage: e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                })
                              }
                              className='w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              {t('quotationForm.lineItems.discount')}
                            </label>
                            <input
                              type='number'
                              min='0'
                              step='0.01'
                              value={lineItem.additional_discount_amount}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  additional_discount_amount:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className='w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              {t('quotationForm.lineItems.markup')}
                            </label>
                            <input
                              type='number'
                              min='0'
                              step='0.01'
                              value={lineItem.additional_markup_amount}
                              onChange={(e) =>
                                updateLineItem(index, {
                                  additional_markup_amount:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className='w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              {t('quotationForm.lineItems.unitPrice')}
                            </label>
                            <div className='px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-medium'>
                              {formatCurrency(unitPrice)}
                            </div>
                          </div>
                        </div>

                        <div className='mt-2 text-right'>
                          <span className='text-sm font-medium text-gray-700'>
                            {t('quotationForm.lineItems.lineTotal')}:{' '}
                            <span className='font-bold'>
                              {formatCurrency(lineTotal)}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t('quotationForm.fields.notes')}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {/* Totals */}
            {formData.line_items.length > 0 && (
              <div className='border-t pt-4'>
                <div className='flex justify-end space-y-2'>
                  <div className='text-right'>
                    <div className='text-sm text-gray-600'>
                      {t('quotationForm.totals.subtotal')}:{' '}
                      <span className='font-medium'>
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className='text-lg font-bold text-gray-900'>
                      {t('quotationForm.totals.total')}: {formatCurrency(total)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className='flex justify-end space-x-3 pt-4 border-t'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                {t('quotationForm.actions.cancel')}
              </button>
              <button
                type='submit'
                disabled={createMutation.isPending || updateMutation.isPending}
                className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t('quotationForm.actions.saving')
                  : quotationId
                  ? t('quotationForm.actions.update')
                  : t('quotationForm.actions.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
