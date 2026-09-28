import {
  DECOMPOSITION_STAGES,
  DecompositionStage,
  EnvironmentalParams,
} from '../data/simulationData';

export interface SimulationMetrics {
  simDay: number;
  elapsedHours: number;
  add: number; // Accumulated Degree Days (°C·days)
  q10Multiplier: number; // Relative to Baguio 16.5°C baseline
  effectiveDailyRate: number;
  currentStage: DecompositionStage;
  stageProgressPercent: number; // 0-100 overall progression
  massRetentionPercent: number; // 100% down to ~21%
  vocPpm: number;
  microbialIndex: number; // 0-100
  adipocerePotential: number; // 0-100 (Saponification index)
  desiccationIndex: number; // 0-100 (Mummification/drying index)
  entomologicalAccessIndex: number; // 0-100
  matrixPh: number;
}

export interface TimeSeriesPoint {
  day: number;
  ambientTemp: number;
  specimenTemp: number;
  relativeHumidity: number;
  substrateMoisture: number;
  vocPpm: number;
  massRetention: number;
  baguioBaselineMassRetention: number;
  addCumulative: number;
}

export function computeSimulationMetrics(
  params: EnvironmentalParams,
  simDay: number
): SimulationMetrics {
  const elapsedHours = Math.round(simDay * 24);
  // Q10 biological rate adjustment combined with moisture & airflow modifiers
  const q10Multiplier = Math.pow(2.15, (params.temperature - 16.5) / 10);
  const humidityModifier =
    params.humidity < 35
      ? 0.55 // extreme dryness inhibits bacterial enzymes
      : params.humidity > 90
        ? 0.92 // anaerobic saturation slightly moderates aerobic rate
        : 1.0 + (params.humidity - 75) * 0.004;

  const enclosureModifier =
    params.roomCondition === 'Sealed Indoor Chamber'
      ? 0.88
      : params.roomCondition === 'Desiccating Forced Air'
        ? 0.76
        : 1.0;

  // Effective thermal accumulation (ADD)
  const rawAdd = Math.max(0, params.temperature) * simDay;
  const effectiveAdd = rawAdd * humidityModifier * enclosureModifier;

  // Determine current stage based on effective ADD
  let currentStage = DECOMPOSITION_STAGES[0];
  for (const stage of DECOMPOSITION_STAGES) {
    if (effectiveAdd >= stage.addThresholdRange[0]) {
      currentStage = stage;
    }
  }

  const stageProgressPercent = Math.min(100, (effectiveAdd / 480) * 100);

  // Logistic mass loss curve from 100% down to 21.5% mineralized/structural baseline
  const logisticK = 0.016 * (1 + params.airflow * 0.08);
  const massRetentionPercent = Math.max(
    21.5,
    21.5 + 78.5 / (1 + Math.exp(logisticK * (effectiveAdd - 175)))
  );

  // Bell-shaped VOC emission peaking during Active Decomposition (~185 ADD)
  const vocGaussian = Math.exp(-Math.pow(effectiveAdd - 185, 2) / (2 * Math.pow(75, 2)));
  const airflowDilution = Math.max(0.3, 1 - params.airflow * 0.28);
  const vocPpm = Number(
    (1.8 + 148 * vocGaussian * q10Multiplier * airflowDilution).toFixed(1)
  );

  // Microbial enzymatic activity index (0-100)
  const microbialGaussian = Math.exp(-Math.pow(effectiveAdd - 165, 2) / (2 * Math.pow(95, 2)));
  const tempSuppression = params.temperature < 10 ? 0.35 : 1;
  const drySuppression = params.humidity < 40 ? 0.45 : 1;
  const microbialIndex = Math.min(
    100,
    Math.round((14 + 84 * microbialGaussian) * tempSuppression * drySuppression)
  );

  // Adipocere (Saponification) potential: high humidity (>80%), low airflow (<0.5), cool-moderate temp
  const adipocerePotential = Math.min(
    100,
    Math.max(
      5,
      Math.round(
        (params.humidity - 30) * 1.15 -
          params.airflow * 28 +
          (params.roomCondition === 'High-Moisture Monsoonal' ? 18 : 0)
      )
    )
  );

  // Desiccation (Mummification) potential: low humidity (<45%), high airflow (>0.8), higher light/temp
  const desiccationIndex = Math.min(
    100,
    Math.max(
      5,
      Math.round(
        (100 - params.humidity) * 0.95 +
          params.airflow * 26 +
          (params.lightExposure / 1000) * 12
      )
    )
  );

  // Entomological access & activity index
  const entomologicalAccessIndex =
    params.roomCondition === 'Sealed Indoor Chamber'
      ? 4
      : Math.min(
          100,
          Math.max(
            8,
            Math.round(
              (params.temperature - 8) * 3.2 -
                (params.airflow > 1.6 ? 20 : 0) +
                (params.lightExposure / 100) * 2.5
            )
          )
        );

  // Matrix pH curve: drops from 7.15 to 5.85 during autolysis/early fermentation, rises to 8.05 in active proteolysis, settles near 7.4
  let matrixPh = 7.15;
  if (effectiveAdd < 70) {
    matrixPh = 7.15 - (effectiveAdd / 70) * 1.3;
  } else if (effectiveAdd < 240) {
    matrixPh = 5.85 + ((effectiveAdd - 70) / 170) * 2.2;
  } else {
    matrixPh = Math.max(7.35, 8.05 - ((effectiveAdd - 240) / 260) * 0.7);
  }

  return {
    simDay,
    elapsedHours,
    add: Number(effectiveAdd.toFixed(1)),
    q10Multiplier: Number(q10Multiplier.toFixed(2)),
    effectiveDailyRate: Number((params.temperature * humidityModifier).toFixed(1)),
    currentStage,
    stageProgressPercent: Number(stageProgressPercent.toFixed(1)),
    massRetentionPercent: Number(massRetentionPercent.toFixed(1)),
    vocPpm,
    microbialIndex,
    adipocerePotential,
    desiccationIndex,
    entomologicalAccessIndex,
    matrixPh: Number(matrixPh.toFixed(2)),
  };
}

