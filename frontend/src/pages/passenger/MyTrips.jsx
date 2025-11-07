import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getMyBookings, cancelBooking } from '../../api/booking';
import { getMyReviewForTrip } from '../../api/review';
import Toast from '../../components/common/Toast';
import ReportUserModal from '../../components/users/ReportUserModal';
import Navbar from '../../components/common/Navbar';

export default function MyTrips() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reserved'); // 'in-progress', 'reserved', 'completed', 'canceled'
  const [reviewsMap, setReviewsMap] = useState({}); // Map of tripId -> review
  const [showReportModal, setShowReportModal] = useState(null); // {userId, userName, tripId}

  useEffect(() => {
    console.log('[MyTrips] Component mounted, loading bookings...');
    loadBookings();
  }, []);

  // Helper to check if trip is in the future
  const isTripUpcoming = (departureDate) => {
    return new Date(departureDate) > new Date();
  };

  // Helper to check if trip is in the past
  const isTripPast = (departureDate) => {
    return new Date(departureDate) < new Date();
  };

  // Categorize bookings based on trip status (not dates)
  // En progreso: Viajes aceptados donde el viaje tiene status 'in_progress'
  const inProgressBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    if (b.status !== 'accepted') return false;
    return b.trip.status === 'in_progress';
  });

  // Reservados: Pendientes O aceptados donde el viaje está 'published' (aún no iniciado)
  const reservedBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    if (b.status === 'pending') return true;
    if (b.status === 'accepted' && b.trip.status === 'published') return true;
    return false;
  });

  // Completados: Viajes aceptados donde el viaje tiene status 'completed'
  const completedBookings = bookings.filter(b => {
    if (!b || !b.trip) return false;
    if (b.status !== 'accepted') return false;
    return b.trip.status === 'completed';
  });

  const canceledBookings = bookings.filter(b => {
    if (!b) return false;
    return ['declined', 'canceled_by_passenger', 'canceled_by_platform', 'expired', 'declined_auto'].includes(b.status);
  });

  // Load reviews for completed trips
  useEffect(() => {
    const loadReviews = async () => {
      const reviews = {};
      for (const booking of completedBookings) {
        try {
          const review = await getMyReviewForTrip(booking.tripId);
          reviews[booking.tripId] = review;
        } catch (error) {
          // Review doesn't exist yet, that's OK
          if (error.status !== 404) {
            console.error('Error loading review:', error);
          }
        }
      }
      setReviewsMap(reviews);
    };

    if (completedBookings.length > 0) {
      loadReviews();
    }
  }, [completedBookings.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first tab with bookings
  useEffect(() => {
    if (bookings.length > 0) {
      // Don't change if current tab has content
      const currentTabHasContent = 
        (activeTab === 'reserved' && reservedBookings.length > 0) ||
        (activeTab === 'in-progress' && inProgressBookings.length > 0) ||
        (activeTab === 'completed' && completedBookings.length > 0) ||
        (activeTab === 'canceled' && canceledBookings.length > 0);
      
      if (currentTabHasContent) return;
      
      // Switch to first tab with content
      if (reservedBookings.length > 0) setActiveTab('reserved');
      else if (inProgressBookings.length > 0) setActiveTab('in-progress');
      else if (completedBookings.length > 0) setActiveTab('completed');
      else if (canceledBookings.length > 0) setActiveTab('canceled');
    }
  }, [bookings.length, reservedBookings.length, inProgressBookings.length, completedBookings.length, canceledBookings.length, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBookings = async () => {
    try {
      console.log('[MyTrips] loadBookings called, making API request...');
      setLoading(true);
      setError(null);
      const data = await getMyBookings();
      console.log('[MyTrips] Bookings loaded:', data);
      console.log('[MyTrips] Bookings items:', data.items);
      console.log('[MyTrips] Total bookings:', data.total);
      
      // Validate bookings structure
      if (data.items && Array.isArray(data.items)) {
        const validBookings = data.items.filter(booking => {
          if (!booking) {
            console.warn('[MyTrips] Null booking found');
            return false;
          }
          if (!booking.trip) {
            console.warn('[MyTrips] Booking without trip:', booking.id);
            return false;
          }
          if (!booking.trip.origin || !booking.trip.destination) {
            console.warn('[MyTrips] Booking with incomplete trip data:', booking.id, booking.trip);
            return false;
          }
          return true;
        });
        console.log('[MyTrips] Valid bookings:', validBookings.length);
        setBookings(validBookings);
      } else {
        console.warn('[MyTrips] Invalid data structure:', data);
        setBookings([]);
      }
    } catch (err) {
      console.error('[MyTrips] Error loading bookings:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar tus viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await cancelBooking(selectedBooking.id);
      setSuccess('Viaje cancelado exitosamente');
      setSelectedBooking(null);
      loadBookings(); // Reload bookings
    } catch (err) {
      console.error('[MyTrips] Cancel error:', err);
      setError(err.message || 'Error al cancelar el viaje');
    } finally {
      setCancelLoading(false);
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

  const getStatusBadge = (status, booking) => {
    // Determine badge text based on booking status and trip status
    // Priority: trip.status > booking.status
    let badgeText = '';
    let badgeBg = '#e0f2fe';
    let badgeColor = '#032567';

    // First check trip status for accepted bookings (this is the source of truth)
    if (status === 'accepted' && booking?.trip?.status) {
      if (booking.trip.status === 'in_progress') {
        badgeText = 'En progreso';
        badgeBg = '#e0f2fe';
        badgeColor = '#032567';
      } else if (booking.trip.status === 'completed') {
        badgeText = 'Completado';
        badgeBg = '#e0f2fe';
        badgeColor = '#032567';
      } else if (booking.trip.status === 'published') {
        badgeText = 'Confirmado';
        badgeBg = '#e0f2fe';
        badgeColor = '#032567';
      } else {
        // Fallback for other trip statuses
        badgeText = 'Confirmado';
        badgeBg = '#e0f2fe';
        badgeColor = '#032567';
      }
    } else if (status === 'pending') {
      badgeText = 'Pendiente';
      badgeBg = '#e0f2fe';
      badgeColor = '#032567';
    } else if (['declined', 'canceled_by_passenger', 'canceled_by_platform', 'expired', 'declined_auto'].includes(status)) {
      badgeBg = '#f5f5f4';
      badgeColor = '#57534e';
      if (activeTab === 'canceled') {
        badgeText = 'Cancelado';
      } else if (status === 'declined') {
        badgeText = 'Rechazado';
      } else if (status === 'expired') {
        badgeText = 'Expirado';
      } else {
        badgeText = 'Cancelado';
      }
    } else {
      badgeText = 'Pendiente';
      badgeBg = '#e0f2fe';
      badgeColor = '#032567';
    }

    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: badgeBg,
        color: badgeColor,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badgeText}
      </span>
    );
  };


  // Debug logs
  console.log('[MyTrips] Total bookings:', bookings.length);
  console.log('[MyTrips] All bookings:', bookings);
  bookings.forEach((b, i) => {
    console.log(`[MyTrips] Booking ${i}:`, {
      id: b?.id,
      status: b?.status,
      hasTrip: !!b?.trip,
      tripId: b?.tripId,
      tripOrigin: b?.trip?.origin,
      tripDestination: b?.trip?.destination
    });
  });
  // Get count for each category
  const getCategoryCount = (category) => {
    switch(category) {
      case 'in-progress': return inProgressBookings.length;
      case 'reserved': return reservedBookings.length;
      case 'completed': return completedBookings.length;
      case 'canceled': return canceledBookings.length;
      default: return 0;
    }
  };

  // Get bookings for active tab
  const getActiveBookings = () => {
    switch(activeTab) {
      case 'in-progress': return inProgressBookings;
      case 'reserved': return reservedBookings;
      case 'completed': return completedBookings;
      case 'canceled': return canceledBookings;
      default: return [];
    }
  };

  const activeBookings = getActiveBookings();

  // Debug logs
  console.log('[MyTrips] In-progress bookings:', inProgressBookings.length);
  console.log('[MyTrips] Reserved bookings (pending):', reservedBookings.length);
  console.log('[MyTrips] Completed bookings:', completedBookings.length);
  console.log('[MyTrips] Canceled bookings:', canceledBookings.length);
  console.log('[MyTrips] Active tab:', activeTab);
  console.log('[MyTrips] Active bookings for tab:', activeBookings.length);

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
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando viajes...</p>
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar activeLink="my-trips" />

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            fontFamily: 'Inter, sans-serif',
            margin: 0
          }}>
            Mis viajes
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif',
            margin: '8px 0 0 0'
          }}>
            Gestiona todas tus reservas de viaje
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#991b1b', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                padding: '0',
                fontSize: '18px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <span style={{ color: '#16a34a', fontSize: '20px' }}>✓</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {success}
              </p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                cursor: 'pointer',
                padding: '0',
                fontSize: '18px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid #e7e5e4',
          paddingBottom: '0'
        }}>
          {[
            { id: 'in-progress', label: 'En progreso' },
            { id: 'reserved', label: 'Reservados' },
            { id: 'completed', label: 'Completados' },
            { id: 'canceled', label: 'Cancelados' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: activeTab === tab.id ? '500' : 'normal',
                color: activeTab === tab.id ? '#032567' : '#57534e',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #032567' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.target.style.color = '#1c1917';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.target.style.color = '#57534e';
              }}
            >
              {tab.label}
              {getCategoryCount(tab.id) > 0 && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: activeTab === tab.id ? '#032567' : '#e7e5e4',
                  color: activeTab === tab.id ? 'white' : '#57534e'
                }}>
                  {getCategoryCount(tab.id)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {activeBookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#fafafa',
            borderRadius: '16px',
            border: '1px solid #e7e5e4'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {bookings.length === 0 
                ? 'No tienes reservas aún' 
                : activeTab === 'in-progress' && 'No tienes viajes en progreso'
                || activeTab === 'reserved' && 'No tienes viajes reservados'
                || activeTab === 'completed' && 'No tienes viajes completados'
                || activeTab === 'canceled' && 'No tienes viajes cancelados'}
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {bookings.length === 0 
                ? 'Busca viajes disponibles y solicita tu primera reserva'
                : activeTab === 'reserved' && 'Busca viajes disponibles y solicita tu primera reserva'
                || 'Los viajes aparecerán aquí cuando corresponda'}
            </p>
            {activeTab === 'reserved' && (
              <button
                onClick={() => navigate('/search')}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
              >
                Buscar viajes
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeBookings.map((booking) => {
              // Validate booking data
              if (!booking || !booking.trip || !booking.trip.origin || !booking.trip.destination) {
                console.warn('[MyTrips] Invalid booking data:', booking);
                return null;
              }
              
              return (
              <div
                key={booking.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e7e5e4',
                  borderRadius: '16px',
                  padding: '28px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '20px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {booking.trip.origin.text} → {booking.trip.destination.text}
                      </h3>
                      {getStatusBadge(booking.status, booking)}
                    </div>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#57534e',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatDate(booking.trip.departureAt)}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                  marginBottom: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #f5f5f4'
                }}>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Asientos
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.seats} {booking.seats === 1 ? 'asiento' : 'asientos'}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#57534e',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Conductor
                      </p>
                      {booking.status === 'accepted' && booking.trip.driverId && (
                        <button
                          onClick={() => setShowReportModal({
                            userId: booking.trip.driverId,
                            userName: `${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`,
                            tripId: booking.tripId
                          })}
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 'normal',
                            color: '#dc2626',
                            backgroundColor: 'transparent',
                            border: '1px solid #dc2626',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                          title="Reportar conductor"
                        >
                          Reportar
                        </button>
                      )}
                    </div>
                    {booking.trip.driverId ? (
                      <Link
                        to={`/drivers/${booking.trip.driverId}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#032567',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#1A6EFF'}
                        onMouseLeave={(e) => e.target.style.color = '#032567'}
                      >
                        {booking.trip.driver.firstName} {booking.trip.driver.lastName} →
                      </Link>
                    ) : (
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Total
                    </p>
                    <p style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#032567',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatPrice(booking.trip.pricePerSeat * booking.seats)}
                    </p>
                  </div>
                </div>

                {booking.note && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid #fde68a'
                  }}>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Tu mensaje:
                    </p>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontStyle: 'italic'
                    }}>
                      "{booking.note}"
                    </p>
                  </div>
                )}

                {/* Actions based on status */}
                {booking.status === 'pending' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.95rem',
                        fontWeight: 'normal',
                        color: '#032567',
                        backgroundColor: 'white',
                        border: '2px solid #032567',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Cancelar reserva
                    </button>
                  </div>
                )}

                {booking.status === 'accepted' && booking.trip.status === 'published' && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '12px',
                    border: '1px solid #86efac'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#15803d',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '500'
                    }}>
                      Viaje confirmado. ¡Nos vemos pronto!
                    </p>
                  </div>
                )}

                {booking.status === 'accepted' && booking.trip.status === 'completed' && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#1e40af',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Viaje completado
                    </p>
                    {reviewsMap[booking.tripId] ? (
                      <button
                        onClick={() => navigate(`/trips/${booking.tripId}/review`)}
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 'normal',
                          color: '#032567',
                          backgroundColor: 'white',
                          border: '2px solid #032567',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f0f9ff';
                          e.target.style.borderColor = '#1A6EFF';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'white';
                          e.target.style.borderColor = '#032567';
                        }}
                      >
                        Ver/Editar reseña
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/trips/${booking.tripId}/review`)}
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 'normal',
                          color: 'white',
                          backgroundColor: '#032567',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
                      >
                        Escribir reseña
                      </button>
                    )}
                  </div>
                )}

                {booking.status === 'declined' && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '12px',
                    border: '1px solid #fca5a5'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#991b1b',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      El conductor no pudo aceptar tu reserva
                    </p>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
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
          onClick={() => !cancelLoading && setSelectedBooking(null)}
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
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              ¿Cancelar reserva?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6'
            }}>
              Estás a punto de cancelar tu reserva para el viaje de <strong>{selectedBooking.trip.origin.text}</strong> a <strong>{selectedBooking.trip.destination.text}</strong>. Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                disabled={cancelLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#f5f5f4';
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = 'white';
                }}
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: cancelLoading ? '#94a3b8' : '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#1A6EFF';
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#032567';
                }}
              >
                {cancelLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <ReportUserModal
          userId={showReportModal.userId}
          userName={showReportModal.userName}
          tripId={showReportModal.tripId}
          onClose={() => setShowReportModal(null)}
          onReported={() => {
            setSuccess('Usuario reportado exitosamente');
          }}
        />
      )}
    </div>
  );
}

