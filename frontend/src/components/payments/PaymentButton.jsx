import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import usePaymentStore from '../../store/paymentStore';
import PaymentIntent from './PaymentIntent';
import toast from 'react-hot-toast';

const PaymentButton = ({ booking, onPaymentSuccess, className = '' }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isLoading, error } = usePaymentStore();

  // Don't show payment button if booking is not accepted or already paid
  if (booking.status !== 'accepted' || booking.isPaid) {
    return null;
  }

  const handlePaymentSuccess = (paymentIntent) => {
    toast.success('Payment completed successfully!');
    setShowPaymentModal(false);
    
    // Call the parent callback if provided
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentIntent, booking);
    }
  };

  const handleCancel = () => {
    setShowPaymentModal(false);
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      );
    }

    if (booking.isPaid) {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Paid
        </>
      );
    }

    return (
      <>
        <CreditCard className="h-4 w-4 mr-2" />
        Pay Now
      </>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    if (booking.isPaid) {
      return `${baseStyles} bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500`;
    }
    
    if (isLoading) {
      return `${baseStyles} bg-gray-100 text-gray-500 cursor-not-allowed`;
    }
    
    return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  };

  return (
    <>
      <button
        onClick={() => setShowPaymentModal(true)}
        disabled={isLoading || booking.isPaid}
        className={`${getButtonStyles()} ${className}`}
      >
        {getButtonContent()}
      </button>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCancel}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <PaymentIntent
                      booking={booking}
                      onSuccess={handlePaymentSuccess}
                      onCancel={handleCancel}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentButton;
