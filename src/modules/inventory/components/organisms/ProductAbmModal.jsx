import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PopModal from '../../../../components/common/organisms/PopModal';
import BrutalInput from '../../../../components/common/atoms/BrutalInput';
import { Package, Scissors, CheckCircle2 } from 'lucide-react';

const ProductAbmModal = ({ isOpen, onClose, onSave, product, categorias }) => {
  const [form, setForm] = useState({
    id: null, nombre: '', categoria_id: '', precio_base: '', stock_minimo_alerta: '5', stock_actual: '0', es_insumo: false
  });

  useEffect(() => {
    if (product) {
      setForm({ ...product });
    } else {
      setForm({
        id: null, 
        nombre: '', 
        categoria_id: categorias[0]?.id || '', 
        precio_base: '', 
        stock_minimo_alerta: '5', 
        stock_actual: '0', 
        es_insumo: false
      });
    }
  }, [product, categorias, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      precio_base: parseFloat(form.precio_base),
      stock_minimo_alerta: parseInt(form.stock_minimo_alerta),
      stock_actual: form.id ? form.stock_actual : parseInt(form.stock_actual)
    });
  };

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title={form.id ? "Modificar Ficha de Producto" : "Nuevo Producto"} icon={Package}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <BrutalInput label="Nombre del Producto" placeholder="Ej. Toallitas Húmedas" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Categoría (FK)</label>
            <select value={form.categoria_id} onChange={(e) => setForm({...form, categoria_id: e.target.value})} className="w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)]">
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <BrutalInput label="Precio Base de Venta ($)" type="number" min="0" step="0.01" value={form.precio_base} onChange={(e) => setForm({...form, precio_base: e.target.value})} />
          </div>
          <div>
            <BrutalInput label="Alerta de Stock Crítico (Mínimo)" type="number" min="0" value={form.stock_minimo_alerta} onChange={(e) => setForm({...form, stock_minimo_alerta: e.target.value})} />
          </div>
          <div>
            <BrutalInput label="Stock Inicial (Solo Creación)" type="number" min="0" value={form.stock_actual} onChange={(e) => setForm({...form, stock_actual: e.target.value})} disabled={form.id !== null} />
          </div>
          <div className="md:col-span-2 bg-indigo-50 border-[3px] border-indigo-400 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="font-black text-sm uppercase block text-indigo-900 flex items-center gap-2"><Scissors size={18}/> ¿Habilitar para Uso Interno?</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase block mt-1">Todos los productos son de venta. Activa esto si el producto TAMBIÉN es un insumo utilizado por los groomers.</span>
            </div>
            <button type="button" onClick={() => setForm({...form, es_insumo: !form.es_insumo})} className={`px-6 py-3 rounded-xl border-2 border-black font-black text-xs uppercase transition-all shrink-0 ${form.es_insumo ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white text-slate-400 shadow-[3px_3px_0px_0px_black]'}`}>
              {form.es_insumo ? 'Sí, Uso Dual' : 'Solo Venta'}
            </button>
          </div>
        </div>
        <button type="submit" disabled={!form.nombre || form.precio_base === ''} className="w-full bg-black text-white py-5 rounded-2xl border-[3px] border-black font-black text-md uppercase tracking-wider shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50">
          Guardar en Sistema <CheckCircle2 size={22}/>
        </button>
      </form>
    </PopModal>
  );
};

ProductAbmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  product: PropTypes.object,
  categorias: PropTypes.array.isRequired
};

export default ProductAbmModal;
