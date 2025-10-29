import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getMyProfile, toggleRole as toggleRoleApi } from '../../api/user';
import { logout as logoutApi } from '../../api/auth';
import logo from '../../assets/images/UniSabana Logo.png';
import ChangePassword from './ChangePassword';

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isDriver = user?.role === 'driver';

  // Load profile data
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      console.error('[MyProfile] Error loading profile:', err);
      setError('Error al cargar el perfil: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      const { updateMyProfile } = await import('../../api/user');
      const updatedProfile = await updateMyProfile({
        profilePhoto: selectedFile,
      });
      
      setProfile(updatedProfile);
      setUser(updatedProfile);
      setSuccess('Foto de perfil actualizada correctamente');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      if (err.code === 'invalid_file_type') {
        setError('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP');
      } else if (err.code === 'payload_too_large') {
        setError('La imagen es muy grande. El tamaño máximo es 5MB');
      } else {
        setError(err.message || 'Error al actualizar la foto');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDeletePhoto = async () => {
    // TODO: Implement delete photo functionality
    setError('Funcionalidad de eliminar foto en desarrollo');
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      clearUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      clearUser();
      navigate('/login');
    }
  };

  const handleToggleRole = async () => {
    setRoleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await toggleRoleApi();
      setProfile(updatedProfile);
      setUser(updatedProfile);
      setShowRoleModal(false);
      setSuccess(`Rol cambiado exitosamente a ${updatedProfile.role === 'passenger' ? 'Pasajero' : 'Conductor'}`);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('[MyProfile] Toggle role error:', err);
      setError('Error al cambiar de rol: ' + (err.message || 'Error desconocido'));
      setShowRoleModal(false);
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e7e5e4',
            borderTop: '3px solid #032567',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando perfil...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar - Same as Dashboard */}
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
          {/* Left: Logo + Text */}
          <Link 
            to="/dashboard" 
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

          {/* Center: Navigation Links */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px'
          }}>
            <Link
              to="/my-trips"
              style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Mis viajes
            </Link>
            
            <Link
              to="/reports"
              style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Reportes
            </Link>
            
            <Link
              to="/search"
              style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1c1917',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.color = '#032567'}
              onMouseLeave={(e) => e.target.style.color = '#1c1917'}
            >
              Buscar viajes
            </Link>
          </nav>

          {/* Right: Role Status + Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Role indicator */}
            <div style={{
              padding: '6px 16px',
              backgroundColor: isDriver ? '#032567' : '#f0f9ff',
              color: isDriver ? 'white' : '#032567',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif'
            }}>
              {isDriver ? '🚗 Conductor' : 'Pasajero'}
            </div>

            {/* Profile button with menu */}
            <div className="profile-menu-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  height: '3rem',
                  width: '3rem',
                  borderRadius: '50%',
                  backgroundColor: '#032567',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </button>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '8px',
                  width: '220px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid #e7e5e4',
                  padding: '8px 0',
                  zIndex: 20
                }}>
                  {/* User info */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e7e5e4'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#57534e',
                      margin: '4px 0 0 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {user?.corporateEmail}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '4px 0' }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        color: '#1c1917',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      👤 Mi perfil
                    </button>

                    {isDriver && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/driver/my-vehicle');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          color: '#1c1917',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        🚗 Mi vehículo
                      </button>
                    )}
                  </div>

                  {/* Logout */}
                  <div style={{
                    borderTop: '1px solid #e7e5e4',
                    paddingTop: '4px'
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🚪 Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: '32px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Tu perfil
        </h1>

        {/* Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <span style={{ color: '#dc2626', fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                padding: '0',
                fontSize: '18px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <span style={{ color: '#16a34a', fontSize: '20px' }}>✓</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0 }}>
                {success}
              </p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                cursor: 'pointer',
                padding: '0',
                fontSize: '18px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Photo and Information - Single Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '40px'
        }}>
          {/* Profile Photo Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '48px' }}>
            {/* Photo Square */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '16px',
              backgroundColor: '#032567',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : profile?.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{
                  color: 'white',
                  fontSize: '4rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </span>
              )}
            </div>

            {/* Buttons - Side by side */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{
                padding: '0.5rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: uploadingPhoto ? '#94a3b8' : '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                if (!uploadingPhoto) e.target.style.backgroundColor = '#1A6EFF';
              }}
              onMouseLeave={(e) => {
                if (!uploadingPhoto) e.target.style.backgroundColor = '#032567';
              }}
              >
                {uploadingPhoto ? 'Subiendo...' : selectedFile ? 'Guardar foto' : 'Subir nueva foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    handleFileChange(e);
                    if (e.target.files?.[0]) {
                      // Auto upload
                      setTimeout(() => {
                        handlePhotoUpload();
                      }, 100);
                    }
                  }}
                  style={{ display: 'none' }}
                  disabled={uploadingPhoto}
                />
              </label>

              <button
                onClick={handleDeletePhoto}
                disabled={uploadingPhoto}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#dc2626',
                  backgroundColor: 'white',
                  border: '2px solid #dc2626',
                  borderRadius: '25px',
                  cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!uploadingPhoto) e.target.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  if (!uploadingPhoto) e.target.style.backgroundColor = 'white';
                }}
              >
                Eliminar foto de perfil
              </button>
            </div>
          </div>

          {/* Profile Information */}
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '24px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Información personal
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={profile?.firstName || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Apellido
                </label>
                <input
                  type="text"
                  value={profile?.lastName || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>
            </div>

            {/* Email and ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Correo corporativo
                </label>
                <input
                  type="text"
                  value={profile?.corporateEmail || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  ID Universitario
                </label>
                <input
                  type="text"
                  value={profile?.universityId || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid transparent',
                    borderRadius: '25px',
                    backgroundColor: '#d9d9d9',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'not-allowed',
                    color: '#57534e'
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Teléfono
              </label>
              <input
                type="text"
                value={profile?.phone || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid transparent',
                  borderRadius: '25px',
                  backgroundColor: '#d9d9d9',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'not-allowed',
                  color: '#57534e'
                }}
              />
            </div>

            {/* Change Password Button */}
            <div style={{ marginTop: '16px' }}>
              {!showChangePassword ? (
                <button
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#032567',
                    backgroundColor: 'white',
                    border: '2px solid #032567',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Cambiar contraseña
                </button>
              ) : (
                <div style={{
                  backgroundColor: '#f5f5f4',
                  padding: '24px',
                  borderRadius: '12px',
                  marginTop: '16px'
                }}>
                  <ChangePassword onSuccess={() => {
                    setShowChangePassword(false);
                    setSuccess('Contraseña cambiada exitosamente');
                  }} />
                  <button
                    onClick={() => setShowChangePassword(false)}
                    style={{
                      marginTop: '16px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '1rem',
                      fontWeight: 'normal',
                      color: '#57534e',
                      backgroundColor: 'white',
                      border: '2px solid #d9d9d9',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Role Toggle Section */}
          <div style={{
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid #e7e5e4'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Cambiar rol
            </h2>
            
            {profile?.role === 'passenger' ? (
              <button
                onClick={() => navigate('/become-driver')}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Convertirme en conductor
              </button>
            ) : (
              <button
                onClick={() => setShowRoleModal(true)}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  color: '#032567',
                  backgroundColor: 'white',
                  border: '2px solid #032567',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cambiar a Pasajero
              </button>
            )}
          </div>
        </div>

        {/* Role Toggle Modal */}
        {showRoleModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              maxWidth: '28rem',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1c1917',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>
                Cambiar a Pasajero
              </h3>
              <p style={{
                color: '#57534e',
                marginBottom: '24px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem'
              }}>
                ¿Estás seguro de que quieres cambiar tu rol a Pasajero? Podrás volver a ser conductor cuando quieras.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowRoleModal(false)}
                  disabled={roleLoading}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#57534e',
                    backgroundColor: 'white',
                    border: '2px solid #d9d9d9',
                    borderRadius: '25px',
                    cursor: roleLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = '#f5f5f4';
                  }}
                  onMouseLeave={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = 'white';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggleRole}
                  disabled={roleLoading}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: 'white',
                    backgroundColor: roleLoading ? '#94a3b8' : '#032567',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: roleLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = '#1A6EFF';
                  }}
                  onMouseLeave={(e) => {
                    if (!roleLoading) e.target.style.backgroundColor = '#032567';
                  }}
                >
                  {roleLoading ? 'Cambiando...' : 'Sí, cambiar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
