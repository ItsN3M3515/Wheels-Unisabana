import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { register as registerUser } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/images/UniSabana Logo.png';

export default function Register() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'passenger', // Default role
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      // Format phone to E.164 format (add +57 prefix for Colombia)
      const formattedPhone = data.phone.startsWith('+') 
        ? data.phone 
        : `+57${data.phone}`;

      const user = await registerUser({
        corporateEmail: data.corporateEmail,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: formattedPhone,
        universityId: data.universityId,
      });

      setUser(user);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Handle specific error codes and show errors on specific fields
      if (err.code === 'duplicate_email') {
        setFieldError('corporateEmail', {
          type: 'manual',
          message: 'Este correo ya está registrado. Intenta iniciar sesión.'
        });
      } else if (err.code === 'duplicate_universityId') {
        setFieldError('universityId', {
          type: 'manual',
          message: 'Este ID universitario ya está registrado.'
        });
      } else if (err.code === 'duplicate_phone') {
        setFieldError('phone', {
          type: 'manual',
          message: 'Este número de teléfono ya está registrado.'
        });
      } else if (err.code === 'invalid_schema') {
        // Show generic error banner for schema validation
        setError('Por favor verifica que todos los campos estén correctos.');
      } else if (err.code === 'network_error') {
        setError(err.message);
      } else {
        setError(err.message || 'Ocurrió un error al registrarte. Intenta nuevamente.');
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

          {/* Right: Login link */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 8px)',
            fontSize: 'clamp(0.8rem, 2vw, 1rem)',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0
          }}>
            <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>¿Ya tienes cuenta?</span>
            <Link
              to="/login"
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
              Inicia sesión
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
              Registro de pasajero
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
          padding: 'clamp(24px, 5vw, 40px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 24px)' }}>
            {/* Hidden role field - always passenger by default */}
            <input type="hidden" value="passenger" {...register('role')} />

            {/* Name fields */}
            <div className="grid-2cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Juan"
                  {...register('firstName', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'Mínimo 2 caracteres',
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.firstName ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                {errors.firstName && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Apellido
                </label>
                <input
                  type="text"
                  placeholder="Pérez"
                  {...register('lastName', {
                    required: 'El apellido es requerido',
                    minLength: {
                      value: 2,
                      message: 'Mínimo 2 caracteres',
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.lastName ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                {errors.lastName && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

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

            {/* University ID and Phone */}
            <div className="grid-2cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  ID Universitario
                </label>
                <input
                  type="text"
                  placeholder="0000123456"
                  {...register('universityId', {
                    required: 'El ID universitario es requerido',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'Debe ser un ID de 10 dígitos',
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.universityId ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                {errors.universityId && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.universityId.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="3001234567"
                  {...register('phone', {
                    required: 'El teléfono es requerido',
                    pattern: {
                      value: /^3\d{9}$/,
                      message: 'Debe ser un número colombiano de 10 dígitos',
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.phone ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                {errors.phone && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password fields */}
            <div className="grid-2cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Debe incluir mayúscula, minúscula y número',
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

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '1.1rem', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: 'Confirma tu contraseña',
                    validate: (value) =>
                      value === password || 'Las contraseñas no coinciden',
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.confirmPassword ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                {errors.confirmPassword && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
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
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </form>

        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 640px) {
          .grid-2cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
