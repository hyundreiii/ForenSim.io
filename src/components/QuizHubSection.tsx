import React, { useState } from 'react';
import { COMPREHENSIVE_QUIZ_QUESTIONS, QuizQuestion } from '../data/simulationData';
import { Award, CheckCircle2, RotateCcw } from 'lucide-react';

interface QuizHubSectionProps {
  quizAnswers: Record<string, number>;
  onSelectQuizAnswer: (questionId: string, optionIndex: number) => void;
  quizSubmitted: boolean;
  onSubmitFullQuiz: () => void;
  onResetFullQuiz: () => void;
  isLightMode: boolean;
}

export const QuizHubSection: React.FC<QuizHubSectionProps> = ({
  quizAnswers,
  onSelectQuizAnswer,
  quizSubmitted,
  onSubmitFullQuiz,
  onResetFullQuiz,
  isLightMode,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredQuestions = COMPREHENSIVE_QUIZ_QUESTIONS.filter((q) =>
    filterType === 'all' ? true : q.type === filterType
  );

  const answeredCount = Object.keys(quizAnswers).length;
  const totalQuestions = COMPREHENSIVE_QUIZ_QUESTIONS.length;
  const correctCount = COMPREHENSIVE_QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  const formatQuestionTypeLabel = (type: QuizQuestion['type']) => {
    switch (type) {
      case 'multiple-choice':
        return 'Multiple Choice';
      case 'true-false':
        return 'True or False';
      case 'scenario':
        return 'Scenario-Based Analysis';
      case 'factor-analysis':
        return 'Environmental Factor Analysis';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Score Summary */}
      <div
        className={`rounded-xl border p-6 flex flex-wrap items-center justify-between gap-4 ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}
      >
        <div>
          <span
            className={`text-xs font-mono font-semibold ${
              isLightMode ? 'text-cyan-700' : 'text-cyan-400'
            }`}
          >
            FORENSIC SCIENCE COMPETENCY EXAMINATION
          </span>
          <h2 className="text-xl font-semibold mt-0.5">
            Comprehensive Interactive Assessment & Scenario Quiz
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
            Progress:{' '}
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}
            >
              {answeredCount} / {totalQuestions} Answered
            </strong>
          </div>
          {quizSubmitted && (
            <>
              <span aria-hidden="true" className="text-slate-400">
                ·
              </span>
              <div className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                Final Score:{' '}
                <strong
                  className={`text-sm ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {correctCount} / {totalQuestions} (
                  {Math.round((correctCount / totalQuestions) * 100)}%)
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Segmented Controls + Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border ${
            isLightMode
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'multiple-choice', label: 'Multiple Choice' },
            { id: 'true-false', label: 'True / False' },
            { id: 'scenario', label: 'Scenario-Based' },
            { id: 'factor-analysis', label: 'Factor Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSubmitFullQuiz}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap"
          >
            Grade Assessment & View Explanations
          </button>
          <button
            type="button"
            onClick={onResetFullQuiz}
            className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isLightMode
                ? 'border-slate-300 bg-white text-slate-700 hover:border-cyan-600'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Quiz
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredQuestions.map((q, idx) => {
          const picked = quizAnswers[q.id];
          const isCorrect = picked === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                  : 'bg-[#0F172A] border-slate-800 text-slate-100'
              }`}
            >
              <div>
                <div
                  className={`flex items-center justify-between text-xs font-mono pb-2.5 border-b ${
                    isLightMode
                      ? 'border-slate-200 text-slate-500'
                      : 'border-slate-800/60 text-slate-400'
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    ITEM #{idx + 1} · {formatQuestionTypeLabel(q.type)}
                  </span>
                  {quizSubmitted && (
                    <span
                      className={
                        isCorrect
                          ? isLightMode
                            ? 'text-emerald-700 font-semibold'
                            : 'text-emerald-400 font-semibold'
                          : isLightMode
                            ? 'text-rose-700 font-semibold'
                            : 'text-rose-400 font-semibold'
                      }
                    >
                      {isCorrect ? '● CORRECT' : '✖ INCORRECT'}
                    </span>
                  )}
                </div>

                {q.scenarioContext && (
                  <div
                    className={`mt-3 p-3 rounded-lg border text-xs font-mono leading-relaxed ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-slate-900/80 border-slate-800 text-cyan-200'
                    }`}
                  >
                    Case Scenario: {q.scenarioContext}
                  </div>
                )}

                <h3 className="text-sm font-semibold mt-3 leading-snug">
                  {q.question}
                </h3>

                <div className="space-y-2 mt-4">
                  {q.options.map((opt, oIdx) => {
                    const isThisPicked = picked === oIdx;
                    const isThisRight = q.correctIndex === oIdx;

                    let optionStyle = isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400'
                      : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-700';

                    if (quizSubmitted) {
                      if (isThisRight) {
                        optionStyle = isLightMode
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                          : 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-semibold';
                      } else if (isThisPicked && !isThisRight) {
                        optionStyle = isLightMode
                          ? 'bg-rose-50 border-rose-500 text-rose-900'
                          : 'bg-rose-500/15 border-rose-400 text-rose-300';
                      }
                    } else if (isThisPicked) {
                      optionStyle = isLightMode
                        ? 'bg-cyan-50 border-cyan-600 text-cyan-950 font-semibold'
                        : 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold';
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => onSelectQuizAnswer(q.id, oIdx)}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isThisRight && (
                          <span
                            className={`font-mono text-[11px] ml-2 shrink-0 font-semibold ${
                              isLightMode
                                ? 'text-emerald-700'
                                : 'text-emerald-400'
                            }`}
                          >
                            ✓ Correct Answer
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {quizSubmitted && (
                <div
                  className={`mt-4 pt-3 border-t text-xs ${
                    isLightMode
                      ? 'border-slate-200 text-slate-700'
                      : 'border-slate-800/80 text-slate-300'
                  }`}
                >
                  <strong
                    className={`font-mono ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    Forensic Explanation:{' '}
                  </strong>
                  <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                    {q.explanation}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
