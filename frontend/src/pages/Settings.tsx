import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings as SettingsIcon,
  Edit3,
  Save,
  X,
  Plus,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

interface FieldAlias {
  id: number;
  organization_id: number;
  table_name: string;
  field_name: string;
  display_name: string;
  description?: string;
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface TableFieldsResponse {
  table_name: string;
  fields: FieldAlias[];
  metadata?: {
    total_fields: number;
    hidden_fields: number;
    custom_aliases: number;
    last_updated?: string;
  };
}

const supportedTables = [
  { name: 'skus', label: 'Products (SKUs)' },
  { name: 'inventory', label: 'Inventory' },
  { name: 'inventory_transactions', label: 'Transactions' },
  { name: 'users', label: 'Users' },
];

export default function Settings() {
  const { state: authState } = useAuth();
  const [selectedTable, setSelectedTable] = useState('skus');
  const [editingField, setEditingField] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    description: '',
    is_hidden: false,
    sort_order: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    table_name: '',
    field_name: '',
    display_name: '',
    description: '',
    is_hidden: false,
    sort_order: 0,
  });

  const queryClient = useQueryClient();

  // Get organization ID and token from auth context
  const orgId = authState.organization?.id;
  const token = authState.token;

  // Fetch table fields
  const { data: tableFields, isLoading } = useQuery<TableFieldsResponse>({
    queryKey: ['table-fields', selectedTable, orgId],
    queryFn: async () => {
      if (!orgId || !token) {
        throw new Error('No organization ID or token available');
      }
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${orgId}/tables/${selectedTable}/fields`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch table fields');
      }
      return response.json();
    },
    enabled: !!orgId && !!token, // Only run query when auth data is available
  });

  // Update field alias mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ aliasId, data }: { aliasId: number; data: any }) => {
      if (!orgId || !token) {
        throw new Error('No organization ID or token available');
      }
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${orgId}/field-aliases/${aliasId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to update field alias');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['table-fields', selectedTable, orgId],
      });
      setEditingField(null);
      setEditForm({
        display_name: '',
        description: '',
        is_hidden: false,
        sort_order: 0,
      });
    },
  });

  // Create field alias mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!orgId || !token) {
        throw new Error('No organization ID or token available');
      }
      const response = await fetch(`http://localhost:8080/api/v1/orgs/${orgId}/field-aliases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create field alias');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['table-fields', selectedTable, orgId],
      });
      setShowAddForm(false);
      setAddForm({
        table_name: '',
        field_name: '',
        display_name: '',
        description: '',
        is_hidden: false,
        sort_order: 0,
      });
    },
  });

  // Initialize table fields mutation
  const initializeFieldsMutation = useMutation({
    mutationFn: async (tableName: string) => {
      if (!orgId || !token) {
        throw new Error('No organization ID or token available');
      }
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${orgId}/tables/${tableName}/fields/initialize`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to initialize table fields');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['table-fields', selectedTable, orgId],
      });
    },
  });

  const handleEditField = (field: FieldAlias) => {
    setEditingField(field.id);
    setEditForm({
      display_name: field.display_name,
      description: field.description || '',
      is_hidden: field.is_hidden,
      sort_order: field.sort_order,
    });
  };

  const handleSaveEdit = () => {
    if (editingField !== null) {
      updateFieldMutation.mutate({
        aliasId: editingField,
        data: editForm,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditForm({
      display_name: '',
      description: '',
      is_hidden: false,
      sort_order: 0,
    });
  };

  const handleAddField = () => {
    createFieldMutation.mutate({
      ...addForm,
      table_name: selectedTable,
    });
  };

  const handleInitializeTable = () => {
    initializeFieldsMutation.mutate(selectedTable);
  };

  const currentTableLabel =
    supportedTables.find((t) => t.name === selectedTable)?.label ||
    selectedTable;

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
        <p className="text-gray-500">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <SettingsIcon className='w-6 h-6' />
        <h1 className='text-2xl font-bold'>Field Customization</h1>
      </div>

      <div className='bg-white rounded-lg shadow'>
        <div className='p-6 border-b'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>Customize Field Names</h2>
              <p className='text-gray-600 text-sm mt-1'>
                Personalize how field names appear throughout the system
              </p>
            </div>
            <button
              onClick={handleInitializeTable}
              disabled={initializeFieldsMutation.isPending}
              className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  initializeFieldsMutation.isPending ? 'animate-spin' : ''
                }`}
              />
              Initialize Defaults
            </button>
          </div>

          {/* Table selector */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className='border border-gray-300 rounded-lg px-3 py-2 w-64'
            >
              {supportedTables.map((table) => (
                <option key={table.name} value={table.name}>
                  {table.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table fields list */}
        <div className='p-6'>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : tableFields?.fields?.length ? (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-gray-900'>
                  {currentTableLabel} Fields ({tableFields.fields.length})
                </h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className='flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700'
                >
                  <Plus className='w-4 h-4' />
                  Add Field
                </button>
              </div>

              {tableFields.metadata && (
                <div className='flex gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
                  <span>Total: {tableFields.metadata.total_fields}</span>
                  <span>Hidden: {tableFields.metadata.hidden_fields}</span>
                  <span>Custom: {tableFields.metadata.custom_aliases}</span>
                  {tableFields.metadata.last_updated && (
                    <span>
                      Updated:{' '}
                      {new Date(
                        tableFields.metadata.last_updated
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              <div className='space-y-2'>
                {tableFields.fields.map((field) => (
                  <div
                    key={field.id}
                    className={`border rounded-lg p-4 ${
                      field.is_hidden ? 'bg-gray-50 opacity-75' : 'bg-white'
                    }`}
                  >
                    {editingField === field.id ? (
                      <div className='space-y-3'>
                        <div>
                          <label className='block text-sm font-medium mb-1'>
                            Display Name
                          </label>
                          <input
                            type='text'
                            value={editForm.display_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                display_name: e.target.value,
                              })
                            }
                            className='w-full border border-gray-300 rounded px-3 py-2'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium mb-1'>
                            Description
                          </label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            className='w-full border border-gray-300 rounded px-3 py-2'
                            rows={2}
                          />
                        </div>
                        <div className='flex items-center gap-4'>
                          <label className='flex items-center gap-2'>
                            <input
                              type='checkbox'
                              checked={editForm.is_hidden}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  is_hidden: e.target.checked,
                                })
                              }
                            />
                            <span className='text-sm'>Hide field</span>
                          </label>
                          <div>
                            <label className='block text-sm font-medium mb-1'>
                              Sort Order
                            </label>
                            <input
                              type='number'
                              value={editForm.sort_order}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  sort_order: parseInt(e.target.value),
                                })
                              }
                              className='w-20 border border-gray-300 rounded px-2 py-1'
                            />
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={handleSaveEdit}
                            disabled={updateFieldMutation.isPending}
                            className='flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50'
                          >
                            <Save className='w-4 h-4' />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className='flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700'
                          >
                            <X className='w-4 h-4' />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3'>
                            <span className='font-medium'>
                              {field.display_name}
                            </span>
                            <span className='text-sm text-gray-500'>
                              ({field.field_name})
                            </span>
                            {field.is_hidden && (
                              <span className='inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded'>
                                <EyeOff className='w-3 h-3' />
                                Hidden
                              </span>
                            )}
                          </div>
                          {field.description && (
                            <p className='text-sm text-gray-600 mt-1'>
                              {field.description}
                            </p>
                          )}
                          <div className='text-xs text-gray-400 mt-1'>
                            Sort: {field.sort_order}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleEditField(field)}
                            className='p-2 text-gray-600 hover:bg-gray-100 rounded'
                          >
                            <Edit3 className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <p>No field customizations found for {currentTableLabel}</p>
              <button
                onClick={handleInitializeTable}
                disabled={initializeFieldsMutation.isPending}
                className='mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
              >
                {initializeFieldsMutation.isPending
                  ? 'Initializing...'
                  : 'Initialize Default Fields'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add new field modal */}
      {showAddForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96'>
            <h3 className='text-lg font-semibold mb-4'>Add Custom Field</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Field Name
                </label>
                <input
                  type='text'
                  value={addForm.field_name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, field_name: e.target.value })
                  }
                  className='w-full border border-gray-300 rounded px-3 py-2'
                  placeholder='e.g., custom_field_1'
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Display Name
                </label>
                <input
                  type='text'
                  value={addForm.display_name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, display_name: e.target.value })
                  }
                  className='w-full border border-gray-300 rounded px-3 py-2'
                  placeholder='e.g., Custom Field'
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Description
                </label>
                <textarea
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm({ ...addForm, description: e.target.value })
                  }
                  className='w-full border border-gray-300 rounded px-3 py-2'
                  rows={2}
                  placeholder='Optional description'
                />
              </div>
              <div className='flex items-center gap-4'>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={addForm.is_hidden}
                    onChange={(e) =>
                      setAddForm({ ...addForm, is_hidden: e.target.checked })
                    }
                  />
                  <span className='text-sm'>Hide field</span>
                </label>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Sort Order
                  </label>
                  <input
                    type='number'
                    value={addForm.sort_order}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        sort_order: parseInt(e.target.value),
                      })
                    }
                    className='w-20 border border-gray-300 rounded px-2 py-1'
                  />
                </div>
              </div>
            </div>
            <div className='flex gap-2 mt-6'>
              <button
                onClick={handleAddField}
                disabled={
                  createFieldMutation.isPending ||
                  !addForm.field_name ||
                  !addForm.display_name
                }
                className='flex-1 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50'
              >
                {createFieldMutation.isPending ? 'Creating...' : 'Add Field'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className='flex-1 bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
