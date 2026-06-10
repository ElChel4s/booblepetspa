import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PopModal from '../../../../components/common/organisms/PopModal';
import BrutalInput from '../../../../components/common/atoms/BrutalInput';
import { CATEGORIAS_MOVIMIENTO } from '../../services/adminInventoryService';
import { ArrowUpRight, ArrowDownRight, Info, Check } from 'lucide-react';

const MovementModal = ({ isOpen, onClose, onConfirm, initialData, perfiles }) => {
  const [form, setForm] = useState({
    producto: null, tipo: 'ingreso', categoria_motivo: 'compra_proveedor', cantidad: 1, usuario_id: '', detalle: ''
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setForm({
        producto: initialData.producto,
        tipo: initialData.tipo,
        categoria_motivo: initialData.tipo === 'ingreso' ? 'compra_proveedor' : 'uso_interno',
        cantidad: 1,
        usuario_id: perfiles[0]?.id || '',
        detalle: ''
      });
    }
  }, [initialData, perfiles, isOpen]);

  useEffect(() => {
    if (form.categoria_motivo === 'uso_interno') {
      const firstGroomer = perfiles.find(p => p.rol === 'groomer');
      if (firstGroomer && form.usuario_id !== firstGroomer.id) {
        setForm(prev => ({...prev, usuario_id: firstGroomer.id}));
      }
    }
  }, [form.categoria_motivo, perfiles]);

  const filteredProfilesForMove = form.categoria_motivo === 'uso_interno' 
    ? perfiles.filter(p => p.rol === 'groomer') 
    : perfiles;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(form);
  };

  if (!form.producto) return null;

  return (
    <PopModal isOpen={isOpen} onClose={onClose} title={`Registrar ${form.tipo === 'ingreso' ? 'Ingreso (+)' : 'Salida (-)'}`} icon={form.tipo === 'ingreso' ? ArrowUpRight : ArrowDownRight}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-4 rounded-2xl border-[3px] flex justify-between items-center ${form.tipo === 'ingreso' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-rose-50 border-rose-400 text-rose-900'}`}>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-70">PRODUCTO SELECCIONADO</span>
            <h4 className="font-black text-lg uppercase italic leading-tight">{form.producto.nombre}</h4>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-70">Stock Actual</span>
            <span className="font-black text-xl px-3 py-1 rounded-lg bg-white border-2 border-current">{form.producto.stock_actual} ud</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Razón del Movimiento</label>
            <select value={form.categoria_motivo} onChange={(e) => setForm({...form, categoria_motivo: e.target.value})} className="w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)]">
              {CATEGORIAS_MOVIMIENTO[form.tipo].map(cat => (
                (cat.id === 'uso_interno' && !form.producto.es_insumo) ? null : 
                <option key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</option>
              ))}
            </select>
            {form.categoria_motivo === 'venta_mostrador' && <p className="text-[9px] text-rose-500 font-bold mt-1">* Se generará registro en tabla 'pedidos'</p>}
            {form.categoria_motivo === 'uso_interno' && <p className="text-[9px] text-indigo-500 font-bold mt-1">* Se generará registro en tabla 'retiros_insumo'</p>}
          </div>

          <BrutalInput label={`Cantidad de ${form.tipo} (Unidades)`} type="number" min="1" max={form.tipo === 'salida' ? form.producto.stock_actual : undefined} value={form.cantidad} onChange={(e) => setForm({...form, cantidad: e.target.value})} />

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Responsable / Usuario</label>
            <select value={form.usuario_id} onChange={(e) => setForm({...form, usuario_id: e.target.value})} className="w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)]">
              {filteredProfilesForMove.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
            </select>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block flex items-center gap-1"><Info size={12}/> Notas / Detalles (Opcional)</label>
             <input type="text" placeholder="Ej. Factura #, Nombre Cliente..." value={form.detalle} onChange={(e) => setForm({...form, detalle: e.target.value})} className="w-full bg-slate-50 border-[3px] border-black rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[var(--primary)]"/>
          </div>
        </div>

        <div className={`p-4 rounded-xl border-2 flex justify-between items-center ${form.tipo === 'ingreso' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-rose-100 border-rose-400 text-rose-800'}`}>
          <span className="font-black text-xs uppercase">Proyección Post-Movimiento:</span>
          <span className="font-black text-md px-3 py-1 border border-current rounded-lg bg-white">
            {form.tipo === 'ingreso' ? form.producto.stock_actual + (parseInt(form.cantidad)||0) : form.producto.stock_actual - (parseInt(form.cantidad)||0)} ud
          </span>
        </div>

        <button type="submit" disabled={!form.cantidad || form.cantidad <= 0 || (form.tipo === 'salida' && form.cantidad > form.producto.stock_actual)} className={`w-full text-white py-5 rounded-2xl border-[3px] border-black font-black text-md uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 ${form.tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          Confirmar {form.tipo === 'ingreso' ? 'Ingreso a' : 'Salida de'} Almacén <Check size={22}/>
        </button>
      </form>
    </PopModal>
  );
};

MovementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  perfiles: PropTypes.array.isRequired
};

export default MovementModal;
