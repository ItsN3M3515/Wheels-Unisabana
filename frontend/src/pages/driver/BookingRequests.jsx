import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/images/UniSabana Logo.png';

export default function BookingRequests() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('accepted');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call to get driver's booking requests
      // In real implementation, this would call the backend
      const mockBookings = [
        {
          id: '1',
          tripId: 'trip1',
          passengerId: 'passenger1',
          passengerName: 'Ana García',
          passengerEmail: 'ana@unisabana.edu.co',
          seats: 2,
          note: 'Voy con maleta',
          status: 'accepted',
          isPaid: false,
          createdAt: '2024-01-15T10:00:00Z',
          trip: {
            id: 'trip1',
            origin: { text: 'Campus Norte' },
            destination: { text: 'Campus Sur' },
            departureAt: '2024-01-16T08:00:00Z',
            pricePerSeat: 5000
          }
        },
        {
          id: '2',
          tripId: 'trip2',
          passengerId: 'passenger2',
          passengerName: 'Carlos López',
          passengerEmail: 'carlos@unisabana.edu.co',
          seats: 1,
          note: '',
          status: 'accepted',
          isPaid: true,
          createdAt: '2024-01-15T09:30:00Z',
          trip: {
            id: 'trip2',
            origin: { text: 'Chía Centro' },
            destination: { text: 'Bogotá Centro' },
            departureAt: '2024-01-16T14:00:00Z',
            pricePerSeat: 8000
          }
        }
      ];
      
      setBookings(mockBookings);
    } catch (err) {
      console.error('[BookingRequests] Error loading bookings:', err);
      setError('Error al cargar las reservas: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={logo} 
              alt="Wheels UniSabana" 
              style={{ height: '40px', width: 'auto' }}
            />
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              Reservas de Viajes
            </h1>
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                height: '40px',
                width: '40px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </button>

            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                width: '200px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                padding: '8px 0',
                zIndex: 50
              }}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#374151',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Mi Perfil
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        {/* Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => navigate('/my-trips')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            ← Mis Viajes
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'accepted', label: 'Aceptadas' },
            { value: 'declined', label: 'Rechazadas' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: statusFilter === filter.value ? 'white' : '#374151',
                backgroundColor: statusFilter === filter.value ? '#3b82f6' : 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No hay reservas</p>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {statusFilter === 'all' 
                ? 'No tienes reservas en este momento'
                : `No hay reservas con estado "${statusFilter}"`
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {/* Booking Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.passengerName}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.passengerEmail}
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: booking.status === 'accepted' ? '#dcfce7' : 
                                   booking.status === 'pending' ? '#fef3c7' : '#fecaca',
                    color: booking.status === 'accepted' ? '#166534' :
                          booking.status === 'pending' ? '#92400e' : '#991b1b'
                  }}>
                    {booking.status === 'accepted' ? 'Aceptada' :
                     booking.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                  </div>
                </div>

                {/* Trip Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Viaje
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.trip.origin.text} → {booking.trip.destination.text}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Fecha y Hora
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatDate(booking.trip.departureAt)}
                    </p>
                  </div>
                </div>

                {/* Booking Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Asientos
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.seats}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Precio por asiento
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatPrice(booking.trip.pricePerSeat)}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Total
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatPrice(booking.trip.pricePerSeat * booking.seats)}
                    </p>
                  </div>
                </div>

                {/* Note */}
                {booking.note && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Nota del pasajero
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: '#111827',
                      margin: 0,
                      fontStyle: 'italic',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      "{booking.note}"
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
