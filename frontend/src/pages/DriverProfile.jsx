import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getDriverReviews, getDriverRatings } from '../api/review';
import ReviewList from '../components/reviews/ReviewList';
import logo from '../assets/images/UniSabana Logo.png';
import Loading from '../components/common/Loading';

/**
 * Driver Profile Page
 * Public page to view a driver's profile and reviews
 */
export default function DriverProfile() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isDriver = user?.role === 'driver';

  useEffect(() => {
    loadDriverRatings();
  }, [driverId]);

  const loadDriverRatings = async () => {
    try {
      setLoading(true);
      const data = await getDriverRatings(driverId);
      setRatings(data);
    } catch (error) {
      console.error('Error loading driver ratings:', error);
    } finally {
      setLoading(false);
    }
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

  const handleLogout = async () => {
    try {
      const { logout } = await import('../api/auth');
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  if (loading) {
    return <Loading />;
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
            
            {!isDriver && (
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
            )}
          </nav>

          {/* Right: Role Status + Profile */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
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
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '24px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Perfil del Conductor
        </h1>

        {/* Reviews Section */}
        <div style={{
          marginTop: '32px'
        }}>
          <ReviewList driverId={driverId} />
        </div>
      </div>
    </div>
  );
}

