import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Navbar from '../components/common/Navbar';
import { getMyReportsReceived } from '../api/user';

/**
 * Reports Page
 * Shows information about user reports and reporting functionality
 */
const CATEGORY_LABELS = {
  abuse: 'Abuso',
  harassment: 'Acoso',
  fraud: 'Fraude',
  no_show: 'No se presentó',
  unsafe_behavior: 'Comportamiento inseguro',
  other: 'Otro'
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto'
};

export default function Reports() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [reportsReceived, setReportsReceived] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const isDriver = user?.role === 'driver';

  // Fetch reports received
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const response = await getMyReportsReceived();
        setReportsReceived(response.reports || []);
      } catch (err) {
        console.error('Error fetching reports received:', err);
      } finally {
        setLoadingReports(false);
      }
    };

    if (user) {
      fetchReports();
    }
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar activeLink="reports" />

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '24px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Reportes
        </h1>

        {/* Reports Received Section */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e7e5e4',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '24px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Reportes recibidos
          </h2>

          {loadingReports ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#57534e',
              fontFamily: 'Inter, sans-serif'
            }}>
              Cargando reportes...
            </div>
          ) : reportsReceived.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#57534e',
              fontFamily: 'Inter, sans-serif'
            }}>
              No has recibido ningún reporte.
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {reportsReceived.map((report) => {
                const reportDate = new Date(report.createdAt);
                const formattedDate = reportDate.toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={report.id}
                    style={{
                      border: '1px solid #e7e5e4',
                      borderRadius: '12px',
                      padding: '24px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <p style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#1c1917',
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Reportado por: {report.reporter.firstName} {report.reporter.lastName}
                          </p>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'normal',
                            fontFamily: 'Inter, sans-serif',
                            backgroundColor: report.status === 'pending' ? '#e0f2fe' : '#f5f5f4',
                            color: report.status === 'pending' ? '#032567' : '#57534e'
                          }}>
                            {STATUS_LABELS[report.status] || report.status}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#57534e',
                          margin: 0,
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {report.reporter.corporateEmail}
                        </p>
                      </div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#78716c',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {formattedDate}
                      </p>
                    </div>

                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e7e5e4'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'normal',
                          fontFamily: 'Inter, sans-serif',
                          backgroundColor: '#e0f2fe',
                          color: '#032567'
                        }}>
                          {CATEGORY_LABELS[report.category] || report.category}
                        </span>
                      </div>

                      {report.trip && (
                        <div style={{
                          marginBottom: '12px',
                          padding: '12px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e7e5e4'
                        }}>
                          <p style={{
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#1c1917',
                            margin: '0 0 4px 0',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Viaje relacionado:
                          </p>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#57534e',
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {report.trip.origin} → {report.trip.destination}
                          </p>
                          {report.trip.departureAt && (
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#78716c',
                              margin: '4px 0 0 0',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {new Date(report.trip.departureAt).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {report.reason && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e7e5e4'
                        }}>
                          <p style={{
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#1c1917',
                            margin: '0 0 8px 0',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Motivo adicional:
                          </p>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#57534e',
                            margin: 0,
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: '1.5'
                          }}>
                            {report.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Information Section */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e7e5e4',
          borderRadius: '16px',
          padding: '40px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px 0'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Sistema de Reportes
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#57534e',
              marginBottom: '32px',
              fontFamily: 'Inter, sans-serif',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Puedes reportar reseñas inapropiadas cuando veas el perfil de un conductor. 
              Los reportes ayudan a mantener la comunidad segura y respetuosa.
            </p>

            <div style={{
              backgroundColor: '#f5f5f4',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '32px',
              textAlign: 'left',
              maxWidth: '600px',
              margin: '32px auto 0'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '16px',
                fontFamily: 'Inter, sans-serif'
              }}>
                ¿Cómo reportar una reseña?
              </h3>
              <ol style={{
                fontSize: '1rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.8',
                paddingLeft: '24px'
              }}>
                <li>Visita el perfil de un conductor</li>
                <li>Encuentra la reseña que deseas reportar</li>
                <li>Haz clic en el botón "Reportar"</li>
                <li>Selecciona la categoría del reporte</li>
                <li>Opcionalmente, agrega un motivo adicional</li>
                <li>Envía el reporte</li>
              </ol>
            </div>

            <div style={{
              marginTop: '40px',
              padding: '24px',
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <p style={{
                fontSize: '1rem',
                color: '#1e40af',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                <strong>Nota:</strong> Los reportes son revisados por nuestro equipo de moderación. 
                Solo puedes reportar una reseña una vez.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

