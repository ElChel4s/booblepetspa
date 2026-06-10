import { Filter, Dog, ArrowUpDown, CheckCircle2, Plus, RefreshCcw, Search } from 'lucide-react';
import PopSelect from '../../../components/common/PopSelect';
import { categories } from '../../../utils/data';

/**
 * FilterPanel — Tablero de filtros estilo "stickers" para la tienda.
 * Contiene: Dropdowns PopSelect, toggle de stock, reset y buscador proporcional.
 * Los filtros activos se inclinan visualmente (efecto chueco dinámico).
 */
const FilterPanel = ({
  activeCategory, setActiveCategory,
  petType, setPetType,
  sortBy, setSortBy,
  onlyStock, setOnlyStock,
  searchQuery, setSearchQuery,
  onClearFilters,
  viewMode = 'productos',
  categoriesList = categories
}) => {
  return (
    <div className="bg-white border-[4px] border-black p-7 rounded-[2.5rem] shadow-[8px_8px_0px_0px_var(--shadow)] mb-12 relative overflow-visible pt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 items-end">
        
        {/* Filtro: Categoría */}
        <PopSelect
          label="Categoría"
          value={activeCategory}
          options={categoriesList.map((c) => ({ label: c, value: c }))}
          onChange={setActiveCategory}
          activeColor="bg-[var(--primary)] text-white"
          icon={Filter}
          rotation="rotate-[-2.5deg]"
        />

        {/* Filtro: Tipo de mascota */}
        <PopSelect
          label="Para quién"
          value={petType}
          options={[
            { label: 'Todos', value: 'Ambos' },
            { label: 'Perros 🐶', value: 'Perro' },
            { label: 'Gatos 🐱', value: 'Gato' },
          ]}
          onChange={setPetType}
          activeColor="bg-[var(--secondary)] text-black"
          icon={Dog}
          rotation="rotate-[2.5deg]"
        />

        {/* Filtro: Ordenar */}
        <PopSelect
          label="Ordenar"
          value={sortBy}
          options={[
            { label: 'Normal', value: 'default' },
            { label: 'Precio: ↓', value: 'price-asc' },
            { label: 'Precio: ↑', value: 'price-desc' },
            { label: 'Favoritos', value: 'rating' },
          ]}
          onChange={setSortBy}
          activeColor="bg-amber-400 text-black"
          icon={ArrowUpDown}
          rotation="rotate-[-1.5deg]"
        />

        {/* Stock + Reset */}
        <div className="flex gap-4 items-end lg:col-span-1 h-full">
          {/* Toggle Stock */}
          {viewMode === 'productos' && (
            <div className={`relative transition-all duration-300 flex-1 ${onlyStock ? 'rotate-[2deg] scale-105 z-30' : 'z-20'}`}>
              <div className="absolute -top-3 left-3 z-30 bg-black text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
                Stock
              </div>
              <button
                onClick={() => setOnlyStock(!onlyStock)}
                className={`w-full border-[3.5px] border-black px-4 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_black] flex items-center justify-center gap-2 ${
                  onlyStock ? 'bg-emerald-400 text-black' : 'bg-slate-50 text-slate-400 hover:bg-white'
                }`}
              >
                {onlyStock ? <CheckCircle2 size={14} /> : <Plus size={14} />} Stock
              </button>
            </div>
          )}

          {/* Botón Reset */}
          <div className={`relative z-30 ${viewMode !== 'productos' ? 'flex-1' : ''}`}>
            <div className="absolute -top-3 left-2 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
              Reset
            </div>
            <button
              onClick={onClearFilters}
              className="w-[50px] h-[50px] border-[3.5px] border-black bg-white hover:bg-rose-500 hover:text-white rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all group"
            >
              <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" strokeWidth={4} />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="md:col-span-2 lg:col-span-2 relative group z-10">
          <div className="absolute -top-3 left-6 z-30 bg-black text-white px-3 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
            Buscador
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="¿Qué necesita tu peludo hoy?..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-[3.5px] border-black text-slate-800 font-black rounded-2xl py-[11px] pl-6 pr-14 text-sm outline-none focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all shadow-sm"
            />
            <div className="absolute right-2 bg-black text-white w-10 h-10 rounded-xl border-[2px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform cursor-pointer">
              <Search size={18} strokeWidth={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
