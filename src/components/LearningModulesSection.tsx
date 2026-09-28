import React, { useState } from 'react';
import {
  LEARNING_MODULES,
  LearningModule,
} from '../data/simulationData';
import { BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';

interface LearningModulesSectionProps {
  completedModuleIds: string[];
  moduleQuizScores: Record<string, { score: number; total: number }>;
  onRecordModuleQuiz: (moduleId: string, score: number, total: number) => void;
  onNavigateTab: (tab: string) => void;
  isLightMode: boolean;
}

export const LearningModulesSection: React.FC<LearningModulesSectionProps> = ({
  completedModuleIds,
  moduleQuizScores,
  onRecordModuleQuiz,
  onNavigateTab,
  isLightMode,
}) => {
  const [activeModuleId, setActiveModuleId] = useState<string>(
    LEARNING_MODULES[0].id
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    {}
  );
  const [submittedModules, setSubmittedModules] = useState<
    Record<string, boolean>
  >({});

  const activeModule: LearningModule =
    LEARNING_MODULES.find((m) => m.id === activeModuleId) ||
    LEARNING_MODULES[0];

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitModuleQuiz = () => {
    let correct = 0;
    activeModule.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct += 1;
      }
    });
    setSubmittedModules((prev) => ({ ...prev, [activeModule.id]: true }));
    onRecordModuleQuiz(activeModule.id, correct, activeModule.questions.length);
  };

  const isQuizSubmitted = submittedModules[activeModule.id];
  const savedScore = moduleQuizScores[activeModule.id];

  return (
    <div className="space-y-6">
      {/* Header Progress Bar */}
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
            STRUCTURED FORENSIC CURRICULUM (MODULES 01–06)
          </span>
          <h2 className="text-xl font-semibold mt-0.5">
            Simulation-Based Learning Modules & Checkpoint Assessments
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
            Completed Modules:{' '}
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}
            >
              {completedModuleIds.length} / {LEARNING_MODULES.length}
            </strong>
          </span>
          <div
            className={`w-32 h-2 rounded-full overflow-hidden ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-800'
            }`}
          >
            <div
              className="h-full bg-cyan-500 transition-all duration-200"
              style={{
                width: `${(completedModuleIds.length / LEARNING_MODULES.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Columns: 6 Curriculum Modules Navigation */}
        <div className="lg:col-span-4 space-y-2.5">
          {LEARNING_MODULES.map((mod) => {
            const isSelected = mod.id === activeModule.id;
            const isDone = completedModuleIds.includes(mod.id);
            const scoreObj = moduleQuizScores[mod.id];

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModuleId(mod.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? isLightMode
                      ? 'bg-cyan-50 border-cyan-600 shadow-xs'
                      : 'bg-cyan-500/15 border-cyan-400'
                    : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-400'
                      : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={`font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {mod.number} · {mod.duration}
                  </span>
                  <span
                    className={
                      isDone
                        ? isLightMode
                          ? 'text-emerald-700 font-semibold'
                          : 'text-emerald-400 font-semibold'
                        : isLightMode
                          ? 'text-slate-500'
                          : 'text-slate-400'
                    }
                  >
                    {scoreObj
                      ? `✓ ${scoreObj.score}/${scoreObj.total}`
                      : isDone
                        ? '✓ Completed'
                        : 'Study'}
                  </span>
                </div>
                <div
                  className={`text-sm font-semibold mt-1 ${
                    isLightMode ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {mod.title}
                </div>
                <div
                  className={`text-xs mt-0.5 line-clamp-1 ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {mod.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 8 Columns: Active Module Lesson Content + Embedded Module Quiz */}
        <div
          className={`lg:col-span-8 rounded-xl border p-6 space-y-6 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          {/* Module Header */}
          <div
            className={`pb-4 border-b ${
              isLightMode ? 'border-slate-200' : 'border-slate-800/60'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              <span>{activeModule.number.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{activeModule.duration}</span>
            </div>
            <h3 className="text-2xl font-semibold mt-1">{activeModule.title}</h3>
            <p
              className={`text-xs font-mono mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {activeModule.subtitle}
            </p>
          </div>

          {/* Overview Paragraph */}
          <p
            className={`text-sm leading-relaxed ${
              isLightMode ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {activeModule.overview}
          </p>

          {/* Key Scientific Concepts */}
          <div className="space-y-4">
            {activeModule.keyConcepts.map((concept, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-900/75 border-slate-800'
                }`}
              >
                <h4
                  className={`text-sm font-semibold ${
                    isLightMode ? 'text-cyan-800' : 'text-cyan-400'
                  }`}
                >
                  {concept.heading}
                </h4>
                <p
                  className={`text-xs leading-relaxed mt-1.5 ${
                    isLightMode ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  {concept.body}
                </p>
                {concept.formulaOrMetric && (
                  <div
                    className={`mt-2.5 px-3 py-1.5 rounded border text-xs font-mono font-medium ${
                      isLightMode
                        ? 'bg-white border-slate-300 text-cyan-800'
                        : 'bg-slate-950 border-slate-800 text-cyan-300'
                    }`}
                  >
                    {concept.formulaOrMetric}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Baguio Highland Context Callout */}
          <div
            className={`p-4 rounded-xl border ${
              isLightMode
                ? 'bg-sky-50 border-sky-200 text-slate-800'
                : 'bg-cyan-950/30 border-cyan-500/30 text-slate-200'
            }`}
          >
            <div
              className={`text-xs font-mono uppercase font-semibold mb-1 ${
                isLightMode ? 'text-cyan-800' : 'text-cyan-400'
              }`}
            >
              Baguio City Highland Laboratory Application
            </div>
            <p className="text-xs leading-relaxed">
              {activeModule.baguioContextNote}
            </p>
            <div
              className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 ${
                isLightMode ? 'border-sky-200' : 'border-cyan-500/20'
              }`}
            >
              <span
                className={`text-xs font-mono font-medium ${
                  isLightMode ? 'text-cyan-900' : 'text-cyan-300'
                }`}
              >
                Lab Activity: {activeModule.interactivePrompt}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('simulation')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap"
              >
                Open Interactive Chamber →
              </button>
            </div>
          </div>

          {/* Post-Module Interactive Checkpoint Quiz */}
          <div
            className={`p-5 rounded-xl border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${
                isLightMode ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div>
                <span
                  className={`text-xs font-mono uppercase font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {activeModule.number} CHECKPOINT ASSESSMENT
                </span>
                <h4 className="text-sm font-semibold mt-0.5">
                  Verify Conceptual Mastery Before Proceeding
                </h4>
              </div>
              {savedScore && (
                <span
                  className={`text-xs font-mono font-semibold ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  Recorded Score: {savedScore.score} / {savedScore.total}
                </span>
              )}
            </div>

            <div className="space-y-5 mt-4">
              {activeModule.questions.map((q, qIdx) => {
                const picked = selectedAnswers[q.id];
                return (
                  <div key={q.id} className="space-y-2">
                    {q.scenarioContext && (
                      <div
                        className={`p-2.5 rounded border text-xs font-mono ${
                          isLightMode
                            ? 'bg-white border-slate-200 text-slate-700'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        Scenario: {q.scenarioContext}
                      </div>
                    )}
                    <div className="text-xs font-semibold">
                      Q{qIdx + 1}. {q.question}
                    </div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oIdx) => {
                        const isPicked = picked === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        let borderStyle = isLightMode
                          ? 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                        if (isQuizSubmitted) {
                          if (isCorrect) {
                            borderStyle = isLightMode
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                              : 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-semibold';
                          } else if (isPicked && !isCorrect) {
                            borderStyle = isLightMode
                              ? 'bg-rose-50 border-rose-500 text-rose-900'
                              : 'bg-rose-500/15 border-rose-400 text-rose-300';
                          }
                        } else if (isPicked) {
                          borderStyle = isLightMode
                            ? 'bg-cyan-50 border-cyan-600 text-cyan-950 font-semibold'
                            : 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, oIdx)}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${borderStyle}`}
                          >
                            <span>{opt}</span>
                            {isQuizSubmitted && isCorrect && (
                              <span
                                className={`font-mono text-[11px] shrink-0 ml-2 font-semibold ${
                                  isLightMode
                                    ? 'text-emerald-700'
                                    : 'text-emerald-400'
                                }`}
                              >
                                ✓ Correct
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isQuizSubmitted && (
                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          isLightMode
                            ? 'bg-white border-slate-200 text-slate-700'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300'
                        }`}
                      >
                        <strong
                          className={`font-mono ${
                            isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                          }`}
                        >
                          Scientific Explanation:{' '}
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSubmitModuleQuiz}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap"
              >
                Submit {activeModule.number} Quiz
              </button>

              {LEARNING_MODULES.findIndex((m) => m.id === activeModule.id) <
                LEARNING_MODULES.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = LEARNING_MODULES.findIndex(
                      (m) => m.id === activeModule.id
                    );
                    setActiveModuleId(LEARNING_MODULES[idx + 1].id);
                  }}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 whitespace-nowrap ${
                    isLightMode
                      ? 'border-slate-300 bg-white text-slate-700 hover:border-cyan-600'
                      : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <span>Next Module</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
