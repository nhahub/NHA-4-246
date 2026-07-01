import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loadExploreSuggestions, searchExplore, setSearchQuery, clearSearch } from '../../store/exploreSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { DetailCardFull } from '../../components/DetailCard/DetailCardFull';
import { DetailCardData } from '../../services/api/types';

function ExploreCard({ card }: { card: DetailCardData }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all shadow-sm cursor-pointer"
      style={{ border: '2px solid #E2E8F0', backgroundColor: 'white' }}
      onClick={() => setExpanded(v => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
      aria-expanded={expanded}
      aria-label={`View details for ${card.headword}`}
    >
      {/* Preview (collapsed) */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-base" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
              {card.headword}
            </h3>
            {card.synonyms[0] && (
              <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{card.synonyms[0]}</p>
            )}
            {card.contexts[0] && (
              <p className="text-sm mt-2 italic leading-relaxed" style={{ color: '#718096', fontFamily: 'Inter, sans-serif' }}>
                {card.contexts[0].explanation}
              </p>
            )}
          </div>
          <span
            className="text-lg transition-transform flex-shrink-0"
            style={{ color: '#153C70', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
          >
            ↓
          </span>
        </div>
      </div>

      {/* Expanded full card */}
      {expanded && (
        <div
          className="px-5 pb-5 border-t"
          style={{ borderColor: '#E2E8F0' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="pt-4">
            <DetailCardFull card={card} source="explore" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const dispatch = useAppDispatch();
  const { cards, emptyMessage, searchQuery, searchResults, safetyError, loading, searchLoading, error } = useAppSelector(s => s.explore);
  const [inputValue, setInputValue] = useState('');
  const [lang, setLang] = useState<'native' | 'target'>('target');

  useEffect(() => {
    dispatch(loadExploreSuggestions());
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    dispatch(setSearchQuery(inputValue));
    dispatch(searchExplore({ query: inputValue.trim(), lang }));
  };

  const handleRefresh = () => {
    dispatch(clearSearch());
    setInputValue('');
    dispatch(loadExploreSuggestions());
  };

  const displayCards = searchQuery ? searchResults : cards;

  return (
    <div className="min-h-screen" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            🔍 Explore
          </h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex flex-col gap-2">
          <input
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); if (!e.target.value) dispatch(clearSearch()); }}
            placeholder="Search in any language…"
            className="w-full px-4 py-3 rounded-full text-sm outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang('target')}
              className="flex-1 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: lang === 'target' ? 'white' : 'rgba(255,255,255,0.15)',
                color: lang === 'target' ? '#153C70' : 'white',
              }}
            >
              Target language
            </button>
            <button
              type="button"
              onClick={() => setLang('native')}
              className="flex-1 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: lang === 'native' ? 'white' : 'rgba(255,255,255,0.15)',
                color: lang === 'native' ? '#153C70' : 'white',
              }}
            >
              Native language
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-white/20 hover:bg-white/30"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4">
        {(loading || searchLoading) && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" label="Loading suggestions…" />
          </div>
        )}

        {!loading && !searchLoading && error && (
          <EmptyState
            icon="😔"
            title="Service currently busy"
            message="Please try again."
            action={{ label: 'Retry', onClick: handleRefresh }}
          />
        )}

        {safetyError && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: '#FFF5F5', border: '2px solid #FEE2E2' }}
          >
            <p className="text-sm font-medium" style={{ color: '#991B1B', fontFamily: 'Inter, sans-serif' }}>
              We couldn't process this request because it violates safety guidelines.
            </p>
          </div>
        )}

        {!safetyError && !loading && !searchLoading && emptyMessage && (
          <EmptyState
            icon="🌱"
            title="Nothing to explore yet"
            message={emptyMessage}
          />
        )}

        {!safetyError && !loading && !searchLoading && displayCards.map(card => (
          <ExploreCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
