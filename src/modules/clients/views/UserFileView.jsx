import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Monitor,
  Smartphone,
  AlertTriangle,
  LogOut,
  Mail,
  Lock,
  Key,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import ProfileView from '../../auth/views/ProfileView';
import PopModal from '../../auth/components/PopModal';
import PopInput from '../../auth/components/PopInput';
import PopButton from '../../auth/components/PopButton';
import MfaEnrollModal from '../../auth/components/MfaEnrollModal';
import MfaUnenrollModal from '../../auth/components/MfaUnenrollModal';
import ChangePasswordModal from '../../auth/components/ChangePasswordModal';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../../../store/AuthContext';
import { deleteProfile } from '../../../services/profilesService';
import * as sessionsService from '../../auth/services/sessionsService';


const AVATARS_LIST = ['Felix', 'Aneka', 'Charlie', 'Mimi', 'Jasper', 'Lucy'];
const GROOMER_DEFAULT = {
  espec: 'Corte Tijera, Cats Only',
  bio: 'Experta en razas pequeñas. Trabajo enfocado en reducir el estrés de tu peludo.',
};

const mapUserToProfile = (user) => {
  const base = {
    id: user.id,
    nombre: user.nombre_completo,
    nombre_completo: user.nombre_completo,
    rol: user.rol,
    email: user.email,
    tel: user.telefono,
    direccion: user.direccion || '',
    ci: user.ci || '',
    avatar: user.avatar_seed || 'Felix',
    avatar_url: user.avatar_url || user.avatar_seed || 'Felix',
    is2faEnabled: user.rol === 'admin' || user.rol === 'cliente',
    mfa_activado: user.mfa_activado || false,
    activo: user.activo,  // ← CRÍTICO: pasar el estado activo/inactivo
  };

  if (user.rol === 'groomer') {
    return {
      ...base,
      espec: GROOMER_DEFAULT.espec,
      bio: GROOMER_DEFAULT.bio,
    };
  }

  return base;
};

