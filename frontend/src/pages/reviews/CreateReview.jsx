import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createReview, getMyReviewForTrip, editMyReview, deleteMyReview } from '../../api/review';
import ReviewForm from '../../components/reviews/ReviewForm';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import logo from '../../assets/images/UniSabana Logo.png';
import { Link } from 'react-router-dom';

/**
 * Create/Edit Review Page
 * For passengers to review completed trips
 */
export default function CreateReview() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        alert('Error al cargar la reseña');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (reviewData) => {
    try {
      setSubmitting(true);
      if (existingReview) {
        await editMyReview(tripId, existingReview.id, reviewData);
        alert('Reseña actualizada exitosamente');
      } else {
        await createReview(tripId, reviewData);
        alert('Reseña creada exitosamente');
      }
      navigate('/my-trips');
    } catch (error) {
      console.error('Error saving review:', error);
      alert(error.message || 'Error al guardar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    
    try {
      setDeleting(true);
      await deleteMyReview(tripId, existingReview.id);
      alert('Reseña eliminada exitosamente');
      navigate('/my-trips');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(error.message || 'Error al eliminar la reseña');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
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
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link 
            to="/my-trips" 
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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-neutral-900 mb-2">
            {existingReview ? 'Editar reseña' : 'Escribir reseña'}
          </h1>
          <p className="text-neutral-600">
            {existingReview 
              ? 'Puedes editar tu reseña dentro de las primeras 24 horas'
              : 'Comparte tu experiencia sobre este viaje'
            }
          </p>
        </div>

        <div className="bg-white border border-[#e7e5e4] rounded-lg p-6">
          <ReviewForm
            tripId={tripId}
            existingReview={existingReview}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/my-trips')}
            loading={submitting}
          />

          {existingReview && !existingReview.lockedAt && (
            <div className="mt-6 pt-6 border-t border-[#e7e5e4]">
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                disabled={submitting}
                fullWidth
              >
                Eliminar reseña
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="¿Eliminar reseña?"
        message="Esta acción no se puede deshacer. Tu reseña será eliminada permanentemente."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

