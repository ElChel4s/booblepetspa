import PropTypes from 'prop-types';
import Sidebar from '../Sidebar';
import BottomNav from '../BottomNav';

const GroomerLayout = ({ themeVars, onOpenSettings, children }) => (
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
  </div>
);

GroomerLayout.propTypes = {
  themeVars: PropTypes.object,
  onOpenSettings: PropTypes.func,
  children: PropTypes.node,
};

export default GroomerLayout;
