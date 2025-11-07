import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { login } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/images/UniSabana Logo.png';

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const user = await login(data.corporateEmail, data.password);
      setUser(user);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Handle specific error codes and show errors on specific fields
      if (err.code === 'invalid_credentials') {
        // Show error on both fields for invalid credentials
        setFieldError('corporateEmail', {
          type: 'manual',
          message: 'Correo o contraseña incorrectos'
        });
        setFieldError('password', {
          type: 'manual',
          message: 'Correo o contraseña incorrectos'
        });
      } else if (err.code === 'invalid_schema') {
        setError('Por favor verifica los datos ingresados');
      } else if (err.code === 'network_error') {
        setError(err.message);
      } else {
        setError('Ocurrió un error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 2vw, 12px)',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              flex: '1',
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
            <span style={{
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

          {/* Right: Register link */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 8px)',
            fontSize: 'clamp(0.8rem, 2vw, 1rem)',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0
          }}>
            <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>¿No tienes cuenta?</span>
            <Link
              to="/register"
              style={{
                color: '#032567',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Regístrate
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ 
        minHeight: 'calc(100vh - clamp(64px, 15vw, 88px))', 
        backgroundColor: 'white',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          {/* Page Title */}
          <div style={{ marginBottom: 'clamp(20px, 4vw, 32px)' }}>
            <h1 style={{ 
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', 
              fontWeight: 'normal', 
              color: '#1c1917',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif'
            }}>
              Iniciar sesión
            </h1>
          </div>

        {/* Alert */}
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{
          backgroundColor: 'white',
          border: '1px solid #e7e5e4',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(24px, 6vw, 80px) clamp(20px, 4vw, 60px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            {/* Email */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '500', 
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Correo corporativo
              </label>
              <input
                type="email"
                placeholder="tu.nombre@unisabana.edu.co"
                {...register('corporateEmail', {
                  required: 'El correo es requerido',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@unisabana\.edu\.co$/,
                    message: 'Debe ser un correo @unisabana.edu.co',
                  },
                })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: errors.corporateEmail ? '2px solid #dc2626' : '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              {errors.corporateEmail && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                  {errors.corporateEmail.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '1.1rem', 
                fontWeight: '500', 
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'Mínimo 8 caracteres',
                  },
                })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: errors.password ? '2px solid #dc2626' : '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              {errors.password && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right' }}>
              <Link 
                to="/forgot-password"
                style={{
                  fontSize: '0.9rem',
                  color: '#032567',
                  textDecoration: 'none',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Action buttons */}
            <div style={{ 
              display: 'flex', 
              gap: 'clamp(8px, 2vw, 16px)', 
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <Link
                to="/"
                style={{
                  padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)',
                  fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  textDecoration: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  minWidth: 'fit-content'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                }}
              >
                Volver
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)',
                  fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: loading ? '#94a3b8' : '#032567',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  minWidth: 'fit-content'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#1A6EFF';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#032567';
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </form>

        </div>
      </div>
    </>
  );
}
