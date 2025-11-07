import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createReview, getMyReviewForTrip, editMyReview, deleteMyReview } from '../../api/review';
import ReviewForm from '../../components/reviews/ReviewForm';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/common/Navbar';

/**
 * Create/Edit Review Page
 * For passengers to review completed trips
 */
export default function CreateReview() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchReview();
  }, [tripId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const review = await getMyReviewForTrip(tripId);
      setExistingReview(review);
    } catch (error) {
      if (error.status === 404) {
        // No review exists yet, that's OK
        setExistingReview(null);
      } else {
        console.error('Error fetching review:', error);
        setError('Error al cargar la reseña');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (reviewData) => {
    try {
      setSubmitting(true);
      setError(null);
      if (existingReview) {
        await editMyReview(tripId, existingReview.id, reviewData);
        setSuccess('Reseña actualizada exitosamente');
        setTimeout(() => navigate('/my-trips'), 1500);
      } else {
        await createReview(tripId, reviewData);
        setSuccess('Reseña creada exitosamente');
        setTimeout(() => navigate('/my-trips'), 1500);
      }
    } catch (error) {
      console.error('Error saving review:', error);
      setError(error.message || 'Error al guardar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    
    try {
      setDeleting(true);
      setError(null);
      await deleteMyReview(tripId, existingReview.id);
      setSuccess('Reseña eliminada exitosamente');
      setTimeout(() => navigate('/my-trips'), 1500);
    } catch (error) {
      console.error('Error deleting review:', error);
      setError(error.message || 'Error al eliminar la reseña');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };


  if (loading) {
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
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando...</p>
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar activeLink="my-trips" />

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
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
              <p style={{ color: '#991b1b', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
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
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {success}
              </p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
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

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif'
          }}>
            {existingReview ? 'Editar reseña' : 'Escribir reseña'}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif'
          }}>
            {existingReview 
              ? 'Puedes editar tu reseña dentro de las primeras 24 horas'
              : 'Comparte tu experiencia sobre este viaje'
            }
          </p>
        </div>

        {/* Review Form Card */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e7e5e4',
          borderRadius: '16px',
          padding: '40px'
        }}>
          <ReviewForm
            tripId={tripId}
            existingReview={existingReview}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/my-trips')}
            loading={submitting}
          />

          {existingReview && !existingReview.lockedAt && (
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e7e5e4'
            }}>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: submitting ? '#94a3b8' : '#dc2626',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.target.style.backgroundColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.target.style.backgroundColor = '#dc2626';
                }}
              >
                Eliminar reseña
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              ¿Eliminar reseña?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6'
            }}>
              Esta acción no se puede deshacer. Tu reseña será eliminada permanentemente.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#57534e',
                  backgroundColor: 'white',
                  border: '2px solid #d9d9d9',
                  borderRadius: '25px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!deleting) e.target.style.backgroundColor = '#f5f5f4';
                }}
                onMouseLeave={(e) => {
                  if (!deleting) e.target.style.backgroundColor = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: 'white',
                  backgroundColor: deleting ? '#94a3b8' : '#dc2626',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!deleting) e.target.style.backgroundColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  if (!deleting) e.target.style.backgroundColor = '#dc2626';
                }}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
