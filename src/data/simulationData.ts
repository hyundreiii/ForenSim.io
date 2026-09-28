export type RoomConditionType =
  | 'Highland Natural Draft'
  | 'Sealed Indoor Chamber'
  | 'High-Moisture Monsoonal'
  | 'Desiccating Forced Air';

export interface EnvironmentalParams {
  temperature: number; // °C (5 to 38)
  humidity: number; // % RH (20 to 98)
  airflow: number; // m/s (0.0 to 2.5)
  lightExposure: number; // Lux (0 to 1000)
  roomCondition: RoomConditionType;
}

export interface DecompositionStage {
  id: string;
  index: number;
  title: string;
  shortTitle: string;
  baguioDayRange: string;
  addThresholdRange: [number, number]; // Accumulated Degree Days (°C·days)
  summary: string;
  cellularProcesses: string[];
  environmentalSensitivity: string;
  forensicIndicators: {
    autolysisIndex: number; // 0-100
    microbialActivity: number; // 0-100
    vocConcentration: string; // ppm equivalent
    massRetention: number; // %
    entomologicalPhase: string;
  };
  keyTakeaway: string;
}

export interface RoomObjectInfo {
  id: string;
  code: string;
  name: string;
  zone: string;
  coords2D: { x: number; y: number }; // Percentage on 2D schematic
  coords3D: [number, number, number];
  whatItRepresents: string;
  whyItIsImportant: string;
  whatScientistsObserve: string;
  contributionToAnalysis: string;
  getLiveReading: (params: EnvironmentalParams, simDay: number, add: number) => {
    primaryMetric: string;
    primaryUnit: string;
    secondaryMetric: string;
    statusLabel: 'NOMINAL' | 'ELEVATED' | 'ALTERED';
  };
}

export interface EvidenceItem {
  id: string;
  code: string;
  title: string;
  category:
    | 'Environmental Readings'
    | 'Insect Activity Indicators'
    | 'Microbial Activity Indicators'
    | 'Moisture Measurements'
    | 'Temperature Records'
    | 'Timeline Observations'
    | 'Clothing/Material Observations';
  collectionPoint: string;
  instrumentUsed: string;
  baselineFinding: string;
  dynamicInterpretation: (params: EnvironmentalParams, simDay: number, add: number) => string;
  primaryInfluencingFactors: ('Temperature' | 'Humidity' | 'Airflow' | 'Light' | 'Indoor Enclosure')[];
  scientificRationale: string;
}

