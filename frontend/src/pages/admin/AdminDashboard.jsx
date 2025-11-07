import { useState } from 'react';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { Link } from 'react-router-dom';
import AdminActions from '../../components/admin/AdminActions';
import AdminActionModal from '../../components/admin/AdminActionModal';
import { createModerationUploadUrl, createModerationNote } from '../../api/admin';

export default function AdminDashboardPage() {
  const [userId, setUserId] = useState('');
  const [tripId, setTripId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const handleNoteCreate = async (reason) => {
    try {
      let evidenceUrl = undefined;
      if (uploadFile) {
        const meta = { filename: uploadFile.name, contentType: uploadFile.type };
        const upload = await createModerationUploadUrl(meta);
        if (upload && upload.url) {
          // perform PUT upload
          await fetch(upload.url, {
            method: 'PUT',
            headers: { 'Content-Type': upload.headers?.['content-type'] || upload.contentType || upload.fileType || uploadFile.type },
            body: uploadFile
          });
          evidenceUrl = upload.url;
        }
      }

      await createModerationNote('User', userId || undefined, reason, evidenceUrl);
      setMessage('Nota de moderación creada');
      setShowNoteModal(false);
    } catch (err) {
      console.error(err);
      setMessage('Error creando nota de moderación');
      throw err;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Panel de administración</h1>
          <div>
            <Link to="/admin/audit" className="text-sm text-blue-600">Ver Audit Log</Link>
          </div>
        </div>

        {message && <div className="mb-4 p-3 bg-green-50 border rounded">{message}</div>}

        <section className="mb-6 bg-white p-4 border rounded">
          <h2 className="font-medium mb-2">Usuario</h2>
          <div className="flex gap-2 items-center">
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="p-2 border rounded flex-1" />
            <AdminActions userId={userId} onDone={() => setMessage('Acción aplicada a usuario')} />
          </div>
        </section>

        <section className="mb-6 bg-white p-4 border rounded">
          <h2 className="font-medium mb-2">Viaje</h2>
          <div className="flex gap-2 items-center">
            <input value={tripId} onChange={(e) => setTripId(e.target.value)} placeholder="Trip ID" className="p-2 border rounded flex-1" />
            <AdminActions tripId={tripId} onDone={() => setMessage('Viaje cancelado')} />
          </div>
        </section>

        <section className="mb-6 bg-white p-4 border rounded">
          <h2 className="font-medium mb-2">Reserva</h2>
          <div className="flex gap-2 items-center">
            <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Booking ID" className="p-2 border rounded flex-1" />
            <AdminActions bookingId={bookingId} onDone={() => setMessage('Reserva corregida')} />
          </div>
        </section>

        <section className="mb-6 bg-white p-4 border rounded">
          <h2 className="font-medium mb-2">Conductor</h2>
          <div className="flex gap-2 items-center">
            <input value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="Driver ID" className="p-2 border rounded flex-1" />
            <AdminActions driverId={driverId} onDone={() => setMessage('Publish ban aplicado')} />
          </div>
        </section>

        <section className="mb-6 bg-white p-4 border rounded">
          <h2 className="font-medium mb-2">Notas de moderación / Evidencia</h2>
          <div className="space-y-2">
            <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Target User ID (opcional)" className="p-2 border rounded flex-1" />
              <button onClick={() => setShowNoteModal(true)} className="px-3 py-2 bg-[#032567] text-white rounded">Crear nota</button>
            </div>
          </div>
        </section>

        {showNoteModal && (
          <AdminActionModal
            title="Crear nota de moderación"
            actionLabel="Crear"
            onCancel={() => setShowNoteModal(false)}
            onConfirm={handleNoteCreate}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
