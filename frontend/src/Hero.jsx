import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section style={{ 
      backgroundColor: 'white', 
      minHeight: 'clamp(400px, 80vh, 900px)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: 'clamp(32px, 8vw, 96px) clamp(16px, 4vw, 24px)',
        width: '100%'
      }}>
        {/* Main Title */}
        <h1 style={{ 
          fontSize: 'clamp(2rem, 8vw, 6rem)', 
          textAlign: 'left',
          fontWeight: 'normal', 
          color: '#1c1917',
          marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
          fontFamily: 'Inter, sans-serif',
          lineHeight: '1.1'
        }}>
          Pensado para quienes 
          <br/>se mueven en comunidad.
        </h1>

        {/* Subtitle */}
        <p style={{ 
          fontSize: 'clamp(1rem, 3vw, 2rem)', 
          color: '#57534e',
          marginBottom: 'clamp(24px, 4vw, 40px)',
          textAlign: 'left',
          fontFamily: 'Inter, sans-serif',
          lineHeight: '1.4'
        }}>
          Comodidad y rapidez al alcance tuyo
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: 'left' }}>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              padding: 'clamp(10px, 2vw, 16px) clamp(20px, 4vw, 32px)',
              fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: '#032567',
              borderRadius: '25px',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
          >
            Empieza ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
