import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadMasterySession, submitMasteryAnswer, advanceToNext, setUserAnswer,
} from '../../store/masterySessionSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { DetailCardFull } from '../../components/DetailCard/DetailCardFull';
import { MCQQuestion } from './QuestionTypes/MCQQuestion';
import { ReversedMCQQuestion } from './QuestionTypes/ReversedMCQQuestion';
import { ListenAndWriteQuestion } from './QuestionTypes/ListenAndWriteQuestion';
import { FillInBlanksQuestion } from './QuestionTypes/FillInBlanksQuestion';
import { NuancedUsageQuestion } from './QuestionTypes/NuancedUsageQuestion';
import { OpenProductionQuestion } from './QuestionTypes/OpenProductionQuestion';
import allDoneImg from '../../assets/allDone.png';
import reviewImg from '../../assets/review.png';

export default function MasteryPage() {
  const dispatch = useAppDispatch();
  const {
    queue, currentIndex, totalToday, solved, answered, lastAnswerResult,
    userAnswer, loading, error, sessionComplete,
  } = useAppSelector(s => s.mastery);

  useEffect(() => {
    dispatch(loadMasterySession());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading your review session…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load session"
        message={error}
        action={{ label: 'Retry', onClick: () => dispatch(loadMasterySession()) }}
      />
    );
  }

  if (sessionComplete || queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6">
        <img src={allDoneImg} alt="All Done" className="w-48 h-48 object-contain" />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A202C', fontFamily: 'Poppins, sans-serif' }}>
            Everything is done here!
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#718096' }}>
            You've completed today's review. Come back tomorrow for more!
          </p>
        </div>
        <div
          className="px-6 py-3 rounded-2xl text-sm font-medium"
          style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
        >
           You did great today! Keep it going
        </div>
      </div>
    );
  }

  const currentItem = queue[currentIndex];
  if (!currentItem) return null;

  const progress = ((currentIndex) / Math.max(queue.length, 1)) * 100;
  const canSubmit = userAnswer.trim().length > 0;

  const handleCheck = () => {
    dispatch(submitMasteryAnswer({
      wordId: currentItem.wordId,
      reviewId: currentItem.reviewId,
      userAnswer,
      questionType: currentItem.questionType,
    }));
  };

  const renderQuestion = () => {
    switch (currentItem.questionType) {
      case 1: return <MCQQuestion item={currentItem} disabled={answered} />;
      case 2: return <ReversedMCQQuestion item={currentItem} disabled={answered} />;
      case 3: return <ListenAndWriteQuestion item={currentItem} disabled={answered} />;
      case 4: return <FillInBlanksQuestion item={currentItem} disabled={answered} />;
      case 5: return <NuancedUsageQuestion item={currentItem} disabled={answered} />;
      case 6: return <OpenProductionQuestion item={currentItem} disabled={answered} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #0E2954 0%, #153C70 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Daily Practice
            </h1>

            <p className="text-white/60 text-xs">{currentIndex + 1} of {queue.length} vocabulary</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#60A5FA' }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 pt-6">
        {renderQuestion()}
      </div>

      {/* Feedback after answer */}
      {answered && lastAnswerResult && (
        <div className="px-6 mb-4">
          <div
            className="rounded-2xl px-4 py-3 mb-4 text-sm font-medium"
            style={{
              backgroundColor: lastAnswerResult.isCorrect ? '#D1FAE5' : '#FEF3C7',
              color: lastAnswerResult.isCorrect ? '#065F46' : '#92400E',
            }}
          >
            {lastAnswerResult.isCorrect ? '✓ Correct!' : '⚠ Still needs some work'}
          </div>

          {/* Reveal the DetailCardFull inline */}
          <div
            className="rounded-3xl p-5 shadow-sm"
            style={{ border: '2px solid #E2E8F0', backgroundColor: 'white' }}
          >
            <DetailCardFull card={currentItem.cardData} />
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-5 left-250 right-0 px-6">
        {!answered ? (
          <button
            onClick={handleCheck}
            disabled={!canSubmit}
            className="w-full py-4 rounded-full text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: canSubmit ? '#153C70' : '#718096', fontFamily: 'Poppins, sans-serif' }}
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => { dispatch(setUserAnswer('')); dispatch(advanceToNext()); }}
            className="w-full py-4 rounded-full text-base font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#153C70', fontFamily: 'Poppins, sans-serif' }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
