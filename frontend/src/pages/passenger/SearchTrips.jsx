import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { searchTrips } from '../../api/trip';
import { createBooking } from '../../api/booking';
import logo from '../../assets/images/UniSabana Logo.png';
import Toast from '../../components/common/Toast';

export default function SearchTrips() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState(null);
  
  // Search filters
  const [filters, setFilters] = useState({
    qOrigin: '',
    qDestination: '',
  });

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: 1,
        pageSize: 20,
      };
      
      if (filters.qOrigin?.trim()) {
        params.qOrigin = filters.qOrigin.trim();
      }
      if (filters.qDestination?.trim()) {
        params.qDestination = filters.qDestination.trim();
      }

      const result = await searchTrips(params);
      setTrips(result.items || []);
    } catch (err) {
      console.error('[SearchTrips] Error loading trips:', err);
      setError(err.message || 'Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTrips();
  };

  const clearFilters = () => {
    setFilters({ qOrigin: '', qDestination: '' });
    setTimeout(() => loadTrips(), 100);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('[SearchTrips] Logout error:', err);
    }
  };

  const handleRequestBooking = () => {
    setShowBookingModal(true);
    setBookingSeats(1);
    setBookingNote('');
    setBookingSuccess(false);
  };

  const handleSubmitBooking = async () => {
    if (!selectedTrip) return;

    setBookingLoading(true);
    setError(null);

    try {
      await createBooking({
        tripId: selectedTrip.id,
        seats: bookingSeats,
        note: bookingNote || undefined,
      });

      setBookingSuccess(true);
      setToast({
        message: 'Solicitud de reserva enviada exitosamente',
        type: 'success'
      });
      
      setTimeout(() => {
        setShowBookingModal(false);
        setSelectedTrip(null);
        setBookingSuccess(false);
        setBookingSeats(1);
        setBookingNote('');
      }, 1500);
    } catch (err) {
      console.error('[SearchTrips] Booking error:', err);
      setToast({
        message: err.message || 'Error al solicitar la reserva',
        type: 'error'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

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
          {/* Left: Logo + Text */}
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
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
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
                color: '#032567',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif',
                borderBottom: '2px solid #032567'
              }}
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
            <div className="profile-menu-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  height: '3rem',
                  width: '3rem',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </button>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '8px',
                  width: '220px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid #e7e5e4',
                  padding: '8px 0',
                  zIndex: 20
                }}>
                  {/* User info */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e7e5e4'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#57534e',
                      margin: '4px 0 0 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {user?.corporateEmail}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '4px 0' }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        color: '#1c1917',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Mi perfil
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/search');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        color: '#1c1917',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Buscar viajes
                    </button>
                  </div>

                  {/* Logout */}
                  <div style={{
                    borderTop: '1px solid #e7e5e4',
                    paddingTop: '4px'
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
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
        {/* Page Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '32px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Buscar viajes
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{
          backgroundColor: '#f0f9ff',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          border: '1px solid #e0f2fe'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Origen
              </label>
              <input
                type="text"
                placeholder="¿Desde dónde?"
                value={filters.qOrigin}
                onChange={(e) => setFilters({ ...filters, qOrigin: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Destino
              </label>
              <input
                type="text"
                placeholder="¿Hacia dónde?"
                value={filters.qDestination}
                onChange={(e) => setFilters({ ...filters, qDestination: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: loading ? '#94a3b8' : '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#1A6EFF';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#032567';
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>

            {(filters.qOrigin || filters.qDestination) && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Limpiar
              </button>
            )}
          </div>
        </form>

        {/* Error Alert */}
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
              <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>
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

        {/* Loading State */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 0'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '3px solid #e7e5e4',
              borderTop: '3px solid #032567',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                fontFamily: 'Inter, sans-serif'
              }}>
                {trips.length} {trips.length === 1 ? 'viaje disponible' : 'viajes disponibles'}
              </h2>
            </div>

            {/* Empty State */}
            {trips.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 24px',
                backgroundColor: '#fafafa',
                borderRadius: '16px',
                border: '2px dashed #e7e5e4'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  No se encontraron viajes
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#57534e',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Intenta con otros filtros de búsqueda
                </p>
              </div>
            ) : (
              /* Trip Cards Grid */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px'
              }}>
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e7e5e4',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Header: Price */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#032567',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {formatPrice(trip.pricePerSeat)}
                      </span>
                    </div>

                    {/* Route */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        marginBottom: '4px',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#16a34a' }}>●</span>
                        {trip.origin.text}
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#dc2626' }}>●</span>
                        {trip.destination.text}
                      </div>
                    </div>

                    {/* Date */}
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#57534e',
                      marginBottom: '16px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatDate(trip.departureAt)}
                    </p>

                    {/* Footer: Seats + Driver */}
                    <div style={{
                      paddingTop: '16px',
                      borderTop: '1px solid #e7e5e4',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      <span>💺 {trip.totalSeats} asientos</span>
                      <span>👤 {trip.driver?.firstName}</span>
                    </div>

                    {/* Notes preview */}
                    {trip.notes && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f5f5f4',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#57534e',
                        fontFamily: 'Inter, sans-serif',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        💬 {trip.notes.substring(0, 80)}{trip.notes.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
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
          onClick={() => setSelectedTrip(null)}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'normal',
                color: '#1c1917',
                fontFamily: 'Inter, sans-serif',
                margin: 0
              }}>
                Detalles del viaje
              </h2>
              <button
                onClick={() => setSelectedTrip(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#57534e',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#1c1917'}
                onMouseLeave={(e) => e.target.style.color = '#57534e'}
              >
                ×
              </button>
            </div>

            {/* Price Badge */}
            <div style={{
              backgroundColor: '#032567',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '0.9rem',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif',
                opacity: 0.9
              }}>
                Precio por asiento
              </p>
              <p style={{
                fontSize: '2rem',
                fontWeight: '600',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatPrice(selectedTrip.pricePerSeat)}
              </p>
            </div>

            {/* Route Section */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Ruta
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#16a34a', fontSize: '1.5rem' }}>●</span>
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
                      {selectedTrip.origin.text}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#dc2626', fontSize: '1.5rem' }}>●</span>
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
                      {selectedTrip.destination.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Description */}
            {selectedTrip.notes && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#fffbeb',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Descripción de la ruta
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#57534e',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTrip.notes}
                </p>
              </div>
            )}

            {/* Schedule Section */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Horario
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    {formatDate(selectedTrip.departureAt)}
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
                    {formatDate(selectedTrip.estimatedArrivalAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '2rem' }}>💺</span>
              <div>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Asientos disponibles
                </p>
                <p style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedTrip.totalSeats} {selectedTrip.totalSeats === 1 ? 'asiento' : 'asientos'}
                </p>
              </div>
            </div>

            {/* Driver Info */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Conductor
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedTrip.driver?.firstName?.[0]}{selectedTrip.driver?.lastName?.[0]}
                </div>
                <div>
                  <p style={{
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {selectedTrip.driver?.firstName} {selectedTrip.driver?.lastName}
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#57534e',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {selectedTrip.vehicle?.brand} {selectedTrip.vehicle?.model}
                    {selectedTrip.vehicle?.plate && ` • ${selectedTrip.vehicle.plate}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedTrip(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cerrar
              </button>
              
              {/* Only show booking button if user is not the driver */}
              {selectedTrip.driver?.id !== user?.id && (
                <button
                  onClick={handleRequestBooking}
                  style={{
                    flex: 1,
                    padding: '12px',
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
                  Reservar asiento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedTrip && !bookingSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px'
          }}
          onClick={() => setShowBookingModal(false)}
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
            {/* Header */}
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Solicitar reserva
            </h2>
            
            <p style={{
              fontSize: '0.95rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {selectedTrip.origin.text} → {selectedTrip.destination.text}
            </p>

            {/* Seats selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Número de asientos
              </label>
              <input
                type="number"
                min="1"
                max={selectedTrip.totalSeats}
                value={bookingSeats}
                onChange={(e) => setBookingSeats(Math.min(Math.max(1, parseInt(e.target.value) || 1), selectedTrip.totalSeats))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <p style={{
                fontSize: '0.85rem',
                color: '#57534e',
                marginTop: '6px',
                margin: '6px 0 0 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Disponibles: {selectedTrip.totalSeats} • Precio por asiento: {formatPrice(selectedTrip.pricePerSeat)}
              </p>
            </div>

            {/* Total price */}
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#57534e',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Total a pagar
              </p>
              <p style={{
                fontSize: '1.8rem',
                fontWeight: '600',
                color: '#032567',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatPrice(selectedTrip.pricePerSeat * bookingSeats)}
              </p>
            </div>

            {/* Note */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Mensaje para el conductor (opcional)
              </label>
              <textarea
                rows="3"
                placeholder="Ej: Llevaré una maleta pequeña"
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '16px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowBookingModal(false)}
                disabled={bookingLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!bookingLoading) e.target.style.backgroundColor = '#f5f5f4';
                }}
                onMouseLeave={(e) => {
                  if (!bookingLoading) e.target.style.backgroundColor = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={bookingLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: bookingLoading ? '#94a3b8' : '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!bookingLoading) e.target.style.backgroundColor = '#1A6EFF';
                }}
                onMouseLeave={(e) => {
                  if (!bookingLoading) e.target.style.backgroundColor = '#032567';
                }}
              >
                {bookingLoading ? 'Enviando...' : 'Enviar solicitud'}
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
