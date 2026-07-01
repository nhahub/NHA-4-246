import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', color = '#153C70', label = 'Loading...' }: Props) {
  const sizes = { sm: 20, md: 36, lg: 52 };
  const s = sizes[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label}>
      <svg
        width={s} height={s}
        viewBox="0 0 36 36"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="15" stroke="#E2E8F0" strokeWidth="3" />
        <path
          d="M18 3 A15 15 0 0 1 33 18"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-secondary" style={{ color: '#718096' }}>{label}</span>
    </div>
  );
}
