import React from 'react';

const getAvatarClass = (currentAvatar, avatar) => (
  currentAvatar === avatar
    ? 'border-[var(--primary)] scale-110 shadow-[4px_4px_0px_0px_var(--primary)]'
    : 'border-black opacity-60 hover:opacity-100 hover:scale-105'
);

const ProfileAvatarCard = ({ user, profileForm, isEditing, canEdit, avatars, onAvatarChange }) => {
  return (
    <div className="bg-white border-[5px] border-black p-8 md:p-10 rounded-[4rem] shadow-[12px_12px_0px_0px_black] -rotate-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-black text-white px-6 py-2 rounded-bl-3xl font-black text-[9px] uppercase tracking-[0.2em]">
        ID: {user.id}
      </div>
      <div className="flex flex-col items-center mb-4">
        <div className="w-36 h-36 border-[5px] border-black rounded-[3rem] overflow-hidden mb-6 shadow-[8px_8px_0px_0px_black] bg-slate-50 relative group transition-transform">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileForm.avatar_url}`} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
          />
        </div>
        <h2 className="text-3xl font-black uppercase italic leading-none text-center">{profileForm.nombre_completo}</h2>
        <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">{user.rol} Bubble Pet</span>
      </div>

      {isEditing && canEdit && (
        <div className="mt-8 border-t-4 border-dashed border-slate-100 pt-6 animate-in zoom-in-95">
          <p className="text-[9px] font-black uppercase text-center text-slate-400 mb-4 tracking-widest">Elige tu Avatar Pop</p>
          <div className="flex flex-wrap justify-center gap-3">
            {avatars.map((ava) => (
              <button 
                key={ava} 
                onClick={() => onAvatarChange(ava)} 
                className={`w-12 h-12 rounded-[1rem] border-[3px] overflow-hidden transition-all ${getAvatarClass(profileForm.avatar_url, ava)}`}
              >
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ava}`} alt={ava} className="w-full h-full bg-slate-50" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatarCard;
