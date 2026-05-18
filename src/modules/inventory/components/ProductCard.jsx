import { useState } from 'react';
import { Heart, Plus, Zap } from 'lucide-react';

/**
 * ProductCard — Tarjeta de producto con layout Bento y estilo Neo-Brutalismo.
 * Soporta grid expansivo (col-span-2) en tarjetas "especiales".
 * Animación de rotación al hacer hover y feedback visual al añadir al carrito.
 */
const ProductCard = ({ item, index, onAddToCart, isAdded }) => {
  const rotations = ['rotate-[0.5deg]', 'rotate-[-0.8deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]'];
  const radiuses = ['rounded-[2rem_1.2rem_2rem_1.2rem]', 'rounded-[1.2rem_2rem_1.2rem_2rem]'];
  const bentoPatterns = ['md:col-span-2', 'col-span-1', 'col-span-1', 'md:col-span-1', 'col-span-1'];
  const isSpecial = bentoPatterns[index % bentoPatterns.length].includes('md:col-span-2');

  return (
    <div
      className={`group relative bg-[var(--card)] border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_var(--primary)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between overflow-visible ${radiuses[index % 2]} ${rotations[index % 4]} ${bentoPatterns[index % bentoPatterns.length]} p-4 min-h-[255px]`}
    >
      {/* Etiqueta de categoría */}
      <div className="absolute -top-2.5 -left-1.5 z-20 bg-white border-[2.5px] border-black px-3 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm rotate-[-2deg]">
        {item.category}
      </div>

      {/* Botón de favorito */}
      <button className="absolute -top-2 -right-1 z-20 bg-white border-2 border-black p-1.5 rounded-full shadow-md hover:scale-110 active:scale-90 transition-all text-slate-300 hover:text-rose-500">
        <Heart size={16} className={item.id === 1 ? 'fill-rose-500 text-rose-500' : ''} />
      </button>

      {/* Emoji / imagen del producto */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-4 pb-2">
        <div className={`absolute w-24 h-24 rounded-full ${item.color} opacity-40 blur-2xl group-hover:scale-125 transition-transform duration-700`} />
        <div className={`text-6xl ${isSpecial ? 'md:text-[6.5rem]' : ''} transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 pointer-events-none drop-shadow-lg z-10`}>
          {item.emoji}
        </div>
      </div>

      {/* Info inferior */}
      <div className="relative z-10 flex flex-col gap-2 mt-auto">
        <h4 className="font-black text-[13px] leading-tight text-slate-800 tracking-tight line-clamp-2 px-1">
          {item.name}
        </h4>
        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Precio */}
          <div className="bg-black text-white px-2.5 py-1 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_var(--secondary)] transform -rotate-1 shrink-0">
            <span className="text-base font-black tracking-tighter leading-none">${item.price.toFixed(2)}</span>
          </div>
          {/* Botón añadir */}
          <button
            onClick={() => onAddToCart(item.id)}
            className={`w-11 h-11 shrink-0 rounded-xl border-[3px] border-black flex items-center justify-center transition-all shadow-[3px_3px_0px_0px_black] active:translate-y-0.5 active:shadow-none ${
              isAdded === item.id
                ? 'bg-emerald-400 rotate-12 scale-105'
                : 'bg-[var(--primary)] hover:bg-[var(--secondary)]'
            }`}
          >
            {isAdded === item.id
              ? <Zap size={18} className="text-white fill-current" />
              : <Plus size={22} strokeWidth={4} className="text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
