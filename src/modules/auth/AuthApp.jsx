import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, AlertTriangle, LogOut, Mail, Lock, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { IS_REAL_AUTH } from '../../config';
import PopModal from './components/PopModal';
import PopInput from './components/PopInput';
import PopButton from './components/PopButton';
import AuthDevPanel from './components/AuthDevPanel';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import VerifyEmailView from './views/VerifyEmailView';
import Verify2FAView from './views/Verify2FAView';
import DirectoryView from './views/DirectoryView';
import ProfileView from './views/ProfileView';
import AuditDashboardView from './views/AuditDashboardView';
import * as sessionsService from './services/sessionsService';
import { mockUsers, mockPets } from './data/mockAuthData';

const THEMES = {
  menta: { id: 'menta', vars: { '--bg': '#F0F4F8', '--text': '#0f172a', '--border': '#0f172a', '--primary': '#14b8a6', '--secondary': '#fbbf24', '--card': '#ffffff', '--shadow': '#0f172a' } },
};

const AVATARS_LIST = ['Felix', 'Aneka', 'Charlie', 'Mimi', 'Jasper', 'Lucy'];

import ChangePasswordModal from './components/ChangePasswordModal';
import CreateUserModal from './components/CreateUserModal';
import MfaEnrollModal from './components/MfaEnrollModal';
import MfaUnenrollModal from './components/MfaUnenrollModal';
import SessionDetailModal from './components/SessionDetailModal';
import RevokeSessionConfirmModal from './components/RevokeSessionConfirmModal';
import AdminSecurityOverrideModal from './components/AdminSecurityOverrideModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';

export default function AuthApp({ initialView = 'login' }) {
  const { rolActual, setRolActual, setIsAuthenticated, logout } = useAuth();

  const [view, setView] = useState(initialView);
  const [viewerRole, setViewerRole] = useState(rolActual);
  const [viewingProfileMode, setViewingProfileMode] = useState('personal');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('todos');

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isAdminOverrideOpen, setIsAdminOverrideOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [emailForVerification, setEmailForVerification] = useState('');

  const themeVars = THEMES.menta.vars;


  const [sessions, setSessions] = useState([
    { id: 's1', name: 'Chrome (Windows)', current: true, ip: '190.180.12.5', location: 'La Paz, Bolivia', lastActive: 'Ahora mismo', icon: Monitor },
    { id: 's2', name: 'Safari (iPhone)', current: false, ip: '190.180.12.6', location: 'Santa Cruz, Bolivia', lastActive: 'Hace 2 días', icon: Smartphone },
  ]);

  useEffect(() => {
    setViewerRole(rolActual);
  }, [rolActual]);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleRoleChange = (role) => {
    setViewerRole(role);
    setRolActual(role);
  };

  const handleAuthSuccess = () => {
    if (!IS_REAL_AUTH) {
      setRolActual(viewerRole || rolActual);
    }
    setIsAuthenticated(true);
  };

  const handleVerify2FA = () => {
    if (IS_REAL_AUTH) {
      handleAuthSuccess();
      return;
    }
    setViewingProfileMode('personal');
    setView('profile');
  };

  const handleLogout = async () => {
    await logout();
    setView('login');
  };


  return (
    <div style={themeVars} className="min-h-screen bg-[var(--bg)] font-['Nunito',sans-serif] text-[var(--text)] p-4 relative overflow-x-hidden transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--border) 2px, transparent 2px)', backgroundSize: '35px 35px' }}></div>

      <main className="relative z-10 py-6 md:py-12 pb-32">
        {view === 'login' && <LoginView setView={setView} />}
        {view === 'register' && <RegisterView setView={setView} setEmailForVerification={setEmailForVerification} />}
        {view === 'verify_email' && <VerifyEmailView setView={setView} emailForVerification={emailForVerification} />}

        {view === 'verify_2fa' && <Verify2FAView onValidate={handleVerify2FA} />}
        {view === 'reset_request' && <ResetRequestView setView={setView} />}
        {view === 'directory' && (
          <DirectoryView
            users={mockUsers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSelectedUser={setSelectedUser}
            setViewingProfileMode={setViewingProfileMode}
            setView={setView}
            viewerRole={viewerRole}
            onCreateUser={() => setIsCreateUserModalOpen(true)}
          />
        )}
        {view === 'profile' && (
          <ProfileView
            users={mockUsers}
            pets={mockPets}
            viewerRole={viewerRole}
            viewingProfileMode={viewingProfileMode}
            selectedUser={selectedUser}
            setView={setView}
            setIsPassModalOpen={setIsPassModalOpen}
            setIsAdminOverrideOpen={setIsAdminOverrideOpen}
            setIsSessionModalOpen={setIsSessionModalOpen}
            setIsLogoutModalOpen={setIsLogoutModalOpen}
            sessions={sessions}
            setSessions={setSessions}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            setIsRevokeConfirmOpen={setIsRevokeConfirmOpen}
            avatars={AVATARS_LIST}
            setIs2FAModalOpen={setIs2faModalOpen}
            setIsUnenrollModalOpen={setIsUnenrollModalOpen}
          />
        )}
        {view === 'audit_logs' && <AuditDashboardView setView={setView} />}
      </main>

      <ChangePasswordModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        viewingProfileMode={viewingProfileMode}
      />

      <MfaEnrollModal 
        isOpen={is2faModalOpen} 
        onClose={() => setIs2faModalOpen(false)} 
      />

      <MfaUnenrollModal
        isOpen={isUnenrollModalOpen}
        onClose={() => setIsUnenrollModalOpen(false)}
      />

      <SessionDetailModal 
        isOpen={isSessionModalOpen} 
        onClose={() => setIsSessionModalOpen(false)} 
        selectedSession={selectedSession} 
        onRevokeClick={() => setIsRevokeConfirmOpen(true)} 
      />

      <RevokeSessionConfirmModal 
        isOpen={isRevokeConfirmOpen} 
        onClose={() => setIsRevokeConfirmOpen(false)} 
        selectedSession={selectedSession} 
        onConfirm={async () => {
          if (selectedSession) {
            await sessionsService.revokeSession(selectedSession.id);
            // El ProfileView recargará la lista al detectar cambios o podemos forzar un refresh si fuera necesario
            // Por ahora, cerramos los modales
          }
          setIsRevokeConfirmOpen(false);
          setIsSessionModalOpen(false);
        }} 
      />

      <AdminSecurityOverrideModal 
        isOpen={isAdminOverrideOpen} 
        onClose={() => setIsAdminOverrideOpen(false)} 
        onConfirm={() => setIsAdminOverrideOpen(false)} 
      />

      <LogoutConfirmModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={() => { setIsLogoutModalOpen(false); handleLogout(); }} 
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onCreated={() => { /* Lista se actualiza en auth real */ }}
      />

      {!IS_REAL_AUTH && (
        <AuthDevPanel
          view={view}
          setView={setView}
          viewerRole={viewerRole}
          setViewerRole={(role) => { handleRoleChange(role); if (viewingProfileMode === 'personal') setView('profile'); }}
          viewingProfileMode={viewingProfileMode}
          setViewingProfileMode={(mode) => { setViewingProfileMode(mode); setView('profile'); }}
        />
      )}
    </div>
  );
}
