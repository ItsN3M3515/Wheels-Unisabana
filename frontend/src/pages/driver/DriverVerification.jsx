import { useState, useEffect, useRef } from 'react';
import { submitVerification, getMyVerification } from '../../api/driverVerification';
import Loading from '../../components/common/Loading';

export default function DriverVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  // form state
  const fullNameRef = useRef();
  const documentNumberRef = useRef();
  const licenseNumberRef = useRef();
  const licenseExpiresRef = useRef();
  const soatNumberRef = useRef();
  const soatExpiresRef = useRef();
  const govIdFrontRef = useRef();
  const govIdBackRef = useRef();
  const driverLicenseRef = useRef();
  const soatRef = useRef();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyVerification();
      setProfile(data);
    } catch (err) {
      // 404 means no profile yet; ignore
      if (err?.response?.status !== 404) {
        console.error('Failed to load verification profile', err);
        setError('Error cargando datos de verificación');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', fullNameRef.current.value || '');
      fd.append('documentNumber', documentNumberRef.current.value || '');
      fd.append('licenseNumber', licenseNumberRef.current.value || '');
      fd.append('licenseExpiresAt', licenseExpiresRef.current.value || '');
      fd.append('soatNumber', soatNumberRef.current.value || '');
      fd.append('soatExpiresAt', soatExpiresRef.current.value || '');

      if (govIdFrontRef.current.files[0]) fd.append('govIdFront', govIdFrontRef.current.files[0]);
      if (govIdBackRef.current.files[0]) fd.append('govIdBack', govIdBackRef.current.files[0]);
      if (driverLicenseRef.current.files[0]) fd.append('driverLicense', driverLicenseRef.current.files[0]);
      if (soatRef.current.files[0]) fd.append('soat', soatRef.current.files[0]);

      const resp = await submitVerification(fd);
      // resp contains status and profile minimal DTO per backend
      setProfile(resp);
      // scroll to result
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('submit verification failed', err);
      setError(err?.response?.data?.message || 'Error enviando verificación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Verificación de conductor</h2>

      {profile && (
        <div className="mb-4 p-4 bg-white border rounded">
          <p className="text-sm text-neutral-700">Estado: <strong>{profile.status}</strong></p>
          <p className="text-sm text-neutral-700">Enviado: {profile.submittedAt ? new Date(profile.submittedAt).toLocaleString() : '—'}</p>
          {profile.documents && profile.documents.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Documentos:</p>
              <ul className="text-sm text-neutral-700 list-disc ml-6">
                {profile.documents.map((d) => (
                  <li key={d.type}>{d.type} — {d.name} — {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded space-y-4">
        <div>
          <label className="block text-sm mb-1">Nombre completo</label>
          <input ref={fullNameRef} className="w-full p-2 border rounded" placeholder="Tu nombre tal como aparece en documentos" />
        </div>

        <div>
          <label className="block text-sm mb-1">Número de documento</label>
          <input ref={documentNumberRef} className="w-full p-2 border rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Número de licencia</label>
            <input ref={licenseNumberRef} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Vence (licencia)</label>
            <input ref={licenseExpiresRef} type="date" className="w-full p-2 border rounded" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">SOAT número</label>
            <input ref={soatNumberRef} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Vence (SOAT)</label>
            <input ref={soatExpiresRef} type="date" className="w-full p-2 border rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Documento identidad (frente) — requerido</label>
          <input ref={govIdFrontRef} type="file" accept="image/*,application/pdf" className="w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">Documento identidad (dorso) — opcional</label>
          <input ref={govIdBackRef} type="file" accept="image/*,application/pdf" className="w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">Licencia de conducción — requerido</label>
          <input ref={driverLicenseRef} type="file" accept="image/*,application/pdf" className="w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">SOAT (póliza) — requerido</label>
          <input ref={soatRef} type="file" accept="image/*,application/pdf" className="w-full" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#032567] text-white rounded">
            {submitting ? 'Enviando...' : 'Enviar verificación'}
          </button>
        </div>
      </form>
    </div>
  );
}
