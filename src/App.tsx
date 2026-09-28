import React, { useEffect, useState } from 'react';
import {
  DECOMPOSITION_STAGES,
  ENVIRONMENTAL_PRESETS,
  EnvironmentalParams,
  EVIDENCE_ITEMS,
  LEARNING_MODULES,
  ROOM_OBJECTS,
  RoomObjectInfo,
  StudentObservation,
} from './data/simulationData';
import { computeSimulationMetrics } from './utils/simulationMath';
import { ForensicRoomViewport } from './components/ForensicRoomViewport';
import { EnvironmentalControlsPanel } from './components/EnvironmentalControlsPanel';
import { ScientificChartsPanel } from './components/ScientificChartsPanel';
import { TimelineSection } from './components/TimelineSection';
import { ObservationPanel } from './components/ObservationPanel';
import { EvidenceSection } from './components/EvidenceSection';
import { LearningModulesSection } from './components/LearningModulesSection';
import { QuizHubSection } from './components/QuizHubSection';
import { ReportsAndScenarioSection } from './components/ReportsAndScenarioSection';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileSpreadsheet,
  FlaskConical,
  Layers,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sun,
} from 'lucide-react';

type NavTab =
  | 'dashboard'
  | 'simulation'
  | 'timeline'
  | 'evidence'
  | 'modules'
  | 'quiz'
  | 'reports';

const STORAGE_KEY = 'cordillera_forensic_sim_progress_v1';

