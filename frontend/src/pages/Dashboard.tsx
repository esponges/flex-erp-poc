import { Layout } from '@/components/Layout'

export function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome to Flex ERP - Inventory Management System
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">SKU</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total SKUs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">INV</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Inventory Items
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">TXN</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Transactions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">VAL</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Phase status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Implementation Status
            </h3>
            <div className="mt-5 space-y-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    ✅ Phase 1: Foundation & Authentication - Complete
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    🚧 Phase 2: SKU Management - Next
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    ⏳ Phase 3: Inventory & Calculated Fields - Pending
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    ⏳ Phase 4: Transaction System - Pending
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}