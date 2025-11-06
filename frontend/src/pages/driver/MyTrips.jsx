import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getMyTripOffers, cancelTripOffer } from '../../api/tripOffer';
import NotificationBell from '../../components/notifications/NotificationBell';
import logo from '../../assets/images/UniSabana Logo.png';

export default function MyTrips() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tripToCancel, setTripToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      // Only send valid backend statuses to the API
      if (statusFilter !== 'all' && statusFilter !== 'in_progress') {
        filters.status = statusFilter;
      }
      
      const data = await getMyTripOffers(filters);
      setTrips(data.items || []);
    } catch (err) {
      console.error('[MyTrips] Error loading trips:', err);
      setError('Error al cargar los viajes: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!tripToCancel) return;

    setCancelLoading(true);
    try {
      await cancelTripOffer(tripToCancel.id);
      setSuccess('Viaje cancelado exitosamente');
      setTripToCancel(null);
      loadTrips();
    } catch (err) {
      setError('Error al cancelar el viaje: ' + (err.message || 'Error desconocido'));
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

  const getStatusBadge = (status, trip) => {
    // Check if trip is currently in progress
    if (trip && isTripInProgress(trip)) {
      return (
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '500',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontFamily: 'Inter, sans-serif'
        }}>
          En Progreso
        </span>
      );
    }

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Check if a trip is currently in progress (within time window)
  const isTripInProgress = (trip) => {
    console.log('Checking if trip is in progress:', {
      tripId: trip.id,
      status: trip.status,
      departureAt: trip.departureAt
    });
    
    if (trip.status !== 'published') {
      console.log('Trip not published, status:', trip.status);
      return false;
    }
    
    const now = new Date();
    const departureTime = new Date(trip.departureAt);
    
    // Trip is in progress if:
    // 1. It's within 30 minutes before departure time (pickup window)
    // 2. It's within 2 hours after departure time (travel window)
    const pickupWindowStart = new Date(departureTime.getTime() - 30 * 60 * 1000); // 30 min before
    const travelWindowEnd = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after
    
    const isInProgress = now >= pickupWindowStart && now <= travelWindowEnd;
    
    console.log('Trip progress check:', {
      now: now.toISOString(),
      departureTime: departureTime.toISOString(),
      pickupWindowStart: pickupWindowStart.toISOString(),
      travelWindowEnd: travelWindowEnd.toISOString(),
      isInProgress
    });
    
    return isInProgress;
  };

  const filteredTrips = statusFilter === 'all' 
    ? trips 
    : statusFilter === 'in_progress'
    ? trips.filter(t => t.status === 'published') // TEMPORARY: Show all published trips for testing
    : trips.filter(t => t.status === statusFilter);

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
          </nav>

          {/* Right: Notifications + Role Status + Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Notifications */}
            {user && (
              <NotificationBell />
            )}

            {/* Role indicator */}
            <div style={{
              padding: '6px 16px',
              backgroundColor: '#032567',
              color: 'white',
              border: '2px solid #032567',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif'
            }}>
              Conductor
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
        {/* Title and CTA */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '32px'
        }}>
          <div>
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
              Gestiona tus ofertas de viaje
            </p>
          </div>

          <button
            onClick={() => navigate('/driver/create-trip')}
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
            Ofrecer nuevo viaje
          </button>
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

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid #e7e5e4',
          paddingBottom: '0'
        }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'published', label: 'Publicados' },
            { id: 'in_progress', label: 'En Progreso' },
            { id: 'completed', label: 'Completados' },
            { id: 'canceled', label: 'Cancelados' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: statusFilter === filter.id ? '500' : 'normal',
                color: statusFilter === filter.id ? '#032567' : '#57534e',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: statusFilter === filter.id ? '2px solid #032567' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== filter.id) e.target.style.color = '#1c1917';
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== filter.id) e.target.style.color = '#57534e';
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
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
              No tienes viajes
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Ofrece tu primer viaje y comienza a compartir trayectos
            </p>
            <button
              onClick={() => navigate('/driver/create-trip')}
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
              Ofrecer viaje
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
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
                  alignItems: 'start'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Status Badge */}
                    <div style={{ marginBottom: '16px' }}>
                      {getStatusBadge(trip.status, trip)}
                    </div>

                    {/* Route */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        marginBottom: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {trip.origin.text}
                      </div>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {trip.destination.text}
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '20px',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Salida
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {formatDate(trip.departureAt)}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Precio
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {formatPrice(trip.pricePerSeat)}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Asientos
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {trip.totalSeats} disponibles
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: '#57534e',
                          margin: '0 0 4px 0',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Vehículo
                        </p>
                        <p style={{
                          fontWeight: '500',
                          color: '#1c1917',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          ID: {trip.vehicleId.slice(-6)}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {trip.notes && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#fafafa',
                        borderRadius: '12px'
                      }}>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#57534e',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          <span style={{ fontWeight: '500' }}>Notas:</span> {trip.notes}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginLeft: '24px'
                  }}>
                    
                    <button
                      onClick={() => navigate(`/driver/trips/${trip.id}`)}
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
                        fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Ver detalles
                    </button>
                    {trip.status === 'published' && (
                      <button
                        onClick={() => setTripToCancel(trip)}
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.95rem',
                          fontWeight: 'normal',
                          color: '#dc2626',
                          backgroundColor: 'white',
                          border: '2px solid #dc2626',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {tripToCancel && (
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
          onClick={() => !cancelLoading && setTripToCancel(null)}
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
              ¿Cancelar viaje?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6'
            }}>
              ¿Estás seguro de que quieres cancelar el viaje de <strong>{tripToCancel.origin.text}</strong> a <strong>{tripToCancel.destination.text}</strong>? Esta acción no se puede deshacer y notificará a todos los pasajeros que tengan reservas.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setTripToCancel(null)}
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
                onClick={handleCancelTrip}
                disabled={cancelLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: cancelLoading ? '#94a3b8' : '#dc2626',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  if (!cancelLoading) e.target.style.backgroundColor = '#dc2626';
                }}
              >
                {cancelLoading ? 'Cancelando...' : 'Sí, cancelar viaje'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
