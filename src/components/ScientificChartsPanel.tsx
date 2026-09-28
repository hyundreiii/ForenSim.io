import React, { useState } from 'react';
import {
  EnvironmentalParams,
  StudentObservation,
} from '../data/simulationData';
import {
  generateTimeSeriesData,
  SimulationMetrics,
  TimeSeriesPoint,
} from '../utils/simulationMath';

interface ScientificChartsPanelProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  observations: StudentObservation[];
  onSelectSimDay: (day: number) => void;
  isLightMode: boolean;
}

export const ScientificChartsPanel: React.FC<ScientificChartsPanelProps> = ({
  params,
  metrics,
  observations,
  onSelectSimDay,
  isLightMode,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const series = generateTimeSeriesData(params);
  const activeDayIndex =
    hoveredDay !== null ? hoveredDay : Math.min(30, Math.round(metrics.simDay));
  const activePoint: TimeSeriesPoint = series[activeDayIndex] || series[0];

  // Helper to build SVG polyline points in a 520x160 coordinate box
  const buildPolyline = (
    getter: (p: TimeSeriesPoint) => number,
    minVal: number,
    maxVal: number
  ) => {
    return series
      .map((pt, idx) => {
        const x = 36 + (idx / 30) * 468;
        const norm = (getter(pt) - minVal) / Math.max(0.001, maxVal - minVal);
        const y = 140 - Math.max(0, Math.min(1, norm)) * 116;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const currentDayX = 36 + (Math.min(30, metrics.simDay) / 30) * 468;

  const gridStroke = isLightMode ? '#cbd5e1' : '#334155';
  const axisLabelClass = isLightMode
    ? 'fill-slate-600 text-[9px] font-mono'
    : 'fill-slate-400 text-[9px] font-mono';

  return (
    <div className="space-y-6">
      {/* Header & Interactive Crosshair Telemetry Readout */}
      <div
        className={`rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
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
            MULTI-CHANNEL SCIENTIFIC TELEMETRY & PROGRESSION CURVES
          </span>
          <h3 className="text-lg font-semibold mt-0.5">
            30-Day Chamber Time-Series & Decomposition Kinetics
          </h3>
        </div>

        {/* Synchronized Crosshair Readout Pill-Free Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
          <div>
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
              INSPECTED DAY:{' '}
            </span>
            <span
              className={`font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              Day {activePoint.day.toFixed(1)}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <div>
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
              ADD:{' '}
            </span>
            <span className="font-semibold">{activePoint.addCumulative.toFixed(1)} °C·d</span>
          </div>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <div>
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
              MASS RETAINED:{' '}
            </span>
            <span
              className={`font-semibold ${
                isLightMode ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              {activePoint.massRetention.toFixed(1)}%
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <div>
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
              VOC:{' '}
            </span>
            <span
              className={`font-semibold ${
                isLightMode ? 'text-amber-700' : 'text-amber-400'
              }`}
            >
              {activePoint.vocPpm.toFixed(1)} ppm
            </span>
          </div>
        </div>
      </div>

      {/* 2x2 Scientific Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Simulated Decomposition Progression (Mass Retention vs Baguio Baseline) */}
        <div
          className={`rounded-xl border p-5 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                className={`text-[11px] font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                CHART 01 · GRAVIMETRIC PROGRESSION
              </span>
              <h4 className="text-sm font-semibold">
                Simulated Decomposition Progression (Mass Retention %)
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 inline-block ${
                    isLightMode ? 'bg-cyan-600' : 'bg-cyan-400'
                  }`}
                />{' '}
                Active Model
              </span>
              <span
                className={`flex items-center gap-1 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <span className="w-2.5 h-0.5 bg-slate-500 border-b border-dashed inline-block" />{' '}
                Baguio 16.5°C Ref
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 520 170"
            className="w-full h-44 overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredDay(null)}
          >
            {/* Horizontal grid lines */}
            {[100, 75, 50, 25].map((val, i) => {
              const y = 24 + i * 38.6;
              return (
                <g key={val}>
                  <line
                    x1={36}
                    y1={y}
                    x2={504}
                    y2={y}
                    stroke={gridStroke}
                    strokeDasharray="3 3"
                    strokeWidth="0.7"
                  />
                  <text
                    x={30}
                    y={y + 3}
                    textAnchor="end"
                    className={axisLabelClass}
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Baguio 16.5°C Reference Dashed Curve */}
            <polyline
              fill="none"
              stroke="#64748b"
              strokeWidth="1.75"
              strokeDasharray="4 4"
              points={buildPolyline((p) => p.baguioBaselineMassRetention, 15, 100)}
            />

            {/* Active Simulation Curve */}
            <polyline
              fill="none"
              stroke={isLightMode ? '#0891b2' : '#22d3ee'}
              strokeWidth="2.5"
              points={buildPolyline((p) => p.massRetention, 15, 100)}
            />

            {/* Current Simulation Day Marker Line */}
            <line
              x1={currentDayX}
              y1={18}
              x2={currentDayX}
              y2={144}
              stroke={isLightMode ? '#d97706' : '#f59e0b'}
              strokeWidth="1.5"
            />
            <text
              x={currentDayX}
              y={14}
              textAnchor="middle"
              className={
                isLightMode
                  ? 'fill-amber-700 text-[9px] font-mono font-semibold'
                  : 'fill-amber-400 text-[9px] font-mono'
              }
            >
              Day {metrics.simDay.toFixed(1)}
            </text>

            {/* Interactive Day Scrub Columns */}
            {series.map((pt, idx) => {
              const x = 36 + (idx / 30) * 468;
              return (
                <rect
                  key={pt.day}
                  x={x - 7}
                  y={16}
                  width={14}
                  height={130}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(idx)}
                  onClick={() => onSelectSimDay(pt.day)}
                />
              );
            })}

            {/* X-Axis Labels */}
            {[0, 5, 10, 15, 20, 25, 30].map((d) => {
              const x = 36 + (d / 30) * 468;
              return (
                <text
                  key={d}
                  x={x}
                  y={160}
                  textAnchor="middle"
                  className={axisLabelClass}
                >
                  D{d}
                </text>
              );
            })}
          </svg>
        </div>

        {/* CHART 2: Temperature Over Time (Ambient vs Specimen Micro-Environment) */}
        <div
          className={`rounded-xl border p-5 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                className={`text-[11px] font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                CHART 02 · THERMAL TELEMETRY
              </span>
              <h4 className="text-sm font-semibold">
                Temperature Over Time (Ambient vs. Metabolic Thermal Δ)
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-amber-700' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 inline-block ${
                    isLightMode ? 'bg-amber-600' : 'bg-amber-400'
                  }`}
                />{' '}
                Specimen Surface
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-sky-700' : 'text-sky-400'
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 inline-block ${
                    isLightMode ? 'bg-sky-600' : 'bg-sky-400'
                  }`}
                />{' '}
                Chamber Ambient
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 520 170"
            className="w-full h-44 overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredDay(null)}
          >
            {[40, 30, 20, 10].map((val, i) => {
              const y = 24 + i * 38.6;
              return (
                <g key={val}>
                  <line
                    x1={36}
                    y1={y}
                    x2={504}
                    y2={y}
                    stroke={gridStroke}
                    strokeDasharray="3 3"
                    strokeWidth="0.7"
                  />
                  <text
                    x={30}
                    y={y + 3}
                    textAnchor="end"
                    className={axisLabelClass}
                  >
                    {val}°C
                  </text>
                </g>
              );
            })}

            {/* Chamber Ambient Line */}
            <polyline
              fill="none"
              stroke={isLightMode ? '#0284c7' : '#38bdf8'}
              strokeWidth="2"
              points={buildPolyline((p) => p.ambientTemp, 4, 42)}
            />

            {/* Specimen Micro-Environment Line (includes exothermic active peak) */}
            <polyline
              fill="none"
              stroke={isLightMode ? '#d97706' : '#f59e0b'}
              strokeWidth="2.2"
              points={buildPolyline((p) => p.specimenTemp, 4, 42)}
            />

            <line
              x1={currentDayX}
              y1={18}
              x2={currentDayX}
              y2={144}
              stroke={isLightMode ? '#0891b2' : '#22d3ee'}
              strokeWidth="1.2"
            />

            {series.map((pt, idx) => {
              const x = 36 + (idx / 30) * 468;
              return (
                <rect
                  key={pt.day}
                  x={x - 7}
                  y={16}
                  width={14}
                  height={130}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(idx)}
                  onClick={() => onSelectSimDay(pt.day)}
                />
              );
            })}

            {[0, 5, 10, 15, 20, 25, 30].map((d) => {
              const x = 36 + (d / 30) * 468;
              return (
                <text
                  key={d}
                  x={x}
                  y={160}
                  textAnchor="middle"
                  className={axisLabelClass}
                >
                  D{d}
                </text>
              );
            })}
          </svg>
        </div>

        {/* CHART 3: Humidity & Substrate Moisture Over Time */}
        <div
          className={`rounded-xl border p-5 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                className={`text-[11px] font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                CHART 03 · HYGROMETRIC PROFILE
              </span>
              <h4 className="text-sm font-semibold">
                Humidity & Substrate Moisture Index Over Time
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 inline-block ${
                    isLightMode ? 'bg-emerald-600' : 'bg-emerald-400'
                  }`}
                />{' '}
                Chamber RH %
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-300'
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 inline-block ${
                    isLightMode ? 'bg-cyan-600' : 'bg-cyan-300'
                  }`}
                />{' '}
                Matrix Moisture
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 520 170"
            className="w-full h-44 overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredDay(null)}
          >
            {[100, 75, 50, 25].map((val, i) => {
              const y = 24 + i * 38.6;
              return (
                <g key={val}>
                  <line
                    x1={36}
                    y1={y}
                    x2={504}
                    y2={y}
                    stroke={gridStroke}
                    strokeDasharray="3 3"
                    strokeWidth="0.7"
                  />
                  <text
                    x={30}
                    y={y + 3}
                    textAnchor="end"
                    className={axisLabelClass}
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            <polyline
              fill="none"
              stroke={isLightMode ? '#059669' : '#10b981'}
              strokeWidth="2"
              points={buildPolyline((p) => p.relativeHumidity, 15, 100)}
            />
            <polyline
              fill="none"
              stroke={isLightMode ? '#0891b2' : '#67e8f9'}
              strokeWidth="2"
              strokeDasharray="3 3"
              points={buildPolyline((p) => p.substrateMoisture, 15, 100)}
            />

            <line
              x1={currentDayX}
              y1={18}
              x2={currentDayX}
              y2={144}
              stroke={isLightMode ? '#d97706' : '#f59e0b'}
              strokeWidth="1.2"
            />

            {series.map((pt, idx) => {
              const x = 36 + (idx / 30) * 468;
              return (
                <rect
                  key={pt.day}
                  x={x - 7}
                  y={16}
                  width={14}
                  height={130}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(idx)}
                  onClick={() => onSelectSimDay(pt.day)}
                />
              );
            })}

            {[0, 5, 10, 15, 20, 25, 30].map((d) => {
              const x = 36 + (d / 30) * 468;
              return (
                <text
                  key={d}
                  x={x}
                  y={160}
                  textAnchor="middle"
                  className={axisLabelClass}
                >
                  D{d}
                </text>
              );
            })}
          </svg>
        </div>

        {/* CHART 4: Environmental Condition Timeline & VOC Headspace Curve */}
        <div
          className={`rounded-xl border p-5 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                className={`text-[11px] font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                CHART 04 · CHEMICAL & THERMAL INTEGRAL
              </span>
              <h4 className="text-sm font-semibold">
                VOC Emission Signature (ppm) & Student Observation Markers
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-amber-700' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 inline-block ${
                    isLightMode ? 'bg-amber-600' : 'bg-amber-400'
                  }`}
                />{' '}
                VOC (ppm)
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                ● Logged Observations ({observations.length})
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 520 170"
            className="w-full h-44 overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredDay(null)}
          >
            {[200, 150, 100, 50].map((val, i) => {
              const y = 24 + i * 38.6;
              return (
                <g key={val}>
                  <line
                    x1={36}
                    y1={y}
                    x2={504}
                    y2={y}
                    stroke={gridStroke}
                    strokeDasharray="3 3"
                    strokeWidth="0.7"
                  />
                  <text
                    x={30}
                    y={y + 3}
                    textAnchor="end"
                    className={axisLabelClass}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* VOC Emission Curve */}
            <polyline
              fill="none"
              stroke={isLightMode ? '#d97706' : '#f59e0b'}
              strokeWidth="2.3"
              points={buildPolyline((p) => p.vocPpm, 0, 210)}
            />

            {/* Plotted Student Observation History Markers */}
            {observations.map((obs) => {
              const clampedDay = Math.min(30, Math.max(0, obs.simulationDay));
              const cx = 36 + (clampedDay / 30) * 468;
              return (
                <g key={obs.id}>
                  <line
                    x1={cx}
                    y1={24}
                    x2={cx}
                    y2={140}
                    stroke={isLightMode ? '#059669' : '#10b981'}
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx={cx}
                    cy={34}
                    r={4.5}
                    className={
                      isLightMode
                        ? 'fill-emerald-600 stroke-white stroke-2'
                        : 'fill-emerald-400 stroke-slate-950 stroke-2'
                    }
                  />
                </g>
              );
            })}

            <line
              x1={currentDayX}
              y1={18}
              x2={currentDayX}
              y2={144}
              stroke={isLightMode ? '#0891b2' : '#22d3ee'}
              strokeWidth="1.4"
            />

            {series.map((pt, idx) => {
              const x = 36 + (idx / 30) * 468;
              return (
                <rect
                  key={pt.day}
                  x={x - 7}
                  y={16}
                  width={14}
                  height={130}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(idx)}
                  onClick={() => onSelectSimDay(pt.day)}
                />
              );
            })}

            {[0, 5, 10, 15, 20, 25, 30].map((d) => {
              const x = 36 + (d / 30) * 468;
              return (
                <text
                  key={d}
                  x={x}
                  y={160}
                  textAnchor="middle"
                  className={axisLabelClass}
                >
                  D{d}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
