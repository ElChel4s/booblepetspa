import React from 'react';
import { History, Shield, Globe, Clock, User } from 'lucide-react';

const AuditLogsSection = ({ logs, loading }) => {
  if (loading) return <div className="p-8 text-center font-black uppercase text-xs animate-pulse">Cargando Historial...</div>;
  
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-black/5 rounded-3xl p-10 text-center">
        <History size={40} className="mx-auto mb-4 text-slate-300" />
        <p className="text-[10px] font-black uppercase text-slate-400">No hay registros de actividad aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3">
        <History size={24} className="text-[var(--primary)]" /> Historial de Auditoría
      </h3>
      
      <div className="grid gap-3">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="bg-white border-2 border-black/10 p-4 rounded-2xl hover:border-black transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-tight">{log.accion}</span>
              </div>
              <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                <Clock size={10} /> {new Date(log.fecha).toLocaleString()}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-black/5">
              <div className="flex items-center gap-1">
                <Globe size={10} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase text-slate-500">IP: {log.ip_address}</span>
              </div>
              <div className="flex items-center gap-1">
                <User size={10} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase text-slate-500">Rol: {log.rol}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditLogsSection;
