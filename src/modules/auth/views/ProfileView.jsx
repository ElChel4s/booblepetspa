import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  ArrowLeft,
  Edit3,
  Save,
  LogOut,
  Plus,
  Award,
  Briefcase,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  Key,
  ChevronRight,
} from 'lucide-react';
import PopInput from '../components/PopInput';
import PopButton from '../components/PopButton';
import PopTagInput from '../components/PopTagInput';
import { useAuth } from '../../../store/AuthContext';

import ProfileHeader from '../components/ProfileHeader';
import ProfileAvatarCard from '../components/ProfileAvatarCard';
import ProfileSecurityCard from '../components/ProfileSecurityCard';
import ProfileInfoForm from '../components/ProfileInfoForm';
import { ClientSection, GroomerSection, AdminSection } from '../components/ProfileSections';
import * as profilesService from '../../../services/profilesService';
import * as sessionsService from '../services/sessionsService';
import * as logsService from '../services/logsService';
import AuditLogsSection from '../components/AuditLogsSection';
import ToggleStatusModal from '../components/ToggleStatusModal';

const ProfileView = ({
  users,
  pets,
  viewerRole,
  viewingProfileMode,
  selectedUser,
  setView,
  setIsPassModalOpen,
  setIsAdminOverrideOpen,
  setIsSessionModalOpen,
  setIsLogoutModalOpen,
  setIs2FAModalOpen,
  setIsUnenrollModalOpen,
  setIsDeleteModalOpen,
  sessions,
  setSelectedSession,
  avatars,
  onSelectPet,
  onUserUpdated,
}) => {
  const { updateProfile, currentUser, unenrollMFA, logout } = useAuth();
  const [realSessions, setRealSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isToggleStatusModalOpen, setIsToggleStatusModalOpen] = useState(false);
  const [toggleStatusLoading, setToggleStatusLoading] = useState(false);

  let u = viewingProfileMode === 'personal' ? currentUser : selectedUser;
  if (!u) u = users[0];

  const [isEditing, setIsEditing] = useState(false);
  const canEdit = viewerRole === 'admin' || viewerRole === 'recepcion' || viewingProfileMode === 'personal';
  
  const [profileForm, setProfileForm] = useState({
    ...u,
    especList: u.espec ? u.espec.split(',').map((s) => s.trim()) : [],
  });
  useEffect(() => {
    if (u) {
      setProfileForm({
        ...u,
        especList: u.espec ? u.espec.split(',').map((s) => s.trim()) : [],
      });
      loadSessions();
      // Cargar logs si es admin (tanto en su perfil como en perfiles ajenos)
      if (viewerRole === 'admin') loadLogs();
    }
  }, [u]);

  const loadLogs = async () => {
    if (!u?.id) return;
    setLogsLoading(true);
    const { data } = await logsService.getUserLogs(u.id);
    if (data) setUserLogs(data);
    setLogsLoading(false);
  };

  const loadSessions = async () => {
    if (!u?.id) return;
    setSessionLoading(true);
    const { data } = await sessionsService.getActiveSessions(u.id);
    if (data) setRealSessions(data);
    setSessionLoading(false);
  };

  const handleFormChange = (field, val) => setProfileForm((prev) => ({ ...prev, [field]: val }));

  const roleSection = (() => {
    if (u.rol === 'cliente') return <ClientSection pets={pets} onSelectPet={onSelectPet} />;
    if (u.rol === 'groomer') return <GroomerSection isEditing={isEditing} profileForm={profileForm} onChange={handleFormChange} />;
    return <AdminSection role={u.rol} logs={userLogs} loading={logsLoading} />;
  })();

  const handleSave = async () => {
    const { error } = await updateProfile(profileForm, u.id);
    if (error) {
      alert("Error al guardar los cambios: " + error.message);
    } else {
      setIsEditing(false);
    }
  };

  const handleToggleMFA = async () => {
    // Si estamos en modo admin_view y el usuario es admin/recepcion, bloqueamos.
    // Pero si es el perfil PERSONAL, permitimos que se enrole.
    if (viewingProfileMode === 'admin_view' && (u.rol === 'admin' || u.rol === 'recepcion')) return;

    if (!u.mfa_activado) {
      setIs2FAModalOpen(true);
    } else {
      setIsUnenrollModalOpen(true);
    }
  };

  const handleToggleStatus = async () => {
    setToggleStatusLoading(true);
    const newStatus = u.activo === false ? true : false; // null o true → desactivar; false → activar
    const userName = u.nombre_completo || u.email || 'Usuario';
    const { error } = await profilesService.toggleUserStatus(u.id, newStatus);
    if (error) {
      alert("Error al cambiar estado: " + error.message);
    } else {
      await logsService.registerLog(
        currentUser.id,
        viewerRole,
        `${newStatus ? 'REACTIVÓ' : 'DESACTIVÓ'} al usuario ${userName}`
      );
      setIsToggleStatusModalOpen(false);
      // Callback al padre para recargar datos frescos
      if (onUserUpdated) {
        onUserUpdated();
      }
    }
    setToggleStatusLoading(false);
  };

  return (
    <>
      <div className={`max-w-7xl mx-auto px-4 py-10 animate-in slide-in-from-right-8 duration-500 ${u.activo === false ? 'opacity-50 grayscale' : ''}`}>
        <ProfileHeader 
          viewingProfileMode={viewingProfileMode} 
          setView={setView} 
          canEdit={canEdit} 
          isEditing={isEditing} 
          setIsEditing={setIsEditing} 
          onSave={handleSave}
          setIsLogoutModalOpen={setIsLogoutModalOpen} 
          setIsDeleteModalOpen={setIsDeleteModalOpen} 
          onToggleStatus={() => setIsToggleStatusModalOpen(true)}
          isActive={u.activo !== false}
          viewerRole={viewerRole}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <ProfileAvatarCard 
              user={u} 
              profileForm={profileForm} 
              isEditing={isEditing} 
              canEdit={canEdit} 
              avatars={avatars} 
              onAvatarChange={(ava) => handleFormChange('avatar_url', ava)} 
            />

            <ProfileSecurityCard 
              user={u} 
              viewingProfileMode={viewingProfileMode} 
              viewerRole={viewerRole} 
              setIs2FAModalOpen={setIs2FAModalOpen} 
              setIsPassModalOpen={setIsPassModalOpen} 
              sessions={realSessions} 
              setSelectedSession={setSelectedSession} 
              setIsSessionModalOpen={setIsSessionModalOpen}
              setIsAdminOverrideOpen={setIsAdminOverrideOpen} 
              onToggleMFA={handleToggleMFA}
            />
          </div>

          <div className="lg:col-span-8 space-y-10">
            <ProfileInfoForm 
              profileForm={profileForm} 
              onFormChange={handleFormChange} 
              canEdit={canEdit} 
              isEditing={isEditing} 
              viewingProfileMode={viewingProfileMode} 
            />

            {roleSection}

            {/* Si el espectador es Admin y está viendo un perfil ajeno que NO es admin, le mostramos también la tarjeta de logs de ese usuario */}
            {viewerRole === 'admin' && u.rol !== 'admin' && (
              <div className="mt-10">
                <AdminSection role={u.rol} logs={userLogs} loading={logsLoading} />
              </div>
            )}
          </div>
        </div>
      </div>

      <ToggleStatusModal
        isOpen={isToggleStatusModalOpen}
        onClose={() => setIsToggleStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        user={u}
        isActive={u.activo !== false}
        loading={toggleStatusLoading}
      />
    </>
  );
};

ProfileView.propTypes = {
  users: PropTypes.array.isRequired,
  pets: PropTypes.array.isRequired,
  viewerRole: PropTypes.string.isRequired,
  viewingProfileMode: PropTypes.string.isRequired,
  selectedUser: PropTypes.object,
  setView: PropTypes.func.isRequired,
  setIsPassModalOpen: PropTypes.func.isRequired,
  setIsAdminOverrideOpen: PropTypes.func.isRequired,
  setIsSessionModalOpen: PropTypes.func.isRequired,
  setIsLogoutModalOpen: PropTypes.func.isRequired,
  setIs2FAModalOpen: PropTypes.func,
  setIsUnenrollModalOpen: PropTypes.func,
  setIsDeleteModalOpen: PropTypes.func,
  sessions: PropTypes.array.isRequired,
  setSelectedSession: PropTypes.func.isRequired,
  avatars: PropTypes.array.isRequired,
  onSelectPet: PropTypes.func,
};

export default ProfileView;
