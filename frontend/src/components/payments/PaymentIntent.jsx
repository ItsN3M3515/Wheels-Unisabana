import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import usePaymentStore from '../../store/paymentStore';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const PaymentForm = ({ booking, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent, isLoading, error, clearError } = usePaymentStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const handleCreatePaymentIntent = async () => {
    if (!booking) return;
    
    try {
      setIsProcessing(true);
      clearError();
      
      const intent = await createPaymentIntent(booking.id);
      setPaymentIntent(intent);
      
      toast.success('Payment intent created successfully');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error(error.message || 'Failed to create payment intent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: booking.passengerName || 'Passenger',
              email: booking.passengerEmail || ''
            }
          }
        }
      );

      if (error) {
        console.error('Payment failed:', error);
        toast.error(error.message || 'Payment failed');
      } else if (confirmedPaymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(confirmedPaymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (!booking) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No booking selected for payment</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
      </div>

      {/* Booking Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">Trip Details</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">From:</span> {booking.trip?.origin?.text}</p>
          <p><span className="font-medium">To:</span> {booking.trip?.destination?.text}</p>
          <p><span className="font-medium">Date:</span> {new Date(booking.trip?.departureAt).toLocaleDateString()}</p>
          <p><span className="font-medium">Seats:</span> {booking.seats}</p>
          <p><span className="font-medium">Price per seat:</span> ${booking.trip?.pricePerSeat?.toLocaleString()}</p>
          <p className="font-semibold text-lg text-green-600">
            Total: ${(booking.seats * booking.trip?.pricePerSeat).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Intent Creation */}
      {!paymentIntent && (
        <div className="text-center">
          <button
            onClick={handleCreatePaymentIntent}
            disabled={isLoading || isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading || isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Payment Intent...
              </>
            ) : (
              'Create Payment Intent'
            )}
          </button>
        </div>
      )}

      {/* Payment Form */}
      {paymentIntent && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="border border-gray-300 rounded-lg p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pay ${(booking.seats * booking.trip?.pricePerSeat).toLocaleString()}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const PaymentIntent = ({ booking, onSuccess, onCancel }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        booking={booking} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    </Elements>
  );
};

export default PaymentIntent;
