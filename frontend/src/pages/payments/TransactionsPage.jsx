import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import TransactionsList from '../../components/payments/TransactionsList';
import usePaymentStore from '../../store/paymentStore';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { transactions, getTotalAmount } = usePaymentStore();

  const totalAmount = getTotalAmount();
  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter(t => t.status === 'succeeded').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/passenger/my-trips')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Trips
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
                <p className="text-gray-600">View and manage your payment transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{totalTransactions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Successful Payments</p>
                <p className="text-2xl font-semibold text-gray-900">{successfulTransactions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow">
          <TransactionsList />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Need Help?</h3>
          <div className="text-blue-800 space-y-2">
            <p>
              If you have any questions about your payments or need to dispute a transaction, 
              please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
