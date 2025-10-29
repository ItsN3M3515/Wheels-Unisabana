import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from './assets/images/UniSabana Logo.png';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      width: '100%',
      borderBottom: '1px solid #e7e5e4',
      backgroundColor: 'white'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Logo + Text */}
        <Link 
          to="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            flex: '1'
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
              objectFit: 'contain'
            }}
          />
          
          <span style={{
            fontSize: 'clamp(14px, 4vw, 20px)',
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

        {/* Desktop: Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
        className="desktop-nav"
        >
          <Link
            to="/login"
            style={{
              padding: '8px 20px',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              fontWeight: '500',
              color: '#44403c',
              textDecoration: 'none',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1c1917'}
            onMouseLeave={(e) => e.target.style.color = '#44403c'}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            style={{
              padding: '8px 20px',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: '#032567',
              borderRadius: '25px',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
          >
            Regístrate
          </Link>
        </div>

        {/* Mobile: Hamburger Menu */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#1c1917'
          }}
          aria-label="Abrir menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu"
          style={{
            display: 'none',
            padding: '16px',
            borderTop: '1px solid #e7e5e4',
            backgroundColor: 'white'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '12px 16px',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#44403c',
                textDecoration: 'none',
                textAlign: 'center',
                borderRadius: '12px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '12px 16px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: '#032567',
                borderRadius: '25px',
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
            >
              Regístrate
            </Link>
          </div>
        </div>
      )}

      <style>{`
        /* Desktop: Show nav, hide hamburger */
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }

        /* Mobile: Hide nav, show hamburger */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: ${mobileMenuOpen ? 'block' : 'none'} !important;
          }
        }
      `}</style>
    </header>
  );
}
