import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DetailCard } from '../DetailCard/DetailCard';
import { BeeIcon } from '../common/BeeIcon';
import { Toast } from '../common/Toast';
import { useTextSelection } from '../../hooks/useTextSelection';

export function AppShell() {
  useTextSelection();
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Match BottomNav's mobile breakpoint so paddingLeft stays in sync
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Always offset by collapsed width only — sidebar overlays content when expanded
  const collapsedW = isMobile ? 36 : 72;

  return (
    <div
        //Solid Pastel Background Color
        className="flex flex-col min-h-screen bg-gradient-to-b from-rose-50 via-violet-50 to-sky-50"      style={{
        paddingBottom: isOnboarding ? 0 : 80,
        paddingLeft: isOnboarding ? 0 : collapsedW,
      }}
    >
      <main className="flex-1">
        <Outlet />
      </main>

      {!isOnboarding && (
        <>
          <BottomNav
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(prev => !prev)}
          />
          <BeeIcon />
          <DetailCard />
          <Toast />
        </>
      )}
    </div>
  );
}
