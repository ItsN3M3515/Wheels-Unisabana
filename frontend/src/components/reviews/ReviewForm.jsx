import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { Star } from 'lucide-react';

/**
 * Review Form Component
 * For creating and editing reviews
 */
export default function ReviewForm({ 
  tripId, 
  existingReview = null, 
  onSubmit, 
  onCancel,
  loading = false 
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState(existingReview?.text || '');
  const [tags, setTags] = useState(existingReview?.tags || []);
  const [selectedTag, setSelectedTag] = useState('');

  const availableTags = ['Puntual', 'Seguro', 'Limpio', 'Comunicativo', 'Amable', 'Cómodo', 'Rápido', 'Económico'];

  const handleTagToggle = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else if (tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }
    onSubmit({ rating, text: text.trim(), tags });
  };

  const isLocked = existingReview && existingReview.lockedAt && new Date(existingReview.lockedAt) < new Date();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div>
        <label className="block text-sm font-normal text-neutral-900 mb-2">
          Calificación *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-colors"
              disabled={isLocked || loading}
            >
              <Star
                className={`w-8 h-8 ${
                  value <= (hoveredRating || rating)
                    ? 'fill-[#032567] text-[#032567]'
                    : 'fill-none text-neutral-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div>
        <label className="block text-sm font-normal text-neutral-900 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Comparte tu experiencia..."
          maxLength={1000}
          rows={4}
          disabled={isLocked || loading}
          className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#032567] focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-neutral-500 mt-1">
          {text.length}/1000 caracteres
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-normal text-neutral-900 mb-2">
          Etiquetas (máximo 5)
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              disabled={isLocked || loading}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                tags.includes(tag)
                  ? 'bg-[#e0f2fe] text-[#032567] border border-[#032567]'
                  : 'bg-neutral-100 text-neutral-600 border border-[#e7e5e4] hover:bg-neutral-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {tag}
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <p className="text-xs text-neutral-500 mt-2">
            Seleccionadas: {tags.join(', ')}
          </p>
        )}
      </div>

      {isLocked && (
        <div className="bg-[#fafafa] border border-[#e7e5e4] rounded-lg p-3">
          <p className="text-sm text-neutral-600">
            ⏰ La ventana de edición ha expirado (24 horas después de crear la reseña)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            fullWidth
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={rating === 0 || isLocked}
          fullWidth
        >
          {existingReview ? 'Actualizar reseña' : 'Publicar reseña'}
        </Button>
      </div>
    </form>
  );
}

