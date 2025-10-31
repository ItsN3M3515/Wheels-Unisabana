import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PassengerPaymentConfirmation = ({ passenger, onPaymentConfirmed }) => {
  const [paymentStatus, setPaymentStatus] = useState(null); // null, paid, not_paid

  const handleConfirmPayment = (paid) => {
    setPaymentStatus(paid ? 'paid' : 'not_paid');
    if (paid) {
      toast.success(`Pago confirmado para ${passenger.name}`);
    } else {
      toast.error(`Pago no recibido de ${passenger.name}`);
    }
    if (onPaymentConfirmed) {
      onPaymentConfirmed(passenger, paid);
    }
  };

  if (paymentStatus === 'paid') {
    return (
      <div style={{
        padding: '6px 12px',
        fontSize: '0.8rem',
        fontWeight: '500',
        color: '#059669',
        backgroundColor: '#d1fae5',
        border: '1px solid #a7f3d0',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        display: 'inline-block'
      }}>
        ✅ Pagó
      </div>
    );
  }

  if (paymentStatus === 'not_paid') {
    return (
      <div style={{
        padding: '6px 12px',
        fontSize: '0.8rem',
        fontWeight: '500',
        color: '#dc2626',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        display: 'inline-block'
      }}>
        ❌ No Pagó
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        onClick={() => handleConfirmPayment(true)}
        style={{
          padding: '6px 12px',
          fontSize: '0.8rem',
          fontWeight: 'normal',
          color: 'white',
          backgroundColor: '#10b981',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
      >
        Sí, Pagó
      </button>
      
      <button
        onClick={() => handleConfirmPayment(false)}
        style={{
          padding: '6px 12px',
          fontSize: '0.8rem',
          fontWeight: 'normal',
          color: 'white',
          backgroundColor: '#ef4444',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
      >
        No Pagó
      </button>
    </div>
  );
};

export default PassengerPaymentConfirmation;
