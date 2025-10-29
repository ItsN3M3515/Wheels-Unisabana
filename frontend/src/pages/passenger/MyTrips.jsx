import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getMyBookings, cancelBooking } from '../../api/booking';
import logo from '../../assets/images/UniSabana Logo.png';
import Toast from '../../components/common/Toast';

export default function MyTrips() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('in-progress'); // 'in-progress', 'reserved', 'completed', 'canceled'

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBookings();
      console.log('[MyTrips] Bookings loaded:', data);
      console.log('[MyTrips] Bookings items:', data.items);
      setBookings(data.items || []);
    } catch (err) {
      console.error('[MyTrips] Error:', err);
      setError('Error al cargar tus viajes');
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('[MyTrips] Logout error:', err);
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
      pending: { bg: '#e0f2fe', color: '#032567', text: 'Pendiente' },
      accepted: { bg: '#e0f2fe', color: '#032567', text: 'Confirmado' },
      declined: { bg: '#f5f5f4', color: '#57534e', text: 'Rechazado' },
      canceled_by_passenger: { bg: '#f5f5f4', color: '#57534e', text: 'Cancelado' },
      expired: { bg: '#f5f5f4', color: '#57534e', text: 'Expirado' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '20px',
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

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Helper to check if trip is in the future
  const isTripUpcoming = (departureDate) => {
    return new Date(departureDate) > new Date();
  };

  // Helper to check if trip is in the past
  const isTripPast = (departureDate) => {
    return new Date(departureDate) < new Date();
  };

  // Categorize bookings
  const inProgressBookings = bookings.filter(b => 
    b && b.trip && b.status === 'accepted' && isTripUpcoming(b.trip.departureAt)
  );

  const reservedBookings = bookings.filter(b => 
    b && b.status === 'pending'
  );

  const completedBookings = bookings.filter(b => 
    b && b.trip && b.status === 'accepted' && isTripPast(b.trip.departureAt)
  );

  const canceledBookings = bookings.filter(b => 
    b && ['declined', 'canceled_by_passenger', 'expired'].includes(b.status)
  );

  // Debug logs
  console.log('[MyTrips] Total bookings:', bookings.length);
  console.log('[MyTrips] All bookings:', bookings);
  bookings.forEach((b, i) => {
    console.log(`[MyTrips] Booking ${i}:`, {
      id: b.id,
      status: b.status,
      hasTrip: !!b.trip,
      tripId: b.tripId
    });
  });
  console.log('[MyTrips] Reserved bookings (pending):', reservedBookings);
  console.log('[MyTrips] Reserved bookings length:', reservedBookings.length);
  console.log('[MyTrips] Active tab:', activeTab);

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
          alignItems: 'center',
          justifyContent: 'space-between'
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

          {/* Center: Navigation Links */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px'
          }}>
            <Link
              to="/my-trips"
              style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#032567',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif',
                borderBottom: '2px solid #032567'
              }}
            >
              Mis viajes
            </Link>
            
            <Link
              to="/reports"
              style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Reportes
            </Link>
            
            <Link
              to="/search"
              style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Buscar viajes
            </Link>
          </nav>

          {/* Right: Role Status + Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Role indicator */}
            <div style={{
              padding: '6px 16px',
              backgroundColor: '#f0f9ff',
              color: '#032567',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif'
            }}>
              Pasajero
            </div>

            {/* Profile button with menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  border: 'none',
                  color: 'white',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {getInitials(user?.firstName, user?.lastName)}
              </button>

              {showProfileMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 10
                    }}
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '55px',
                    backgroundColor: 'white',
                    border: '1px solid #e7e5e4',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '200px',
                    overflow: 'hidden',
                    zIndex: 20
                  }}>
                    <Link
                      to="/profile"
                      style={{
                        display: 'block',
                        padding: '12px 20px',
                        color: '#1c1917',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        fontFamily: 'Inter, sans-serif',
                        borderBottom: '1px solid #f5f5f4',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Mi perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        textAlign: 'left',
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
            <span style={{ color: '#dc2626', fontSize: '20px' }}>⚠️</span>
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
              {activeTab === 'in-progress' && 'No tienes viajes en progreso'}
              {activeTab === 'reserved' && 'No tienes viajes reservados'}
              {activeTab === 'completed' && 'No tienes viajes completados'}
              {activeTab === 'canceled' && 'No tienes viajes cancelados'}
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {activeTab === 'reserved' && 'Busca viajes disponibles y solicita tu primera reserva'}
              {activeTab !== 'reserved' && 'Los viajes aparecerán aquí cuando corresponda'}
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
                      {getStatusBadge(booking.status)}
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
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Conductor
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                    </p>
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

                {booking.status === 'accepted' && isTripUpcoming(booking.trip.departureAt) && (
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

                {booking.status === 'accepted' && isTripPast(booking.trip.departureAt) && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#1e40af',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Viaje completado
                    </p>
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
    </div>
  );
}

