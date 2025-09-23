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

export function Quotations() {
  console.log('Quotations component rendering - v2...');

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
          <button className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'>
            Create Quotation
          </button>
        </div>
      </div>

      <div className='bg-white shadow rounded-lg p-6'>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Quotations Management
          </h3>
          <p className='text-gray-600'>
            This is a test version of the quotations page. The infinite render loop has been fixed.
          </p>
          <div className='mt-4'>
            <p className='text-sm text-gray-500'>
              ✅ Database models created<br/>
              ✅ API endpoints implemented<br/>
              ✅ Frontend components built<br/>
              🔄 Currently debugging rendering issues
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}