import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../notifications/NotificationBell';
import logo from '../../assets/images/UniSabana Logo.png';

/**
 * Navbar Component - Consistent navigation bar for all authenticated pages
 * @param {Object} props
 * @param {string} props.activeLink - The currently active navigation link ('my-trips', 'reports', 'search', etc.)
 * @param {boolean} props.showSearch - Whether to show the "Buscar viajes" link (default: true for passengers)
 */
export default function Navbar({ activeLink = null, showSearch = null }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const isDriver = user?.role === 'driver';
  
  // Auto-detect active link from location if not provided
  const currentActiveLink = activeLink || (() => {
    const path = location.pathname;
    if (path.includes('/my-trips')) return 'my-trips';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/search')) return 'search';
    return null;
  })();

  // Determine if search link should be shown
  const shouldShowSearch = showSearch !== null ? showSearch : !isDriver;

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
      console.error('[Navbar] Logout error:', err);
      navigate('/login');
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getLinkStyle = (linkName) => {
    const isActive = currentActiveLink === linkName;
    return {
      fontSize: '1rem',
      fontWeight: isActive ? '500' : '500',
      color: isActive ? '#032567' : '#1c1917',
      textDecoration: 'none',
      transition: 'color 0.2s',
      fontFamily: 'Inter, sans-serif',
      borderBottom: isActive ? '2px solid #032567' : '2px solid transparent',
      paddingBottom: '2px'
    };
  };

  return (
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
            style={getLinkStyle('my-trips')}
            onMouseEnter={(e) => {
              if (currentActiveLink !== 'my-trips') e.target.style.color = '#032567';
            }}
            onMouseLeave={(e) => {
              if (currentActiveLink !== 'my-trips') e.target.style.color = '#1c1917';
            }}
          >
            Mis viajes
          </Link>
          
          <Link
            to="/reports"
            style={getLinkStyle('reports')}
            onMouseEnter={(e) => {
              if (currentActiveLink !== 'reports') e.target.style.color = '#032567';
            }}
            onMouseLeave={(e) => {
              if (currentActiveLink !== 'reports') e.target.style.color = '#1c1917';
            }}
          >
            Reportes
          </Link>
          
          {shouldShowSearch && (
            <Link
              to="/search"
              style={getLinkStyle('search')}
              onMouseEnter={(e) => {
                if (currentActiveLink !== 'search') e.target.style.color = '#032567';
              }}
              onMouseLeave={(e) => {
                if (currentActiveLink !== 'search') e.target.style.color = '#1c1917';
              }}
            >
              Buscar viajes
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
              {getInitials(user?.firstName, user?.lastName)}
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
  );
}

