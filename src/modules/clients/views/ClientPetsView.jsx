import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { useToast } from '../../../store/ToastContext';
import { useNavigation } from '../../../store/NavigationContext';
import {
  PawPrint, Plus, X, Check, ChevronRight,
  Scissors, AlertTriangle, Edit3, Trash2,
  Heart, Zap, Cat, Dog
} from 'lucide-react';
import { getPetsByOwner, createPet, updatePet, deletePet } from '../services/clientPetsService';

const ESPECIES = ['Perro', 'Gato', 'Conejo', 'Ave', 'Otro'];
const TAMANOS = ['Pequeño', 'Mediano', 'Grande', 'Gigante'];
const TEMPERAMENTOS = ['Tranquilo', 'Activo', 'Nervioso', 'Agresivo', 'Juguetón'];

const PET_EMOJI = { Perro: '🐶', Gato: '🐱', Conejo: '🐰', Ave: '🦜', Otro: '🐾' };

const EMPTY_FORM = {
  nombre: '',
  especie: 'Perro',
  raza: '',
  tamano: 'Mediano',
  temperamento: 'Tranquilo',
  alergias: '',
};

const PetCard = ({ pet, onSelect, onEdit, onDelete }) => {
  const emoji = PET_EMOJI[pet.especie] || '🐾';
  return (
    <div className="bg-white border-[3.5px] border-black rounded-[2rem] shadow-[6px_6px_0px_0px_black] overflow-hidden group hover:-translate-y-1 transition-all duration-200">
      {/* Top color band */}
      <div className="h-2 bg-[var(--primary)]" />

      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            {pet.foto_perfil_url ? (
              <img
                src={pet.foto_perfil_url}
                alt={pet.nombre}
                className="w-16 h-16 rounded-2xl border-[3px] border-black object-cover shadow-[3px_3px_0px_0px_black]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-[3px] border-black bg-[var(--secondary)] flex items-center justify-center shadow-[3px_3px_0px_0px_black] text-2xl">
                {emoji}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black uppercase italic text-xl tracking-tighter leading-none text-slate-900 truncate">
              {pet.nombre}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {pet.especie}{pet.raza ? ` · ${pet.raza}` : ''}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pet.tamano && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 border-[2px] border-black px-2 py-1 rounded-lg">
              {pet.tamano}
            </span>
          )}
          {pet.temperamento && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--primary)]/10 border-[2px] border-[var(--primary)] text-[var(--primary)] px-2 py-1 rounded-lg">
              {pet.temperamento}
            </span>
          )}
          {pet.alergias && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 border-[2px] border-amber-400 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1">
              <AlertTriangle size={9} strokeWidth={3} /> Alergias
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t-[2.5px] border-black/10 pt-4">
          <button
            onClick={() => onEdit(pet)}
            className="flex-1 py-2.5 bg-white border-[3px] border-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0px_0px_black] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <Edit3 size={12} strokeWidth={3} /> Editar
          </button>
          <button
            onClick={() => onDelete(pet)}
            className="p-2.5 bg-white border-[3px] border-rose-400 rounded-xl shadow-[3px_3px_0px_0px_#fb7185] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all text-rose-500"
          >
            <Trash2 size={14} strokeWidth={3} />
          </button>
          <button
            onClick={() => onSelect(pet)}
            className="py-2.5 px-3 bg-black text-white border-[3px] border-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0px_0px_var(--primary)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1.5"
          >
            Ver <ChevronRight size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PetFormModal = ({ pet, onSave, onClose, saving }) => {
  const [form, setForm] = useState(pet ? {
    nombre: pet.nombre || '',
    especie: pet.especie || 'Perro',
    raza: pet.raza || '',
    tamano: pet.tamano || 'Mediano',
    temperamento: pet.temperamento || 'Tranquilo',
    alergias: pet.alergias || '',
  } : { ...EMPTY_FORM });

  const isEditing = !!pet;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] w-full max-w-md animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-[3.5px] border-black">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                {isEditing ? 'Editando' : 'Nueva mascota'}
              </p>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                {isEditing ? pet.nombre : 'Agregar'} <span className="text-[var(--primary)]">Peludito</span>
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Nombre *
              </label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Luna, Max, Coco..."
                className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl font-black text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
              />
            </div>

            {/* Especie */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Especie</label>
              <div className="flex flex-wrap gap-2">
                {ESPECIES.map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, especie: e })}
                    className={`px-3 py-2 rounded-xl border-[3px] font-black text-[10px] uppercase tracking-wider transition-all ${
                      form.especie === e
                        ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_var(--primary)]'
                        : 'bg-white border-black hover:bg-slate-50'
                    }`}
                  >
                    {PET_EMOJI[e]} {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Raza */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Raza</label>
              <input
                value={form.raza}
                onChange={(e) => setForm({ ...form, raza: e.target.value })}
                placeholder="Ej: Golden Retriever, Persa..."
                className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl font-black text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all"
              />
            </div>

            {/* Tamaño */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Tamaño</label>
              <div className="flex gap-2">
                {TAMANOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tamano: t })}
                    className={`flex-1 py-2 rounded-xl border-[3px] font-black text-[9px] uppercase tracking-wider transition-all ${
                      form.tamano === t
                        ? 'bg-[var(--primary)] text-white border-black shadow-[3px_3px_0px_0px_black]'
                        : 'bg-white border-black hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperamento */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Temperamento</label>
              <div className="flex flex-wrap gap-2">
                {TEMPERAMENTOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, temperamento: t })}
                    className={`px-3 py-2 rounded-xl border-[3px] font-black text-[9px] uppercase tracking-wider transition-all ${
                      form.temperamento === t
                        ? 'bg-[var(--secondary)] border-black shadow-[3px_3px_0px_0px_black] text-black'
                        : 'bg-white border-black hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Alergias */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Alergias / Condiciones
              </label>
              <textarea
                value={form.alergias}
                onChange={(e) => setForm({ ...form, alergias: e.target.value })}
                placeholder="Ej: Alergia al champú de lavanda, problemas de piel..."
                rows={2}
                className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-xl font-black text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--primary)] transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-white border-[3.5px] border-black rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 transition-all active:translate-y-1 active:shadow-none"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={!form.nombre.trim() || saving}
              className="flex-1 py-3.5 bg-[var(--primary)] text-white border-[3.5px] border-black rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? '...' : <><Check size={16} strokeWidth={3} /> {isEditing ? 'Guardar' : 'Agregar'}</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const DeleteConfirmModal = ({ pet, onConfirm, onClose, saving }) => (
  <>
    <div className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm" onClick={onClose} />
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] w-full max-w-sm animate-in zoom-in-95 duration-200 p-8 text-center">
        <div className="text-5xl mb-4">😿</div>
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
          ¿Eliminar a <span className="text-rose-500">{pet.nombre}</span>?
        </h3>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 leading-relaxed">
          Esta acción no se puede deshacer. Se eliminarán todos los datos de tu peludito.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border-[3.5px] border-black rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 py-3.5 bg-rose-500 text-white border-[3.5px] border-black rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={14} strokeWidth={3} /> {saving ? '...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  </>
);

