import React from 'react';
import lexiLogoWhite from '../../assets/lexi_logo_white.svg';

interface Props {
  children: React.ReactNode;
  /** Displayed below the logo as a page-level heading */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
}

/**
 * Shared shell for all auth pages.
 * Matches the visual language of OnboardingPage exactly:
 * same gradient background, Lexi logo, white card, decorative dots.
 */
export function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'linear-gradient(160deg, #0E2954 0%, #153C70 60%, #1E4D99 100%)' }}
    >
      {/* Logo */}
      <div className="text-center mb-6 flex flex-col items-center">
        <img src={lexiLogoWhite} alt="Lexi logo" className="h-12 w-auto mb-3" aria-hidden="true" />
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          LexiFlow
        </h1>
        <p className="mt-1.5 text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          Your neuro-powered language learning companion
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: 'white', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
      >
        {/* Page heading */}
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>

      {/* Decorative dots */}
      <div className="flex gap-2 mt-8 opacity-30" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-white" />
        ))}
      </div>
    </div>
  );
}
