import { useAuth } from '../store/AuthContext';

export const DevToggle = () => {
  const { rolActual, setRolActual } = useAuth();

  if (import.meta.env.PROD) return null; // Desaparece en producción sin dejar rastro

  return (
    <div className="fixed bottom-6 right-6 z-[9999] group">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
      <div className="relative bg-white/90 backdrop-blur-sm border-2 border-white p-3 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 flex flex-col gap-2 w-48">
        <span className="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500 uppercase tracking-wider text-center">
          Bypass de Rol
        </span>
        <select 
          value={rolActual}
          onChange={(e) => setRolActual(e.target.value)}
          className="appearance-none bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-purple-400 outline-none w-full text-center shadow-inner"
        >
          <option value="admin">👑 Admin</option>
          <option value="recepcion">🛎️ Recepción</option>
          <option value="groomer">✂️ Groomer</option>
          <option value="cliente">🐶 Cliente</option>
        </select>
      </div>
    </div>
  );
};
