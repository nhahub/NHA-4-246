import React from 'react';

export function DetailCardTooLong() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 gap-4 text-center">
      <div className="text-4xl">✂️</div>
      <div>
        <p className="font-primary font-semibold text-base" style={{ color: '#1A202C' }}>
          Selection too long
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
          This text is too long to look up. Try selecting <strong>50 words or fewer</strong>.
        </p>
      </div>
    </div>
  );
}
