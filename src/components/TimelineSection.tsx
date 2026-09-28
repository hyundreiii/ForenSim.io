import React, { useState } from 'react';
import {
  DECOMPOSITION_STAGES,
  DecompositionStage,
  EnvironmentalParams,
  GENERATED_ASSETS,
} from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import { ArrowRight, Clock } from 'lucide-react';

interface TimelineSectionProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  onJumpToSimDay: (day: number) => void;
  isLightMode: boolean;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  params,
  metrics,
  onJumpToSimDay,
  isLightMode,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(
    metrics.currentStage.id
  );

  const inspectedStage: DecompositionStage =
    DECOMPOSITION_STAGES.find((s) => s.id === selectedStageId) ||
    metrics.currentStage;

  // Estimate the Simulation Day required to reach the midpoint of a stage's ADD threshold under current temperature
  const getEstimatedDayForStage = (stage: DecompositionStage) => {
    const midAdd =
      stage.index === 5
        ? 435
        : (stage.addThresholdRange[0] + stage.addThresholdRange[1]) / 2;
    const dailyTemp = Math.max(4, params.temperature);
    return Number(Math.min(30, midAdd / dailyTemp).toFixed(1));
  };

  return (
    <div className="space-y-6">
      {/* Interactive 5-Stage Horizontal Timeline Stepper */}
      <div
        className={`rounded-xl border p-6 ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
            : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 pb-5 border-b ${
            isLightMode ? 'border-slate-200' : 'border-slate-800/60'
          }`}
        >
          <div>
            <span
              className={`text-xs font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              SCIENTIFICALLY SIMPLIFIED PROGRESSION MODEL
            </span>
            <h2 className="text-xl font-semibold mt-0.5">
              Human Decomposition Stage Timeline
            </h2>
          </div>
          <div
            className={`text-xs font-mono ${
              isLightMode ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Active Simulation State:{' '}
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}
            >
              {metrics.currentStage.shortTitle}
            </strong>{' '}
            · {metrics.add.toFixed(1)} ADD (Day {metrics.simDay.toFixed(1)})
          </div>
        </div>

        {/* 5 Stage Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {DECOMPOSITION_STAGES.map((stage) => {
            const isSelected = inspectedStage.id === stage.id;
            const isCurrentSimStage = metrics.currentStage.id === stage.id;
            const estDay = getEstimatedDayForStage(stage);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? isLightMode
                      ? 'bg-cyan-50 border-cyan-600 text-slate-900 shadow-xs'
                      : 'bg-cyan-500/15 border-cyan-400 shadow-sm'
                    : isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span
                      className={`font-semibold ${
                        isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                      }`}
                    >
                      STAGE 0{stage.index}
                    </span>
                    {isCurrentSimStage && (
                      <span
                        className={`font-semibold ${
                          isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                        }`}
                      >
                        ● ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold mt-1.5 leading-snug">
                    {stage.shortTitle.replace(/^0\d\.\s*/, '')}
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-1 ${
                      isLightMode ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {stage.addThresholdRange[0]}–
                    {stage.index === 5 ? '500+' : stage.addThresholdRange[1]} ADD
                  </div>
                </div>

                <div
                  className={`mt-4 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
                    isLightMode
                      ? 'border-slate-200 text-slate-600'
                      : 'border-slate-800/50 text-slate-400'
                  }`}
                >
                  <span>At {params.temperature.toFixed(1)}°C:</span>
                  <span
                    className={`font-semibold ${
                      isLightMode ? 'text-cyan-800' : 'text-cyan-300'
                    }`}
                  >
                    ~Day {estDay}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Stage Breakdown & Non-Graphic Biochemical Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Scientific Mechanisms & Indicators */}
        <div
          className={`lg:col-span-7 rounded-xl border p-6 space-y-5 ${
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
              <div
                className={`flex items-center gap-2 text-xs font-mono font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                <span>STAGE 0{inspectedStage.index} SPECIFICATION</span>
                <span aria-hidden="true">·</span>
                <span>{inspectedStage.baguioDayRange}</span>
              </div>
              <h3 className="text-xl font-semibold mt-1">{inspectedStage.title}</h3>
            </div>

            <button
              type="button"
              onClick={() =>
                onJumpToSimDay(getEstimatedDayForStage(inspectedStage))
              }
              className="px-3.5 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>
                Sync Simulation to Stage (~Day{' '}
                {getEstimatedDayForStage(inspectedStage)})
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p
            className={`text-sm leading-relaxed ${
              isLightMode ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {inspectedStage.summary}
          </p>

          {/* Expected Cellular & Biochemical Processes */}
          <div>
            <h4
              className={`text-xs font-mono uppercase tracking-wider font-semibold mb-2.5 ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              Expected Cellular & Biochemical Processes
            </h4>
            <ul className="space-y-2.5">
              {inspectedStage.cellularProcesses.map((proc, i) => (
                <li
                  key={i}
                  className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-slate-900/75 border-slate-800/90 text-slate-300'
                  }`}
                >
                  <span
                    className={`font-mono font-semibold shrink-0 ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    0{i + 1}.
                  </span>
                  <span>{proc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Baguio Highland Environmental Sensitivity */}
          <div
            className={`p-4 rounded-lg border ${
              isLightMode
                ? 'bg-sky-50 border-sky-200 text-slate-800'
                : 'bg-cyan-950/25 border-cyan-500/30 text-slate-200'
            }`}
          >
            <div
              className={`text-xs font-mono uppercase font-semibold mb-1 ${
                isLightMode ? 'text-cyan-800' : 'text-cyan-400'
              }`}
            >
              Baguio City Highland Microclimate Sensitivity
            </div>
            <p className="text-xs leading-relaxed">
              {inspectedStage.environmentalSensitivity}
            </p>
          </div>
        </div>

        {/* Right 5 Columns: Quantitative Stage Benchmarks & Abstract Cellular Diagram */}
        <div
          className={`lg:col-span-5 rounded-xl border p-6 flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div className="space-y-4">
            <div>
              <span
                className={`text-xs font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                BENCHMARK TELEMETRY PROFILE
              </span>
              <h4 className="text-base font-semibold mt-0.5">
                Stage 0{inspectedStage.index} Laboratory Indicators
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div
                className={`p-3 rounded-lg border ${
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
                  AUTOLYSIS INDEX
                </div>
                <div
                  className={`text-xl font-semibold mt-0.5 tabular-nums ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {inspectedStage.forensicIndicators.autolysisIndex}%
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
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
                  MICROBIAL KINETICS
                </div>
                <div
                  className={`text-xl font-semibold mt-0.5 tabular-nums ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {inspectedStage.forensicIndicators.microbialActivity}%
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
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
                  EXPECTED MASS RETENTION
                </div>
                <div
                  className={`text-xl font-semibold mt-0.5 tabular-nums ${
                    isLightMode ? 'text-amber-700' : 'text-amber-400'
                  }`}
                >
                  {inspectedStage.forensicIndicators.massRetention}%
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
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
                  HEADSPACE VOC
                </div>
                <div
                  className={`text-sm font-semibold mt-1 tabular-nums ${
                    isLightMode ? 'text-sky-700' : 'text-sky-300'
                  }`}
                >
                  {inspectedStage.forensicIndicators.vocConcentration}
                </div>
              </div>
            </div>

            {/* Abstract Scientific Cellular Diagram */}
            <div
              className={`rounded-lg overflow-hidden border relative ${
                isLightMode
                  ? 'border-slate-200 bg-slate-100'
                  : 'border-slate-800 bg-slate-950'
              }`}
            >
              <img
                src={GENERATED_ASSETS.cellularDiagram}
                alt="Scientific diagram of cellular autolysis and enzymatic pathways"
                referrerPolicy="no-referrer"
                className="w-full h-40 object-cover opacity-90"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div
                className={`p-3 border-t ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/90 border-slate-800'
                }`}
              >
                <div
                  className={`text-[11px] font-mono font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  ENTOMOLOGICAL & ECOLOGICAL CORRELATE
                </div>
                <div
                  className={`text-xs mt-0.5 ${
                    isLightMode ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  {inspectedStage.forensicIndicators.entomologicalPhase}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-4 pt-3 border-t text-xs ${
              isLightMode ? 'border-slate-200' : 'border-slate-800/60'
            }`}
          >
            <span
              className={`font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              KEY FORENSIC TAKEAWAY:{' '}
            </span>
            <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
              {inspectedStage.keyTakeaway}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
