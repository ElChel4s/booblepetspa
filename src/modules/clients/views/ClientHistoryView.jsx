import { useEffect, useState } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { getClientHistory, getGroomerHistory } from '../services/clientHistoryService';
import { Calendar, Clock, Scissors, Star, Camera, FileText, CheckCircle, AlertCircle, Loader, User } from 'lucide-react';
import dayjs from 'dayjs';

const ClientHistoryView = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadHistory();
    }
  }, [currentUser]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    const fetchFn = currentUser.rol === 'groomer' ? getGroomerHistory : getClientHistory;
    const { data, error } = await fetchFn(currentUser.id);
    if (error) {
      setError(error.message);
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader size={48} className="text-[var(--primary)] animate-spin mb-4" />
        <p className="text-sm font-black uppercase text-slate-500 tracking-widest">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <p className="text-sm font-black text-rose-500">{error}</p>
        <button onClick={loadHistory} className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase">
          Reintentar
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-4 border-4 border-black rotate-3">
          <FileText size={32} className="text-slate-400" />
        </div>
        <h3 className="text-2xl font-black uppercase italic mb-2">Aún no hay historial</h3>
        <p className="text-sm font-bold text-slate-500 text-center max-w-sm">
          Cuando tus mascotas completen sus citas de spa, podrás ver aquí sus fotos, reportes y dejar tu opinión.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">
          Historial de <span className="text-[var(--primary)]">{currentUser?.rol === 'groomer' ? 'Atenciones' : 'Visitas'}</span>
        </h1>
        <p className="text-sm font-bold text-slate-500">
          {currentUser?.rol === 'groomer' 
            ? 'Revisa el reporte de grooming, fotos de antes/después y los servicios que has realizado a las mascotas.'
            : 'Revisa el reporte de grooming, fotos de antes/después y el servicio de tus mascotas.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {history.map((cita) => (
          <HistoryCard key={cita.id} cita={cita} />
        ))}
      </div>
    </div>
  );
};

const HistoryCard = ({ cita }) => {
  const mascota = cita.mascotas;
  const servicio = cita.servicios;
  const ficha = cita.fichas_grooming?.[0]; // Supabase joins to array even if 1-to-1 if not properly defined or depending on select
  const fichaData = ficha || null;
  const fotos = fichaData?.fotos_grooming || [];
  const encuesta = cita.encuestas_satisfaccion?.[0] || null;
  const groomer = cita.groomer;

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'completada': return 'bg-emerald-400 text-black border-black';
      case 'cancelada': return 'bg-rose-400 text-black border-black';
      case 'no_show': return 'bg-amber-400 text-black border-black';
      default: return 'bg-slate-200 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-transform hover:-translate-y-1">
      {/* Header */}
      <div className="p-4 border-b-4 border-black bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mascota?.foto_perfil_url ? (
            <img src={mascota.foto_perfil_url} alt={mascota.nombre} className="w-12 h-12 rounded-xl object-cover border-2 border-black" />
          ) : (
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border-2 border-black">
              <span className="font-black text-indigo-500 text-xl">{mascota?.nombre?.charAt(0)}</span>
            </div>
          )}
          <div>
            <h3 className="font-black text-lg leading-tight">{mascota?.nombre}</h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
              <Calendar size={12} /> {dayjs(cita.fecha_hora_inicio).format('DD MMM YYYY')}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase ${getStatusColor(cita.estado)}`}>
          {cita.estado.replace('_', ' ')}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Service Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
              <Scissors size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Servicio</p>
              <p className="font-black text-sm">{servicio?.nombre || 'General'}</p>
            </div>
          </div>
          {groomer && (
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Atendido por</p>
              <div className="flex items-center gap-1 mt-1">
                {groomer.avatar_url ? (
                  <img src={groomer.avatar_url} className="w-5 h-5 rounded-full border border-black" />
                ) : (
                  <User size={16} className="text-slate-500" />
                )}
                <span className="text-xs font-bold">{groomer.nombre_completo}</span>
              </div>
            </div>
          )}
        </div>

        {/* Grooming Report */}
        {fichaData && (
          <div className="bg-indigo-50 rounded-2xl p-4 border-2 border-indigo-200">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 mb-2">
              <FileText size={14} /> Reporte de Grooming
            </h4>
            <div className="space-y-2 text-sm text-indigo-900 font-medium">
              {fichaData.observaciones_groomer && (
                <p><span className="font-bold">Observaciones:</span> {fichaData.observaciones_groomer}</p>
              )}
              {fichaData.recomendaciones_post && (
                <p><span className="font-bold">Recomendación:</span> {fichaData.recomendaciones_post}</p>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        {fotos.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-2">
              <Camera size={14} /> Fotos de la sesión
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {fotos.map((foto, idx) => (
                <div key={idx} className="relative min-w-[100px] h-24 rounded-xl overflow-hidden border-2 border-black group">
                  <img src={foto.url_foto} alt={foto.tipo_momento} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white uppercase">{foto.tipo_momento}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Survey */}
        {cita.estado === 'completada' && (
          <div className="pt-2 border-t-2 border-dashed border-slate-200">
            {encuesta ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-500 border-2 border-amber-300">
                  <span className="font-black text-lg">{encuesta.puntuacion_nps}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-500">Tu calificación</p>
                  <p className="text-xs font-bold text-slate-600 italic truncate max-w-[200px]">
                    "{encuesta.comentario || 'Sin comentario'}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-500">¿Qué tal lo hicimos?</p>
                </div>
                <button className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-800 transition-colors">
                  Calificar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHistoryView;
