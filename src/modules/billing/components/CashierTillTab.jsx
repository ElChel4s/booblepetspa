import React, { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabase';
import { useAuth } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';
import { Lock, Unlock, DollarSign, Calculator, AlertTriangle, ArrowRight } from 'lucide-react';

const CashierTillTab = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [activeTill, setActiveTill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemTotal, setSystemTotal] = useState(0);

  // Forms
  const [initialAmount, setInitialAmount] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [observations, setObservations] = useState('');

  const [isClosing, setIsClosing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTillState = async () => {
    setLoading(true);
    try {
      // Fetch open till
      const { data, error } = await supabase
        .from('arqueos_caja')
        .select('*')
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setActiveTill(data);

      if (data) {
        // Calculate system total based on today's invoices and expenses since opening
        // For simplicity in this demo, we'll fetch invoices and sum the cash payments
        const { data: facturas } = await supabase
          .from('facturas')
          .select('total, metodo_pago')
          .gte('created_at', data.fecha_apertura)
          .eq('estado', 'pagada');

        const { data: egresos } = await supabase
          .from('egresos_caja')
          .select('monto')
          .gte('fecha_egreso', data.fecha_apertura);

        let ingresosCash = 0;
        if (facturas) {
          facturas.forEach(f => {
            if (f.metodo_pago === 'efectivo' || f.metodo_pago === 'cash') {
              ingresosCash += Number(f.total || 0);
            }
          });
        }

        let totalEgresos = 0;
        if (egresos) {
          egresos.forEach(e => {
            totalEgresos += Number(e.monto || 0);
          });
        }

        const calculatedSystemTotal = Number(data.monto_inicial) + ingresosCash - totalEgresos;
        setSystemTotal(calculatedSystemTotal);
      }
    } catch (error) {
      console.error('Error fetching till:', error);
      showToast('Error al cargar estado de la caja', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTillState();
  }, []);

  const handleOpenTill = async () => {
    if (!initialAmount || isNaN(initialAmount)) {
      showToast('Ingresa un monto inicial válido', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('arqueos_caja').insert({
        usuario_id: currentUser.id,
        monto_inicial: Number(initialAmount),
        estado: 'abierta'
      });
      if (error) throw error;
      showToast('Caja abierta exitosamente', 'success');
      setInitialAmount('');
      fetchTillState();
    } catch (error) {
      console.error('Error al abrir caja:', error);
      showToast('Error al abrir la caja', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTill = async () => {
    if (!declaredAmount || isNaN(declaredAmount)) {
      showToast('Ingresa el monto final contado en caja', 'error');
      return;
    }
    setSaving(true);
    try {
      const declarado = Number(declaredAmount);
      const diferencia = declarado - systemTotal;

      const { error } = await supabase.from('arqueos_caja').update({
        fecha_cierre: new Date().toISOString(),
        monto_final_sistema: systemTotal,
        monto_final_declarado: declarado,
        diferencia: diferencia,
        observaciones: observations || null,
        estado: 'cerrada'
      }).eq('id', activeTill.id);

      if (error) throw error;
      showToast('Caja cerrada exitosamente', 'success');
      setIsClosing(false);
      setDeclaredAmount('');
      setObservations('');
      fetchTillState();
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      showToast('Error al cerrar la caja', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-black animate-pulse uppercase tracking-widest text-slate-400">Verificando estado de caja...</div>;
  }

  if (!activeTill) {
    return (
      <div className="bg-white border-[4px] border-black p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] animate-in slide-in-from-bottom-4 flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="flex-1 space-y-4">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl border-[4px] border-black shadow-[4px_4px_0px_0px_black] flex items-center justify-center -rotate-3 mb-6">
            <Unlock size={40} className="text-amber-500" strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Apertura de <span className="text-[var(--primary)]">Caja</span></h2>
          <p className="text-sm font-bold text-slate-500 max-w-md">La caja se encuentra cerrada. Para poder cobrar servicios o vender productos en el POS, necesitas abrir la caja indicando el monto de dinero base.</p>
        </div>
        
        <div className="w-full max-w-md bg-amber-50 border-[3px] border-black p-6 rounded-3xl shadow-[4px_4px_0px_0px_black]">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Monto Base / Fondo de Caja ($)</label>
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={20} strokeWidth={3} /></div>
            <input 
              type="number" 
              value={initialAmount} 
              onChange={e => setInitialAmount(e.target.value)} 
              placeholder="0.00" 
              className="w-full bg-white border-[3px] border-black rounded-2xl p-4 pl-12 font-black text-2xl shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all"
            />
          </div>
          <button 
            disabled={saving}
            onClick={handleOpenTill} 
            className="w-full py-4 bg-[var(--primary)] text-white border-[3.5px] border-black rounded-2xl font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
          >
            {saving ? 'Abriendo...' : 'Iniciar Turno y Abrir Caja'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-emerald-50 border-[4px] border-black p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Calculator size={200} />
        </div>
        
        <div className="flex-1 space-y-4 z-10">
          <div className="w-16 h-16 bg-emerald-200 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_black] flex items-center justify-center -rotate-3 mb-4">
            <Lock size={32} className="text-emerald-700" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Caja <span className="text-emerald-600">Abierta</span></h2>
            <p className="text-xs font-bold text-slate-500 uppercase mt-1">
              Abierta el {new Date(activeTill.fecha_apertura).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white border-[3px] border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_black]">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Monto Inicial</span>
              <span className="text-xl font-black text-slate-800">${Number(activeTill.monto_inicial).toFixed(2)}</span>
            </div>
            <div className="bg-emerald-100 border-[3px] border-black p-4 rounded-2xl shadow-[3px_3px_0px_0px_black]">
              <span className="text-[10px] font-black uppercase text-emerald-700 block mb-1">Total Esperado (Sistema)</span>
              <span className="text-2xl font-black text-emerald-900">${systemTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm z-10">
          {!isClosing ? (
            <button 
              onClick={() => setIsClosing(true)}
              className="w-full py-5 bg-black text-white border-[4px] border-black rounded-2xl font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center gap-3"
            >
              Realizar Arqueo <ArrowRight size={20} />
            </button>
          ) : (
            <div className="bg-white border-[4px] border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_black] animate-in slide-in-from-right-4">
              <h3 className="font-black uppercase italic mb-4">Cierre de Caja</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Efectivo Físico en Caja</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={16} strokeWidth={3} /></div>
                    <input 
                      type="number" 
                      value={declaredAmount} 
                      onChange={e => setDeclaredAmount(e.target.value)} 
                      placeholder="0.00" 
                      className="w-full bg-slate-50 border-[3px] border-black rounded-xl p-3 pl-10 font-black shadow-[3px_3px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[5px_5px_0px_0px_var(--primary)] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Observaciones (Faltantes/Sobrantes)</label>
                  <textarea 
                    value={observations} 
                    onChange={e => setObservations(e.target.value)} 
                    placeholder="Escribe el motivo de la diferencia si existe..." 
                    className="w-full bg-slate-50 border-[3px] border-black rounded-xl p-3 font-bold text-xs shadow-[3px_3px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[5px_5px_0px_0px_var(--primary)] transition-all h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  disabled={saving}
                  onClick={() => setIsClosing(false)}
                  className="px-4 py-3 bg-slate-100 border-[3px] border-black rounded-xl font-black uppercase text-[10px] hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  disabled={saving}
                  onClick={handleCloseTill}
                  className="flex-1 py-3 bg-rose-500 text-white border-[3px] border-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                >
                  {saving ? 'Cerrando...' : 'Confirmar Cierre'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierTillTab;
