import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Upload, DollarSign, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';
import PopModal from '../../../components/common/organisms/PopModal';

const EXPENSE_CATEGORIES = [
  { id: 'insumos', label: 'Insumos', emoji: '🧴' },
  { id: 'servicios_basicos', label: 'Servicios Básicos', emoji: '💡' },
  { id: 'salarios', label: 'Salarios/Pagos', emoji: '👥' },
  { id: 'mantenimiento', label: 'Mantenimiento', emoji: '🔧' },
  { id: 'otros', label: 'Otros Gastos', emoji: '📦' }
];

const RegisterExpenseModal = ({ isOpen, onClose, onRegister }) => {
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('insumos');
  const [descripcion, setDescripcion] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileObject, setFileObject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileObject(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !descripcion) {
      alert("Por favor, completa el monto y la descripción del gasto.");
      return;
    }
    
    setIsSubmitting(true);
    
    await onRegister({
      monto: parseFloat(monto),
      categoria,
      descripcion
    }, fileObject);
    
    setIsSubmitting(false);
    
    // Reset form
    setMonto('');
    setCategoria('insumos');
    setDescripcion('');
    setFileName('');
    setFileObject(null);
    onClose();
  };

  return (
    <PopModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="💸 Registrar Nuevo Egreso" 
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Monto */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <DollarSign size={12} strokeWidth={3} />
            Monto Total (Bs.)
          </label>
          <input 
            type="number"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 font-mono font-bold text-xl shadow-[4px_4px_0px_0px_black] focus:outline-none focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_black] transition-all"
            required
          />
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <Tag size={12} strokeWidth={3} />
            Categoría del Gasto
          </label>
          <div className="relative">
            <select 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_black] transition-all appearance-none cursor-pointer"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
            {/* Custom arrow for select */}
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-black">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <FileText size={12} strokeWidth={3} />
            Descripción / Detalle
          </label>
          <textarea 
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Compra urgente de shampoo y toallas..."
            rows={3}
            className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_black] transition-all resize-none"
            required
          />
        </div>

        {/* Carga de Comprobante/Factura */}
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
            Comprobante / Recibo (Opcional)
          </label>
          <div className="relative w-full border-[3px] border-dashed border-black bg-slate-50 hover:bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            {fileName ? (
              <>
                <CheckCircle2 className="text-emerald-500 mb-2" size={24} strokeWidth={3} />
                <span className="font-bold text-sm text-slate-800 truncate max-w-[200px]">{fileName}</span>
                <span className="text-[10px] uppercase font-black text-slate-400 mt-1">Haz clic para cambiar archivo</span>
              </>
            ) : (
              <>
                <Upload className="text-slate-400 group-hover:text-black mb-2 transition-colors" size={24} strokeWidth={3} />
                <span className="font-bold text-sm text-slate-600">Subir foto o PDF</span>
                <span className="text-[10px] uppercase font-black text-slate-400 mt-1">Max 5MB</span>
              </>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-black border-[3px] border-black font-black uppercase text-xs py-3 rounded-xl shadow-[4px_4px_0px_0px_black] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_black] transition-all"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          
          <button 
            type="submit"
            className="flex-[2] bg-rose-400 hover:bg-rose-300 text-black border-[3px] border-black font-black uppercase text-xs py-3 rounded-xl shadow-[4px_4px_0px_0px_black] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_black] transition-all flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="animate-pulse">Registrando...</span>
            ) : (
              <>
                <CheckCircle2 size={16} strokeWidth={3} />
                Registrar Egreso
              </>
            )}
          </button>
        </div>
        
      </form>
    </PopModal>
  );
};

RegisterExpenseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired,
};

export default RegisterExpenseModal;
