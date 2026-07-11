import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cabinetIcon from '../../assets/cabinet-filing.svg';
import vaultIcon from '../../assets/vault.svg';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadVaultMonths } from '../../store/vaultSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function VaultPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { months, monthsLoading, error } = useAppSelector(s => s.vault);

  useEffect(() => {
    dispatch(loadVaultMonths());
  }, [dispatch]);

  if (monthsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading your vault…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load vault"
        message={error}
        action={{ label: 'Retry', onClick: () => dispatch(loadVaultMonths()) }}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <img src={cabinetIcon} alt="" className="w-7 h-7" />
          Vault
        </h1>
        <p className="text-white/60 text-sm mt-1">Your saved vocabulary, organized by month</p>
      </div>

      <div className="px-6 pt-6 flex flex-col gap-3">
        {months.length === 0 ? (
          <EmptyState
            iconSrc={vaultIcon}
            title="Your saved words will be displayed here"
          />
        ) : (
          [...months].sort((a, b) => b.month.localeCompare(a.month)).map(item => (
            <button
              key={item.month}
              onClick={() => navigate(`/vault/${item.month}`)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left transition-all hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: 'white',
                border: '2px solid #E2E8F0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <div>
                <p className="font-semibold text-base" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
                  {formatMonth(item.month)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#718096' }}>
                  {item.wordCount} {item.wordCount === 1 ? 'word' : 'words'} saved
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#153C70' }}>›</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
