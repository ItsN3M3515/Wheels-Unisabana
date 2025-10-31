import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Filter,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react';
import usePaymentStore from '../../store/paymentStore';
import toast from 'react-hot-toast';

const statusConfig = {
  requires_payment_method: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pending Payment'
  },
  processing: {
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Processing'
  },
  succeeded: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Succeeded'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Failed'
  },
  canceled: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Canceled'
  },
  refunded: {
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Refunded'
  }
};

const TransactionsList = () => {
  const { 
    transactions, 
    isLoading, 
    error, 
    getTransactions, 
    clearError 
  } = usePaymentStore();
  
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    pageSize: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      clearError();
      const data = await getTransactions(filters);
      setPagination({
        total: data.total,
        totalPages: data.totalPages,
        currentPage: data.page
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? '' : status,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatAmount = (amount, currency = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.failed;
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
        </div>
        <button
          onClick={loadTransactions}
          disabled={isLoading}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Filter by Status</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const isActive = filters.status === status;
            
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? `${config.bgColor} ${config.color} border-2 border-current`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-500">
            {filters.status 
              ? `No transactions with status "${getStatusConfig(filters.status).label}"`
              : 'You haven\'t made any payments yet'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const statusConfig = getStatusConfig(transaction.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={transaction.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`p-2 rounded-lg ${statusConfig.bgColor} mr-3`}>
                        <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {statusConfig.label}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Transaction #{transaction.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium text-gray-900">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Provider</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.provider}
                        </p>
                      </div>
                    </div>

                    {transaction.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {transaction.errorMessage}
                        </p>
                      </div>
                    )}

                    {transaction.processedAt && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Processed: {formatDate(transaction.processedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((pagination.currentPage - 1) * filters.pageSize) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * filters.pageSize, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                results
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pagination.currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
