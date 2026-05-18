import { ArrowLeft, Save, Edit3, LogOut, Trash2 } from 'lucide-react';
import PopButton from './PopButton';

const ProfileHeader = ({ 
  viewingProfileMode, 
  setView, 
  canEdit, 
  isEditing, 
  setIsEditing, 
  onSave, 
  setIsLogoutModalOpen, 
  setIsDeleteModalOpen,
  onToggleStatus,
  isActive = true,
  viewerRole
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      {viewingProfileMode === 'admin_view' ? (
        <button onClick={() => setView('directory')} className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-black">
          <ArrowLeft size={20} strokeWidth={4} /> Volver al Directorio
        </button>
      ) : (
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Mi <span className="text-[var(--primary)]">Perfil</span></h2>
        </div>
      )}

      <div className="flex gap-4 w-full md:w-auto">
        {canEdit && (
          isEditing ? (
            <PopButton variant="secondary" full={false} className="py-3 px-6" onClick={onSave}>
              <Save size={16} /> Guardar
            </PopButton>
          ) : (
            <PopButton variant="outline" full={false} className="py-3 px-6" onClick={() => setIsEditing(true)}>
              <Edit3 size={16} /> Editar Datos
            </PopButton>
          )
        )}
        {viewingProfileMode === 'personal' && (
          <PopButton 
            variant="outline" 
            full={false} 
            className="py-3 px-4 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white" 
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <LogOut size={16} />
          </PopButton>
        )}
        {viewingProfileMode === 'admin_view' && (
          <div className="flex gap-2">
            <PopButton 
              variant="outline" 
              full={false} 
              className={`py-3 px-6 ${isActive ? 'border-amber-500 text-amber-500' : 'border-emerald-500 text-emerald-500'}`} 
              onClick={onToggleStatus}
            >
              {isActive ? 'Desactivar' : 'Reactivar'}
            </PopButton>
            
            {viewerRole === 'admin' && (
              <PopButton 
                variant="outline" 
                full={false} 
                className="py-3 px-4 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white" 
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={16} />
              </PopButton>
            )}
          </div>
        )}
      </div>
    </header>

  );
};

export default ProfileHeader;
