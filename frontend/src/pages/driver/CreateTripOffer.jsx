import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createTripOffer } from '../../api/tripOffer';
import { getMyVehicle } from '../../api/vehicle';
import logo from '../../assets/images/UniSabana Logo.png';

export default function CreateTripOffer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      status: 'published',
    },
  });

  const totalSeats = watch('totalSeats');

  useEffect(() => {
    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVehicle = async () => {
    try {
      setLoadingVehicle(true);
      const vehicleData = await getMyVehicle();
      setVehicle(vehicleData);
    } catch (err) {
      console.error('[CreateTripOffer] Error loading vehicle:', err);
      setError('No tienes un vehículo registrado. Por favor, registra tu vehículo primero.');
    } finally {
      setLoadingVehicle(false);
    }
  };

  const onSubmit = async (data) => {
    if (!vehicle) {
      setError('No tienes un vehículo registrado');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare trip data
      const tripData = {
        vehicleId: vehicle.id,
        origin: {
          text: data.originText,
          geo: {
            lat: 0, // Default value
            lng: 0,
          },
        },
        destination: {
          text: data.destinationText,
          geo: {
            lat: 0, // Default value
            lng: 0,
          },
        },
        departureAt: new Date(data.departureAt).toISOString(),
        estimatedArrivalAt: new Date(data.estimatedArrivalAt).toISOString(),
        pricePerSeat: parseFloat(data.pricePerSeat),
        totalSeats: parseInt(data.totalSeats),
        status: data.status,
        notes: `${data.routeDescription || ''}${data.routeDescription && data.additionalNotes ? '\n\n' : ''}${data.additionalNotes || ''}`,
      };

      await createTripOffer(tripData);
      setSuccess('¡Viaje creado exitosamente! Redirigiendo...');
      setTimeout(() => {
        navigate('/my-trips');
      }, 1500);
    } catch (err) {
      console.error('[CreateTripOffer] Error:', err);
      
      if (err.code === 'overlapping_trip') {
        setError('Ya tienes otro viaje publicado en este horario');
      } else if (err.code === 'forbidden_owner') {
        setError('El vehículo no te pertenece');
      } else if (err.message?.includes('exceeds vehicle capacity')) {
        setError(`El número de asientos excede la capacidad del vehículo (${vehicle.capacity})`);
      } else if (err.message?.includes('must be in the future')) {
        setError('La fecha de salida debe ser en el futuro');
      } else if (err.message?.includes('must be after departureAt')) {
        setError('La hora de llegada debe ser después de la hora de salida');
      } else {
        setError(err.message || 'Error al crear el viaje');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingVehicle) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando información...</p>
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

  if (!vehicle) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        {/* Simple Navbar */}
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

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '16px',
            fontFamily: 'Inter, sans-serif'
          }}>
            No tienes un vehículo registrado
          </h2>
          <p style={{
            color: '#57534e',
            marginBottom: '32px',
            fontSize: '1.1rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            Para ofrecer viajes, primero debes registrar tu vehículo
          </p>
          <button
            onClick={() => navigate('/driver/my-vehicle')}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '1.2rem',
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
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Simple Navbar */}
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
            Ofrecer nuevo viaje
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
            <span style={{ color: '#dc2626', fontSize: '20px' }}>⚠️</span>
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

        {/* Vehicle Info Card */}
        <div style={{
          backgroundColor: '#f0f9ff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #e0f2fe'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '500',
            color: '#1c1917',
            marginBottom: '12px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Tu vehículo
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '3rem' }}>🚗</div>
            <div>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                {vehicle.brand} {vehicle.model}
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: '#57534e',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                Placa: {vehicle.plate} • Capacidad: {vehicle.capacity} pasajeros
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{
          backgroundColor: 'white',
          padding: '40px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Route Section */}
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Ruta del viaje
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    marginBottom: '8px',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Punto de origen
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Campus Universidad de La Sabana"
                    {...register('originText', {
                      required: 'El punto de origen es requerido',
                      minLength: {
                        value: 2,
                        message: 'Mínimo 2 caracteres',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.originText ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.originText && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.originText.message}
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
                    Punto de destino
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Centro Comercial Unicentro"
                    {...register('destinationText', {
                      required: 'El punto de destino es requerido',
                      minLength: {
                        value: 2,
                        message: 'Mínimo 2 caracteres',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.destinationText ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.destinationText && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.destinationText.message}
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
                    Descripción de la ruta (opcional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Ej: Salida por la puerta principal del campus, tomo la Autopista Norte hasta la salida de Unicentro. Recojo pasajeros en el parqueadero norte."
                    {...register('routeDescription', {
                      maxLength: {
                        value: 500,
                        message: 'Máximo 500 caracteres',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.routeDescription ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '16px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif',
                      resize: 'vertical'
                    }}
                  />
                  {errors.routeDescription && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.routeDescription.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div style={{
              paddingTop: '32px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Horario
              </h2>
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
                    Fecha y hora de salida
                  </label>
                  <input
                    type="datetime-local"
                    {...register('departureAt', {
                      required: 'La fecha de salida es requerida',
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.departureAt ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.departureAt && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.departureAt.message}
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
                    Fecha y hora estimada de llegada
                  </label>
                  <input
                    type="datetime-local"
                    {...register('estimatedArrivalAt', {
                      required: 'La fecha de llegada es requerida',
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.estimatedArrivalAt ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.estimatedArrivalAt && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.estimatedArrivalAt.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Price and Seats */}
            <div style={{
              paddingTop: '32px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Precio y Capacidad
              </h2>
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
                    Precio por asiento (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ej: 6000"
                    {...register('pricePerSeat', {
                      required: 'El precio es requerido',
                      min: {
                        value: 0,
                        message: 'El precio debe ser positivo',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.pricePerSeat ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.pricePerSeat && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.pricePerSeat.message}
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
                    Asientos disponibles
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={vehicle.capacity}
                    placeholder={`Máximo ${vehicle.capacity}`}
                    {...register('totalSeats', {
                      required: 'El número de asientos es requerido',
                      min: {
                        value: 1,
                        message: 'Mínimo 1 asiento',
                      },
                      max: {
                        value: vehicle.capacity,
                        message: `Máximo ${vehicle.capacity} asientos`,
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: errors.totalSeats ? '2px solid #dc2626' : '2px solid transparent',
                      borderRadius: '25px',
                      backgroundColor: '#d9d9d9',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  {errors.totalSeats && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.totalSeats.message}
                    </p>
                  )}
                  {totalSeats && (
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#57534e',
                      marginTop: '6px',
                      margin: '6px 0 0 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Capacidad del vehículo: {vehicle.capacity} pasajeros
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div style={{
              paddingTop: '32px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Notas adicionales (opcional)
              </label>
              <textarea
                rows="3"
                placeholder="Ej: Prefiero pasajeros sin equipaje pesado. No se permite fumar en el vehículo."
                {...register('additionalNotes', {
                  maxLength: {
                    value: 500,
                    message: 'Máximo 500 caracteres',
                  },
                })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: errors.additionalNotes ? '2px solid #dc2626' : '2px solid transparent',
                  borderRadius: '16px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  resize: 'vertical'
                }}
              />
              {errors.additionalNotes && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
                  {errors.additionalNotes.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div style={{
              paddingTop: '32px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Estado del viaje
              </label>
              <select
                {...register('status')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer'
                }}
              >
                <option value="published">Publicar ahora (visible para pasajeros)</option>
                <option value="draft">Guardar como borrador</option>
              </select>
            </div>

            {/* Actions */}
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
                {loading ? 'Creando...' : 'Crear viaje'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
