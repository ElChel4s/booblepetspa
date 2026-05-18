import React from 'react';
import { ArrowLeft, Edit, Activity, Phone, MessageCircle, Mail, Info, Calendar } from 'lucide-react';

export const PetDetailHeader = ({ onBack, onEdit, showEdit }) => (
  <div className="flex justify-between items-center mb-10">
    <button
      onClick={onBack}
      className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-[var(--text)] transition-colors"
    >
      <ArrowLeft size={20} strokeWidth={4} /> Volver
    </button>
    {showEdit && (
      <button
        onClick={onEdit}
        className="bg-black text-white border-[3px] border-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_var(--primary)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
      >
        <Edit size={13} strokeWidth={3} /> Editar Expediente
      </button>
    )}
  </div>
);

export const PetHeroCard = ({ pet, isGroomer }) => (
  <div className="bg-[var(--card)] border-[4px] border-black p-8 md:p-10 rounded-[4rem] shadow-[12px_12px_0px_0px_black] flex flex-col md:flex-row items-center gap-8 md:gap-10 relative overflow-hidden">
    {pet.alergias?.length > 0 && (
      <div className="absolute top-0 right-0 bg-rose-500 text-white px-8 py-2 rounded-bl-3xl font-black text-[10px] uppercase animate-pulse border-l-4 border-b-4 border-black">
        Alerta Médica Activa
      </div>
    )}
    <div className="w-36 h-36 md:w-44 md:h-44 bg-blue-50 border-[5px] border-black rounded-[3rem] shadow-[10px_10px_0px_0px_black] flex items-center justify-center text-7xl md:text-8xl -rotate-2 shrink-0">
      {pet.foto}
    </div>
    <div className="flex-1 text-center md:text-left">
      <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">
        {pet.nombre}
      </h2>
      <div className="flex flex-wrap justify-center md:justify-start gap-3">
        <span className="bg-black text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
          {pet.raza}
        </span>
        <span className="bg-white border-2 border-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic">
          {pet.tamano}
        </span>
        <span className="bg-white border-2 border-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
          {pet.especie}
        </span>
      </div>
    </div>
    {isGroomer && (
      <div className="bg-slate-50 border-[3.5px] border-black p-6 rounded-[2.5rem] flex flex-col items-center gap-2 shrink-0">
        <span className="text-[9px] font-black uppercase opacity-40">Estado de Cita</span>
        <div className="flex items-center gap-2 text-emerald-500 font-black italic">
          <Activity size={16} /> EN PROCESO
        </div>
      </div>
    )}
  </div>
);

export const PetTechnicalDetails = ({ pet }) => (
  <div className="bg-[var(--card)] border-[4px] border-black p-8 md:p-10 rounded-[3.5rem] shadow-[10px_10px_0px_0px_black]">
    <h3 className="text-2xl font-black uppercase italic mb-8 border-b-8 border-slate-50 pb-4">
      Detalles Técnicos
    </h3>
    <div className="bg-amber-50 border-[3.5px] border-black p-8 rounded-[2.5rem] relative mb-6">
      <div className="absolute -top-3 left-6 bg-black text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase italic">
        Conducta / Temperamento
      </div>
      <p className="font-black text-sm leading-relaxed italic text-amber-900 uppercase">
        "{pet.temperamento}"
      </p>
    </div>
    <div className="bg-rose-50 border-[3.5px] border-black p-8 rounded-[2.5rem] relative">
      <div className="absolute -top-3 left-6 bg-rose-600 text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase italic">
        Restricciones Médicas
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        {pet.alergias?.length > 0 ? (
          pet.alergias.map((tag, i) => (
            <span key={i} className="bg-white border-2 border-rose-600 text-rose-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-slate-400 font-black text-xs italic">
            Ninguna restricción registrada
          </span>
        )}
      </div>
    </div>
  </div>
);

export const PetGroomerContact = ({ owner }) => (
  <div className="bg-[var(--card)] border-[4px] border-black p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] rotate-1">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-emerald-400 text-white p-2 rounded-xl border-2 border-black">
        <Phone size={18} strokeWidth={3} />
      </div>
      <h3 className="text-xl font-black uppercase italic">Contactar Dueño</h3>
    </div>
    <div className="bg-slate-50 border-2 border-black p-4 rounded-2xl mb-6">
      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Responsable</p>
      <p className="text-lg font-black uppercase italic">{owner?.nombre_completo}</p>
    </div>
    <div className="space-y-3">
      <button className="w-full bg-emerald-500 text-white py-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-1 hover:shadow-none transition-all">
        <MessageCircle size={16} strokeWidth={4} /> WhatsApp
      </button>
      <button className="w-full bg-indigo-500 text-white py-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-1 hover:shadow-none transition-all">
        <Mail size={16} strokeWidth={4} /> Correo
      </button>
      <button className="w-full bg-black text-white py-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-1 hover:shadow-none transition-all">
        <Phone size={16} strokeWidth={4} /> Llamar
      </button>
    </div>
    <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-100 flex items-start gap-2">
      <Info size={13} className="text-slate-300 shrink-0 mt-0.5" />
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
        Solo usar en caso de consulta técnica o emergencia.
      </p>
    </div>
  </div>
);

export const PetOwnerCard = ({ owner }) => (
  <div className="bg-indigo-600 text-white border-[4px] border-black p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] rotate-1">
    <h3 className="font-black text-[10px] uppercase mb-6 tracking-widest opacity-60">
      Responsable
    </h3>
    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 bg-white rounded-2xl border-2 border-black overflow-hidden shadow-lg shrink-0">
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.avatar_seed}`} alt="avatar" />
      </div>
      <div>
        <p className="text-xl font-black uppercase italic leading-none">{owner.nombre_completo}</p>
        <p className="text-[10px] font-black text-indigo-200 mt-1 uppercase italic tracking-tighter">
          Socio Bubble #{owner.id.toUpperCase()}
        </p>
      </div>
    </div>
    <button className="w-full bg-white text-indigo-600 py-3.5 rounded-2xl font-black text-xs uppercase shadow-[5px_5px_0px_0px_black] active:translate-y-1 transition-all">
      Ver Perfil Completo
    </button>
  </div>
);

export const PetVisitCard = ({ pet }) => (
  <div className="bg-[var(--card)] border-[4px] border-black p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_black] -rotate-1">
    <h3 className="text-xl font-black uppercase italic mb-4">Última Visita</h3>
    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-black/5">
      <Calendar className="text-[var(--primary)] shrink-0" size={24} strokeWidth={3} />
      <div className="flex flex-col">
        <span className="text-[8px] font-black uppercase text-slate-400 leading-none">
          {pet.servicio_ultima_visita}
        </span>
        <span className="font-black text-sm italic uppercase tracking-tighter">
          {pet.ultima_visita}
        </span>
      </div>
    </div>
  </div>
);
