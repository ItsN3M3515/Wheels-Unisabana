import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyVehicle, deleteMyVehicle } from '../../api/vehicle';
import useAuthStore from '../../store/authStore';
// Components removed - using inline styles instead
import NotificationBell from '../../components/notifications/NotificationBell';
import logo from '../../assets/images/UniSabana Logo.png';

export default function MyVehicle() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Form no longer needed since we're not editing

  // Load vehicle data
  useEffect(() => {
    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      console.error('[MyVehicle] Logout error:', err);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const loadVehicle = async () => {
    try {
      setLoading(true);
      console.log('[MyVehicle] Loading vehicle...');
      const data = await getMyVehicle();
      console.log('[MyVehicle] Vehicle loaded:', data);
      setVehicle(data);
    } catch (err) {
      console.error('[MyVehicle] Error loading vehicle:', err);
      if (err.status === 404) {
        setError('No tienes un vehículo registrado');
      } else {
        setError('Error al cargar el vehículo: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit functionality removed - vehicles cannot be edited, only deleted

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError(null);

    try {
      await deleteMyVehicle();
      setSuccess('Vehículo eliminado correctamente');
      setShowDeleteModal(false);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('[MyVehicle] Delete error:', err);
      setError('Error al eliminar el vehículo: ' + (err.message || 'Error desconocido'));
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando vehículo...</p>
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

  if (!vehicle && !loading) {
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
              <div className="profile-menu-container" style={{ position: 'relative' }}>
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
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#1c1917',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          Mi perfil
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/driver/my-vehicle');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#1c1917',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          Mi vehículo
                        </button>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'background-color 0.2s',
                            borderTop: '1px solid #e7e5e4',
                            marginTop: '4px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '48px 24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e7e5e4',
            padding: '48px',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              No tienes un vehículo registrado
            </h2>
            <p style={{
              color: '#57534e',
              marginBottom: '24px',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif'
            }}>
              Registra tu vehículo para poder publicar viajes
            </p>
            <button
              onClick={() => navigate('/driver/register-vehicle')}
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
              Registrar vehículo
            </button>
          </div>
        </div>
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
            <div className="profile-menu-container" style={{ position: 'relative' }}>
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
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#1c1917',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Mi perfil
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/driver/my-vehicle');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#032567',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'background-color 0.2s',
                          fontWeight: '600',
                          backgroundColor: '#f0f9ff'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e0f2fe'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                      >
                        Mi vehículo
                      </button>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'background-color 0.2s',
                          borderTop: '1px solid #e7e5e4',
                          marginTop: '4px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
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
          Mi Vehículo
        </h1>

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

        {/* Vehicle Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e7e5e4',
          padding: '32px'
        }}>
          {/* Vehicle Photos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Vehicle Photo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Foto del vehículo
              </label>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                backgroundColor: '#f5f5f4',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {vehicle?.vehiclePhotoUrl ? (
                    <img 
                      src={vehicle.vehiclePhotoUrl} 
                      alt="Vehicle" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#78716c',
                        fontFamily: 'Inter, sans-serif'
                      }}>Sin foto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SOAT Photo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Foto del SOAT
              </label>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                backgroundColor: '#f5f5f4',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {vehicle?.soatPhotoUrl ? (
                    <img 
                      src={vehicle.soatPhotoUrl} 
                      alt="SOAT" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#78716c',
                        fontFamily: 'Inter, sans-serif'
                      }}>Sin foto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information - Read Only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Plate */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Placa del vehículo
              </label>
              <input
                type="text"
                value={vehicle?.plate || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#57534e',
                  backgroundColor: '#f5f5f4',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Brand and Model */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#57534e',
                  marginBottom: '6px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Marca
                </label>
                <input
                  type="text"
                  value={vehicle?.brand || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: '1rem',
                    color: '#57534e',
                    backgroundColor: '#f5f5f4',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#57534e',
                  marginBottom: '6px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Modelo
                </label>
                <input
                  type="text"
                  value={vehicle?.model || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: '1rem',
                    color: '#57534e',
                    backgroundColor: '#f5f5f4',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#57534e',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Capacidad de pasajeros
              </label>
              <input
                type="text"
                value={`${vehicle?.capacity || 0} pasajero${vehicle?.capacity > 1 ? 's' : ''}`}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '1rem',
                  color: '#57534e',
                  backgroundColor: '#f5f5f4',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'not-allowed'
                }}
              />
            </div>

              {/* Metadata */}
              {vehicle && (
                <div style={{
                  borderTop: '1px solid #e7e5e4',
                  paddingTop: '20px',
                  marginTop: '20px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#57534e',
                        margin: '0 0 4px 0',
                        fontFamily: 'Inter, sans-serif'
                      }}>Registrado el:</p>
                      <p style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {new Date(vehicle.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#57534e',
                        margin: '0 0 4px 0',
                        fontFamily: 'Inter, sans-serif'
                      }}>Última actualización:</p>
                      <p style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {new Date(vehicle.updatedAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action button */}
              <div style={{
                paddingTop: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#dc2626',
                    backgroundColor: 'white',
                    border: '2px solid #dc2626',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                  }}
                >
                  Eliminar vehículo
                </button>
              </div>
            </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleteLoading) {
                setShowDeleteModal(false);
              }
            }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: '500px',
              width: '100%',
              padding: '24px'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  flex: 1
                }}>
                  Eliminar vehículo
                </h3>
                {!deleteLoading && (
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#57534e',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s',
                      fontSize: '20px',
                      lineHeight: '1'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Content */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{
                  color: '#57534e',
                  fontSize: '1rem',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.5'
                }}>
                  ¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer. No podrás publicar viajes hasta que registres otro vehículo.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#032567',
                    backgroundColor: 'white',
                    border: '2px solid #032567',
                    borderRadius: '25px',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    opacity: deleteLoading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!deleteLoading) e.target.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!deleteLoading) e.target.style.backgroundColor = 'white';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: 'white',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    opacity: deleteLoading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!deleteLoading) e.target.style.backgroundColor = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    if (!deleteLoading) e.target.style.backgroundColor = '#dc2626';
                  }}
                >
                  {deleteLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    'Sí, eliminar vehículo'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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

