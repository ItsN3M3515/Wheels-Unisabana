import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerVehicle } from '../../api/vehicle';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

export default function RegisterVehicle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [soatPhoto, setSoatPhoto] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [soatPreview, setSoatPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

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

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      await registerVehicle({
        licensePlate: data.licensePlate.toUpperCase(),
        brand: data.brand,
        model: data.model,
        capacity: parseInt(data.capacity),
        vehiclePhoto,
        soatPhoto,
      });

      // Redirect to vehicle details after successful registration
      navigate('/driver/my-vehicle');
    } catch (err) {
      if (err.code === 'duplicate_license_plate') {
        setError('Esta placa ya está registrada');
      } else if (err.code === 'driver_already_has_vehicle' || err.code === 'one_vehicle_rule') {
        setError('Ya tienes un vehículo registrado');
      } else if (err.code === 'invalid_file_type') {
        setError('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP');
      } else if (err.code === 'payload_too_large') {
        setError('Una o más imágenes son muy grandes. El tamaño máximo es 5MB por archivo');
      } else {
        setError(err.message || 'Error al registrar el vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold text-neutral-900">Registrar Vehículo</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">
                Información del vehículo
              </h2>
              <p className="text-neutral-600 mt-1">
                Completa los datos de tu vehículo para poder ofrecer viajes
              </p>
            </div>

            {/* License Plate */}
            <Input
              label="Placa *"
              placeholder="ABC123"
              error={errors.licensePlate?.message}
              {...register('licensePlate', {
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
                label="Marca *"
                placeholder="Toyota"
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
                label="Modelo *"
                placeholder="Corolla"
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
                Capacidad de pasajeros *
              </label>
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
              {errors.capacity && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            {/* Photos */}
            <div className="border-t border-neutral-200 pt-5 mt-5">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Fotos (opcionales)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Photo */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Foto del vehículo
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:border-brand-400 transition-colors">
                    {vehiclePreview ? (
                      <div className="relative">
                        <img 
                          src={vehiclePreview} 
                          alt="Vehicle preview" 
                          className="w-full h-40 object-cover rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVehiclePhoto(null);
                            setVehiclePreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <p className="text-sm text-neutral-600 mb-1">
                          Click para subir foto
                        </p>
                        <p className="text-xs text-neutral-500">
                          JPEG, PNG o WebP (máx. 5MB)
                        </p>
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
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:border-brand-400 transition-colors">
                    {soatPreview ? (
                      <div className="relative">
                        <img 
                          src={soatPreview} 
                          alt="SOAT preview" 
                          className="w-full h-40 object-cover rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSoatPhoto(null);
                            setSoatPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <p className="text-sm text-neutral-600 mb-1">
                          Click para subir foto
                        </p>
                        <p className="text-xs text-neutral-500">
                          JPEG, PNG o WebP (máx. 5MB)
                        </p>
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
            </div>

            {/* Submit button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
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
                Registrar vehículo
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

