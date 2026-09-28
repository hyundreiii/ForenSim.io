import React from 'react';
import {
  ENVIRONMENTAL_PRESETS,
  EnvironmentalParams,
  RoomConditionType,
} from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import { RotateCcw, Sliders } from 'lucide-react';

interface EnvironmentalControlsPanelProps {
  params: EnvironmentalParams;
  onChangeParams: (newParams: EnvironmentalParams) => void;
  metrics: SimulationMetrics;
  isLightMode: boolean;
}

const ROOM_CONDITIONS: RoomConditionType[] = [
  'Highland Natural Draft',
  'Sealed Indoor Chamber',
  'High-Moisture Monsoonal',
  'Desiccating Forced Air',
];

export const EnvironmentalControlsPanel: React.FC<EnvironmentalControlsPanelProps> = ({
  params,
  onChangeParams,
  metrics,
  isLightMode,
}) => {
  const updateField = <K extends keyof EnvironmentalParams>(
    key: K,
    value: EnvironmentalParams[K]
  ) => {
    onChangeParams({ ...params, [key]: value });
  };

  return (
    <div
      className={`rounded-xl border p-6 ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
          : 'bg-[#0F172A] border-slate-800 text-slate-100'
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${
          isLightMode ? 'border-slate-200' : 'border-slate-800/60'
        }`}
      >
        <div>
          <span
            className={`text-xs font-mono font-semibold ${
              isLightMode ? 'text-cyan-700' : 'text-cyan-400'
            }`}
          >
            ABIOTIC PARAMETER CALIBRATION DECK
          </span>
          <h3 className="text-lg font-semibold mt-0.5">
            Environmental Simulation Controls
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onChangeParams(ENVIRONMENTAL_PRESETS[0].params)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            isLightMode
              ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-600 hover:text-cyan-800'
              : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 hover:text-cyan-300'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Baguio Baseline (16.5°C)
        </button>
      </div>

      {/* Regional & Experimental Presets */}
      <div className="mt-4">
        <div
          className={`text-xs font-semibold mb-2 ${
            isLightMode ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Load Controlled Experimental Preset:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {ENVIRONMENTAL_PRESETS.map((preset) => {
            const isActive =
              Math.abs(params.temperature - preset.params.temperature) < 0.2 &&
              Math.abs(params.humidity - preset.params.humidity) < 2 &&
              params.roomCondition === preset.params.roomCondition;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeParams(preset.params)}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  isActive
                    ? isLightMode
                      ? 'bg-cyan-50 border-cyan-600 text-slate-900 shadow-xs'
                      : 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                    : isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold truncate">{preset.name}</div>
                <div
                  className={`text-[11px] font-mono truncate mt-0.5 ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {preset.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sliders + Live Causal Explanation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Sliders Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Temperature Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="slider-temp" className="font-semibold">
                Ambient Chamber Temperature
              </label>
              <div className="font-mono tabular-nums">
                <span
                  className={`text-base font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {params.temperature.toFixed(1)}
                </span>
                <span
                  className={`ml-1 ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  °C
                </span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span
                  className={isLightMode ? 'text-slate-600' : 'text-slate-400'}
                >
                  Q₁₀ Rate: {metrics.q10Multiplier}x Baguio Baseline
                </span>
              </div>
            </div>
            <input
              id="slider-temp"
              type="range"
              min={5}
              max={38}
              step={0.5}
              value={params.temperature}
              onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
              className={`w-full cursor-pointer h-2 rounded-lg ${
                isLightMode
                  ? 'accent-cyan-600 bg-slate-200'
                  : 'accent-cyan-400 bg-slate-800'
              }`}
            />
            <div
              className={`flex justify-between text-[11px] font-mono mt-1 ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span>5.0°C (Cold Retardation)</span>
              <span>16.5°C (Baguio Mean)</span>
              <span>31.5°C (Lowland Tropics)</span>
              <span>38.0°C</span>
            </div>
            <p
              className={`text-xs mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {params.temperature < 12
                ? 'Low thermal energy (<12°C) markedly inhibits bacterial proliferation and insect flight.'
                : params.temperature <= 20
                  ? 'Cool highland range (12–20°C): moderate enzymatic kinetics typical of Baguio City indoor scenes.'
                  : 'Elevated temperature (>20°C): doubles enzymatic and microbial fermentation speed per +10°C.'}
            </p>
          </div>

          {/* 2. Relative Humidity Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="slider-humidity" className="font-semibold">
                Relative Humidity (RH)
              </label>
              <div className="font-mono tabular-nums">
                <span
                  className={`text-base font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {params.humidity.toFixed(0)}
                </span>
                <span
                  className={`ml-1 ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  % RH
                </span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span
                  className={isLightMode ? 'text-slate-600' : 'text-slate-400'}
                >
                  Dew Point: {(params.temperature - (100 - params.humidity) / 5).toFixed(1)}°C
                </span>
              </div>
            </div>
            <input
              id="slider-humidity"
              type="range"
              min={20}
              max={98}
              step={1}
              value={params.humidity}
              onChange={(e) => updateField('humidity', parseInt(e.target.value, 10))}
              className={`w-full cursor-pointer h-2 rounded-lg ${
                isLightMode
                  ? 'accent-cyan-600 bg-slate-200'
                  : 'accent-cyan-400 bg-slate-800'
              }`}
            />
            <div
              className={`flex justify-between text-[11px] font-mono mt-1 ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span>20% (Arid / Desiccating)</span>
              <span>60% (Moderate)</span>
              <span>82% (Baguio Mean)</span>
              <span>98% (Saturated Monsoon)</span>
            </div>
            <p
              className={`text-xs mt-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {params.humidity >= 80
                ? 'High moisture (≥80% RH) sustains bacterial biofilm activity and promotes hydrolytic adipocere formation.'
                : params.humidity <= 40
                  ? 'Low moisture (≤40% RH) accelerates surface dehydration and inhibits hydrolytic enzymes.'
                  : 'Balanced relative humidity supports standard aerobic and anaerobic microbial activity.'}
            </p>
          </div>

          {/* 3. Airflow / Ventilation Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="slider-airflow" className="font-semibold">
                Chamber Airflow Velocity (Ventilation)
              </label>
              <div className="font-mono tabular-nums">
                <span
                  className={`text-base font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {params.airflow.toFixed(2)}
                </span>
                <span
                  className={`ml-1 ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  m/s
                </span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span
                  className={isLightMode ? 'text-slate-600' : 'text-slate-400'}
                >
                  {(params.airflow * 6.4).toFixed(1)} ACH
                </span>
              </div>
            </div>
            <input
              id="slider-airflow"
              type="range"
              min={0}
              max={2.5}
              step={0.05}
              value={params.airflow}
              onChange={(e) => updateField('airflow', parseFloat(e.target.value))}
              className={`w-full cursor-pointer h-2 rounded-lg ${
                isLightMode
                  ? 'accent-cyan-600 bg-slate-200'
                  : 'accent-cyan-400 bg-slate-800'
              }`}
            />
            <div
              className={`flex justify-between text-[11px] font-mono mt-1 ${
                isLightMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span>0.0 m/s (Stagnant)</span>
              <span>0.35 m/s (Standard Lab)</span>
              <span>1.2 m/s (High Draft)</span>
              <span>2.5 m/s (Forced Drying)</span>
            </div>
          </div>

          {/* 4. Light Exposure & Room Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="slider-light" className="font-semibold">
                  Chamber Light Exposure
                </label>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  {params.lightExposure} Lux
                </span>
              </div>
              <input
                id="slider-light"
                type="range"
                min={0}
                max={1000}
                step={20}
                value={params.lightExposure}
                onChange={(e) => updateField('lightExposure', parseInt(e.target.value, 10))}
                className={`w-full cursor-pointer h-2 rounded-lg ${
                  isLightMode
                    ? 'accent-cyan-600 bg-slate-200'
                    : 'accent-cyan-400 bg-slate-800'
                }`}
              />
              <div
                className={`flex justify-between text-[11px] font-mono mt-1 ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                <span>0 Lux (Dark)</span>
                <span>180 Lux (Diffuse)</span>
                <span>1000 Lux (Bright)</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="select-room-condition"
                className="block text-xs font-semibold mb-1.5"
              >
                Chamber Structural Condition
              </label>
              <select
                id="select-room-condition"
                value={params.roomCondition}
                onChange={(e) =>
                  updateField('roomCondition', e.target.value as RoomConditionType)
                }
                className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                {ROOM_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Non-Graphic Pathway & Mechanistic Response Matrix */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 flex flex-col justify-between ${
            isLightMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-950/75 border-slate-800/90'
          }`}
        >
          <div>
            <div
              className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              SIMULATED BIOCHEMICAL PATHWAY RESPONSE
            </div>
            <h4 className="text-base font-semibold mt-1">
              How Current Variables Shape Decomposition
            </h4>

            <div className="space-y-4 mt-4">
              {/* Indicator 1: Enzymatic & Microbial Kinetics */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">Microbial & Enzymatic Activity</span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {metrics.microbialIndex} / 100 ·{' '}
                    {metrics.microbialIndex > 70
                      ? '▲ HIGH KINETICS'
                      : metrics.microbialIndex < 30
                        ? '▼ SUPPRESSED'
                        : '● MODERATE'}
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-cyan-500 transition-all duration-150"
                    style={{ width: `${metrics.microbialIndex}%` }}
                  />
                </div>
              </div>

              {/* Indicator 2: Hydrolytic Adipocere (Saponification) Pathway */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">
                    Adipocere (Saponification) Pathway Index
                  </span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    {metrics.adipocerePotential}% ·{' '}
                    {metrics.adipocerePotential >= 70 ? '▲ FAVORED' : '● LOW-MOD'}
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{ width: `${metrics.adipocerePotential}%` }}
                  />
                </div>
              </div>

              {/* Indicator 3: Evaporative Desiccation (Mummification) Pathway */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">
                    Evaporative Desiccation (Drying) Index
                  </span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      isLightMode ? 'text-amber-700' : 'text-amber-400'
                    }`}
                  >
                    {metrics.desiccationIndex}% ·{' '}
                    {metrics.desiccationIndex >= 65 ? '▲ RAPID DRYING' : '● RETENTIVE'}
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-amber-500 transition-all duration-150"
                    style={{ width: `${metrics.desiccationIndex}%` }}
                  />
                </div>
              </div>

              {/* Indicator 4: Entomological Colonization Potential */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">
                    Entomological Colonization Potential
                  </span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      isLightMode ? 'text-sky-700' : 'text-sky-400'
                    }`}
                  >
                    {metrics.entomologicalAccessIndex}% ·{' '}
                    {params.roomCondition === 'Sealed Indoor Chamber'
                      ? '✖ EXCLUDED (SEALED)'
                      : '● DELAYED INDOOR'}
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-sky-500 transition-all duration-150"
                    style={{ width: `${metrics.entomologicalAccessIndex}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Scientific Summary Box */}
          <div
            className={`mt-5 pt-4 border-t text-xs space-y-1.5 ${
              isLightMode ? 'border-slate-200' : 'border-slate-800/80'
            }`}
          >
            <div
              className={`font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              ACTIVE MODEL INTERPRETATION:
            </div>
            <p className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
              At <strong className="font-mono">{params.temperature.toFixed(1)}°C</strong> and{' '}
              <strong className="font-mono">{params.humidity}% RH</strong> with{' '}
              <strong className="font-mono">{params.airflow.toFixed(2)} m/s</strong> ventilation,
              the simulation accumulates{' '}
              <strong className="font-mono">{metrics.effectiveDailyRate} ADD/day</strong>.{' '}
              {metrics.adipocerePotential > metrics.desiccationIndex + 20
                ? 'High highland moisture and low airflow strongly favor anaerobic lipid hydrolysis (adipocere formation) over drying.'
                : metrics.desiccationIndex > metrics.adipocerePotential + 20
                  ? 'Elevated airflow and low humidity strip boundary moisture, favoring tissue desiccation and arresting bacterial putrefaction.'
                  : 'Balanced indoor temperature and humidity produce a classic highland autolytic and microbial fermentation trajectory.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
