import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toggleRole } from '../../api/user';
import { registerVehicle } from '../../api/vehicle';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/images/UniSabana Logo.png';

export default function BecomeDriver() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [checkingVehicle, setCheckingVehicle] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [alreadyHasVehicle, setAlreadyHasVehicle] = useState(false);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [soatPhoto, setSoatPhoto] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [soatPreview, setSoatPreview] = useState(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const acceptTerms = watch('acceptTerms');

  // Check if user already has a vehicle
  useEffect(() => {
    const checkExistingVehicle = async () => {
      try {
        setCheckingVehicle(true);
        
        // Toggle to driver temporarily to check vehicle status
        const updatedUser = await toggleRole();
        
        if (updatedUser.driver?.hasVehicle) {
          setAlreadyHasVehicle(true);
          setShowForm(false);
          setUser(updatedUser);
        } else {
          // Toggle back to passenger to show the form
          await toggleRole();
          setAlreadyHasVehicle(false);
          setShowForm(true);
        }
      } catch (err) {
        console.error('[BecomeDriver] Error checking vehicle:', err);
        setShowForm(true);
      } finally {
        setCheckingVehicle(false);
      }
    };

    checkExistingVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSimpleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      setSuccess('¡Bienvenido de vuelta como conductor! Redirigiendo...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('[BecomeDriver] Error:', err);
      setError('Error al cambiar de rol: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVehiclePhoto(file);
      const url = URL.createObjectURL(file);
      setVehiclePreview(url);
    }
  };

  const handleSoatPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSoatPhoto(file);
      const url = URL.createObjectURL(file);
      setSoatPreview(url);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Toggle role to driver
      const updatedUser = await toggleRole();
      setUser(updatedUser);
      
      // Step 2: Register vehicle
      await registerVehicle({
        licensePlate: data.licensePlate.toUpperCase(),
        brand: data.brand,
        model: data.model,
        capacity: parseInt(data.capacity),
        vehiclePhoto,
        soatPhoto,
      });
      
      setSuccess('¡Registro completado! Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('[BecomeDriver] Error:', err);
      
      if (err.code === 'duplicate_license_plate') {
        setError('Esta placa ya está registrada');
      } else if (err.code === 'invalid_file_type') {
        setError('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP');
      } else if (err.code === 'payload_too_large') {
        setError('Una o más imágenes son muy grandes. El tamaño máximo es 5MB por archivo');
      } else {
        setError(err.message || 'Error al registrarte como conductor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Simple Navbar - Only Logo and Text */}
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
          alignItems: 'center'
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
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Back button and Title */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#57534e',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '16px',
              padding: '8px 0',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1c1917'}
            onMouseLeave={(e) => e.target.style.color = '#57534e'}
          >
            <span style={{ fontSize: '1.2rem' }}>←</span>
            <span>Volver</span>
          </button>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            fontFamily: 'Inter, sans-serif'
          }}>
            Registrarme como Conductor
          </h1>
        </div>

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
            <span style={{ color: '#16a34a', fontSize: '20px' }}>✓</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0 }}>
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Loading while checking vehicle */}
        {checkingVehicle && (
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
        )}

        {/* If user already has vehicle */}
        {!checkingVehicle && alreadyHasVehicle && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif'
            }}>
              ¡Bienvenido de vuelta!
            </h2>
            <p style={{
              color: '#57534e',
              marginBottom: '32px',
              fontSize: '1.1rem',
              fontFamily: 'Inter, sans-serif'
            }}>
              Ya tienes un vehículo registrado. ¿Deseas continuar como conductor?
            </p>
            <button
              onClick={handleSimpleToggle}
              disabled={loading}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '1.2rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: loading ? '#94a3b8' : '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#1A6EFF';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#032567';
              }}
            >
              {loading ? 'Procesando...' : 'Continuar como conductor'}
            </button>
          </div>
        )}

        {/* Registration Form */}
        {!checkingVehicle && showForm && !alreadyHasVehicle && (
          <form onSubmit={handleSubmit(onSubmit)} style={{
            backgroundColor: 'white',
            padding: '40px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Info Section */}
              <div>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: 'normal',
                  color: '#1c1917',
                  marginBottom: '16px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Información del vehículo
                </h2>
                <p style={{
                  color: '#57534e',
                  fontSize: '1rem',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Completa la información de tu vehículo para comenzar a ofrecer viajes
                </p>
              </div>

              {/* License Plate */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Placa del vehículo
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  {...register('licensePlate', {
                    required: 'La placa es requerida',
                    pattern: {
                      value: /^[A-Z]{3}[0-9]{3}$/i,
                      message: 'Formato inválido (ej: ABC123)',
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.licensePlate ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase'
                  }}
                />
                {errors.licensePlate && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.licensePlate.message}
                  </p>
                )}
              </div>

              {/* Brand and Model */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    marginBottom: '8px',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Chevrolet"
                    {...register('brand', {
                      required: 'La marca es requerida',
                      minLength: {
                        value: 2,
                        message: 'Mínimo 2 caracteres',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.brand ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.brand && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.brand.message}
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
                    Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Spark"
                    {...register('model', {
                      required: 'El modelo es requerido',
                      minLength: {
                        value: 2,
                        message: 'Mínimo 2 caracteres',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.model ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.model && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Capacidad (asientos disponibles)
                </label>
                <input
                  type="number"
                  placeholder="4"
                  {...register('capacity', {
                    required: 'La capacidad es requerida',
                    min: {
                      value: 1,
                      message: 'Mínimo 1 asiento',
                    },
                    max: {
                      value: 6,
                      message: 'Máximo 6 asientos',
                    },
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: errors.capacity ? '2px solid #dc2626' : '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                {errors.capacity && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.capacity.message}
                  </p>
                )}
              </div>

              {/* Vehicle Photo */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Foto del vehículo
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleVehiclePhotoChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer'
                  }}
                />
                {vehiclePreview && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={vehiclePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '12px',
                        border: '1px solid #e7e5e4'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SOAT Photo */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Foto del SOAT
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSoatPhotoChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer'
                  }}
                />
                {soatPreview && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={soatPreview}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '12px',
                        border: '1px solid #e7e5e4'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div style={{
                backgroundColor: '#f0f9ff',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e0f2fe'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <input
                    type="checkbox"
                    {...register('acceptTerms', {
                      required: 'Debes aceptar los términos',
                    })}
                    style={{
                      marginTop: '4px',
                      accentColor: '#032567',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '0.95rem',
                    color: '#1c1917',
                    lineHeight: '1.5'
                  }}>
                    Acepto los términos y condiciones para ser conductor en Wheels UniSabana. Me comprometo a ofrecer viajes seguros y respetar a todos los pasajeros.
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px', margin: '8px 0 0 0' }}>
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1.2rem',
                    fontWeight: 'normal',
                    color: '#57534e',
                    backgroundColor: 'white',
                    border: '2px solid #d9d9d9',
                    borderRadius: '25px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.backgroundColor = '#f5f5f4';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.backgroundColor = 'white';
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading || !vehiclePhoto || !soatPhoto || !acceptTerms}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1.2rem',
                    fontWeight: 'normal',
                    color: 'white',
                    backgroundColor: (loading || !vehiclePhoto || !soatPhoto || !acceptTerms) ? '#94a3b8' : '#032567',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: (loading || !vehiclePhoto || !soatPhoto || !acceptTerms) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && vehiclePhoto && soatPhoto && acceptTerms) {
                      e.target.style.backgroundColor = '#1A6EFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && vehiclePhoto && soatPhoto && acceptTerms) {
                      e.target.style.backgroundColor = '#032567';
                    }
                  }}
                >
                  {loading ? 'Registrando...' : 'Registrar vehículo'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
