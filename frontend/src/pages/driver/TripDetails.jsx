import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTripOfferById, getTripBookings, acceptBooking, declineBooking } from '../../api/tripOffer';
import logo from '../../assets/images/UniSabana Logo.png';
import Toast from '../../components/common/Toast';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTripDetails();
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTripDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[TripDetails] Loading trip with ID:', id);
      const data = await getTripOfferById(id);
      console.log('[TripDetails] Trip data received:', data);
      setTrip(data);
    } catch (err) {
      console.error('[TripDetails] Error loading trip:', err);
      console.error('[TripDetails] Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status
      });
      setError(err.message || 'Error al cargar los detalles del viaje');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await getTripBookings(id);
      setBookings(data.items || []);
    } catch (err) {
      console.error('[TripDetails] Bookings error:', err);
      // Don't set error for bookings, just log it
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await acceptBooking(id, bookingId);
      setToast({
        message: 'Reserva aceptada exitosamente',
        type: 'success'
      });
      setSelectedBooking(null);
      loadBookings(); // Reload bookings
      loadTripDetails(); // Reload trip (to update available seats)
    } catch (err) {
      console.error('[TripDetails] Accept error:', err);
      setToast({
        message: err.message || 'Error al aceptar la reserva',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await declineBooking(id, bookingId);
      setToast({
        message: 'Reserva rechazada',
        type: 'success'
      });
      setSelectedBooking(null);
      loadBookings(); // Reload bookings
    } catch (err) {
      console.error('[TripDetails] Decline error:', err);
      setToast({
        message: err.message || 'Error al rechazar la reserva',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: '#f5f5f4', color: '#57534e', text: 'Borrador' },
      published: { bg: '#e0f2fe', color: '#032567', text: 'Publicado' },
      canceled: { bg: '#f5f5f4', color: '#57534e', text: 'Cancelado' },
      completed: { bg: '#f5f5f4', color: '#57534e', text: 'Completado' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badge.text}
      </span>
    );
  };

  const getBookingStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#e0f2fe', color: '#032567', text: 'Pendiente' },
      accepted: { bg: '#e0f2fe', color: '#032567', text: 'Aceptada' },
      declined: { bg: '#f5f5f4', color: '#57534e', text: 'Rechazada' },
      canceled_by_passenger: { bg: '#f5f5f4', color: '#57534e', text: 'Cancelada' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e7e5e4',
            borderTop: '3px solid #032567',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando detalles...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white', padding: '48px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontSize: '1.2rem', fontFamily: 'Inter, sans-serif' }}>
            No se encontró el viaje
          </p>
          <button
            onClick={() => navigate('/my-trips')}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: '#032567',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Volver a mis viajes
          </button>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Simple Navbar */}
      <header style={{
        width: '100%',
        borderBottom: '1px solid #e7e5e4',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Link 
            to="/dashboard" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src={logo} 
              alt="Wheels UniSabana Logo" 
              style={{ 
                height: '4rem', 
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <span style={{
              fontSize: '20px',
              fontWeight: 'normal',
              color: '#1c1917',
              fontFamily: 'Inter, sans-serif'
            }}>
              Wheels UniSabana
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Back button and Title */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/my-trips')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#57534e',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '16px',
              padding: '8px 0',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1c1917'}
            onMouseLeave={(e) => e.target.style.color = '#57534e'}
          >
            <span style={{ fontSize: '1.2rem' }}>←</span>
            <span>Volver a mis viajes</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'normal',
              color: '#1c1917',
              fontFamily: 'Inter, sans-serif',
              margin: 0
            }}>
              Detalles del viaje
            </h1>
            {getStatusBadge(trip.status)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Left Column - Trip Details */}
          <div>
            {/* Route Card */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '24px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Ruta
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#032567', fontSize: '1.5rem' }}>●</span>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Origen
                    </p>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {trip.origin.text}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#57534e', fontSize: '1.5rem' }}>●</span>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Destino
                    </p>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {trip.destination.text}
                    </p>
                  </div>
                </div>
              </div>

              {trip.notes && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    marginBottom: '8px',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Descripción de la ruta
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#57534e',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {trip.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Schedule Card */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '20px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Horario
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Salida
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatDate(trip.departureAt)}
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Llegada estimada
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatDate(trip.estimatedArrivalAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Bookings */}
          <div>
            {/* Summary Card */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #e0f2fe',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '20px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Resumen
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Precio por asiento
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#032567',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatPrice(trip.pricePerSeat)}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #e0f2fe', paddingTop: '16px' }}>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Asientos
                  </p>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {trip.totalSeats - acceptedBookings.reduce((sum, b) => sum + b.seats, 0)} disponibles de {trip.totalSeats}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #e0f2fe', paddingTop: '16px' }}>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Solicitudes pendientes
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#032567',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {pendingBookings.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Bookings Section */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e7e5e4',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '20px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Solicitudes de reserva
              </h2>

              {bookingsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    border: '3px solid #e7e5e4',
                    borderTop: '3px solid #032567',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              ) : bookings.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#57534e',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <p style={{ fontSize: '0.9rem' }}>No hay solicitudes aún</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => booking.status === 'pending' && setSelectedBooking(booking)}
                      style={{
                        padding: '16px',
                        border: '1px solid #e7e5e4',
                        borderRadius: '12px',
                        cursor: booking.status === 'pending' ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        backgroundColor: booking.status === 'pending' ? 'white' : '#fafafa'
                      }}
                      onMouseEnter={(e) => {
                        if (booking.status === 'pending') {
                          e.currentTarget.style.borderColor = '#032567';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (booking.status === 'pending') {
                          e.currentTarget.style.borderColor = '#e7e5e4';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#1c1917',
                            margin: '0 0 4px 0',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {booking.passenger.firstName} {booking.passenger.lastName}
                          </p>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#57534e',
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {booking.seats} {booking.seats === 1 ? 'asiento' : 'asientos'}
                          </p>
                        </div>
                        {getBookingStatusBadge(booking.status)}
                      </div>
                      {booking.note && (
                        <p style={{
                          fontSize: '0.85rem',
                          color: '#57534e',
                          margin: '8px 0 0 0',
                          fontFamily: 'Inter, sans-serif',
                          fontStyle: 'italic'
                        }}>
                          "{booking.note}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Action Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={() => !actionLoading && setSelectedBooking(null)}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Solicitud de reserva
            </h2>

            {/* Passenger Info */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedBooking.passenger.firstName?.[0]}{selectedBooking.passenger.lastName?.[0]}
                </div>
                <div>
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {selectedBooking.passenger.firstName} {selectedBooking.passenger.lastName}
                  </p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#57534e',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {selectedBooking.passenger.corporateEmail}
                  </p>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #e7e5e4',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif'
              }}>
                <span>Asientos solicitados:</span>
                <span style={{ fontWeight: '500', color: '#1c1917' }}>
                  {selectedBooking.seats} {selectedBooking.seats === 1 ? 'asiento' : 'asientos'}
                </span>
              </div>
              <div style={{
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif'
              }}>
                <span>Total:</span>
                <span style={{ fontWeight: '600', color: '#032567', fontSize: '1.1rem' }}>
                  {formatPrice(trip.pricePerSeat * selectedBooking.seats)}
                </span>
              </div>
            </div>

            {/* Message */}
            {selectedBooking.note && (
              <div style={{
                padding: '16px',
                backgroundColor: '#fafafa',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #e7e5e4'
              }}>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Mensaje del pasajero:
                </p>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  fontStyle: 'italic'
                }}>
                  "{selectedBooking.note}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleDeclineBooking(selectedBooking.id)}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#dc2626',
                  backgroundColor: 'white',
                  border: '2px solid #dc2626',
                  borderRadius: '25px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.target.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.target.style.backgroundColor = 'white';
                }}
              >
                Rechazar
              </button>
              <button
                onClick={() => handleAcceptBooking(selectedBooking.id)}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: actionLoading ? '#94a3b8' : '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.target.style.backgroundColor = '#1A6EFF';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.target.style.backgroundColor = '#032567';
                }}
              >
                {actionLoading ? 'Procesando...' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
