import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import PaymentIntent from '../../components/payments/PaymentIntent';
import usePaymentStore from '../../store/paymentStore';
import { useBookingStore } from '../../store/bookingStore';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { getBookingById } = useBookingStore();
  const { clearCurrentPaymentIntent } = usePaymentStore();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true);
        const bookingData = getBookingById(bookingId);
        
        if (!bookingData) {
          toast.error('Booking not found');
          navigate('/passenger/my-trips');
          return;
        }

        if (bookingData.status !== 'accepted') {
          toast.error('This booking is not eligible for payment');
          navigate('/passenger/my-trips');
          return;
        }

        if (bookingData.isPaid) {
          toast.error('This booking has already been paid');
          navigate('/passenger/my-trips');
          return;
        }

        setBooking(bookingData);
      } catch (error) {
        console.error('Error loading booking:', error);
        toast.error('Failed to load booking details');
        navigate('/passenger/my-trips');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();

    // Cleanup on unmount
    return () => {
      clearCurrentPaymentIntent();
    };
  }, [bookingId, getBookingById, navigate, clearCurrentPaymentIntent]);

  const handlePaymentSuccess = (paymentIntent) => {
    toast.success('Payment completed successfully!');
    // Update booking status in store
    // This would typically be handled by the store or a refresh
    navigate('/passenger/my-trips?tab=accepted');
  };

  const handleCancel = () => {
    navigate('/passenger/my-trips?tab=accepted');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/passenger/my-trips')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/passenger/my-trips?tab=accepted')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Trips
          </button>
          
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
              <p className="text-gray-600">Secure payment for your trip booking</p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <PaymentIntent
            booking={booking}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Secure Payment</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your payment is processed securely through Stripe. We never store your card details.
                  All transactions are encrypted and protected by industry-standard security measures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
