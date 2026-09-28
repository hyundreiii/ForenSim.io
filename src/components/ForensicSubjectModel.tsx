import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EnvironmentalParams } from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import {
  Crosshair,
  GripHorizontal,
  Maximize2,
  Minimize2,
  RotateCcw,
  Scan,
} from 'lucide-react';

export type StructuralLayerMode =
  | 'dermal-skin' // Realistic Subsurface Human Skin & Dynamic Forensic Dermal Simulation
  | 'composite' // Translucent Clinical Anatomical Envelope + Internal Articulated Skeleton
  | 'anatomical-surface' // High-Realism Sculpted Surface Anatomy (Subsurface Clinical Polymer)
  | 'osteology' // Pure 3D Articulated Osteological Skeleton (24 Vertebrae, 12 Rib Pairs, Skull, Pelvis, Limbs)
  | 'myofascial-visceral' // Internal Visceral Organs (Lungs, Heart, Liver, Enteric Tract, Vascular Tree & Muscle Bundles)
  | 'thermal-ir' // Non-Graphic LWIR Thermographic & Biophysical Surface Map
  | 'wireframe-shell'; // High-Density LiDAR Topographical Wireframe & Cross-Sections

export type AnatomicalRegionId =
  | 'head-neck'
  | 'thorax'
  | 'abdomen-pelvis'
  | 'extremities';

export interface RegionTelemetry {
  id: AnatomicalRegionId;
  title: string;
  shortLabel: string;
  megyesiMaxScore: number;
  structuralLandmarks: string;
  getScoreAndFindings: (
    params: EnvironmentalParams,
    metrics: SimulationMetrics
  ) => {
    score: number;
    tissueState: string;
    internalProcess: string;
    localTemp: string;
    structuralVolumeRatio: number;
  };
}

export const ANATOMICAL_REGIONS: RegionTelemetry[] = [
  {
    id: 'head-neck',
    title: 'Cranium, Maxilla & Cervical Column (C1–C7)',
    shortLabel: 'Head & Neck',
    megyesiMaxScore: 13,
    structuralLandmarks:
      'Neurocranium, Supraorbital Ridge, Zygomatic Arches, Mandible, Atlas/Axis & Cervical Vertebrae C1–C7',
    getScoreAndFindings: (params, metrics) => {
      const add = metrics.add;
      const score = Math.min(13, Math.max(1, Math.round(1 + (add / 430) * 12)));
      const localTemp = (
        params.temperature + (add > 90 && add < 240 ? 0.9 : 0.1)
      ).toFixed(1);
      const structuralVolumeRatio = Math.max(0.45, 1 - (add / 520) * 0.52);
      const tissueState =
        add < 42
          ? 'Baseline cranial-cervical envelope integrity; early intracellular autolysis within high-water neural compartments.'
          : add < 110
            ? 'Cervical vascular network hemolysis propagation; initial reduction in periorbital and submandibular soft-tissue turgor.'
            : add < 260
              ? 'Active proteolysis of facial and cervical myofascial layers; progressive structural thinning over zygomatic and mandibular arches.'
              : add < 410
                ? params.humidity > 80
                  ? 'Hydrolytic lipid stabilization (adipocere matrix) preserving submandibular contour over cranial osteology.'
                  : 'Advanced structural desiccation of pericranial envelope; frontal, orbital, and mandibular landmarks prominent.'
                : 'Stabilized neurocranium, maxilla, mandible, and cervical vertebrae C1–C7 (>50% osteological prominence).';
      return {
        score,
        tissueState,
        internalProcess:
          'Encephalic compartment (80% water) undergoes rapid autolytic liquefaction and passive hydrostatic drainage along the cervical axis.',
        localTemp: `${localTemp}°C`,
        structuralVolumeRatio,
      };
    },
  },
  {
    id: 'thorax',
    title: 'Thoracic Ribcage, Sternum & Pectoral Girdle (T1–T12)',
    shortLabel: 'Thorax',
    megyesiMaxScore: 12,
    structuralLandmarks:
      'Manubrium, Sternal Body, Xiphoid Process, Costal Arcs #1–#12, Clavicles, Scapulae & Thoracic Spine',
    getScoreAndFindings: (params, metrics) => {
      const add = metrics.add;
      const score = Math.min(12, Math.max(1, Math.round(1 + (add / 450) * 11)));
      const localTemp = (
        params.temperature + (add > 95 && add < 260 ? 1.5 : 0.2)
      ).toFixed(1);
      const structuralVolumeRatio = Math.max(0.5, 1 - (add / 540) * 0.46);
      const tissueState =
        add < 42
          ? 'Intact thoracic cage compliance; algor mortis thermal equilibration across pectoral and intercostal musculature.'
          : add < 110
            ? 'Intravascular hemolysis diffusion along subclavian and intercostal pathways; rigor mortis resolution in pectoral fibers.'
            : add < 260
              ? 'Progressive enzymatic breakdown of intercostal and pectoral myofascial bundles; costal cartilage softening.'
              : add < 410
                ? params.humidity > 80
                  ? 'Saponified subcutaneous lipid layer forming a rigid structural shell over the anterior ribcage.'
                  : 'Anterior-posterior thoracic envelope contraction outlining the sternum and costal arcs #1–#12.'
                : 'Articulated thoracic ribcage, sternum, clavicles, and thoracic vertebrae structurally dominant.';
      return {
        score,
        tissueState,
        internalProcess:
          'Pleural and mediastinal compartments equilibrate thermally with ambient air while intercostal myofascial proteins depolymerize.',
        localTemp: `${localTemp}°C`,
        structuralVolumeRatio,
      };
    },
  },
  {
    id: 'abdomen-pelvis',
    title: 'Abdominal Cavity, Enteric Core & Pelvic Girdle (L1–S5)',
    shortLabel: 'Abdomen & Pelvis',
    megyesiMaxScore: 12,
    structuralLandmarks:
      'Lumbar Spine L1–L5, Iliac Crests, Sacrum, Pubic Symphysis, Hepatic & Ileocecal Visceral Core',
    getScoreAndFindings: (params, metrics) => {
      const add = metrics.add;
      const score = Math.min(12, Math.max(1, Math.round(1 + (add / 440) * 11)));
      const localTemp = (
        params.temperature + (add > 85 && add < 270 ? 2.2 : 0.25)
      ).toFixed(1);
      let structuralVolumeRatio = 1.0;
      if (add > 45 && add < 265) {
        structuralVolumeRatio =
          1.0 + Math.sin(((add - 45) / 220) * Math.PI) * 0.28;
      } else if (add >= 265) {
        structuralVolumeRatio = Math.max(0.52, 1.0 - ((add - 265) / 250) * 0.45);
      }
      const tissueState =
        add < 42
          ? 'Baseline abdominal wall geometry; anaerobic microbial shift initiating at the ileocecal junction (right iliac fossa).'
          : add < 110
            ? 'Metabolic gas accumulation (H₂S, CO₂, CH₄) increasing intra-abdominal pressure and elevating the anterior abdominal envelope.'
            : add < 260
              ? 'Peak volumetric distension followed by structural decompression and mass transfer across the abdominal-pelvic boundary.'
              : add < 410
                ? params.humidity > 80
                  ? 'Mesenteric and subcutaneous lipid hydrolysis (adipocere) stabilizing the deflated abdominal-pelvic contour.'
                  : 'Concave structural retraction of the abdominal envelope toward the lumbar column and iliac crests.'
                : 'Pelvic girdle (ilium, ischium, sacrum) and lumbar column L1–L5 stabilized at baseline mineral equilibrium.';
      return {
        score,
        tissueState,
        internalProcess:
          'Endogenous enteric flora (Clostridium & Bacteroides) drive the primary exothermic fermentation and volumetric expansion curve.',
        localTemp: `${localTemp}°C`,
        structuralVolumeRatio,
      };
    },
  },
  {
    id: 'extremities',
    title: 'Appendicular Skeleton & Myofascial Limbs (Upper & Lower)',
    shortLabel: 'Extremities',
    megyesiMaxScore: 10,
    structuralLandmarks:
      'Humerus, Radius, Ulna, Carpals/Phalanges, Femur, Patella, Tibia, Fibula & Tarsals',
    getScoreAndFindings: (params, metrics) => {
      const add = metrics.add;
      const score = Math.min(10, Math.max(1, Math.round(1 + (add / 470) * 9)));
      const localTemp = (params.temperature + 0.05).toFixed(1);
      const structuralVolumeRatio = Math.max(0.52, 1 - (add / 500) * 0.45);
      const tissueState =
        add < 42
          ? 'Actomyosin cross-bridging (rigor mortis) across appendicular muscle groups; rapid conductive heat loss in distal segments.'
          : add < 110
            ? 'Proteolytic relaxation of brachial and femoral myofascial bundles; early distal dehydration in phalanges.'
            : add < 260
              ? 'Substantial myofascial mass reduction in biceps, quadriceps, and gastrocnemius compartments.'
              : add < 410
                ? params.airflow > 0.8 || params.humidity < 50
                  ? 'Accelerated convective desiccation of tendons and fascia along wrists, hands, ankles, and distal forearms.'
                  : 'Partial osteological exposure of radius, ulna, and anterior tibial crest with hydrolyzed adipose retention.'
                : 'Appendicular long bones (humerus, radius, ulna, femur, tibia, fibula) structurally defined and stabilized.';
      return {
        score,
        tissueState,
        internalProcess:
          'Higher surface-area-to-volume ratio accelerates convective moisture loss and thermal equilibration relative to the torso.',
        localTemp: `${localTemp}°C`,
        structuralVolumeRatio,
      };
    },
  },
];

export interface ForensicSubjectController {
  rootGroup: THREE.Group;
  interactiveMeshes: THREE.Object3D[];
  update: (options: {
    params: EnvironmentalParams;
    metrics: SimulationMetrics;
    layerMode: StructuralLayerMode;
    showReferencePlanes: boolean;
    showTelemetryNodes: boolean;
    selectedRegionId: AnatomicalRegionId;
    clock: number;
  }) => void;
}

/**
 * Evaluates a single, C2-smooth, anatomically accurate supine human torso surface point and vertex color
 * for any axial coordinate `x` (-0.74m suboccipital neck to +0.165m pelvic perineum) and angle `theta`.
 * Computing positions and finite-difference normals from this single global surface function guarantees
 * 100% seamless position and normal continuity across neck (-0.55m), thorax (-0.23m), and abdomen/pelvis.
 */
function evaluateSculptedTorsoPoint(
  x: number,
  theta: number,
  tableSurfaceY: number
): {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  t: number;
} {
  const t = Math.max(0, Math.min(1, (x - -0.72) / 0.885));
  const gauss = (val: number, center: number, width: number) =>
    Math.exp(-Math.pow((val - center) / width, 2));
  const smoothstep = (edge0: number, edge1: number, val: number) => {
    const k = Math.max(0, Math.min(1, (val - edge0) / (edge1 - edge0)));
    return k * k * (3 - 2 * k);
  };

  // C2-continuous anatomical half-width profile (neck -> trapezius/shoulders -> chest/latissimus -> waist -> iliac crest/hips -> pelvic floor)
  const neckToShoulder = smoothstep(0.09, 0.26, t);
  const shoulderFlare = gauss(t, 0.255, 0.085) * 0.048;
  const chestTaper = smoothstep(0.26, 0.62, t);
  const waistIndent = gauss(t, 0.63, 0.11) * 0.022;
  const iliacFlare = gauss(t, 0.82, 0.105) * 0.028;
  const pelvicEndTaper = smoothstep(0.86, 1.0, t);

  const halfWidth =
    (0.056 +
      neckToShoulder * 0.126 +
      shoulderFlare -
      chestTaper * 0.024 -
      waistIndent +
      iliacFlare) *
    (1 - pelvicEndTaper * 0.16);

  // C2-continuous anteroposterior thickness & cervical lordosis lift
  const chestDepthRise = smoothstep(0.08, 0.28, t);
  const pectoralDepthPeak = gauss(t, 0.35, 0.13) * 0.024;
  const waistDepthTaper = smoothstep(0.38, 0.72, t) * 0.022;
  const pelvicDepthTaper = smoothstep(0.84, 1.0, t) * 0.028;

  const thickness =
    0.112 +
    chestDepthRise * 0.088 +
    pectoralDepthPeak -
    waistDepthTaper -
    pelvicDepthTaper;

  // Natural cervical lordotic arch lifting the neck smoothly into the submental jaw & occipital cranium
  const dorsalLift =
    (1 - smoothstep(0.0, 0.19, t)) * 0.054 +
    gauss(t, 0.64, 0.12) * 0.006; // subtle lumbar lordosis arch

  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const absSin = Math.abs(sinT);

  // Anatomical squarer thoracic/shoulder cross-section vs rounded cervical neck
  const ribcageSquareness =
    smoothstep(0.14, 0.28, t) * (1 - smoothstep(0.82, 0.98, t));
  const lateralExpand =
    1.0 +
    0.11 * ribcageSquareness * Math.pow(absSin, 1.5) * Math.max(0, cosT);

  let z = sinT * halfWidth * lateralExpand;
  let yOffset = 0;

  let vcR = 1.0;
  let vcG = 1.0;
  let vcB = 1.0;

  const midlineGroove = Math.exp(-Math.pow(sinT * 5.6, 2));

  if (cosT >= 0) {
    const antWeight = Math.pow(cosT, 0.65);
    yOffset = (0.48 + 0.52 * Math.pow(cosT, 0.74)) * thickness;

    // 1. Cervical Neck: Sternocleidomastoid V-cords, Laryngeal Thyroid Cartilage & Suprasternal Jugular Notch
    const scmCord =
      gauss(t, 0.085, 0.075) *
      Math.exp(-Math.pow((absSin - (0.14 + t * 1.65)) * 6.5, 2));
    const larynx = gauss(t, 0.062, 0.032) * midlineGroove;
    const jugularNotch = gauss(t, 0.158, 0.026) * midlineGroove;
    yOffset +=
      (scmCord * 0.0072 + larynx * 0.0078 - jugularNotch * 0.0072) * antWeight;
    vcR -= jugularNotch * 0.15;
    vcG -= jugularNotch * 0.19;
    vcB -= jugularNotch * 0.21;

    // 2. Clavicular S-Ridge, Acromion & Supraclavicular Fossa
    const clavLine = 0.175 + absSin * 0.038;
    const clavRidge =
      gauss(t, clavLine, 0.024) *
      smoothstep(0.08, 0.22, absSin) *
      (1 - smoothstep(0.82, 0.98, absSin));
    const supraFossa =
      gauss(t, clavLine - 0.026, 0.022) * gauss(absSin, 0.48, 0.18);
    yOffset += (clavRidge * 0.0095 - supraFossa * 0.0058) * antWeight;
    vcR += clavRidge * 0.035 - supraFossa * 0.1;
    vcG += clavRidge * 0.025 - supraFossa * 0.13;
    vcB += clavRidge * 0.015 - supraFossa * 0.15;

    // 3. Pectoralis Major (Clavicular & Sternocostal Heads), Sternal Cleavage, Subpectoral Fold & Serratus Anterior
    const pecAxial =
      smoothstep(0.19, 0.27, t) * (1 - smoothstep(0.42, 0.5, t));
    const pecTransverse =
      smoothstep(0.06, 0.26, absSin) * (1 - smoothstep(0.72, 0.94, absSin));
    const subPecFold =
      gauss(t, 0.465 - (0.5 - absSin) * 0.025, 0.022) *
      gauss(absSin, 0.48, 0.22);
    const deltopectoralGroove =
      gauss(t, 0.25, 0.055) * gauss(absSin, 0.76, 0.09);

    yOffset +=
      (pecAxial * (0.026 * pecTransverse - 0.013 * midlineGroove) -
        subPecFold * 0.0045 -
        deltopectoralGroove * 0.0055) *
      antWeight;
    vcR -= (midlineGroove * 0.07 + subPecFold * 0.13) * pecAxial;
    vcG -= (midlineGroove * 0.1 + subPecFold * 0.17) * pecAxial;
    vcB -= (midlineGroove * 0.12 + subPecFold * 0.19) * pecAxial;

    // Anatomical Nipple-Areolar Complex at 4th intercostal space (t = 0.395, absSin = 0.50)
    const nipDist = Math.hypot((t - 0.395) * 19, (absSin - 0.5) * 9.0);
    if (nipDist < 1.2) {
      const areola = Math.cos((nipDist / 1.2) * (Math.PI / 2));
      const papilla = nipDist < 0.38 ? Math.cos((nipDist / 0.38) * (Math.PI / 2)) : 0;
      yOffset += (areola * 0.0038 + papilla * 0.0032) * antWeight;
      vcR -= areola * 0.2 + papilla * 0.08;
      vcG -= areola * 0.32 + papilla * 0.12;
      vcB -= areola * 0.36 + papilla * 0.14;
    }

    // Serratus Anterior & External Oblique interdigitations over lateral 5th–9th ribs
    if (absSin > 0.58 && t > 0.34 && t < 0.6) {
      const serratusEnv =
        gauss(t, 0.47, 0.085) * gauss(absSin, 0.76, 0.11);
      const ribDigitation = Math.sin((t - 0.34 - absSin * 0.06) * 115);
      yOffset += serratusEnv * ribDigitation * 0.0028 * antWeight;
    }

    // 4. Thoracic Costal Arch, Rectus Abdominis (Linea Alba, Semilunaris, Tendinous Intersections) & External Obliques
    const costalMarginLine = 0.48 + absSin * 0.11;
    const costalArch =
      gauss(t, costalMarginLine, 0.028) * gauss(absSin, 0.38, 0.22);
    const absAxial =
      smoothstep(0.44, 0.52, t) * (1 - smoothstep(0.76, 0.88, t));
    const rectusBelly = gauss(absSin, 0.21, 0.115);
    const semilunaris = gauss(absSin, 0.44, 0.075);
    const tendinousWave =
      1 -
      0.28 *
        (gauss(t, 0.535, 0.014) +
          gauss(t, 0.61, 0.014) +
          gauss(t, 0.685, 0.015));

    yOffset +=
      (costalArch * 0.0062 +
        absAxial *
          (rectusBelly * 0.0082 * tendinousWave -
            midlineGroove * 0.0072 -
            semilunaris * 0.0046)) *
      antWeight;
    vcR -= (midlineGroove * 0.065 + semilunaris * 0.055) * absAxial;
    vcG -= (midlineGroove * 0.085 + semilunaris * 0.075) * absAxial;
    vcB -= (midlineGroove * 0.1 + semilunaris * 0.085) * absAxial;

    // Sculpted Anatomical Umbilicus (Navel pit with superior hood) at t = 0.695
    const umbDist = Math.hypot((t - 0.695) * 15.5, sinT * 10.5);
    if (umbDist < 1.0) {
      const umbDepth = Math.cos(umbDist * (Math.PI / 2));
      const umbRim = Math.sin(umbDist * Math.PI) * (t < 0.695 ? 1.25 : 0.65);
      yOffset += (umbRim * 0.0022 - umbDepth * 0.0155) * antWeight;
      vcR -= umbDepth * 0.34;
      vcG -= umbDepth * 0.42;
      vcB -= umbDepth * 0.46;
    }

    // 5. Iliac Crest, ASIS, Poupart's Inguinal Ligament Furrow, Pubic Symphysis & Perineal Division
    const asisProminence =
      gauss(t, 0.805, 0.042) * gauss(absSin, 0.66, 0.12);
    const inguinalCrease =
      gauss(t, 0.8 + (1 - absSin) * 0.145, 0.025) *
      smoothstep(0.08, 0.72, absSin);
    const pubicMound =
      gauss(t, 0.905, 0.055) * Math.exp(-Math.pow(sinT * 3.6, 2));

    yOffset +=
      (asisProminence * 0.0095 -
        inguinalCrease * 0.0072 +
        pubicMound * 0.0105) *
      antWeight;
    vcR -= inguinalCrease * 0.11;
    vcG -= inguinalCrease * 0.14;
    vcB -= inguinalCrease * 0.16;

    // Smooth median perineal division at caudal pelvis so left and right thighs emerge organically
    if (t > 0.88) {
      const cleft = smoothstep(0.88, 1.0, t) * midlineGroove;
      yOffset -= cleft * 0.022;
      vcR -= cleft * 0.22;
      vcG -= cleft * 0.25;
      vcB -= cleft * 0.27;
    }
  } else {
    // Dorsal Surface: Trapezius, Scapular Blades, Median Spinous Furrow, Erector Spinae & Gluteal Cheeks
    const flatFactor = Math.pow(-cosT, 0.54);
    yOffset = (0.48 - 0.43 * flatFactor) * thickness;

    // Dorsal median vertebral furrow & paraspinal erector spinae fullness
    const spinalFurrow = midlineGroove * Math.abs(cosT) * 0.0055;
    const glutealCheek =
      gauss(t, 0.89, 0.085) * gauss(absSin, 0.44, 0.22) * Math.abs(cosT);
    const interglutealCleft =
      smoothstep(0.82, 0.98, t) * midlineGroove * Math.abs(cosT);

    yOffset -= spinalFurrow + interglutealCleft * 0.014;
    z += Math.sign(sinT) * glutealCheek * 0.011;

    vcR -= flatFactor * 0.075 + interglutealCleft * 0.18;
    vcG -= flatFactor * 0.13 + interglutealCleft * 0.22;
    vcB -= flatFactor * 0.11 + interglutealCleft * 0.24;
  }

  const y = tableSurfaceY + dorsalLift + Math.max(0.004, yOffset);
  return {
    x,
    y,
    z,
    r: Math.max(0.26, Math.min(1.1, vcR)),
    g: Math.max(0.22, Math.min(1.08, vcG)),
    b: Math.max(0.2, Math.min(1.06, vcB)),
    t,
  };
}

/**
 * Procedurally generates a continuous, anatomically sculpted supine human torso section
 * with exact C2-continuous position and analytical normal continuity across cervical neck (-0.72),
 * thorax (-0.55 to -0.23), and abdomen/pelvis (-0.23 to +0.165).
 */
function createSculptedTorsoSectionGeometry(
  xStart: number,
  xEnd: number,
  slices: number,
  radialSegments: number,
  tableSurfaceY: number,
  _closeStartCap = false,
  _closeEndCap = false
): {
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
} {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dx = 0.0025;
  const dTheta = 0.015;

  for (let i = 0; i <= slices; i++) {
    const u = i / slices;
    const x = xStart + u * (xEnd - xStart);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2; // 0 = anterior top, PI = dorsal bottom on table

      const pt = evaluateSculptedTorsoPoint(x, theta, tableSurfaceY);
      vertices.push(pt.x, pt.y, pt.z);
      colors.push(pt.r, pt.g, pt.b);
      uvs.push(pt.t, v);

      // Compute exact surface normal from the global C2 surface function so boundary rings
      // at x = -0.55 and x = -0.23 have 100% identical normals with zero seam banding
      const pXNext = evaluateSculptedTorsoPoint(x + dx, theta, tableSurfaceY);
      const pXPrev = evaluateSculptedTorsoPoint(x - dx, theta, tableSurfaceY);
      const pTNext = evaluateSculptedTorsoPoint(
        x,
        theta + dTheta,
        tableSurfaceY
      );
      const pTPrev = evaluateSculptedTorsoPoint(
        x,
        theta - dTheta,
        tableSurfaceY
      );

      const txX = pXNext.x - pXPrev.x;
      const txY = pXNext.y - pXPrev.y;
      const txZ = pXNext.z - pXPrev.z;

      const ttX = pTNext.x - pTPrev.x;
      const ttY = pTNext.y - pTPrev.y;
      const ttZ = pTNext.z - pTPrev.z;

      // Outward normal = T_theta x T_x
      const nx = ttY * txZ - ttZ * txY;
      const ny = ttZ * txX - ttX * txZ;
      const nz = ttX * txY - ttY * txX;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / nLen, ny / nLen, nz / nLen);
    }
  }

  const ringSize = radialSegments + 1;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ringSize + j;
      const b = (i + 1) * ringSize + j;
      const c = (i + 1) * ringSize + (j + 1);
      const d = i * ringSize + (j + 1);
      // Counter-clockwise outward-facing winding (T_theta x T_x points outward)
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  const posArray = new Float32Array(vertices);
  geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(normals), 3)
  );
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array(uvs), 2)
  );
  geometry.setIndex(indices);

  return {
    geometry,
    basePositions: new Float32Array(posArray),
  };
}

