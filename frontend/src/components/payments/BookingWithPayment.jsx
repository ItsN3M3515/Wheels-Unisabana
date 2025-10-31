import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createBooking } from '../../api/booking';
import usePaymentStore from '../../store/paymentStore';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const BookingPaymentForm = ({ trip, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = usePaymentStore();
  
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('details'); // 'details', 'payment', 'processing', 'success'
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [error, setError] = useState(null);

  const totalAmount = seats * trip.pricePerSeat;

  const handleSeatsChange = (newSeats) => {
    if (newSeats >= 1 && newSeats <= trip.totalSeats) {
      setSeats(newSeats);
    }
  };

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handleCreatePaymentIntent = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Create payment intent first (this will also create the booking)
      const intent = await createPaymentIntent({
        tripId: trip.id,
        seats: seats,
        note: note || undefined,
      });
      
      setPaymentIntent(intent);
      toast.success('Reserva creada, procede con el pago');
    } catch (error) {
      console.error('Error creating booking/payment intent:', error);
      setError(error.message || 'Error al crear la reserva');
      toast.error(error.message || 'Error al crear la reserva');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitPayment = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: `${trip.driver?.firstName} ${trip.driver?.lastName}`,
              email: trip.driver?.corporateEmail || ''
            }
          }
        }
      );

      if (error) {
        console.error('Payment failed:', error);
        setError(error.message || 'El pago falló');
        setStep('payment');
        toast.error(error.message || 'El pago falló');
      } else if (confirmedPaymentIntent.status === 'succeeded') {
        setStep('success');
        toast.success('¡Pago exitoso! Tu reserva está confirmada');
        setTimeout(() => {
          onSuccess(confirmedPaymentIntent);
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Ocurrió un error durante el pago');
      setStep('payment');
      toast.error('Ocurrió un error durante el pago');
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

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Reserva Confirmada!</h3>
        <p className="text-gray-600 mb-4">
          Tu pago fue procesado exitosamente. El conductor recibirá una notificación.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Total pagado:</strong> ${totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Trip Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Detalles del Viaje</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Desde:</span> {trip.origin?.text}</p>
          <p><span className="font-medium">Hasta:</span> {trip.destination?.text}</p>
          <p><span className="font-medium">Fecha:</span> {new Date(trip.departureAt).toLocaleDateString()}</p>
          <p><span className="font-medium">Hora:</span> {new Date(trip.departureAt).toLocaleTimeString()}</p>
          <p><span className="font-medium">Conductor:</span> {trip.driver?.firstName} {trip.driver?.lastName}</p>
        </div>
      </div>

      {step === 'details' && (
        <div className="space-y-4">
          {/* Seats Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de asientos
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => handleSeatsChange(seats - 1)}
                disabled={seats <= 1}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-lg font-medium">{seats}</span>
              <button
                type="button"
                onClick={() => handleSeatsChange(seats + 1)}
                disabled={seats >= trip.totalSeats}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Máximo {trip.totalSeats} asientos disponibles
            </p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota para el conductor (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Voy con maleta grande..."
            />
          </div>

          {/* Total */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total a pagar:</span>
              <span className="text-xl font-bold text-blue-600">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {seats} asiento{seats > 1 ? 's' : ''} × ${trip.pricePerSeat.toLocaleString()}
            </p>
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

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Proceder al Pago
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Resumen del Pago</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Asientos:</span>
                <span>{seats}</span>
              </div>
              <div className="flex justify-between">
                <span>Precio por asiento:</span>
                <span>${trip.pricePerSeat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de la Tarjeta
              </label>
              <div className="border border-gray-300 rounded-lg p-3">
                <CardElement options={cardElementOptions} />
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

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Pagar ${totalAmount.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando Pago...</h3>
          <p className="text-gray-600">Por favor espera mientras procesamos tu pago</p>
        </div>
      )}
    </div>
  );
};

const BookingWithPayment = ({ trip, onSuccess, onCancel }) => {
  return (
    <Elements stripe={stripePromise}>
      <BookingPaymentForm 
        trip={trip} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    </Elements>
  );
};

export default BookingWithPayment;
