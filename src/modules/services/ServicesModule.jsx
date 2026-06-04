import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Scissors,
  Zap,
  Edit,
  Trash2,
  X,
  Ruler,
  ShieldAlert,
  DollarSign,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useAuth } from '../../store/AuthContext';
import {
  createService,
  updateService,
  deleteService,
  createModifier,
  updateModifier,
  deleteModifier,
} from '../agenda/services/adminAgendaService';

const THEMES = {
  menta: {
    id: 'menta',
    vars: {
      '--bg': '#F0F4F8',
      '--text': '#0f172a',
      '--card': '#ffffff',
      '--primary': '#14b8a6',
      '--secondary': '#fbbf24',
      '--shadow': '#0f172a',
    },
  },
};

const BrutalInput = ({ label, type = 'text', placeholder, value, onChange, icon: Icon }) => (
  <div className="flex flex-col gap-2 mb-4 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={18} strokeWidth={3} /></div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-50 border-[3.5px] border-black rounded-2xl p-3 ${Icon ? 'pl-11' : 'pl-4'} font-bold text-sm shadow-[4px_4px_0px_0px_black] focus:outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_var(--primary)] transition-all`}
      />
    </div>
  </div>
);

const PopModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-[6px] border-black rounded-[3.5rem] shadow-[15px_15px_0px_0px_black] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:rotate-90 transition-transform bg-rose-100 text-rose-600 rounded-full border-2 border-black">
          <X size={20} strokeWidth={4} />
        </button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 pr-12 border-b-8 border-slate-100 pb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;
  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className={`bg-white border-[6px] border-black rounded-[3rem] ${isDanger ? 'shadow-[12px_12px_0px_0px_#f43f5e]' : 'shadow-[12px_12px_0px_0px_var(--secondary)]'} w-full max-w-md p-8 relative animate-in zoom-in-95`}>
        <div className={`w-20 h-20 ${isDanger ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'} rounded-3xl border-[4px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_black] -rotate-3`}>
          <AlertTriangle size={40} strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black uppercase italic leading-none mb-2">{title}</h3>
        <p className="text-sm font-bold text-slate-500 mb-8">{message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 border-[3.5px] border-black rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className={`flex-1 py-4 ${isDanger ? 'bg-rose-500' : 'bg-[var(--secondary)]'} text-white border-[3.5px] border-black rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all`}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const ServicesModule = () => {
  const themeVars = THEMES.menta.vars;
  const { currentUser } = useAuth();
  const actor = currentUser?.id ? { id: currentUser.id, rol: currentUser.rol } : null;

  const [dbServices, setDbServices] = useState([]);
  const [dbModifiers, setDbModifiers] = useState([]);
  const [dbTasks, setDbTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Constructor de Pasos
  const [serviceSteps, setServiceSteps] = useState([]);
  const [selectedTaskToAdd, setSelectedTaskToAdd] = useState('');

  const fetchServicesAndModifiers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase no está inicializado');
      }
      const [srvRes, modRes, taskRes] = await Promise.all([
        supabase.from('servicios').select('*').order('nombre', { ascending: true }),
        supabase.from('modificadores_servicio').select('*').order('criterio', { ascending: true }),
        supabase.from('tareas_disponibles').select('*').order('nombre', { ascending: true }),
      ]);

      if (srvRes.error) throw srvRes.error;
      if (modRes.error) throw modRes.error;
      if (taskRes.error) throw taskRes.error;

      setDbServices(srvRes.data || []);
      setDbModifiers(modRes.data || []);
      
      let tasksData = taskRes.data || [];
      if (tasksData.length === 0) {
        // Sembrar tareas iniciales de prueba si está vacío
        const defaultTasks = [
          { nombre: 'Corte de Uñas y Limpieza de Oídos' },
          { nombre: 'Baño (1er y 2do Shampoo)' },
          { nombre: 'Secado y Cepillado' },
          { nombre: 'Corte / Arreglo Final' }
        ];
        const { data: seeded, error: seedErr } = await supabase
          .from('tareas_disponibles')
          .insert(defaultTasks)
          .select('*');
        
        if (!seedErr && seeded) {
          tasksData = seeded;
        }
      }
      setDbTasks(tasksData);
    } catch (err) {
      console.error('[ServicesModule] Error cargando datos:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndModifiers();
  }, []);

  const services = useMemo(() => {
    return dbServices.map((service) => ({
      id: service.id,
      type: 'service',
      nombre: service.nombre,
      precio: Number(service.precio_base || 0),
      duracion: Number(service.duracion_base_minutos || 0),
      cat: service.categoria || 'General',
      icon: Scissors,
    }));
  }, [dbServices]);

  const rules = useMemo(() => {
    return dbModifiers.map((rule) => ({
      id: rule.id,
      type: 'rule',
      nombre: rule.criterio || 'Regla dinámica',
      duracion: String(rule.tiempo_extra_minutos ?? 0),
      isPercent: Boolean(rule.tiempo_es_porcentaje),
      precio: String(rule.precio_adicional ?? 0),
      cat: rule.valor || 'Modificador',
      icon: rule.criterio?.toLowerCase().includes('tam') ? Ruler : ShieldAlert,
    }));
  }, [dbModifiers]);

  const openForm = async (type, item = null) => {
    if (item) {
      setEditingItem(item);
      if (type === 'service') {
        setFormValues({
          nombre: item.nombre || '',
          categoria: item.cat || '',
          precio_base: item.precio ?? 0,
          duracion_base_minutos: item.duracion ?? 0,
        });

        // Cargar pasos de la base de datos para este servicio
        const { data: pasos, error: fetchPasosErr } = await supabase
          .from('pasos_servicio')
          .select('id, tarea_id, orden, tarea:tareas_disponibles(id, nombre)')
          .eq('servicio_id', item.id)
          .order('orden', { ascending: true });

        if (!fetchPasosErr && pasos) {
          setServiceSteps(
            pasos.map((p) => ({
              id: p.id,
              tarea_id: p.tarea_id,
              nombre: p.tarea?.nombre || 'Tarea sin nombre'
            }))
          );
        } else {
          setServiceSteps([]);
        }
      } else {
        setFormValues({
          criterio: item.nombre || '',
          valor: item.cat || '',
          tiempo_extra_minutos: Number(item.duracion || 0),
          precio_adicional: Number(item.precio || 0),
          tiempo_es_porcentaje: Boolean(item.isPercent),
          precio_es_porcentaje: Boolean(item.isPercent),
        });
      }
    } else {
      setEditingItem({ type, isPercent: type === 'rule' });
      if (type === 'service') {
        setServiceSteps([]);
        setFormValues({ nombre: '', categoria: '', precio_base: 0, duracion_base_minutos: 60 });
      } else {
        setFormValues({ criterio: '', valor: '', tiempo_extra_minutos: 0, precio_adicional: 0, tiempo_es_porcentaje: false, precio_es_porcentaje: false });
      }
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormValues(null);
    setServiceSteps([]);
    setSelectedTaskToAdd('');
  };

  const handleAddStep = () => {
    if (!selectedTaskToAdd) return;
    const task = dbTasks.find((t) => t.id === selectedTaskToAdd);
    if (!task) return;

    if (serviceSteps.some((step) => step.tarea_id === task.id)) {
      showFeedback('error', 'Esta tarea ya ha sido añadida a la secuencia');
      return;
    }

    setServiceSteps((prev) => [...prev, { tarea_id: task.id, nombre: task.nombre }]);
    setSelectedTaskToAdd('');
  };

  const handleRemoveStep = (index) => {
    setServiceSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStepUp = (index) => {
    if (index === 0) return;
    setServiceSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveStepDown = (index) => {
    setServiceSteps((prev) => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDrop = (e, targetIndex) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    setServiceSteps((prev) => {
      const copy = [...prev];
      const [dragged] = copy.splice(sourceIndex, 1);
      copy.splice(targetIndex, 0, dragged);
      return copy;
    });
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setEditingItem(null);
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const submitCatalog = async () => {
    if (!editingItem || !formValues) return;
    setSaving(true);
    setFeedback(null);

    let result;
    if (editingItem.type === 'service') {
      const payload = {
        nombre: formValues.nombre,
        categoria: formValues.categoria,
        precio_base: formValues.precio_base,
        duracion_base_minutos: formValues.duracion_base_minutos,
      };
      result = editingItem.id
        ? await updateService(editingItem.id, payload, actor)
        : await createService(payload, actor);
    } else {
      const payload = {
        servicio_id: null,
        criterio: formValues.criterio,
        valor: formValues.valor,
        tiempo_extra_minutos: formValues.tiempo_extra_minutos,
        precio_adicional: formValues.precio_adicional,
        tiempo_es_porcentaje: formValues.tiempo_es_porcentaje,
        precio_es_porcentaje: formValues.precio_es_porcentaje,
      };
      result = editingItem.id
        ? await updateModifier(editingItem.id, payload, actor)
        : await createModifier(payload, actor);
    }

    if (result?.error) {
      showFeedback('error', result.error.message || 'No se pudo guardar');
    } else {
      // Guardar la secuencia de pasos en pasos_servicio si es un servicio
      if (editingItem.type === 'service' && result.data) {
        const serviceId = result.data.id;
        
        // 1. Limpiar los pasos anteriores
        const { error: delErr } = await supabase
          .from('pasos_servicio')
          .delete()
          .eq('servicio_id', serviceId);
        
        if (delErr) {
          console.error('Error al eliminar pasos anteriores:', delErr);
        }

        // 2. Insertar el nuevo flujo con el orden respectivo
        if (serviceSteps.length > 0) {
          const stepsPayload = serviceSteps.map((step, index) => ({
            servicio_id: serviceId,
            tarea_id: step.tarea_id,
            orden: index
          }));

          const { error: insErr } = await supabase
            .from('pasos_servicio')
            .insert(stepsPayload);

          if (insErr) {
            console.error('Error al insertar nuevos pasos:', insErr);
            showFeedback('error', 'El servicio se guardó, pero no se pudo persistir la secuencia de pasos.');
            setSaving(false);
            return;
          }
        }
      }

      showFeedback('success', 'Guardado correctamente');
      closeForm();
      await fetchServicesAndModifiers();
    }

    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!editingItem) return;
    setSaving(true);
    setFeedback(null);

    let result;
    if (editingItem.type === 'service') {
      result = await deleteService(editingItem.id, actor);
    } else {
      result = await deleteModifier(editingItem.id, actor);
    }

    if (result?.error) {
      showFeedback('error', result.error.message || 'No se pudo eliminar');
    } else {
      showFeedback('success', 'Eliminado correctamente');
      closeDelete();
      await fetchServicesAndModifiers();
    }

    setSaving(false);
  };

  const handleDeleteClick = (item) => {
    setEditingItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <div style={themeVars} className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8 pb-10">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">
          Catálogo de <span className="text-[var(--primary)]">Servicios</span>
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
          Gestiona los servicios base y las reglas dinámicas de tu spa
        </p>
      </div>

      {loading && (
        <div className="bg-white border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] animate-pulse">
          Sincronizando con base de datos...
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-[3px] border-black rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] text-rose-700 flex items-center gap-2">
          <AlertTriangle size={16} /> Error: {error.message || 'No se pudieron cargar los servicios.'}
        </div>
      )}

      {feedback && (
        <div className={`border-[3px] rounded-2xl px-4 py-3 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_black] ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-700 text-emerald-700' : 'bg-rose-50 border-rose-700 text-rose-700'}`}>
          {feedback.message}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Servicios Base */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black uppercase italic text-xl flex items-center gap-2">
                <Scissors size={20} className="text-[var(--primary)]" /> Servicios Base
              </h3>
              <button onClick={() => openForm('service')} className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl border-[3px] border-black font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 active:scale-95">
                <Plus size={16} strokeWidth={3} /> Nuevo Servicio
              </button>
            </div>

            {services.length === 0 ? (
              <div className="bg-white border-[3px] border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_black] text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No hay servicios registrados en la base de datos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((srv) => {
                  const SrvIcon = srv.icon;
                  return (
                    <div key={srv.id} className="bg-white border-[4px] border-black p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_black] group hover:-translate-y-1 transition-transform">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-3 rounded-2xl border-2 border-black"><SrvIcon size={20} /></div>
                          <div>
                            <h4 className="text-lg font-black uppercase italic leading-none">{srv.nombre}</h4>
                            <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-black uppercase tracking-widest mt-1 inline-block">{srv.cat}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openForm('service', srv)} className="p-2 bg-slate-50 border-2 border-black rounded-lg hover:bg-[var(--secondary)] transition-all"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteClick(srv)} className="p-2 bg-rose-50 border-2 border-black rounded-lg hover:bg-rose-500 hover:text-white text-rose-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="flex gap-4 border-t-2 border-slate-100 pt-3">
                        <div className="flex-1 bg-slate-50 p-2 rounded-xl border-2 border-black/5">
                          <span className="block text-[8px] font-black uppercase text-slate-400">Duración Est.</span>
                          <span className="font-black text-sm flex items-center gap-1"><Timer size={12} /> {srv.duracion} min</span>
                        </div>
                        <div className="flex-1 bg-slate-50 p-2 rounded-xl border-2 border-black/5 text-right">
                          <span className="block text-[8px] font-black uppercase text-slate-400">Precio Base</span>
                          <span className="font-black text-lg text-emerald-500 leading-none">${srv.precio}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reglas Dinámicas */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black uppercase italic text-xl flex items-center gap-2">
                <Zap size={20} className="text-[var(--secondary)]" /> Reglas Dinámicas
              </h3>
              <button onClick={() => openForm('rule')} className="bg-[var(--secondary)] text-black px-4 py-2 rounded-xl border-[3px] border-black font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 active:scale-95">
                <Plus size={16} strokeWidth={3} /> Nueva Regla
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="bg-white border-[3px] border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_black] text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No hay modificadores registrados en la base de datos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => {
                  const RuleIcon = rule.icon;
                  return (
                    <div key={rule.id} className="bg-amber-50 border-[4px] border-black p-5 rounded-[2rem] shadow-[6px_6px_0px_0px_var(--secondary)] flex flex-col sm:flex-row justify-between gap-4 group hover:-translate-y-1 transition-transform">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl border-2 border-black"><RuleIcon size={20} /></div>
                        <div>
                          <h4 className="text-lg font-black uppercase italic leading-none">{rule.nombre}</h4>
                          <span className="text-[8px] bg-amber-200 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block">{rule.cat}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-rose-600 flex items-center gap-1"><Timer size={10} /> +{rule.duracion}{rule.isPercent ? '%' : 'm'}</span>
                          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><DollarSign size={10} /> +{rule.precio}</span>
                        </div>
                        <div className="flex gap-2 flex-col sm:flex-row opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openForm('rule', rule)} className="p-2 bg-white border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteClick(rule)} className="p-2 bg-white border-2 border-black rounded-lg hover:bg-rose-500 hover:text-white text-rose-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Formulario */}
      <PopModal isOpen={isFormOpen} onClose={closeForm} title={editingItem?.id ? (editingItem.type === 'service' ? 'Editar Servicio' : 'Editar Regla') : (editingItem?.type === 'service' ? 'Nuevo Servicio' : 'Nueva Regla')}>
        {editingItem?.type === 'service' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Datos del Servicio */}
            <div className="flex flex-col gap-4">
              <BrutalInput label="Nombre" placeholder="Ej. Baño Premium" value={formValues?.nombre || ''} onChange={(event) => setFormValues((prev) => ({ ...prev, nombre: event.target.value }))} />
              <div className="flex gap-4">
                <BrutalInput label="Categoría" placeholder="Ej. Spa" value={formValues?.categoria || ''} onChange={(event) => setFormValues((prev) => ({ ...prev, categoria: event.target.value }))} />
                <BrutalInput label="Precio Base" type="number" placeholder="0.00" value={formValues?.precio_base ?? ''} onChange={(event) => setFormValues((prev) => ({ ...prev, precio_base: event.target.value }))} icon={DollarSign} />
              </div>
              <BrutalInput label="Duración (Minutos)" type="number" placeholder="60" value={formValues?.duracion_base_minutos ?? ''} onChange={(event) => setFormValues((prev) => ({ ...prev, duracion_base_minutos: event.target.value }))} icon={Timer} />
              
              <button onClick={submitCatalog} disabled={saving} className="mt-4 py-4 bg-[var(--primary)] text-white border-[4px] border-black rounded-2xl font-black text-sm uppercase shadow-[6px_6px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-70 active:scale-95 cursor-pointer">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

            {/* Columna Derecha: Constructor de Pasos */}
            <div className="border-[4px] border-black p-5 rounded-[2.5rem] bg-amber-50 shadow-[6px_6px_0px_0px_black] flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-black uppercase italic mb-3 border-b-2 border-black/10 pb-1 flex items-center gap-2">
                  🛠️ Constructor de Pasos
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 leading-normal">
                  Define el flujo ordenado de tareas para el servicio. Arrastra las filas o usa las flechas para ordenar.
                </p>

                {/* Dropdown selector de Tarea */}
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedTaskToAdd}
                    onChange={(e) => setSelectedTaskToAdd(e.target.value)}
                    className="flex-1 bg-white border-2 border-black rounded-xl p-2 font-bold text-xs"
                  >
                    <option value="">Seleccionar Tarea...</option>
                    {dbTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="bg-black text-white px-4 py-2 rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_var(--primary)] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
                  >
                    + Añadir
                  </button>
                </div>

                {/* Lista de Pasos */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {serviceSteps.length === 0 ? (
                    <div className="text-center py-6 text-xs font-bold text-slate-400 uppercase italic border-2 border-dashed border-slate-300 rounded-xl bg-white/50">
                      Sin pasos asignados
                    </div>
                  ) : (
                    serviceSteps.map((step, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, idx)}
                        className="bg-white border-2 border-black rounded-xl p-2 flex justify-between items-center shadow-sm cursor-move active:scale-95 transition-all hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black truncate max-w-[130px] leading-tight text-slate-800">
                            {step.nombre}
                          </span>
                        </div>

                        {/* Controles de Orden y Borrado */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStepUp(idx)}
                            disabled={idx === 0}
                            className="p-1 bg-slate-100 hover:bg-slate-200 rounded border border-black text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Subir"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStepDown(idx)}
                            disabled={idx === serviceSteps.length - 1}
                            className="p-1 bg-slate-100 hover:bg-slate-200 rounded border border-black text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Bajar"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="p-1 bg-rose-100 hover:bg-rose-200 border border-black rounded text-rose-600 cursor-pointer"
                            title="Eliminar"
                          >
                            <X size={10} strokeWidth={4} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <BrutalInput label="Nombre" placeholder="Ej. Mascota Gigante" value={formValues?.criterio || ''} onChange={(event) => setFormValues((prev) => ({ ...prev, criterio: event.target.value }))} />
            <div className="flex gap-4">
              <BrutalInput label="Categoría" placeholder="Ej. Modificador" value={formValues?.valor || ''} onChange={(event) => setFormValues((prev) => ({ ...prev, valor: event.target.value }))} />
              <BrutalInput label="Precio" type="number" placeholder="0.00" value={formValues?.precio_adicional ?? ''} onChange={(event) => setFormValues((prev) => ({ ...prev, precio_adicional: event.target.value }))} icon={DollarSign} />
            </div>

            <div className="flex flex-col gap-2 p-4 bg-amber-50 rounded-2xl border-[3px] border-amber-200">
              <label htmlFor="rule-time-adjust" className="text-[10px] font-black uppercase tracking-widest text-amber-800">Ajuste de Tiempo</label>
              <div className="flex items-center gap-4">
                <input id="rule-time-adjust" type="number" className="flex-1 bg-white border-2 border-black rounded-xl p-3 font-bold" placeholder="Valor" value={formValues?.tiempo_extra_minutos ?? ''} onChange={(event) => setFormValues((prev) => ({ ...prev, tiempo_extra_minutos: event.target.value }))} />
                <div className="flex bg-white border-2 border-black rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setFormValues((prev) => ({ ...prev, tiempo_es_porcentaje: false, precio_es_porcentaje: false }))} className={`px-4 py-3 font-black text-xs ${formValues?.tiempo_es_porcentaje ? 'hover:bg-slate-100' : 'bg-black text-white'}`}>MIN</button>
                  <button type="button" onClick={() => setFormValues((prev) => ({ ...prev, tiempo_es_porcentaje: true, precio_es_porcentaje: true }))} className={`px-4 py-3 font-black text-xs border-l-2 border-black ${formValues?.tiempo_es_porcentaje ? 'bg-black text-white' : 'hover:bg-slate-100'}`}>%</button>
                </div>
              </div>
            </div>

            <button onClick={submitCatalog} disabled={saving} className={`mt-4 py-4 bg-[var(--secondary)] text-black border-[4px] border-black rounded-2xl font-black text-sm uppercase shadow-[6px_6px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-70 active:scale-95`}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </PopModal>

      {/* Modal de Eliminación */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="¿Eliminar Item?"
        message={`Estás a punto de eliminar "${editingItem?.nombre || 'este item'}". Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default ServicesModule;
