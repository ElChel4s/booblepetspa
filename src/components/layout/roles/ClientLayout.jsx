import PropTypes from 'prop-types';
import Sidebar from '../Sidebar';
import BottomNav from '../BottomNav';
import { ClientTrackingProvider } from '../../../store/ClientTrackingContext';
import ClientMiniTracker from '../../../modules/agenda/components/client/tracking/ClientMiniTracker';
import ClientApprovalModal from '../../../modules/agenda/components/client/tracking/ClientApprovalModal';
import ClientCheckoutFeedback from '../../../modules/agenda/components/client/tracking/ClientCheckoutFeedback';
import ClientLiveTracker from '../../../modules/agenda/components/client/tracking/ClientLiveTracker';

const ClientLayoutContent = ({ themeVars, onOpenSettings, children }) => (
  <div
    style={themeVars}
    className="min-h-screen bg-[var(--bg)] font-['Nunito',sans-serif] text-[var(--text)] flex flex-col md:flex-row relative overflow-hidden transition-colors duration-500"
  >
    <div
      className="absolute inset-0 pointer-events-none z-0 opacity-10"
      style={{
        backgroundImage: 'radial-gradient(var(--border) 2px, transparent 2px)',
        backgroundSize: '35px 35px',
      }}
    />

    <Sidebar onOpenSettings={onOpenSettings} />

    <main className="flex-1 flex flex-col w-full pb-32 md:pb-16 z-10 relative md:pl-40 md:px-8 md:pt-8 transition-all duration-500">
      {children}
    </main>

    <BottomNav onOpenSettings={onOpenSettings} />

    {/* Seguimiento en vivo */}
    <ClientMiniTracker />
    <ClientApprovalModal />
    <ClientCheckoutFeedback />
    <ClientLiveTracker />
  </div>
);

ClientLayoutContent.propTypes = {
  themeVars: PropTypes.object,
  onOpenSettings: PropTypes.func,
  children: PropTypes.node,
};

const ClientLayout = ({ themeVars, onOpenSettings, children }) => (
  <ClientTrackingProvider>
    <ClientLayoutContent themeVars={themeVars} onOpenSettings={onOpenSettings}>
      {children}
    </ClientLayoutContent>
  </ClientTrackingProvider>
);

ClientLayout.propTypes = {
  themeVars: PropTypes.object,
  onOpenSettings: PropTypes.func,
  children: PropTypes.node,
};

export default ClientLayout;
