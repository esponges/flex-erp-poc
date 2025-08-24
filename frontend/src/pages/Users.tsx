import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'

interface UserWithDetails {
  id: number
  organization_id: number
  email: string
  name: string
  role: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
  organization_name: string
}

interface UserListParams {
  role?: string
  is_active?: boolean
  search?: string
  page?: number
  limit?: number
}

interface CreateUserRequest {
  email: string
  name: string
  role: string
}

interface UpdateUserRequest {
  name: string
  role: string
  is_active?: boolean
}

interface UserRole {
  name: string
  description: string
  permissions: Array<{
    resource: string
    actions: string[]
  }>
}

export function Users() {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null)
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    email: '',
    name: '',
    role: 'user'
  })
  const [updateUser, setUpdateUser] = useState<UpdateUserRequest>({
    name: '',
    role: 'user'
  })

  const queryClient = useQueryClient()

  const fetchUsers = async (): Promise<{ users: UserWithDetails[], pagination: any }> => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    if (!auth.token || !auth.organization) return { users: [], pagination: {} }

    const params = new URLSearchParams()
    if (selectedRole) params.append('role', selectedRole)
    if (isActiveFilter !== 'all') params.append('is_active', isActiveFilter)
    if (searchQuery) params.append('search', searchQuery)

    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/${auth.organization.id}/users?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    return response.json()
  }

  const fetchUserRoles = async (): Promise<{ roles: UserRole[] }> => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}')
    if (!auth.token || !auth.organization) return { roles: [] }

    const response = await fetch(
      `http://localhost:8080/api/v1/orgs/${auth.organization.id}/users/roles`,
      {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch user roles')
    }

    return response.json()
  }

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', selectedRole, isActiveFilter, searchQuery],
    queryFn: fetchUsers,
  })

  const { data: rolesData } = useQuery({
    queryKey: ['user-roles'],
    queryFn: fetchUserRoles,
  })

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${auth.organization.id}/users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateModal(false)
      setNewUser({ email: '', name: '', role: 'user' })
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number, userData: UpdateUserRequest }) => {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${auth.organization.id}/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowEditModal(false)
      setEditingUser(null)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      const response = await fetch(
        `http://localhost:8080/api/v1/orgs/${auth.organization.id}/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    createUserMutation.mutate(newUser)
  }

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      updateUserMutation.mutate({
        userId: editingUser.id,
        userData: updateUser
      })
    }
  }

  const handleEditUser = (user: UserWithDetails) => {
    setEditingUser(user)
    setUpdateUser({
      name: user.name,
      role: user.role,
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const toggleUserActive = (user: UserWithDetails) => {
    updateUserMutation.mutate({
      userId: user.id,
      userData: {
        name: user.name,
        role: user.role,
        is_active: !user.is_active
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const users = usersData?.users || []
  const roles = rolesData?.roles || []
  const activeUsersCount = users.filter(u => u.is_active).length
  const totalUsers = users.length

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Add User
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600">Total Users</div>
            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600">Active Users</div>
            <div className="text-2xl font-bold text-green-600">{activeUsersCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600">Inactive Users</div>
            <div className="text-2xl font-bold text-red-600">{totalUsers - activeUsersCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Users</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleUserActive(user)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          user.is_active ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            user.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-700">
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Add New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Edit User</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    disabled
                    value={editingUser.email}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={updateUser.name}
                    onChange={(e) => setUpdateUser({ ...updateUser, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={updateUser.role}
                    onChange={(e) => setUpdateUser({ ...updateUser, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={updateUser.is_active}
                      onChange={(e) => setUpdateUser({ ...updateUser, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active user</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}