const UserFileView = ({ user, viewerRole, viewingProfileMode, onBack, onSelectPet, onUserUpdated }) => {
  const { logout } = useAuth();

  const { pets, loadPetsByOwner } = useClients();
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isAdminOverrideOpen, setIsAdminOverrideOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalPassStrength, setModalPassStrength] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  const loadRealSessions = async () => {
    if (!user?.id) return;
    setSessionLoading(true);
    const { data } = await sessionsService.getActiveSessions(user.id);
    if (data) setSessions(data);
    setSessionLoading(false);
  };

  useEffect(() => {
    loadPetsByOwner(user.id);
    loadRealSessions();
  }, [user.id, loadPetsByOwner]);

  const mappedUser = useMemo(() => mapUserToProfile(user), [user]);
  
  const onConfirmDelete = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return;
    
    setIsDeleting(true);
    const { error } = await deleteProfile(user.id);
    setIsDeleting(false);

    
    if (!error) {
      setIsDeleteModalOpen(false);
      if (onBack) onBack(); 
    }
  };

  const calcModalStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    setModalPassStrength(score);
  };
  const handleSetView = (nextView) => {
    if (nextView === 'directory' && onBack) {
      onBack();
    }
  };

  const onConfirmLogout = async () => {
    await logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <ProfileView
        users={[mappedUser]}
        pets={pets}
        viewerRole={viewerRole}
        viewingProfileMode={viewingProfileMode}
        selectedUser={mappedUser}
        setView={handleSetView}
        setIsPassModalOpen={setIsPassModalOpen}
        setIsAdminOverrideOpen={setIsAdminOverrideOpen}
        setIsSessionModalOpen={setIsSessionModalOpen}
        setIsLogoutModalOpen={setIsLogoutModalOpen}
        setIs2FAModalOpen={setIs2FAModalOpen}
        setIsUnenrollModalOpen={setIsUnenrollModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        sessions={sessions}
        setSelectedSession={setSelectedSession}
        avatars={AVATARS_LIST}
        onSelectPet={onSelectPet}
        onUserUpdated={onUserUpdated}
      />

    <ChangePasswordModal
      isOpen={isPassModalOpen}
      onClose={() => setIsPassModalOpen(false)}
      targetUser={mappedUser}
      viewingProfileMode={viewingProfileMode}
    />

    <MfaEnrollModal 
      isOpen={is2FAModalOpen} 
      onClose={() => setIs2FAModalOpen(false)} 
    />

    <MfaUnenrollModal
      isOpen={isUnenrollModalOpen}
      onClose={() => setIsUnenrollModalOpen(false)}
    />

    <PopModal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} title="Detalle de Sesión">
      {selectedSession && (() => {
        const Icon = selectedSession.tipo_dispositivo === 'mobile' ? Smartphone : Monitor;
        const isCurrent = selectedSession.id === sessionsService.getCurrentSessionId();

        return (
          <div className="animate-in fade-in">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-slate-50 border-[4px] border-black rounded-[2.5rem] flex items-center justify-center mb-4 shadow-[6px_6px_0px_0px_black]">
                <Icon size={40} className={isCurrent ? 'text-emerald-500' : 'text-slate-400'} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isCurrent ? 'Dispositivo Actual' : 'Dispositivo Vinculado'}</p>
            </div>

            <PopInput
              label="Nombre del Dispositivo"
              icon={Smartphone}
              value={selectedSession.nombre_dispositivo || ''}
              disabled={true}
            />

            <div className="bg-slate-50 border-2 border-black/10 rounded-2xl p-6 mb-8 space-y-4">
              <div className="flex justify-between items-center border-b-2 border-black/5 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-400">Dirección IP</span>
                <span className="text-[10px] font-black uppercase">{selectedSession.ip_address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-400">Última Actividad</span>
                <span className="text-[10px] font-black uppercase text-emerald-600">
                  {new Date(selectedSession.last_active).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <PopButton
                variant="danger"
                icon={LogOut}
                onClick={() => setIsRevokeConfirmOpen(true)}
              >
                {isCurrent ? 'Cerrar Sesión Actual' : 'Desvincular Dispositivo'}
              </PopButton>
            </div>
          </div>
        );
      })()}
    </PopModal>

    <PopModal isOpen={isRevokeConfirmOpen} onClose={() => setIsRevokeConfirmOpen(false)} title="Confirmar Desvinculacion" isDanger={true}>
      {selectedSession && (() => {
        const isCurrent = selectedSession.id === sessionsService.getCurrentSessionId();

        return (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-100 border-[4px] border-rose-600 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} className="text-rose-600" />
              </div>
              <p className="text-sm font-black uppercase leading-relaxed text-rose-600 mb-2">Estas completamente seguro?</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 leading-relaxed max-w-md">
                {isCurrent
                  ? 'Esto cerrara tu sesion en este dispositivo inmediatamente.'
                  : `Se cerrara la sesion en ${selectedSession.nombre_dispositivo}. Tendras que volver a ingresar tus datos para acceder desde alli.`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <PopButton variant="outline" onClick={() => setIsRevokeConfirmOpen(false)} full={true}>Cancelar</PopButton>
              <PopButton
                variant="danger"
                icon={ShieldCheck}
                onClick={async () => {
                  await sessionsService.revokeSession(selectedSession.id);
                  if (isCurrent) {
                    await logout();
                  } else {
                    await loadRealSessions(); // Recargar lista
                  }
                  setIsRevokeConfirmOpen(false);
                  setIsSessionModalOpen(false);
                }}
                full={true}
              >
                Si, desvincular
              </PopButton>
            </div>
          </>
        );
      })()}
    </PopModal>

    <ChangePasswordModal
      isOpen={isAdminOverrideOpen}
      onClose={() => setIsAdminOverrideOpen(false)}
      targetUser={mappedUser}
      viewingProfileMode="admin_view"
    />
      
    <PopModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="ZONA DE PELIGRO" isDanger={true}>
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-rose-50 border-[4px] border-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_#f43f5e] animate-pulse">
          <AlertTriangle size={40} className="text-rose-500" strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black uppercase italic mb-2 text-rose-600">Eliminar Usuario</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 leading-relaxed max-w-md">
          Esta accion es <span className="text-rose-600 font-black">IRREVERSIBLE</span>. Se borraran todos los datos, citas y registros de <span className="text-black font-black">{user.nombre_completo}</span>.
        </p>
        
        <div className="w-full bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6">
          <p className="text-[9px] font-black uppercase text-rose-600 mb-4">Escribe <span className="underline">ELIMINAR</span> para confirmar:</p>
          <PopInput 
            placeholder="ELIMINAR" 
            value={deleteConfirmText} 
            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
            containerClassName="mb-0"
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <PopButton variant="outline" onClick={() => setIsDeleteModalOpen(false)} full={true}>Cancelar</PopButton>
        <PopButton 
          variant="danger" 
          icon={Trash2} 
          onClick={onConfirmDelete} 
          disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
          full={true}
        >
          {isDeleting ? 'Borrando...' : 'Confirmar Eliminacion'}
        </PopButton>
      </div>
    </PopModal>


      <PopModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Cerrar Sesion">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-rose-50 border-[4px] border-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_#f43f5e]">
          <LogOut size={40} className="text-rose-500 pr-1" strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black uppercase italic mb-2">Te vas tan pronto?</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 leading-relaxed max-w-md">
          Tendras que volver a ingresar tus credenciales la proxima vez que quieras acceder a tu cuenta de Bubble Pet Spa.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <PopButton variant="outline" onClick={() => setIsLogoutModalOpen(false)} full={true}>Mejor me quedo</PopButton>
        <PopButton variant="danger" icon={ArrowRight} onClick={onConfirmLogout} full={true}>Si, cerrar sesion</PopButton>
      </div>
      </PopModal>
    </>
  );
};

UserFileView.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre_completo: PropTypes.string.isRequired,
    rol: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    telefono: PropTypes.string.isRequired,
    direccion: PropTypes.string,
    ci: PropTypes.string,
    avatar_seed: PropTypes.string,
  }).isRequired,
  viewerRole: PropTypes.string.isRequired,
  viewingProfileMode: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onSelectPet: PropTypes.func,
};

UserFileView.defaultProps = {
  onBack: null,
  onSelectPet: null,
};

export default UserFileView;
