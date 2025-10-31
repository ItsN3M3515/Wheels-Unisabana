import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentConfirmation = ({ booking, onPaymentConfirmed, onPaymentNotReceived }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // null, true, false

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);
      
      // Simulate API call to confirm payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfirmed(true);
      toast.success('Pago confirmado exitosamente');
      
      if (onPaymentConfirmed) {
        onPaymentConfirmed(booking);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Error al confirmar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotReceived = async () => {
    try {
      setIsProcessing(true);
      
      // Simulate API call to mark as not paid
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfirmed(false);
      toast.error('Marcado como no pagado');
      
      if (onPaymentNotReceived) {
        onPaymentNotReceived(booking);
      }
    } catch (error) {
      console.error('Error marking as not paid:', error);
      toast.error('Error al marcar como no pagado');
    } finally {
      setIsProcessing(false);
    }
  };

  if (confirmed === true) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Pago Confirmado</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          El pasajero pagó correctamente
        </p>
      </div>
    );
  }

  if (confirmed === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">No Pagado</span>
        </div>
        <p className="text-sm text-red-700 mt-1">
          El pasajero no realizó el pago
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
        <span className="text-yellow-800 font-medium">Confirmar Pago</span>
      </div>
      
      <p className="text-sm text-yellow-700 mb-4">
        ¿El pasajero pagó en efectivo al subir al vehículo?
      </p>
      
      <div className="flex space-x-2">
        <button
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sí, Pagó
            </>
          )}
        </button>
        
        <button
          onClick={handleNotReceived}
          disabled={isProcessing}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              No Pagó
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentConfirmation;
