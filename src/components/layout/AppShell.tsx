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

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        paddingBottom: isOnboarding ? 0 : 80,
        paddingLeft: isOnboarding ? 0 : (isSidebarOpen ? 248 : 72),
        transition: 'padding-left 0.38s cubic-bezier(0.25, 0.8, 0.25, 1)',
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
