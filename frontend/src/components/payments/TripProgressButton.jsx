import React, { useState } from 'react';
import { completeTripOffer } from '../../api/tripOffer';
import toast from 'react-hot-toast';

const TripProgressButton = ({ trip, onStatusChange }) => {
  const [tripStatus, setTripStatus] = useState('scheduled'); // scheduled, in_progress, completed
  
  console.log('TripProgressButton rendered for trip:', trip.id, 'with status:', tripStatus);

  const handleStartTrip = () => {
    setTripStatus('in_progress');
    toast.success('Viaje iniciado - El conductor recogió al pasajero');
    if (onStatusChange) {
      onStatusChange(trip, 'in_progress');
    }
  };

  const handleCompleteTrip = async () => {
    console.log('Starting trip completion for trip:', trip.id);
    try {
      setTripStatus('completed');
      console.log('Local status updated to completed');
      
      // Call backend to update trip status to completed
      console.log('Calling completeTripOffer API...');
      await completeTripOffer(trip.id);
      console.log('Trip completed successfully in backend');
      
      toast.success('Viaje completado exitosamente');
      if (onStatusChange) {
        console.log('Calling onStatusChange callback...');
        onStatusChange(trip, 'completed');
      }
    } catch (error) {
      console.error('Error completing trip:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      toast.error('Error al completar el viaje: ' + errorMessage);
      
      // Revert status on error
      setTripStatus('in_progress');
    }
  };


  if (tripStatus === 'scheduled') {
    return (
      <button
        onClick={handleStartTrip}
        style={{
          padding: '10px 20px',
          fontSize: '0.95rem',
          fontWeight: 'normal',
          color: 'white',
          backgroundColor: '#032567',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
      >
        Iniciar Viaje
      </button>
    );
  }

  if (tripStatus === 'in_progress') {
    return (
      <button
        onClick={handleCompleteTrip}
        style={{
          padding: '10px 20px',
          fontSize: '0.95rem',
          fontWeight: 'normal',
          color: 'white',
          backgroundColor: '#10b981',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
      >
        Completar Viaje
      </button>
    );
  }

  if (tripStatus === 'completed') {
    return (
      <div style={{
        padding: '10px 20px',
        fontSize: '0.9rem',
        fontWeight: '500',
        color: '#059669',
        backgroundColor: '#d1fae5',
        border: '1px solid #a7f3d0',
        borderRadius: '25px',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center'
      }}>
        Viaje Completado
      </div>
    );
  }


  return null;
};

export default TripProgressButton;
