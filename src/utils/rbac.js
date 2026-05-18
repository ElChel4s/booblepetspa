/**
 * RBAC (Role-Based Access Control) Configuration
 */

export const MODULES = {
  REPORTS: 'reports',
  AGENDA: 'agenda',
  CLIENTS: 'clients',
  CASH: 'cash',
  INVENTORY: 'inventory',
  TIENDA: 'tienda',
  TURNOS: 'turnos',
  ATENCION: 'atencion',
  INSUMOS: 'insumos',
  SERVICES: 'services',
  FINANCE: 'finance',
  RESERVAR: 'reservar',
  HISTORIAL: 'historial',
  USERS: 'users',
  MONITOR: 'monitor',
  AUDIT: 'audit',
};

export const PERMISSIONS = {
  admin: [
    MODULES.REPORTS, MODULES.AGENDA, MODULES.CLIENTS, MODULES.CASH, 
    MODULES.INVENTORY, MODULES.TIENDA, MODULES.TURNOS, MODULES.ATENCION,
    MODULES.INSUMOS, MODULES.SERVICES, MODULES.FINANCE, MODULES.RESERVAR,
    MODULES.HISTORIAL, MODULES.USERS, MODULES.MONITOR, MODULES.AUDIT
  ],
  recepcion: [
    MODULES.AGENDA, MODULES.CLIENTS, MODULES.CASH, MODULES.TIENDA, 
    MODULES.SERVICES, MODULES.FINANCE, MODULES.INVENTORY, MODULES.USERS,
    MODULES.MONITOR
  ],


  groomer: [
    MODULES.TURNOS, MODULES.ATENCION, MODULES.INSUMOS, MODULES.TIENDA,
    MODULES.INVENTORY, MODULES.SERVICES, MODULES.CLIENTS
  ],
  cliente: [
    MODULES.TIENDA, MODULES.RESERVAR, MODULES.HISTORIAL, MODULES.CLIENTS
  ]
};

/**
 * Checks if a role has access to a specific module
 */
export const canAccess = (role, module) => {
  if (!role || !module) return false;
  return PERMISSIONS[role]?.includes(module) || false;
};

/**
 * Returns the default module for a role
 */
export const getDefaultModule = (role) => {
  const defaults = {
    admin: MODULES.REPORTS,
    recepcion: MODULES.AGENDA,
    groomer: MODULES.TURNOS,
    cliente: MODULES.TIENDA
  };
  return defaults[role] || MODULES.TIENDA;
};
