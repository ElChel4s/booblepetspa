import React, { useState, useMemo } from 'react';
import { DirectoryHeader, DirectoryFilters, DirectoryCard } from '../components/DirectoryComponents';

const DirectoryView = ({
  users,
  activeTab,
  setActiveTab,
  setSelectedUser,
  setViewingProfileMode,
  setView,
  onCreateUser,
  viewerRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar por rol + búsqueda en tiempo real
  const filteredUsers = useMemo(() => {
    let list = activeTab === 'todos' ? users : users.filter(u => u.rol === activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u =>
        (u.nombre_completo || u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.telefono || u.tel || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, activeTab, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      <DirectoryHeader
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onCreateUser={onCreateUser}
        viewerRole={viewerRole}
        setView={setView}
      />

      <DirectoryFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        users={users}
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay usuarios en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredUsers.map((u, i) => (
            <DirectoryCard
              key={u.id}
              user={u}
              index={i}
              onSelect={() => {
                setSelectedUser(u);
                setViewingProfileMode('admin_view');
                setView('profile');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectoryView;
