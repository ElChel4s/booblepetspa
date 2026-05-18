import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Award, Zap, ShieldCheck, Briefcase } from 'lucide-react';
import PopButton from './PopButton';
import PopTagInput from './PopTagInput';
import PopInput from './PopInput';

export const ClientSection = ({ pets, onSelectPet }) => (
  <section className="space-y-8 animate-in fade-in">
    <div className="flex justify-between items-end mb-4 px-2">
      <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Mis <span className="text-[var(--primary)]">Peludos</span></h3>
      <PopButton variant="secondary" full={false} className="py-3 px-6" icon={Plus}>Nueva</PopButton>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {pets.map((pet, i) => (
        <button
          key={pet.id}
          type="button"
          onClick={() => onSelectPet && onSelectPet(pet)}
          className={`bg-white border-[4px] border-black p-6 rounded-[3rem] shadow-[8px_8px_0px_0px_black] group transition-all ${onSelectPet ? 'hover:-translate-y-1 cursor-pointer' : ''} ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-blue-50 border-[3.5px] border-black rounded-[2rem] flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_black] group-hover:scale-110 transition-transform">{pet.foto}</div>
            <div><h4 className="text-2xl font-black uppercase italic leading-none">{pet.nombre}</h4><p className="text-[10px] font-black text-slate-400 mt-1 uppercase">{pet.raza}</p></div>
          </div>
        </button>
      ))}
    </div>
  </section>
);

export const GroomerSection = ({ isEditing, profileForm, onChange }) => (
  <section className="space-y-8 animate-in fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="md:col-span-2 bg-white border-[4px] border-black p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black]">
        <h4 className="text-xl font-black uppercase italic mb-6 border-b-4 border-slate-50 pb-2">Especialidades Terapéuticas</h4>
        {isEditing ? (
          <PopTagInput
            tags={profileForm.especList || []}
            setTags={(newTags) => onChange('especList', newTags)}
            disabled={!isEditing}
            placeholder="Escribir especialidad y presionar Enter..."
          />
        ) : (
          <div className="flex flex-wrap gap-4 mb-8">
            {profileForm.especList?.map((s) => <span key={s} className="bg-[var(--secondary)] border-2 border-black px-4 py-2 rounded-xl text-[10px] font-black uppercase italic shadow-[3px_3px_0px_0px_black]">{s}</span>)}
          </div>
        )}

        <h4 className="text-xl font-black uppercase italic mb-4 border-b-4 border-slate-50 pb-2 mt-4">Biografía Profesional</h4>
        {isEditing ? (
          <PopInput
            icon={Briefcase}
            value={profileForm.bio || ''}
            onChange={(e) => onChange('bio', e.target.value)}
            disabled={!isEditing}
            multiline={true}
            containerClassName="mb-0"
          />
        ) : (
          <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{profileForm.bio}"</p>
        )}
      </div>
      <div className="bg-black text-white p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_var(--primary)] flex flex-col items-center"><Award className="text-[var(--secondary)] mb-4" size={32} /><h5 className="text-3xl font-black">450</h5><p className="text-[9px] font-black uppercase tracking-widest opacity-60">Servicios OK</p></div>
      <div className="bg-[var(--primary)] text-white p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] flex flex-col items-center"><Zap className="text-white mb-4" size={32} /><h5 className="text-3xl font-black">4.9/5</h5><p className="text-[9px] font-black uppercase tracking-widest opacity-60">Rating Groomer</p></div>
    </div>
  </section>
);

export const AdminSection = ({ role, logs, loading }) => (
  <section className="bg-white border-[4px] border-black p-10 rounded-[4rem] shadow-[12px_12px_0px_0px_black] animate-in fade-in">
    <div className="flex items-center gap-6 mb-10 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-black/5">
      <ShieldCheck className="text-emerald-500" size={40} />
      <div><h4 className="text-xl font-black uppercase">Nivel de Acceso: {role}</h4><p className="text-xs font-bold text-slate-400">Privilegios para gestión de la plataforma.</p></div>
    </div>

    <div className="space-y-4">
      <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2 flex justify-between items-center">
        {role === 'admin' ? 'Log de Auditoría Avanzado' : 'Últimas Acciones Registradas'}
        <span className="bg-black text-white px-2 py-0.5 rounded text-[8px] animate-pulse">LIVE</span>
      </h4>

      {loading ? (
        <div className="p-8 text-center font-black uppercase text-[10px] animate-pulse text-slate-400">Consultando registros...</div>
      ) : !logs || logs.length === 0 ? (
        <div className="p-8 text-center font-black uppercase text-[10px] text-slate-300">Sin actividad registrada</div>
      ) : (
        <div className="divide-y-2 divide-slate-50">
          {logs.slice(0, 5).map((log, i) => {
            const isCritical = log.accion.includes('ELIMINAR') || log.accion.includes('DESACTIVÓ');
            const isSession = log.accion.includes('SESIÓN');
            
            return (
              <div key={log.id || i} className="flex justify-between items-center py-4 group hover:bg-slate-50/50 transition-colors px-2 rounded-xl">
                <div className="flex flex-col">
                  <p className={`text-[10px] font-black uppercase ${isCritical ? 'text-rose-600' : isSession ? 'text-indigo-600' : 'text-emerald-600'}`}>
                    {log.accion}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 flex items-center gap-2">
                    IP: {log.ip_address} <span className="opacity-30">•</span> {log.rol}
                  </p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md group-hover:bg-black group-hover:text-white transition-all">
                  {new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </section>
);