const DEFAULT_OBSERVATIONS: StudentObservation[] = [
  {
    id: 'obs-seed-1',
    observationDate: '2026-09-27',
    simulationDay: 1.5,
    addValue: 24.8,
    stageName: '01. Initial Stage',
    environmentalConditions: {
      temperature: 16.5,
      humidity: 82,
      airflow: 0.35,
      lightExposure: 180,
      roomCondition: 'Highland Natural Draft',
    },
    observedChanges:
      'Initial cellular autolysis underway; matrix pH shifted from 7.15 to 6.72. Mass retention at 99.1% with baseline VOC reading (2.1 ppm).',
    evidenceNotes:
      'SEN-01 barometric pressure stable at 845.2 hPa (Baguio 1,540m ASL). Zero dipteran colonization inside mesh-screened chamber.',
    studentInterpretation:
      'Cool 16.5°C Baguio indoor temperature moderates early enzymatic kinetics compared to lowland tropical averages.',
  },
  {
    id: 'obs-seed-2',
    observationDate: '2026-09-27',
    simulationDay: 8.5,
    addValue: 140.3,
    stageName: '03. Active Decomposition',
    environmentalConditions: {
      temperature: 16.5,
      humidity: 82,
      airflow: 0.35,
      lightExposure: 180,
      roomCondition: 'Highland Natural Draft',
    },
    observedChanges:
      'Entered Active Decomposition (140.3 ADD). Headspace VOC elevated to 118.4 ppm; CAM-05 LWIR thermal sensor detects +1.4°C metabolic differential.',
    evidenceNotes:
      'Volumetric expansion recorded in abdominal compartment. High relative humidity (82% RH) maintains surface moisture.',
    studentInterpretation:
      'Anaerobic proteolysis and lipid hydrolysis are active; sustained highland humidity favors potential saponification if moisture persists.',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isLightMode, setIsLightMode] = useState<boolean>(false);

  // Simulation Clock & Environmental Variables
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(1);
  const [simDay, setSimDay] = useState<number>(4.0);
  const [params, setParams] = useState<EnvironmentalParams>(
    ENVIRONMENTAL_PRESETS[0].params
  );
  const [selectedRoomObject, setSelectedRoomObject] = useState<RoomObjectInfo>(
    ROOM_OBJECTS.find((o) => o.id === 'specimen-area') || ROOM_OBJECTS[0]
  );

  // Student Progress & Persistence State
  const [inspectedObjectIds, setInspectedObjectIds] = useState<string[]>([
    'specimen-area',
    'env-sensor',
    'exam-table',
  ]);
  const [examinedEvidenceIds, setExaminedEvidenceIds] = useState<string[]>([
    'ev-01',
  ]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [moduleQuizScores, setModuleQuizScores] = useState<
    Record<string, { score: number; total: number }>
  >({});
  const [hasAdjustedVariables, setHasAdjustedVariables] =
    useState<boolean>(false);
  const [observations, setObservations] =
    useState<StudentObservation[]>(DEFAULT_OBSERVATIONS);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Load saved student progress from LocalStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.inspectedObjectIds))
          setInspectedObjectIds(parsed.inspectedObjectIds);
        if (Array.isArray(parsed.examinedEvidenceIds))
          setExaminedEvidenceIds(parsed.examinedEvidenceIds);
        if (Array.isArray(parsed.completedModuleIds))
          setCompletedModuleIds(parsed.completedModuleIds);
        if (parsed.moduleQuizScores)
          setModuleQuizScores(parsed.moduleQuizScores);
        if (Array.isArray(parsed.observations) && parsed.observations.length > 0)
          setObservations(parsed.observations);
        if (parsed.quizAnswers) setQuizAnswers(parsed.quizAnswers);
        if (typeof parsed.quizSubmitted === 'boolean')
          setQuizSubmitted(parsed.quizSubmitted);
      }
    } catch {
      // Ignore storage parse errors
    }
  }, []);

  // Save student progress to LocalStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          inspectedObjectIds,
          examinedEvidenceIds,
          completedModuleIds,
          moduleQuizScores,
          observations,
          quizAnswers,
          quizSubmitted,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    inspectedObjectIds,
    examinedEvidenceIds,
    completedModuleIds,
    moduleQuizScores,
    observations,
    quizAnswers,
    quizSubmitted,
  ]);

  // Real-time Simulation Clock Loop when Active
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSimDay((prev) => {
        const next = prev + 0.1 * simSpeed;
        if (next >= 30) {
          setIsRunning(false);
          return 30;
        }
        return Number(next.toFixed(1));
      });
    }, 350);
    return () => clearInterval(interval);
  }, [isRunning, simSpeed]);

  const metrics = computeSimulationMetrics(params, simDay);

  const handleSelectRoomObject = (obj: RoomObjectInfo) => {
    setSelectedRoomObject(obj);
    setInspectedObjectIds((prev) =>
      prev.includes(obj.id) ? prev : [...prev, obj.id]
    );
  };

  const handleChangeParams = (newParams: EnvironmentalParams) => {
    setParams(newParams);
    setHasAdjustedVariables(true);
  };

  const handleMarkEvidenceExamined = (id: string) => {
    setExaminedEvidenceIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleRecordModuleQuiz = (
    moduleId: string,
    score: number,
    total: number
  ) => {
    setModuleQuizScores((prev) => ({
      ...prev,
      [moduleId]: { score, total },
    }));
    setCompletedModuleIds((prev) =>
      prev.includes(moduleId) ? prev : [...prev, moduleId]
    );
  };

  const handleRecordObservation = (newObs: Omit<StudentObservation, 'id'>) => {
    const entry: StudentObservation = {
      ...newObs,
      id: `obs-${Date.now()}`,
    };
    setObservations((prev) => [entry, ...prev]);
  };

  const handleDeleteObservation = (id: string) => {
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  const formatElapsedClock = (days: number) => {
    const wholeDays = Math.floor(days);
    const remHours = Math.round((days - wholeDays) * 24);
    return `T+${String(wholeDays).padStart(2, '0')}d ${String(remHours).padStart(2, '0')}h`;
  };

  // Jump directly to a specific Decomposition Stage
  const jumpToStage = (stageIndex: number) => {
    const stg = DECOMPOSITION_STAGES.find((s) => s.index === stageIndex);
    if (!stg) return;
    const midAdd =
      stg.index === 5
        ? 435
        : (stg.addThresholdRange[0] + stg.addThresholdRange[1]) / 2;
    const targetDay = Math.min(
      30,
      Math.max(
        0.5,
        Number((midAdd / Math.max(4, params.temperature)).toFixed(1))
      )
    );
    setSimDay(targetDay);
  };

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'simulation', label: 'Simulation' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'modules', label: 'Learning Modules' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'reports', label: 'Reports' },
  ];

  // Overall Lab Investigation Progress Percentage
  const progressPercent = Math.min(
    100,
    Math.round(
      ((inspectedObjectIds.length / ROOM_OBJECTS.length) * 25 +
        (examinedEvidenceIds.length / EVIDENCE_ITEMS.length) * 25 +
        (completedModuleIds.length / LEARNING_MODULES.length) * 25 +
        (observations.length >= 3 ? 25 : (observations.length / 3) * 25))
    )
  );

  const [dashboardSection, setDashboardSection] = useState<
    'chamber' | 'climate-timeline' | 'analytics-log'
  >('chamber');

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isLightMode
          ? 'bg-[#F8FAFC] text-slate-900'
          : 'bg-[#070B14] text-slate-100'
      }`}
    >
      {/* TOP BAR CONTRACT: Strictly 1 row, 3 zones (Brand Wordmark | Clean Nav Links | Primary Actions) */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-4 border-b backdrop-blur-md ${
          isLightMode
            ? 'bg-white/95 border-slate-200'
            : 'bg-[#070B14]/95 border-slate-800'
        }`}
      >
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-display font-semibold tracking-tight whitespace-nowrap"
        >
          Cordillera Forensic Lab
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? isLightMode
                      ? 'border-cyan-600 text-cyan-700 font-semibold'
                      : 'border-cyan-400 text-cyan-400 font-semibold'
                    : isLightMode
                      ? 'border-transparent text-slate-600 hover:text-slate-900'
                      : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLightMode((prev) => !prev)}
            title="Toggle Dark / Light Laboratory Interface"
            className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              isLightMode
                ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
            }`}
          >
            {isLightMode ? (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span>Dark Theme</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Theme</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap shadow-sm"
          >
            Baguio Case Scenario
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (for small screens) */}
      <div
        className={`md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 border-b ${
          isLightMode
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-950 border-slate-800'
        }`}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* STICKY SIMULATION PLAYBACK & STAGE TIMELINE BAR */}
      <div
        className={`sticky top-[65px] z-30 border-b px-4 sm:px-8 py-3 backdrop-blur-md ${
          isLightMode
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
            : 'bg-[#0B1120]/95 border-slate-800 text-slate-200'
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Simulation Playback & Scrubber */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shadow-xs ${
                isRunning
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>

            {/* Step & Speed Controls */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() =>
                  setSimDay((d) => Math.max(0, Number((d - 1).toFixed(1))))
                }
                className={`px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                  isLightMode
                    ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-500'
                    : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                }`}
              >
                −1d
              </button>
              <button
                type="button"
                onClick={() =>
                  setSimDay((d) => Math.min(30, Number((d + 0.5).toFixed(1))))
                }
                className={`px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                  isLightMode
                    ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-500'
                    : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                }`}
              >
                +12h
              </button>
              <button
                type="button"
                onClick={() =>
                  setSimDay((d) => Math.min(30, Number((d + 1).toFixed(1))))
                }
                className={`px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                  isLightMode
                    ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-500'
                    : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                }`}
              >
                +1d
              </button>
              <button
                type="button"
                onClick={() =>
                  setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))
                }
                className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap ${
                  isLightMode
                    ? 'border-slate-300 bg-slate-50 text-cyan-700 hover:border-cyan-500'
                    : 'border-slate-700 bg-slate-900 text-cyan-400 hover:border-cyan-400'
                }`}
              >
                {simSpeed}x Speed
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setSimDay(0);
                }}
                title="Reset Simulation Day to 0.0"
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLightMode
                    ? 'border-slate-300 bg-slate-50 text-slate-600 hover:text-slate-900'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Day Scrubber Slider */}
            <div className="flex items-center gap-2.5 ml-1">
              <span
                className={`text-sm font-mono tabular-nums font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                Day {simDay.toFixed(1)}
              </span>
              <input
                type="range"
                aria-label="Simulation Day Scrubber"
                min={0}
                max={30}
                step={0.5}
                value={simDay}
                onChange={(e) => setSimDay(parseFloat(e.target.value))}
                className="w-28 sm:w-36 cursor-pointer h-2 rounded-lg"
              />
            </div>
          </div>

          {/* Center: Interactive 5-Stage Quick-Jump Segmented Control */}
          <div
            className={`hidden xl:flex items-center gap-1 p-1 rounded-lg border ${
              isLightMode
                ? 'bg-slate-100 border-slate-200'
                : 'bg-slate-950/90 border-slate-800'
            }`}
          >
            {DECOMPOSITION_STAGES.map((stg) => {
              const isCurrent = metrics.currentStage.index === stg.index;
              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => jumpToStage(stg.index)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                      : isLightMode
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {stg.shortTitle}
                </button>
              );
            })}
          </div>

          {/* Right: Clean Unboxed Telemetry Readout */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono tabular-nums">
            <span
              className={
                isRunning
                  ? isLightMode
                    ? 'text-emerald-700 font-semibold'
                    : 'text-emerald-400 font-semibold'
                  : isLightMode
                    ? 'text-amber-700 font-medium'
                    : 'text-amber-400 font-medium'
              }
            >
              {isRunning ? 'Active' : 'Paused'}
            </span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span>{formatElapsedClock(simDay)}</span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span
              className={`font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              {metrics.add} ADD
            </span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span>{params.temperature.toFixed(1)}°C</span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span>{params.humidity}% RH</span>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Clean Facility Context & Progress Header */}
        <div
          className={`pb-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            isLightMode ? 'border-slate-200' : 'border-slate-800/80'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={`font-semibold ${
                  isLightMode ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                Baguio City Highland Forensic Facility
              </span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span
                className={`font-mono text-xs ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                1,540m ASL · 845.2 hPa
              </span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span
                className={`text-xs ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {params.roomCondition}
              </span>
            </div>
            <p
              className={`text-sm ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Interactive 3D anatomical and environmental simulation for
              post-mortem interval (PMI) and Accumulated Degree Days (ADD)
              analysis.
            </p>
          </div>

          {/* Student Progress & Quick Section Links */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div
                  className={`text-xs font-medium ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Investigation Progress
                </div>
                <div
                  className={`text-sm font-mono font-semibold tabular-nums ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {progressPercent}% Complete
                </div>
              </div>
              <div
                className={`w-24 h-2 rounded-full overflow-hidden ${
                  isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              >
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  isLightMode
                    ? 'border-slate-300 bg-white text-slate-700 hover:border-cyan-600'
                    : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-cyan-400'
                }`}
              >
                Evidence ({examinedEvidenceIds.length}/{EVIDENCE_ITEMS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  isLightMode
                    ? 'border-slate-300 bg-white text-slate-700 hover:border-cyan-600'
                    : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-cyan-400'
                }`}
              >
                Modules ({completedModuleIds.length}/{LEARNING_MODULES.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  isLightMode
                    ? 'border-slate-300 bg-white text-slate-700 hover:border-cyan-600'
                    : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-cyan-400'
                }`}
              >
                Quiz Hub
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: MAIN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Simulation Metrics Strip (Clean 4-Column Summary) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Elapsed Time & Thermal Sum */}
              <div
                className={`p-5 rounded-xl border ${
                  isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Elapsed Simulation Time
                </div>
                <div className="mt-1.5 flex items-baseline justify-between font-mono tabular-nums">
                  <div>
                    <span
                      className={`text-2xl font-semibold ${
                        isLightMode ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      Day {simDay.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({formatElapsedClock(simDay)})
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {metrics.add} ADD
                  </span>
                </div>
                <div
                  className={`mt-3 pt-2.5 border-t text-xs flex justify-between ${
                    isLightMode
                      ? 'border-slate-100 text-slate-500'
                      : 'border-slate-800/70 text-slate-400'
                  }`}
                >
                  <span>Thermal Unit Sum</span>
                  <span className="font-mono">{metrics.add} °C·days</span>
                </div>
              </div>

              {/* Card 2: Chamber Climate */}
              <div
                className={`p-5 rounded-xl border ${
                  isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Chamber Micro-Climate
                </div>
                <div className="mt-1.5 flex items-baseline justify-between font-mono tabular-nums">
                  <div>
                    <span
                      className={`text-2xl font-semibold ${
                        isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                      }`}
                    >
                      {params.temperature.toFixed(1)}°C
                    </span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span
                      className={`text-xl font-semibold ${
                        isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                      }`}
                    >
                      {params.humidity}% RH
                    </span>
                  </div>
                </div>
                <div
                  className={`mt-3 pt-2.5 border-t text-xs flex justify-between font-mono ${
                    isLightMode
                      ? 'border-slate-100 text-slate-500'
                      : 'border-slate-800/70 text-slate-400'
                  }`}
                >
                  <span>Airflow: {params.airflow.toFixed(2)} m/s</span>
                  <span>Q₁₀: {metrics.q10Multiplier}x</span>
                </div>
              </div>

              {/* Card 3: Active Decomposition Stage */}
              <div
                className={`p-5 rounded-xl border ${
                  isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Current Biological Stage
                </div>
                <div className="mt-1.5">
                  <div
                    className={`text-lg font-semibold truncate ${
                      isLightMode ? 'text-amber-700' : 'text-amber-400'
                    }`}
                  >
                    {metrics.currentStage.shortTitle}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className={`flex-1 h-2 rounded-full overflow-hidden ${
                      isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className="h-full bg-amber-400 transition-all duration-150"
                      style={{ width: `${metrics.stageProgressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {metrics.stageProgressPercent}%
                  </span>
                </div>
              </div>

              {/* Card 4: Tissue Mass & VOC Telemetry */}
              <div
                className={`p-5 rounded-xl border ${
                  isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Biomass & Headspace VOC
                </div>
                <div className="mt-1.5 flex items-baseline justify-between font-mono tabular-nums">
                  <span
                    className={`text-2xl font-semibold ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {metrics.massRetentionPercent}% Mass
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {metrics.vocPpm} ppm
                  </span>
                </div>
                <div
                  className={`mt-3 pt-2.5 border-t text-xs flex justify-between font-mono ${
                    isLightMode
                      ? 'border-slate-100 text-slate-500'
                      : 'border-slate-800/70 text-slate-400'
                  }`}
                >
                  <span>Matrix pH: {metrics.matrixPh}</span>
                  <span>Adipocere: {metrics.adipocerePotential}%</span>
                </div>
              </div>
            </div>

            {/* Dashboard Workspace Mode Selector (Eliminates vertical scroll fatigue) */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div
                className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
                  isLightMode
                    ? 'bg-slate-100 border-slate-200'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDashboardSection('chamber')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    dashboardSection === 'chamber'
                      ? isLightMode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-cyan-500 text-slate-950'
                      : isLightMode
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-300 hover:text-white'
                  }`}
                >
                  1. 3D Chamber & Anatomy Inspector
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardSection('climate-timeline')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    dashboardSection === 'climate-timeline'
                      ? isLightMode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-cyan-500 text-slate-950'
                      : isLightMode
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-300 hover:text-white'
                  }`}
                >
                  2. Climate Controls & 5-Stage Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardSection('analytics-log')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    dashboardSection === 'analytics-log'
                      ? isLightMode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-cyan-500 text-slate-950'
                      : isLightMode
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-300 hover:text-white'
                  }`}
                >
                  3. Telemetry Charts & Observation Log ({observations.length})
                </button>
              </div>

              <span
                className={`text-xs ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Switch workspace panels above to inspect the 3D subject, tune
                climate parameters, or log observations without scrolling.
              </span>
            </div>

            {dashboardSection === 'chamber' && (
              <ForensicRoomViewport
                params={params}
                metrics={metrics}
                selectedObject={selectedRoomObject}
                onSelectObject={handleSelectRoomObject}
                inspectedObjectIds={inspectedObjectIds}
                isLightMode={isLightMode}
                onChangeParams={handleChangeParams}
                onJumpToSimDay={(day) => setSimDay(day)}
              />
            )}

            {dashboardSection === 'climate-timeline' && (
              <div className="space-y-8">
                <EnvironmentalControlsPanel
                  params={params}
                  onChangeParams={handleChangeParams}
                  metrics={metrics}
                  isLightMode={isLightMode}
                />
                <TimelineSection
                  params={params}
                  metrics={metrics}
                  onJumpToSimDay={(day) => setSimDay(day)}
                  isLightMode={isLightMode}
                />
              </div>
            )}

            {dashboardSection === 'analytics-log' && (
              <div className="space-y-8">
                <ScientificChartsPanel
                  params={params}
                  metrics={metrics}
                  observations={observations}
                  onSelectSimDay={(day) => setSimDay(day)}
                  isLightMode={isLightMode}
                />
                <ObservationPanel
                  params={params}
                  metrics={metrics}
                  observations={observations}
                  onRecordObservation={handleRecordObservation}
                  onDeleteObservation={handleDeleteObservation}
                  isLightMode={isLightMode}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DEDICATED INTERACTIVE ROOM & ENVIRONMENTAL SIMULATION SANDBOX */}
        {activeTab === 'simulation' && (
          <div className="space-y-8">
            <ForensicRoomViewport
              params={params}
              metrics={metrics}
              selectedObject={selectedRoomObject}
              onSelectObject={handleSelectRoomObject}
              inspectedObjectIds={inspectedObjectIds}
              isLightMode={isLightMode}
              onChangeParams={handleChangeParams}
              onJumpToSimDay={(day) => setSimDay(day)}
            />
            <EnvironmentalControlsPanel
              params={params}
              onChangeParams={handleChangeParams}
              metrics={metrics}
              isLightMode={isLightMode}
            />
            <ObservationPanel
              params={params}
              metrics={metrics}
              observations={observations}
              onRecordObservation={handleRecordObservation}
              onDeleteObservation={handleDeleteObservation}
              isLightMode={isLightMode}
            />
          </div>
        )}

        {/* VIEW 3: TIMELINE & DATA VISUALIZATION */}
        {activeTab === 'timeline' && (
          <div className="space-y-8">
            <TimelineSection
              params={params}
              metrics={metrics}
              onJumpToSimDay={(day) => setSimDay(day)}
              isLightMode={isLightMode}
            />
            <ScientificChartsPanel
              params={params}
              metrics={metrics}
              observations={observations}
              onSelectSimDay={(day) => setSimDay(day)}
              isLightMode={isLightMode}
            />
          </div>
        )}

        {/* VIEW 4: FORENSIC EVIDENCE ANALYSIS */}
        {activeTab === 'evidence' && (
          <EvidenceSection
            params={params}
            metrics={metrics}
            examinedEvidenceIds={examinedEvidenceIds}
            onMarkEvidenceExamined={handleMarkEvidenceExamined}
            isLightMode={isLightMode}
          />
        )}

        {/* VIEW 5: LEARNING MODULES (01–06) */}
        {activeTab === 'modules' && (
          <LearningModulesSection
            completedModuleIds={completedModuleIds}
            moduleQuizScores={moduleQuizScores}
            onRecordModuleQuiz={handleRecordModuleQuiz}
            onNavigateTab={(t) => setActiveTab(t as NavTab)}
            isLightMode={isLightMode}
          />
        )}

        {/* VIEW 6: INTERACTIVE QUIZ HUB */}
        {activeTab === 'quiz' && (
          <QuizHubSection
            quizAnswers={quizAnswers}
            onSelectQuizAnswer={(qId, oIdx) =>
              setQuizAnswers((prev) => ({ ...prev, [qId]: oIdx }))
            }
            quizSubmitted={quizSubmitted}
            onSubmitFullQuiz={() => setQuizSubmitted(true)}
            onResetFullQuiz={() => {
              setQuizAnswers({});
              setQuizSubmitted(false);
            }}
            isLightMode={isLightMode}
          />
        )}

        {/* VIEW 7: BAGUIO CASE SCENARIO & SIMULATION REPORT */}
        {activeTab === 'reports' && (
          <ReportsAndScenarioSection
            params={params}
            metrics={metrics}
            inspectedObjectIds={inspectedObjectIds}
            examinedEvidenceIds={examinedEvidenceIds}
            completedModuleIds={completedModuleIds}
            hasAdjustedVariables={hasAdjustedVariables}
            observations={observations}
            quizAnswers={quizAnswers}
            quizSubmitted={quizSubmitted}
            onRecordObservation={handleRecordObservation}
            onDeleteObservation={handleDeleteObservation}
            onNavigateTab={(t) => setActiveTab(t as NavTab)}
            isLightMode={isLightMode}
          />
        )}
      </main>

      {/* QUIET ACADEMIC FOOTER */}
      <footer
        className={`mt-12 border-t px-4 sm:px-8 py-6 text-xs ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-500'
            : 'bg-[#050810] border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            Cordillera Forensic Simulation Laboratory · Baguio City, Philippines
            · Simulation-Based Learning on Human Decomposition
          </div>
          <div className="font-mono">
            Educational Simulation — Results are simplified models for learning
            purposes.
          </div>
        </div>
      </footer>
    </div>
  );
}
