import React, { useState } from 'react';
import {
  EVIDENCE_ITEMS,
  EvidenceItem,
  EnvironmentalParams,
} from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import { CheckCircle2, FileSearch, HelpCircle } from 'lucide-react';

interface EvidenceSectionProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  examinedEvidenceIds: string[];
  onMarkEvidenceExamined: (id: string) => void;
  isLightMode: boolean;
}

const ALL_FACTORS: (
  | 'Temperature'
  | 'Humidity'
  | 'Airflow'
  | 'Light'
  | 'Indoor Enclosure'
)[] = ['Temperature', 'Humidity', 'Airflow', 'Light', 'Indoor Enclosure'];

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  params,
  metrics,
  examinedEvidenceIds,
  onMarkEvidenceExamined,
  isLightMode,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem>(
    EVIDENCE_ITEMS[0]
  );
  const [studentFactorGuesses, setStudentFactorGuesses] = useState<
    Record<string, string[]>
  >({});
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});

  const handleSelectEvidence = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    onMarkEvidenceExamined(item.id);
  };

  const toggleFactorGuess = (factor: string) => {
    const current = studentFactorGuesses[selectedEvidence.id] || [];
    const updated = current.includes(factor)
      ? current.filter((f) => f !== factor)
      : [...current, factor];
    setStudentFactorGuesses({
      ...studentFactorGuesses,
      [selectedEvidence.id]: updated,
    });
  };

  const handleVerifyFactors = () => {
    setVerifiedItems({ ...verifiedItems, [selectedEvidence.id]: true });
    onMarkEvidenceExamined(selectedEvidence.id);
  };

  const currentGuesses = studentFactorGuesses[selectedEvidence.id] || [];
  const isVerified = verifiedItems[selectedEvidence.id];

  return (
    <div className="space-y-6">
      {/* Top Overview Banner */}
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
            NON-GRAPHIC FORENSIC TRACE & TELEMETRY EVIDENCE LAB
          </span>
          <h2 className="text-xl font-semibold mt-0.5">
            Simulated Evidence Analysis & Environmental Attribution
          </h2>
        </div>
        <div
          className={`text-xs font-mono ${
            isLightMode ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Evidence Logs Examined:{' '}
          <strong className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}>
            {examinedEvidenceIds.length} / {EVIDENCE_ITEMS.length}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: 7 Evidence Logs List */}
        <div className="lg:col-span-5 space-y-2.5">
          {EVIDENCE_ITEMS.map((item) => {
            const isSelected = selectedEvidence.id === item.id;
            const isExamined = examinedEvidenceIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectEvidence(item)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? isLightMode
                      ? 'bg-cyan-50 border-cyan-600 shadow-xs'
                      : 'bg-cyan-500/15 border-cyan-400 shadow-sm'
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
                    {item.code} · {item.category}
                  </span>
                  <span
                    className={
                      isExamined
                        ? isLightMode
                          ? 'text-emerald-700 font-semibold'
                          : 'text-emerald-400 font-semibold'
                        : isLightMode
                          ? 'text-slate-500'
                          : 'text-slate-400'
                    }
                  >
                    {isExamined ? '✓ Analyzed' : 'Inspect'}
                  </span>
                </div>
                <div
                  className={`text-sm font-semibold mt-1 ${
                    isLightMode ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {item.title}
                </div>
                <div
                  className={`text-xs mt-1 font-mono ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  Source: {item.collectionPoint}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 7 Columns: Selected Evidence Deep-Dive & Environmental Factor Attribution Tool */}
        <div
          className={`lg:col-span-7 rounded-xl border p-6 space-y-5 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div
            className={`pb-4 border-b flex flex-wrap items-start justify-between gap-4 ${
              isLightMode ? 'border-slate-200' : 'border-slate-800/60'
            }`}
          >
            <div>
              <div
                className={`flex items-center gap-2 text-xs font-mono font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                <span>{selectedEvidence.code}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedEvidence.category}</span>
              </div>
              <h3 className="text-xl font-semibold mt-1">
                {selectedEvidence.title}
              </h3>
            </div>
            <div
              className={`text-xs font-mono text-right ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              <div>Instrument: {selectedEvidence.instrumentUsed}</div>
              <div>Node: {selectedEvidence.collectionPoint}</div>
            </div>
          </div>

          {/* Baseline vs Live Dynamic Interpretation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900/75 border-slate-800'
              }`}
            >
              <div
                className={`text-xs font-mono uppercase font-semibold mb-1.5 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Baguio Facility Baseline Finding
              </div>
              <p className="text-xs leading-relaxed">
                {selectedEvidence.baselineFinding}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                isLightMode
                  ? 'bg-sky-50 border-sky-200'
                  : 'bg-cyan-950/25 border-cyan-500/30'
              }`}
            >
              <div
                className={`text-xs font-mono uppercase font-semibold mb-1.5 ${
                  isLightMode ? 'text-cyan-800' : 'text-cyan-400'
                }`}
              >
                Active Simulation Reading (Day {metrics.simDay.toFixed(1)})
              </div>
              <p className="text-xs leading-relaxed">
                {selectedEvidence.dynamicInterpretation(
                  params,
                  metrics.simDay,
                  metrics.add
                )}
              </p>
            </div>
          </div>

          {/* Interactive Student Analysis Activity: Determine Influencing Factors */}
          <div
            className={`p-5 rounded-xl border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                STUDENT EVIDENCE ATTRIBUTION EXERCISE
              </span>
              <span
                className={`text-xs font-mono ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Select Primary Influencing Variables
              </span>
            </div>
            <p
              className={`text-xs mb-3 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Based on the telemetry reading above, select which environmental factors directly govern this forensic evidence log:
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {ALL_FACTORS.map((factor) => {
                const isPicked = currentGuesses.includes(factor);
                const isActuallyPrimary =
                  selectedEvidence.primaryInfluencingFactors.includes(factor);

                return (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => toggleFactorGuess(factor)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors whitespace-nowrap ${
                      isPicked
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                        : isLightMode
                          ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    {factor}
                    {isVerified && isActuallyPrimary && ' ✓'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleVerifyFactors}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap"
              >
                Verify Attribution & Reveal Scientific Rationale
              </button>

              {isVerified && (
                <span
                  className={`text-xs font-mono font-semibold ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  Primary Factors:{' '}
                  {selectedEvidence.primaryInfluencingFactors.join(', ')}
                </span>
              )}
            </div>

            {isVerified && (
              <div
                className={`mt-4 pt-3 border-t text-xs space-y-1 ${
                  isLightMode ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <div
                  className={`font-mono font-semibold ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  FORENSIC SCIENTIFIC RATIONALE:
                </div>
                <p className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                  {selectedEvidence.scientificRationale}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
