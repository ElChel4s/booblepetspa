import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Star } from 'lucide-react';

const DashboardHeader = ({ userName, puntosLealtad = 0, currentUser, onStartNewBooking }) => {
  const avatarSeed = userName || 'Client';
  const avatarUrl = currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 pt-4">
      {/* Banner Pop-Art */}
      <div className="flex-1 bg-yellow-300 border-[4px] border-black p-6 md:p-8 rounded-[2rem] shadow-[6px_6px_0px_0px_black] flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-none mb-2 text-black">
            ¡Hola, <span className="underline decoration-black decoration-4">{userName.split(' ')[0]}</span>!
          </h1>
          <div className="font-black text-xs md:text-sm text-yellow-950 bg-yellow-400 border-[2.5px] border-black px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
            <Star size={16} className="fill-current text-yellow-600" />
            <span>Puntos de Lealtad: {puntosLealtad}</span>
          </div>
        </div>
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full border-[3px] md:border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_0px_black] transform rotate-3 shrink-0">
          <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Botón de Acción */}
      <button
        onClick={onStartNewBooking}
        className="h-max bg-[var(--primary)] text-white border-[3px] border-black px-6 py-4 rounded-2xl shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_black] transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 group cursor-pointer xl:self-center"
      >
        <Plus size={20} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
        <span className="font-black uppercase text-sm tracking-wider">Nueva Reserva</span>
      </button>
    </div>
  );
};

DashboardHeader.propTypes = {
  userName: PropTypes.string.isRequired,
  puntosLealtad: PropTypes.number,
  currentUser: PropTypes.object,
  onStartNewBooking: PropTypes.func.isRequired,
};

export default DashboardHeader;
