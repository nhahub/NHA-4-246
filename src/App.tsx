import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store';
import { AppShell } from './components/layout/AppShell';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import MasteryPage from './pages/Mastery/MasteryPage';
import VaultPage from './pages/Vault/VaultPage';
import VaultMonthPage from './pages/Vault/VaultMonthPage';
import VaultReadPage from './pages/Vault/VaultReadPage';
import WatchPage from './pages/Watch/WatchPage';
import WatchPlayerPage from './pages/Watch/WatchPlayerPage';
import ExplorePage from './pages/Explore/ExplorePage';
import PronouncePage from './pages/Pronounce/PronouncePage';
import PhonemeAssessmentPage from './pages/Pronounce/PhonemeAssessmentPage';

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboarded = useAppSelector(s => s.user.onboarded);
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route
            path="/mastery"
            element={<RequireOnboarding><MasteryPage /></RequireOnboarding>}
          />
          <Route
            path="/vault"
            element={<RequireOnboarding><VaultPage /></RequireOnboarding>}
          />
          <Route
            path="/vault/:month"
            element={<RequireOnboarding><VaultMonthPage /></RequireOnboarding>}
          />
          <Route
            path="/vault/:month/read"
            element={<RequireOnboarding><VaultReadPage /></RequireOnboarding>}
          />
          <Route
            path="/watch"
            element={<RequireOnboarding><WatchPage /></RequireOnboarding>}
          />
          <Route
            path="/watch/player/:videoId"
            element={<RequireOnboarding><WatchPlayerPage /></RequireOnboarding>}
          />
          <Route
            path="/explore"
            element={<RequireOnboarding><ExplorePage /></RequireOnboarding>}
          />
          <Route
            path="/pronounce"
            element={<RequireOnboarding><PronouncePage /></RequireOnboarding>}
          />
          <Route
            path="/pronounce/:phonemeId"
            element={<RequireOnboarding><PhonemeAssessmentPage /></RequireOnboarding>}
          />
          <Route path="*" element={<Navigate to="/mastery" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
