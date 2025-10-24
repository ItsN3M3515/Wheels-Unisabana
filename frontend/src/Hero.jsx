import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section style={{ backgroundColor: 'white', minHeight: '80vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        {/* Main Title */}
        <h1 style={{ 
          fontSize: '6rem', 
          textAlign: 'left',
          fontWeight: 'normal', 
          color: '#1c1917',
          marginBottom: '1rem',
          fontFamily: 'Inter, sans-serif'
        }}>
          Pensado para quienes 
        <br/>se mueven en comunidad.
        </h1>

        {/* Subtitle */}
        <p style={{ 
          fontSize: '2rem', 
          color: '#57534e',
          marginBottom: '40px',
          textAlign: 'left',
        }}>
          Comodidad y rapidez al alcance tuyo
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: 'left' }}>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              padding: '0.4% 0.8%',
              fontSize: '1.5rem',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: '#032567',
              borderRadius: '25px',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
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
