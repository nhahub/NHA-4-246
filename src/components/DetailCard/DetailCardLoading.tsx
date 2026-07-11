import React from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function DetailCardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <LoadingSpinner label="Looking up..." />
      <p className="text-sm" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
        Analyzing your selection…
      </p>
    </div>
  );
}
