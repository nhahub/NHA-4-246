import React from 'react';

interface Props {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '📭', title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="text-5xl">{icon}</div>
      <div>
        <p className="font-primary font-semibold text-base" style={{ color: '#1A202C' }}>{title}</p>
        {message && (
          <p className="mt-1 text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>{message}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
