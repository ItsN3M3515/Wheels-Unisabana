import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { searchTrips } from '../../api/trip';
import { createBooking } from '../../api/booking';
import Toast from '../../components/common/Toast';
import Navbar from '../../components/common/Navbar';

export default function SearchTrips() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState(null);
  
  // Search filters
  const [filters, setFilters] = useState({
    qOrigin: '',
    qDestination: '',
    fromDate: '',
    toDate: '',
    fromTime: '',
    toTime: '',
    minAvailableSeats: '',
    minPrice: '',
    maxPrice: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: 1,
        pageSize: 20,
      };
      
      if (filters.qOrigin?.trim()) {
        params.qOrigin = filters.qOrigin.trim();
      }
      if (filters.qDestination?.trim()) {
        params.qDestination = filters.qDestination.trim();
      }
      
      // Date filters
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        params.fromDate = fromDate.toISOString();
      }
      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        params.toDate = toDate.toISOString();
      }
      
      // Time filters
      if (filters.fromTime) {
        params.fromTime = filters.fromTime;
      }
      if (filters.toTime) {
        params.toTime = filters.toTime;
      }
      
      // Availability filter
      if (filters.minAvailableSeats) {
        params.minAvailableSeats = parseInt(filters.minAvailableSeats);
      }
      
      // Price filters
      if (filters.minPrice) {
        params.minPrice = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice) {
        params.maxPrice = parseFloat(filters.maxPrice);
      }

      const result = await searchTrips(params);
      setTrips(result.items || []);
    } catch (err) {
      console.error('[SearchTrips] Error loading trips:', err);
      setError(err.message || 'Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTrips();
  };

  const clearFilters = () => {
    setFilters({
      qOrigin: '',
      qDestination: '',
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: '',
      minAvailableSeats: '',
      minPrice: '',
      maxPrice: '',
    });
    setTimeout(() => loadTrips(), 100);
  };
  
  const hasActiveFilters = () => {
    return !!(
      filters.qOrigin?.trim() ||
      filters.qDestination?.trim() ||
      filters.fromDate ||
      filters.toDate ||
      filters.fromTime ||
      filters.toTime ||
      filters.minAvailableSeats ||
      filters.minPrice ||
      filters.maxPrice
    );
  };


  const handleRequestBooking = () => {
    setShowBookingModal(true);
    setBookingSeats(1);
    setBookingNote('');
    setBookingSuccess(false);
  };

  const handleSubmitBooking = async () => {
    if (!selectedTrip) return;

    setBookingLoading(true);
    setError(null);

    try {
      await createBooking({
        tripId: selectedTrip.id,
        seats: bookingSeats,
        note: bookingNote || undefined,
      });

      setBookingSuccess(true);
      setToast({
        message: 'Solicitud de reserva enviada exitosamente',
        type: 'success'
      });
      
      setTimeout(() => {
        setShowBookingModal(false);
        setSelectedTrip(null);
        setBookingSuccess(false);
        setBookingSeats(1);
        setBookingNote('');
      }, 1500);
    } catch (err) {
      console.error('[SearchTrips] Booking error:', err);
      setToast({
        message: err.message || 'Error al solicitar la reserva',
        type: 'error'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar activeLink="search" />

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Page Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '32px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Buscar viajes
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{
          backgroundColor: '#f0f9ff',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          border: '1px solid #e0f2fe'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Origen
              </label>
              <input
                type="text"
                placeholder="¿Desde dónde?"
                value={filters.qOrigin}
                onChange={(e) => setFilters({ ...filters, qOrigin: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Destino
              </label>
              <input
                type="text"
                placeholder="¿Hacia dónde?"
                value={filters.qDestination}
                onChange={(e) => setFilters({ ...filters, qDestination: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
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
              {loading ? 'Buscando...' : 'Buscar'}
            </button>

            {(filters.qOrigin || filters.qDestination) && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Limpiar
              </button>
            )}
          </div>
          
          {/* Filters Toggle */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                fontWeight: 'normal',
                color: '#032567',
                backgroundColor: 'white',
                border: '2px solid #032567',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f9ff';
                e.target.style.borderColor = '#1A6EFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#032567';
              }}
            >
              {showFilters ? '▼' : '▶'} Filtros avanzados
            </button>
            
            {hasActiveFilters() && (
              <span style={{
                fontSize: '0.85rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif'
              }}>
                Filtros activos
              </span>
            )}
          </div>
        </form>
        
        {/* Advanced Filters Panel */}
        {showFilters && (
          <div style={{
            backgroundColor: '#fafafa',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '32px',
            border: '1px solid #e7e5e4'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {/* Date Filters */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
              
              {/* Time Filters */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Hora desde
                </label>
                <input
                  type="time"
                  value={filters.fromTime}
                  onChange={(e) => setFilters({ ...filters, fromTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Hora hasta
                </label>
                <input
                  type="time"
                  value={filters.toTime}
                  onChange={(e) => setFilters({ ...filters, toTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
              
              {/* Availability Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Mínimo de asientos disponibles
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 2"
                  value={filters.minAvailableSeats}
                  onChange={(e) => setFilters({ ...filters, minAvailableSeats: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
              
              {/* Price Filters */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Precio mínimo (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ej: 5000"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Precio máximo (COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ej: 20000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '2px solid #e7e5e4',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#032567'}
                  onBlur={(e) => e.target.style.borderColor = '#e7e5e4'}
                />
              </div>
            </div>
            
            {/* Apply Filters Button */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Limpiar filtros
              </button>
              <button
                type="button"
                onClick={loadTrips}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: '#032567',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
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

        {/* Loading State */}
        {loading ? (
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
        ) : (
          <>
            {/* Results Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1c1917',
                fontFamily: 'Inter, sans-serif'
              }}>
                {trips.length} {trips.length === 1 ? 'viaje disponible' : 'viajes disponibles'}
              </h2>
            </div>

            {/* Empty State */}
            {trips.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 24px',
                backgroundColor: '#fafafa',
                borderRadius: '16px',
                border: '2px dashed #e7e5e4'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  No se encontraron viajes
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#57534e',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Intenta con otros filtros de búsqueda
                </p>
              </div>
            ) : (
              /* Trip Cards Grid */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px'
              }}>
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e7e5e4',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Header: Price */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#032567',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {formatPrice(trip.pricePerSeat)}
                      </span>
                    </div>

                    {/* Route */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        marginBottom: '4px',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#16a34a' }}>●</span>
                        {trip.origin.text}
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: '#1c1917',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#dc2626' }}>●</span>
                        {trip.destination.text}
                      </div>
                    </div>

                    {/* Date */}
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#57534e',
                      marginBottom: '16px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {formatDate(trip.departureAt)}
                    </p>

                    {/* Footer: Seats + Driver */}
                    <div style={{
                      paddingTop: '16px',
                      borderTop: '1px solid #e7e5e4',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                      color: '#57534e',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      <span>{trip.totalSeats} asientos</span>
                      <span>{trip.driver?.firstName}</span>
                    </div>

                    {/* Notes preview */}
                    {trip.notes && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f5f5f4',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#57534e',
                        fontFamily: 'Inter, sans-serif',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {trip.notes.substring(0, 80)}{trip.notes.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={() => setSelectedTrip(null)}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'normal',
                color: '#1c1917',
                fontFamily: 'Inter, sans-serif',
                margin: 0
              }}>
                Detalles del viaje
              </h2>
              <button
                onClick={() => setSelectedTrip(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#57534e',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#1c1917'}
                onMouseLeave={(e) => e.target.style.color = '#57534e'}
              >
                ×
              </button>
            </div>

            {/* Price Badge */}
            <div style={{
              backgroundColor: '#032567',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '0.9rem',
                margin: '0 0 4px 0',
                fontFamily: 'Inter, sans-serif',
                opacity: 0.9
              }}>
                Precio por asiento
              </p>
              <p style={{
                fontSize: '2rem',
                fontWeight: '600',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatPrice(selectedTrip.pricePerSeat)}
              </p>
            </div>

            {/* Route Section */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Ruta
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#16a34a', fontSize: '1.5rem' }}>●</span>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Origen
                    </p>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {selectedTrip.origin.text}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <span style={{ color: '#dc2626', fontSize: '1.5rem' }}>●</span>
                  <div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Destino
                    </p>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {selectedTrip.destination.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Description */}
            {selectedTrip.notes && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#fffbeb',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Descripción de la ruta
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#57534e',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTrip.notes}
                </p>
              </div>
            )}

            {/* Schedule Section */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Horario
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Salida
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatDate(selectedTrip.departureAt)}
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Llegada estimada
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {formatDate(selectedTrip.estimatedArrivalAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <div>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Asientos disponibles
                </p>
                <p style={{
                  fontSize: '1.2rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedTrip.totalSeats} {selectedTrip.totalSeats === 1 ? 'asiento' : 'asientos'}
                </p>
              </div>
            </div>

            {/* Driver Info */}
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Conductor
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedTrip.driver?.firstName?.[0]}{selectedTrip.driver?.lastName?.[0]}
                </div>
                <div>
                  <p style={{
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {selectedTrip.driver?.firstName} {selectedTrip.driver?.lastName}
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#57534e',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {selectedTrip.vehicle?.brand} {selectedTrip.vehicle?.model}
                    {selectedTrip.vehicle?.plate && ` • ${selectedTrip.vehicle.plate}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedTrip(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cerrar
              </button>
              
              {/* Only show booking button if user is not the driver */}
              {selectedTrip.driver?.id !== user?.id && (
                <button
                  onClick={handleRequestBooking}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '1rem',
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
                  Reservar asiento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Booking Modal */}
      {showBookingModal && selectedTrip && !bookingSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px'
          }}
          onClick={() => setShowBookingModal(false)}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'normal',
                color: '#1c1917',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                Solicitar Reserva
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Booking Form */}
            <div style={{ padding: '24px' }}>
              {selectedTrip && (
                <>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'normal',
                    color: '#1c1917',
                    marginBottom: '24px',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Solicitar reserva
                  </h3>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#57534e',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Ruta: {selectedTrip.origin.text} → {selectedTrip.destination.text}
                    </p>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#57534e',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Fecha: {new Date(selectedTrip.departureAt).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#57534e',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Precio por asiento: {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(selectedTrip.pricePerSeat)}
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      color: '#1c1917',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Asientos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedTrip.availableSeats || selectedTrip.totalSeats}
                      value={bookingSeats}
                      onChange={(e) => setBookingSeats(parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '1rem',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      color: '#1c1917',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Nota (opcional)
                    </label>
                    <textarea
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="Mensaje para el conductor..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '1rem',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {bookingSuccess && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      color: '#15803d',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      ¡Reserva enviada exitosamente!
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedTrip(null);
                        setBookingSeats(1);
                        setBookingNote('');
                        setBookingSuccess(false);
                      }}
                      style={{
                        padding: '10px 20px',
                        fontSize: '1rem',
                        fontWeight: 'normal',
                        color: '#57534e',
                        backgroundColor: 'white',
                        border: '2px solid #d9d9d9',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmitBooking}
                      disabled={bookingLoading || bookingSeats < 1}
                      style={{
                        padding: '10px 20px',
                        fontSize: '1rem',
                        fontWeight: 'normal',
                        color: 'white',
                        backgroundColor: bookingLoading || bookingSeats < 1 ? '#94a3b8' : '#032567',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: bookingLoading || bookingSeats < 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!bookingLoading && bookingSeats >= 1) {
                          e.target.style.backgroundColor = '#1A6EFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!bookingLoading && bookingSeats >= 1) {
                          e.target.style.backgroundColor = '#032567';
                        }
                      }}
                    >
                      {bookingLoading ? 'Enviando...' : 'Enviar reserva'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