// ── Vista principal ────────────────────────────────────────────────────────────
const ClientPetsView = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { setActiveModule } = useNavigation();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [deletingPet, setDeletingPet] = useState(null);

  const loadPets = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    console.log('[ClientPetsView] Fetching pets for owner ID:', currentUser.id);
    const { data, error } = await getPetsByOwner(currentUser.id);
    console.log('[ClientPetsView] getPetsByOwner response:', { data, error });
    if (!error) {
      setPets(data || []);
    } else {
      console.error('[ClientPetsView] Error fetching pets:', error);
      showToast('Error al obtener mascotas: ' + error.message, 'error');
    }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { loadPets(); }, [loadPets]);

  const handleSave = async (form) => {
    setSaving(true);
    let result;
    if (editingPet) {
      result = await updatePet(editingPet.id, form);
    } else {
      result = await createPet(currentUser.id, form);
    }
    setSaving(false);

    if (result.error) {
      showToast(result.error.message || 'Error al guardar', 'error');
    } else {
      showToast(editingPet ? 'Datos actualizados 🐾' : '¡Nuevo peludito registrado! 🐶', 'success');
      setShowForm(false);
      setEditingPet(null);
      loadPets();
    }
  };

  const handleDelete = async () => {
    if (!deletingPet) return;
    setSaving(true);
    const { error } = await deletePet(deletingPet.id);
    setSaving(false);
    if (error) {
      showToast('Error al eliminar la mascota', 'error');
    } else {
      showToast(`${deletingPet.nombre} fue eliminado`, 'success');
      setDeletingPet(null);
      loadPets();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl animate-bounce">🐾</div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Cargando tus peluditos...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Mis animales</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
            Mis <span className="text-[var(--primary)]">Mascotas</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
            {pets.length === 0
              ? 'Aún no tienes mascotas registradas'
              : `${pets.length} peludito${pets.length !== 1 ? 's' : ''} registrado${pets.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => { setEditingPet(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-black text-white px-5 py-3.5 rounded-2xl border-[3.5px] border-black font-black text-[10px] uppercase tracking-widest shadow-[5px_5px_0px_0px_var(--primary)] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none"
        >
          <Plus size={16} strokeWidth={3} /> Agregar
        </button>
      </div>

      {/* Empty state */}
      {pets.length === 0 && (
        <div className="bg-white border-[4px] border-black rounded-[3rem] shadow-[8px_8px_0px_0px_black] p-16 text-center">
          <div className="text-7xl mb-6">🐾</div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-3">
            ¡Registra tu <span className="text-[var(--primary)]">primer peludito</span>!
          </h2>
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-8 max-w-xs mx-auto leading-relaxed">
            Agrega tus mascotas para poder agendar citas de spa y llevar su historial.
          </p>
          <button
            onClick={() => { setEditingPet(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-8 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase tracking-widest shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 transition-all"
          >
            <Plus size={18} strokeWidth={3} /> Agregar mascota
          </button>
        </div>
      )}

      {/* Pet grid */}
      {pets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onSelect={() => setActiveModule('reservar')}
              onEdit={(p) => { setEditingPet(p); setShowForm(true); }}
              onDelete={(p) => setDeletingPet(p)}
            />
          ))}
        </div>
      )}

      {/* Tip banner si tienen mascotas */}
      {pets.length > 0 && (
        <div className="mt-8 bg-[var(--secondary)] border-[3.5px] border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_black] flex items-center gap-4">
          <Zap size={28} className="text-black shrink-0 fill-black" />
          <div>
            <p className="text-[11px] font-black uppercase text-black tracking-wider leading-relaxed">
              ¿Listo para agendar? Ve a la pestaña <strong>Reservar</strong> y elige uno o varios peluditos para su cita de spa. 🛁
            </p>
          </div>
          <button
            onClick={() => setActiveModule('reservar')}
            className="shrink-0 bg-black text-white px-4 py-2.5 rounded-xl border-[3px] border-black font-black text-[10px] uppercase tracking-widest hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            Reservar <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <PetFormModal
          pet={editingPet}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingPet(null); }}
          saving={saving}
        />
      )}
      {deletingPet && (
        <DeleteConfirmModal
          pet={deletingPet}
          onConfirm={handleDelete}
          onClose={() => setDeletingPet(null)}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ClientPetsView;
