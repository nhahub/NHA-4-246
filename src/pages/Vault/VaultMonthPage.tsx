import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadVaultWords } from '../../store/vaultSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { DetailCardFull } from '../../components/DetailCard/DetailCardFull';
import { VaultWord } from '../../services/api/types';

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function WordRow({ word, isOpen, onToggle }: {
  word: VaultWord;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ border: `2px solid ${isOpen ? '#153C70' : '#E2E8F0'}`, backgroundColor: 'white' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
            {word.headword}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
            {word.nativeTranslation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: '#F4F7FB', color: '#153C70' }}
          >
            {word.stage}
          </span>
          <span
            className="text-lg transition-transform"
            style={{
              color: '#153C70',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            ›
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: '#E2E8F0' }}>
          <div className="pt-4">
            <DetailCardFull card={word.cardData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function VaultMonthPage() {
  const { month } = useParams<{ month: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { wordsByMonth, wordsLoading } = useAppSelector(s => s.vault);
  const [openWordId, setOpenWordId] = useState<string | null>(null);

  const words = month ? (wordsByMonth[month] || []) : [];

  useEffect(() => {
    if (month) dispatch(loadVaultWords(month));
  }, [dispatch, month]);

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/vault')}
            aria-label="Back to vault"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {month ? formatMonth(month) : 'Month'}
            </h1>
            <p className="text-white/60 text-xs">{words.length} words saved</p>
          </div>
        </div>

        {/* Read button */}
        {words.length > 0 && (
          <button
            onClick={() => navigate(`/vault/${month}/read`)}
            className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}
          >
            📖 Read Using these words
          </button>
        )}
      </div>

      <div className="px-6 pt-5 flex flex-col gap-3">
        {wordsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label="Loading words…" />
          </div>
        ) : words.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No saved words yet this month"
            message="Words you save will appear here."
          />
        ) : (
          words.map(word => (
            <WordRow
              key={word.id}
              word={word}
              isOpen={openWordId === word.id}
              onToggle={() => setOpenWordId(openWordId === word.id ? null : word.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
