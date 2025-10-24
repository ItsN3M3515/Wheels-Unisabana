import { Link } from 'react-router-dom';
import logo from './assets/images/UniSabana Logo.png';

export default function Navbar() {
  return (
    <header style={{
      width: '100%',
      borderBottom: '1px solid #e7e5e4',
      backgroundColor: 'white'
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
          to="/" 
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
          {/* Logo UniSabana */}
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

        {/* Right: Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Link
            to="/login"
            style={{
              padding: '8px 20px',
              fontSize: '1.2rem',
              fontWeight: '500',
              color: '#44403c',
              textDecoration: 'none',
              transition: 'color 0.2s'
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
              fontSize: '1.2rem',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: '#032567',
              borderRadius: '25px',
              textDecoration: 'none',
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
    </header>
  );
}
