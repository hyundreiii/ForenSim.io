import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { COMPREHENSIVE_QUIZ_QUESTIONS, QuizQuestion } from '../data/simulationData';
import { Award, CheckCircle2, Download, RotateCcw } from 'lucide-react';

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
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

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

  const handleExportQuizPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    doc.setFillColor(11, 17, 32);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(34, 211, 238);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      'FORENSIM.IO · FORENSIC SCIENCE COMPETENCY EXAMINATION',
      margin,
      11
    );
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(
      `Quiz Assessment Results & Answer Key — Score: ${correctCount}/${totalQuestions} (${scorePercent}%)`,
      margin,
      19
    );
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Answered: ${answeredCount}/${totalQuestions} Questions   |   Correct: ${correctCount}   |   Generated: ${new Date().toLocaleString()}`,
      margin,
      26
    );

    y = 40;

    COMPREHENSIVE_QUIZ_QUESTIONS.forEach((q, idx) => {
      const pickedIdx = quizAnswers[q.id];
      const hasAnswered = pickedIdx !== undefined;
      const isCorrect = pickedIdx === q.correctIndex;

      const qLines = doc.splitTextToSize(
        `Item #${idx + 1} (${formatQuestionTypeLabel(q.type)}): ${q.question}`,
        contentWidth - 8
      );
      const yourAnsLines = doc.splitTextToSize(
        `Your Answer: ${hasAnswered ? q.options[pickedIdx] : 'Not Answered'} [${hasAnswered ? (isCorrect ? 'CORRECT' : 'INCORRECT') : 'UNANSWERED'}]`,
        contentWidth - 8
      );
      const corrAnsLines = doc.splitTextToSize(
        `Correct Answer: ${q.options[q.correctIndex]}`,
        contentWidth - 8
      );
      const expLines = doc.splitTextToSize(
        `Forensic Explanation: ${q.explanation}`,
        contentWidth - 8
      );

      const boxH =
        8 +
        (qLines.length +
          yourAnsLines.length +
          corrAnsLines.length +
          expLines.length) *
          4.1;
      if (y + boxH > pageHeight - 14) {
        doc.addPage();
        y = 16;
      }

      doc.setDrawColor(
        isCorrect ? 167 : 203,
        isCorrect ? 243 : 213,
        isCorrect ? 208 : 225
      );
      doc.setFillColor(
        isCorrect ? 240 : 248,
        isCorrect ? 253 : 250,
        isCorrect ? 244 : 252
      );
      doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');

      let cy = y + 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, margin + 3, cy);
      cy += qLines.length * 4.1;

      doc.setFontSize(8);
      if (isCorrect) {
        doc.setTextColor(5, 150, 105);
      } else if (hasAnswered) {
        doc.setTextColor(225, 29, 72);
      } else {
        doc.setTextColor(100, 116, 139);
      }
      doc.text(yourAnsLines, margin + 3, cy);
      cy += yourAnsLines.length * 4.1;

      doc.setTextColor(4, 120, 87);
      doc.text(corrAnsLines, margin + 3, cy);
      cy += corrAnsLines.length * 4.1;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(expLines, margin + 3, cy);

      y += boxH + 3.5;
    });

    doc.save(`ForenSim-Quiz-Results-${correctCount}-of-${totalQuestions}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Always-Visible Live Score Summary */}
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
            Answered:{' '}
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}
            >
              {answeredCount} / {totalQuestions}
            </strong>
          </div>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
              isLightMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>
              Score:{' '}
              <strong className="text-sm">
                {correctCount} / {totalQuestions} ({scorePercent}%)
              </strong>
            </span>
          </div>
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSubmitFullQuiz}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Show All Correct Answers & Grade Quiz
          </button>
          <button
            type="button"
            onClick={handleExportQuizPdf}
            className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isLightMode
                ? 'border-cyan-600 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                : 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export / Save Quiz PDF
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
          const isAnswered = picked !== undefined;
          const showAnswerKey = isAnswered || quizSubmitted;
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
                  {showAnswerKey && (
                    <span
                      className={
                        isCorrect
                          ? isLightMode
                            ? 'text-emerald-700 font-semibold'
                            : 'text-emerald-400 font-semibold'
                          : isAnswered
                            ? isLightMode
                              ? 'text-rose-700 font-semibold'
                              : 'text-rose-400 font-semibold'
                            : isLightMode
                              ? 'text-amber-700 font-semibold'
                              : 'text-amber-400 font-semibold'
                      }
                    >
                      {isCorrect
                        ? '● CORRECT (+1 pt)'
                        : isAnswered
                          ? '✖ INCORRECT (0 pt)'
                          : '○ ANSWER KEY REVEALED'}
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

                    if (showAnswerKey) {
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
                        {showAnswerKey && isThisRight && (
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
                        {showAnswerKey && isThisPicked && !isThisRight && (
                          <span
                            className={`font-mono text-[11px] ml-2 shrink-0 font-semibold ${
                              isLightMode ? 'text-rose-700' : 'text-rose-400'
                            }`}
                          >
                            ✖ Your Choice
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showAnswerKey && (
                <div
                  className={`mt-4 pt-3 border-t text-xs space-y-1.5 ${
                    isLightMode
                      ? 'border-slate-200 text-slate-700'
                      : 'border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div
                    className={`font-mono font-semibold ${
                      isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    ✓ Correct Answer: {q.options[q.correctIndex]}
                  </div>
                  <div>
                    <strong
                      className={`font-mono ${
                        isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                      }`}
                    >
                      Forensic Explanation:{' '}
                    </strong>
                    <span
                      className={
                        isLightMode ? 'text-slate-700' : 'text-slate-300'
                      }
                    >
                      {q.explanation}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
