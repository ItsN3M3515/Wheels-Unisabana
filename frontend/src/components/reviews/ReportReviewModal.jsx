import { useState } from 'react';
import { reportReview } from '../../api/review';

const CATEGORIES = [
  { value: 'spam', label: 'Spam / Publicidad' },
  { value: 'abuse', label: 'Lenguaje abusivo / Discriminación' },
  { value: 'other', label: 'Otro' },
];

export default function ReportReviewModal({ reviewId, onClose, onReported }) {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await reportReview(reviewId, { category, reason });
      onReported && onReported();
      onClose && onClose();
    } catch (err) {
      setError(err?.message || 'Error al enviar reporte');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Reportar reseña</h3>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-neutral-700 mb-1">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <label className="block text-sm text-neutral-700 mb-1">Motivo (opcional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mb-4 p-2 border rounded h-24"
            placeholder="Agrega detalles opcionales para ayudar a los moderadores"
          />

          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border rounded text-sm"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-[#032567] text-white rounded text-sm disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
