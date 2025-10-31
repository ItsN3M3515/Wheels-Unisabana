import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createBooking } from '../../api/booking';
import toast from 'react-hot-toast';

const SimpleBooking = ({ trip, onSuccess, onCancel }) => {
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('details'); // 'details', 'payment', 'processing', 'success'
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

  const handleSubmitPayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setStep('processing');
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create booking
      const booking = await createBooking({
        tripId: trip.id,
        seats: seats,
        note: note || undefined,
      });

      setStep('success');
      toast.success('¡Reserva confirmada y pago exitoso!');
      
      setTimeout(() => {
        onSuccess(booking);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Error al crear la reserva');
      setStep('details');
      toast.error(error.message || 'Error al crear la reserva');
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-xs text-green-700 mt-1">
            El pago se liberará cuando el conductor confirme que el viaje se completó
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
            <p className="text-xs text-blue-700 mt-2">
              💡 El pago se liberará cuando el conductor confirme que el viaje se completó
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
              Reservar y Pagar
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

          {/* Payment Method */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-800">Método de Pago</h4>
            </div>
            <p className="text-sm text-yellow-700">
              Por ahora, el pago se simula. En producción se integrará con Stripe o el método de pago elegido.
            </p>
          </div>

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
              type="button"
              onClick={handleSubmitPayment}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
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

export default SimpleBooking;