export interface QuizQuestion {
  id: string;
  moduleId: string;
  type: 'multiple-choice' | 'true-false' | 'scenario' | 'factor-analysis';
  question: string;
  scenarioContext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningModule {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  overview: string;
  keyConcepts: {
    heading: string;
    body: string;
    formulaOrMetric?: string;
  }[];
  baguioContextNote: string;
  interactivePrompt: string;
  questions: QuizQuestion[];
}

export interface StudentObservation {
  id: string;
  observationDate: string;
  simulationDay: number;
  addValue: number;
  stageName: string;
  environmentalConditions: {
    temperature: number;
    humidity: number;
    airflow: number;
    lightExposure: number;
    roomCondition: RoomConditionType;
  };
  observedChanges: string;
  evidenceNotes: string;
  studentInterpretation: string;
}

export const ENVIRONMENTAL_PRESETS: {
  id: string;
  name: string;
  subtitle: string;
  params: EnvironmentalParams;
}[] = [
  {
    id: 'baguio-baseline',
    name: 'Baguio Highland Baseline',
    subtitle: '16.5°C · 82% RH · Pine Highland Indoor Standard',
    params: {
      temperature: 16.5,
      humidity: 82,
      airflow: 0.35,
      lightExposure: 180,
      roomCondition: 'Highland Natural Draft',
    },
  },
  {
    id: 'baguio-monsoon',
    name: 'Cordillera Monsoon (Habagat)',
    subtitle: '14.8°C · 94% RH · High Moisture / Adipocere Pathway',
    params: {
      temperature: 14.8,
      humidity: 94,
      airflow: 0.1,
      lightExposure: 75,
      roomCondition: 'High-Moisture Monsoonal',
    },
  },
  {
    id: 'sealed-warm',
    name: 'Sealed Warm Indoor Chamber',
    subtitle: '26.0°C · 72% RH · Accelerated Microbial Activity',
    params: {
      temperature: 26.0,
      humidity: 72,
      airflow: 0.05,
      lightExposure: 300,
      roomCondition: 'Sealed Indoor Chamber',
    },
  },
  {
    id: 'forced-desiccation',
    name: 'High-Airflow Desiccation',
    subtitle: '23.5°C · 30% RH · Rapid Moisture Loss Pathway',
    params: {
      temperature: 23.5,
      humidity: 30,
      airflow: 1.85,
      lightExposure: 620,
      roomCondition: 'Desiccating Forced Air',
    },
  },
  {
    id: 'lowland-comparison',
    name: 'Lowland Tropical Reference',
    subtitle: '31.5°C · 78% RH · Sea-Level Comparative Model',
    params: {
      temperature: 31.5,
      humidity: 78,
      airflow: 0.55,
      lightExposure: 480,
      roomCondition: 'Highland Natural Draft',
    },
  },
];

export const DECOMPOSITION_STAGES: DecompositionStage[] = [
  {
    id: 'initial',
    index: 1,
    title: 'Initial Stage (Autolysis Initiation)',
    shortTitle: '01. Initial Stage',
    baguioDayRange: 'Days 0.0 – 2.5 (Baguio 16.5°C)',
    addThresholdRange: [0, 42],
    summary:
      'Immediately following cessation of homeostatic regulation, internal cellular enzymes begin self-digestion (autolysis) without visible external structural alteration.',
    cellularProcesses: [
      'ATP depletion halts sodium-potassium membrane pumps, causing cellular edema and acidification.',
      'Thermal equilibration (Algor mortis) progresses toward the cool 16.5°C Baguio chamber ambient temperature.',
      'Lysosomal membranes rupture internally, releasing hydrolytic enzymes into cytoplasmic matrices.',
    ],
    environmentalSensitivity:
      'In Baguio City’s cool highland climate (15–18°C), thermal equilibration occurs more rapidly than in lowland tropics, which measurably slows early enzymatic kinetics.',
    forensicIndicators: {
      autolysisIndex: 24,
      microbialActivity: 15,
      vocConcentration: '1.8 ppm (Baseline)',
      massRetention: 99.2,
      entomologicalPhase: 'Pre-colonization / Pioneer sensory detection window',
    },
    keyTakeaway:
      'Internal biochemical changes begin immediately, even when external chamber monitors record minimal volatile gas release.',
  },
  {
    id: 'early',
    index: 2,
    title: 'Early Changes (Enzymatic & Anaerobic Shift)',
    shortTitle: '02. Early Changes',
    baguioDayRange: 'Days 2.5 – 6.5 (Baguio 16.5°C)',
    addThresholdRange: [42, 110],
    summary:
      'Endogenous gut microbiota transition to anaerobic fermentation as dissolved oxygen is exhausted, producing measurable organic acids and early volatile compounds.',
    cellularProcesses: [
      'Strict and facultative anaerobes (Clostridium, Bacteroides) metabolize carbohydrates and proteins.',
      'Sulfhemoglobin formation alters light absorption characteristics across superficial tissue layers.',
      'Intracellular gas accumulation (hydrogen sulfide, methane, carbon dioxide) increases internal pressure.',
    ],
    environmentalSensitivity:
      'High relative humidity (>80% RH) in enclosed mountain facilities preserves surface moisture, while temperatures below 18°C extend this stage compared to lowland environments.',
    forensicIndicators: {
      autolysisIndex: 52,
      microbialActivity: 48,
      vocConcentration: '18.4 ppm (Elevated H₂S / CO₂)',
      massRetention: 95.5,
      entomologicalPhase: 'Oviposition threshold (dependent on indoor ingress & >12°C temp)',
    },
    keyTakeaway:
      'The transition from sterile cellular autolysis to microbial fermentation marks the primary inflection point on gas telemetry sensors.',
  },
  {
    id: 'active',
    index: 3,
    title: 'Active Decomposition (Peak Biochemical Kinetics)',
    shortTitle: '03. Active Decomposition',
    baguioDayRange: 'Days 6.5 – 15.0 (Baguio 16.5°C)',
    addThresholdRange: [110, 260],
    summary:
      'Rapid macromolecular breakdown of proteins and lipids occurs alongside fluid purge into the surrounding substrate and peak volatile organic compound (VOC) emission.',
    cellularProcesses: [
      'Proteolysis cleaves peptide bonds into amino acids, subsequently deaminated into skatole, indole, and putrescine.',
      'Liquefied cellular matrices purge through natural pathways, enriching the underlying examination platform.',
      'Peak metabolic heat generation creates a localized +1.5°C to +3.2°C micro-thermal delta above chamber ambient.',
    ],
    environmentalSensitivity:
      'Temperature exerts an exponential (Q₁₀ ≈ 2.2) effect here; increasing airflow >1.2 m/s can abruptly arrest active liquefaction by desiccating outer layers.',
    forensicIndicators: {
      autolysisIndex: 88,
      microbialActivity: 94,
      vocConcentration: '142.0 ppm (Peak VOC Signature)',
      massRetention: 64.0,
      entomologicalPhase: 'Active larval metabolic mass (if unsealed) / Peak microbial dominance',
    },
    keyTakeaway:
      'Greatest rate of biomass conversion and chemical signature release; environmental sensors record peak thermal and VOC anomalies.',
  },
  {
    id: 'advanced',
    index: 4,
    title: 'Advanced Decomposition (Deceleration & Saponification/Desiccation)',
    shortTitle: '04. Advanced Stage',
    baguioDayRange: 'Days 15.0 – 24.0 (Baguio 16.5°C)',
    addThresholdRange: [260, 410],
    summary:
      'Readily digestible soft matrices are largely depleted; biological conversion slows significantly and diverges toward either desiccation or adipocere formation.',
    cellularProcesses: [
      'In high-humidity, cool Baguio conditions (>85% RH), neutral lipids undergo hydrolysis and hydrogenation into adipocere (fatty acid salts).',
      'In high-airflow, low-humidity conditions, remaining collagenous matrices dehydrate rapidly.',
      'Volatile sulfur emissions decline sharply as microbial populations shift toward specialized soil/substrate fungi.',
    ],
    environmentalSensitivity:
      'Humidity and airflow determine the permanent preservation pathway: moist anaerobic conditions favor waxy adipocere, whereas dry ventilation causes leathery desiccation.',
    forensicIndicators: {
      autolysisIndex: 98,
      microbialActivity: 42,
      vocConcentration: '31.5 ppm (Declining)',
      massRetention: 34.5,
      entomologicalPhase: 'Post-feeding migration / Coleoptera (beetle) succession phase',
    },
    keyTakeaway:
      'Environmental moisture balance dictates whether tissues dehydrate via evaporation or saponify into stable fatty compounds.',
  },
  {
    id: 'late',
    index: 5,
    title: 'Late Stage / Remains (Structural Stabilization)',
    shortTitle: '05. Late Stage',
    baguioDayRange: 'Days 24.0 – 30.0+ (Baguio 16.5°C)',
    addThresholdRange: [410, 900],
    summary:
      'Soft biochemical substrates reach equilibrium with the ambient chamber environment, leaving mineral hydroxyapatite matrices, dense tendons, or stabilized adipocere.',
    cellularProcesses: [
      'Organic collagen cross-links degrade very slowly via non-enzymatic hydrolysis over months to years.',
      'Chamber gas and humidity sensors return near baseline equilibrium with ambient Baguio mountain air.',
      'Diagenetic mineral exchange depends on substrate pH and ambient moisture cycling.',
    ],
    environmentalSensitivity:
      'Indoor protection prevents photolytic UV bleaching and rainfall erosion, resulting in remarkably pristine structural preservation for forensic osteological analysis.',
    forensicIndicators: {
      autolysisIndex: 100,
      microbialActivity: 12,
      vocConcentration: '3.2 ppm (Near Ambient)',
      massRetention: 22.0,
      entomologicalPhase: 'Keratinophilic & osteophilic scavenger equilibrium',
    },
    keyTakeaway:
      'Postmortem Interval (PMI) estimation shifts from short-term biochemical/thermal markers to long-term structural and isotopic indicators.',
  },
];

export const ROOM_OBJECTS: RoomObjectInfo[] = [
  {
    id: 'env-sensor',
    code: 'SEN-01',
    name: 'Environmental Sensor Array',
    zone: 'North Wall Telemetry Mast',
    coords2D: { x: 24, y: 26 },
    coords3D: [-2.6, 1.4, -2.5],
    whatItRepresents:
      'A multi-channel analytical sensor array measuring barometric pressure, volatile organic compounds (VOCs), CO₂, and H₂S concentrations in real time.',
    whyItIsImportant:
      'Provides non-invasive quantitative signatures of microbial respiration and protein degradation without disturbing the physical specimen area.',
    whatScientistsObserve:
      'Parts-per-million (ppm) spikes in hydrogen sulfide, putrescine, and carbon dioxide alongside Baguio City’s characteristic ~845 hPa high-altitude barometric pressure.',
    contributionToAnalysis:
      'Allows forensic chemists to map chemical emission peaks directly to Accumulated Degree Days (ADD) and identify stage transitions objectively.',
    getLiveReading: (params, simDay, add) => {
      const vocBase = add < 42 ? 2.1 : add < 110 ? 22.4 : add < 260 ? 138.6 : add < 410 ? 34.2 : 4.1;
      const tempFactor = 1 + (params.temperature - 16.5) * 0.03;
      const airflowDilution = Math.max(0.35, 1 - params.airflow * 0.28);
      const voc = (vocBase * tempFactor * airflowDilution).toFixed(1);
      return {
        primaryMetric: voc,
        primaryUnit: 'ppm VOC',
        secondaryMetric: `845.2 hPa · CO₂ ${(415 + Number(voc) * 1.4).toFixed(0)} ppm`,
        statusLabel: Number(voc) > 80 ? 'ELEVATED' : Number(voc) > 15 ? 'ALTERED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'exam-table',
    code: 'TBL-02',
    name: 'Examination Table',
    zone: 'Central Chamber Platform',
    coords2D: { x: 50, y: 56 },
    coords3D: [0, 0.55, 0],
    whatItRepresents:
      'A medical-grade 316L stainless steel examination table integrated with precision gravimetric load cells and perimeter fluid collection channels.',
    whyItIsImportant:
      'Continuous mass-loss tracking is one of the most reliable quantitative metrics for modeling decomposition kinetics over time.',
    whatScientistsObserve:
      'Gradual gravimetric reduction as intracellular water evaporates and biological macromolecules are converted into volatile gases and purge fluids.',
    contributionToAnalysis:
      'Generates the empirical mass-retention curve used to calibrate Accumulated Degree Day (ADD) mathematical models.',
    getLiveReading: (params, simDay, add) => {
      const retention = Math.max(21.5, 100 - (add / 500) * 78 * (1 + params.airflow * 0.12));
      return {
        primaryMetric: retention.toFixed(1),
        primaryUnit: '% Mass Retained',
        secondaryMetric: `Surface Temp: ${(params.temperature + (add > 90 && add < 270 ? 1.4 : 0.2)).toFixed(1)}°C`,
        statusLabel: retention < 50 ? 'ALTERED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'evidence-markers',
    code: 'EVD-03',
    name: 'Evidence Markers (#01–#04)',
    zone: 'Examination Perimeter',
    coords2D: { x: 39, y: 64 },
    coords3D: [-1.1, 0.88, 0.45],
    whatItRepresents:
      'Standardized yellow forensic photogrammetric markers with metric L-scales placed beside trace fluid margins, textile fibers, and entomological sampling traps.',
    whyItIsImportant:
      'Establishes spatial scale, orientation, and sequential chain-of-custody documentation for physical trace evidence around the platform.',
    whatScientistsObserve:
      'Purge fluid migration distance, textile fiber degradation states, and absence or presence of dipteran puparia casings.',
    contributionToAnalysis:
      'Correlates spatial physical changes on the platform with specific timestamps in the forensic photography and observation log.',
    getLiveReading: (params, simDay, add) => {
      const purgeRadius = add < 50 ? 0 : Math.min(48, ((add - 50) / 250) * 38 * (params.humidity / 80));
      return {
        primaryMetric: purgeRadius.toFixed(1),
        primaryUnit: 'cm Purge Radius',
        secondaryMetric: `4 Active Markers · Scale Verified`,
        statusLabel: purgeRadius > 15 ? 'ALTERED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'research-computer',
    code: 'WKS-04',
    name: 'Research Computer & LIMS',
    zone: 'East Analytical Desk',
    coords2D: { x: 82, y: 62 },
    coords3D: [2.5, 0.95, 0.8],
    whatItRepresents:
      'The Laboratory Information Management System (LIMS) terminal aggregating multi-sensor telemetry, Accumulated Degree Days (ADD), and student observation logs.',
    whyItIsImportant:
      'Centralizes heterogeneous environmental streams into synchronized time-series charts to prevent manual transcription errors.',
    whatScientistsObserve:
      'Divergence between theoretical sea-level decomposition curves and actual highland indoor progression curves.',
    contributionToAnalysis:
      'Computes the cumulative thermal sum (ADD) required to back-calculate the Postmortem Interval (PMI) with statistical confidence bounds.',
    getLiveReading: (params, simDay, add) => {
      return {
        primaryMetric: add.toFixed(1),
        primaryUnit: 'ADD (°C·days)',
        secondaryMetric: `Day ${simDay.toFixed(1)} · Q₁₀ Rate ${(Math.pow(2.2, (params.temperature - 16.5) / 10)).toFixed(2)}x`,
        statusLabel: 'NOMINAL',
      };
    },
  },
  {
    id: 'camera',
    code: 'CAM-05',
    name: 'Overhead Optical & Thermal Camera',
    zone: 'Ceiling Gantry Mount',
    coords2D: { x: 50, y: 16 },
    coords3D: [0, 2.65, 0],
    whatItRepresents:
      'A dual-spectrum time-lapse optical and long-wave infrared (LWIR) radiometric camera mounted directly above the simulation table.',
    whyItIsImportant:
      'Captures continuous time-lapse spatial data and detects subtle exothermic heat signatures produced by microbial and larval metabolism.',
    whatScientistsObserve:
      'False-color thermographic maps showing whether the specimen zone is cooler than, equal to, or warmer than the surrounding chamber walls.',
    contributionToAnalysis:
      'Documents non-contact surface alterations every 15 minutes and verifies when active metabolic thermogenesis peaks and subsides.',
    getLiveReading: (params, simDay, add) => {
      const deltaT = add > 100 && add < 260 ? 1.8 * (params.temperature / 20) : 0.2;
      return {
        primaryMetric: `+${deltaT.toFixed(2)}`,
        primaryUnit: '°C Thermal Δ',
        secondaryMetric: `LWIR 8–14 μm · 15-min Time-Lapse`,
        statusLabel: deltaT > 1.0 ? 'ELEVATED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'ventilation',
    code: 'VNT-06',
    name: 'Ventilation & HEPA System',
    zone: 'Upper West Ductwork',
    coords2D: { x: 16, y: 18 },
    coords3D: [-2.8, 2.35, -1.2],
    whatItRepresents:
      'Variable-speed laminar airflow supply and negative-pressure activated-carbon exhaust filtration unit with insect-exclusion mesh.',
    whyItIsImportant:
      'Regulates air exchange rate (ACH), boundary-layer evaporative drying, and physical access of necrophagous insects.',
    whatScientistsObserve:
      'Air velocity (m/s) across the chamber and pressure differential ensuring bio-safe containment.',
    contributionToAnalysis:
      'Explains why high ventilation accelerates evaporative water loss (favoring mummification) while stagnant air retains moisture and VOCs.',
    getLiveReading: (params) => {
      const ach = (params.airflow * 6.4).toFixed(1);
      return {
        primaryMetric: params.airflow.toFixed(2),
        primaryUnit: 'm/s Airflow',
        secondaryMetric: `${ach} ACH · Mesh Barrier Active`,
        statusLabel: params.airflow > 1.2 ? 'ELEVATED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'temp-monitor',
    code: 'TMP-07',
    name: 'Temperature Monitor',
    zone: 'North-West Instrument Wall',
    coords2D: { x: 15, y: 46 },
    coords3D: [-2.85, 1.35, 0.2],
    whatItRepresents:
      'NIST-traceable platinum resistance thermometer (PRT) logging ambient chamber temperature and diurnal fluctuations.',
    whyItIsImportant:
      'Ambient temperature is the single most influential abiotic variable governing enzymatic catalysis and bacterial doubling times.',
    whatScientistsObserve:
      'Whether temperature remains within Baguio’s cool highland range (14–19°C) or crosses the 20°C–25°C threshold where bacterial kinetics double.',
    contributionToAnalysis:
      'Supplies the daily mean temperature values integrated over time to calculate Accumulated Degree Days (ADD).',
    getLiveReading: (params) => {
      return {
        primaryMetric: params.temperature.toFixed(1),
        primaryUnit: '°C Ambient',
        secondaryMetric: `Thermal Base: 0.0°C · ±0.05°C Precision`,
        statusLabel: params.temperature > 24 ? 'ELEVATED' : params.temperature < 12 ? 'ALTERED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'humidity-monitor',
    code: 'HUM-08',
    name: 'Humidity Monitor',
    zone: 'North-East Instrument Wall',
    coords2D: { x: 78, y: 34 },
    coords3D: [2.75, 1.4, -1.6],
    whatItRepresents:
      'Capacitive thin-film polymer hygrometer measuring relative humidity (% RH), dew point temperature, and vapor pressure deficit.',
    whyItIsImportant:
      'Moisture availability governs hydrolytic enzyme mobility, bacterial biofilm stability, and the competition between desiccation and saponification.',
    whatScientistsObserve:
      'Highland moisture levels (often 80–95% RH in Baguio) versus dry air (<40% RH) that arrests bacterial activity via plasmolysis.',
    contributionToAnalysis:
      'Predicts whether late-stage decomposition will trend toward hydrolytic adipocere formation or dry tissue preservation.',
    getLiveReading: (params) => {
      const dewPoint = (params.temperature - (100 - params.humidity) / 5).toFixed(1);
      return {
        primaryMetric: params.humidity.toFixed(0),
        primaryUnit: '% Rel. Humidity',
        secondaryMetric: `Dew Point: ${dewPoint}°C · Vapor Equilibrium`,
        statusLabel: params.humidity > 88 ? 'ELEVATED' : params.humidity < 40 ? 'ALTERED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'window',
    code: 'WIN-09',
    name: 'Observation Window (Baguio Context)',
    zone: 'North Exterior Wall',
    coords2D: { x: 50, y: 24 },
    coords3D: [0, 1.55, -2.9],
    whatItRepresents:
      'Double-glazed UV-filtered acoustic observation window overlooking the pine-clad Cordillera highlands of Baguio City (1,540m elevation).',
    whyItIsImportant:
      'Illustrates the regional geographic context and controls solar irradiance (Lux) and thermal gain entering the indoor chamber.',
    whatScientistsObserve:
      'External highland fog, incident daylight intensity (Lux), and how indoor structural glazing buffers outdoor weather extremes.',
    contributionToAnalysis:
      'Demonstrates why indoor forensic scenes in Baguio exhibit buffered thermal profiles and restricted insect access compared to outdoor mountain slopes.',
    getLiveReading: (params) => {
      return {
        primaryMetric: params.lightExposure.toFixed(0),
        primaryUnit: 'Lux Irradiance',
        secondaryMetric: `1,540m ASL · Exterior 15.8°C Mist`,
        statusLabel: params.lightExposure > 500 ? 'ELEVATED' : 'NOMINAL',
      };
    },
  },
  {
    id: 'specimen-area',
    code: 'SPC-10',
    name: '3D Structural Anatomy Subject (Supine)',
    zone: 'Examination Table Center',
    coords2D: { x: 52, y: 51 },
    coords3D: [0, 0.92, 0],
    whatItRepresents:
      'A non-graphic, abstract-yet-realistic 3D structural anatomy model positioned supine on the examination table, combining a translucent volumetric envelope, topographical wireframe, articulated osteological skeleton, and visceral/myofascial compartments.',
    whyItIsImportant:
      'Allows students to study how human anatomical structures (Cranium/Cervical, Thoracic Cage, Abdominal/Pelvic Core, and Appendicular Limbs) respond differentially to autolysis, anaerobic gas expansion, saponification, desiccation, and osteological stabilization while maintaining strict academic, non-graphic standards.',
    whatScientistsObserve:
      'Regional Total Body Score (TBS) progression, volumetric abdominal expansion/contraction ratios, myofascial mass retention, visceral compartment thermal shifts, and underlying osteological landmarks (24-segment spine, 10-pair costal arcs, pelvic girdle, and long bones).',
    contributionToAnalysis:
      'Synthesizes regional structural anatomy metrics with internal pH, core temperature, and Megyesi Total Body Score (TBS) to model Postmortem Interval (PMI) and Accumulated Degree Days (ADD).',
    getLiveReading: (params, simDay, add) => {
      const ph = add < 60 ? (7.1 - (add / 60) * 1.2).toFixed(2) : add < 250 ? (5.9 + ((add - 60) / 190) * 2.2).toFixed(2) : '7.45';
      const tbs = Math.min(35, Math.max(3, Math.round(3 + (add / 460) * 30)));
      return {
        primaryMetric: `TBS ${tbs}/35`,
        primaryUnit: `· pH ${ph}`,
        secondaryMetric: `Core Temp: ${(params.temperature + (add > 90 && add < 270 ? 1.6 : 0.2)).toFixed(1)}°C · Cond: ${(1.2 + Math.min(8.5, add / 45)).toFixed(2)} mS/cm`,
        statusLabel: Number(ph) < 6.3 || Number(ph) > 7.8 ? 'ALTERED' : 'NOMINAL',
      };
    },
  },
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'ev-01',
    code: 'EVD-LOG-101',
    title: 'High-Altitude Barometric & Ambient Thermal Log',
    category: 'Environmental Readings',
    collectionPoint: 'SEN-01 & TMP-07 Telemetry Array',
    instrumentUsed: 'BarometricPRT Data Logger',
    baselineFinding:
      'Mean chamber pressure recorded at 845.2 hPa (consistent with 1,540m elevation in Baguio City). Ambient indoor temperature stabilized near 16.5°C with minimal diurnal swing (±0.8°C).',
    dynamicInterpretation: (params, simDay, add) =>
      `At current setting (${params.temperature.toFixed(1)}°C, Day ${simDay.toFixed(1)}), cumulative thermal energy is ${add.toFixed(1)} ADD. Compared to lowland Manila (31°C), biological progression rate is ${(Math.pow(2.2, (params.temperature - 31) / 10) * 100).toFixed(0)}% of sea-level speed.`,
    primaryInfluencingFactors: ['Temperature', 'Indoor Enclosure'],
    scientificRationale:
      'Indoor insulation eliminates direct solar heating and nocturnal radiative cooling, while Baguio’s elevation maintains lower ambient temperatures that decelerate enzymatic Q₁₀ kinetics.',
  },
  {
    id: 'ev-02',
    code: 'EVD-LOG-102',
    title: 'Diptera (Calliphoridae) Colonization & Exclusion Survey',
    category: 'Insect Activity Indicators',
    collectionPoint: 'VNT-06 Louver Traps & EVD-03 Perimeter',
    instrumentUsed: 'Stereomicroscope & Sticky Trap Grid',
    baselineFinding:
      'Zero primary blowfly (Chrysomya megacephala) oviposition detected inside sealed chamber; minor highland species (Calliphora vicina) detected outside mesh louvers with 48–72 hour thermal delay.',
    dynamicInterpretation: (params) =>
      params.roomCondition === 'Sealed Indoor Chamber'
        ? `Sealed chamber exclusion prevents insect access entirely; decomposition relies strictly on endogenous bacteria and autolysis.`
        : params.temperature < 15
          ? `Cool chamber temperature (${params.temperature.toFixed(1)}°C) suppresses dipteran flight activity and delays larval instar development.`
          : `Semi-ventilated conditions at ${params.temperature.toFixed(1)}°C permit delayed olfactory attraction if mesh barriers are bypassed.`,
    primaryInfluencingFactors: ['Indoor Enclosure', 'Temperature', 'Airflow'],
    scientificRationale:
      'Physical structural barriers (windows, mesh vents) delay or prevent insect colonization, which dramatically reduces the rate of soft-tissue biomass removal compared to open outdoor scenes.',
  },
  {
    id: 'ev-03',
    code: 'EVD-LOG-103',
    title: 'Headspace Volatile Organic Compound (VOC) & Microbial Profile',
    category: 'Microbial Activity Indicators',
    collectionPoint: 'SEN-01 Headspace Collector',
    instrumentUsed: 'GC-MS (Gas Chromatography–Mass Spectrometry) Proxy',
    baselineFinding:
      'Slow, steady elevation of dimethyl disulfide, indole, and organic acids corresponding to psychrotolerant and mesophilic anaerobic fermentation.',
    dynamicInterpretation: (params, simDay, add) =>
      `At ${add.toFixed(0)} ADD and ${params.humidity}% RH, microbial enzymatic activity is ${
        params.temperature > 24 && params.humidity > 60
          ? 'markedly accelerated with rapid proteolysis'
          : params.humidity < 40
            ? 'inhibited by surface dehydration'
            : 'progressing at a moderated highland baseline rate'
      }.`,
    primaryInfluencingFactors: ['Temperature', 'Humidity'],
    scientificRationale:
      'Enteric and environmental bacteria require both thermal activation energy and sufficient water activity (a_w > 0.85) to catabolize proteins and lipids.',
  },
  {
    id: 'ev-04',
    code: 'EVD-LOG-104',
    title: 'Substrate Moisture & Hydrolytic Saponification Index',
    category: 'Moisture Measurements',
    collectionPoint: 'HUM-08 & TBL-02 Drainage Matrix',
    instrumentUsed: 'Capacitive Hygrometer & Karl Fischer Moisture Titration',
    baselineFinding:
      'Sustained relative humidity above 80% RH in cool indoor conditions promotes localized moisture retention and early fatty acid hydrolysis (adipocere precursors).',
    dynamicInterpretation: (params) =>
      params.humidity >= 85 && params.airflow < 0.4
        ? `High humidity (${params.humidity}% RH) + low airflow (${params.airflow.toFixed(2)} m/s) creates ideal conditions for hydrolytic adipocere (saponification) formation.`
        : params.humidity < 45 || params.airflow > 1.2
          ? `Low moisture / high airflow (${params.airflow.toFixed(2)} m/s) favors evaporative desiccation over saponification.`
          : `Balanced moisture regime (${params.humidity}% RH) supports standard aerobic/anaerobic progression.`,
    primaryInfluencingFactors: ['Humidity', 'Airflow'],
    scientificRationale:
      'Adipocere (grave wax) forms when neutral adipose lipids are hydrolyzed by bacterial enzymes in high-moisture, low-oxygen environments—frequently observed in damp highland regions.',
  },
  {
    id: 'ev-05',
    code: 'EVD-LOG-105',
    title: 'Accumulated Degree Days (ADD) Thermal Integral Record',
    category: 'Temperature Records',
    collectionPoint: 'WKS-04 LIMS Calculation Engine',
    instrumentUsed: 'Continuous 15-Minute Thermocouple Integrator',
    baselineFinding:
      'At Baguio’s 16.5°C indoor baseline, accumulating 250 ADD requires ~15.1 days, whereas at 31.3°C (lowland tropics) 250 ADD is reached in just 8.0 days.',
    dynamicInterpretation: (params, simDay, add) =>
      `Current run has accumulated ${add.toFixed(1)} °C·days over ${simDay.toFixed(1)} days (Daily thermal increment: +${Math.max(0, params.temperature).toFixed(1)} ADD/day).`,
    primaryInfluencingFactors: ['Temperature'],
    scientificRationale:
      'Megyesi et al. (2005) demonstrated that decomposition correlates far more accurately with cumulative thermal energy (ADD) than with chronological time alone.',
  },
  {
    id: 'ev-06',
    code: 'EVD-LOG-106',
    title: 'Chronological Stage Transition & PMI Verification Log',
    category: 'Timeline Observations',
    collectionPoint: 'CAM-05 Time-Lapse & SPC-10 Matrix',
    instrumentUsed: 'Multispectral Time-Lapse & pH Telemetry',
    baselineFinding:
      'Extended duration of Early Changes and Active Decomposition phases due to highland thermal moderation.',
    dynamicInterpretation: (params, simDay, add) => {
      const stage =
        add < 42
          ? 'Initial Stage'
          : add < 110
            ? 'Early Changes'
            : add < 260
              ? 'Active Decomposition'
              : add < 410
                ? 'Advanced Decomposition'
                : 'Late Stage / Remains';
      return `At Day ${simDay.toFixed(1)} (${add.toFixed(0)} ADD), specimen matrix is in [${stage}]. Ignoring Baguio’s cool temperature would cause a significant PMI overestimation error if lowland tables were used.`;
    },
    primaryInfluencingFactors: ['Temperature', 'Humidity', 'Airflow'],
    scientificRationale:
      'Applying tropical lowland decomposition timelines to a high-altitude Baguio scene without thermal correction leads to inaccurate Postmortem Interval (PMI) conclusions.',
  },
  {
    id: 'ev-07',
    code: 'EVD-LOG-107',
    title: 'Cotton-Polyester Textile Microclimate & Moisture Barrier Log',
    category: 'Clothing/Material Observations',
    collectionPoint: 'EVD-03 & SPC-10 Textile Layer',
    instrumentUsed: 'Gravimetric Swatch & Fiber Microscopy',
    baselineFinding:
      'Heavy highland clothing layers act as a thermal insulator during the first 18 hours and subsequently trap surface moisture against the matrix.',
    dynamicInterpretation: (params) =>
      `Under ${params.airflow.toFixed(2)} m/s airflow and ${params.humidity}% RH, textile coverings reduce direct evaporative drying by ~38% and shelter micro-environments from indirect light (${params.lightExposure} Lux).`,
    primaryInfluencingFactors: ['Humidity', 'Airflow', 'Light'],
    scientificRationale:
      'Clothing modifies the boundary layer around the specimen, slowing initial algor mortis cooling and retaining moisture that can promote localized adipocere formation.',
  },
];

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'mod-01',
    number: 'Module 01',
    title: 'Introduction to Decomposition',
    subtitle: 'Cellular Autolysis, Microbial Putrefaction & Non-Graphic Forensic Modeling',
    duration: '12 min study',
    overview:
      'Human decomposition is a continuous, scientifically predictable sequence of biochemical and ecological processes that recycle organic macromolecules after homeostatic regulation ceases. In forensic science, understanding these mechanisms allows investigators to estimate the Postmortem Interval (PMI) and reconstruct environmental history.',
    keyConcepts: [
      {
        heading: '1. Autolysis (Intrinsic Self-Digestion)',
        body: 'When circulation and respiration cease, cellular hypoxia causes ATP production to fail. Cell membranes lose selective permeability, intracellular pH drops, and lysosomes release hydrolytic enzymes (proteases, lipases, amylases) that break down cellular structures from within—entirely independent of bacteria.',
        formulaOrMetric: 'ATP → ADP + Pi (Depletion within hours) → Lysosomal Enzyme Release',
      },
      {
        heading: '2. Putrefaction (Microbial Catabolism)',
        body: 'Following autolytic release of nutrient-rich intracellular fluids, endogenous anaerobic bacteria from the gastrointestinal tract (such as Clostridium and Bacteroides species) proliferate. They ferment carbohydrates, proteins, and lipids into volatile organic compounds (VOCs), organic acids, and gases (H₂S, CO₂, CH₄, NH₃).',
        formulaOrMetric: 'Proteins → Amino Acids → Indole + Skatole + Putrescine + Cadaverine + H₂S',
      },
      {
        heading: '3. Accumulated Degree Days (ADD)',
        body: 'Because biochemical reactions depend on thermal energy rather than clock time alone, forensic scientists standardize decomposition timelines using Accumulated Degree Days (ADD)—the sum of average daily temperatures (°C) above a biological base threshold (typically 0°C).',
        formulaOrMetric: 'ADD = ∑ max(0, T_mean_daily − T_base)',
      },
    ],
    baguioContextNote:
      'In Baguio City (elevation ~1,540 meters), average indoor temperatures hover around 15°C–18°C year-round, compared to 28°C–33°C in Philippine lowland cities. Consequently, reaching 250 ADD takes roughly twice as many calendar days in Baguio as in Manila.',
    interactivePrompt:
      'Switch to the Simulation tab and compare the "Baguio Highland Baseline" preset (16.5°C) with the "Lowland Tropical Reference" preset (31.5°C) at Simulation Day 8.',
    questions: [
      {
        id: 'q-m1-1',
        moduleId: 'mod-01',
        type: 'multiple-choice',
        question: 'Which process initiates decomposition internally via the release of endogenous lysosomal enzymes before bacterial proliferation dominates?',
        options: [
          'Saponification (Adipocere formation)',
          'Autolysis (Cellular self-digestion)',
          'Photolytic oxidation',
          'Diagenetic mineralization',
        ],
        correctIndex: 1,
        explanation:
          'Autolysis is the intrinsic chemical breakdown of cells by their own intracellular lysosomal enzymes triggered by ATP depletion and pH drop.',
      },
      {
        id: 'q-m1-2',
        moduleId: 'mod-01',
        type: 'true-false',
        question: 'True or False: Chronological time (days elapsed) alone is a more accurate predictor of decomposition stage than Accumulated Degree Days (ADD) across different climates.',
        options: ['True', 'False'],
        correctIndex: 1,
        explanation:
          'False. Because enzymatic and microbial kinetics are strongly temperature-dependent, Accumulated Degree Days (ADD) accounts for thermal energy differences between cool highland environments (like Baguio) and warm lowlands.',
      },
    ],
  },
  {
    id: 'mod-02',
    number: 'Module 02',
    title: 'Environmental Factors',
    subtitle: 'Temperature Kinetics (Q₁₀), Relative Humidity, Airflow & Indoor Microclimates',
    duration: '15 min study',
    overview:
      'Abiotic environmental variables govern both the rate of chemical reactions and the physical pathway of tissue alteration. Modifying temperature, relative humidity, or ventilation can accelerate decomposition or divert it toward preservation states.',
    keyConcepts: [
      {
        heading: '1. Temperature & the Q₁₀ Rule',
        body: 'Within the biological window of 5°C to 38°C, enzymatic and bacterial metabolic rates approximately double for every 10°C increase in temperature (the Van ’t Hoff Q₁₀ coefficient). Below 4°C, microbial enzymes are largely dormant; above 45°C, enzymes begin to denature.',
        formulaOrMetric: 'Rate_2 = Rate_1 × Q₁₀^((T₂ − T₁) / 10)   [where Q₁₀ ≈ 2.0 – 2.3]',
      },
      {
        heading: '2. Relative Humidity & Water Activity',
        body: 'High relative humidity (>80% RH) maintains tissue hydration and supports hydrolytic bacterial enzymes. Under persistent damp, cool, anaerobic conditions, adipose lipids hydrolyze and hydrogenate into waxy adipocere (saponification). Conversely, low humidity (<40% RH) dehydrates tissues and halts bacterial proliferation.',
        formulaOrMetric: 'Neutral Lipids + H₂O (Bacterial Lipase) → Free Fatty Acids → Adipocere Salts',
      },
      {
        heading: '3. Airflow, Ventilation & Indoor Enclosure',
        body: 'Air movement removes the saturated boundary layer of water vapor around a specimen, accelerating evaporative cooling and desiccation. Meanwhile, indoor structural barriers buffer temperature swings and restrict access by necrophagous insects (Calliphoridae).',
        formulaOrMetric: 'Evaporation Rate ∝ Airflow Velocity (m/s) × Vapor Pressure Deficit',
      },
    ],
    baguioContextNote:
      'Baguio City combines cool mountain temperatures with very high monsoonal relative humidity (often 85%–95% RH). In poorly ventilated indoor rooms, this combination slows rapid putrefaction while favoring moisture retention and partial saponification.',
    interactivePrompt:
      'In the Environmental Simulation panel, set Humidity to 94% and Airflow to 0.1 m/s to observe how the Adipocere / Moisture Retention index responds.',
    questions: [
      {
        id: 'q-m2-1',
        moduleId: 'mod-02',
        type: 'factor-analysis',
        question: 'If an indoor chamber’s airflow is increased from 0.1 m/s to 2.0 m/s while relative humidity drops to 28%, which outcome is scientifically favored?',
        options: [
          'Accelerated anaerobic liquefaction',
          'Evaporative tissue desiccation and slowed microbial activity',
          'Rapid blowfly oviposition within 1 hour',
          'Immediate hydroxyapatite recrystallization',
        ],
        correctIndex: 1,
        explanation:
          'High airflow paired with low relative humidity rapidly strips surface moisture, inhibiting bacterial biofilm enzymes and promoting tissue desiccation.',
      },
      {
        id: 'q-m2-2',
        moduleId: 'mod-02',
        type: 'scenario',
        scenarioContext: 'An indoor facility in Baguio City experiences a power outage during the Habagat monsoon season: chamber temperature stays at 15°C and relative humidity rises to 93% with near-zero airflow.',
        question: 'How will these environmental conditions influence the simulation compared to a 30°C ventilated room?',
        options: [
          'Enzymatic breakdown will proceed much faster due to high humidity alone.',
          'Overall metabolic breakdown will be slower due to the 15°C cool temperature, while high moisture favors hydrolytic lipid saponification (adipocere).',
          'High humidity will immediately halt all cellular autolysis.',
          'The specimen will rapidly mummify within 48 hours.',
        ],
        correctIndex: 1,
        explanation:
          'Low temperature (15°C) lowers the Q₁₀ enzymatic rate, while high humidity (93% RH) and stagnant air prevent drying and promote hydrolytic conversion of lipids into adipocere.',
      },
    ],
  },
  {
    id: 'mod-03',
    number: 'Module 03',
    title: 'Decomposition Timeline',
    subtitle: 'Scientific Progression Across the Five Simplified Stages',
    duration: '14 min study',
    overview:
      'While decomposition is a continuous biological spectrum, forensic researchers divide the timeline into five simplified operational stages—Initial, Early Changes, Active Decomposition, Advanced Decomposition, and Late Stage / Remains—to standardize observation scoring.',
    keyConcepts: [
      {
        heading: '1. Initial Stage to Early Changes (0 – 110 ADD)',
        body: 'The Initial Stage begins at death with internal cellular autolysis and thermal equilibration. As oxygen is depleted, the Early Changes stage manifests through anaerobic fermentation by gut microbiota, shifting internal pH downward and releasing initial H₂S and CO₂ gases.',
        formulaOrMetric: 'Threshold: ~0 to 110 ADD (°C·days)',
      },
      {
        heading: '2. Active to Advanced Decomposition (110 – 410 ADD)',
        body: 'Active Decomposition represents peak proteolysis, lipid breakdown, fluid purge, and maximum VOC emissions. Once labile soft substrates are consumed, the system enters Advanced Decomposition, characterized by decelerating mass loss and divergence toward either desiccation or saponification.',
        formulaOrMetric: 'Threshold: ~110 to 410 ADD (°C·days)',
      },
      {
        heading: '3. Late Stage / Stabilization (>410 ADD)',
        body: 'In the Late Stage, volatile gas emissions return near ambient baseline and remaining structural matrices (mineralized tissues, dense collagen, or stabilized adipocere) equilibrate with the indoor environment.',
        formulaOrMetric: 'Threshold: >410 ADD (°C·days)',
      },
    ],
    baguioContextNote:
      'At 16.5°C in Baguio City, 110 ADD (onset of Active Decomposition) occurs around Day 6.7. At 31°C in a lowland coastal city, 110 ADD is reached in just 3.5 days.',
    interactivePrompt:
      'Use the Timeline tab to step through all 5 stages and inspect the corresponding VOC, Mass Retention, and Microbial Activity metrics.',
    questions: [
      {
        id: 'q-m3-1',
        moduleId: 'mod-03',
        type: 'multiple-choice',
        question: 'During which stage do environmental gas sensors typically record the highest concentration of volatile organic compounds (VOCs) and the fastest rate of mass loss?',
        options: [
          '01. Initial Stage',
          '02. Early Changes',
          '03. Active Decomposition',
          '05. Late Stage / Remains',
        ],
        correctIndex: 2,
        explanation:
          'Active Decomposition is characterized by peak microbial proteolysis, fluid purge, and maximum volatile gas emission.',
      },
      {
        id: 'q-m3-2',
        moduleId: 'mod-03',
        type: 'scenario',
        scenarioContext: 'A controlled chamber is maintained at a constant 20.0°C (with a base temperature of 0°C).',
        question: 'How many simulation days are required to reach 200 Accumulated Degree Days (ADD), placing the simulation solidly in Active Decomposition?',
        options: ['5.0 Days', '10.0 Days', '20.0 Days', '40.0 Days'],
        correctIndex: 1,
        explanation:
          'ADD = Daily Mean Temp × Days = 20.0°C × 10.0 Days = 200 ADD.',
      },
    ],
  },
  {
    id: 'mod-04',
    number: 'Module 04',
    title: 'Forensic Observation Protocols',
    subtitle: 'Objective Telemetry Logging, Instrumentation & Scientific Documentation',
    duration: '10 min study',
    overview:
      'Rigorous forensic investigation depends on separating objective, quantifiable instrument measurements from interpretive conclusions. Every observation entry must anchor visual or sensor findings to exact environmental metadata.',
    keyConcepts: [
      {
        heading: '1. Dual-Channel Documentation (Ambient vs. Micro-Environment)',
        body: 'Investigators never record a single temperature reading in isolation. They document both the ambient room temperature (via wall PRT sensors) and the localized specimen micro-environment (via thermal imaging or table probes) to detect metabolic heat differentials.',
        formulaOrMetric: 'ΔT_metabolic = T_specimen_surface − T_ambient_chamber',
      },
      {
        heading: '2. Quantitative vs. Subjective Language',
        body: 'Scientific observation logs replace vague adjectives ("warm room", "strong odor") with calibrated sensor values ("16.5°C ambient, 82% RH, 138.6 ppm VOC headspace reading, 14.2 cm purge radius at Marker #02").',
        formulaOrMetric: 'Standard Log: [Timestamp] + [ADD] + [Sensor Telemetry] + [Testable Interpretation]',
      },
    ],
    baguioContextNote:
      'When documenting indoor cases in the Cordillera region, investigators must explicitly record whether windows, vents, or heaters were active prior to discovery, as microclimate shifts alter ADD back-calculations.',
    interactivePrompt:
      'Open the Scientific Observation Panel on the Simulation or Reports tab and record a structured observation at two different simulation days.',
    questions: [
      {
        id: 'q-m4-1',
        moduleId: 'mod-04',
        type: 'multiple-choice',
        question: 'Which of the following represents a properly formatted, objective forensic observation entry?',
        options: [
          '"The room felt chilly like typical Baguio weather and looked about a week old."',
          '"Day 7.0 (115.5 ADD): Ambient 16.5°C, 82% RH, 0.35 m/s airflow; VOC sensor recorded 96.4 ppm; matrix pH at 6.42 indicating transition to Active Decomposition."',
          '"Advanced stage reached quickly because of normal indoor conditions."',
          '"Sensors were normal and decomposition was standard."',
        ],
        correctIndex: 1,
        explanation:
          'Scientific forensic documentation requires exact quantitative measurements (temperature, RH, airflow, VOC ppm, pH, and ADD) linked to an evidence-based interpretation.',
      },
    ],
  },
  {
    id: 'mod-05',
    number: 'Module 05',
    title: 'Evidence Interpretation',
    subtitle: 'Synthesizing Entomological, Microbial, Thermal & Textile Evidence',
    duration: '15 min study',
    overview:
      'No single forensic indicator is infallible in isolation. Accurate Postmortem Interval (PMI) and environmental reconstruction require cross-validating multiple independent lines of evidence—thermal logs, insect succession, microbial VOCs, and textile barriers.',
    keyConcepts: [
      {
        heading: '1. Entomological Delay in Indoor Highland Scenes',
        body: 'In outdoor lowland scenes, blowflies (Calliphoridae) often colonize within minutes to hours. In an indoor Baguio facility at 16°C, physical screening and cool mountain air can delay oviposition by days—or exclude insects completely—meaning larval age indicates only the Minimum Postmortem Interval (PMI_min) after insect access.',
        formulaOrMetric: 'PMI_total = Duration_pre_colonization + Duration_larval_development',
      },
      {
        heading: '2. Textile Insulation & Boundary-Layer Effects',
        body: 'Clothing and coverings retard initial algor mortis heat loss during the first 12–24 hours, shield surfaces from light exposure, and wick purge fluids—creating localized high-moisture microclimates that can form patchy adipocere even when room air is moderately ventilated.',
        formulaOrMetric: 'Microclimate RH_under_textile > Ambient Chamber RH',
      },
    ],
    baguioContextNote:
      'Forensic analysts in Baguio frequently encounter heavy knitwear or layered blankets in indoor scenes; accounting for this thermal and moisture insulation prevents misinterpreting early thermal and moisture readings.',
    interactivePrompt:
      'Visit the Evidence tab and use the Environmental Factor Attribution Analyzer to match all 7 evidence logs with their governing variables.',
    questions: [
      {
        id: 'q-m5-1',
        moduleId: 'mod-05',
        type: 'scenario',
        scenarioContext: 'In an indoor Baguio simulation at 16.0°C with sealed windows and HEPA mesh vents, chemical sensors show 180 ADD of microbial progression, but zero dipteran larvae are present.',
        question: 'What is the most scientifically accurate interpretation of the absence of insect activity?',
        options: [
          'The simulation day must be Day 0 because insects always arrive within 2 hours.',
          'Physical indoor structural exclusion and cool highland temperatures prevented blowfly access; decomposition progressed via endogenous bacteria and autolysis.',
          'Ambient barometric pressure at 1,540m makes bacterial fermentation impossible.',
          'Light exposure sterilized all insects.',
        ],
        correctIndex: 1,
        explanation:
          'Indoor structural barriers (sealed windows, mesh vents) and cooler mountain temperatures routinely prevent or delay insect colonization while internal microbial decomposition continues.',
      },
    ],
  },
  {
    id: 'mod-06',
    number: 'Module 06',
    title: 'Simulation Activity & Case Synthesis',
    subtitle: 'Experimental Variable Manipulation & Baguio Case Reconstruction',
    duration: '20 min lab activity',
    overview:
      'In this capstone laboratory module, you apply multivariable analysis to the Baguio Indoor Simulation Case—testing how shifts in temperature, humidity, and airflow reshape the trajectory of decomposition.',
    keyConcepts: [
      {
        heading: '1. Comparative Hypothesis Testing',
        body: 'By holding simulation day constant (e.g., Day 12) and varying environmental presets, you can observe how ADD, mass retention, and VOC signatures diverge across Highland Baseline, Monsoon Damp, and Warm Sealed scenarios.',
        formulaOrMetric: 'Controlled Experiment: Vary T / RH / Airflow → Measure ΔADD & ΔMass',
      },
      {
        heading: '2. Synthesizing the Final Forensic Report',
        body: 'A complete forensic simulation report integrates room instrument inspections, environmental time-series graphs, evidence attributions, and recorded student observations into a defensible scientific conclusion.',
        formulaOrMetric: 'Inspection + Telemetry + Evidence Attribution + Observation Log → Final PMI Report',
      },
    ],
    baguioContextNote:
      'Completing the 8-step Baguio Indoor Simulation Case workflow generates a comprehensive laboratory dossier ready for academic review.',
    interactivePrompt:
      'Launch the "Baguio Case Scenario" tracker from the top bar or Reports view to complete all 8 laboratory investigation milestones.',
    questions: [
      {
        id: 'q-m6-1',
        moduleId: 'mod-06',
        type: 'factor-analysis',
        question: 'When comparing a 15-day simulation run in Baguio Highland Baseline (16.5°C) against a Lowland Reference run (31.5°C), what is the primary quantitative difference at Day 15?',
        options: [
          'Both runs have identical ADD (247.5 °C·days) because chronological time is equal.',
          'The Baguio run reaches ~247.5 ADD (Active Decomposition), whereas the Lowland run reaches ~472.5 ADD (Late Stage / Stabilization).',
          'The Baguio run reaches Late Stage faster due to lower barometric pressure.',
          'Mass retention is 100% in both chambers at Day 15.',
        ],
        correctIndex: 1,
        explanation:
          'At Day 15, Baguio (16.5°C × 15 = 247.5 ADD) is still in Active Decomposition, whereas the Lowland Reference (31.5°C × 15 = 472.5 ADD) has already crossed the >410 ADD threshold into Late Stage.',
      },
    ],
  },
];

export const COMPREHENSIVE_QUIZ_QUESTIONS: QuizQuestion[] = [
  ...LEARNING_MODULES.flatMap((m) => m.questions),
  {
    id: 'q-comp-1',
    moduleId: 'comprehensive',
    type: 'scenario',
    scenarioContext:
      'Investigators examine a controlled indoor simulation in Baguio City after 10.0 days. Thermocouple logs show the room was maintained at 15.0°C for the first 5 days, and then a heater raised the room temperature to 25.0°C for the next 5 days.',
    question: 'What is the total Accumulated Degree Days (ADD, base 0°C) at Day 10.0, and which stage does it correspond to?',
    options: [
      '75 ADD — Early Changes',
      '150 ADD — Initial Stage',
      '200 ADD — Active Decomposition',
      '350 ADD — Advanced Decomposition',
    ],
    correctIndex: 2,
    explanation:
      'First 5 days: 5 × 15.0°C = 75 ADD. Next 5 days: 5 × 25.0°C = 125 ADD. Total = 75 + 125 = 200 ADD, which falls squarely within Active Decomposition (110–260 ADD).',
  },
  {
    id: 'q-comp-2',
    moduleId: 'comprehensive',
    type: 'true-false',
    question:
      'True or False: Overhead long-wave infrared (LWIR) thermal imaging in a forensic chamber can detect a localized +1.5°C to +3.0°C temperature elevation during Active Decomposition caused by microbial metabolic thermogenesis.',
    options: ['True', 'False'],
    correctIndex: 0,
    explanation:
          'True. Intense exothermic catabolism by anaerobic and facultative bacteria (and larval masses when present) produces measurable localized thermal elevations above ambient room temperature.',
  },
  {
    id: 'q-comp-3',
    moduleId: 'comprehensive',
    type: 'factor-analysis',
    question:
      'Which combination of Baguio indoor environmental parameters is most conducive to hydrolytic adipocere (saponification) formation rather than dry mummification?',
    options: [
      'Temperature 28°C · Relative Humidity 25% · Airflow 2.1 m/s',
      'Temperature 15°C · Relative Humidity 92% · Airflow 0.08 m/s (High-Moisture Monsoonal)',
      'Temperature 34°C · Relative Humidity 35% · Airflow 1.6 m/s',
      'Temperature 8°C · Relative Humidity 20% · Airflow 2.4 m/s',
    ],
    correctIndex: 1,
    explanation:
      'Adipocere requires high moisture (>80% RH) for enzymatic fat hydrolysis and low airflow/oxygen to prevent evaporative drying and aerobic degradation.',
  },
];

export const GENERATED_ASSETS = {
  windowView: '/src/assets/images/baguio_highland_window_view_1790576572684.jpg',
  cellularDiagram: '/src/assets/images/diagram_cellular_autolysis_science_1790576590743.jpg',
  sensorRig: '/src/assets/images/forensic_sensor_calibration_rig_1790576609423.jpg',
};
