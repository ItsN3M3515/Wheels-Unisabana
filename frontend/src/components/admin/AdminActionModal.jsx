import { useState } from 'react';

export default function AdminActionModal({ title, actionLabel = 'Confirm', onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!reason || reason.trim().length < 5) {
      setError('Por favor proporciona una razón (mínimo 5 caracteres)');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason);
    } catch (err) {
      setError(err?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-neutral-700 mb-1">Razón</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded h-28 mb-3"
            placeholder="Describe por qué se realiza esta acción (obligatorio)">
          </textarea>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-3 py-2 border rounded" disabled={submitting}>Cancelar</button>
            <button type="submit" className="px-3 py-2 bg-[#032567] text-white rounded" disabled={submitting}>{submitting ? 'Procesando...' : actionLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
