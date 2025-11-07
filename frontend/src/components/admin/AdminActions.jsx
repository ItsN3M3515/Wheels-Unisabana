import { useState } from 'react';
import AdminActionModal from './AdminActionModal';
import { suspendUser, forceCancelTrip, setDriverPublishBan, correctBookingState, createModerationUploadUrl, createModerationNote } from '../../api/admin';
import useAuthStore from '../../store/authStore';

export default function AdminActions({ userId, tripId, bookingId, driverId, onDone }) {
  const user = useAuthStore((s) => s.user);
  const [modalConfig, setModalConfig] = useState(null);

  if (!user || user.role !== 'admin') return null;

  const openModal = (title, actionLabel, handler) => setModalConfig({ title, actionLabel, handler });

  const handleSuspend = () => openModal('Suspender/Reactivate usuario', 'Enviar', async (reason) => {
    await suspendUser(userId, true, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleUnsuspend = () => openModal('Reactivar usuario', 'Enviar', async (reason) => {
    await suspendUser(userId, false, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleForceCancel = () => openModal('Force-cancelar viaje', 'Cancelar viaje', async (reason) => {
    await forceCancelTrip(tripId, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handlePublishBan = (ban) => openModal(ban ? 'Publicar ban (prohibir publicar)' : 'Levantar publicación ban', 'Enviar', async (reason) => {
    await setDriverPublishBan(driverId, ban, reason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleBookingCorrection = () => openModal('Corregir estado de reserva', 'Corregir', async (reason) => {
    // For simplicity, ask admin to specify new state in reason with prefix like "state:accepted; reason..."
    const m = reason.match(/state:([a-zA-Z0-9_\-]+)/);
    const newState = m ? m[1] : null;
    if (!newState) throw new Error('Incluye el nuevo estado usando el formato: state:<estado> al inicio del texto');
    const finalReason = reason.replace(/state:[^;\s]+;?\s*/, '');
    await correctBookingState(bookingId, newState, finalReason);
    setModalConfig(null);
    onDone && onDone();
  });

  const handleCreateModerationNote = async () => {
    openModal('Agregar nota de moderación', 'Crear nota', async (reason) => {
      const upload = await createModerationUploadUrl({});
      const evidenceUrl = upload && upload.url ? upload.url : undefined;
      await createModerationNote('User', userId, reason, evidenceUrl);
      setModalConfig(null);
      onDone && onDone();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {userId && (
        <>
          <button onClick={handleSuspend} className="px-3 py-1 border rounded">Suspender</button>
          <button onClick={handleUnsuspend} className="px-3 py-1 border rounded">Reactivar</button>
          <button onClick={handleCreateModerationNote} className="px-3 py-1 border rounded">Agregar nota</button>
        </>
      )}
      {tripId && (
        <button onClick={handleForceCancel} className="px-3 py-1 border rounded">Force-cancelar viaje</button>
      )}
      {driverId && (
        <>
          <button onClick={() => handlePublishBan(true)} className="px-3 py-1 border rounded">Ban publicar</button>
          <button onClick={() => handlePublishBan(false)} className="px-3 py-1 border rounded">Levantar ban</button>
        </>
      )}
      {bookingId && (
        <button onClick={handleBookingCorrection} className="px-3 py-1 border rounded">Corregir reserva</button>
      )}

      {modalConfig && (
        <AdminActionModal
          title={modalConfig.title}
          actionLabel={modalConfig.actionLabel}
          onCancel={() => setModalConfig(null)}
          onConfirm={modalConfig.handler}
        />
      )}
    </div>
  );
}
