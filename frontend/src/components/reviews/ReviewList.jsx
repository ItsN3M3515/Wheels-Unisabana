import { useState, useEffect, useCallback } from 'react';
import { getDriverReviews, getDriverRatings, adminSetVisibility } from '../../api/review';
import { reportReview } from '../../api/review';
import useAuthStore from '../../store/authStore';
import ReportReviewModal from './ReportReviewModal';
import { Star } from 'lucide-react';
import Loading from '../common/Loading';
import Empty from '../common/Empty';

/**
 * Review List Component
 * Displays reviews for a driver with ratings summary
 */
export default function ReviewList({ driverId }) {
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReportModalFor, setShowReportModalFor] = useState(null);
  const [reportedCooldowns, setReportedCooldowns] = useState({});

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDriverReviews(driverId, { page, pageSize: 10 });
      setReviews(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [driverId, page]);

  const fetchRatings = useCallback(async () => {
    try {
      const data = await getDriverRatings(driverId);
      setRatings(data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }, [driverId]);

  useEffect(() => {
    fetchReviews();
    fetchRatings();
  }, [driverId, page, fetchReviews, fetchRatings]);

  // Refresh ratings when window regains focus (e.g., after creating a review in another tab/page)
  useEffect(() => {
    const handleFocus = () => {
      fetchRatings();
      fetchReviews();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [driverId, fetchRatings, fetchReviews]);

  // Refresh ratings periodically to catch new reviews (every 30 seconds)
  useEffect(() => {
    // Only set up interval if component is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchRatings();
        fetchReviews();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [driverId, fetchRatings, fetchReviews]);

  if (loading && reviews.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Ratings Summary */}
      {ratings && (
        <div className="bg-white border border-[#e7e5e4] rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-normal text-neutral-900">
              {ratings.avgRating.toFixed(1)}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-5 h-5 ${
                      value <= Math.round(ratings.avgRating)
                        ? 'fill-[#032567] text-[#032567]'
                        : 'fill-none text-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-600">
                {ratings.count} {ratings.count === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>
          </div>

          {/* Histogram */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 w-6">{star}</span>
                <Star className="w-4 h-4 fill-[#032567] text-[#032567]" />
                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#032567] transition-all"
                    style={{
                      width: `${ratings.count > 0 ? (ratings.histogram[star] / ratings.count) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-500 w-8">
                  {ratings.histogram[star] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-normal text-neutral-900 mb-4">Reseñas</h3>
        {reviews.length === 0 ? (
          <Empty message="Este conductor aún no tiene reseñas" />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-[#e7e5e4] rounded-lg p-4"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`w-4 h-4 ${
                          value <= review.rating
                            ? 'fill-[#032567] text-[#032567]'
                            : 'fill-none text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-normal text-neutral-900">
                      {review.author}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(review.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {review.text && (
                  <p className="text-sm text-neutral-700 mb-2">{review.text}</p>
                )}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[#e0f2fe] text-[#032567] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {/* Report button for authenticated users */}
                  {useAuthStore.getState().isAuthenticated && (
                    <>
                      <button
                        onClick={() => setShowReportModalFor(review.id)}
                        disabled={!!reportedCooldowns[review.id]}
                        className="px-3 py-1 text-sm border rounded hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {reportedCooldowns[review.id] ? 'Reportado' : 'Reportar'}
                      </button>
                    </>
                  )}

                  {/* Admin controls */}
                  {useAuthStore.getState().user?.role === 'admin' && (
                    <button
                      onClick={async () => {
                        try {
                          const action = review.status === 'hidden' ? 'unhide' : 'hide';
                          await adminSetVisibility(review.id, action, 'Moderación desde UI');
                          // update local list
                          setReviews((rs) => rs.map(r => r.id === review.id ? { ...r, status: action === 'hide' ? 'hidden' : 'visible' } : r));
                          // refresh aggregates
                          fetchRatings();
                        } catch (e) {
                          console.error('Error changing visibility', e);
                        }
                      }}
                      className="px-3 py-1 text-sm border rounded hover:bg-neutral-50"
                    >
                      {review.status === 'hidden' ? 'Mostrar' : 'Ocultar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm border border-[#e7e5e4] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Anterior
            </button>
            <span className="text-sm text-neutral-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm border border-[#e7e5e4] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
      {showReportModalFor && (
        <ReportReviewModal
          reviewId={showReportModalFor}
          onClose={() => setShowReportModalFor(null)}
          onReported={() => {
            // set a simple 30-second client-side cooldown for the reported review
            setReportedCooldowns((s) => ({ ...s, [showReportModalFor]: true }));
            setTimeout(() => {
              setReportedCooldowns((s) => {
                const copy = { ...s };
                delete copy[showReportModalFor];
                return copy;
              });
            }, 30_000);
          }}
        />
      )}
    </div>
  );
}

