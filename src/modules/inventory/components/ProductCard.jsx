import { Heart, Plus, Zap, Clock, Play, Check, Calendar } from 'lucide-react';

/**
 * ProductCard — Tarjeta de producto/servicio con layout Bento y estilo Neo-Brutalismo.
 */
const ProductCard = ({ item, index, onAddToCart, isAdded, onOpenDetail, toggleFavorite, isFav, readOnly }) => {
  const rotations = ['rotate-[0.5deg]', 'rotate-[-0.8deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]'];
  const radiuses = ['rounded-[2rem_1.2rem_2rem_1.2rem]', 'rounded-[1.2rem_2rem_1.2rem_2rem]'];
  const bentoPatterns = ['md:col-span-2', 'col-span-1', 'col-span-1', 'md:col-span-1', 'col-span-1'];
  const isSpecial = bentoPatterns[index % bentoPatterns.length].includes('md:col-span-2');
  
  const isAgotado = item.tipo === 'producto' && item.stock === 0;

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`group relative bg-[var(--card)] border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-visible cursor-pointer ${radiuses[index % 2]} ${rotations[index % 4]} ${bentoPatterns[index % bentoPatterns.length]} p-4 min-h-[280px] transition-all duration-500 ${isAgotado ? 'opacity-70 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)]' : 'hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_black]'}`}
    >
      {/* Etiqueta de categoría */}
      <div className="absolute -top-2.5 -left-1.5 z-20 bg-white border-[2.5px] border-black px-3 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm rotate-[-2deg]">
        {item.categoria}
      </div>

      {/* Botón de favorito */}
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
        className="absolute -top-2 -right-1 z-20 bg-white border-[3px] border-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors shadow-[2px_2px_0px_0px_black]"
      >
        <Heart size={16} strokeWidth={3} className={isFav ? "fill-rose-500 text-rose-500" : "text-slate-300"} />
      </button>

      {/* Emoji / imagen del producto */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-4 pb-2">
        <div className={`absolute w-24 h-24 rounded-full ${item.color} opacity-40 blur-2xl group-hover:scale-125 transition-transform duration-700`} />
        <div className={`text-6xl ${isSpecial ? 'md:text-[6.5rem]' : ''} transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 pointer-events-none drop-shadow-lg z-10`}>
          {item.emoji}
        </div>
      </div>

      {/* Tooltip Servicios */}
      {item.tipo === 'servicio' && (
        <div className="relative w-full z-20 mb-3 group/tooltip">
          <button className="bg-indigo-100 border-2 border-indigo-500 text-indigo-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-indigo-200 transition-colors pointer-events-none">
            <Play size={10} className="fill-indigo-500"/> Ver {item.pasos?.length || 3} Pasos
          </button>
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_black] p-4 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 origin-bottom">
            <h4 className="font-black text-[10px] uppercase text-slate-400 mb-2 border-b-2 border-slate-100 pb-1">Pasos del Servicio:</h4>
            <ul className="space-y-2">
              {(item.pasos || []).map((paso, idx) => (
                <li key={idx} className="text-xs font-bold text-slate-700 flex items-start gap-2 leading-tight">
                  <span className="text-indigo-500 mt-0.5"><Check size={12} strokeWidth={4}/></span> {paso.titulo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Info inferior */}
      <div className="relative z-10 flex flex-col gap-2 mt-auto">
        <h4 className="font-black text-[13px] leading-tight text-slate-800 tracking-tight line-clamp-2 px-1">
          {item.nombre}
        </h4>
        
        {item.tipo === 'servicio' && (
          <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 px-1">
            <Clock size={12} strokeWidth={3}/> {item.duracion} min
          </span>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Precio */}
          <div className="bg-black text-white px-2.5 py-1.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_var(--secondary)] transform -rotate-1 shrink-0 flex items-center">
            <span className="text-sm font-black tracking-tighter leading-none">${item.precio_calculado?.toFixed(2) || item.precio_base?.toFixed(2)}</span>
          </div>
          {/* Botón añadir */}
          {!readOnly && (
            <button
              disabled={isAgotado}
              onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
              className={`w-11 h-11 shrink-0 rounded-xl border-[3px] border-black flex items-center justify-center transition-all ${isAgotado ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[var(--primary)] text-black shadow-[3px_3px_0px_0px_black] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_black] active:translate-y-1 active:shadow-none'}`}
            >
              {isAdded === item.id 
                ? <Zap size={18} className="text-white fill-current" /> 
                : (isAgotado ? <span className="text-[8px] uppercase font-black px-1 leading-tight text-center">Sin Stock</span> : (item.tipo === 'servicio' ? <Calendar size={18} strokeWidth={3} /> : <Plus size={22} strokeWidth={4} />))
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
