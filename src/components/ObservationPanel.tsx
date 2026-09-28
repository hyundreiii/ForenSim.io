import React, { useState } from 'react';
import {
  EnvironmentalParams,
  StudentObservation,
} from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import { ClipboardCheck, RotateCcw, Trash2 } from 'lucide-react';

interface ObservationPanelProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  observations: StudentObservation[];
  onRecordObservation: (obs: Omit<StudentObservation, 'id'>) => void;
  onDeleteObservation: (id: string) => void;
  isLightMode: boolean;
}

export const ObservationPanel: React.FC<ObservationPanelProps> = ({
  params,
  metrics,
  observations,
  onRecordObservation,
  onDeleteObservation,
  isLightMode,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const [observationDate, setObservationDate] = useState<string>(todayIso);
  const [observedChanges, setObservedChanges] = useState<string>('');
  const [evidenceNotes, setEvidenceNotes] = useState<string>('');
  const [studentInterpretation, setStudentInterpretation] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const handleClear = () => {
    setObservedChanges('');
    setEvidenceNotes('');
    setStudentInterpretation('');
    setStatusBanner('Observation form fields cleared.');
    setTimeout(() => setStatusBanner(null), 2500);
  };

  const handleLoadTemplate = () => {
    setObservedChanges(
      `Stage: ${metrics.currentStage.shortTitle}. Matrix mass retention at ${metrics.massRetentionPercent}%, internal pH ${metrics.matrixPh}, headspace VOC at ${metrics.vocPpm} ppm.`
    );
    setEvidenceNotes(
      `Barometric pressure 845.2 hPa (Baguio 1,540m). Chamber maintained at ${params.temperature.toFixed(1)}°C, ${params.humidity}% RH, ${params.airflow.toFixed(2)} m/s airflow (${params.roomCondition}).`
    );
    setStudentInterpretation(
      `Accumulated thermal unit sum reached ${metrics.add} ADD on Day ${metrics.simDay.toFixed(1)}. Cool highland indoor conditions moderated bacterial Q₁₀ rate (${metrics.q10Multiplier}x baseline).`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observedChanges.trim() && !studentInterpretation.trim()) {
      setStatusBanner('Please enter observed changes or click "Auto-Fill Current Telemetry" before recording.');
      return;
    }

    onRecordObservation({
      observationDate,
      simulationDay: Number(metrics.simDay.toFixed(1)),
      addValue: metrics.add,
      stageName: metrics.currentStage.shortTitle,
      environmentalConditions: { ...params },
      observedChanges:
        observedChanges.trim() ||
        `Stage ${metrics.currentStage.shortTitle} observed at ${metrics.massRetentionPercent}% mass retention.`,
      evidenceNotes:
        evidenceNotes.trim() ||
        `VOC ${metrics.vocPpm} ppm, Matrix pH ${metrics.matrixPh}.`,
      studentInterpretation:
        studentInterpretation.trim() ||
        `Consistent with ${metrics.add} ADD under ${params.roomCondition}.`,
    });

    setObservedChanges('');
    setEvidenceNotes('');
    setStudentInterpretation('');
    setStatusBanner('Forensic observation recorded to laboratory log.');
    setTimeout(() => setStatusBanner(null), 3000);
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
            FORENSIC DOCUMENTATION & NOTEBOOK
          </span>
          <h3 className="text-lg font-semibold mt-0.5">
            Scientific Observation Panel
          </h3>
        </div>
        <button
          type="button"
          onClick={handleLoadTemplate}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors whitespace-nowrap ${
            isLightMode
              ? 'border-cyan-600 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-semibold'
              : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
          }`}
        >
          Auto-Fill Current Telemetry Snapshot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className={`block text-xs font-medium mb-1 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Observation Date
              </label>
              <input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
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
                Simulation Day & ADD
              </label>
              <input
                type="text"
                readOnly
                value={`Day ${metrics.simDay.toFixed(1)} (${metrics.add} ADD)`}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                  isLightMode
                    ? 'bg-slate-100 border-slate-300 text-cyan-800 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-cyan-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-1 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Environmental Conditions
              </label>
              <input
                type="text"
                readOnly
                value={`${params.temperature.toFixed(1)}°C · ${params.humidity}% RH · ${params.airflow.toFixed(2)}m/s`}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                  isLightMode
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-medium mb-1 ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Observed Changes (Biochemical, Thermal & Gravimetric Indicators)
            </label>
            <textarea
              rows={2}
              value={observedChanges}
              onChange={(e) => setObservedChanges(e.target.value)}
              placeholder="Document current decomposition stage, mass retention %, matrix pH, and VOC concentration..."
              className={`w-full px-3 py-2 rounded-lg border text-xs ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
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
              Evidence Notes (Instrument Nodes, Textile & Entomological Status)
            </label>
            <textarea
              rows={2}
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              placeholder="Note readings from SEN-01, CAM-05 thermal differential, or insect exclusion traps..."
              className={`w-full px-3 py-2 rounded-lg border text-xs ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
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
              Student Interpretation (Causal Link Between Environment & Progression)
            </label>
            <textarea
              rows={2}
              value={studentInterpretation}
              onChange={(e) => setStudentInterpretation(e.target.value)}
              placeholder="Explain how Baguio City indoor temperature, humidity, or ventilation influenced the observed state..."
              className={`w-full px-3 py-2 rounded-lg border text-xs ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          {statusBanner && (
            <div
              className={`text-xs font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              {statusBanner}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <ClipboardCheck className="w-4 h-4" />
              Record Observation
            </button>
            <button
              type="button"
              onClick={handleClear}
              className={`px-4 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isLightMode
                  ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Observation
            </button>
          </div>
        </form>

        {/* Recorded Student Observation History (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-xl border p-4 flex flex-col justify-between ${
            isLightMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-950/70 border-slate-800/90'
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isLightMode ? 'border-slate-200' : 'border-slate-800/60'
              }`}
            >
              <span
                className={`text-xs font-mono uppercase font-semibold ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                RECORDED OBSERVATION LOG ({observations.length})
              </span>
              <span
                className={`text-[11px] font-mono ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Saved in LocalStorage
              </span>
            </div>

            <div className="space-y-3 mt-3 max-h-[310px] overflow-y-auto pr-1">
              {observations.length === 0 ? (
                <p
                  className={`text-xs py-8 text-center ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  No observations recorded yet. Adjust simulation day or parameters and click "Record Observation".
                </p>
              ) : (
                observations.map((obs) => (
                  <div
                    key={obs.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      isLightMode
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span
                        className={`font-semibold ${
                          isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                        }`}
                      >
                        Day {obs.simulationDay.toFixed(1)} · {obs.addValue} ADD ·{' '}
                        {obs.stageName}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteObservation(obs.id)}
                        title="Delete entry"
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div
                      className={`text-[11px] font-mono ${
                        isLightMode ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {obs.observationDate} · {obs.environmentalConditions.temperature.toFixed(1)}°C ·{' '}
                      {obs.environmentalConditions.humidity}% RH ·{' '}
                      {obs.environmentalConditions.airflow.toFixed(2)} m/s
                    </div>
                    <p className={isLightMode ? 'text-slate-800' : 'text-slate-200'}>
                      <strong>Findings:</strong> {obs.observedChanges}
                    </p>
                    <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                      <strong>Interpretation:</strong> {obs.studentInterpretation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
