import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getMyVehicle, updateMyVehicle, deleteMyVehicle } from '../../api/vehicle';
import useAuthStore from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';

export default function MyVehicle() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [soatPhoto, setSoatPhoto] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [soatPreview, setSoatPreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  // Load vehicle data
  useEffect(() => {
    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      console.log('[MyVehicle] Loading vehicle...');
      const data = await getMyVehicle();
      console.log('[MyVehicle] Vehicle loaded:', data);
      setVehicle(data);
      
      // Set form values
      setValue('brand', data.brand);
      setValue('model', data.model);
      setValue('plate', data.plate);
      setValue('capacity', data.capacity);
    } catch (err) {
      console.error('[MyVehicle] Error loading vehicle:', err);
      if (err.status === 404) {
        setError('No tienes un vehículo registrado');
      } else {
        setError('Error al cargar el vehículo: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {
        brand: data.brand,
        model: data.model,
        plate: data.plate.toUpperCase(),
        capacity: parseInt(data.capacity),
      };

      if (vehiclePhoto) {
        updates.vehiclePhoto = vehiclePhoto;
      }

      if (soatPhoto) {
        updates.soatPhoto = soatPhoto;
      }

      const updatedVehicle = await updateMyVehicle(updates);
      setVehicle(updatedVehicle);
      setEditing(false);
      setSuccess('Vehículo actualizado correctamente');
      setVehiclePhoto(null);
      setSoatPhoto(null);
      setVehiclePreview(null);
      setSoatPreview(null);
    } catch (err) {
      if (err.code === 'duplicate_license_plate') {
        setError('Esta placa ya está registrada por otro vehículo');
      } else if (err.code === 'invalid_file_type') {
        setError('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP');
      } else if (err.code === 'payload_too_large') {
        setError('Una o más imágenes son muy grandes. El tamaño máximo es 5MB por archivo');
      } else {
        setError(err.message || 'Error al actualizar el vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVehiclePhoto(file);
      const url = URL.createObjectURL(file);
      setVehiclePreview(url);
    }
  };

  const handleSoatPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSoatPhoto(file);
      const url = URL.createObjectURL(file);
      setSoatPreview(url);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setSuccess(null);
    setVehiclePhoto(null);
    setSoatPhoto(null);
    setVehiclePreview(null);
    setSoatPreview(null);
    reset();
    if (vehicle) {
      setValue('brand', vehicle.brand);
      setValue('model', vehicle.model);
      setValue('plate', vehicle.plate);
      setValue('capacity', vehicle.capacity);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError(null);

    try {
      await deleteMyVehicle();
      setSuccess('Vehículo eliminado correctamente');
      setShowDeleteModal(false);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('[MyVehicle] Delete error:', err);
      setError('Error al eliminar el vehículo: ' + (err.message || 'Error desconocido'));
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando vehículo...</p>
        </div>
      </div>
    );
  }

  if (!vehicle && !loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
            >
              <span>←</span>
              <span>Volver</span>
            </button>
            <h1 className="text-xl font-bold text-neutral-900">Mi Vehículo</h1>
            <div className="w-20"></div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              No tienes un vehículo registrado
            </h2>
            <p className="text-neutral-600 mb-6">
              Registra tu vehículo para poder publicar viajes
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/driver/register-vehicle')}
            >
              Registrar vehículo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
          >
            <span>←</span>
            <span>Volver</span>
          </button>
          <h1 className="text-xl font-bold text-neutral-900">Mi Vehículo</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert type="success" message={success} onClose={() => setSuccess(null)} />
          </div>
        )}

        {/* Vehicle Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          {/* Vehicle Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Vehicle Photo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Foto del vehículo
              </label>
              <div className="relative aspect-video bg-neutral-100 rounded-lg overflow-hidden">
                {vehiclePreview ? (
                  <img 
                    src={vehiclePreview} 
                    alt="Vehicle preview" 
                    className="w-full h-full object-cover"
                  />
                ) : vehicle?.vehiclePhotoUrl ? (
                  <img 
                    src={vehicle.vehiclePhotoUrl} 
                    alt="Vehicle" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🚗</div>
                      <p className="text-sm text-neutral-500">Sin foto</p>
                    </div>
                  </div>
                )}
                {editing && (
                  <label className="absolute bottom-3 right-3 px-4 py-2 bg-brand-600 text-white rounded-lg cursor-pointer hover:bg-brand-700 transition-colors text-sm font-medium">
                    {vehiclePreview || vehicle?.vehiclePhotoUrl ? 'Cambiar' : 'Subir'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleVehiclePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* SOAT Photo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Foto del SOAT
              </label>
              <div className="relative aspect-video bg-neutral-100 rounded-lg overflow-hidden">
                {soatPreview ? (
                  <img 
                    src={soatPreview} 
                    alt="SOAT preview" 
                    className="w-full h-full object-cover"
                  />
                ) : vehicle?.soatPhotoUrl ? (
                  <img 
                    src={vehicle.soatPhotoUrl} 
                    alt="SOAT" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-neutral-500">Sin foto</p>
                    </div>
                  </div>
                )}
                {editing && (
                  <label className="absolute bottom-3 right-3 px-4 py-2 bg-brand-600 text-white rounded-lg cursor-pointer hover:bg-brand-700 transition-colors text-sm font-medium">
                    {soatPreview || vehicle?.soatPhotoUrl ? 'Cambiar' : 'Subir'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleSoatPhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Plate */}
              <Input
                label="Placa del vehículo"
                placeholder="ABC123"
                disabled={!editing}
                error={errors.plate?.message}
                {...register('plate', {
                  required: 'La placa es requerida',
                  pattern: {
                    value: /^[A-Z]{3}\d{3}$/i,
                    message: 'Formato inválido. Ej: ABC123',
                  },
                })}
              />

              {/* Brand and Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Marca"
                  placeholder="Toyota"
                  disabled={!editing}
                  error={errors.brand?.message}
                  {...register('brand', {
                    required: 'La marca es requerida',
                    minLength: {
                      value: 2,
                      message: 'Mínimo 2 caracteres',
                    },
                  })}
                />

                <Input
                  label="Modelo"
                  placeholder="Corolla"
                  disabled={!editing}
                  error={errors.model?.message}
                  {...register('model', {
                    required: 'El modelo es requerido',
                    minLength: {
                      value: 2,
                      message: 'Mínimo 2 caracteres',
                    },
                  })}
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Capacidad de pasajeros
                </label>
                {editing ? (
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-brand-600 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                    {...register('capacity', {
                      required: 'La capacidad es requerida',
                    })}
                  >
                    <option value="">Selecciona</option>
                    <option value="1">1 pasajero</option>
                    <option value="2">2 pasajeros</option>
                    <option value="3">3 pasajeros</option>
                    <option value="4">4 pasajeros</option>
                    <option value="5">5 pasajeros</option>
                    <option value="6">6 pasajeros</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={`${vehicle?.capacity || 0} pasajero${vehicle?.capacity > 1 ? 's' : ''}`}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-neutral-100 text-neutral-700 cursor-not-allowed"
                  />
                )}
                {errors.capacity && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.capacity.message}
                  </p>
                )}
              </div>

              {/* Metadata */}
              {vehicle && (
                <div className="border-t border-neutral-200 pt-5 mt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-600">Registrado el:</p>
                      <p className="font-medium text-neutral-900">
                        {new Date(vehicle.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Última actualización:</p>
                      <p className="font-medium text-neutral-900">
                        {new Date(vehicle.updatedAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-4">
                {!editing ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setEditing(true)}
                      className="w-full"
                    >
                      Editar vehículo
                    </Button>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Eliminar vehículo
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEdit}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading}
                      className="flex-1"
                    >
                      Guardar cambios
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          loading={deleteLoading}
          title="Eliminar vehículo"
          message="¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer. No podrás publicar viajes hasta que registres otro vehículo."
          confirmText="Sí, eliminar vehículo"
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
}

