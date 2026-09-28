import React, { useState } from 'react';
import {
  COMPREHENSIVE_QUIZ_QUESTIONS,
  EVIDENCE_ITEMS,
  EnvironmentalParams,
  LEARNING_MODULES,
  ROOM_OBJECTS,
  StudentObservation,
} from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import { exportForensicDossierPdf } from '../utils/pdfExporter';
import { ObservationPanel } from './ObservationPanel';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Play,
  Printer,
} from 'lucide-react';

interface ReportsAndScenarioSectionProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  inspectedObjectIds: string[];
  examinedEvidenceIds: string[];
  completedModuleIds: string[];
  hasAdjustedVariables: boolean;
  observations: StudentObservation[];
  quizAnswers: Record<string, number>;
  quizSubmitted: boolean;
  onRecordObservation: (obs: Omit<StudentObservation, 'id'>) => void;
  onDeleteObservation: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  isLightMode: boolean;
}

export const ReportsAndScenarioSection: React.FC<
  ReportsAndScenarioSectionProps
> = ({
  params,
  metrics,
  inspectedObjectIds,
  examinedEvidenceIds,
  completedModuleIds,
  hasAdjustedVariables,
  observations,
  quizAnswers,
  quizSubmitted,
  onRecordObservation,
  onDeleteObservation,
  onNavigateTab,
  isLightMode,
}) => {
  const [studentName, setStudentName] = useState<string>(
    'Forensic Science Researcher'
  );
  const [caseConclusionPmi, setCaseConclusionPmi] = useState<string>(
    '10–14 Days (Baguio Highland Cool Indoor ADD Trajectory)'
  );
  const [casePrimaryFactor, setCasePrimaryFactor] = useState<string>(
    'Highland Cool Ambient Temperature (15–17°C) + High Monsoonal Humidity (>80% RH)'
  );
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // 8-Step Scenario Checklist for "Baguio Indoor Simulation Case"
  const scenarioSteps = [
    {
      number: '01',
      title: 'Inspect the Chamber Room',
      requirement: 'Inspect at least 3 forensic instruments in the 3D/2D room',
      completed: inspectedObjectIds.length >= 3,
      progressText: `${inspectedObjectIds.length} / ${ROOM_OBJECTS.length} inspected`,
      targetTab: 'simulation',
    },
    {
      number: '02',
      title: 'Check Environmental Readings',
      requirement: 'Inspect Temp (TMP-07), Humidity (HUM-08), or Sensor Array (SEN-01)',
      completed:
        inspectedObjectIds.includes('env-sensor') ||
        inspectedObjectIds.includes('temp-monitor') ||
        inspectedObjectIds.includes('humidity-monitor'),
      progressText: 'Telemetry verified',
      targetTab: 'simulation',
    },
    {
      number: '03',
      title: 'Examine Simulated Evidence',
      requirement: 'Analyze at least 2 forensic evidence logs in the Evidence section',
      completed: examinedEvidenceIds.length >= 2,
      progressText: `${examinedEvidenceIds.length} / ${EVIDENCE_ITEMS.length} logs analyzed`,
      targetTab: 'evidence',
    },
    {
      number: '04',
      title: 'Review the Decomposition Timeline',
      requirement: 'Advance or inspect the simulation timeline beyond Day 2.0',
      completed: metrics.simDay >= 2.0,
      progressText: `Current: Day ${metrics.simDay.toFixed(1)} (${metrics.add} ADD)`,
      targetTab: 'timeline',
    },
    {
      number: '05',
      title: 'Adjust Simulation Variables',
      requirement: 'Modify temperature, humidity, airflow, or load an experimental preset',
      completed: hasAdjustedVariables,
      progressText: hasAdjustedVariables ? 'Variables tested' : 'Pending manipulation',
      targetTab: 'simulation',
    },
    {
      number: '06',
      title: 'Record Scientific Observations',
      requirement: 'Log at least 1 formal entry in the Scientific Observation Panel',
      completed: observations.length >= 1,
      progressText: `${observations.length} entries logged`,
      targetTab: 'reports',
    },
    {
      number: '07',
      title: 'Analyze Multi-Channel Results',
      requirement: 'Synthesize PMI & environmental factor conclusions below',
      completed: Boolean(caseConclusionPmi && casePrimaryFactor),
      progressText: 'Synthesis ready',
      targetTab: 'reports',
    },
    {
      number: '08',
      title: 'Complete the Assessment',
      requirement: 'Answer at least 3 quiz items or submit the competency quiz',
      completed: Object.keys(quizAnswers).length >= 3 || quizSubmitted,
      progressText: `${Object.keys(quizAnswers).length} / ${COMPREHENSIVE_QUIZ_QUESTIONS.length} answered`,
      targetTab: 'quiz',
    },
  ];

  const completedStepsCount = scenarioSteps.filter((s) => s.completed).length;

  const totalQuizQuestions = COMPREHENSIVE_QUIZ_QUESTIONS.length;
  const answeredQuizCount = Object.keys(quizAnswers).length;
  const correctQuizCount = COMPREHENSIVE_QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);
  const quizPercent = Math.round((correctQuizCount / totalQuizQuestions) * 100);

  const handleExportPdfReport = () => {
    exportForensicDossierPdf({
      studentName,
      params,
      metrics,
      caseConclusionPmi,
      casePrimaryFactor,
      completedStepsCount,
      inspectedObjectCount: inspectedObjectIds.length,
      examinedEvidenceCount: examinedEvidenceIds.length,
      completedModuleCount: completedModuleIds.length,
      observations,
      quizAnswers,
    });
    setExportMessage(
      'Official PDF Dossier (with Quiz Score & Correct Answer Key) downloaded.'
    );
    setTimeout(() => setExportMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Case Brief: Baguio Indoor Simulation Case */}
      <div
        className={`rounded-xl border p-6 ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}
      >
        <div
          className={`flex flex-wrap items-start justify-between gap-4 pb-4 border-b ${
            isLightMode ? 'border-slate-200' : 'border-slate-800/60'
          }`}
        >
          <div>
            <span
              className={`text-xs font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              SCENARIO-BASED LEARNING ACTIVITY · CASE FILE #BGY-2026-09
            </span>
            <h2 className="text-xl font-semibold mt-0.5">
              Baguio Indoor Simulation Case & Final Laboratory Report
            </h2>
          </div>
          <div className="text-xs font-mono text-right">
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
              Scenario Completion:{' '}
            </span>
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}
            >
              {completedStepsCount} / 8 Milestones Verified
            </strong>
          </div>
        </div>

        <p
          className={`text-sm leading-relaxed mt-4 ${
            isLightMode ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          <strong>Scenario Briefing:</strong> You are assigned to evaluate a controlled indoor simulation room in Baguio City (1,540m elevation) where Accumulated Degree Days (ADD) have reached{' '}
          <strong
            className={`font-mono ${
              isLightMode ? 'text-cyan-700' : 'text-cyan-400'
            }`}
          >
            ~200 °C·days
          </strong>{' '}
          under cool mountain temperatures and elevated monsoonal relative humidity. Complete the 8-step scientific protocol below, log your empirical observations, and synthesize your final Simulation Report.
        </p>

        {/* 8-Step Interactive Protocol Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {scenarioSteps.map((step) => (
            <div
              key={step.number}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                step.completed
                  ? isLightMode
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-emerald-950/20 border-emerald-500/40'
                  : isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-900/75 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={`font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    STEP {step.number}
                  </span>
                  <span
                    className={
                      step.completed
                        ? isLightMode
                          ? 'text-emerald-700 font-semibold'
                          : 'text-emerald-400 font-semibold'
                        : isLightMode
                          ? 'text-amber-700 font-semibold'
                          : 'text-amber-400'
                    }
                  >
                    {step.completed ? '✓ COMPLETE' : '○ PENDING'}
                  </span>
                </div>
                <div className="text-xs font-semibold mt-1">{step.title}</div>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {step.requirement}
                </p>
              </div>

              <div
                className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                  isLightMode ? 'border-slate-200' : 'border-slate-800/40'
                }`}
              >
                <span
                  className={`truncate ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {step.progressText}
                </span>
                {step.targetTab !== 'reports' && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(step.targetTab)}
                    className={`hover:underline shrink-0 ml-2 font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    Go →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Scientific Observation Panel */}
      <ObservationPanel
        params={params}
        metrics={metrics}
        observations={observations}
        onRecordObservation={onRecordObservation}
        onDeleteObservation={onDeleteObservation}
        isLightMode={isLightMode}
      />

      {/* Final Simulation Report Dossier */}
      <div
        className={`rounded-xl border p-6 space-y-6 ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
            isLightMode ? 'border-slate-200' : 'border-slate-800/60'
          }`}
        >
          <div>
            <span
              className={`text-xs font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              OFFICIAL ACADEMIC SIMULATION DOSSIER
            </span>
            <h3 className="text-xl font-semibold mt-0.5">
              Final Simulation Report & Case Conclusion
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdfReport}
              className="px-3.5 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export / Save PDF Dossier
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className={`px-3.5 py-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isLightMode
                  ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-600'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
          </div>
        </div>

        {exportMessage && (
          <div
            className={`text-xs font-mono font-semibold ${
              isLightMode ? 'text-emerald-700' : 'text-emerald-400'
            }`}
          >
            {exportMessage}
          </div>
        )}

        {/* Researcher & Case Conclusion Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Student / Researcher Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Estimated ADD / Timeline Conclusion
            </label>
            <select
              value={caseConclusionPmi}
              onChange={(e) => setCaseConclusionPmi(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            >
              <option value="10–14 Days (Baguio Highland Cool Indoor ADD Trajectory)">
                10–14 Days (Baguio Highland Cool Indoor ADD Trajectory)
              </option>
              <option value="3–5 Days (Accelerated Warm Chamber Trajectory)">
                3–5 Days (Accelerated Warm Chamber Trajectory)
              </option>
              <option value="20–30+ Days (Extended Monsoon Saponification Trajectory)">
                20–30+ Days (Extended Monsoon Saponification Trajectory)
              </option>
            </select>
          </div>

          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Primary Governing Environmental Factor
            </label>
            <select
              value={casePrimaryFactor}
              onChange={(e) => setCasePrimaryFactor(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            >
              <option value="Highland Cool Ambient Temperature (15–17°C) + High Monsoonal Humidity (>80% RH)">
                Highland Cool Temp (15–17°C) + High Humidity (&gt;80% RH)
              </option>
              <option value="High-Velocity Forced Ventilation (>1.5 m/s) + Low Relative Humidity (<35% RH)">
                High-Velocity Ventilation (&gt;1.5 m/s) + Low Humidity (&lt;35% RH)
              </option>
              <option value="Sealed Indoor Enclosure Excluding Dipteran Colonization">
                Sealed Indoor Enclosure Excluding Dipteran Colonization
              </option>
            </select>
          </div>
        </div>

        {/* Summary Metrics Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div
            className={`p-4 rounded-xl border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div
              className={`text-[11px] ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              ACTIVE SIMULATION DAY
            </div>
            <div
              className={`text-xl font-semibold mt-1 tabular-nums ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              Day {metrics.simDay.toFixed(1)} ({metrics.add} ADD)
            </div>
            <div
              className={`text-[11px] mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {metrics.currentStage.shortTitle}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div
              className={`text-[11px] ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              CHAMBER ENVIRONMENT
            </div>
            <div
              className={`text-xl font-semibold mt-1 tabular-nums ${
                isLightMode ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              {params.temperature.toFixed(1)}°C · {params.humidity}% RH
            </div>
            <div
              className={`text-[11px] mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {params.airflow.toFixed(2)} m/s · {params.roomCondition}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div
              className={`text-[11px] ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              LAB INSPECTION SCORE
            </div>
            <div
              className={`text-xl font-semibold mt-1 tabular-nums ${
                isLightMode ? 'text-amber-700' : 'text-amber-400'
              }`}
            >
              {inspectedObjectIds.length}/10 Nodes · {examinedEvidenceIds.length}/7 Logs
            </div>
            <div
              className={`text-[11px] mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {observations.length} Logged Observations
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div
              className={`text-[11px] ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              COMPETENCY QUIZ
            </div>
            <div
              className={`text-xl font-semibold mt-1 tabular-nums ${
                isLightMode ? 'text-sky-700' : 'text-sky-400'
              }`}
            >
              {correctQuizCount} / {totalQuizQuestions} ({quizPercent}%)
            </div>
            <div
              className={`text-[11px] mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {answeredQuizCount}/{totalQuizQuestions} Answered · {completedModuleIds.length}/{LEARNING_MODULES.length} Modules
            </div>
          </div>
        </div>

        {/* Competency Quiz Score & Correct Answers Breakdown inside Dossier */}
        <div
          className={`pt-5 border-t space-y-4 ${
            isLightMode ? 'border-slate-200' : 'border-slate-800/70'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span
                className={`text-xs font-mono font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                ASSESSMENT SCORE & ANSWER KEY VERIFICATION
              </span>
              <h4 className="text-base font-semibold mt-0.5">
                Competency Quiz Results & Correct Answers ({correctQuizCount} /{' '}
                {totalQuizQuestions} Correct · {quizPercent}%)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('quiz')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                isLightMode
                  ? 'border-slate-300 bg-slate-50 text-cyan-700 hover:border-cyan-600'
                  : 'border-slate-700 bg-slate-900 text-cyan-400 hover:border-cyan-400'
              }`}
            >
              Open Interactive Quiz Hub →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {COMPREHENSIVE_QUIZ_QUESTIONS.map((q, idx) => {
              const pickedIdx = quizAnswers[q.id];
              const isAnswered = pickedIdx !== undefined;
              const isCorrect = pickedIdx === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isCorrect
                      ? isLightMode
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-emerald-950/15 border-emerald-500/40'
                      : isAnswered
                        ? isLightMode
                          ? 'bg-rose-50/50 border-rose-300'
                          : 'bg-rose-950/15 border-rose-500/40'
                        : isLightMode
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                      }`}
                    >
                      QUESTION #{idx + 1}
                    </span>
                    <span
                      className={`font-semibold ${
                        isCorrect
                          ? isLightMode
                            ? 'text-emerald-700'
                            : 'text-emerald-400'
                          : isAnswered
                            ? isLightMode
                              ? 'text-rose-700'
                              : 'text-rose-400'
                            : isLightMode
                              ? 'text-amber-700'
                              : 'text-amber-400'
                      }`}
                    >
                      {isCorrect
                        ? '✓ CORRECT (+1 pt)'
                        : isAnswered
                          ? '✖ INCORRECT (0 pt)'
                          : '○ NOT ANSWERED'}
                    </span>
                  </div>

                  <div className="font-semibold leading-snug">{q.question}</div>

                  <div className="space-y-1 pt-1 font-mono text-[11px]">
                    <div
                      className={
                        isCorrect
                          ? isLightMode
                            ? 'text-emerald-800 font-semibold'
                            : 'text-emerald-300 font-semibold'
                          : isAnswered
                            ? isLightMode
                              ? 'text-rose-800 font-semibold'
                              : 'text-rose-300 font-semibold'
                            : isLightMode
                              ? 'text-slate-500'
                              : 'text-slate-400'
                      }
                    >
                      Your Answer:{' '}
                      {isAnswered ? q.options[pickedIdx] : 'Not yet selected'}
                    </div>
                    <div
                      className={
                        isLightMode
                          ? 'text-emerald-700 font-semibold'
                          : 'text-emerald-400 font-semibold'
                      }
                    >
                      ✓ Correct Answer: {q.options[q.correctIndex]}
                    </div>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed pt-1 border-t ${
                      isLightMode
                        ? 'border-slate-200/80 text-slate-600'
                        : 'border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
