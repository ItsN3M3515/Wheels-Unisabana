import React, { useState } from 'react';
import { Play, Pause, CheckCircle, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const TripStatusSimulator = ({ booking, onStatusChange }) => {
  const [tripStatus, setTripStatus] = useState('scheduled'); // scheduled, in_progress, completed
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handleStartTrip = () => {
    setTripStatus('in_progress');
    toast.success('Viaje iniciado - El conductor recogió al pasajero');
    if (onStatusChange) {
      onStatusChange(booking, 'in_progress');
    }
  };

  const handleCompleteTrip = () => {
    setTripStatus('completed');
    toast.success('Viaje completado - Ahora puedes confirmar el pago');
    if (onStatusChange) {
      onStatusChange(booking, 'completed');
    }
  };

  const handleConfirmPayment = (paid) => {
    setPaymentConfirmed(paid);
    if (paid) {
      toast.success('Pago confirmado - El pasajero pagó correctamente');
    } else {
      toast.error('Pago no recibido - El pasajero no pagó');
    }
    if (onStatusChange) {
      onStatusChange(booking, 'payment_confirmed', paid);
    }
  };

  if (tripStatus === 'scheduled') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">Viaje Programado</span>
        </div>
        
        <p className="text-sm text-blue-700 mb-4">
          El viaje está programado. Cuando recojas al pasajero, inicia el viaje.
        </p>
        
        <button
          onClick={handleStartTrip}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
        >
          <Play className="h-4 w-4 mr-2" />
          Iniciar Viaje (Recoger Pasajero)
        </button>
      </div>
    );
  }

  if (tripStatus === 'in_progress') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <MapPin className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">Viaje en Curso</span>
        </div>
        
        <p className="text-sm text-yellow-700 mb-4">
          El viaje está en progreso. Cuando llegues al destino, completa el viaje.
        </p>
        
        <button
          onClick={handleCompleteTrip}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-yellow-700 flex items-center justify-center"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Completar Viaje (Llegar al Destino)
        </button>
      </div>
    );
  }

  if (tripStatus === 'completed' && !paymentConfirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Viaje Completado</span>
        </div>
        
        <p className="text-sm text-green-700 mb-4">
          El viaje terminó. ¿El pasajero pagó en efectivo?
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleConfirmPayment(true)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Sí, Pagó
          </button>
          
          <button
            onClick={() => handleConfirmPayment(false)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center"
          >
            <Pause className="h-4 w-4 mr-2" />
            No Pagó
          </button>
        </div>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Pago Confirmado</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          El pasajero pagó correctamente en efectivo
        </p>
      </div>
    );
  }

  return null;
};

export default TripStatusSimulator;
