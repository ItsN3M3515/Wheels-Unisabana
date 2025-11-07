import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { searchTrips } from '../api/trip';
import { getMyTripOffers } from '../api/tripOffer';
import logo from '../assets/images/UniSabana Logo.png';
import NotificationBell from '../components/notifications/NotificationBell';

/**
 * Dashboard - Main landing page for authenticated users
 * Shows different content based on role (passenger vs driver)
 */
export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ items: [], total: 0 });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Search filters (for passengers)
  const [searchFilters, setSearchFilters] = useState({
    qOrigin: '',
    qDestination: '',
  });

  const isDriver = user?.role === 'driver';

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isDriver) {
        // Load driver's trip offers (limit to 6 most recent)
        const result = await getMyTripOffers({ page: 1, pageSize: 6 });
        setData(result);
      } else {
        // Load available trips for passengers (limit to 6 most recent)
        const filters = {
          page: 1,
          pageSize: 6,
        };
        
        // Add search filters if provided
        if (searchFilters.qOrigin?.trim()) {
          filters.qOrigin = searchFilters.qOrigin.trim();
        }
        if (searchFilters.qDestination?.trim()) {
          filters.qDestination = searchFilters.qDestination.trim();
        }
        
        const result = await searchTrips(filters);
        setData(result);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, searchFilters.qOrigin, searchFilters.qDestination]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('[Dashboard] Logout error:', err);
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

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: '#f5f5f4', color: '#57534e', text: 'Borrador' },
      published: { bg: '#ecfdf5', color: '#047857', text: 'Publicado' },
      canceled: { bg: '#fef2f2', color: '#dc2626', text: 'Cancelado' },
      completed: { bg: '#eff6ff', color: '#1d4ed8', text: 'Completado' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500',
        backgroundColor: badge.bg,
        color: badge.color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {badge.text}
      </span>
    );
  };

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
          padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Left: Logo + Text */}
          <Link 
            to="/dashboard" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 2vw, 12px)',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              flex: '0 1 auto',
              minWidth: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src={logo} 
              alt="Wheels UniSabana Logo" 
              style={{ 
                height: 'clamp(2.5rem, 8vw, 4rem)', 
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <span className="dashboard-logo-text" style={{
              fontSize: 'clamp(14px, 3.5vw, 20px)',
              fontWeight: 'normal',
              color: '#1c1917',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Wheels UniSabana
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="dashboard-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 3vw, 32px)'
          }}>
            <Link
              to="/my-trips"
              style={{
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Mis viajes
            </Link>
            
            <Link
              to="/reports"
              className="hide-on-mobile"
              style={{
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Reportes
            </Link>
            
            {/* Only show "Buscar" for passengers */}
            {!isDriver && (
              <Link
                to="/search"
                style={{
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  fontWeight: '500',
                  color: '#1c1917',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.color = '#032567'}
                onMouseLeave={(e) => e.target.style.color = '#1c1917'}
              >
                Buscar
              </Link>
            )}
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
              backgroundColor: isDriver ? '#032567' : 'white',
              color: isDriver ? 'white' : '#032567',
              border: '2px solid #032567',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif'
            }}>
              {isDriver ? 'Conductor' : 'Pasajero'}
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

                    {isDriver && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/driver/my-vehicle');
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
                        Mi vehículo
                      </button>
                    )}

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
        {/* Hero / Welcome Section */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif'
          }}>
            ¡Hola de nuevo, {user?.firstName}!
          </h1>
          <p style={{
            fontSize: '1.8rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif'
          }}>
            {isDriver ? 'Gestiona tus viajes y ofertas' : 'Encuentra el viaje perfecto para ti'}
          </p>
        </div>

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
            {/* Driver Content */}
            {isDriver && (
              <>
                {/* CTA Buttons */}
                <div style={{ 
                  marginBottom: '40px',
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => navigate('/driver/create-trip')}
                    style={{
                      padding: '0.75rem 2rem',
                      fontSize: '1.2rem',
                      fontWeight: 'normal',
                      color: 'white',
                      backgroundColor: '#032567',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1A6EFF';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#032567';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>+</span>
                    Ofrecer nuevo viaje
                  </button>
                </div>

                {/* Section title */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'normal',
                    color: '#1c1917',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Tus viajes recientes
                  </h2>
                  {data.items.length > 0 && (
                    <button
                      onClick={() => navigate('/my-trips')}
                      style={{
                        padding: '0.4rem 1rem',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#032567',
                        backgroundColor: 'transparent',
                        border: '2px solid #032567',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Ver todos
                    </button>
                  )}
                </div>

                {/* Empty state */}
                {data.items.length === 0 ? (
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
                      No tienes viajes aún
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      color: '#57534e',
                      marginBottom: '24px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Comienza a ofrecer viajes para conectar con otros estudiantes
                    </p>
                    <button
                      onClick={() => navigate('/driver/create-trip')}
                      style={{
                        padding: '0.5rem 1.5rem',
                        fontSize: '1.1rem',
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
                      Ofrecer mi primer viaje
                    </button>
                  </div>
                ) : (
                  /* Trip Cards Grid */
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '24px'
                  }}>
                    {data.items.map((trip) => (
                      <div
                        key={trip.id}
                        onClick={() => navigate(`/driver/trips/${trip.id}`)}
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e7e5e4',
                          borderRadius: '16px',
                          padding: '24px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
                        {/* Header: Status + Price */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          {getStatusBadge(trip.status)}
                          <span style={{
                            fontSize: '1.3rem',
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

                        {/* Footer: Seats + Notes */}
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
                          <span>{trip.totalSeats} asientos</span>
                          {trip.notes && (
                            <span style={{
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {trip.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </>
        )}
      </div>
    </div>
  );
}
