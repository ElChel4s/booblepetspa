import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Shield, Globe, Clock, User, ArrowLeft, Terminal } from 'lucide-react';
import * as logsService from '../services/logsService';

const AuditDashboardView = ({ setView }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllLogs();
  }, []);

  const loadAllLogs = async () => {
    setLoading(true);
    const { data } = await logsService.getAllLogs(200);
    if (data) setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.perfiles?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('directory')} className="p-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Terminal className="text-[var(--primary)]" size={32} /> Central de <span className="text-[var(--primary)]">Auditoría</span>
            </h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Monitoreo global de actividad del sistema</p>
          </div>
        </div>

        <div className="flex bg-white border-2 border-black rounded-2xl p-2 shadow-[4px_4px_0px_0px_black] w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="BUSCAR ACCIÓN O USUARIO..." 
            className="bg-transparent border-none focus:outline-none text-[10px] font-black uppercase py-2 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <LoaderSpinner />
          <p className="text-[10px] font-black uppercase text-slate-400 mt-4 animate-pulse">Analizando registros de seguridad...</p>
        </div>
      ) : (
        <div className="bg-white border-[4px] border-black rounded-[3rem] shadow-[12px_12px_0px_0px_black] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-4 border-black">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Fecha / Hora</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Usuario</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Acción Realizada</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest">Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-500">{new Date(log.fecha).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="text-[10px] font-black uppercase">{log.perfiles?.nombre_completo || 'Sistema'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">{log.rol}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full border-2 border-black text-[9px] font-black uppercase ${
                        log.accion.includes('INICIO') ? 'bg-emerald-100 text-emerald-700' :
                        log.accion.includes('CIERRE') ? 'bg-slate-100 text-slate-600' :
                        log.accion.includes('DESACTIVÓ') ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Globe size={10} className="text-slate-400" />
                          <span className="text-[9px] font-bold">{log.ip_address}</span>
                        </div>
                        <p className="text-[7px] font-bold text-slate-300 uppercase truncate max-w-[150px]">{log.navegador}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const LoaderSpinner = () => (
  <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--primary)] rounded-full animate-spin"></div>
);

export default AuditDashboardView;
