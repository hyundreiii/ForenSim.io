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
  // Real-time Biophysical & Physiological Simulation Metrics
  coreBodyTempC: number; // Henssge double-exponential algor mortis + microbial thermogenesis (°C)
  algorMortisDeltaC: number; // Difference between core body temp and ambient chamber temp (°C)
  rigorMortisPercent: number; // 0-100% sarcomere actin-myosin cross-bridge stiffness
  rigorPhaseLabel: string; // Primary Flaccidity -> Developing -> Peak Rigor -> Resolving -> Secondary Flaccidity
  livorMortisFixationPercent: number; // 0-100% gravitational hypostasis & hemolytic fixation
  livorPhaseLabel: string; // Unfixed (Blanching) -> Shifting -> Fixed (Non-Blanching) -> Hemolyzed
  gasPressureKpa: number; // Intra-abdominal anaerobic gas gauge pressure above ambient (0.0 to 18.5 kPa)
  purgeFluidMl: number; // Cumulative cadaveric purge & liquefaction exudate volume (0 to 3,200 mL)
  entomologyStage: string; // Calliphoridae Diptera life-cycle stage
  entomologyLarvalMassIndex: number; // 0-100 active larval feeding mass intensity
  megyesiTbs: number; // Megyesi et al. (2005) Total Body Score (3 to 35 pts)
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
  const exactHours = Math.max(0, simDay * 24);

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
  const vocGaussian = Math.exp(
    -Math.pow(effectiveAdd - 185, 2) / (2 * Math.pow(75, 2))
  );
  const airflowDilution = Math.max(0.3, 1 - params.airflow * 0.28);
  const vocPpm = Number(
    (1.8 + 148 * vocGaussian * q10Multiplier * airflowDilution).toFixed(1)
  );

  // Microbial enzymatic activity index (0-100)
  const microbialGaussian = Math.exp(
    -Math.pow(effectiveAdd - 165, 2) / (2 * Math.pow(95, 2))
  );
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
  const isSealedChamber = params.roomCondition === 'Sealed Indoor Chamber';
  const entomologicalAccessIndex = isSealedChamber
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

  // 1. Henssge's Double-Exponential Algor Mortis Model + Endogenous Microbial/Larval Thermogenesis
  // T_core(t) = T_amb + (37.2 - T_amb) * (1.25 * e^(-k*t) - 0.25 * e^(-5*k*t)) + Delta_T_microbial
  const convectiveFactor = 1.0 + params.airflow * 0.32;
  const kCool = 0.082 * convectiveFactor; // Hourly cooling coefficient for 68kg supine subject on steel table
  const henssgePlateau = Math.min(
    1.0,
    Math.max(
      0,
      1.25 * Math.exp(-kCool * exactHours) -
        0.25 * Math.exp(-5 * kCool * exactHours)
    )
  );
  const algorResidual = (37.2 - params.temperature) * henssgePlateau;
  // Endogenous anaerobic & larval thermogenesis during Bloating & Active Decay (ADD 45–285)
  const thermogenesisPeak =
    effectiveAdd > 42 && effectiveAdd < 290
      ? Math.sin(((effectiveAdd - 42) / 248) * Math.PI) *
        (1.65 + (isSealedChamber ? 0 : 1.15)) *
        Math.min(1.6, q10Multiplier)
      : 0;
  const coreBodyTempC = Number(
    (params.temperature + algorResidual + thermogenesisPeak).toFixed(1)
  );
  const algorMortisDeltaC = Number(
    (coreBodyTempC - params.temperature).toFixed(1)
  );

  // 2. Nysten's Law Rigor Mortis Kinetics (ATP depletion onset -> peak cross-bridge locking -> proteolytic resolution)
  // Effective physiological hours scaled by Q10
  const bioHours = exactHours * q10Multiplier;
  let rigorMortisPercent = 0;
  let rigorPhaseLabel = 'Primary Flaccidity';
  if (bioHours < 2.0) {
    rigorMortisPercent = Math.round((bioHours / 2.0) * 12);
    rigorPhaseLabel = 'Primary Flaccidity (ATP Residual)';
  } else if (bioHours < 13.0) {
    rigorMortisPercent = Math.round(12 + ((bioHours - 2.0) / 11.0) * 88);
    rigorPhaseLabel = 'Developing Rigor (Cranio-Caudal)';
  } else if (bioHours < 28.0) {
    rigorMortisPercent = Math.round(
      100 - Math.sin(((bioHours - 13.0) / 15.0) * 0.4) * 6
    );
    rigorPhaseLabel = 'Complete Peak Rigor (Locked)';
  } else if (bioHours < 56.0) {
    rigorMortisPercent = Math.max(
      0,
      Math.round(97 * (1 - (bioHours - 28.0) / 28.0))
    );
    rigorPhaseLabel = 'Resolving Rigor (Cathepsin Proteolysis)';
  } else {
    rigorMortisPercent = 0;
    rigorPhaseLabel = 'Secondary Flaccidity (Resolved)';
  }

  // 3. Gravitational Livor Mortis (Hypostasis) & Hemolytic Fixation Kinetics
  let livorMortisFixationPercent = 0;
  let livorPhaseLabel = 'Nascent Erythrocyte Settling';
  if (bioHours < 1.5) {
    livorMortisFixationPercent = Math.round((bioHours / 1.5) * 18);
    livorPhaseLabel = 'Early Patchy Hypostasis (Blanching)';
  } else if (bioHours < 10.0) {
    livorMortisFixationPercent = Math.round(
      18 + ((bioHours - 1.5) / 8.5) * 67
    );
    livorPhaseLabel = 'Coalescing Dorsal Livor (Partially Blanching)';
  } else if (effectiveAdd < 120) {
    livorMortisFixationPercent = Math.min(
      100,
      Math.round(85 + ((bioHours - 10.0) / 14.0) * 15)
    );
    livorPhaseLabel = 'Fixed Dorsal Hypostasis (Non-Blanching)';
  } else {
    livorMortisFixationPercent = 100;
    livorPhaseLabel = 'Hemolyzed Sulfhemoglobin Diffusion';
  }

  // 4. Intra-Abdominal Putrefactive Gas Pressure (kPa above ambient 84.5 kPa)
  let gasPressureKpa = 0;
  if (effectiveAdd > 22 && effectiveAdd < 295) {
    if (effectiveAdd <= 105) {
      const tGas = (effectiveAdd - 22) / 83;
      gasPressureKpa =
        18.4 * Math.pow(Math.sin(tGas * (Math.PI / 2)), 1.4) *
        Math.min(1.3, 0.75 + q10Multiplier * 0.25);
    } else {
      const tRelease = (effectiveAdd - 105) / 190;
      gasPressureKpa =
        18.4 *
        Math.exp(-3.1 * tRelease) *
        Math.min(1.3, 0.75 + q10Multiplier * 0.25);
    }
  }
  gasPressureKpa = Number(Math.max(0, gasPressureKpa).toFixed(1));

  // 5. Cumulative Cadaveric Purge & Liquefaction Exudate Volume (mL)
  let purgeFluidMl = 0;
  if (effectiveAdd > 55) {
    const purgeSigmoid = 1 / (1 + Math.exp(-0.024 * (effectiveAdd - 155)));
    const evapReduction = Math.max(
      0.38,
      1 - params.airflow * 0.22 - (100 - params.humidity) * 0.0045
    );
    purgeFluidMl = Math.round(2850 * purgeSigmoid * evapReduction);
  }

  // 6. Calliphoridae Diptera Entomological Succession & Larval Mass Index
  let entomologyStage = 'Excluded (BSL-2 Sealed Chamber)';
  let entomologyLarvalMassIndex = 0;
  if (!isSealedChamber && params.temperature >= 10) {
    if (effectiveAdd < 12) {
      entomologyStage = 'Calliphoridae Pioneer Attraction';
      entomologyLarvalMassIndex = 4;
    } else if (effectiveAdd < 32) {
      entomologyStage = 'Orifice Egg Oviposition Clutches';
      entomologyLarvalMassIndex = 14;
    } else if (effectiveAdd < 68) {
      entomologyStage = '1st & 2nd Instar Larval Eclosion';
      entomologyLarvalMassIndex = 42;
    } else if (effectiveAdd < 215) {
      entomologyStage = '3rd Instar Active Feeding Masses';
      const peakFeed = Math.sin(((effectiveAdd - 68) / 147) * Math.PI);
      entomologyLarvalMassIndex = Math.min(
        100,
        Math.round(58 + peakFeed * 42)
      );
    } else if (effectiveAdd < 350) {
      entomologyStage = 'Post-Feeding Prepupa & Pupariation';
      entomologyLarvalMassIndex = Math.max(
        15,
        Math.round(55 * (1 - (effectiveAdd - 215) / 135))
      );
    } else {
      entomologyStage = 'Empty Puparia & Dermestidae Beetles';
      entomologyLarvalMassIndex = 8;
    }
  }

  // 7. Published Megyesi et al. (2005) Total Body Score (TBS: 3 to 35 pts)
  // Inverse of log10(ADD) = 0.0062 * TBS^2 + 0.141
  const rawTbs =
    effectiveAdd <= 2
      ? 3
      : Math.sqrt(
          Math.max(0, (Math.log10(Math.max(1.5, effectiveAdd)) - 0.141) / 0.0062)
        );
  const megyesiTbs = Math.min(35, Math.max(3, Math.round(rawTbs)));

  return {
    simDay,
    elapsedHours,
    add: Number(effectiveAdd.toFixed(1)),
    q10Multiplier: Number(q10Multiplier.toFixed(2)),
    effectiveDailyRate: Number(
      (params.temperature * humidityModifier).toFixed(1)
    ),
    currentStage,
    stageProgressPercent: Number(stageProgressPercent.toFixed(1)),
    massRetentionPercent: Number(massRetentionPercent.toFixed(1)),
    vocPpm,
    microbialIndex,
    adipocerePotential,
    desiccationIndex,
    entomologicalAccessIndex,
    matrixPh: Number(matrixPh.toFixed(2)),
    coreBodyTempC,
    algorMortisDeltaC,
    rigorMortisPercent,
    rigorPhaseLabel,
    livorMortisFixationPercent,
    livorPhaseLabel,
    gasPressureKpa,
    purgeFluidMl,
    entomologyStage,
    entomologyLarvalMassIndex,
    megyesiTbs,
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