/**
 * Procedurally sculpts a high-resolution, anatomically accurate 3D human head, facial planes,
 * closed eyelids, nose, lips, jawline, ears, and seamless submental-cervical neck transition.
 */
function createSculptedHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.104, 84, 80);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  const gauss = (val: number, center: number, width: number) =>
    Math.exp(-Math.pow((val - center) / width, 2));
  const smoothstep = (edge0: number, edge1: number, val: number) => {
    const k = Math.max(0, Math.min(1, (val - edge0) / (edge1 - edge0)));
    return k * k * (3 - 2 * k);
  };

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i); // Cranial crown (-x) to Caudal chin/neck (+x)
    let y = pos.getY(i); // Dorsal occiput (-y) to Anterior face (+y)
    let z = pos.getZ(i); // Left (-z) to Right (+z)

    const r = Math.hypot(x, y, z) || 1;
    const nx = x / r;
    const ny = y / r;
    const nz = z / r;
    const absNz = Math.abs(nz);

    let vcR = 1.0;
    let vcG = 1.0;
    let vcB = 1.0;

    // 1. Anthropometric Cranial-Facial Proportions (Dolichocephalic/Mesocephalic Neurocranium + Facial Taper)
    x *= 1.26;
    y *= 0.98;
    z *= 0.84;

    // Parietal eminence fullness on posterior-superior cranium & Temporal Fossa flattening
    const parietal = gauss(nx, -0.34, 0.28) * gauss(absNz, 0.72, 0.22);
    z += Math.sign(nz) * parietal * 0.0055;

    if (nx > -0.34 && nx < 0.06 && absNz > 0.56 && ny > -0.08) {
      const templeIndent =
        gauss(nx, -0.15, 0.16) * gauss(absNz, 0.78, 0.18);
      z -= Math.sign(nz) * templeIndent * 0.0065;
      vcR -= templeIndent * 0.045;
      vcG -= templeIndent * 0.06;
      vcB -= templeIndent * 0.07;
    }

    // Bilateral Sculpted Human Auricles (Ears: Helix Rim, Antihelix, Concha Bowl & Tragus)
    if (nx > -0.08 && nx < 0.34 && absNz > 0.8 && ny > -0.26 && ny < 0.2) {
      const earDist = Math.hypot((nx - 0.11) * 6.0, (ny - -0.03) * 5.0);
      if (earDist < 1.15) {
        const helixRim = Math.exp(-Math.pow((earDist - 0.82) * 5.5, 2));
        const antihelix = Math.exp(-Math.pow((earDist - 0.48) * 6.5, 2));
        const conchaHollow = Math.exp(-Math.pow(earDist * 2.2, 2));
        const earOut =
          (helixRim * 0.011 + antihelix * 0.0045 - conchaHollow * 0.0045) *
          Math.pow(absNz, 2);
        z += Math.sign(nz) * Math.max(-0.002, earOut);
        vcR += helixRim * 0.04 - conchaHollow * 0.14;
        vcG -= conchaHollow * 0.18;
        vcB -= conchaHollow * 0.2;
      }
    }

    // Smooth Mandibular Ramus, Gonial Angle & Lower Facial Taper toward the Chin
    if (nx > 0.0) {
      const jawTaper = 1 - smoothstep(0.0, 0.96, nx) * 0.42;
      z *= jawTaper;
      const gonialCorner =
        gauss(nx, 0.34, 0.14) *
        gauss(ny, 0.05, 0.18) *
        gauss(absNz, 0.66, 0.18);
      z += Math.sign(nz) * gonialCorner * 0.0062;
    }

    // Seamless Submental & Cervical Neck Transition bridging into neckLoft at x = -0.72..0.64
    if (nx > 0.32 && ny < 0.46) {
      const neckBlend =
        smoothstep(0.32, 0.95, nx) * smoothstep(0.46, -0.25, ny);
      x += neckBlend * 0.058;
      y -= neckBlend * 0.018;
      z *= 1 - neckBlend * 0.14;
      vcR -= neckBlend * 0.08;
      vcG -= neckBlend * 0.11;
      vcB -= neckBlend * 0.12;
    }

    // 2. High-Precision Anterior Facial Anatomy (+Y Hemisphere)
    if (ny > 0.06) {
      const faceWeight = smoothstep(0.06, 0.22, ny);

      // Frontal Eminence & Forehead Plane
      const forehead = gauss(nx, -0.36, 0.22) * gauss(nz, 0, 0.48);
      y += forehead * 0.0072 * faceWeight;

      // Supraorbital Brow Arch & Glabella
      const glabellaDip = 1 - 0.24 * gauss(nz, 0, 0.075);
      const browRidge =
        gauss(nx, -0.135, 0.11) * gauss(nz, 0, 0.46) * glabellaDip;
      y += browRidge * 0.0115 * faceWeight;

      // Subtle Eyebrow Arch Relief & Soft Anatomical Shading
      const browArchX = -0.13 - Math.pow(absNz - 0.28, 2) * 0.32;
      const browArch =
        gauss(nx, browArchX, 0.036) *
        gauss(absNz, 0.31, 0.14) *
        smoothstep(0.09, 0.15, absNz);
      y += browArch * 0.0024 * faceWeight;
      vcR *= 1 - browArch * 0.38;
      vcG *= 1 - browArch * 0.42;
      vcB *= 1 - browArch * 0.45;

      // Bilateral Orbital Cavities, Convex Closed Eyelids (Superior & Inferior Palpebrae) & Palpebral Fissure
      const leftEyeDist = Math.hypot((nx - -0.008) * 6.2, (nz - -0.315) * 5.0);
      const rightEyeDist = Math.hypot((nx - -0.008) * 6.2, (nz - 0.315) * 5.0);
      const eyeSocket =
        Math.exp(-leftEyeDist * leftEyeDist) +
        Math.exp(-rightEyeDist * rightEyeDist);
      const eyeballGlobe =
        Math.exp(-Math.pow(leftEyeDist * 1.55, 2)) +
        Math.exp(-Math.pow(rightEyeDist * 1.55, 2));
      const eyeHoriz =
        gauss(nz, -0.315, 0.125) + gauss(nz, 0.315, 0.125);
      const supraTarsalFold = gauss(nx, -0.052, 0.024) * eyeHoriz;
      const upperEyelid = gauss(nx, -0.022, 0.022) * eyeHoriz;
      const lowerEyelid = gauss(nx, 0.022, 0.02) * eyeHoriz;
      const palpebralSlit = gauss(nx, 0.002, 0.018) * eyeHoriz;

      y +=
        (-eyeSocket * 0.0108 +
          eyeballGlobe * 0.0062 +
          (upperEyelid + lowerEyelid * 0.6) * 0.0018 -
          palpebralSlit * 0.0024 -
          supraTarsalFold * 0.0015) *
        faceWeight;

      vcR -=
        (eyeSocket * 0.06 + palpebralSlit * 0.38 + supraTarsalFold * 0.16) *
        faceWeight;
      vcG -=
        (eyeSocket * 0.11 + palpebralSlit * 0.44 + supraTarsalFold * 0.21) *
        faceWeight;
      vcB -=
        (eyeSocket * 0.12 + palpebralSlit * 0.46 + supraTarsalFold * 0.23) *
        faceWeight;

      // Sculpted Nasal Bridge (Dorsum Nasi), Nasal Tip (Apex), Columella & Alar Nostrils
      if (nx > -0.11 && nx < 0.39) {
        const noseLen = (nx - -0.1) / 0.47;
        const noseClamped = Math.max(0, Math.min(1, noseLen));
        const nasionIndent = gauss(nx, -0.075, 0.045) * gauss(nz, 0, 0.12);
        const noseProfile =
          Math.sin(noseClamped * Math.PI) * (0.45 + 0.62 * noseClamped);
        const noseWidth = Math.exp(
          -Math.pow(nz / (0.088 + noseClamped * 0.058), 2)
        );
        const nasalTip = gauss(nx, 0.255, 0.055) * gauss(nz, 0, 0.075);

        y +=
          (noseProfile * noseWidth * 0.0265 +
            nasalTip * 0.0042 -
            nasionIndent * 0.0035) *
          faceWeight;

        // Bilateral Alar Lobules, Nasolabial Alar Sulcus & Recessed Nares (Nostrils)
        const alarWing =
          gauss(nx, 0.27, 0.065) * gauss(absNz, 0.115, 0.055);
        const alarGroove =
          gauss(nx, 0.255, 0.055) * gauss(absNz, 0.165, 0.035);
        const nostrilCavity =
          gauss(nx, 0.308, 0.038) * gauss(absNz, 0.072, 0.038);

        y +=
          (alarWing * 0.0085 -
            alarGroove * 0.0025 -
            nostrilCavity * 0.0055) *
          faceWeight;
        vcR += alarWing * 0.035 - nostrilCavity * 0.52;
        vcG -= nostrilCavity * 0.58 + alarGroove * 0.08;
        vcB -= nostrilCavity * 0.6 + alarGroove * 0.09;
      }

      // Zygomatic Arch & Malar Cheekbone Fullness + Subtle Infraorbital / Buccal Plane
      const cheekBone =
        gauss(nx, 0.095, 0.21) * gauss(absNz, 0.47, 0.22);
      const buccalHollow =
        gauss(nx, 0.36, 0.16) * gauss(absNz, 0.46, 0.16);
      y += (cheekBone * 0.0105 - buccalHollow * 0.0032) * faceWeight;
      z +=
        Math.sign(nz) *
        (cheekBone * 0.0088 - buccalHollow * 0.0025) *
        faceWeight;
      vcR += cheekBone * 0.035;
      vcG -= cheekBone * 0.025 + buccalHollow * 0.04;
      vcB -= cheekBone * 0.035 + buccalHollow * 0.05;

      // Philtrum Columns, Philtrum Dimple & Nasolabial Fold
      const philtrumGroove =
        gauss(nx, 0.385, 0.055) * gauss(nz, 0, 0.048);
      const philtrumRidge =
        gauss(nx, 0.385, 0.055) * gauss(absNz, 0.055, 0.025);
      const nasolabial =
        gauss(nx, 0.28 + absNz * 0.38, 0.055) *
        gauss(absNz, 0.27, 0.12);
      y +=
        (philtrumRidge * 0.0018 -
          philtrumGroove * 0.0026 -
          nasolabial * 0.0024) *
        faceWeight;
      vcR -= (philtrumGroove * 0.06 + nasolabial * 0.08) * faceWeight;
      vcG -= (philtrumGroove * 0.09 + nasolabial * 0.12) * faceWeight;
      vcB -= (philtrumGroove * 0.1 + nasolabial * 0.13) * faceWeight;

      // Sculpted Upper & Lower Vermilion Lips, Cupid's Bow & Oral Commissure
      const mouthWidth = gauss(nz, 0, 0.26);
      const cupidsBow = 1 - 0.22 * gauss(nz, 0, 0.052);
      const upperLip = gauss(nx, 0.445, 0.055) * mouthWidth * cupidsBow;
      const lowerLip =
        gauss(nx, 0.548, 0.062) * gauss(nz, 0, 0.235);
      const lipPart = gauss(nx, 0.495, 0.026) * mouthWidth;
      const commissure =
        gauss(nx, 0.498, 0.04) * gauss(absNz, 0.24, 0.045);

      y +=
        (upperLip * 0.0098 +
          lowerLip * 0.0096 -
          lipPart * 0.0058 -
          commissure * 0.0032) *
        faceWeight;

      const vermilionWeight = Math.min(1, (upperLip + lowerLip) * 1.1);
      vcR *= 1 - vermilionWeight * 0.11 - lipPart * 0.36 - commissure * 0.22;
      vcG *= 1 - vermilionWeight * 0.32 - lipPart * 0.44 - commissure * 0.28;
      vcB *= 1 - vermilionWeight * 0.3 - lipPart * 0.46 - commissure * 0.3;

      // Labiomental Sulcus & Mental Protuberance (Chin)
      const chinSulcus = gauss(nx, 0.625, 0.065) * gauss(nz, 0, 0.22);
      const chinDome = gauss(nx, 0.745, 0.16) * gauss(nz, 0, 0.28);
      y += (chinDome * 0.0135 - chinSulcus * 0.004) * faceWeight;
      x += chinDome * 0.0092 * faceWeight;
      vcR -= chinSulcus * 0.08 * faceWeight;
      vcG -= chinSulcus * 0.11 * faceWeight;
      vcB -= chinSulcus * 0.12 * faceWeight;
    } else if (ny < -0.35) {
      // Occipital base resting on cervical headrest
      y *= 0.93;
      vcR *= 0.9;
      vcG *= 0.86;
      vcB *= 0.86;
    }

    pos.setXYZ(i, x, y, z);
    colors[i * 3] = Math.max(0.18, Math.min(1.08, vcR));
    colors[i * 3 + 1] = Math.max(0.15, Math.min(1.06, vcG));
    colors[i * 3 + 2] = Math.max(0.14, Math.min(1.04, vcB));
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally generates a SINGLE, CONTINUOUS, C2-smooth 3D human upper extremity mesh
 * rooted deeply into the pectoral/axillary shoulder girdle (-0.525m) flowing through
 * deltoid -> biceps/triceps brachii -> medial/lateral epicondyles & cubital fossa
 * -> brachioradialis/pronator forearm -> carpal wrist -> anatomical metacarpal hand palm with 4 MCP knuckles.
 */
function createContinuousArmGeometry(
  side: number,
  tableSurfaceY: number
): THREE.BufferGeometry {
  const slices = 64;
  const radSegs = 32;
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const xStart = -0.525;
  const xEnd = 0.112;

  const gauss = (val: number, center: number, width: number) =>
    Math.exp(-Math.pow((val - center) / width, 2));
  const smoothstep = (edge0: number, edge1: number, val: number) => {
    const k = Math.max(0, Math.min(1, (val - edge0) / (edge1 - edge0)));
    return k * k * (3 - 2 * k);
  };

  for (let i = 0; i <= slices; i++) {
    const u = i / slices;
    const x = xStart + u * (xEnd - xStart);

    // Smooth C2 centerline trajectory from shoulder girdle (u=0) -> elbow (u=0.48) -> wrist (u=0.87) -> palm (u=1)
    const shoulderOut = smoothstep(0.0, 0.22, u);
    const forearmOut = smoothstep(0.22, 0.88, u);
    const centerZ =
      side * (0.164 + shoulderOut * 0.064 + forearmOut * 0.032);

    const shoulderDrop = smoothstep(0.0, 0.24, u);
    const forearmDrop = smoothstep(0.24, 0.88, u);
    const centerY =
      tableSurfaceY + 0.114 - shoulderDrop * 0.044 - forearmDrop * 0.038;

    // Smooth anatomical muscle belly radii along the upper extremity
    const deltoidBell = gauss(u, 0.095, 0.085);
    const bicepsBell = gauss(u, 0.31, 0.11);
    const elbowJoint = gauss(u, 0.48, 0.055);
    const brachioradialisBell = gauss(u, 0.61, 0.095);
    const wristNarrow = gauss(u, 0.865, 0.045);
    const handPalm = smoothstep(0.86, 0.94, u);
    const distalHandSeal = 1 - Math.pow(smoothstep(0.95, 1.0, u), 2.2) * 0.22;

    const baseRadiusY =
      0.058 * (1 - smoothstep(0.0, 0.48, u)) +
      0.041 * smoothstep(0.0, 0.48, u) * (1 - smoothstep(0.48, 0.87, u)) +
      0.019 * smoothstep(0.48, 0.87, u);

    const baseRadiusZ =
      0.06 * (1 - smoothstep(0.0, 0.48, u)) +
      0.044 * smoothstep(0.0, 0.48, u) * (1 - smoothstep(0.48, 0.87, u)) +
      0.029 * smoothstep(0.48, 0.87, u);

    const rx =
      (baseRadiusY +
        deltoidBell * 0.0085 +
        bicepsBell * 0.0065 -
        elbowJoint * 0.003 +
        brachioradialisBell * 0.0065 -
        wristNarrow * 0.0035 -
        handPalm * 0.0025) *
      distalHandSeal;

    const rz =
      (baseRadiusZ +
        deltoidBell * 0.0105 +
        bicepsBell * 0.0045 +
        elbowJoint * 0.0045 +
        brachioradialisBell * 0.0082 -
        wristNarrow * 0.0025 +
        handPalm * 0.0105) *
      distalHandSeal;

    for (let j = 0; j <= radSegs; j++) {
      const v = j / radSegs;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let dy = cosT * rx;
      let dz = sinT * rz;

      let vcR = 1.0;
      let vcG = 1.0;
      let vcB = 1.0;

      // Bicipital medial/lateral groove & anterior biceps peak (u = 0.20..0.44)
      if (u > 0.18 && u < 0.45 && cosT > 0.2) {
        const bic = gauss(u, 0.31, 0.09) * Math.pow(cosT, 2);
        dy += bic * 0.0035;
      }

      // Cubital fossa anterior hollow & vascular warmth at elbow (u ~ 0.48)
      if (cosT > 0.35 && u > 0.42 && u < 0.54) {
        const cubital = gauss(u, 0.48, 0.042) * cosT;
        dy -= cubital * 0.0038;
        vcR -= cubital * 0.06;
        vcG -= cubital * 0.1;
        vcB -= cubital * 0.11;
      }

      // Axillary medial shoulder shadow (u < 0.22, medial side facing ribcage)
      if (u < 0.24 && sinT * side < -0.25) {
        const axilla = (1 - u / 0.24) * Math.abs(sinT);
        vcR -= axilla * 0.12;
        vcG -= axilla * 0.16;
        vcB -= axilla * 0.18;
      }

      // Anatomical Metacarpal Hand: Thenar thumb eminence, Dorsal extensor tendons & 4 MCP Knuckle Domes (u > 0.87)
      if (u > 0.87) {
        const handFactor = smoothstep(0.87, 0.93, u);
        // Radial Thenar eminence swelling on thumb side (sinT * side < -0.3)
        if (sinT * side < -0.25 && u < 0.96) {
          const thenar =
            gauss(u, 0.915, 0.032) * Math.abs(sinT) * (1 - Math.max(0, cosT) * 0.4);
          dz -= side * thenar * 0.0075;
          dy += thenar * 0.0025;
        }
        // Dorsal extensor tendon ridges & 4 MCP knuckle prominences
        if (cosT > 0.25) {
          const knuckleWave = Math.cos(sinT * 11) * 0.0016 * cosT * handFactor;
          dy += knuckleWave;
          vcR += 0.025 * handFactor;
        }
      }

      if (cosT < 0) {
        dy *= 0.82;
        vcR -= Math.abs(cosT) * 0.075;
        vcG -= Math.abs(cosT) * 0.115;
        vcB -= Math.abs(cosT) * 0.105;
      }

      const y = Math.max(tableSurfaceY + 0.004, centerY + dy);
      const z = centerZ + dz;

      verts.push(x, y, z);
      colors.push(
        Math.max(0.3, Math.min(1.1, vcR)),
        Math.max(0.25, Math.min(1.08, vcG)),
        Math.max(0.22, Math.min(1.06, vcB))
      );
      uvs.push(u, v);
    }
  }

  const ring = radSegs + 1;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radSegs; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      const c = (i + 1) * ring + (j + 1);
      const d = i * ring + (j + 1);
      // Outward-facing CCW winding
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(verts), 3)
  );
  geo.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally generates a SINGLE, CONTINUOUS, C2-smooth 3D human lower extremity & anatomical foot mesh
 * rooted seamlessly into the pelvic hip/inguinal girdle (x = +0.020) with sculpted quadriceps
 * (rectus femoris, vastus lateralis, teardrop vastus medialis), patellar knee & popliteal fossa,
 * sharp anterior tibial crest, gastrocnemius/soleus calf, bimalleolar ankle, calcaneus heel resting on table,
 * medial plantar arch, and high dorsal instep rising to the metatarsal ball of the foot.
 */
function createContinuousLegGeometry(
  side: number,
  tableSurfaceY: number
): THREE.BufferGeometry {
  const slices = 76;
  const radSegs = 36;
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const xStart = 0.02;
  const xEnd = 0.882;

  const gauss = (val: number, center: number, width: number) =>
    Math.exp(-Math.pow((val - center) / width, 2));
  const smoothstep = (edge0: number, edge1: number, val: number) => {
    const k = Math.max(0, Math.min(1, (val - edge0) / (edge1 - edge0)));
    return k * k * (3 - 2 * k);
  };

  for (let i = 0; i <= slices; i++) {
    const u = i / slices;
    const x = xStart + u * (xEnd - xStart);

    // Smooth C2 trajectory from Hip (u=0) -> Knee (u=0.51) -> Ankle (u=0.91) -> Metatarsal Foot (u=1.0)
    const thighToKnee = smoothstep(0.0, 0.51, u);
    const kneeToAnkle = smoothstep(0.51, 0.91, u);
    const footProgress = smoothstep(0.9, 1.0, u);

    const centerZ =
      side *
      (0.088 +
        thighToKnee * 0.01 +
        kneeToAnkle * 0.002 +
        footProgress * 0.006);

    const quadBell = gauss(u, 0.23, 0.14);
    const patellaPeak = gauss(u, 0.51, 0.042);
    const calfBell = gauss(u, 0.68, 0.115);
    const ankleNarrow = gauss(u, 0.895, 0.032);
    const malleolusFlare = gauss(u, 0.915, 0.018);
    const footInstepArch = gauss(u, 0.96, 0.032);
    const distalFootSeal = 1 - Math.pow(smoothstep(0.965, 1.0, u), 2.2) * 0.24;

    const centerY =
      tableSurfaceY +
      0.088 -
      thighToKnee * 0.018 -
      kneeToAnkle * 0.02 +
      patellaPeak * 0.005 +
      footProgress * 0.034 +
      footInstepArch * 0.012;

    const baseRy =
      0.09 * (1 - thighToKnee) +
      0.055 * thighToKnee * (1 - kneeToAnkle) +
      0.036 * kneeToAnkle;

    const baseRz =
      0.091 * (1 - thighToKnee) +
      0.056 * thighToKnee * (1 - kneeToAnkle) +
      0.035 * kneeToAnkle;

    const ry =
      (baseRy +
        quadBell * 0.0095 +
        patellaPeak * 0.0045 +
        calfBell * 0.0115 -
        ankleNarrow * 0.0045 +
        footProgress * 0.032 +
        footInstepArch * 0.008) *
      distalFootSeal;

    const rz =
      (baseRz +
        quadBell * 0.0085 +
        patellaPeak * 0.003 +
        calfBell * 0.013 -
        ankleNarrow * 0.004 +
        malleolusFlare * 0.0075 +
        footProgress * 0.0085) *
      distalFootSeal;

    for (let j = 0; j <= radSegs; j++) {
      const v = j / radSegs;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let dy = cosT * ry;
      let dz = sinT * rz;

      let vcR = 1.0;
      let vcG = 1.0;
      let vcB = 1.0;

      // Vastus Medialis Obliquus ("teardrop" medial quad muscle just above knee, u = 0.34..0.48)
      if (cosT > 0.15 && u > 0.32 && u < 0.49 && sinT * side < -0.18) {
        const vmo = gauss(u, 0.41, 0.055) * Math.abs(sinT);
        dy += vmo * 0.005;
        dz -= side * vmo * 0.0055;
      }

      // Vastus Lateralis lateral thigh sweep (u = 0.15..0.44)
      if (u > 0.12 && u < 0.45 && sinT * side > 0.25) {
        const vl = gauss(u, 0.28, 0.11) * Math.abs(sinT);
        dz += side * vl * 0.0045;
      }

      // Patellar kneecap dome & peripatellar hollows (u ~ 0.51)
      if (u >= 0.45 && u < 0.57 && cosT > 0.25) {
        const pat = gauss(u, 0.51, 0.035) * Math.pow(cosT, 2);
        dy += pat * 0.0038;
        vcR += pat * 0.03;
        vcG -= pat * 0.02;
      }

      // Sharp Anterior Tibial Crest (shin bone ridge) on anterior lower leg (u = 0.54..0.88)
      if (cosT > 0.48 && u >= 0.53 && u < 0.89) {
        const crestSharpness =
          Math.pow(cosT, 4) *
          smoothstep(0.53, 0.58, u) *
          (1 - smoothstep(0.84, 0.89, u));
        dy += crestSharpness * 0.0058;
        vcR += crestSharpness * 0.028;
      }

      // Anatomical Foot Sculpture: Calcaneus Heel, Dorsal Instep, Medial Plantar Arch & Metatarsal Ball (u >= 0.90)
      if (u >= 0.9) {
        const sFoot = (u - 0.9) / 0.1;
        if (cosT > 0) {
          // High dorsal instep tapering smoothly toward metatarsal ball
          dy *= 1.18 - sFoot * 0.14;
          // Slight natural outward progression of the dorsal foot & big-toe medial prominence
          dz += side * cosT * (0.005 - sinT * side * 0.003);
        } else {
          // Rounded Calcaneus Heel at u = 0.91..0.95 & Medial Longitudinal Plantar Arch hollow at u = 0.95..0.98
          const heelPad = gauss(u, 0.925, 0.022);
          const plantarArch =
            gauss(u, 0.965, 0.02) * (sinT * side < 0 ? 1.3 : 0.6);
          dy *= 0.96 + heelPad * 0.12 - plantarArch * 0.18 - sFoot * 0.18;
        }
        vcR += 0.02;
        vcG -= 0.025;
      } else if (cosT < 0) {
        dy *= 0.84;
        vcR -= Math.abs(cosT) * 0.075;
        vcG -= Math.abs(cosT) * 0.115;
        vcB -= Math.abs(cosT) * 0.105;
      }

      const y = Math.max(tableSurfaceY + 0.004, centerY + dy);
      const z = centerZ + dz;

      verts.push(x, y, z);
      colors.push(
        Math.max(0.3, Math.min(1.1, vcR)),
        Math.max(0.25, Math.min(1.08, vcG)),
        Math.max(0.22, Math.min(1.06, vcB))
      );
      uvs.push(u, v);
    }
  }

  const ring = radSegs + 1;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radSegs; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      const c = (i + 1) * ring + (j + 1);
      const d = i * ring + (j + 1);
      // Outward-facing CCW winding
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(verts), 3)
  );
  geo.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally sculpts an articulated 3-phalangeal human finger, thumb, or toe using a closed
 * hemispherical-tipped capsule with PIP/DIP knuckle swellings, interphalangeal skin creases,
 * and natural distal fingertip pad rounding (no flat cylinder end-caps).
 */