export function generateTimeSeriesData(params: EnvironmentalParams): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (let day = 0; day <= 30; day += 1) {
    const m = computeSimulationMetrics(params, day);
    // Diurnal wave + metabolic thermogenesis peak during active stage
    const metabolicDelta =
      m.add > 85 && m.add < 275
        ? 2.1 * Math.sin(((m.add - 85) / 190) * Math.PI) * (params.temperature / 20)
        : 0.15;
    const diurnalWave = Math.sin(day * 0.9) * 0.45;
    const ambientTemp = Number((params.temperature + diurnalWave).toFixed(1));
    const specimenTemp = Number((ambientTemp + metabolicDelta).toFixed(1));

    const rhWave = Math.cos(day * 0.7) * 1.8;
    const relativeHumidity = Number(
      Math.min(99, Math.max(18, params.humidity + rhWave)).toFixed(1)
    );

    // Substrate moisture reflects purge peak + evaporative decay
    const purgeBoost =
      m.add > 70 && m.add < 280 ? 14 * Math.sin(((m.add - 70) / 210) * Math.PI) : 0;
    const evaporationDrag = day * params.airflow * 0.65;
    const substrateMoisture = Number(
      Math.min(98, Math.max(15, params.humidity * 0.88 + purgeBoost - evaporationDrag)).toFixed(1)
    );

    // Baguio baseline (16.5°C, 82% RH, 0.35 m/s) mass retention for comparison curve
    const baguioBaselineAdd = 16.5 * day;
    const baguioBaselineMassRetention = Number(
      Math.max(
        21.5,
        21.5 + 78.5 / (1 + Math.exp(0.016 * (baguioBaselineAdd - 175)))
      ).toFixed(1)
    );

    points.push({
      day,
      ambientTemp,
      specimenTemp,
      relativeHumidity,
      substrateMoisture,
      vocPpm: m.vocPpm,
      massRetention: m.massRetentionPercent,
      baguioBaselineMassRetention,
      addCumulative: m.add,
    });
  }
  return points;
}