function createSculptedFingerGeometry(
  length: number,
  baseRadius: number
): THREE.BufferGeometry {
  const cylLen = Math.max(0.004, length - baseRadius * 1.6);
  const geo = new THREE.CapsuleGeometry(baseRadius * 0.86, cylLen, 10, 18);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const halfLen = length / 2;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const u = Math.max(0, Math.min(1, (y + halfLen) / length)); // 0 = proximal base, 1 = distal rounded tip
    const proxFlare = Math.exp(-Math.pow(u * 6.5, 2)) * 0.16;
    const pipJoint = Math.exp(-Math.pow((u - 0.42) * 12, 2));
    const dipJoint = Math.exp(-Math.pow((u - 0.72) * 14, 2));
    const distalTaper = 1 - u * 0.22;

    const jointScale =
      (distalTaper + proxFlare + pipJoint * 0.11 + dipJoint * 0.075);
    x *= jointScale;
    z *= jointScale * 0.94;
    // Slight natural resting flexion curve
    x -= Math.sin(u * Math.PI) * 0.002;

    const creaseShade = (pipJoint + dipJoint) * 0.11;
    colors[i * 3] = 1.0 - creaseShade * 0.65;
    colors[i * 3 + 1] = 0.96 - creaseShade * 0.95;
    colors[i * 3 + 2] = 0.94 - creaseShade;

    pos.setXYZ(i, x, y, z);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally generates a tailored clinical forensic examination brief wrapping the pelvic girdle
 * (-0.03m to +0.162m) with realistic waistband seam and fabric tension folds.
 */
function createClinicalBriefGeometry(tableSurfaceY: number): THREE.BufferGeometry {
  const loft = createSculptedTorsoSectionGeometry(
    -0.032,
    0.162,
    18,
    40,
    tableSurfaceY,
    false,
    true
  );
  const geo = loft.geometry;
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const u = (x - -0.032) / 0.194;
    const waistband = Math.exp(-Math.pow(u * 14, 2)) * 0.0022;
    const fabricFold = Math.sin(u * Math.PI * 5) * 0.0008;
    const offset = 0.0032 + waistband + fabricFold;

    const centerY = tableSurfaceY + 0.085;
    const dy = y - centerY;
    y += Math.sign(dy || 1) * offset;
    z += Math.sign(z || 1) * offset * 1.1;

    pos.setXYZ(i, x, Math.max(tableSurfaceY + 0.004, y), z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally sculpts an anatomical 3D Human Skull (Cranium + Facial Skeleton) with
 * vertex-colored cranial sutures (coronal, sagittal, lambdoid), mastoid process,
 * superciliary brow arches, deep orbital cavities, piriform nasal aperture, and zygomatic bones.
 */
function createSculptedSkullGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.092, 58, 54);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i); // Cranial crown (-x) to Maxillary alveolar arch (+x)
    let y = pos.getY(i); // Occipital back (-y) to Facial anterior (+y)
    let z = pos.getZ(i); // Left (-z) to Right (+z)

    const r = Math.hypot(x, y, z) || 1;
    const nx = x / r;
    const ny = y / r;
    const nz = z / r;
    const absNz = Math.abs(nz);

    let vcR = 1.0;
    let vcG = 0.99;
    let vcB = 0.96;

    // Cranial vault elongation & parietal breadth
    x *= 1.24;
    y *= 0.96;
    z *= 0.84;

    // Coronal, Sagittal & Lambdoid Cranial Suture Lines (serrated micro-groove + osteological shading)
    const coronalSuture =
      ny > -0.2
        ? Math.exp(
            -Math.pow((nx - (-0.26 + Math.sin(nz * 38) * 0.015)) * 45, 2)
          )
        : 0;
    const sagittalSuture =
      nx < -0.26 && nx > -0.82 && ny > -0.3
        ? Math.exp(-Math.pow((nz - Math.sin(nx * 42) * 0.012) * 48, 2))
        : 0;
    const sutureShade = Math.max(coronalSuture, sagittalSuture);
    if (sutureShade > 0.1) {
      y -= sutureShade * 0.0012;
      vcR -= sutureShade * 0.24;
      vcG -= sutureShade * 0.28;
      vcB -= sutureShade * 0.32;
    }

    // Parietal eminences (posterior-lateral cranial vault fullness)
    if (nx < -0.1 && ny < 0.3) {
      const parietal =
        Math.exp(-Math.pow((nx - -0.35) * 3.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.72) * 3.5, 2));
      z += Math.sign(nz) * parietal * 0.0085;
    }

    // Deep Temporal Fossa behind zygomatic arch & Mastoid Process behind ear canal
    if (nx > -0.25 && nx < 0.25 && absNz > 0.55) {
      const tempFossa =
        Math.exp(-Math.pow((nx - 0.0) * 4.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.8) * 4.5, 2));
      z -= Math.sign(nz) * tempFossa * 0.0125;
      vcR -= tempFossa * 0.14;
      vcG -= tempFossa * 0.16;
      vcB -= tempFossa * 0.18;
    }

    // Narrow the lower facial skeleton (maxilla) compared to the neurocranium
    if (nx > 0.12) {
      const maxillaNarrow = Math.max(
        0.48,
        1 - Math.pow((nx - 0.12) / 0.88, 1.1) * 0.52
      );
      z *= maxillaNarrow;
      if (ny < 0.05) {
        y += (nx - 0.12) * 0.025;
        x -= (nx - 0.12) * 0.022;
        vcR -= 0.18;
        vcG -= 0.2;
        vcB -= 0.22;
      }
    }

    // Anterior Facial Osteology (+Y hemisphere)
    if (ny > 0.12) {
      // Superciliary Brow Ridge & Glabella (nx = -0.12)
      const brow =
        Math.exp(-Math.pow((nx - -0.12) * 8.0, 2)) *
        Math.exp(-Math.pow(nz * 2.2, 2));
      y += brow * 0.0115;

      // Deep Bilateral Bony Orbital Cavities (Eye Sockets at nx = 0.04, nz = ±0.34)
      const leftOrbit = Math.hypot((nx - 0.04) * 5.8, (nz - -0.34) * 5.2);
      const rightOrbit = Math.hypot((nx - 0.04) * 5.8, (nz - 0.34) * 5.2);
      if (leftOrbit < 1.05) {
        const depth = Math.cos((leftOrbit / 1.05) * (Math.PI / 2));
        y -= depth * 0.025;
        vcR -= depth * 0.55;
        vcG -= depth * 0.58;
        vcB -= depth * 0.6;
      }
      if (rightOrbit < 1.05) {
        const depth = Math.cos((rightOrbit / 1.05) * (Math.PI / 2));
        y -= depth * 0.025;
        vcR -= depth * 0.55;
        vcG -= depth * 0.58;
        vcB -= depth * 0.6;
      }

      // Prominent Zygomatic Bones (Cheekbones at nx = 0.16, nz = ±0.52)
      const zygoma =
        Math.exp(-Math.pow((nx - 0.16) * 5.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.52) * 5.0, 2));
      y += zygoma * 0.0125;
      z += Math.sign(nz) * zygoma * 0.0145;

      // Nasal Bones (Upper bridge) & Piriform Nasal Aperture (Hollow nasal cavity at nx = 0.28)
      const nasalBridge =
        Math.exp(-Math.pow((nx - 0.06) * 9.5, 2)) *
        Math.exp(-Math.pow(nz * 10.0, 2));
      const piriformCavity = Math.hypot((nx - 0.29) * 6.8, nz * 7.8);
      y += nasalBridge * 0.0115;
      if (piriformCavity < 1.0) {
        const pDepth = Math.cos(piriformCavity * (Math.PI / 2));
        y -= pDepth * 0.023;
        vcR -= pDepth * 0.62;
        vcG -= pDepth * 0.65;
        vcB -= pDepth * 0.68;
      }

      // Maxillary Alveolar Process with Canine Jugae (Upper tooth-bearing arch at nx > 0.45)
      if (nx > 0.42 && nx < 0.85) {
        const alveolar =
          Math.exp(-Math.pow((nx - 0.62) * 5.5, 2)) *
          Math.exp(-Math.pow(nz * 2.6, 2));
        const rootFlutes = Math.cos(nz * 36) * 0.0012 * alveolar;
        y += alveolar * 0.0145 + rootFlutes;
      }
    }

    pos.setXYZ(i, x, y, z);
    colors[i * 3] = Math.max(0.18, Math.min(1.05, vcR));
    colors[i * 3 + 1] = Math.max(0.16, Math.min(1.04, vcG));
    colors[i * 3 + 2] = Math.max(0.14, Math.min(1.02, vcB));
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally generates an anatomically accurate 3D Human Rib (True 1–7, False 8–10, Floating 11–12)
 * sweeping from the exact thoracic costovertebral joint (T1–T12) around the lateral chest wall
 * and uniting with the sternum or costal arch via costal cartilage.
 */
function createAnatomicalRibGeometry(
  ribIndex: number,
  side: number,
  tableSurfaceY: number
): {
  ribBoneGeo: THREE.BufferGeometry;
  cartilageGeo: THREE.BufferGeometry | null;
  spineOrigin: THREE.Vector3;
  ribEnd: THREE.Vector3;
  sternumTarget: THREE.Vector3 | null;
} {
  const rt = ribIndex / 11; // 0 = 1st rib (T1), 1 = 12th rib (T12)
  const isTrueRib = ribIndex < 7;
  const isFalseRib = ribIndex >= 7 && ribIndex < 10;
  const isFloatingRib = ribIndex >= 10;

  // Match exact Thoracic Vertebra T1..T12 coordinates (-0.530 to -0.252)
  const spineX = -0.53 + rt * 0.278;
  const thoracicKyphosis = -Math.sin(rt * Math.PI) * 0.011;
  const spineY = tableSurfaceY + 0.068 + thoracicKyphosis;
  const widthCurve = Math.sin(rt * Math.PI * 0.84 + 0.2);
  const maxLatZ = side * (0.092 + widthCurve * 0.068);
  const antPeakY =
    tableSurfaceY + 0.174 - (ribIndex > 6 ? (ribIndex - 6) * 0.0085 : 0);
  const slopeDropX = 0.018 + rt * 0.024;

  const spineOrigin = new THREE.Vector3(spineX, spineY, side * 0.012);

  const ribPoints = isFloatingRib
    ? [
        spineOrigin,
        new THREE.Vector3(spineX - 0.006, spineY + 0.016, maxLatZ * 0.55),
        new THREE.Vector3(spineX + 0.018, spineY + 0.052, maxLatZ * 0.82),
      ]
    : [
        spineOrigin,
        new THREE.Vector3(spineX - 0.008, spineY + 0.014, maxLatZ * 0.52),
        new THREE.Vector3(spineX + slopeDropX * 0.45, spineY + 0.062, maxLatZ),
        new THREE.Vector3(
          spineX + slopeDropX,
          antPeakY - 0.016,
          maxLatZ * (isFalseRib ? 0.64 : 0.52)
        ),
      ];

  const ribCurve = new THREE.CatmullRomCurve3(ribPoints);
  const ribBoneGeo = new THREE.TubeGeometry(ribCurve, 26, 0.005, 10, false);
  const ribEnd = ribPoints[ribPoints.length - 1].clone();

  let cartilageGeo: THREE.BufferGeometry | null = null;
  let sternumTarget: THREE.Vector3 | null = null;
  if (!isFloatingRib) {
    // True ribs (1-7) connect directly into the Manubrium & Corpus Sterni;
    // False ribs (8-10) fuse into the continuous 7th costal margin arch
    const targetSternumX = isTrueRib
      ? -0.522 + (ribIndex / 6) * 0.148
      : -0.374 + (ribIndex - 7) * 0.014;
    const targetSternumY = isTrueRib
      ? tableSurfaceY + 0.181 - rt * 0.004
      : tableSurfaceY + 0.172 - (ribIndex - 7) * 0.006;
    const targetSternumZ =
      side * (isTrueRib ? 0.014 : 0.022 + (ribIndex - 7) * 0.014);

    sternumTarget = new THREE.Vector3(
      targetSternumX,
      targetSternumY,
      targetSternumZ
    );

    const cartCurve = new THREE.CatmullRomCurve3([
      ribEnd,
      new THREE.Vector3(
        (ribEnd.x + targetSternumX) * 0.5 + 0.006,
        (ribEnd.y + targetSternumY) * 0.5 - 0.002,
        (ribEnd.z + targetSternumZ) * 0.54
      ),
      sternumTarget,
    ]);
    cartilageGeo = new THREE.TubeGeometry(cartCurve, 16, 0.0046, 10, false);
  }

  return { ribBoneGeo, cartilageGeo, spineOrigin, ribEnd, sternumTarget };
}

/**
 * Generates a soft ambient-occlusion contact shadow texture placed directly under the supine subject
 * on the stainless-steel examination table surface so the body rests with realistic physical weight.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 256);

  const drawBlob = (cx: number, cy: number, rx: number, ry: number, alpha: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0.1, 0, 0, 1);
    g.addColorStop(0, `rgba(2, 6, 23, ${alpha})`);
    g.addColorStop(0.6, `rgba(15, 23, 42, ${(alpha * 0.45).toFixed(3)})`);
    g.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Head, Shoulders/Torso, Pelvis, Arms & Legs contact AO
  drawBlob(74, 128, 34, 28, 0.62);
  drawBlob(195, 128, 95, 66, 0.68);
  drawBlob(285, 128, 68, 56, 0.66);
  drawBlob(215, 52, 95, 18, 0.48);
  drawBlob(215, 204, 95, 18, 0.48);
  drawBlob(395, 98, 108, 24, 0.56);
  drawBlob(395, 158, 108, 24, 0.56);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a realistic studio/surgical reflection environment map (IBL) using PMREMGenerator
 * so human skin clearcoat, wet moisture sheen, cortical bone, visceral organs, and stainless steel
 * exhibit realistic specular reflections.
 */
export function createSurgicalEnvMap(
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0f172a);

  const overheadSoftbox = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  overheadSoftbox.position.set(0, 5, 0);
  overheadSoftbox.rotation.x = Math.PI / 2;
  envScene.add(overheadSoftbox);

  const warmKeyStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 3),
    new THREE.MeshBasicMaterial({ color: 0xffe4c4, side: THREE.DoubleSide })
  );
  warmKeyStrip.position.set(0, 2.5, 5);
  envScene.add(warmKeyStrip);

  const coolRimStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 3),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd, side: THREE.DoubleSide })
  );
  coolRimStrip.position.set(0, 2.5, -5);
  envScene.add(coolRimStrip);

  const target = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return target.texture;
}

/**
 * Procedurally generates a realistic 3D anatomical Long Bone (Humerus, Femur, Tibia, Radius, Ulna)
 * with flared proximal and distal epiphyses/condyles and an anatomical diaphysis shaft.
 */
function createAnatomicalLongBoneGeometry(
  length: number,
  shaftRadius: number,
  proximalFlare = 1.65,
  distalFlare = 1.75,
  bowCurve = 0.004
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(
    shaftRadius,
    shaftRadius,
    length,
    18,
    24
  );
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const halfLen = length / 2;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i); // -halfLen to +halfLen
    let z = pos.getZ(i);

    const u = (y + halfLen) / length; // 0 = distal, 1 = proximal

    // Proximal & distal epiphyseal/metaphyseal flare
    const proxFactor = Math.pow(Math.max(0, (u - 0.72) / 0.28), 1.7);
    const distFactor = Math.pow(Math.max(0, (0.28 - u) / 0.28), 1.7);

    const scaleXZ =
      1.0 +
      proxFactor * (proximalFlare - 1.0) +
      distFactor * (distalFlare - 1.0);

    // Slight bicondylar widening along Z at the distal joint
    const condyleWide = 1.0 + distFactor * 0.28;
    // Slight intercondylar notch at the very ends
    const endNotch =
      u < 0.04 || u > 0.96 ? Math.exp(-Math.pow(z / shaftRadius, 2)) * 0.12 : 0;

    x = x * scaleXZ * (1 - endNotch) + Math.sin(u * Math.PI) * bowCurve;
    z = z * scaleXZ * condyleWide;

    // Subtle metaphyseal darker trabecular bone warmth at epiphyses vs bright ivory cortical shaft
    const epiphysealTint = (proxFactor + distFactor) * 0.09;
    colors[i * 3] = 1.0 - epiphysealTint * 0.5;
    colors[i * 3 + 1] = 0.99 - epiphysealTint * 0.85;
    colors[i * 3 + 2] = 0.96 - epiphysealTint * 1.1;

    pos.setXYZ(i, x, y, z);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a realistic ivory-cream cortical bone texture with Haversian canal micro-grain
 * and subtle anatomical shading for the 3D osteological skeleton.
 */
function createCorticalBoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm anatomical ivory-parchment base (#EFE7D6)
  ctx.fillStyle = '#efe7d6';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle trabecular/periosteal mineral mottling
  for (let i = 0; i < 180; i++) {
    const cx = (i * 67) % 256;
    const cy = (i * 113) % 256;
    const r = 10 + (i % 22);
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    g.addColorStop(
      0,
      i % 2 === 0 ? 'rgba(204, 188, 160, 0.16)' : 'rgba(252, 248, 240, 0.18)'
    );
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // Fine longitudinal Haversian bone striations
  ctx.strokeStyle = 'rgba(175, 158, 132, 0.14)';
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 90; k++) {
    const x = (k * 2.9) % 256;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(k) * 3, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Generates a procedural human epidermal micro-pore & skin grain bump map texture
 * for realistic specular skin highlights and dermal surface micro-topography.
 */
function createEpidermalBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Epidermal Langer's lines & fine skin micro-pores
  for (let i = 0; i < 2600; i++) {
    const x = (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1 * 256;
    const y = (((Math.cos(i * 78.233) * 29451.123) % 1) + 1) % 1 * 256;
    const r = 0.6 + (i % 3) * 0.45;
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(102,102,102,0.36)' : 'rgba(158,158,158,0.32)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/**
 * Procedurally renders a realistic human skin texture that dynamically simulates
 * natural melanin/hemoglobin subsurface warmth, anatomical muscle contour shading,
 * and post-mortem physiological skin phases.
 */
/**
 * Procedurally renders a high-resolution human dermal & post-mortem pathology texture
 * that dynamically simulates:
 * - Stage 1 (Fresh, 0–50 ADD): Subsurface hemoglobin warmth -> algor mortis pallor,
 *   dependent dorsal livor mortis (hypostasis) with pale contact blanching over scapulae/sacrum,
 *   and early right iliac fossa sulfhemoglobin green discoloration (ADD > 32).
 * - Stage 2 (Bloat, 50–110 ADD): Arborizing superficial venous marbling, tense green-bronze
 *   abdominal discoloration, and glistening epidermal bullae (fluid blisters).
 * - Stage 3 (Active Decay, 110–240 ADD): Moist olive-umber-charcoal putrefaction, epidermal
 *   skin slippage islands, and dark purge exudate staining.
 * - Stage 4 & 5 (Advanced Decay & Skeletonization, 240+ ADD): Environmentally branched
 *   waxy greyish-ivory Adipocere (Saponification at RH >= 75%) vs. leathery bronze-parchment
 *   Mummification/Desiccation (at RH < 50% or high airflow).
 */
function createDynamicDermalSkinTexture(
  add: number,
  humidity: number,
  airflow: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const isHumidAdipocere = humidity >= 75 && airflow < 0.85;
  const isDryDesiccation = humidity < 50 || airflow >= 0.95;

  // 1. Continuous Biophysical Base Complexion Evolution (ADD 0 -> 500+)
  let baseR = 218;
  let baseG = 154;
  let baseB = 118;

  if (add < 42) {
    // Algor mortis & progressive post-mortem pallor
    const pallor = Math.min(1, add / 42);
    baseR = Math.round(218 - pallor * 14);
    baseG = Math.round(154 - pallor * 9);
    baseB = Math.round(118 - pallor * 5);
  } else if (add < 115) {
    // Bloating phase: shift toward distended olive-taupe / greenish-bronze
    const t = (add - 42) / 73;
    baseR = Math.round(204 - t * 34);
    baseG = Math.round(145 - t * 18);
    baseB = Math.round(113 - t * 24);
  } else if (add < 245) {
    // Active Decay: darkening olive-umber & moist liquefaction tones
    const t = (add - 115) / 130;
    baseR = Math.round(170 - t * 46);
    baseG = Math.round(127 - t * 38);
    baseB = Math.round(89 - t * 31);
  } else {
    // Advanced Decay & Skeletonization: Adipocere saponification vs. Mummified parchment
    const t = Math.min(1, (add - 245) / 180);
    if (isHumidAdipocere) {
      // Waxy greyish-ivory saponified adipocere
      baseR = Math.round(124 + t * 44);
      baseG = Math.round(89 + t * 68);
      baseB = Math.round(58 + t * 78);
    } else if (isDryDesiccation) {
      // Leathery dark amber-parchment mummification
      baseR = Math.round(124 - t * 22);
      baseG = Math.round(89 - t * 26);
      baseB = Math.round(58 - t * 24);
    } else {
      baseR = Math.round(124 - t * 16);
      baseG = Math.round(89 - t * 16);
      baseB = Math.round(58 - t * 12);
    }
  }

  ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Subsurface Dermal Variation (Melanin, Hemoglobin & Tissue Mottling)
  for (let i = 0; i < 280; i++) {
    const cx = (i * 73) % 512;
    const cy = (i * 137) % 512;
    const rad = 20 + (i % 38);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
    if (add < 75) {
      grad.addColorStop(
        0,
        i % 3 === 0
          ? 'rgba(202, 94, 76, 0.11)'
          : i % 3 === 1
            ? 'rgba(238, 178, 142, 0.09)'
            : 'rgba(164, 100, 70, 0.085)'
      );
    } else if (add < 250) {
      grad.addColorStop(
        0,
        i % 3 === 0
          ? 'rgba(74, 88, 52, 0.16)'
          : i % 3 === 1
            ? 'rgba(92, 64, 48, 0.15)'
            : 'rgba(48, 42, 36, 0.14)'
      );
    } else {
      grad.addColorStop(
        0,
        isHumidAdipocere
          ? 'rgba(215, 210, 198, 0.18)'
          : 'rgba(78, 52, 34, 0.18)'
      );
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }

  // 3. Natural Anatomical Shading (Clavicular/Sternal warmth, Pectoral contour, Linea Alba, Umbilicus)
  const midlineGrad = ctx.createLinearGradient(0, 0, 0, 512);
  midlineGrad.addColorStop(0, 'rgba(118, 66, 46, 0.18)');
  midlineGrad.addColorStop(0.18, 'rgba(244, 188, 152, 0.07)');
  midlineGrad.addColorStop(0.5, 'rgba(112, 62, 42, 0.16)');
  midlineGrad.addColorStop(0.82, 'rgba(244, 188, 152, 0.07)');
  midlineGrad.addColorStop(1, 'rgba(118, 66, 46, 0.18)');
  ctx.fillStyle = midlineGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Umbilical fossa shadow spot on anterior abdomen UV (u ~ 0.69, v ~ 0 / 1)
  [0, 512].forEach((uy) => {
    const umbGrad = ctx.createRadialGradient(353, uy, 1, 353, uy, 17);
    umbGrad.addColorStop(0, 'rgba(72, 36, 24, 0.46)');
    umbGrad.addColorStop(1, 'rgba(72, 36, 24, 0)');
    ctx.fillStyle = umbGrad;
    ctx.fillRect(334, uy - 18, 38, 38);
  });

  // 4. Dependent Dorsal Livor Mortis (Hypostasis) + Scapular/Sacral Contact Blanching (ADD 6–340)
  if (add >= 6 && add < 340) {
    const livorIntensity =
      add < 42 ? (add - 6) / 36 : Math.max(0.18, 1 - (add - 42) / 300);
    const livorGrad = ctx.createLinearGradient(0, 175, 0, 340);
    livorGrad.addColorStop(0, 'rgba(118, 42, 64, 0)');
    livorGrad.addColorStop(
      0.3,
      `rgba(114, 38, 62, ${(livorIntensity * 0.34).toFixed(3)})`
    );
    livorGrad.addColorStop(
      0.5,
      `rgba(96, 32, 54, ${(livorIntensity * 0.38).toFixed(3)})`
    );
    livorGrad.addColorStop(
      0.7,
      `rgba(114, 38, 62, ${(livorIntensity * 0.34).toFixed(3)})`
    );
    livorGrad.addColorStop(1, 'rgba(118, 42, 64, 0)');
    ctx.fillStyle = livorGrad;
    ctx.fillRect(0, 175, 512, 165);

    // Pale pressure-point contact blanching over scapulae (u ~ 0.28) and sacrum (u ~ 0.85) against the steel table
    [142, 435].forEach((bx) => {
      const blanch = ctx.createRadialGradient(bx, 256, 4, bx, 256, 38);
      blanch.addColorStop(
        0,
        `rgba(228, 185, 158, ${(livorIntensity * 0.28).toFixed(3)})`
      );
      blanch.addColorStop(1, 'rgba(228, 185, 158, 0)');
      ctx.fillStyle = blanch;
      ctx.fillRect(bx - 40, 216, 80, 80);
    });
  }

  // 5. Right Iliac Fossa -> Generalized Abdominal Sulfhemoglobin Greenish Shift (ADD > 30)
  if (add > 30 && add < 380) {
    const greenIntensity = Math.min(0.42, ((add - 30) / 95) * 0.42);
    const spreadRadius = Math.min(260, 95 + (add - 30) * 0.95);
    const fossaGrad = ctx.createRadialGradient(
      340,
      115,
      8,
      340,
      115,
      spreadRadius
    );
    fossaGrad.addColorStop(
      0,
      `rgba(74, 102, 58, ${greenIntensity.toFixed(3)})`
    );
    fossaGrad.addColorStop(
      0.55,
      `rgba(86, 108, 64, ${(greenIntensity * 0.65).toFixed(3)})`
    );
    fossaGrad.addColorStop(1, 'rgba(86, 108, 64, 0)');
    ctx.fillStyle = fossaGrad;
    ctx.fillRect(80, 0, 432, 320);
  }

  // 6. Arborizing Venous Marbling (Intravascular Hemolysis & H2S Reaction, ADD 45–310)
  if (add > 45 && add < 310) {
    const marbleAlpha =
      add < 115
        ? ((add - 45) / 70) * 0.34
        : Math.max(0.08, (1 - (add - 115) / 195) * 0.34);
    ctx.strokeStyle = `rgba(62, 44, 48, ${marbleAlpha.toFixed(3)})`;
    ctx.lineWidth = 1.6;
    for (let branch = 0; branch < 22; branch++) {
      let vx = 35 + branch * 22;
      let vy = 20 + (branch % 4) * 52;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let step = 0; step < 8; step++) {
        const nextX = vx + Math.sin(branch * 1.4 + step * 1.2) * 16;
        const nextY = vy + 18 + Math.cos(branch * 0.8 + step) * 7;
        ctx.lineTo(nextX, nextY);
        // Secondary capillary bifurcation twigs
        if (step % 2 === 1) {
          ctx.moveTo(nextX, nextY);
          ctx.lineTo(
            nextX + (branch % 2 === 0 ? 11 : -11),
            nextY + 9
          );
          ctx.moveTo(nextX, nextY);
        }
        vx = nextX;
        vy = nextY;
      }
      ctx.stroke();
    }
  }

  // 7. Epidermal Bullae (Fluid-Filled Blisters) & Active Decay Liquefaction Patches (ADD 75–280)
  if (add > 75 && add < 285) {
    const blisterAlpha = Math.min(
      0.32,
      Math.sin(((add - 75) / 210) * Math.PI) * 0.32
    );
    for (let b = 0; b < 28; b++) {
      const bx = (b * 97 + 40) % 480;
      const by = (b * 61 + 30) % 480;
      const br = 6 + (b % 9);
      const bGrad = ctx.createRadialGradient(bx, by, 1, bx, by, br);
      bGrad.addColorStop(0, `rgba(148, 86, 62, ${blisterAlpha.toFixed(3)})`);
      bGrad.addColorStop(
        0.75,
        `rgba(68, 38, 28, ${(blisterAlpha * 0.85).toFixed(3)})`
      );
      bGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 8. Late-Stage Adipocere Waxy Plaques OR Mummified Parchment Striae (ADD > 210)
  if (add > 210) {
    const lateIntensity = Math.min(0.45, ((add - 210) / 180) * 0.45);
    if (isHumidAdipocere) {
      for (let p = 0; p < 36; p++) {
        const px = (p * 83) % 512;
        const py = (p * 127) % 512;
        const pr = 18 + (p % 24);
        const aGrad = ctx.createRadialGradient(px, py, 2, px, py, pr);
        aGrad.addColorStop(
          0,
          `rgba(232, 228, 216, ${lateIntensity.toFixed(3)})`
        );
        aGrad.addColorStop(1, 'rgba(232, 228, 216, 0)');
        ctx.fillStyle = aGrad;
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
    } else {
      ctx.strokeStyle = `rgba(58, 36, 22, ${(lateIntensity * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      for (let s = 0; s < 75; s++) {
        const sx = (s * 6.8) % 512;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + Math.sin(s) * 8, 512);
        ctx.stroke();
      }
    }
  }

  // 9. Epidermal Langer's Lines & Micro-Creases
  ctx.strokeStyle = 'rgba(108, 62, 42, 0.085)';
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 55; k++) {
    const yLine = (k * 9.3) % 512;
    ctx.beginPath();
    ctx.moveTo(0, yLine);
    ctx.lineTo(512, yLine + Math.sin(k) * 4);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates the realistic 3D representation of a human body with lifelike human skin
 * positioned supine on the examination table (`y = 0.84m` table surface).
 */
export function createForensicSubject3DGroup(
  includeTableSurface = false
): ForensicSubjectController {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ForensicSubjectModelRoot';
  const interactiveMeshes: THREE.Object3D[] = [];

  const TABLE_SURFACE_Y = 0.84;

  if (includeTableSurface) {
    const tableGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.2,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.88,
      roughness: 0.16,
    });
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(2.38, 0.08, 0.92),
      steelMat
    );
    bed.position.set(0, 0.8, 0);
    bed.receiveShadow = true;
    tableGroup.add(bed);

    const frontRail = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.04, 0.04),
      rimMat
    );
    frontRail.position.set(0, 0.85, 0.45);
    tableGroup.add(frontRail);
    const backRail = frontRail.clone();
    backRail.position.set(0, 0.85, -0.45);
    tableGroup.add(backRail);

    // Perforated drainage channels on the autopsy table surface
    for (let d = -0.85; d <= 0.85; d += 0.34) {
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.26, 0.78),
        new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.75,
          roughness: 0.32,
        })
      );
      plate.rotation.x = -Math.PI / 2;
      plate.position.set(d, TABLE_SURFACE_Y + 0.001, 0);
      tableGroup.add(plate);
    }

    const gridHelper = new THREE.GridHelper(2.2, 22, 0x06b6d4, 0x1e293b);
    gridHelper.position.set(-0.05, TABLE_SURFACE_Y + 0.002, 0);
    gridHelper.scale.set(0.92, 1, 0.38);
    tableGroup.add(gridHelper);

    // Rubberized cervical headrest block
    const headBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.055, 0.24),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.38,
        metalness: 0.25,
      })
    );
    headBlock.position.set(-0.78, TABLE_SURFACE_Y + 0.0275, 0);
    tableGroup.add(headBlock);

    rootGroup.add(tableGroup);
  }

  // Soft Ambient-Occlusion Contact Shadow Decal on Examination Table Surface
  const contactShadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.98, 0.72),
    new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
    })
  );
  contactShadowMesh.rotation.x = -Math.PI / 2;
  contactShadowMesh.position.set(0.03, TABLE_SURFACE_Y + 0.0025, 0);
  rootGroup.add(contactShadowMesh);

  // ===========================================================================
  // LAYER 1: SEAMLESS SCULPTED 3D HUMAN BODY & REALISTIC HUMAN DERMAL SKIN
  // ===========================================================================
  const envelopeGroup = new THREE.Group();
  const wireframeGroup = new THREE.Group();

  const skinBumpTex = createEpidermalBumpTexture();
  let currentDermalTex = createDynamicDermalSkinTexture(20, 82, 0.35);
  let lastDermalKey = '';

  const createSkinMaterial = () =>
    new THREE.MeshPhysicalMaterial({
      color: 0xffede0,
      vertexColors: true,
      map: currentDermalTex,
      bumpMap: skinBumpTex,
      bumpScale: 0.0026,
      emissive: 0x3b150c,
      emissiveIntensity: 0.11,
      roughness: 0.4,
      metalness: 0.01,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      sheen: 0.72,
      sheenRoughness: 0.38,
      sheenColor: new THREE.Color(0xd9795d),
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

  const regionShellMats: Record<AnatomicalRegionId, THREE.MeshPhysicalMaterial> =
    {
      'head-neck': createSkinMaterial(),
      thorax: createSkinMaterial(),
      'abdomen-pelvis': createSkinMaterial(),
      extremities: createSkinMaterial(),
    };

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.16,
  });

  const addEnvelopeSegment = (
    geo: THREE.BufferGeometry,
    pos: [number, number, number],
    rot: [number, number, number],
    scale: [number, number, number],
    regionId: AnatomicalRegionId
  ) => {
    const mesh = new THREE.Mesh(geo, regionShellMats[regionId]);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { objectId: 'specimen-area', regionId };
    envelopeGroup.add(mesh);
    interactiveMeshes.push(mesh);

    const wMesh = new THREE.Mesh(geo, wireMat);
    wMesh.position.set(pos[0], pos[1], pos[2]);
    wMesh.rotation.set(rot[0], rot[1], rot[2]);
    wMesh.scale.set(scale[0] * 1.003, scale[1] * 1.003, scale[2] * 1.003);
    wireframeGroup.add(wMesh);

    return { mesh, wMesh };
  };

  // Helper for realistic pigmented anatomical surface features (hair, nails, clinical brief)
  const addPigmentedFeature = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    rot: [number, number, number],
    scale: [number, number, number],
    regionId: AnatomicalRegionId
  ) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { objectId: 'specimen-area', regionId };
    envelopeGroup.add(mesh);
    interactiveMeshes.push(mesh);
    return mesh;
  };

  const nailMat = new THREE.MeshPhysicalMaterial({
    color: 0xebbfb0,
    roughness: 0.2,
    clearcoat: 0.72,
  });
  const clinicalBriefMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    bumpMap: skinBumpTex,
    bumpScale: 0.0018,
    roughness: 0.72,
    metalness: 0.04,
    sheen: 0.35,
    sheenColor: new THREE.Color(0x334155),
    side: THREE.DoubleSide,
  });

  // 1A. Seamless Sculpted 3D Human Head, Face (Brow, Eyelids, Lash Lines, Nose, Vermilion Lips, Chin, Ears) & Cervical Neck (Hair-Free Cranial Vault)
  const sculptedHeadGeo = createSculptedHeadGeometry();
  const headBasePositions = new Float32Array(
    (sculptedHeadGeo.getAttribute('position') as THREE.BufferAttribute).array
  );
  addEnvelopeSegment(
    sculptedHeadGeo,
    [-0.77, TABLE_SURFACE_Y + 0.144, 0],
    [0, 0, -0.05],
    [1, 1, 1],
    'head-neck'
  );

  // Continuous Cervical Neck Column (-0.72m to -0.55m, shares exact vertex ring with Thorax at -0.55m)
  const neckLoft = createSculptedTorsoSectionGeometry(
    -0.72,
    -0.55,
    14,
    40,
    TABLE_SURFACE_Y,
    true,
    false
  );
  const neckEnv = addEnvelopeSegment(
    neckLoft.geometry,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'head-neck'
  );

  // 1B. Continuous Sculpted Thoracic Cage & Shoulders (-0.55m to -0.23m, shares exact vertex rings at -0.55m and -0.23m)
  const thoraxLoft = createSculptedTorsoSectionGeometry(
    -0.55,
    -0.23,
    26,
    40,
    TABLE_SURFACE_Y,
    false,
    false
  );
  const thoraxEnv = addEnvelopeSegment(
    thoraxLoft.geometry,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'thorax'
  );

  // 1C. Continuous Sculpted Abdomen, Iliac Crests, Inguinal Crease & Pelvis (-0.23m to +0.165m)
  const abdomenLoft = createSculptedTorsoSectionGeometry(
    -0.23,
    0.165,
    30,
    40,
    TABLE_SURFACE_Y,
    false,
    true
  );
  const abdomenEnv = addEnvelopeSegment(
    abdomenLoft.geometry,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'abdomen-pelvis'
  );

  // Tailored Clinical Forensic Examination Brief over Pelvic / Inguinal Hip Zone (-0.032m to +0.162m)
  const clinicalBriefMesh = addPigmentedFeature(
    createClinicalBriefGeometry(TABLE_SURFACE_Y),
    clinicalBriefMat,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'abdomen-pelvis'
  );

  // 1D. Single-Mesh Continuous Upper Extremities (Deltoid -> Biceps/Triceps -> Elbow -> Forearm -> Wrist -> Metacarpal Hand + 5 Articulated Digits)
  const armGeometries: {
    geo: THREE.BufferGeometry;
    basePositions: Float32Array;
    side: number;
  }[] = [];
  [-1, 1].forEach((side) => {
    const continuousArmGeo = createContinuousArmGeometry(side, TABLE_SURFACE_Y);
    armGeometries.push({
      geo: continuousArmGeo,
      basePositions: new Float32Array(
        (continuousArmGeo.getAttribute('position') as THREE.BufferAttribute)
          .array
      ),
      side,
    });
    addEnvelopeSegment(
      continuousArmGeo,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'extremities'
    );

    // Seamlessly Integrated Articulated Opposable Thumb (Pollex) rooted directly into radial Thenar eminence of palm
    addEnvelopeSegment(
      createSculptedFingerGeometry(0.045, 0.0084),
      [0.086, TABLE_SURFACE_Y + 0.025, side * 0.233],
      [0, side * 0.32, -Math.PI / 2],
      [1, 1, 1],
      'extremities'
    );
    // 4 Articulated 3-Phalangeal Anatomical Fingers (Index, Middle, Ring, Little) rooted into MCP knuckles at x = 0.104m (zero gap)
    const fingerLengths = [0.052, 0.058, 0.054, 0.044];
    fingerLengths.forEach((fLen, fIdx) => {
      const fz = side * (0.242 + fIdx * 0.013);
      const fingerCenterX = 0.103 + fLen * 0.45;
      addEnvelopeSegment(
        createSculptedFingerGeometry(fLen, 0.0074 - fIdx * 0.0004),
        [fingerCenterX, TABLE_SURFACE_Y + 0.021, fz],
        [0, 0, -0.05],
        [1, 1, 1],
        'extremities'
      );
      addPigmentedFeature(
        new THREE.BoxGeometry(0.0072, 0.0014, 0.006),
        nailMat,
        [fingerCenterX + fLen * 0.38, TABLE_SURFACE_Y + 0.0255, fz],
        [0, 0, -0.05],
        [1, 1, 1],
        'extremities'
      );
    });
  });

  // 1E. Single-Mesh Continuous Lower Extremities (Hip/Gluteal -> Quadriceps Thigh -> Patellar Knee -> Calf/Shin -> Ankle -> Foot + 5 Toes)
  const legGeometries: {
    geo: THREE.BufferGeometry;
    basePositions: Float32Array;
    side: number;
  }[] = [];
  [-1, 1].forEach((side) => {
    const continuousLegGeo = createContinuousLegGeometry(side, TABLE_SURFACE_Y);
    legGeometries.push({
      geo: continuousLegGeo,
      basePositions: new Float32Array(
        (continuousLegGeo.getAttribute('position') as THREE.BufferAttribute)
          .array
      ),
      side,
    });
    addEnvelopeSegment(
      continuousLegGeo,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'extremities'
    );

    // 5 Sculpted Toes (Hallux to 5th Digit) with Keratin Toenails rooted directly into distal metatarsal ridge
    const zFoot = side * 0.105;
    for (let tIdx = 0; tIdx < 5; tIdx++) {
      const isHallux = tIdx === 0;
      const tz = zFoot + side * (-0.023 + tIdx * 0.0112);
      const ty = TABLE_SURFACE_Y + 0.144 - tIdx * 0.0062;
      addEnvelopeSegment(
        createSculptedFingerGeometry(
          isHallux ? 0.032 : 0.025 - tIdx * 0.0014,
          isHallux ? 0.0094 : 0.0064 - tIdx * 0.0003
        ),
        [0.876, ty, tz],
        [0, 0, -0.16],
        [1, 1, 1],
        'extremities'
      );
      addPigmentedFeature(
        new THREE.BoxGeometry(
          0.0018,
          0.0072,
          isHallux ? 0.0108 : 0.007
        ),
        nailMat,
        [0.868, ty + 0.005, tz],
        [0, 0, -0.16],
        [1, 1, 1],
        'extremities'
      );
    }
  });

  rootGroup.add(envelopeGroup);
  rootGroup.add(wireframeGroup);

  // ===========================================================================
  // LAYER 2: HIGH-PRECISION ARTICULATED 3D OSTEOLOGICAL SKELETON
  // ===========================================================================
  const osteologyGroup = new THREE.Group();
  const corticalBoneTex = createCorticalBoneTexture();

  const boneMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4efe1,
    vertexColors: true,
    map: corticalBoneTex,
    bumpMap: corticalBoneTex,
    bumpScale: 0.0026,
    roughness: 0.4,
    metalness: 0.04,
    clearcoat: 0.16,
    clearcoatRoughness: 0.42,
    emissive: 0x1c170f,
    emissiveIntensity: 0.08,
  });

  const bonePlainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4efe1,
    map: corticalBoneTex,
    bumpMap: corticalBoneTex,
    bumpScale: 0.0024,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.14,
    clearcoatRoughness: 0.45,
    emissive: 0x1c170f,
    emissiveIntensity: 0.08,
  });

  const cartilageMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1,
    roughness: 0.28,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
    clearcoat: 0.42,
  });

  const enamelMat = new THREE.MeshPhysicalMaterial({
    color: 0xfefce8,
    roughness: 0.14,
    clearcoat: 0.82,
  });

  const orbitCavityMat = new THREE.MeshStandardMaterial({
    color: 0x181512,
    roughness: 0.92,
  });

  const addBoneMesh = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    rot: [number, number, number],
    scale: [number, number, number],
    regionId: AnatomicalRegionId
  ) => {
    const effectiveMat =
      mat === boneMat && !geo.attributes.color ? bonePlainMat : mat;
    const mesh = new THREE.Mesh(geo, effectiveMat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { objectId: 'specimen-area', regionId };
    osteologyGroup.add(mesh);
    interactiveMeshes.push(mesh);
    return mesh;
  };

  // Helper: Connects two exact 3D anatomical joint points with a sculpted epiphyseal bone segment (zero gaps)
  const upAxis = new THREE.Vector3(0, 1, 0);
  const addConnectedLongBone = (
    proximalPt: [number, number, number],
    distalPt: [number, number, number],
    shaftRadius: number,
    proximalFlare: number,
    distalFlare: number,
    bowCurve: number,
    regionId: AnatomicalRegionId,
    mat: THREE.Material = boneMat
  ) => {
    const startVec = new THREE.Vector3(
      proximalPt[0],
      proximalPt[1],
      proximalPt[2]
    );
    const endVec = new THREE.Vector3(distalPt[0], distalPt[1], distalPt[2]);
    const delta = startVec.clone().sub(endVec); // local +Y points from distal (u=0) to proximal (u=1)
    const len = delta.length();
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);

    const geo = createAnatomicalLongBoneGeometry(
      len,
      shaftRadius,
      proximalFlare,
      distalFlare,
      bowCurve
    );
    const effectiveMat =
      mat === boneMat && !geo.attributes.color ? bonePlainMat : mat;
    const mesh = new THREE.Mesh(geo, effectiveMat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(upAxis, delta.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { objectId: 'specimen-area', regionId };
    osteologyGroup.add(mesh);
    interactiveMeshes.push(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------------
  // 2A. UNIFIED 3D CRANIUM, ZYGOMATIC ARCHES, MANDIBLE, DENTAL ARCHES & OCCIPITAL JOINT
  // ---------------------------------------------------------------------------
  addBoneMesh(
    createSculptedSkullGeometry(),
    boneMat,
    [-0.776, TABLE_SURFACE_Y + 0.14, 0],
    [0, 0, -0.05],
    [1, 1, 1],
    'head-neck'
  );

  // Deep Orbital Socket Backing, Fused Zygomatic Arches & Mastoid Processes
  [-1, 1].forEach((side) => {
    addBoneMesh(
      new THREE.SphereGeometry(0.014, 14, 12),
      orbitCavityMat,
      [-0.764, TABLE_SURFACE_Y + 0.206, side * 0.028],
      [0, 0, 0],
      [0.85, 0.55, 1.0],
      'head-neck'
    );

    // Continuous Zygomatic Arch fused at both Maxillary Zygoma and Temporal Root
    const zygomaticCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.74, TABLE_SURFACE_Y + 0.184, side * 0.042),
      new THREE.Vector3(-0.758, TABLE_SURFACE_Y + 0.168, side * 0.062),
      new THREE.Vector3(-0.782, TABLE_SURFACE_Y + 0.148, side * 0.052),
    ]);
    addBoneMesh(
      new THREE.TubeGeometry(zygomaticCurve, 20, 0.0048, 10, false),
      bonePlainMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'head-neck'
    );

    // Mastoid Process & Styloid Process fused behind TMJ
    addBoneMesh(
      new THREE.ConeGeometry(0.009, 0.02, 10),
      bonePlainMat,
      [-0.762, TABLE_SURFACE_Y + 0.128, side * 0.052],
      [0, 0, -Math.PI * 0.65],
      [1, 1, 1],
      'head-neck'
    );
  });

  // Piriform Nasal Aperture Cavity & Nasal Septum (Vomer/Ethmoid Plate)
  addBoneMesh(
    new THREE.ConeGeometry(0.011, 0.026, 3),
    orbitCavityMat,
    [-0.738, TABLE_SURFACE_Y + 0.212, 0],
    [Math.PI * 0.38, 0, 0],
    [0.8, 1.0, 0.85],
    'head-neck'
  );
  addBoneMesh(
    new THREE.BoxGeometry(0.022, 0.014, 0.0018),
    bonePlainMat,
    [-0.738, TABLE_SURFACE_Y + 0.214, 0],
    [0, 0, -0.2],
    [1, 1, 1],
    'head-neck'
  );

  // Unified One-Piece Mandible: Left TMJ Condyle -> Left Ramus/Gonial Angle -> Chin Symphysis -> Right Ramus -> Right TMJ Condyle
  const mandibleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.758, TABLE_SURFACE_Y + 0.148, -0.05), // Left TMJ Condyle seated in Temporal Fossa
    new THREE.Vector3(-0.722, TABLE_SURFACE_Y + 0.138, -0.046), // Left Gonial Angle
    new THREE.Vector3(-0.696, TABLE_SURFACE_Y + 0.168, -0.03), // Left Mandibular Body
    new THREE.Vector3(-0.682, TABLE_SURFACE_Y + 0.194, 0), // Mental Protuberance (Chin Symphysis)
    new THREE.Vector3(-0.696, TABLE_SURFACE_Y + 0.168, 0.03), // Right Mandibular Body
    new THREE.Vector3(-0.722, TABLE_SURFACE_Y + 0.138, 0.046), // Right Gonial Angle
    new THREE.Vector3(-0.758, TABLE_SURFACE_Y + 0.148, 0.05), // Right TMJ Condyle seated in Temporal Fossa
  ]);
  addBoneMesh(
    new THREE.TubeGeometry(mandibleCurve, 40, 0.0092, 12, false),
    bonePlainMat,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'head-neck'
  );

  // Bilateral Ascending Mandibular Ramus Plates, Coronoid Processes & TMJ Articular Capsules
  [-1, 1].forEach((side) => {
    addBoneMesh(
      new THREE.BoxGeometry(0.038, 0.026, 0.0068),
      bonePlainMat,
      [-0.734, TABLE_SURFACE_Y + 0.15, side * 0.046],
      [0, side * 0.12, 0.32],
      [1, 1, 1],
      'head-neck'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.0075, 12, 10),
      cartilageMat,
      [-0.758, TABLE_SURFACE_Y + 0.148, side * 0.05],
      [0, 0, 0],
      [0.9, 0.9, 1.3],
      'head-neck'
    );
  });

  // Connected Upper Maxillary & Lower Mandibular Alveolar Dental Arches + Fused Enamel Teeth
  const upperDentalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.72, TABLE_SURFACE_Y + 0.172, -0.028),
    new THREE.Vector3(-0.71, TABLE_SURFACE_Y + 0.192, -0.018),
    new THREE.Vector3(-0.706, TABLE_SURFACE_Y + 0.2, 0),
    new THREE.Vector3(-0.71, TABLE_SURFACE_Y + 0.192, 0.018),
    new THREE.Vector3(-0.72, TABLE_SURFACE_Y + 0.172, 0.028),
  ]);
  addBoneMesh(
    new THREE.TubeGeometry(upperDentalCurve, 24, 0.0046, 10, false),
    bonePlainMat,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'head-neck'
  );

  const lowerDentalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.714, TABLE_SURFACE_Y + 0.168, -0.026),
    new THREE.Vector3(-0.702, TABLE_SURFACE_Y + 0.186, -0.017),
    new THREE.Vector3(-0.696, TABLE_SURFACE_Y + 0.194, 0),
    new THREE.Vector3(-0.702, TABLE_SURFACE_Y + 0.186, 0.017),
    new THREE.Vector3(-0.714, TABLE_SURFACE_Y + 0.168, 0.026),
  ]);
  addBoneMesh(
    new THREE.TubeGeometry(lowerDentalCurve, 24, 0.0044, 10, false),
    bonePlainMat,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'head-neck'
  );

  for (let t = -6; t <= 6; t++) {
    const u = (t + 6) / 12;
    const upPt = upperDentalCurve.getPoint(u);
    const lowPt = lowerDentalCurve.getPoint(u);
    const angle = (t / 6.5) * (Math.PI * 0.44);
    const isMolar = Math.abs(t) >= 4;
    addBoneMesh(
      new THREE.BoxGeometry(
        isMolar ? 0.0058 : 0.005,
        0.0052,
        isMolar ? 0.0054 : 0.0042
      ),
      enamelMat,
      [upPt.x + 0.003, upPt.y, upPt.z],
      [0, angle, 0],
      [1, 1, 1],
      'head-neck'
    );
    addBoneMesh(
      new THREE.BoxGeometry(
        isMolar ? 0.0056 : 0.0048,
        0.005,
        isMolar ? 0.005 : 0.0038
      ),
      enamelMat,
      [lowPt.x - 0.003, lowPt.y, lowPt.z],
      [0, angle, 0],
      [1, 1, 1],
      'head-neck'
    );
  }

  // ---------------------------------------------------------------------------
  // 2B. CONTINUOUS UNIFIED VERTEBRAL COLUMN (OCCIPITAL BASE -> C1–C7 -> T1–T12 -> L1–L5 -> SACRUM -> COCCYX)
  // ---------------------------------------------------------------------------
  // Continuous structural spinal axis & longitudinal ligament core from Foramen Magnum (-0.745) into Sacrum (+0.075)
  const getVertebraCoord = (vIdx: number): [number, number, number] => {
    if (vIdx < 7) {
      // C1 (-0.708) to C7 (-0.556)
      const s = vIdx / 6;
      const vx = -0.708 + s * 0.152;
      const vy = TABLE_SURFACE_Y + 0.074 + Math.sin(s * Math.PI) * 0.012;
      return [vx, vy, 0];
    }
    if (vIdx < 19) {
      // T1 (-0.530) to T12 (-0.252) — matches Rib 1..12 origins exactly
      const s = (vIdx - 7) / 11;
      const vx = -0.53 + s * 0.278;
      const vy = TABLE_SURFACE_Y + 0.068 - Math.sin(s * Math.PI) * 0.011;
      return [vx, vy, 0];
    }
    // L1 (-0.222) to L5 (-0.032)
    const s = (vIdx - 19) / 4;
    const vx = -0.222 + s * 0.19;
    const vy = TABLE_SURFACE_Y + 0.07 + Math.sin(s * Math.PI) * 0.015;
    return [vx, vy, 0];
  };

  const spineCorePts: THREE.Vector3[] = [
    new THREE.Vector3(-0.748, TABLE_SURFACE_Y + 0.092, 0), // Occipital Condyle / Foramen Magnum base inside skull
  ];
  for (let v = 0; v < 24; v++) {
    const [vx, vy, vz] = getVertebraCoord(v);
    spineCorePts.push(new THREE.Vector3(vx, vy, vz));
  }
  spineCorePts.push(new THREE.Vector3(0.015, TABLE_SURFACE_Y + 0.068, 0)); // S1 Sacral Promontory
  spineCorePts.push(new THREE.Vector3(0.072, TABLE_SURFACE_Y + 0.056, 0)); // S5 Sacral Apex
  spineCorePts.push(new THREE.Vector3(0.106, TABLE_SURFACE_Y + 0.048, 0)); // Coccyx Tip

  const spineCoreCurve = new THREE.CatmullRomCurve3(spineCorePts);
  // Continuous central spinal column core uniting Skull, C1-L5, Sacrum & Coccyx with zero gaps
  addBoneMesh(
    new THREE.TubeGeometry(spineCoreCurve, 64, 0.0105, 12, false),
    bonePlainMat,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'thorax'
  );

  // Atlanto-Occipital Joint Capsule bridging Skull Base (-0.742) directly to C1 Atlas (-0.708)
  addConnectedLongBone(
    [-0.745, TABLE_SURFACE_Y + 0.09, 0],
    [-0.708, TABLE_SURFACE_Y + 0.074, 0],
    0.0145,
    1.35,
    1.25,
    0,
    'head-neck',
    cartilageMat
  );

  for (let v = 0; v < 24; v++) {
    const t = v / 23;
    const [vx, spineY] = getVertebraCoord(v);
    const nextCoord =
      v < 23
        ? getVertebraCoord(v + 1)
        : ([0.015, TABLE_SURFACE_Y + 0.068, 0] as [number, number, number]);
    const stepX = nextCoord[0] - vx;

    const isCervical = v < 7;
    const isThoracic = v >= 7 && v < 19;
    const reg: AnatomicalRegionId = isCervical
      ? 'head-neck'
      : isThoracic
        ? 'thorax'
        : 'abdomen-pelvis';

    const radius = 0.014 + t * 0.011;
    const bodyHeight = stepX * 0.72;
    const discHeight = stepX * 0.34;

    // Vertebral Body (Centrum)
    addBoneMesh(
      new THREE.CylinderGeometry(radius, radius * 1.04, bodyHeight, 16),
      bonePlainMat,
      [vx, spineY, 0],
      [0, 0, Math.PI / 2],
      [1, 0.88, 1.14],
      reg
    );

    // Fibrocartilage Intervertebral Disc directly abutting the current and next vertebra (zero gap, includes L5-S1 disc)
    addBoneMesh(
      new THREE.CylinderGeometry(
        radius * 0.98,
        radius * 1.02,
        discHeight,
        16
      ),
      cartilageMat,
      [vx + stepX * 0.52, (spineY + nextCoord[1]) * 0.5, 0],
      [0, 0, Math.PI / 2],
      [1, 0.88, 1.12],
      reg
    );

    // Fused Bilateral Transverse Processes & Pedicles
    const tpSpan = isCervical ? 0.038 : isThoracic ? 0.054 : 0.064;
    addBoneMesh(
      new THREE.CylinderGeometry(0.0042, 0.0042, tpSpan, 8),
      bonePlainMat,
      [vx + 0.001, spineY - 0.005, 0],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      reg
    );

    // Dorsal Spinous Process fused to neural arch
    const spinousLen = isThoracic ? 0.026 : 0.02;
    addBoneMesh(
      new THREE.BoxGeometry(0.012, spinousLen, 0.005),
      bonePlainMat,
      [vx + (isThoracic ? 0.006 : 0.002), spineY - radius - 0.005, 0],
      [0, 0, isThoracic ? 0.4 : 0.15],
      [1, 1, 1],
      reg
    );
  }

  // Fused Sacrum (S1–S5 triangular wedge with Sacral Alae) directly united with L5 & Coccyx
  addBoneMesh(
    new THREE.ConeGeometry(0.052, 0.098, 16),
    bonePlainMat,
    [0.038, TABLE_SURFACE_Y + 0.062, 0],
    [0, 0, -Math.PI / 2 - 0.14],
    [0.52, 1.0, 1.22],
    'abdomen-pelvis'
  );
  addBoneMesh(
    new THREE.ConeGeometry(0.015, 0.034, 10),
    bonePlainMat,
    [0.094, TABLE_SURFACE_Y + 0.05, 0],
    [0, 0, -Math.PI / 2 + 0.2],
    [0.6, 1.0, 0.88],
    'abdomen-pelvis'
  );

  // ---------------------------------------------------------------------------
  // 2C. UNIFIED STERNUM, S-CURVED CLAVICLES, SCAPULAE & 12 PAIRS OF CONNECTED RIBS
  // ---------------------------------------------------------------------------
  // 1. Hexagonal Manubrium Sterni (overlapping Corpus Sterni at Sternal Angle)
  addBoneMesh(
    new THREE.CylinderGeometry(0.027, 0.02, 0.052, 6),
    bonePlainMat,
    [-0.518, TABLE_SURFACE_Y + 0.18, 0],
    [0, Math.PI / 6, Math.PI / 2 - 0.06],
    [0.38, 1.0, 1.18],
    'thorax'
  );
  // 2. Sternal Angle (Angle of Louis) Fibrocartilage Joint
  addBoneMesh(
    new THREE.BoxGeometry(0.012, 0.012, 0.034),
    cartilageMat,
    [-0.494, TABLE_SURFACE_Y + 0.182, 0],
    [0, 0, 0],
    [1, 1, 1],
    'thorax'
  );
  // 3. Corpus Sterni (Gladiolus / Sternal Body)
  addBoneMesh(
    new THREE.BoxGeometry(0.132, 0.012, 0.033),
    bonePlainMat,
    [-0.432, TABLE_SURFACE_Y + 0.183, 0],
    [0, 0, -0.02],
    [1, 1, 1],
    'thorax'
  );
  // 4. Xiphoid Process fused to inferior Corpus Sterni
  addBoneMesh(
    new THREE.ConeGeometry(0.012, 0.032, 8),
    cartilageMat,
    [-0.356, TABLE_SURFACE_Y + 0.178, 0],
    [0, 0, -Math.PI / 2],
    [0.48, 1.0, 0.92],
    'thorax'
  );

  // 12 Pairs of Anatomically Curved 3D Ribs + Costovertebral Joints + Costal Cartilages (1:1 scale so zero detachment!)
  for (let r = 0; r < 12; r++) {
    [-1, 1].forEach((side) => {
      const { ribBoneGeo, cartilageGeo, spineOrigin, ribEnd, sternumTarget } =
        createAnatomicalRibGeometry(r, side, TABLE_SURFACE_Y);
      addBoneMesh(
        ribBoneGeo,
        bonePlainMat,
        [0, 0, 0],
        [0, 0, 0],
        [1, 1, 1],
        'thorax'
      );
      // Costovertebral joint capsule fusing rib head directly to Thoracic Vertebra T(r+1)
      addBoneMesh(
        new THREE.SphereGeometry(0.0062, 8, 8),
        cartilageMat,
        [spineOrigin.x, spineOrigin.y, spineOrigin.z],
        [0, 0, 0],
        [1, 1, 1],
        'thorax'
      );
      if (cartilageGeo) {
        addBoneMesh(
          cartilageGeo,
          cartilageMat,
          [0, 0, 0],
          [0, 0, 0],
          [1, 1, 1],
          'thorax'
        );
        // Costochondral junction collar fusing bony rib end to costal cartilage
        addBoneMesh(
          new THREE.SphereGeometry(0.0054, 8, 8),
          cartilageMat,
          [ribEnd.x, ribEnd.y, ribEnd.z],
          [0, 0, 0],
          [1, 1, 1],
          'thorax'
        );
        if (sternumTarget) {
          // Sternocostal joint capsule uniting costal cartilage with Sternum / Costal Arch
          addBoneMesh(
            new THREE.SphereGeometry(0.0054, 8, 8),
            cartilageMat,
            [sternumTarget.x, sternumTarget.y, sternumTarget.z],
            [0, 0, 0],
            [1, 1, 1],
            'thorax'
          );
        }
      }
    });
  }

  // Bilateral S-Curved Clavicles, Sternoclavicular & Acromioclavicular Joints, Scapulae & Glenoid Fossae
  [-1, 1].forEach((side) => {
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.526, TABLE_SURFACE_Y + 0.181, side * 0.015), // Sternoclavicular joint on Manubrium
      new THREE.Vector3(-0.542, TABLE_SURFACE_Y + 0.176, side * 0.075),
      new THREE.Vector3(-0.52, TABLE_SURFACE_Y + 0.148, side * 0.142),
      new THREE.Vector3(-0.506, TABLE_SURFACE_Y + 0.118, side * 0.194), // Acromioclavicular joint at Shoulder
    ]);
    addBoneMesh(
      new THREE.TubeGeometry(clavCurve, 22, 0.0074, 10, false),
      bonePlainMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'thorax'
    );

    // Sternoclavicular & Acromioclavicular Articular Joint Capsules
    addBoneMesh(
      new THREE.SphereGeometry(0.0088, 10, 10),
      cartilageMat,
      [-0.526, TABLE_SURFACE_Y + 0.181, side * 0.016],
      [0, 0, 0],
      [1, 1, 1],
      'thorax'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.0085, 10, 10),
      cartilageMat,
      [-0.506, TABLE_SURFACE_Y + 0.118, side * 0.194],
      [0, 0, 0],
      [1, 1, 1],
      'thorax'
    );

    // Triangular Scapular Blade (Posterior Shoulder Blade)
    addBoneMesh(
      new THREE.ConeGeometry(0.058, 0.122, 3),
      bonePlainMat,
      [-0.462, TABLE_SURFACE_Y + 0.058, side * 0.142],
      [0.08 * side, 0, -Math.PI / 2],
      [0.24, 1.0, 1.18],
      'thorax'
    );

    // Continuous Scapular Spine & Acromion Process bridging Scapular Blade to Acromioclavicular & Glenohumeral Joints
    const scapSpineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.478, TABLE_SURFACE_Y + 0.062, side * 0.105),
      new THREE.Vector3(-0.498, TABLE_SURFACE_Y + 0.086, side * 0.162),
      new THREE.Vector3(-0.506, TABLE_SURFACE_Y + 0.116, side * 0.194),
      new THREE.Vector3(-0.495, TABLE_SURFACE_Y + 0.098, side * 0.196),
    ]);
    addBoneMesh(
      new THREE.TubeGeometry(scapSpineCurve, 18, 0.0072, 10, false),
      bonePlainMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'thorax'
    );

    // Glenoid Fossa Labrum Socket receiving the Humeral Head
    addBoneMesh(
      new THREE.TorusGeometry(0.019, 0.0052, 10, 18),
      cartilageMat,
      [-0.495, TABLE_SURFACE_Y + 0.098, side * 0.194],
      [0, Math.PI / 2 - side * 0.25, 0.2],
      [1, 1, 1],
      'thorax'
    );
  });

  // ---------------------------------------------------------------------------
  // 2D. CLOSED BONY PELVIC RING (SACROILIAC BRIDGES, ILIUM, ISCHIUM, PUBIS & PUBIC SYMPHYSIS)
  // ---------------------------------------------------------------------------
  [-1, 1].forEach((side) => {
    // Sacroiliac Joint Bridge uniting Lateral Sacrum directly to Iliac Wing
    addConnectedLongBone(
      [0.024, TABLE_SURFACE_Y + 0.066, side * 0.026],
      [0.028, TABLE_SURFACE_Y + 0.086, side * 0.076],
      0.015,
      1.35,
      1.45,
      0,
      'abdomen-pelvis',
      cartilageMat
    );

    // Flared Iliac Wing (Ala of Ilium) & Iliac Crest
    addBoneMesh(
      new THREE.SphereGeometry(0.068, 22, 18),
      bonePlainMat,
      [0.028, TABLE_SURFACE_Y + 0.088, side * 0.086],
      [side * 0.42, 0.22 * side, -0.28],
      [0.98, 0.26, 1.16],
      'abdomen-pelvis'
    );
    // Thickened Iliac Crest Rim & ASIS
    addBoneMesh(
      new THREE.TorusGeometry(0.066, 0.011, 10, 24, Math.PI * 0.95),
      bonePlainMat,
      [0.028, TABLE_SURFACE_Y + 0.096, side * 0.09],
      [side * 0.42, Math.PI / 2, -0.18],
      [1.1, 0.88, 1.0],
      'abdomen-pelvis'
    );

    // Continuous Pelvic Brim (Arcuate Line -> Superior Pubic Ramus -> Pubic Symphysis -> Inferior Pubic Ramus -> Ischium -> Acetabulum)
    const pelvicRingCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.024, TABLE_SURFACE_Y + 0.07, side * 0.032), // Sacroiliac junction
      new THREE.Vector3(0.056, TABLE_SURFACE_Y + 0.084, side * 0.086), // Iliopectineal line
      new THREE.Vector3(0.082, TABLE_SURFACE_Y + 0.084, side * 0.092), // Acetabular dome
      new THREE.Vector3(0.098, TABLE_SURFACE_Y + 0.114, side * 0.012), // Superior pubic ramus to Pubic Symphysis
      new THREE.Vector3(0.112, TABLE_SURFACE_Y + 0.086, side * 0.042), // Inferior pubic ramus
      new THREE.Vector3(0.102, TABLE_SURFACE_Y + 0.056, side * 0.074), // Ischial tuberosity
      new THREE.Vector3(0.082, TABLE_SURFACE_Y + 0.082, side * 0.092), // Closed back into Acetabulum
    ]);
    addBoneMesh(
      new THREE.TubeGeometry(pelvicRingCurve, 36, 0.0092, 10, false),
      bonePlainMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'abdomen-pelvis'
    );

    // Deep Acetabular Cup Rim
    addBoneMesh(
      new THREE.TorusGeometry(0.024, 0.0068, 10, 18),
      cartilageMat,
      [0.082, TABLE_SURFACE_Y + 0.082, side * 0.092],
      [0, Math.PI / 2 - side * 0.35, 0.3],
      [1, 1, 1],
      'abdomen-pelvis'
    );
  });

  // Fibrocartilaginous Pubic Symphysis Disc uniting Left & Right Pubic Bones at the anterior midline
  addBoneMesh(
    new THREE.BoxGeometry(0.028, 0.026, 0.026),
    cartilageMat,
    [0.1, TABLE_SURFACE_Y + 0.112, 0],
    [0, 0, -0.12],
    [1, 1, 1],
    'abdomen-pelvis'
  );

  // ---------------------------------------------------------------------------
  // 2E. COMBINED APPENDICULAR SKELETON (ENDPOINT-TO-ENDPOINT CONNECTED LIMBS, HANDS & FEET)
  // ---------------------------------------------------------------------------
  [-1, 1].forEach((side) => {
    // === UPPER EXTREMITY CHAIN (Shoulder -> Elbow -> Wrist -> Carpus -> Metacarpals -> Phalanges) ===
    const jShoulder: [number, number, number] = [
      -0.495,
      TABLE_SURFACE_Y + 0.098,
      side * 0.202,
    ];
    const jElbow: [number, number, number] = [
      -0.222,
      TABLE_SURFACE_Y + 0.052,
      side * 0.244,
    ];
    const jWrist: [number, number, number] = [
      0.034,
      TABLE_SURFACE_Y + 0.032,
      side * 0.258,
    ];

    // 1. Glenohumeral Humeral Head seated directly in Glenoid Fossa
    addBoneMesh(
      new THREE.SphereGeometry(0.023, 16, 14),
      bonePlainMat,
      jShoulder,
      [0, 0, 0],
      [1.08, 0.95, 1.0],
      'extremities'
    );

    // 2. Humerus connected directly from jShoulder (-0.495) to jElbow (-0.222)
    addConnectedLongBone(
      jShoulder,
      jElbow,
      0.0118,
      1.65,
      1.88,
      0.004,
      'extremities',
      boneMat
    );

    // Articulated Bicondylar Elbow Joint Complex (Humeral Trochlea/Capitulum + Olecranon Capsule) at jElbow
    addBoneMesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.034, 14),
      cartilageMat,
      jElbow,
      [Math.PI / 2, 0, 0],
      [1, 0.85, 1],
      'extremities'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.0145, 12, 12),
      bonePlainMat,
      [jElbow[0] - 0.006, jElbow[1] - 0.005, jElbow[2] - side * 0.006],
      [0, 0, 0],
      [1.15, 0.9, 1.0],
      'extremities'
    );

    // 3. Ulna (Medial) & Radius (Lateral) connected directly from jElbow (-0.222) to jWrist (+0.034)
    const ulnarProx: [number, number, number] = [
      jElbow[0] - 0.004,
      jElbow[1] - 0.003,
      side * 0.236,
    ];
    const ulnarDist: [number, number, number] = [
      jWrist[0],
      jWrist[1] - 0.002,
      side * 0.248,
    ];
    const radialProx: [number, number, number] = [
      jElbow[0] + 0.004,
      jElbow[1] + 0.002,
      side * 0.252,
    ];
    const radialDist: [number, number, number] = [
      jWrist[0],
      jWrist[1] + 0.002,
      side * 0.268,
    ];

    addConnectedLongBone(
      ulnarProx,
      ulnarDist,
      0.0074,
      1.75,
      1.38,
      -0.002,
      'extremities',
      boneMat
    );
    addConnectedLongBone(
      radialProx,
      radialDist,
      0.0078,
      1.38,
      1.85,
      0.003,
      'extremities',
      boneMat
    );
    // Antebrachial Interosseous Membrane uniting Radius & Ulna
    addBoneMesh(
      new THREE.PlaneGeometry(0.23, 0.018),
      cartilageMat,
      [
        (jElbow[0] + jWrist[0]) * 0.5,
        (jElbow[1] + jWrist[1]) * 0.5,
        side * 0.252,
      ],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      'extremities'
    );

    // 4. Unified Radiocarpal Wrist Capsule & Carpal Block bridging Distal Forearm (0.034) to Metacarpals (0.052)
    addBoneMesh(
      new THREE.BoxGeometry(0.024, 0.012, 0.038),
      cartilageMat,
      [0.043, TABLE_SURFACE_Y + 0.029, side * 0.258],
      [0, 0, -0.04],
      [1, 1, 1],
      'extremities'
    );
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        addBoneMesh(
          new THREE.SphereGeometry(0.0058, 8, 8),
          bonePlainMat,
          [
            0.036 + row * 0.011,
            TABLE_SURFACE_Y + 0.029,
            side * (0.243 + col * 0.0095),
          ],
          [0, 0, 0],
          [1.15, 0.8, 1.0],
          'extremities'
        );
      }
    }

    // 5. Connected 5 Metacarpals & 14 Phalanges with MCP/PIP/DIP Articular Knuckle Capsules
    for (let d = 0; d < 5; d++) {
      const isThumb = d === 0;
      const baseZ = side * (isThumb ? 0.235 : 0.244 + (d - 1) * 0.0125);
      const splayZ = side * (isThumb ? -0.012 : (d - 2) * 0.002);
      const mcLen = isThumb ? 0.032 : 0.044 - Math.abs(d - 2) * 0.0025;

      const mcStart: [number, number, number] = [
        0.05,
        TABLE_SURFACE_Y + 0.028,
        baseZ,
      ];
      const mcEnd: [number, number, number] = [
        0.05 + mcLen,
        TABLE_SURFACE_Y + 0.025,
        baseZ + splayZ,
      ];

      addConnectedLongBone(
        mcStart,
        mcEnd,
        0.0036,
        1.45,
        1.55,
        0.001,
        'extremities',
        boneMat
      );
      // MCP Knuckle Joint Capsule
      addBoneMesh(
        new THREE.SphereGeometry(0.0046, 8, 8),
        cartilageMat,
        mcEnd,
        [0, 0, 0],
        [1, 1, 1],
        'extremities'
      );

      const numPhal = isThumb ? 2 : 3;
      let prevJoint: [number, number, number] = mcEnd;
      for (let p = 0; p < numPhal; p++) {
        const pLen = (isThumb ? 0.019 : 0.022) * Math.pow(0.76, p);
        const pRad = 0.0033 * Math.pow(0.84, p);
        const nextJoint: [number, number, number] = [
          prevJoint[0] + pLen,
          prevJoint[1] - 0.0018,
          prevJoint[2] + splayZ * 0.35,
        ];
        addConnectedLongBone(
          prevJoint,
          nextJoint,
          pRad,
          1.35,
          1.35,
          0,
          'extremities',
          bonePlainMat
        );
        addBoneMesh(
          new THREE.SphereGeometry(pRad * 1.18, 8, 8),
          cartilageMat,
          nextJoint,
          [0, 0, 0],
          [1, 1, 1],
          'extremities'
        );
        prevJoint = nextJoint;
      }
    }

    // === LOWER EXTREMITY CHAIN (Hip Acetabulum -> Femoral Neck -> Greater Trochanter -> Femur -> Knee -> Tibia/Fibula -> Ankle -> Foot) ===
    const zLeg = side * 0.098;
    const jHip: [number, number, number] = [
      0.082,
      TABLE_SURFACE_Y + 0.082,
      side * 0.09,
    ];
    const jTrochanter: [number, number, number] = [
      0.104,
      TABLE_SURFACE_Y + 0.078,
      side * 0.122,
    ];
    const jFemurProx: [number, number, number] = [
      0.098,
      TABLE_SURFACE_Y + 0.078,
      side * 0.116,
    ];
    const jKnee: [number, number, number] = [
      0.462,
      TABLE_SURFACE_Y + 0.072,
      zLeg,
    ];
    const jAnkle: [number, number, number] = [
      0.818,
      TABLE_SURFACE_Y + 0.056,
      zLeg,
    ];

    // 5. Spherical Femoral Head in Acetabulum + Connected Femoral Neck + Greater Trochanter
    addBoneMesh(
      new THREE.SphereGeometry(0.023, 16, 14),
      bonePlainMat,
      jHip,
      [0, 0, 0],
      [1, 1, 1],
      'extremities'
    );
    addConnectedLongBone(
      jHip,
      jTrochanter,
      0.0135,
      1.35,
      1.45,
      0,
      'extremities',
      bonePlainMat
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.019, 12, 12),
      bonePlainMat,
      jTrochanter,
      [0, 0, 0],
      [1.2, 0.95, 0.9],
      'extremities'
    );

    // 6. Femur Shaft connected directly from Proximal Femur/Trochanter (0.098) to Knee Joint (0.462)
    addConnectedLongBone(
      jFemurProx,
      jKnee,
      0.0155,
      1.65,
      2.05,
      0.006,
      'extremities',
      boneMat
    );

    // Articulated Bicondylar Knee Complex: Medial/Lateral Femoral Condyles, Meniscal Cartilage, Patella & Patellar Ligament
    addBoneMesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.014, 16),
      cartilageMat,
      jKnee,
      [0, 0, Math.PI / 2],
      [1, 0.92, 1.15],
      'extremities'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.019, 14, 12),
      bonePlainMat,
      [jKnee[0] - 0.004, TABLE_SURFACE_Y + 0.098, zLeg],
      [0, 0, 0],
      [1.05, 0.48, 1.05],
      'extremities'
    );
    // Patellar Ligament / Quadriceps Tendon Bridge connecting Patella directly to Femur & Tibial Tuberosity
    addConnectedLongBone(
      [jKnee[0] - 0.022, TABLE_SURFACE_Y + 0.09, zLeg],
      [jKnee[0] + 0.026, TABLE_SURFACE_Y + 0.082, zLeg],
      0.0065,
      1.2,
      1.2,
      0.003,
      'extremities',
      cartilageMat
    );

    // 7. Tibia (Medial) & Fibula (Lateral) connected directly from jKnee (0.462) to jAnkle (0.818)
    const tibiaProx: [number, number, number] = [
      jKnee[0] + 0.004,
      jKnee[1],
      zLeg - side * 0.006,
    ];
    const tibiaDist: [number, number, number] = [
      jAnkle[0],
      jAnkle[1] + 0.002,
      zLeg - side * 0.006,
    ];
    const fibulaProx: [number, number, number] = [
      jKnee[0] + 0.012,
      jKnee[1] - 0.008,
      zLeg + side * 0.015,
    ];
    const fibulaDist: [number, number, number] = [
      jAnkle[0] + 0.002,
      jAnkle[1] - 0.006,
      zLeg + side * 0.015,
    ];

    addConnectedLongBone(
      tibiaProx,
      tibiaDist,
      0.0135,
      1.95,
      1.58,
      -0.003,
      'extremities',
      boneMat
    );
    addConnectedLongBone(
      fibulaProx,
      fibulaDist,
      0.0062,
      1.55,
      1.65,
      0.002,
      'extremities',
      boneMat
    );
    // Proximal & Distal Tibiofibular Joint Bridges + Crural Interosseous Membrane
    addConnectedLongBone(
      tibiaProx,
      fibulaProx,
      0.0065,
      1.2,
      1.2,
      0,
      'extremities',
      cartilageMat
    );
    addConnectedLongBone(
      tibiaDist,
      fibulaDist,
      0.0065,
      1.2,
      1.2,
      0,
      'extremities',
      cartilageMat
    );
    addBoneMesh(
      new THREE.PlaneGeometry(0.32, 0.02),
      cartilageMat,
      [
        (jKnee[0] + jAnkle[0]) * 0.5,
        (jKnee[1] + jAnkle[1]) * 0.5 - 0.003,
        zLeg + side * 0.004,
      ],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      'extremities'
    );

    // 8. Connected Tarsus (Talus, Calcaneus Heel, Navicular/Cuneiform Tarsal Arch), 5 Metatarsals & Connected Toe Phalanges
    addBoneMesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      bonePlainMat,
      [0.822, TABLE_SURFACE_Y + 0.056, zLeg],
      [0, 0, -0.18],
      [1.15, 0.9, 1.05],
      'extremities'
    );
    addBoneMesh(
      new THREE.BoxGeometry(0.058, 0.032, 0.034),
      bonePlainMat,
      [0.836, TABLE_SURFACE_Y + 0.032, zLeg],
      [0, 0, 0.08],
      [1, 1, 1],
      'extremities'
    );
    // Midfoot Tarsal Arch Bridge (Navicular, Cuboid & Cuneiforms) uniting Talus/Calcaneus to Metatarsal Bases
    addBoneMesh(
      new THREE.BoxGeometry(0.026, 0.024, 0.048),
      cartilageMat,
      [0.836, TABLE_SURFACE_Y + 0.066, zLeg],
      [0, 0, -0.25],
      [1, 1, 1],
      'extremities'
    );

    for (let mt = 0; mt < 5; mt++) {
      const mtZ = zLeg + side * (-0.022 + mt * 0.011);
      const isHallux = mt === 0;
      const mtStart: [number, number, number] = [
        0.838,
        TABLE_SURFACE_Y + 0.068 - mt * 0.003,
        mtZ,
      ];
      const mtEnd: [number, number, number] = [
        0.866,
        TABLE_SURFACE_Y + 0.118 - mt * 0.0045,
        mtZ,
      ];
      const toeEnd: [number, number, number] = [
        0.88,
        TABLE_SURFACE_Y + (isHallux ? 0.146 : 0.142 - mt * 0.0055),
        mtZ,
      ];

      addConnectedLongBone(
        mtStart,
        mtEnd,
        isHallux ? 0.005 : 0.0038,
        1.45,
        1.55,
        0.002,
        'extremities',
        boneMat
      );
      addBoneMesh(
        new THREE.SphereGeometry(isHallux ? 0.0058 : 0.0044, 8, 8),
        cartilageMat,
        mtEnd,
        [0, 0, 0],
        [1, 1, 1],
        'extremities'
      );
      addConnectedLongBone(
        mtEnd,
        toeEnd,
        isHallux ? 0.0046 : 0.0034,
        1.35,
        1.25,
        0,
        'extremities',
        bonePlainMat
      );
    }
  });

  rootGroup.add(osteologyGroup);

  // ===========================================================================
  // LAYER 3: LIFELIKE 3D INTERNAL VISCERAL ORGANS, VASCULAR TREE & MYOFASCIAL BUNDLES
  // ===========================================================================
  const visceralMyoGroup = new THREE.Group();

  const neuralMat = new THREE.MeshPhysicalMaterial({
    color: 0xe5b8b0,
    bumpMap: skinBumpTex,
    bumpScale: 0.0045,
    roughness: 0.36,
    clearcoat: 0.45,
    transparent: true,
    opacity: 0.92,
  });
  const tracheaMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    roughness: 0.32,
    clearcoat: 0.35,
  });
  const pulmonaryMat = new THREE.MeshPhysicalMaterial({
    color: 0xc97a7e,
    bumpMap: skinBumpTex,
    bumpScale: 0.003,
    roughness: 0.42,
    clearcoat: 0.38,
    transparent: true,
    opacity: 0.9,
  });
  const myocardialMat = new THREE.MeshPhysicalMaterial({
    color: 0x991b1b,
    emissive: 0x450a0a,
    emissiveIntensity: 0.22,
    roughness: 0.28,
    clearcoat: 0.62,
  });
  const arterialMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    clearcoat: 0.5,
  });
  const venousMat = new THREE.MeshPhysicalMaterial({
    color: 0x2563eb,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.18,
    roughness: 0.32,
    clearcoat: 0.45,
  });
  const hepaticMat = new THREE.MeshPhysicalMaterial({
    color: 0x6b241c,
    roughness: 0.26,
    clearcoat: 0.68,
    transparent: true,
    opacity: 0.94,
  });
  const biliaryMat = new THREE.MeshPhysicalMaterial({
    color: 0x15803d,
    roughness: 0.24,
    clearcoat: 0.72,
  });
  const gastricMat = new THREE.MeshPhysicalMaterial({
    color: 0xd48c7c,
    roughness: 0.34,
    clearcoat: 0.52,
    transparent: true,
    opacity: 0.92,
  });
  const entericMat = new THREE.MeshPhysicalMaterial({
    color: 0xc78d75,
    bumpMap: skinBumpTex,
    bumpScale: 0.0035,
    emissive: 0x3f2318,
    emissiveIntensity: 0.15,
    roughness: 0.35,
    clearcoat: 0.55,
    transparent: true,
    opacity: 0.92,
  });
  const colonMat = new THREE.MeshPhysicalMaterial({
    color: 0xb07c68,
    bumpMap: skinBumpTex,
    bumpScale: 0.004,
    roughness: 0.38,
    clearcoat: 0.5,
    transparent: true,
    opacity: 0.92,
  });
  const myofascialMat = new THREE.MeshPhysicalMaterial({
    color: 0x9f3a38,
    bumpMap: corticalBoneTex,
    bumpScale: 0.0025,
    roughness: 0.48,
    clearcoat: 0.25,
    transparent: true,
    opacity: 0.65,
  });

  // 3A. Bilateral Cerebral Hemispheres & Cerebellum inside Cranium
  [-1, 1].forEach((side) => {
    const hemi = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 22, 18),
      neuralMat
    );
    hemi.position.set(-0.805, TABLE_SURFACE_Y + 0.142, side * 0.028);
    hemi.scale.set(1.22, 0.88, 0.68);
    visceralMyoGroup.add(hemi);
  });
  const cerebellum = new THREE.Mesh(
    new THREE.SphereGeometry(0.034, 16, 14),
    neuralMat
  );
  cerebellum.position.set(-0.765, TABLE_SURFACE_Y + 0.095, 0);
  cerebellum.scale.set(0.85, 0.75, 1.35);
  visceralMyoGroup.add(cerebellum);

  // 3B. Cartilaginous Trachea, Bronchi, 3-Lobe Right Lung, 2-Lobe Left Lung & 4-Chamber Heart
  const tracheaMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0085, 0.0085, 0.13, 12),
    tracheaMat
  );
  tracheaMesh.rotation.z = Math.PI / 2;
  tracheaMesh.position.set(-0.585, TABLE_SURFACE_Y + 0.125, 0);
  visceralMyoGroup.add(tracheaMesh);

  [-1, 1].forEach((side) => {
    // Superior & Inferior Pulmonary Lobes
    const upperLobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 18, 16),
      pulmonaryMat
    );
    upperLobe.position.set(-0.475, TABLE_SURFACE_Y + 0.122, side * 0.066);
    upperLobe.scale.set(1.18, 0.92, 0.86);
    visceralMyoGroup.add(upperLobe);

    const lowerLobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 18, 16),
      pulmonaryMat
    );
    lowerLobe.position.set(-0.405, TABLE_SURFACE_Y + 0.11, side * 0.072);
    lowerLobe.scale.set(1.22, 0.96, 0.92);
    visceralMyoGroup.add(lowerLobe);
  });

  // Mediastinal 4-Chamber Heart & Aortic Arch
  const heartMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.088, 18),
    myocardialMat
  );
  heartMesh.position.set(-0.425, TABLE_SURFACE_Y + 0.132, -0.018);
  heartMesh.rotation.set(0.28, 0.15, -1.12);
  visceralMyoGroup.add(heartMesh);

  const aorticArch = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.0082, 10, 18, Math.PI),
    arterialMat
  );
  aorticArch.position.set(-0.465, TABLE_SURFACE_Y + 0.142, -0.006);
  aorticArch.rotation.set(0, Math.PI / 2, 0);
  visceralMyoGroup.add(aorticArch);

  // 3C. Systemic Arterial (Aorta/Carotid/Iliac/Femoral) & Venous (Vena Cava/Jugular/Femoral) Trees
  const aortaTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.0075, 0.52, 12),
    arterialMat
  );
  aortaTrunk.rotation.z = Math.PI / 2;
  aortaTrunk.position.set(-0.24, TABLE_SURFACE_Y + 0.088, -0.008);
  visceralMyoGroup.add(aortaTrunk);

  const venaCavaTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.0085, 0.5, 12),
    venousMat
  );
  venaCavaTrunk.rotation.z = Math.PI / 2;
  venaCavaTrunk.position.set(-0.25, TABLE_SURFACE_Y + 0.086, 0.012);
  visceralMyoGroup.add(venaCavaTrunk);

  [-1, 1].forEach((side) => {
    // Common Carotid Artery & Internal Jugular Vein
    const carotid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.0038, 0.19, 8),
      arterialMat
    );
    carotid.rotation.z = Math.PI / 2;
    carotid.position.set(-0.62, TABLE_SURFACE_Y + 0.112, side * 0.022);
    visceralMyoGroup.add(carotid);

    const jugular = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0044, 0.0044, 0.19, 8),
      venousMat
    );
    jugular.rotation.z = Math.PI / 2;
    jugular.position.set(-0.62, TABLE_SURFACE_Y + 0.108, side * 0.03);
    visceralMyoGroup.add(jugular);

    // Brachial-Radial Upper Extremity Vessels
    const brachialArt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0022, 0.48, 8),
      arterialMat
    );
    brachialArt.rotation.z = Math.PI / 2 + 0.08;
    brachialArt.rotation.y = -side * 0.08;
    brachialArt.position.set(-0.22, TABLE_SURFACE_Y + 0.062, side * 0.235);
    visceralMyoGroup.add(brachialArt);

    // Common Iliac & Femoral Artery + Vein
    const femoralArt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0032, 0.54, 8),
      arterialMat
    );
    femoralArt.rotation.z = Math.PI / 2;
    femoralArt.rotation.y = -side * 0.11;
    femoralArt.position.set(0.27, TABLE_SURFACE_Y + 0.076, side * 0.068);
    visceralMyoGroup.add(femoralArt);

    const femoralVein = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.0036, 0.54, 8),
      venousMat
    );
    femoralVein.rotation.z = Math.PI / 2;
    femoralVein.rotation.y = -side * 0.11;
    femoralVein.position.set(0.27, TABLE_SURFACE_Y + 0.072, side * 0.078);
    visceralMyoGroup.add(femoralVein);
  });

  // 3D. Bilobed Hepatic Liver, Gallbladder, J-Shaped Stomach, Spleen, Kidneys & Enteric Tract
  const liverRightLobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.064, 18, 16),
    hepaticMat
  );
  liverRightLobe.position.set(-0.31, TABLE_SURFACE_Y + 0.122, 0.052);
  liverRightLobe.scale.set(0.92, 0.68, 1.18);
  visceralMyoGroup.add(liverRightLobe);

  const liverLeftLobe = new THREE.Mesh(
    new THREE.ConeGeometry(0.044, 0.085, 14),
    hepaticMat
  );
  liverLeftLobe.position.set(-0.32, TABLE_SURFACE_Y + 0.132, -0.012);
  liverLeftLobe.rotation.set(Math.PI / 2, 0, -0.25);
  liverLeftLobe.scale.set(0.85, 1.0, 0.52);
  visceralMyoGroup.add(liverLeftLobe);

  const gallbladder = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.009, 0.022, 8, 10),
    biliaryMat
  );
  gallbladder.position.set(-0.275, TABLE_SURFACE_Y + 0.105, 0.048);
  gallbladder.rotation.set(0.4, 0, 0.6);
  visceralMyoGroup.add(gallbladder);

  // J-Shaped Gastric Stomach & Left Upper Quadrant Spleen
  const stomachCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.335, TABLE_SURFACE_Y + 0.115, -0.015),
    new THREE.Vector3(-0.315, TABLE_SURFACE_Y + 0.122, -0.058),
    new THREE.Vector3(-0.265, TABLE_SURFACE_Y + 0.118, -0.045),
    new THREE.Vector3(-0.255, TABLE_SURFACE_Y + 0.112, -0.008),
  ]);
  const stomachMesh = new THREE.Mesh(
    new THREE.TubeGeometry(stomachCurve, 20, 0.024, 12, false),
    gastricMat
  );
  visceralMyoGroup.add(stomachMesh);

  // Retroperitoneal Left & Right Kidneys
  [-1, 1].forEach((side) => {
    const kidney = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.026, 10, 12),
      hepaticMat
    );
    kidney.rotation.z = Math.PI / 2;
    kidney.position.set(-0.21, TABLE_SURFACE_Y + 0.078, side * 0.056);
    kidney.scale.set(1.0, 0.68, 0.85);
    visceralMyoGroup.add(kidney);
  });

  // Haustrated Large Intestine Frame (Cecum in Right Iliac Fossa -> Ascending -> Transverse -> Descending -> Sigmoid Colon)
  const colonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.045, TABLE_SURFACE_Y + 0.102, 0.082), // Cecum (Right Iliac Fossa)
    new THREE.Vector3(-0.145, TABLE_SURFACE_Y + 0.106, 0.086), // Ascending Colon
    new THREE.Vector3(-0.235, TABLE_SURFACE_Y + 0.112, 0.078), // Hepatic Flexure
    new THREE.Vector3(-0.215, TABLE_SURFACE_Y + 0.126, 0.0), // Transverse Colon
    new THREE.Vector3(-0.235, TABLE_SURFACE_Y + 0.112, -0.078), // Splenic Flexure
    new THREE.Vector3(-0.125, TABLE_SURFACE_Y + 0.104, -0.084), // Descending Colon
    new THREE.Vector3(-0.035, TABLE_SURFACE_Y + 0.096, -0.058), // Sigmoid Colon
    new THREE.Vector3(0.025, TABLE_SURFACE_Y + 0.082, 0.0), // Rectum
  ]);
  const colonFrameMesh = new THREE.Mesh(
    new THREE.TubeGeometry(colonCurve, 44, 0.0185, 12, false),
    colonMat
  );
  visceralMyoGroup.add(colonFrameMesh);

  // Convoluted Small Intestine Coils (Jejunum & Ileum) inside the Enteric Core
  const smallIntestinePts: THREE.Vector3[] = [];
  for (let s = 0; s <= 28; s++) {
    const u = s / 28;
    const sx = -0.205 + u * 0.165 + Math.sin(s * 1.9) * 0.018;
    const sz = Math.sin(s * 1.45) * 0.056;
    const sy = TABLE_SURFACE_Y + 0.106 + Math.cos(s * 2.1) * 0.012;
    smallIntestinePts.push(new THREE.Vector3(sx, sy, sz));
  }
  const entericCoreMesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(smallIntestinePts),
      72,
      0.0135,
      10,
      false
    ),
    entericMat
  );
  visceralMyoGroup.add(entericCoreMesh);

  // 3E. Longitudinal Striated Myofascial Bands (Pectoralis, Rectus Abdominis, Quadriceps)
  [-1, 1].forEach((side) => {
    const rectusBand = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.015, 0.32, 10, 14),
      myofascialMat
    );
    rectusBand.rotation.z = Math.PI / 2;
    rectusBand.position.set(-0.22, TABLE_SURFACE_Y + 0.148, side * 0.036);
    rectusBand.scale.set(1.0, 0.42, 1.35);
    visceralMyoGroup.add(rectusBand);

    const quadBand = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.026, 0.26, 10, 14),
      myofascialMat
    );
    quadBand.rotation.z = Math.PI / 2;
    quadBand.position.set(0.27, TABLE_SURFACE_Y + 0.095, side * 0.098);
    visceralMyoGroup.add(quadBand);
  });

  rootGroup.add(visceralMyoGroup);

  // ===========================================================================
  // LAYER 4: ANATOMICAL REFERENCE PLANES, LIDAR SCANNER & TELEMETRY NODES
  // ===========================================================================
  const planesGroup = new THREE.Group();
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.055,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const planeBorderMat = new THREE.LineBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.42,
  });

  // Median Sagittal Plane
  const sagittalGeo = new THREE.PlaneGeometry(1.92, 0.36);
  const sagittalPlane = new THREE.Mesh(sagittalGeo, planeMat);
  sagittalPlane.position.set(0.0, TABLE_SURFACE_Y + 0.18, 0);
  planesGroup.add(sagittalPlane);
  const sagittalEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(sagittalGeo),
    planeBorderMat
  );
  sagittalEdges.position.copy(sagittalPlane.position);
  planesGroup.add(sagittalEdges);

  // Animated LiDAR Transverse Scanning Slice
  const scanGeo = new THREE.PlaneGeometry(0.68, 0.38);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lidarSlice = new THREE.Mesh(scanGeo, scanMat);
  lidarSlice.rotation.y = Math.PI / 2;
  lidarSlice.position.set(-0.16, TABLE_SURFACE_Y + 0.18, 0);
  planesGroup.add(lidarSlice);

  const lidarEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(scanGeo),
    new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    })
  );
  lidarEdges.rotation.y = Math.PI / 2;
  lidarEdges.position.copy(lidarSlice.position);
  planesGroup.add(lidarEdges);

  rootGroup.add(planesGroup);

  // Regional Biometric Datum Nodes
  const telemetryGroup = new THREE.Group();
  const nodeRings: Record<AnatomicalRegionId, THREE.Mesh> = {} as Record<
    AnatomicalRegionId,
    THREE.Mesh
  >;

  const regionNodeCoords: {
    id: AnatomicalRegionId;
    pos: [number, number, number];
  }[] = [
    { id: 'head-neck', pos: [-0.76, TABLE_SURFACE_Y + 0.235, 0] },
    { id: 'thorax', pos: [-0.42, TABLE_SURFACE_Y + 0.225, 0] },
    { id: 'abdomen-pelvis', pos: [-0.14, TABLE_SURFACE_Y + 0.215, 0] },
    { id: 'extremities', pos: [0.27, TABLE_SURFACE_Y + 0.155, 0.098] },
  ];

  regionNodeCoords.forEach(({ id, pos }) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.022, 0.036, 24),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos[0], pos[1], pos[2]);
    telemetryGroup.add(ring);
    nodeRings[id] = ring;

    const beaconPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 0.06, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    beaconPin.position.set(pos[0], pos[1] + 0.03, pos[2]);
    telemetryGroup.add(beaconPin);
  });

  rootGroup.add(telemetryGroup);

  // ===========================================================================
  // LAYER 5: REAL-TIME DERMAL BIOPHYSICAL VAPOR, CADAVERIC PURGE FLUID POOL & ENTOMOLOGY
  // ===========================================================================
  const plumeCount = 90;
  const plumeGeo = new THREE.BufferGeometry();
  const plumePositions = new Float32Array(plumeCount * 3);
  for (let i = 0; i < plumeCount; i++) {
    plumePositions[i * 3] = -0.75 + Math.random() * 1.45;
    plumePositions[i * 3 + 1] = TABLE_SURFACE_Y + 0.12 + Math.random() * 0.38;
    plumePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.38;
  }
  plumeGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(plumePositions, 3)
  );
  const plumeMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.018,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const dermalPlumePoints = new THREE.Points(plumeGeo, plumeMat);
  rootGroup.add(dermalPlumePoints);

  // 5B. Real-Time 3D Cadaveric Purge Fluid & Liquefaction Exudate Pool on Table Surface
  const purgeFluidGroup = new THREE.Group();
  const purgeFluidMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a1c14,
    emissive: 0x1f0905,
    emissiveIntensity: 0.15,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const centralPurgePool = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 36),
    purgeFluidMat
  );
  centralPurgePool.rotation.x = -Math.PI / 2;
  centralPurgePool.position.set(-0.18, TABLE_SURFACE_Y + 0.0032, 0);
  centralPurgePool.scale.set(1.55, 0.78, 1);
  purgeFluidGroup.add(centralPurgePool);

  const cranialPurgePool = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 24),
    purgeFluidMat
  );
  cranialPurgePool.rotation.x = -Math.PI / 2;
  cranialPurgePool.position.set(-0.74, TABLE_SURFACE_Y + 0.0032, 0.02);
  cranialPurgePool.scale.set(1.2, 0.9, 1);
  purgeFluidGroup.add(cranialPurgePool);
  rootGroup.add(purgeFluidGroup);

  // 5C. Real-Time 3D Forensic Entomology (Calliphoridae Diptera & Larval Instar Masses)
  const entomologyGroup = new THREE.Group();
  const dipteraCount = 34;
  const dipteraGeo = new THREE.BufferGeometry();
  const dipteraPositions = new Float32Array(dipteraCount * 3);
  for (let i = 0; i < dipteraCount; i++) {
    dipteraPositions[i * 3] = -0.78 + (i / dipteraCount) * 0.95;
    dipteraPositions[i * 3 + 1] = TABLE_SURFACE_Y + 0.18 + (i % 5) * 0.04;
    dipteraPositions[i * 3 + 2] = ((i % 7) - 3) * 0.05;
  }
  dipteraGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(dipteraPositions, 3)
  );
  const dipteraMat = new THREE.PointsMaterial({
    color: 0x34d399,
    size: 0.014,
    transparent: true,
    opacity: 0.85,
  });
  const dipteraPoints = new THREE.Points(dipteraGeo, dipteraMat);
  entomologyGroup.add(dipteraPoints);

  // 3D Larval Instar Aggregation Clusters at Orifices & Abdominal Creases
  const larvalMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.35,
    metalness: 0.02,
    emissive: 0x451a03,
    emissiveIntensity: 0.15,
  });
  const larvalClusters: THREE.Mesh[] = [];
  [
    [-0.72, TABLE_SURFACE_Y + 0.215, 0.015, 0.022],
    [-0.63, TABLE_SURFACE_Y + 0.145, 0.042, 0.026],
    [-0.12, TABLE_SURFACE_Y + 0.188, 0.035, 0.038],
    [-0.06, TABLE_SURFACE_Y + 0.175, -0.045, 0.034],
  ].forEach(([lx, ly, lz, lr]) => {
    const cluster = new THREE.Mesh(
      new THREE.SphereGeometry(lr, 14, 12),
      larvalMat
    );
    cluster.position.set(lx, ly, lz);
    cluster.scale.set(1.35, 0.38, 0.95);
    entomologyGroup.add(cluster);
    larvalClusters.push(cluster);
  });
  entomologyGroup.visible = false;
  rootGroup.add(entomologyGroup);

  // ===========================================================================
  // UPDATE LOOP (Supports All 7 Structural, Dermal Skin & Biophysical Modes)
  // ===========================================================================
  const update: ForensicSubjectController['update'] = ({
    params,
    metrics,
    layerMode,
    showReferencePlanes,
    showTelemetryNodes,
    selectedRegionId,
    clock,
  }) => {
    const addVal = metrics.add;
    const massRatio = metrics.massRetentionPercent / 100;
    const gasPressure = metrics.gasPressureKpa ?? 0;
    const purgeMl = metrics.purgeFluidMl ?? 0;
    const larvalMass = metrics.entomologyLarvalMassIndex ?? 0;

    // Refresh procedural human dermal skin texture when ADD, RH, or airflow changes
    const dermalKey = `${Math.round(addVal / 3)}-${Math.round(params.humidity / 3)}-${params.airflow.toFixed(1)}`;
    if (dermalKey !== lastDermalKey) {
      lastDermalKey = dermalKey;
      const nextSkinTex = createDynamicDermalSkinTexture(
        addVal,
        params.humidity,
        params.airflow
      );
      currentDermalTex.dispose();
      currentDermalTex = nextSkinTex;
    }

    if (layerMode === 'osteology') {
      envelopeGroup.visible = false;
      wireframeGroup.visible = false;
      osteologyGroup.visible = true;
      visceralMyoGroup.visible = false;
    } else if (layerMode === 'myofascial-visceral') {
      envelopeGroup.visible = true;
      wireframeGroup.visible = false;
      osteologyGroup.visible = true;
      visceralMyoGroup.visible = true;
    } else if (layerMode === 'wireframe-shell') {
      envelopeGroup.visible = true;
      wireframeGroup.visible = true;
      wireMat.opacity = 0.46;
      osteologyGroup.visible = false;
      visceralMyoGroup.visible = false;
    } else if (layerMode === 'dermal-skin') {
      envelopeGroup.visible = true;
      wireframeGroup.visible = false;
      osteologyGroup.visible = addVal > 210; // Underlying skeleton emerges as tissue excavates
      visceralMyoGroup.visible = false;
    } else if (layerMode === 'anatomical-surface') {
      envelopeGroup.visible = true;
      wireframeGroup.visible = false;
      osteologyGroup.visible = true;
      visceralMyoGroup.visible = false;
    } else if (layerMode === 'thermal-ir') {
      envelopeGroup.visible = true;
      wireframeGroup.visible = true;
      wireMat.opacity = 0.24;
      osteologyGroup.visible = false;
      visceralMyoGroup.visible = true;
    } else {
      // 'composite'
      envelopeGroup.visible = true;
      wireframeGroup.visible = true;
      osteologyGroup.visible = true;
      visceralMyoGroup.visible = false;
      wireMat.opacity = 0.14;
    }

    const baseOpacity =
      layerMode === 'dermal-skin'
        ? 1.0
        : layerMode === 'anatomical-surface'
          ? 1.0
          : layerMode === 'thermal-ir'
            ? 1.0
            : layerMode === 'myofascial-visceral'
              ? 0.28
              : layerMode === 'wireframe-shell'
                ? 0.34
                : 0.42 + massRatio * 0.34;

    // Biophysical LWIR Thermal Infrared False-Color Mapping (driven by Henssge Algor Mortis + Microbial/Larval Thermogenesis)
    const coreDelta = metrics.algorMortisDeltaC ?? 0;
    const isAlgorWarm = metrics.simDay < 1.5 && coreDelta > 1.5;
    const isMicrobialThermogenesis = addVal > 45 && addVal < 285;
    const thermalColors: Record<AnatomicalRegionId, number> = {
      'head-neck':
        larvalMass > 35
          ? 0xf59e0b
          : isAlgorWarm
            ? 0x38bdf8
            : addVal > 75 && addVal < 250
              ? 0x22d3ee
              : 0x0284c7,
      thorax: isAlgorWarm
        ? 0xf59e0b
        : isMicrobialThermogenesis
          ? 0x22d3ee
          : 0x0ea5e9,
      'abdomen-pelvis':
        isAlgorWarm || isMicrobialThermogenesis ? 0xef4444 : 0x06b6d4,
      extremities: isAlgorWarm ? 0x0ea5e9 : 0x1d4ed8,
    };

    // Epidermal moisture clearcoat & roughness simulation (blistering/purge wetness vs dry mummification)
    const isBlisterOrPurgeWet =
      (addVal > 55 && addVal < 230) || params.humidity > 80;
    const dermalRoughness = isBlisterOrPurgeWet
      ? 0.22
      : params.humidity < 48 || params.airflow > 0.95
        ? 0.74
        : 0.38;
    const dermalClearcoat = isBlisterOrPurgeWet
      ? 0.62
      : params.humidity < 48
        ? 0.05
        : 0.24;

    (Object.keys(regionShellMats) as AnatomicalRegionId[]).forEach((rId) => {
      const mat = regionShellMats[rId];
      const isSel = rId === selectedRegionId;

      if (layerMode === 'dermal-skin') {
        mat.map = currentDermalTex;
        mat.transparent = false;
        mat.depthWrite = true;
        mat.opacity = 1.0;
        mat.roughness = dermalRoughness;
        mat.clearcoat = dermalClearcoat;
        mat.color.setHex(isSel ? 0xfff3eb : 0xffede0);
        mat.sheenColor.setHex(
          addVal < 90 ? 0xd9795d : params.humidity > 78 ? 0xc28a70 : 0x8c6246
        );
        mat.emissive.setHex(isSel ? 0x4f1e12 : 0x2d1008);
        mat.emissiveIntensity = isSel ? 0.14 : 0.09;
        mat.needsUpdate = true;
      } else if (layerMode === 'anatomical-surface') {
        mat.map = null;
        mat.transparent = false;
        mat.depthWrite = true;
        mat.opacity = 1.0;
        mat.roughness = 0.38;
        mat.clearcoat = 0.25;
        mat.color.setHex(isSel ? 0xbae6fd : 0xd8e2ec);
        mat.sheenColor.setHex(0x38bdf8);
        mat.emissive.setHex(isSel ? 0x0369a1 : 0x0f172a);
        mat.emissiveIntensity = isSel ? 0.22 : 0.1;
        mat.needsUpdate = true;
      } else if (layerMode === 'thermal-ir') {
        mat.map = null;
        mat.transparent = false;
        mat.depthWrite = true;
        mat.opacity = 1.0;
        mat.color.setHex(thermalColors[rId]);
        mat.emissive.setHex(
          rId === 'abdomen-pelvis' && (isAlgorWarm || isMicrobialThermogenesis)
            ? 0xd97706
            : isSel
              ? 0x0284c7
              : 0x0f172a
        );
        mat.emissiveIntensity =
          rId === 'abdomen-pelvis' && (isAlgorWarm || isMicrobialThermogenesis)
            ? 0.48
            : 0.22;
        mat.needsUpdate = true;
      } else {
        mat.map = null;
        mat.transparent = true;
        mat.depthWrite = false;
        mat.opacity = isSel ? Math.min(0.92, baseOpacity + 0.12) : baseOpacity;
        mat.color.setHex(isSel ? 0xbae6fd : 0xd8e2ec);
        mat.sheenColor.setHex(0x38bdf8);
        mat.emissive.setHex(isSel ? 0x0369a1 : 0x0f172a);
        mat.emissiveIntensity = isSel ? 0.24 : 0.1;
        mat.needsUpdate = true;
      }
    });

    // Animate Dermal Biophysical Vapor & VOC Plume above the skin surface
    const plumeAttr = plumeGeo.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const riseRate = 0.0015 + (params.temperature / 38) * 0.0035;
    const driftRate = params.airflow * 0.008;
    for (let i = 0; i < plumeCount; i++) {
      let px = plumeAttr.getX(i) + driftRate;
      let py = plumeAttr.getY(i) + riseRate;
      const pz =
        plumeAttr.getZ(i) + Math.sin(clock * 2 + i * 0.7) * 0.0008;
      if (py > TABLE_SURFACE_Y + 0.56 || px > 0.85) {
        px = -0.7 + ((i * 19) % 100) * 0.013;
        py = TABLE_SURFACE_Y + 0.12;
      }
      plumeAttr.setXYZ(i, px, py, pz);
    }
    plumeAttr.needsUpdate = true;
    plumeMat.opacity =
      addVal > 30 && addVal < 360
        ? Math.min(0.55, 0.16 + (metrics.microbialIndex / 100) * 0.35)
        : 0.1;
    plumeMat.color.setHex(
      addVal > 85 && addVal < 265 ? 0x22d3ee : 0x7dd3fc
    );

    // Update 3D Cadaveric Purge Fluid Pool on Table Surface (ADD > 55)
    if (purgeMl > 25 && layerMode !== 'osteology') {
      purgeFluidGroup.visible = true;
      const poolFraction = Math.min(1.0, purgeMl / 2400);
      purgeFluidMat.opacity = Math.min(0.82, 0.18 + poolFraction * 0.64);
      centralPurgePool.scale.set(
        0.55 + poolFraction * 1.25,
        0.35 + poolFraction * 0.58,
        1
      );
      cranialPurgePool.scale.set(
        0.45 + poolFraction * 0.85,
        0.4 + poolFraction * 0.65,
        1
      );
    } else {
      purgeFluidGroup.visible = false;
    }

    // Update 3D Forensic Entomology (Calliphoridae Diptera & Larval Instar Masses)
    if (
      params.roomCondition !== 'Sealed Indoor Chamber' &&
      larvalMass > 5 &&
      layerMode !== 'osteology'
    ) {
      entomologyGroup.visible = true;
      const dipAttr = dipteraGeo.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      for (let i = 0; i < dipteraCount; i++) {
        const angle = clock * (2.4 + (i % 5) * 0.35) + i * 1.1;
        const centerX = i % 2 === 0 ? -0.68 : -0.12;
        const radiusX = 0.12 + (i % 4) * 0.04;
        const radiusZ = 0.08 + (i % 3) * 0.045;
        dipAttr.setXYZ(
          i,
          centerX + Math.cos(angle) * radiusX,
          TABLE_SURFACE_Y +
            0.22 +
            Math.abs(Math.sin(angle * 1.7)) * 0.14,
          Math.sin(angle) * radiusZ
        );
      }
      dipAttr.needsUpdate = true;
      const clusterScale = Math.max(0.2, (larvalMass / 100) * 1.35);
      larvalClusters.forEach((c, idx) => {
        const pulse = 1.0 + Math.sin(clock * 6.5 + idx) * 0.08;
        c.scale.set(
          1.35 * clusterScale * pulse,
          0.38 * clusterScale,
          0.95 * clusterScale * pulse
        );
      });
    } else {
      entomologyGroup.visible = false;
    }

    // =========================================================================
    // REAL-TIME 3D MULTI-STAGE BIOPHYSICAL VERTEX MORPHING
    // =========================================================================
    // 1. Gas Distension Factor (Stage 2 Bloating, driven by gasPressureKpa)
    const bloatFactor = Math.min(1.0, gasPressure / 16.5);
    // 2. Soft-Tissue Excavation / Collapse Factor (Stages 3–5 Active/Advanced Decay)
    const collapseFactor =
      addVal > 125 ? Math.min(1.0, (addVal - 125) / 260) : 0;

    // A. Morph Sculpted Head & Facial Soft Tissue (Periorbital/Buccal Bloat -> Orbital & Cheek Excavation)
    const headPos = sculptedHeadGeo.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    for (let i = 0; i < headPos.count; i++) {
      const hx = headBasePositions[i * 3];
      let hy = headBasePositions[i * 3 + 1];
      let hz = headBasePositions[i * 3 + 2];
      // Facial anterior surface (hy > 0.01)
      if (hy > 0.005) {
        const isOrbitOrCheek = hx > -0.02 && hx < 0.068 && Math.abs(hz) < 0.062;
        if (isOrbitOrCheek) {
          hy += bloatFactor * 0.0045 - collapseFactor * 0.0095;
        }
        // Temporal & Buccal lateral width
        hz *= 1.0 + bloatFactor * 0.055 - collapseFactor * 0.085;
      }
      headPos.setXYZ(i, hx, hy, hz);
    }
    headPos.needsUpdate = true;
    sculptedHeadGeo.computeVertexNormals();

    // B. Morph Thorax (Subcutaneous Emphysema Bloat -> Intercostal Rib-Space Excavation in Late Stages)
    const thPos = thoraxLoft.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const baseTh = thoraxLoft.basePositions;
    // Subtle baseline calibration micro-respiration at Day 0.0 (< 2 ADD)
    const baselineBreath =
      addVal < 2.0 ? Math.sin(clock * 2.2) * 0.0035 : 0;
    for (let k = 0; k < thPos.count; k++) {
      const bx = baseTh[k * 3];
      const by = baseTh[k * 3 + 1];
      const bz = baseTh[k * 3 + 2];
      const hAbove = Math.max(0, by - TABLE_SURFACE_Y);
      // Pin cranial seam at x = -0.55 and caudal seam at x = -0.23 for 100% watertight boundaries
      const thSeam =
        Math.min(1, Math.max(0, (bx - -0.55) / 0.045)) *
        Math.min(1, Math.max(0, (-0.23 - bx) / 0.045));
      // Intercostal rib flutes emerge as soft tissue thins (collapseFactor)
      const ribWave = Math.sin((bx + 0.53) * 115) * 0.0042 * collapseFactor;
      const thScaleY =
        1.0 +
        (bloatFactor * 0.095 - collapseFactor * 0.14 + baselineBreath) *
          thSeam;
      thPos.setXYZ(
        k,
        bx,
        TABLE_SURFACE_Y + hAbove * thScaleY + ribWave * thSeam,
        bz * (1.0 + (bloatFactor * 0.06 - collapseFactor * 0.09) * thSeam)
      );
    }
    thPos.needsUpdate = true;
    thoraxLoft.geometry.computeVertexNormals();

    // C. Morph Abdomen (Anaerobic Gas Dome Distension -> Post-Purge Scaphoid Collapse)
    const abPos = abdomenLoft.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const baseAb = abdomenLoft.basePositions;
    const abDeltaY = bloatFactor * 0.28 - collapseFactor * 0.34;
    for (let k = 0; k < abPos.count; k++) {
      const bx = baseAb[k * 3];
      const by = baseAb[k * 3 + 1];
      const bz = baseAb[k * 3 + 2];
      const heightAboveTable = Math.max(0, by - TABLE_SURFACE_Y);
      // Smoothly pin boundary at x = -0.23 (seamWeight = 0) and peak around umbilical region (x = -0.09)
      const seamWeight = Math.min(1, Math.max(0, (bx - -0.23) / 0.065));
      const axialFactor =
        seamWeight * Math.exp(-Math.pow((bx - -0.085) * 5.2, 2));
      const newHeight = heightAboveTable * (1 + abDeltaY * axialFactor);
      abPos.setXYZ(
        k,
        bx,
        TABLE_SURFACE_Y + newHeight,
        bz * (1 + abDeltaY * 0.22 * axialFactor)
      );
    }
    abPos.needsUpdate = true;
    abdomenLoft.geometry.computeVertexNormals();
    // Copy exact vertex normals from thoraxLoft's caudal ring (x = -0.23) so the thorax-abdomen seam is 100% invisible
    const abNorm = abdomenLoft.geometry.getAttribute(
      'normal'
    ) as THREE.BufferAttribute;
    const thNorm = thoraxLoft.geometry.getAttribute(
      'normal'
    ) as THREE.BufferAttribute;
    const thLastRingOffset = 26 * 41;
    for (let j = 0; j <= 40; j++) {
      abNorm.setXYZ(
        j,
        thNorm.getX(thLastRingOffset + j),
        thNorm.getY(thLastRingOffset + j),
        thNorm.getZ(thLastRingOffset + j)
      );
    }
    abNorm.needsUpdate = true;

    // D. Morph Upper & Lower Extremities (Rigor Tension, Bloat Swelling & Late-Stage Muscle Atrophy)
    const rigorBoost = ((metrics.rigorMortisPercent ?? 0) / 100) * 0.035;
    const limbSoftScale =
      1.0 + bloatFactor * 0.065 + rigorBoost - collapseFactor * 0.22;

    armGeometries.forEach(({ geo, basePositions, side }) => {
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const ax = basePositions[i * 3];
        const ay = basePositions[i * 3 + 1];
        const az = basePositions[i * 3 + 2];
        // Pin proximal shoulder root (ax < -0.44) and distal hand (ax > 0.02)
        const muscleWeight =
          Math.min(1, Math.max(0, (ax - -0.44) / 0.08)) *
          Math.min(1, Math.max(0, (0.04 - ax) / 0.06));
        const u = Math.max(0, Math.min(1, (ax - -0.47) / 0.574));
        const cy = TABLE_SURFACE_Y + 0.082 * (1 - u) + 0.027 * u;
        const cz = side * (0.205 + u * 0.055);
        const s = 1.0 + (limbSoftScale - 1.0) * muscleWeight;
        posAttr.setXYZ(i, ax, cy + (ay - cy) * s, cz + (az - cz) * s);
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    });

    legGeometries.forEach(({ geo, basePositions, side }) => {
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const lx = basePositions[i * 3];
        const ly = basePositions[i * 3 + 1];
        const lz = basePositions[i * 3 + 2];
        // Pin proximal hip root (lx < 0.14) and distal ankle/foot (lx > 0.72)
        const muscleWeight =
          Math.min(1, Math.max(0, (lx - 0.12) / 0.08)) *
          Math.min(1, Math.max(0, (0.74 - lx) / 0.08));
        const cy = TABLE_SURFACE_Y + 0.068;
        const cz = side * 0.102;
        const s = 1.0 + (limbSoftScale - 1.0) * muscleWeight;
        posAttr.setXYZ(i, lx, cy + (ly - cy) * s, cz + (lz - cz) * s);
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    });

    // Apply uniform lateral contraction across neck, thorax, abdomen, and clinical brief so vertex rings stay seamlessly locked
    const torsoContraction = 0.88 + massRatio * 0.12;
    neckEnv.mesh.scale.set(1.0, 1.0, torsoContraction);
    neckEnv.wMesh.scale.set(1.003, 1.003, torsoContraction * 1.003);
    thoraxEnv.mesh.scale.set(1.0, 1.0, torsoContraction);
    thoraxEnv.wMesh.scale.set(1.003, 1.003, torsoContraction * 1.003);
    abdomenEnv.mesh.scale.set(1.0, 1.0, torsoContraction);
    abdomenEnv.wMesh.scale.set(1.003, 1.003, torsoContraction * 1.003);
    clinicalBriefMesh.scale.set(1.0, 1.0, torsoContraction);
    clinicalBriefMesh.visible =
      layerMode === 'dermal-skin' || layerMode === 'anatomical-surface';

    // Dynamic Enteric & Colonic Gaseous Distension + Sulfhemoglobin Shift
    const entericGasScale =
      1.0 + bloatFactor * 0.28 - collapseFactor * 0.32;
    colonFrameMesh.scale.set(1.0, entericGasScale, entericGasScale);
    entericCoreMesh.scale.set(1.0, entericGasScale, entericGasScale);
    stomachMesh.scale.set(1.0, 1.0 + bloatFactor * 0.22, 1.0 + bloatFactor * 0.22);

    if (addVal > 42 && addVal < 280) {
      colonMat.color.setHex(0x6e7d52);
      entericMat.color.setHex(0x8c8a5b);
      entericMat.emissiveIntensity = 0.22 + Math.sin(clock * 3.2) * 0.06;
    } else {
      colonMat.color.setHex(0xb07c68);
      entericMat.color.setHex(0xc78d75);
      entericMat.emissiveIntensity = 0.15;
    }

    // Sweep LiDAR transverse slice smoothly along the body axis (-0.85m to +0.85m)
    const sweepX = Math.sin(clock * 0.65) * 0.84;
    lidarSlice.position.x = sweepX;
    lidarEdges.position.x = sweepX;

    planesGroup.visible = showReferencePlanes;
    telemetryGroup.visible = showTelemetryNodes;

    (Object.keys(nodeRings) as AnatomicalRegionId[]).forEach((regId) => {
      const ring = nodeRings[regId];
      const isSelected = regId === selectedRegionId;
      const pulse = isSelected ? 1.25 + Math.sin(clock * 3.8) * 0.18 : 0.85;
      ring.scale.set(pulse, pulse, 1);
      (ring.material as THREE.MeshBasicMaterial).color.setHex(
        isSelected ? 0x22d3ee : 0x64748b
      );
    });
  };

  return {
    rootGroup,
    interactiveMeshes,
    update,
  };
}

export interface ForensicSubjectModelProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  selectedRegionId?: AnatomicalRegionId;
  onSelectRegion?: (regionId: AnatomicalRegionId) => void;
  isLightMode?: boolean;
  compact?: boolean;
  examTableGroup?: THREE.Group | null;
  layerMode?: StructuralLayerMode;
  showReferencePlanes?: boolean;
  showTelemetryNodes?: boolean;
}

export const ForensicSubjectModel: React.FC<ForensicSubjectModelProps> = ({
  params,
  metrics,
  selectedRegionId: externalRegionId,
  onSelectRegion,
  isLightMode = false,
  compact = false,
  examTableGroup = null,
  layerMode: externalLayerMode,
  showReferencePlanes: externalShowPlanes,
  showTelemetryNodes: externalShowNodes,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [internalRegionId, setInternalRegionId] =
    useState<AnatomicalRegionId>('abdomen-pelvis');
  const activeRegionId = externalRegionId || internalRegionId;

  const [internalLayerMode, setInternalLayerMode] =
    useState<StructuralLayerMode>('dermal-skin');
  const layerMode = externalLayerMode || internalLayerMode;

  const [internalPlanes, setInternalPlanes] = useState<boolean>(true);
  const showReferencePlanes =
    externalShowPlanes !== undefined ? externalShowPlanes : internalPlanes;

  const [internalNodes, setInternalNodes] = useState<boolean>(true);
  const showTelemetryNodes =
    externalShowNodes !== undefined ? externalShowNodes : internalNodes;

  const [cameraAzimuth, setCameraAzimuth] = useState<number>(0.36);
  const [cameraElevation, setCameraElevation] = useState<number>(0.54);
  const [cameraDistance, setCameraDistance] = useState<number>(2.35);
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegionId | null>(
    null
  );
  const [viewportHeight, setViewportHeight] = useState<number>(
    compact ? 360 : 480
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isResizingHeight, setIsResizingHeight] = useState<boolean>(false);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  const startHeightResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startH = viewportHeight;
    setIsResizingHeight(true);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const clientY =
        'touches' in ev
          ? ev.touches[0]?.clientY ?? startY
          : (ev as MouseEvent).clientY;
      const nextH = Math.max(280, Math.min(860, startH + (clientY - startY)));
      setViewportHeight(nextH);
    };

    const onEnd = () => {
      setIsResizingHeight(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handleSelectRegion = (regId: AnatomicalRegionId) => {
    setInternalRegionId(regId);
    if (onSelectRegion) onSelectRegion(regId);
  };

  const attachedControllerRef = useRef<ForensicSubjectController | null>(null);

  useEffect(() => {
    if (!examTableGroup) return;
    const controller = createForensicSubject3DGroup(false);
    attachedControllerRef.current = controller;
    examTableGroup.add(controller.rootGroup);

    return () => {
      examTableGroup.remove(controller.rootGroup);
      attachedControllerRef.current = null;
    };
  }, [examTableGroup]);

  useEffect(() => {
    if (!attachedControllerRef.current) return;
    attachedControllerRef.current.update({
      params,
      metrics,
      layerMode,
      showReferencePlanes,
      showTelemetryNodes,
      selectedRegionId: activeRegionId,
      clock: performance.now() * 0.001,
    });
  }, [
    params,
    metrics,
    layerMode,
    showReferencePlanes,
    showTelemetryNodes,
    activeRegionId,
  ]);

  const stateRef = useRef({
    params,
    metrics,
    layerMode,
    showReferencePlanes,
    showTelemetryNodes,
    activeRegionId,
    cameraAzimuth,
    cameraElevation,
    cameraDistance,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      params,
      metrics,
      layerMode,
      showReferencePlanes,
      showTelemetryNodes,
      activeRegionId,
      cameraAzimuth,
      cameraElevation,
      cameraDistance,
    };
  }, [
    params,
    metrics,
    layerMode,
    showReferencePlanes,
    showTelemetryNodes,
    activeRegionId,
    cameraAzimuth,
    cameraElevation,
    cameraDistance,
  ]);

  useEffect(() => {
    if (examTableGroup) return;
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.16;
    } catch {
      return;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xf1f5f9 : 0x060b16);
    const envTex = createSurgicalEnvMap(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );

    const hemi = new THREE.HemisphereLight(0xfff5eb, 0x261e1b, 1.08);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffaf2, 2.05);
    keyLight.position.set(1.5, 3.2, 2.2);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const warmFill = new THREE.PointLight(0xffdfb8, 1.15, 6);
    warmFill.position.set(0, 1.85, 1.2);
    scene.add(warmFill);

    const rimLight = new THREE.PointLight(0xffe4c4, 0.95, 6);
    rimLight.position.set(-1.6, 1.8, -1.4);
    scene.add(rimLight);

    const subjectController = createForensicSubject3DGroup(true);
    scene.add(subjectController.rootGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (stateRef.current.isDragging) {
        const dx = e.clientX - stateRef.current.lastX;
        const dy = e.clientY - stateRef.current.lastY;
        stateRef.current.lastX = e.clientX;
        stateRef.current.lastY = e.clientY;
        setCameraAzimuth((a) => a - dx * 0.007);
        setCameraElevation((el) =>
          Math.max(0.18, Math.min(1.42, el + dy * 0.006))
        );
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(
        subjectController.interactiveMeshes,
        false
      );
      if (hits.length > 0) {
        const reg = hits[0].object.userData.regionId as
          | AnatomicalRegionId
          | undefined;
        setHoveredRegion(reg || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredRegion(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const delta =
        Math.abs(e.clientX - stateRef.current.lastX) +
        Math.abs(e.clientY - stateRef.current.lastY);
      stateRef.current.isDragging = false;
      if (delta < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(
          subjectController.interactiveMeshes,
          false
        );
        if (hits.length > 0) {
          const reg = hits[0].object.userData.regionId as
            | AnatomicalRegionId
            | undefined;
          if (reg) handleSelectRegion(reg);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCameraDistance((d) =>
        Math.max(1.35, Math.min(4.2, d + (e.deltaY > 0 ? 0.22 : -0.22)))
      );
    };

    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.lastX = e.touches[0].clientX;
        stateRef.current.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        stateRef.current.isDragging = false;
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && stateRef.current.isDragging) {
        e.preventDefault();
        const dx = e.touches[0].clientX - stateRef.current.lastX;
        const dy = e.touches[0].clientY - stateRef.current.lastY;
        stateRef.current.lastX = e.touches[0].clientX;
        stateRef.current.lastY = e.touches[0].clientY;
        setCameraAzimuth((a) => a - dx * 0.007);
        setCameraElevation((el) =>
          Math.max(0.18, Math.min(1.42, el + dy * 0.006))
        );
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
          const delta = lastPinchDist - dist;
          setCameraDistance((d) =>
            Math.max(1.35, Math.min(4.2, d + delta * 0.008))
          );
        }
        lastPinchDist = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      stateRef.current.isDragging = false;
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const delta =
          Math.abs(t.clientX - stateRef.current.lastX) +
          Math.abs(t.clientY - stateRef.current.lastY);
        if (delta < 8) {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(
            subjectController.interactiveMeshes,
            false
          );
          if (hits.length > 0) {
            const reg = hits[0].object.userData.regionId as
              | AnatomicalRegionId
              | undefined;
            if (reg) handleSelectRegion(reg);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    let clock = 0;
    let curAz = stateRef.current.cameraAzimuth;
    let curEl = stateRef.current.cameraElevation;
    let curDist = stateRef.current.cameraDistance;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.025;

      const {
        params: curParams,
        metrics: curMetrics,
        layerMode: curLayer,
        showReferencePlanes: curPlanes,
        showTelemetryNodes: curNodes,
        activeRegionId: curReg,
        cameraAzimuth: targetAz,
        cameraElevation: targetEl,
        cameraDistance: targetDist,
      } = stateRef.current;

      // Smooth damped camera motion + responsive aspect ratio compensation on narrow viewports
      const aspectScale =
        camera.aspect < 1.15
          ? Math.min(1.45, 1.15 / Math.max(0.5, camera.aspect))
          : 1.0;
      const effectiveTargetDist = targetDist * aspectScale;

      curAz += (targetAz - curAz) * 0.14;
      curEl += (targetEl - curEl) * 0.14;
      curDist += (effectiveTargetDist - curDist) * 0.14;

      camera.position.x = Math.sin(curAz) * Math.cos(curEl) * curDist;
      camera.position.y = 0.92 + Math.sin(curEl) * curDist;
      camera.position.z = Math.cos(curAz) * Math.cos(curEl) * curDist;
      camera.lookAt(0, 0.92, 0);

      subjectController.update({
        params: curParams,
        metrics: curMetrics,
        layerMode: curLayer,
        showReferencePlanes: curPlanes,
        showTelemetryNodes: curNodes,
        selectedRegionId: curReg,
        clock,
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [examTableGroup, isLightMode]);

  if (examTableGroup) {
    return null;
  }

  const activeRegion =
    ANATOMICAL_REGIONS.find((r) => r.id === activeRegionId) ||
    ANATOMICAL_REGIONS[2];
  const activeData = activeRegion.getScoreAndFindings(params, metrics);

  const totalTbs = ANATOMICAL_REGIONS.reduce(
    (acc, r) => acc + r.getScoreAndFindings(params, metrics).score,
    0
  );

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isExpanded
          ? 'fixed inset-2 sm:inset-4 z-50 flex flex-col shadow-2xl'
          : ''
      } ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0B1120] border-slate-800 text-slate-100'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-950 border-slate-800/80 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Scan
            className={`w-4 h-4 shrink-0 ${
              isLightMode ? 'text-cyan-600' : 'text-cyan-400'
            }`}
          />
          <span
            className={`text-xs font-mono tracking-wider font-semibold truncate ${
              isLightMode ? 'text-slate-900' : 'text-cyan-300'
            }`}
          >
            FORENSIC SUBJECT MODEL · 3D ANATOMICAL SCANNER
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
            Composite TBS:{' '}
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-300'}
            >
              {totalTbs}/47
            </strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          {/* Height Size Presets & Expand Button */}
          {!isExpanded && (
            <div className="flex items-center gap-1">
              {[
                { label: 'S', h: 360 },
                { label: 'M', h: 480 },
                { label: 'L', h: 640 },
              ].map((sz) => (
                <button
                  key={sz.label}
                  type="button"
                  onClick={() => setViewportHeight(sz.h)}
                  title={`Set 3D Scanner height to ${sz.h}px`}
                  className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors ${
                    Math.abs(viewportHeight - sz.h) < 30
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                      : isLightMode
                        ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className={`px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${
              isLightMode
                ? 'bg-white border-slate-300 text-slate-700 hover:border-cyan-500'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400'
            }`}
            title={
              isExpanded ? 'Exit Fullscreen (Esc)' : 'Expand 3D Scanner View'
            }
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structural Layer Controls Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b text-xs ${
          isLightMode
            ? 'bg-white border-slate-200'
            : 'bg-slate-900/90 border-slate-800/60'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-xs font-mono mr-1 font-medium ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            LAYER:
          </span>
          {(
            [
              { id: 'dermal-skin', label: 'Realistic Skin' },
              { id: 'composite', label: 'Composite X-Ray' },
              { id: 'anatomical-surface', label: 'Sculpted Surface' },
              { id: 'osteology', label: '3D Skeleton' },
              { id: 'myofascial-visceral', label: 'Organs & Vessels' },
              { id: 'thermal-ir', label: 'LWIR Thermal' },
              { id: 'wireframe-shell', label: 'LiDAR Mesh' },
            ] as { id: StructuralLayerMode; label: string }[]
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setInternalLayerMode(mode.id)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs border transition-colors whitespace-nowrap ${
                layerMode === mode.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                  : isLightMode
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setInternalPlanes((p) => !p)}
            className={`px-2.5 py-1 rounded-md font-mono text-xs border transition-colors whitespace-nowrap ${
              showReferencePlanes
                ? isLightMode
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-semibold'
                  : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {showReferencePlanes ? 'LiDAR Slice: ON' : 'LiDAR Slice: OFF'}
          </button>
          <button
            type="button"
            onClick={() => setInternalNodes((n) => !n)}
            className={`px-2.5 py-1 rounded-md font-mono text-xs border transition-colors whitespace-nowrap ${
              showTelemetryNodes
                ? isLightMode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                  : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                : isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {showTelemetryNodes ? 'Nodes: ON' : 'Nodes: OFF'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCameraAzimuth(0.36);
              setCameraElevation(0.54);
              setCameraDistance(2.35);
            }}
            className={`px-2.5 py-1 rounded-md font-mono text-xs border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Reset 3D Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Structural Anatomy Viewport */}
      <div
        style={isExpanded ? undefined : { height: `${viewportHeight}px` }}
        className={`relative w-full ${
          isExpanded ? 'flex-1 min-h-[340px]' : ''
        } select-none transition-[height] duration-75`}
      >
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1.5">
          <div
            className={`flex items-center gap-2 backdrop-blur-md border px-3 py-1.5 rounded-lg text-xs font-mono ${
              isLightMode
                ? 'bg-white/95 border-slate-300 text-slate-900 shadow-xs'
                : 'bg-slate-950/85 border-slate-800 text-slate-200'
            }`}
          >
            <Crosshair
              className={`w-3.5 h-3.5 ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            />
            <span>
              {hoveredRegion
                ? `Inspecting: ${
                    ANATOMICAL_REGIONS.find((r) => r.id === hoveredRegion)
                      ?.title
                  }`
                : `Active Region: ${activeRegion.shortLabel}`}
            </span>
          </div>
          <div
            className={`backdrop-blur-md border px-3 py-1 rounded-lg text-xs font-mono font-medium ${
              isLightMode
                ? 'bg-white/95 border-slate-300 text-cyan-800 shadow-xs'
                : 'bg-slate-950/80 border-slate-800/80 text-cyan-300'
            }`}
          >
            Core: {metrics.coreBodyTempC}°C · Rigor: {metrics.rigorMortisPercent}% · Livor:{' '}
            {metrics.livorMortisFixationPercent}% · Gas: +{metrics.gasPressureKpa} kPa
          </div>
          <div
            className={`backdrop-blur-md border px-3 py-1 rounded-lg text-xs font-mono ${
              isLightMode
                ? 'bg-white/95 border-slate-300 text-slate-700 shadow-xs'
                : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
            }`}
          >
            Mass: {metrics.massRetentionPercent}% · Purge: {metrics.purgeFluidMl} mL · Megyesi TBS:{' '}
            {metrics.megyesiTbs}/35
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div
            className={`flex items-center gap-1 pointer-events-auto backdrop-blur-md border p-1 rounded-lg text-xs font-mono ${
              isLightMode
                ? 'bg-white/95 border-slate-300 text-slate-800 shadow-xs'
                : 'bg-slate-950/85 border-slate-800 text-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setCameraAzimuth(0.36);
                setCameraElevation(0.54);
                setCameraDistance(2.35);
              }}
              className={`px-2.5 py-1 rounded ${
                isLightMode
                  ? 'text-slate-700 hover:text-cyan-700'
                  : 'text-slate-200 hover:text-cyan-300'
              }`}
            >
              Oblique
            </button>
            <button
              type="button"
              onClick={() => {
                setCameraAzimuth(0.0);
                setCameraElevation(1.38);
                setCameraDistance(2.4);
              }}
              className={`px-2.5 py-1 rounded ${
                isLightMode
                  ? 'text-slate-700 hover:text-cyan-700'
                  : 'text-slate-200 hover:text-cyan-300'
              }`}
            >
              Top (Coronal)
            </button>
            <button
              type="button"
              onClick={() => {
                setCameraAzimuth(0.0);
                setCameraElevation(0.2);
                setCameraDistance(2.3);
              }}
              className={`px-2.5 py-1 rounded ${
                isLightMode
                  ? 'text-slate-700 hover:text-cyan-700'
                  : 'text-slate-200 hover:text-cyan-300'
              }`}
            >
              Side (Sagittal)
            </button>
          </div>

          <div
            className={`flex items-center gap-1 pointer-events-auto backdrop-blur-md border px-2.5 py-1 rounded-lg text-xs font-mono ${
              isLightMode
                ? 'bg-white/95 border-slate-300 text-slate-800 shadow-xs'
                : 'bg-slate-950/85 border-slate-800 text-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setCameraDistance((d) => Math.max(1.35, d - 0.35))
              }
              className={`px-1.5 ${
                isLightMode
                  ? 'text-slate-700 hover:text-cyan-700'
                  : 'text-slate-200 hover:text-cyan-300'
              }`}
            >
              Zoom +
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setCameraDistance((d) => Math.min(4.2, d + 0.35))}
              className={`px-1.5 ${
                isLightMode
                  ? 'text-slate-700 hover:text-cyan-700'
                  : 'text-slate-200 hover:text-cyan-300'
              }`}
            >
              Zoom −
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Vertical Height Resize Handle Bar */}
      {!isExpanded && (
        <div
          onMouseDown={startHeightResize}
          onTouchStart={startHeightResize}
          onDoubleClick={() => setViewportHeight(compact ? 360 : 480)}
          title="Drag vertically to resize 3D viewport height (double-click to reset)"
          className={`w-full h-3.5 cursor-row-resize flex items-center justify-center border-t transition-colors select-none ${
            isResizingHeight
              ? 'bg-cyan-500/25 border-cyan-400'
              : isLightMode
                ? 'bg-slate-100 hover:bg-cyan-50 border-slate-200'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
          }`}
        >
          <GripHorizontal
            className={`w-4 h-3.5 ${
              isResizingHeight
                ? 'text-cyan-400'
                : isLightMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
            }`}
          />
        </div>
      )}

      {/* Structural Region Selector & Findings Footer */}
      <div
        className={`p-5 border-t ${
          isLightMode
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-950/90 border-slate-800'
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {ANATOMICAL_REGIONS.map((reg) => {
            const isSelected = reg.id === activeRegion.id;
            const regScore = reg.getScoreAndFindings(params, metrics).score;
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => handleSelectRegion(reg.id)}
                className={`px-3 py-2 rounded-lg font-mono text-xs border transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                    : isLightMode
                      ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="truncate">{reg.shortLabel}</span>
                <span
                  className={`text-xs ml-1.5 ${
                    isSelected
                      ? 'text-slate-950'
                      : isLightMode
                        ? 'text-cyan-600'
                        : 'text-cyan-400'
                  }`}
                >
                  {regScore}/{reg.megyesiMaxScore}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 text-sm">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 font-mono text-xs ${
              isLightMode ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <span>
              Structural Landmarks:{' '}
              <strong
                className={isLightMode ? 'text-slate-900' : 'text-slate-200'}
              >
                {activeRegion.structuralLandmarks}
              </strong>
            </span>
            <span
              className={`font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              Compartment Temp: {activeData.localTemp}
            </span>
          </div>
          <p
            className={`leading-relaxed ${
              isLightMode ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            <strong>Structural & Volumetric State:</strong>{' '}
            {activeData.tissueState}
          </p>
          <p
            className={`leading-relaxed ${
              isLightMode ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <strong>Biophysical Mechanism:</strong> {activeData.internalProcess}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForensicSubjectModel;
