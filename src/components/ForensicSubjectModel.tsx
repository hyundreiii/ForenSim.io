import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EnvironmentalParams } from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import { Crosshair, RotateCcw, Scan } from 'lucide-react';

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
 * Procedurally generates a continuous, anatomically sculpted supine human torso section
 * with exact vertex-ring continuity across cervical neck (-0.72), thorax (-0.55 to -0.23),
 * and abdomen/pelvis (-0.23 to +0.165), sculpting sternocleidomastoid, jugular notch,
 * clavicles, pectoralis major, serratus anterior, costal margin, rectus abdominis,
 * obliques, umbilicus, iliac crests, and inguinal-gluteal contours.
 */
function createSculptedTorsoSectionGeometry(
  xStart: number,
  xEnd: number,
  slices: number,
  radialSegments: number,
  tableSurfaceY: number,
  closeStartCap = false,
  closeEndCap = false
): {
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
} {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Unified anatomical profile function along X from cranial neck base (-0.72) to pelvic perineum (+0.165)
  const getSectionProfile = (x: number) => {
    const t = Math.max(0, Math.min(1, (x - -0.72) / 0.885));

    let halfWidth = 0.058;
    if (t < 0.13) {
      // Suboccipital & cervical neck column
      const s = t / 0.13;
      halfWidth = 0.057 + Math.pow(s, 1.45) * 0.017;
    } else if (t < 0.25) {
      // Trapezius slope & broad clavicular / acromial shoulder flare
      const s = (t - 0.13) / 0.12;
      halfWidth = 0.074 + Math.sin(s * (Math.PI / 2)) * 0.138;
    } else if (t < 0.54) {
      // Broad upper chest / pectoralis & latissimus dorsi V-taper to lower ribs
      const s = (t - 0.25) / 0.29;
      halfWidth = 0.212 - Math.pow(s, 0.88) * 0.054;
    } else if (t < 0.76) {
      // Natural external oblique waist curve expanding to iliac crest
      const s = (t - 0.54) / 0.22;
      halfWidth = 0.158 - Math.sin(s * Math.PI) * 0.013 + s * 0.025;
    } else {
      // Iliac crest & greater trochanter pelvic contour tapering smoothly into thighs
      const s = (t - 0.76) / 0.24;
      halfWidth = 0.183 * Math.cos(s * 1.08);
    }

    let thickness = 0.116;
    let dorsalLift = 0.0;
    if (t < 0.13) {
      // Cervical lordosis arch rising smoothly into the submental jaw & occipital base
      const s = t / 0.13;
      thickness = 0.115 + s * 0.021;
      dorsalLift = (1 - s) * 0.052 + 0.012;
    } else if (t < 0.25) {
      // Cervicothoracic transition to manubrium sterni
      const s = (t - 0.13) / 0.12;
      thickness = 0.136 + Math.sin(s * (Math.PI / 2)) * 0.068;
      dorsalLift = (1 - s) * 0.012;
    } else if (t < 0.54) {
      // Pectoral & thoracic ribcage anteroposterior depth
      const s = (t - 0.25) / 0.29;
      thickness = 0.204 + Math.sin(s * Math.PI) * 0.019 - s * 0.018;
    } else if (t < 0.8) {
      // Abdominal wall & rectus abdominis profile
      const s = (t - 0.54) / 0.26;
      thickness = 0.186 + Math.sin(s * Math.PI) * 0.01 - s * 0.016;
    } else {
      // Pelvic pubic symphysis & gluteal curve
      const s = (t - 0.8) / 0.2;
      thickness = 0.17 * Math.cos(s * 1.06);
    }

    return {
      halfWidth: Math.max(0.024, halfWidth),
      thickness: Math.max(0.032, thickness),
      dorsalLift,
      t,
    };
  };

  for (let i = 0; i <= slices; i++) {
    const u = i / slices;
    const x = xStart + u * (xEnd - xStart);
    const { halfWidth, thickness, dorsalLift, t } = getSectionProfile(x);

    const capScale =
      closeStartCap && i === 0
        ? 0.68
        : closeEndCap && i === slices
          ? 0.34
          : 1.0;

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2; // 0 = anterior top, PI = dorsal bottom on table

      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const absSin = Math.abs(sinT);

      // Squarer anatomical shoulder/ribcage cross-section
      const lateralExpand =
        1.0 + 0.09 * Math.pow(absSin, 1.55) * Math.max(0, cosT);
      let z = sinT * halfWidth * lateralExpand * capScale;
      let yOffset = 0;

      if (cosT >= 0) {
        yOffset = (0.48 + 0.52 * Math.pow(cosT, 0.72)) * thickness * capScale;

        const midlineGroove = Math.exp(-Math.pow(sinT * 5.4, 2));
        if (t < 0.16) {
          // Sternocleidomastoid V-relief, jugular notch hollow & laryngeal prominence
          const scmRidge = Math.exp(-Math.pow((absSin - 0.38) * 5.8, 2));
          const larynx =
            Math.exp(-Math.pow((t - 0.065) * 26, 2)) * midlineGroove;
          const jugularNotch =
            Math.exp(-Math.pow((t - 0.15) * 32, 2)) * midlineGroove;
          yOffset +=
            (scmRidge * 0.0065 + larynx * 0.0075 - jugularNotch * 0.0055) *
            capScale;
        } else if (t >= 0.16 && t < 0.25) {
          // S-curved Clavicular ridge + Supraclavicular fossa hollow
          const clavFactor = Math.exp(-Math.pow((t - 0.205) * 28, 2));
          const supraFossa =
            Math.exp(-Math.pow((t - 0.175) * 32, 2)) *
            Math.exp(-Math.pow((absSin - 0.52) * 5.0, 2));
          yOffset +=
            (clavFactor * 0.0095 * Math.pow(absSin, 0.48) -
              supraFossa * 0.005) *
            capScale;
        } else if (t >= 0.25 && t < 0.52) {
          // Anatomical Pectoralis Major muscle bellies, Sternal Sulcus & Serratus Anterior ribs
          const pecBell = Math.sin(((t - 0.25) / 0.27) * Math.PI);
          const lateralPec = Math.sin(Math.min(1, absSin * 1.3) * Math.PI);
          const serratus =
            absSin > 0.65
              ? Math.sin((t - 0.32) * 85) *
                Math.exp(-Math.pow((absSin - 0.78) * 7, 2)) *
                0.0028
              : 0;
          yOffset +=
            (pecBell * (0.026 * lateralPec - 0.015 * midlineGroove) +
              serratus) *
            capScale;
          // Subtle anatomical nipple/areolar elevation at t = 0.39, absSin = 0.52
          const nipDist = Math.hypot((t - 0.39) * 18, (absSin - 0.52) * 8.5);
          if (nipDist < 1.2) {
            yOffset +=
              Math.cos((nipDist / 1.2) * (Math.PI / 2)) * 0.005 * capScale;
          }
        } else if (t >= 0.52 && t < 0.8) {
          // Subcostal Arch Margin, Rectus Abdominis (6-pack + Linea Alba + Semilunaris) & Umbilicus
          const costalArch =
            Math.exp(
              -Math.pow((t - (0.53 + absSin * 0.08)) * 28, 2)
            ) * Math.exp(-Math.pow((absSin - 0.42) * 4.2, 2));
          const semilunaris = Math.exp(-Math.pow((absSin - 0.46) * 7.5, 2));
          const rectusBand = Math.exp(-Math.pow((absSin - 0.22) * 6.5, 2));
          const inscriptionWave = Math.sin(((t - 0.52) / 0.26) * Math.PI * 3);
          yOffset +=
            (costalArch * 0.005 +
              rectusBand * 0.0068 * (0.7 + 0.3 * Math.abs(inscriptionWave)) -
              0.0075 * midlineGroove -
              0.0045 * semilunaris) *
            capScale;

          // Deep sculpted Umbilicus (Navel depression with superior hood) at t = 0.69
          const umbDist = Math.hypot((t - 0.69) * 14.5, sinT * 9.8);
          if (umbDist < 1.0) {
            yOffset -= Math.cos(umbDist * (Math.PI / 2)) * 0.016 * capScale;
          }
        } else if (t >= 0.8) {
          // Iliac Crest, ASIS, Inguinal Ligament V-Furrow (Poupart's line) & Pubic Mound
          const asisPeak = Math.exp(-Math.pow((absSin - 0.68) * 5.5, 2));
          const inguinalLine = Math.exp(
            -Math.pow((t - (0.82 + (1 - absSin) * 0.14)) * 26, 2)
          );
          const pubicMound =
            Math.exp(-Math.pow((t - 0.91) * 16, 2)) *
            Math.exp(-Math.pow(sinT * 3.5, 2));
          yOffset +=
            (asisPeak * 0.01 - inguinalLine * 0.0065 + pubicMound * 0.0115) *
            capScale;
          // Median perineal cleft at pelvic terminus so left and right thighs emerge naturally
          if (t > 0.91) {
            const cleft = ((t - 0.91) / 0.09) * midlineGroove;
            yOffset -= cleft * 0.019;
          }
        }
      } else {
        // Dorsal back, scapulae & gluteal curve resting naturally on the table
        const flatFactor = Math.pow(-cosT, 0.52);
        yOffset = (0.48 - 0.44 * flatFactor) * thickness * capScale;
        if (t > 0.76) {
          // Gluteal fullness on lateral-posterior pelvis
          const glute =
            Math.sin(((t - 0.76) / 0.24) * Math.PI) *
            Math.exp(-Math.pow((absSin - 0.46) * 3.8, 2));
          z += Math.sign(sinT) * glute * 0.009;
        }
      }

      const y = tableSurfaceY + dorsalLift + Math.max(0.004, yOffset);
      vertices.push(x, y, z);
      uvs.push(t, v);
    }
  }

  const ringSize = radialSegments + 1;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ringSize + j;
      const b = (i + 1) * ringSize + j;
      const c = (i + 1) * ringSize + (j + 1);
      const d = i * ringSize + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const posArray = new Float32Array(vertices);
  geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array(uvs), 2)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    basePositions: new Float32Array(posArray),
  };
}

/**
 * Procedurally sculpts a high-resolution, seamless 3D human head, face, and submental neck junction
 * in supine orientation with anatomical cranial vault, temporal fossae, supraorbital brow ridges,
 * closed eyelids with palpebral crease, nasal bridge, nostrils, philtrum, vermilion lips,
 * cheekbones, mandibular angle, and seamless submental-cervical throat blend.
 */
function createSculptedHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.105, 56, 52);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i); // Cranial (-x) to Caudal/Chin (+x)
    let y = pos.getY(i); // Dorsal Occiput (-y) to Anterior Face (+y)
    let z = pos.getZ(i); // Left (-z) to Right (+z)

    const r = Math.hypot(x, y, z) || 1;
    const nx = x / r;
    const ny = y / r;
    const nz = z / r;
    const absNz = Math.abs(nz);

    // 1. Base Cranial-Facial Proportions
    x *= 1.27;
    y *= 0.99;
    z *= 0.85;

    // Bilateral Temporal Fossa indentation (temples at nx = -0.18, absNz > 0.62)
    if (nx > -0.36 && nx < 0.04 && absNz > 0.58 && ny > -0.1) {
      const templeIndent =
        Math.exp(-Math.pow((nx - -0.16) * 5.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.78) * 5.0, 2));
      z -= Math.sign(nz) * templeIndent * 0.0065;
    }

    // Mandibular gonial angle & jawline taper toward the chin (+x)
    if (nx > 0.04) {
      const jawTaper = Math.max(
        0.55,
        1 - Math.pow((nx - 0.04) / 0.96, 1.28) * 0.45
      );
      z *= jawTaper;
      // Gonial jaw corner definition at nx = 0.34, ny = 0.05
      const gonialCorner =
        Math.exp(-Math.pow((nx - 0.34) * 6.5, 2)) *
        Math.exp(-Math.pow((ny - 0.06) * 5.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.65) * 4.5, 2));
      z += Math.sign(nz) * gonialCorner * 0.0055;
    }

    // Seamless submental & cervical neck extension on the caudal-posterior quadrant
    // so the head flows continuously into the neck column at x = -0.72 without any gap
    if (nx > 0.36 && ny < 0.42) {
      const neckBlend =
        Math.min(1, (nx - 0.36) / 0.64) * Math.min(1, (0.42 - ny) / 0.72);
      x += neckBlend * 0.052;
      y -= neckBlend * 0.022;
      z *= 1 - neckBlend * 0.12;
    }

    // 2. High-Precision Facial Feature Sculpting on the Anterior (+Y) Hemisphere
    if (ny > 0.08) {
      // Frontal Eminence (Forehead dome between nx = -0.56 and -0.16)
      if (nx < -0.14) {
        const forehead =
          Math.exp(-Math.pow((nx - -0.35) * 4.2, 2)) *
          Math.exp(-Math.pow(nz * 1.9, 2));
        y += forehead * 0.0065;
      }

      // Supraorbital Brow Ridge & Glabellar Furrow (around nx = -0.14)
      const glabellaDip = 1 - 0.25 * Math.exp(-Math.pow(nz * 14, 2));
      const browFactor =
        Math.exp(-Math.pow((nx - -0.14) * 7.5, 2)) *
        Math.exp(-Math.pow(nz * 2.1, 2)) *
        glabellaDip;
      y += browFactor * 0.0105;

      // Bilateral Orbital Sockets with Upper/Lower Eyelids & Palpebral Crease (nx = -0.01, nz = ±0.32)
      const leftEyeDist = Math.hypot((nx - -0.01) * 6.2, (nz - -0.32) * 5.0);
      const rightEyeDist = Math.hypot((nx - -0.01) * 6.2, (nz - 0.32) * 5.0);
      const eyeSocket =
        Math.exp(-leftEyeDist * leftEyeDist) +
        Math.exp(-rightEyeDist * rightEyeDist);
      const eyeballConvex =
        Math.exp(-Math.pow(leftEyeDist * 1.62, 2)) +
        Math.exp(-Math.pow(rightEyeDist * 1.62, 2));
      const palpebralSlit =
        Math.exp(-Math.pow((nx - -0.005) * 38, 2)) *
        (Math.exp(-Math.pow((nz - -0.32) * 7.5, 2)) +
          Math.exp(-Math.pow((nz - 0.32) * 7.5, 2)));
      y -= eyeSocket * 0.011;
      y += eyeballConvex * 0.0054 - palpebralSlit * 0.0022;

      // Prominent Nasal Bridge, Dorsum, Nasal Tip, Columella & Alar Nostrils (nx from -0.09 to +0.37)
      if (nx > -0.1 && nx < 0.38) {
        const noseLen = (nx - -0.1) / 0.48;
        const noseProfile =
          Math.sin(noseLen * Math.PI) * (0.48 + 0.58 * noseLen);
        const noseWidth = Math.exp(
          -Math.pow(nz / (0.092 + noseLen * 0.056), 2)
        );
        y += noseProfile * noseWidth * 0.0265;

        // Bilateral Alar Wings & Nostril Nares (nx = 0.27, nz = ±0.11)
        const alarWing =
          Math.exp(-Math.pow((nx - 0.27) * 14, 2)) *
          Math.exp(-Math.pow((absNz - 0.11) * 16, 2));
        const nostrilCavity =
          Math.exp(-Math.pow((nx - 0.31) * 24, 2)) *
          Math.exp(-Math.pow((absNz - 0.075) * 24, 2));
        y += alarWing * 0.0078 - nostrilCavity * 0.0045;
      }

      // Philtrum Groove & Nasolabial Folds (nx = 0.33 to 0.44)
      const philtrum =
        Math.exp(-Math.pow((nx - 0.39) * 16, 2)) *
        Math.exp(-Math.pow(nz * 18, 2));
      const nasolabial =
        Math.exp(-Math.pow((nx - (0.28 + absNz * 0.38)) * 16, 2)) *
        Math.exp(-Math.pow((absNz - 0.28) * 7.5, 2));
      y -= philtrum * 0.0025 + nasolabial * 0.0022;

      // Malar / Zygomatic Arches (Cheekbones at nx = 0.10, nz = ±0.48)
      const cheekFactor =
        Math.exp(-Math.pow((nx - 0.1) * 4.2, 2)) *
        Math.exp(-Math.pow((absNz - 0.48) * 4.0, 2));
      y += cheekFactor * 0.0092;
      z += Math.sign(nz) * cheekFactor * 0.008;

      // Upper & Lower Vermilion Lip Relief & Oral Commissure (nx = 0.44 and nx = 0.55)
      const mouthWidth = Math.exp(-Math.pow(nz * 3.5, 2));
      const cupidsBow = 1 - 0.24 * Math.exp(-Math.pow(nz * 18, 2));
      const upperLip =
        Math.exp(-Math.pow((nx - 0.44) * 15, 2)) * mouthWidth * cupidsBow;
      const lowerLip = Math.exp(-Math.pow((nx - 0.55) * 15, 2)) * mouthWidth;
      const lipPart = Math.exp(-Math.pow((nx - 0.495) * 28, 2)) * mouthWidth;
      y += upperLip * 0.009 + lowerLip * 0.0085 - lipPart * 0.0055;

      // Labiomental Sulcus & Mental Protuberance (Chin at nx = 0.75)
      const chinSulcus =
        Math.exp(-Math.pow((nx - 0.63) * 14, 2)) *
        Math.exp(-Math.pow(nz * 4.0, 2));
      const chin =
        Math.exp(-Math.pow((nx - 0.75) * 5.5, 2)) *
        Math.exp(-Math.pow(nz * 3.2, 2));
      y += chin * 0.013 - chinSulcus * 0.0038;
      x += chin * 0.0095;
    } else if (ny < -0.35) {
      y *= 0.92;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally generates a SINGLE, CONTINUOUS, seamless 3D human upper extremity mesh
 * rooted deeply into the pectoral/axillary shoulder girdle (no pinch at the shoulder)
 * flowing through deltoid -> biceps/triceps -> medial/lateral epicondyles & cubital fossa
 * -> brachioradialis forearm -> carpal wrist -> anatomical metacarpal hand palm.
 */
function createContinuousArmGeometry(
  side: number,
  tableSurfaceY: number
): THREE.BufferGeometry {
  const slices = 56;
  const radSegs = 30;
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const xStart = -0.515;
  const xEnd = 0.115;

  for (let i = 0; i <= slices; i++) {
    const u = i / slices;
    const x = xStart + u * (xEnd - xStart);

    let centerZ = side * 0.185;
    let centerY = tableSurfaceY + 0.112;
    let rx = 0.064;
    let rz = 0.066;

    if (u < 0.18) {
      // Full rounded Deltoid muscle head rooted seamlessly into lateral pectoral/shoulder wall
      const s = u / 0.18;
      const deltoidCurve = Math.sin(s * Math.PI);
      const rootSeal = i === 0 ? 0.68 : 1.0;
      centerZ = side * (0.168 + Math.pow(s, 0.75) * 0.058);
      centerY = tableSurfaceY + 0.118 - s * 0.044;
      rx = (0.066 - s * 0.013 + deltoidCurve * 0.006) * rootSeal;
      rz = (0.068 - s * 0.013 + deltoidCurve * 0.008) * rootSeal;
    } else if (u < 0.47) {
      // Brachium (Biceps brachii anterior belly & Triceps brachii posterior contour)
      const s = (u - 0.18) / 0.29;
      const bicepsBell = Math.sin(s * Math.PI);
      centerZ = side * (0.226 + s * 0.02);
      centerY = tableSurfaceY + 0.074 - s * 0.02;
      rx = 0.053 - s * 0.009 + bicepsBell * 0.0065;
      rz = 0.055 - s * 0.01 + bicepsBell * 0.005;
    } else if (u < 0.57) {
      // Continuous Elbow Joint (Humeral Epicondyles, Cubital Fossa & Olecranon)
      const s = (u - 0.47) / 0.1;
      const elbowBell = Math.sin(s * Math.PI);
      centerZ = side * (0.246 + s * 0.005);
      centerY = tableSurfaceY + 0.054 - s * 0.004;
      rx = 0.044 - elbowBell * 0.0035;
      rz = 0.045 + elbowBell * 0.005;
    } else if (u < 0.84) {
      // Forearm (Brachioradialis, Pronator Teres & Flexor Carpi taper toward wrist)
      const s = (u - 0.57) / 0.27;
      const forearmBell = Math.sin(Math.pow(s, 0.65) * Math.PI);
      centerZ = side * (0.251 + s * 0.012);
      centerY = tableSurfaceY + 0.05 - s * 0.016;
      rx = 0.042 * (1 - s) + 0.022 * s + forearmBell * 0.0075;
      rz = 0.046 * (1 - s) + 0.031 * s + forearmBell * 0.0075;
    } else if (u < 0.9) {
      // Carpal Wrist & Ulnar Styloid transition
      const s = (u - 0.84) / 0.06;
      centerZ = side * (0.263 + s * 0.002);
      centerY = tableSurfaceY + 0.034 - s * 0.004;
      rx = 0.022 - s * 0.003;
      rz = 0.031 + s * 0.006;
    } else {
      // Broad Anatomical Metacarpal Hand Dorsum, Thenar Eminence & Palm
      const s = (u - 0.9) / 0.1;
      const handCurve = Math.sin(s * Math.PI);
      const endSeal = i === slices ? 0.38 : 1 - Math.pow(s, 3) * 0.22;
      centerZ = side * (0.265 + s * 0.002);
      centerY = tableSurfaceY + 0.03 - s * 0.005;
      rx = (0.019 + handCurve * 0.0025 - s * 0.005) * endSeal;
      rz = (0.037 + handCurve * 0.0085 - s * 0.003) * endSeal;
    }

    for (let j = 0; j <= radSegs; j++) {
      const v = j / radSegs;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let dy = cosT * rx;
      const dz = sinT * rz;

      // Cubital fossa slight anterior hollow at elbow (u ~ 0.52)
      if (cosT > 0.5 && u > 0.48 && u < 0.56) {
        dy -= Math.sin(((u - 0.48) / 0.08) * Math.PI) * 0.0028 * cosT;
      }

      if (cosT < 0) {
        dy *= 0.82;
      }

      const y = Math.max(tableSurfaceY + 0.004, centerY + dy);
      const z = centerZ + dz;

      verts.push(x, y, z);
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
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(verts), 3)
  );
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally generates a SINGLE, CONTINUOUS, seamless 3D human lower extremity & foot mesh
 * rooted seamlessly into the pelvic hip/inguinal girdle (x = +0.025) with sculpted quadriceps
 * (rectus femoris, vastus lateralis, vastus medialis), patellar knee & ligament, tibial crest,
 * gastrocnemius/soleus calf, malleoli ankle, calcaneus heel, and arched dorsum of foot.
 */
function createContinuousLegGeometry(
  side: number,
  tableSurfaceY: number
): THREE.BufferGeometry {
  const slices = 68;
  const radSegs = 32;
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const xStart = 0.025;
  const xEnd = 0.885;

  for (let i = 0; i <= slices; i++) {
    const u = i / slices;
    const x = xStart + u * (xEnd - xStart);

    let centerZ = side * 0.095;
    let centerY = tableSurfaceY + 0.084;
    let ry = 0.086;
    let rz = 0.088;

    if (u < 0.45) {
      // Proximal Hip & Thigh (Gluteal-Femoral root, Quadriceps femoris, Vastus Medialis & Adductor contour)
      const s = u / 0.45;
      const quadBell = Math.sin(Math.pow(s, 0.76) * Math.PI);
      const startCap = i === 0 ? 0.72 : Math.sin(Math.min(1, u / 0.03) * (Math.PI / 2));
      centerZ = side * (0.089 + s * 0.009);
      centerY = tableSurfaceY + 0.09 - s * 0.02;
      ry = (0.091 * (1 - s) + 0.056 * s + quadBell * 0.0095) * startCap;
      rz = (0.092 * (1 - s) + 0.056 * s + quadBell * 0.0085) * startCap;
    } else if (u < 0.56) {
      // Continuous Anatomical Knee, Patella & Infra-patellar Ligament
      const s = (u - 0.45) / 0.11;
      const patellaBell = Math.sin(s * Math.PI);
      centerZ = side * 0.098;
      centerY = tableSurfaceY + 0.07 - s * 0.006 + patellaBell * 0.0055;
      ry = 0.056 - s * 0.004 + patellaBell * 0.0055;
      rz = 0.056 - s * 0.003 + patellaBell * 0.004;
    } else if (u < 0.87) {
      // Lower Leg (Gastrocnemius medial/lateral heads & Soleus calf belly tapering to Achilles & Ankle)
      const s = (u - 0.56) / 0.31;
      const calfBell = Math.sin(Math.pow(s, 0.62) * Math.PI);
      centerZ = side * (0.098 + s * 0.002);
      centerY = tableSurfaceY + 0.064 - s * 0.018;
      ry = 0.052 * (1 - s) + 0.036 * s + calfBell * 0.0115;
      rz = 0.053 * (1 - s) + 0.035 * s + calfBell * 0.0125;
    } else if (u < 0.92) {
      // Medial & Lateral Malleoli (Ankle Joint)
      const s = (u - 0.87) / 0.05;
      const malleolus = Math.sin(s * Math.PI);
      centerZ = side * 0.1;
      centerY = tableSurfaceY + 0.046 + s * 0.012;
      ry = 0.036 + s * 0.018;
      rz = 0.035 + malleolus * 0.007;
    } else {
      // Integrated Foot: Calcaneus Heel resting on table + Plantar Arch + Dorsum rising to Metatarsal Ball
      const s = (u - 0.92) / 0.08;
      const footArch = Math.sin(s * Math.PI);
      const endSeal = i === slices ? 0.4 : 1 - Math.pow(s, 3.2) * 0.22;
      centerZ = side * (0.1 + s * 0.006);
      centerY = tableSurfaceY + 0.078 + footArch * 0.013;
      ry = (0.069 - s * 0.008) * endSeal;
      rz = (0.039 + footArch * 0.0065) * endSeal;
    }

    for (let j = 0; j <= radSegs; j++) {
      const v = j / radSegs;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let dy = cosT * ry;
      let dz = sinT * rz;

      // Sculpt Vastus Medialis Obliquus ("teardrop" muscle just above medial knee, u ~ 0.34..0.44)
      if (cosT > 0.2 && u > 0.32 && u < 0.45 && sinT * side < -0.2) {
        const vmo = Math.sin(((u - 0.32) / 0.13) * Math.PI);
        dy += vmo * 0.004;
        dz -= side * vmo * 0.0045;
      }

      // Sculpt sharp Anterior Tibial Crest (shin bone ridge) on anterior lower leg
      if (cosT > 0.5 && u >= 0.45 && u < 0.87) {
        const crestSharpness = Math.pow(cosT, 4);
        dy += crestSharpness * 0.0055;
      }

      if (u >= 0.91) {
        const sFoot = (u - 0.91) / 0.09;
        if (cosT > 0) {
          dy *= 1.15 - sFoot * 0.12;
        } else {
          dy *= 0.95 - sFoot * 0.25;
        }
        dz += side * Math.max(0, cosT) * 0.006;
      } else if (cosT < 0) {
        dy *= 0.84;
      }

      const y = Math.max(tableSurfaceY + 0.004, centerY + dy);
      const z = centerZ + dz;

      verts.push(x, y, z);
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
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(verts), 3)
  );
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedurally sculpts an anatomical 3D Human Skull (Cranium + Facial Skeleton):
 * Frontal bone, superciliary brow arches, deep orbital cavities, piriform nasal aperture,
 * zygomatic bones/arches, temporal squama, parietal bosses, occipital bone, and maxillary alveolar arch.
 */
function createSculptedSkullGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.092, 48, 44);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i); // Cranial crown (-x) to Maxillary alveolar arch (+x)
    let y = pos.getY(i); // Occipital back (-y) to Facial anterior (+y)
    let z = pos.getZ(i); // Left (-z) to Right (+z)

    const r = Math.hypot(x, y, z) || 1;
    const nx = x / r;
    const ny = y / r;
    const nz = z / r;
    const absNz = Math.abs(nz);

    // Cranial vault elongation & parietal breadth
    x *= 1.24;
    y *= 0.96;
    z *= 0.84;

    // Parietal eminences (posterior-lateral cranial vault fullness)
    if (nx < -0.1 && ny < 0.3) {
      const parietal =
        Math.exp(-Math.pow((nx - -0.35) * 3.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.72) * 3.5, 2));
      z += Math.sign(nz) * parietal * 0.008;
    }

    // Deep Temporal Fossa behind zygomatic arch
    if (nx > -0.25 && nx < 0.25 && absNz > 0.55) {
      const tempFossa =
        Math.exp(-Math.pow((nx - 0.0) * 4.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.8) * 4.5, 2));
      z -= Math.sign(nz) * tempFossa * 0.012;
    }

    // Narrow the lower facial skeleton (maxilla) compared to the neurocranium
    if (nx > 0.12) {
      const maxillaNarrow = Math.max(
        0.48,
        1 - Math.pow((nx - 0.12) / 0.88, 1.1) * 0.52
      );
      z *= maxillaNarrow;
      // Carve out the sub-cranial base behind the maxilla (foramen magnum / pharyngeal space)
      if (ny < 0.05) {
        y += (nx - 0.12) * 0.025;
        x -= (nx - 0.12) * 0.022;
      }
    }

    // Anterior Facial Osteology (+Y hemisphere)
    if (ny > 0.12) {
      // Superciliary Brow Ridge & Glabella (nx = -0.12)
      const brow =
        Math.exp(-Math.pow((nx - -0.12) * 8.0, 2)) *
        Math.exp(-Math.pow(nz * 2.2, 2));
      y += brow * 0.011;

      // Deep Bilateral Bony Orbital Cavities (Eye Sockets at nx = 0.04, nz = ±0.34)
      const leftOrbit = Math.hypot((nx - 0.04) * 5.8, (nz - -0.34) * 5.2);
      const rightOrbit = Math.hypot((nx - 0.04) * 5.8, (nz - 0.34) * 5.2);
      if (leftOrbit < 1.05) {
        const depth = Math.cos((leftOrbit / 1.05) * (Math.PI / 2));
        y -= depth * 0.024;
      }
      if (rightOrbit < 1.05) {
        const depth = Math.cos((rightOrbit / 1.05) * (Math.PI / 2));
        y -= depth * 0.024;
      }

      // Prominent Zygomatic Bones (Cheekbones at nx = 0.16, nz = ±0.52)
      const zygoma =
        Math.exp(-Math.pow((nx - 0.16) * 5.5, 2)) *
        Math.exp(-Math.pow((absNz - 0.52) * 5.0, 2));
      y += zygoma * 0.012;
      z += Math.sign(nz) * zygoma * 0.014;

      // Nasal Bones (Upper bridge) & Piriform Nasal Aperture (Hollow nasal cavity at nx = 0.28)
      const nasalBridge =
        Math.exp(-Math.pow((nx - 0.06) * 9.5, 2)) *
        Math.exp(-Math.pow(nz * 10.0, 2));
      const piriformCavity = Math.hypot((nx - 0.29) * 6.8, nz * 7.8);
      y += nasalBridge * 0.011;
      if (piriformCavity < 1.0) {
        y -= Math.cos(piriformCavity * (Math.PI / 2)) * 0.022;
      }

      // Maxillary Alveolar Process (Upper tooth-bearing arch at nx > 0.45)
      if (nx > 0.42 && nx < 0.85) {
        const alveolar =
          Math.exp(-Math.pow((nx - 0.62) * 5.5, 2)) *
          Math.exp(-Math.pow(nz * 2.6, 2));
        y += alveolar * 0.014;
      }
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  return geo;
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

    pos.setXYZ(i, x, y, z);
  }

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
function createDynamicDermalSkinTexture(
  add: number,
  humidity: number,
  airflow: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Rich, Lifelike Warm Human Skin Complexion (Melanin + Subsurface Hemoglobin)
  let baseR = 216;
  let baseG = 152;
  let baseB = 116;

  if (add < 45) {
    const pallor = Math.min(1, add / 45);
    baseR = Math.round(218 - pallor * 8);
    baseG = Math.round(153 - pallor * 6);
    baseB = Math.round(117 - pallor * 4);
  } else if (add < 115) {
    const t = (add - 45) / 70;
    baseR = Math.round(210 - t * 14);
    baseG = Math.round(147 - t * 10);
    baseB = Math.round(113 - t * 8);
  } else if (add < 260) {
    const t = (add - 115) / 145;
    baseR = Math.round(196 - t * 20);
    baseG = Math.round(137 - t * 16);
    baseB = Math.round(105 - t * 14);
  } else {
    if (humidity >= 78) {
      baseR = 182;
      baseG = 146;
      baseB = 124;
    } else {
      baseR = 158;
      baseG = 108;
      baseB = 78;
    }
  }

  ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Warm Subsurface Dermal Flush (Rose-Terracotta Hemoglobin & Golden Melanin Variation)
  for (let i = 0; i < 280; i++) {
    const cx = (i * 73) % 512;
    const cy = (i * 137) % 512;
    const rad = 22 + (i % 36);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
    grad.addColorStop(
      0,
      i % 3 === 0
        ? 'rgba(202, 94, 76, 0.115)'
        : i % 3 === 1
          ? 'rgba(238, 178, 142, 0.095)'
          : 'rgba(164, 100, 70, 0.085)'
    );
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }

  // 3. Natural Anatomical Shading (Clavicular/Sternal warmth, Pectoral contour, Linea Alba, Umbilicus)
  const midlineGrad = ctx.createLinearGradient(0, 0, 0, 512);
  midlineGrad.addColorStop(0, 'rgba(138, 76, 52, 0.18)');
  midlineGrad.addColorStop(0.18, 'rgba(244, 188, 152, 0.08)');
  midlineGrad.addColorStop(0.5, 'rgba(132, 72, 48, 0.15)');
  midlineGrad.addColorStop(0.82, 'rgba(244, 188, 152, 0.08)');
  midlineGrad.addColorStop(1, 'rgba(138, 76, 52, 0.18)');
  ctx.fillStyle = midlineGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle umbilical shadow spot on anterior abdomen UV (u ~ 0.69, v ~ 0 / 1)
  [0, 512].forEach((uy) => {
    const umbGrad = ctx.createRadialGradient(353, uy, 1, 353, uy, 16);
    umbGrad.addColorStop(0, 'rgba(96, 48, 32, 0.38)');
    umbGrad.addColorStop(1, 'rgba(96, 48, 32, 0)');
    ctx.fillStyle = umbGrad;
    ctx.fillRect(335, uy - 18, 36, 36);
  });

  // 4. Dependent Dorsal Livor Mortis (Subtle warm-plum hypostasis along lower dorsal contact zone)
  if (add >= 10 && add < 340) {
    const livorIntensity =
      add < 45 ? (add - 10) / 35 : Math.max(0.15, 1 - (add - 45) / 300);
    const livorGrad = ctx.createLinearGradient(0, 185, 0, 335);
    livorGrad.addColorStop(0, 'rgba(136, 62, 68, 0)');
    livorGrad.addColorStop(
      0.5,
      `rgba(128, 54, 62, ${(livorIntensity * 0.24).toFixed(3)})`
    );
    livorGrad.addColorStop(1, 'rgba(136, 62, 68, 0)');
    ctx.fillStyle = livorGrad;
    ctx.fillRect(0, 185, 512, 150);
  }

  // 5. Right Iliac Fossa / Abdominal Sulfhemoglobin Shift (Subtle localized olive-amber tint, ADD > 42)
  if (add > 42 && add < 360) {
    const greenIntensity = Math.min(0.22, ((add - 42) / 150) * 0.22);
    const fossaGrad = ctx.createRadialGradient(330, 130, 10, 330, 130, 135);
    fossaGrad.addColorStop(
      0,
      `rgba(112, 126, 84, ${greenIntensity.toFixed(3)})`
    );
    fossaGrad.addColorStop(1, 'rgba(112, 126, 84, 0)');
    ctx.fillStyle = fossaGrad;
    ctx.fillRect(180, 0, 300, 270);
  }

  // 6. Superficial Venous Network (Subtle warm-umber dermal vasculature, ADD 52–290)
  if (add > 52 && add < 310) {
    const marbleAlpha =
      add < 130
        ? ((add - 52) / 78) * 0.18
        : Math.max(0.05, (1 - (add - 130) / 180) * 0.18);
    ctx.strokeStyle = `rgba(104, 68, 58, ${marbleAlpha.toFixed(3)})`;
    ctx.lineWidth = 1.3;
    for (let branch = 0; branch < 14; branch++) {
      let vx = 60 + branch * 30;
      let vy = 40 + (branch % 3) * 58;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let step = 0; step < 7; step++) {
        vx += Math.sin(branch + step * 1.3) * 14;
        vy += 19 + Math.cos(branch * 0.7 + step) * 6;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
  }

  // 7. Epidermal Micro-Creases & Skin Texture Lines
  ctx.strokeStyle = 'rgba(118, 68, 46, 0.08)';
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
      map: currentDermalTex,
      bumpMap: skinBumpTex,
      bumpScale: 0.0024,
      emissive: 0x3b150c,
      emissiveIntensity: 0.11,
      roughness: 0.42,
      metalness: 0.01,
      clearcoat: 0.16,
      clearcoatRoughness: 0.38,
      sheen: 0.68,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0xd9795d),
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
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

  // Helper for realistic pigmented anatomical surface features (hair, eyebrows, lips, areolae, nails)
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

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1f1510,
    roughness: 0.78,
    metalness: 0.04,
  });
  const lipMat = new THREE.MeshPhysicalMaterial({
    color: 0xb56353,
    roughness: 0.36,
    clearcoat: 0.25,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xd97c6c),
  });
  const areolaMat = new THREE.MeshStandardMaterial({
    color: 0x9c5a46,
    roughness: 0.52,
  });
  const nailMat = new THREE.MeshPhysicalMaterial({
    color: 0xebbfb0,
    roughness: 0.22,
    clearcoat: 0.65,
  });
  const drapeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.68,
    metalness: 0.05,
  });

  // 1A. Seamless Sculpted 3D Human Head, Face (Brow, Closed Eyes, Nose, Lips, Chin, Ears) & Cervical Neck
  const sculptedHeadGeo = createSculptedHeadGeometry();
  addEnvelopeSegment(
    sculptedHeadGeo,
    [-0.77, TABLE_SURFACE_Y + 0.144, 0],
    [0, 0, -0.05],
    [1, 1, 1],
    'head-neck'
  );

  // Realistic Human Scalp Hair Cap (Crown, Temples & Occipital Nape)
  addPigmentedFeature(
    new THREE.SphereGeometry(
      0.09,
      32,
      24,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.6
    ),
    hairMat,
    [-0.805, TABLE_SURFACE_Y + 0.146, 0],
    [0, 0, 1.38],
    [1.18, 0.99, 0.95],
    'head-neck'
  );

  // Sculpted Upper & Lower Vermilion Lips on Anterior Face
  addPigmentedFeature(
    new THREE.CapsuleGeometry(0.0042, 0.021, 10, 14),
    lipMat,
    [-0.706, TABLE_SURFACE_Y + 0.221, 0],
    [Math.PI / 2, 0, 0],
    [0.85, 1.0, 1.15],
    'head-neck'
  );
  addPigmentedFeature(
    new THREE.CapsuleGeometry(0.0048, 0.019, 10, 14),
    lipMat,
    [-0.696, TABLE_SURFACE_Y + 0.219, 0],
    [Math.PI / 2, 0, 0],
    [0.9, 1.0, 1.18],
    'head-neck'
  );

  // Bilateral Eyebrows, Closed Palpebral Eyelid Lash Lines & Sculpted Human Ears (Auricles)
  [-1, 1].forEach((side) => {
    // Supraorbital Eyebrow Ridge Hair Arc
    addPigmentedFeature(
      new THREE.TorusGeometry(0.018, 0.0025, 8, 18, Math.PI * 0.76),
      hairMat,
      [-0.782, TABLE_SURFACE_Y + 0.23, side * 0.03],
      [Math.PI * 0.48, -0.1, side * 0.12],
      [1, 1, 1],
      'head-neck'
    );

    // Closed Eyelid Palpebral Crease / Lash Line
    addPigmentedFeature(
      new THREE.TorusGeometry(0.012, 0.0013, 8, 18, Math.PI * 0.82),
      hairMat,
      [-0.764, TABLE_SURFACE_Y + 0.226, side * 0.03],
      [Math.PI / 2, -0.14, side * 0.08],
      [1, 1, 1],
      'head-neck'
    );

    // Ear Concha & Lobule
    addEnvelopeSegment(
      new THREE.CapsuleGeometry(0.0105, 0.021, 12, 14),
      [-0.764, TABLE_SURFACE_Y + 0.142, side * 0.086],
      [0.2, 0, Math.PI / 2 - 0.15],
      [1.0, 0.62, 0.42],
      'head-neck'
    );

    // Outer Auricular Helix Rim
    addEnvelopeSegment(
      new THREE.TorusGeometry(0.014, 0.0034, 10, 18, Math.PI * 1.3),
      [-0.766, TABLE_SURFACE_Y + 0.145, side * 0.089],
      [0, Math.PI / 2, -0.32],
      [1, 1, 1],
      'head-neck'
    );
  });

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

  // Subtle Conforming Pectoral Areolae & Papillae (flush with sculpted pectoralis major surface)
  [-1, 1].forEach((side) => {
    addPigmentedFeature(
      new THREE.CylinderGeometry(0.0095, 0.0105, 0.0025, 18),
      areolaMat,
      [-0.39, TABLE_SURFACE_Y + 0.214, side * 0.092],
      [side * 0.16, 0, 0.04],
      [1, 1, 1],
      'thorax'
    );
    addPigmentedFeature(
      new THREE.SphereGeometry(0.0034, 10, 10),
      areolaMat,
      [-0.39, TABLE_SURFACE_Y + 0.216, side * 0.0925],
      [0, 0, 0],
      [1, 1, 1],
      'thorax'
    );
  });

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

  // 1D. Single-Mesh Continuous Upper Extremities (Deltoid -> Biceps/Triceps -> Elbow -> Forearm -> Wrist -> Metacarpal Hand + 5 Digits)
  [-1, 1].forEach((side) => {
    const continuousArmGeo = createContinuousArmGeometry(side, TABLE_SURFACE_Y);
    addEnvelopeSegment(
      continuousArmGeo,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'extremities'
    );

    // Seamlessly Integrated Opposable Thumb (Pollex) emerging from radial metacarpal arch
    addEnvelopeSegment(
      new THREE.CapsuleGeometry(0.0074, 0.038, 12, 14),
      [0.095, TABLE_SURFACE_Y + 0.025, side * 0.23],
      [0, side * 0.34, Math.PI / 2],
      [1, 1, 1],
      'extremities'
    );
    // 4 Tapered Anatomical Fingers (Index, Middle, Ring, Little) with keratin fingernails
    const fingerLengths = [0.048, 0.054, 0.05, 0.04];
    fingerLengths.forEach((fLen, fIdx) => {
      const fz = side * (0.244 + fIdx * 0.0138);
      addEnvelopeSegment(
        new THREE.CapsuleGeometry(0.0062, fLen, 12, 14),
        [0.128, TABLE_SURFACE_Y + 0.02, fz],
        [0, 0, Math.PI / 2 + 0.06],
        [1, 1, 1],
        'extremities'
      );
      addPigmentedFeature(
        new THREE.BoxGeometry(0.007, 0.0015, 0.0065),
        nailMat,
        [0.128 + fLen * 0.45, TABLE_SURFACE_Y + 0.025, fz],
        [0, 0, -0.06],
        [1, 1, 1],
        'extremities'
      );
    });
  });

  // 1E. Single-Mesh Continuous Lower Extremities (Hip/Gluteal -> Quadriceps Thigh -> Patellar Knee -> Calf/Shin -> Ankle -> Foot + 5 Toes)
  [-1, 1].forEach((side) => {
    const continuousLegGeo = createContinuousLegGeometry(side, TABLE_SURFACE_Y);
    addEnvelopeSegment(
      continuousLegGeo,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'extremities'
    );

    // 5 Sculpted Toes (Hallux to 5th Digit) with Keratin Toenails emerging from distal metatarsal ridge
    const zFoot = side * 0.105;
    for (let tIdx = 0; tIdx < 5; tIdx++) {
      const isHallux = tIdx === 0;
      const tz = zFoot + side * (-0.024 + tIdx * 0.0115);
      const ty = TABLE_SURFACE_Y + 0.146 - tIdx * 0.0065;
      addEnvelopeSegment(
        new THREE.CapsuleGeometry(
          isHallux ? 0.0085 : 0.0055,
          isHallux ? 0.022 : 0.016,
          12,
          12
        ),
        [0.882, ty, tz],
        [0, 0, -0.18],
        [1, 1, 1],
        'extremities'
      );
      addPigmentedFeature(
        new THREE.BoxGeometry(
          0.0018,
          0.0075,
          isHallux ? 0.011 : 0.0072
        ),
        nailMat,
        [0.873, ty + 0.005, tz],
        [0, 0, -0.18],
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
    roughness: 0.32,
    metalness: 0.05,
    transparent: true,
    opacity: 0.86,
    clearcoat: 0.35,
  });

  const enamelMat = new THREE.MeshPhysicalMaterial({
    color: 0xfefce8,
    roughness: 0.16,
    clearcoat: 0.75,
  });

  const orbitCavityMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b18,
    roughness: 0.9,
  });

  const addBoneMesh = (
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
    osteologyGroup.add(mesh);
    interactiveMeshes.push(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------------
  // 2A. SCULPTED 3D CRANIUM, ORBITAL SOCKETS, ZYGOMATIC ARCHES, MANDIBLE & TEETH
  // ---------------------------------------------------------------------------
  // Sculpted Neurocranium + Upper Facial Skeleton (Frontal, Parietal, Occipital, Orbits, Piriform Nasal Cavity, Maxilla)
  addBoneMesh(
    createSculptedSkullGeometry(),
    boneMat,
    [-0.782, TABLE_SURFACE_Y + 0.136, 0],
    [0, 0, -0.05],
    [1, 1, 1],
    'head-neck'
  );

  // Deep Orbital Socket Backing & Bilateral Zygomatic Arches (Cheekbone Bridges)
  [-1, 1].forEach((side) => {
    addBoneMesh(
      new THREE.SphereGeometry(0.0145, 14, 12),
      orbitCavityMat,
      [-0.768, TABLE_SURFACE_Y + 0.206, side * 0.028],
      [0, 0, 0],
      [0.85, 0.55, 1.0],
      'head-neck'
    );
    // Zygomatic Arch Bridge spanning from Zygoma to Temporal Bone
    addBoneMesh(
      new THREE.TorusGeometry(0.031, 0.0045, 10, 22, Math.PI * 0.72),
      boneMat,
      [-0.755, TABLE_SURFACE_Y + 0.17, side * 0.056],
      [Math.PI * 0.5, -0.24, side * 0.2],
      [1.15, 0.85, 1.0],
      'head-neck'
    );
  });

  // Piriform Nasal Aperture Cavity & Nasal Septum (Vomer/Ethmoid Plate)
  addBoneMesh(
    new THREE.ConeGeometry(0.011, 0.026, 3),
    orbitCavityMat,
    [-0.742, TABLE_SURFACE_Y + 0.212, 0],
    [Math.PI * 0.38, 0, 0],
    [0.8, 1.0, 0.85],
    'head-neck'
  );

  // Articulated U-Shaped Mandibular Body, Chin (Mental Protuberance) & Bilateral Ascending Rami/Condyles
  const mandibleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.735, TABLE_SURFACE_Y + 0.145, -0.048),
    new THREE.Vector3(-0.705, TABLE_SURFACE_Y + 0.155, -0.044),
    new THREE.Vector3(-0.682, TABLE_SURFACE_Y + 0.192, -0.024),
    new THREE.Vector3(-0.674, TABLE_SURFACE_Y + 0.205, 0),
    new THREE.Vector3(-0.682, TABLE_SURFACE_Y + 0.192, 0.024),
    new THREE.Vector3(-0.705, TABLE_SURFACE_Y + 0.155, 0.044),
    new THREE.Vector3(-0.735, TABLE_SURFACE_Y + 0.145, 0.048),
  ]);
  addBoneMesh(
    new THREE.TubeGeometry(mandibleCurve, 32, 0.0095, 12, false),
    boneMat,
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    'head-neck'
  );
  // Bilateral Mandibular Rami, Coronoid Process & Temporomandibular Condyles
  [-1, 1].forEach((side) => {
    addBoneMesh(
      new THREE.BoxGeometry(0.036, 0.024, 0.0065),
      boneMat,
      [-0.722, TABLE_SURFACE_Y + 0.156, side * 0.046],
      [0, side * 0.14, 0.35],
      [1, 1, 1],
      'head-neck'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.0065, 10, 10),
      boneMat,
      [-0.742, TABLE_SURFACE_Y + 0.152, side * 0.05],
      [0, 0, 0],
      [0.8, 0.8, 1.35],
      'head-neck'
    );
  });

  // Individual Maxillary & Mandibular Teeth Crowns (Incisors, Canines, Premolars, Molars)
  for (let t = -5; t <= 5; t++) {
    const angle = (t / 5.5) * (Math.PI * 0.44);
    const toothZ = Math.sin(angle) * 0.027;
    const toothY = TABLE_SURFACE_Y + 0.184 + Math.cos(angle) * 0.024;
    // Upper Maxillary Tooth Crown
    addBoneMesh(
      new THREE.BoxGeometry(0.0062, 0.0052, 0.005),
      enamelMat,
      [-0.714, toothY, toothZ],
      [0, angle, 0],
      [1, 1, 1],
      'head-neck'
    );
    // Lower Mandibular Tooth Crown
    addBoneMesh(
      new THREE.BoxGeometry(0.0058, 0.005, 0.0046),
      enamelMat,
      [-0.706, toothY - 0.002, toothZ * 0.95],
      [0, angle, 0],
      [1, 1, 1],
      'head-neck'
    );
  }

  // ---------------------------------------------------------------------------
  // 2B. 24-SEGMENT ARTICULATED VERTEBRAL COLUMN (C1–C7, T1–T12, L1–L5) + SACRUM & COCCYX
  // ---------------------------------------------------------------------------
  for (let v = 0; v < 24; v++) {
    const t = v / 23;
    const vx = -0.675 + v * 0.0295; // C1 Atlas (-0.675) to L5 (+0.0035)
    const isCervical = v < 7;
    const isThoracic = v >= 7 && v < 19;
    const reg: AnatomicalRegionId = isCervical
      ? 'head-neck'
      : isThoracic
        ? 'thorax'
        : 'abdomen-pelvis';

    // Physiological Cervical Lordosis, Thoracic Kyphosis & Lumbar Lordosis
    const sagittalCurve = isCervical
      ? Math.sin((v / 6) * Math.PI) * 0.014
      : isThoracic
        ? -Math.sin(((v - 7) / 11) * Math.PI) * 0.011
        : Math.sin(((v - 19) / 4) * Math.PI) * 0.016;

    const spineY = TABLE_SURFACE_Y + 0.068 + sagittalCurve;
    const radius = 0.0135 + t * 0.0105; // Progressive widening from C1 to L5
    const height = 0.014 + t * 0.007;

    // Vertebral Body (Centrum)
    addBoneMesh(
      new THREE.CylinderGeometry(radius, radius * 1.04, height, 16),
      boneMat,
      [vx, spineY, 0],
      [0, 0, Math.PI / 2],
      [1, 0.88, 1.12],
      reg
    );

    // Fibrocartilage Intervertebral Disc
    if (v < 23) {
      addBoneMesh(
        new THREE.CylinderGeometry(radius * 0.97, radius * 0.97, 0.0055, 16),
        cartilageMat,
        [vx + 0.0145, spineY, 0],
        [0, 0, Math.PI / 2],
        [1, 0.88, 1.12],
        reg
      );
    }

    // Bilateral Transverse Processes & Pedicles
    const tpSpan = isCervical ? 0.036 : isThoracic ? 0.052 : 0.06;
    addBoneMesh(
      new THREE.CylinderGeometry(0.0038, 0.0038, tpSpan, 8),
      boneMat,
      [vx + 0.002, spineY - 0.006, 0],
      [Math.PI / 2, 0, 0],
      [1, 1, 1],
      reg
    );

    // Dorsal Spinous Process projecting toward autopsy table
    const spinousLen = isThoracic ? 0.025 : 0.019;
    addBoneMesh(
      new THREE.BoxGeometry(0.011, spinousLen, 0.0048),
      boneMat,
      [vx + (isThoracic ? 0.007 : 0.003), spineY - radius - 0.007, 0],
      [0, 0, isThoracic ? 0.42 : 0.15],
      [1, 1, 1],
      reg
    );
  }

  // Sculpted Sacrum (Fused S1-S5 triangular wedge with sacral promontory) & Coccyx
  addBoneMesh(
    new THREE.ConeGeometry(0.048, 0.092, 14),
    boneMat,
    [0.052, TABLE_SURFACE_Y + 0.062, 0],
    [0, 0, -Math.PI / 2 - 0.16],
    [0.5, 1.0, 1.18],
    'abdomen-pelvis'
  );
  addBoneMesh(
    new THREE.ConeGeometry(0.014, 0.03, 10),
    boneMat,
    [0.106, TABLE_SURFACE_Y + 0.048, 0],
    [0, 0, -Math.PI / 2 + 0.22],
    [0.58, 1.0, 0.85],
    'abdomen-pelvis'
  );

  // ---------------------------------------------------------------------------
  // 2C. 3-PART STERNUM, S-CURVED CLAVICLES, SCAPULAE & 12 PAIRS OF RIBS
  // ---------------------------------------------------------------------------
  // 1. Hexagonal Manubrium Sterni (with Suprasternal Jugular Notch)
  addBoneMesh(
    new THREE.CylinderGeometry(0.026, 0.019, 0.046, 6),
    boneMat,
    [-0.525, TABLE_SURFACE_Y + 0.18, 0],
    [0, Math.PI / 6, Math.PI / 2 - 0.08],
    [0.36, 1.0, 1.15],
    'thorax'
  );
  // 2. Corpus Sterni (Gladiolus / Sternal Body)
  addBoneMesh(
    new THREE.BoxGeometry(0.125, 0.011, 0.032),
    boneMat,
    [-0.435, TABLE_SURFACE_Y + 0.184, 0],
    [0, 0, -0.02],
    [1, 1, 1],
    'thorax'
  );
  // 3. Xiphoid Process
  addBoneMesh(
    new THREE.ConeGeometry(0.011, 0.028, 8),
    cartilageMat,
    [-0.358, TABLE_SURFACE_Y + 0.178, 0],
    [0, 0, -Math.PI / 2],
    [0.45, 1.0, 0.9],
    'thorax'
  );

  // 12 Pairs of Anatomically Curved Ribs (True 1-7, False 8-10, Floating 11-12) + Costal Cartilages
  for (let r = 0; r < 12; r++) {
    const rt = r / 11;
    const rx = -0.535 + rt * 0.255;
    const isTrueRib = r < 7;
    const isFalseRib = r >= 7 && r < 10;
    const isFloatingRib = r >= 10;

    const widthCurve = Math.sin(rt * Math.PI * 0.82 + 0.22);
    const ribWidthZ = 0.096 + widthCurve * 0.058;
    const ribHeightY = 0.064 + widthCurve * 0.026;

    [-1, 1].forEach((side) => {
      const arcSpan = isFloatingRib
        ? Math.PI * 0.48
        : isFalseRib
          ? Math.PI * 0.72
          : Math.PI * 0.78;
      addBoneMesh(
        new THREE.TorusGeometry(1, 0.048, 10, 28, arcSpan),
        boneMat,
        [rx, TABLE_SURFACE_Y + 0.11, side * 0.014],
        [
          0,
          side > 0 ? Math.PI / 2 : -Math.PI / 2,
          side > 0 ? -0.18 : Math.PI + 0.18,
        ],
        [ribWidthZ, ribHeightY, 0.12],
        'thorax'
      );

      // Hyaline Costal Cartilage Bridge connecting anterior rib end to Sternum / Costal Arch
      if (!isFloatingRib) {
        const cartX = isTrueRib ? rx - 0.012 : -0.365 + (r - 7) * 0.018;
        const cartY =
          TABLE_SURFACE_Y + (isTrueRib ? 0.17 : 0.154 - (r - 7) * 0.012);
        const cartZ = side * (isTrueRib ? 0.048 : 0.072);
        const cartLen = isTrueRib ? 0.055 + rt * 0.024 : 0.076;
        addBoneMesh(
          new THREE.CylinderGeometry(0.0046, 0.004, cartLen, 8),
          cartilageMat,
          [cartX, cartY, cartZ],
          [
            side * (isTrueRib ? 0.32 : 0.52),
            side * (isTrueRib ? -0.25 : -0.58),
            Math.PI / 2,
          ],
          [1, 1, 1],
          'thorax'
        );
      }
    });
  }

  // Bilateral S-Curved Clavicles & Triangular Scapulae with Acromion Process
  [-1, 1].forEach((side) => {
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.535, TABLE_SURFACE_Y + 0.182, side * 0.018),
      new THREE.Vector3(-0.546, TABLE_SURFACE_Y + 0.176, side * 0.075),
      new THREE.Vector3(-0.524, TABLE_SURFACE_Y + 0.152, side * 0.14),
      new THREE.Vector3(-0.518, TABLE_SURFACE_Y + 0.125, side * 0.195),
    ]);
    addBoneMesh(
      new THREE.TubeGeometry(clavCurve, 20, 0.0072, 10, false),
      boneMat,
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      'thorax'
    );

    // Triangular Scapular Blade (Posterior Shoulder Blade)
    addBoneMesh(
      new THREE.ConeGeometry(0.056, 0.115, 3),
      boneMat,
      [-0.465, TABLE_SURFACE_Y + 0.055, side * 0.14],
      [0.08 * side, 0, -Math.PI / 2],
      [0.22, 1.0, 1.15],
      'thorax'
    );

    // Spine of Scapula & Acromion Process overhanging Glenohumeral Joint
    addBoneMesh(
      new THREE.BoxGeometry(0.022, 0.011, 0.092),
      boneMat,
      [-0.515, TABLE_SURFACE_Y + 0.098, side * 0.162],
      [-side * 0.32, side * 0.2, 0],
      [1, 1, 1],
      'thorax'
    );
  });

  // ---------------------------------------------------------------------------
  // 2D. SCULPTED PELVIC GIRDLE (OS COXAE: ILIUM, ISCHIUM, PUBIS & PUBIC SYMPHYSIS)
  // ---------------------------------------------------------------------------
  [-1, 1].forEach((side) => {
    // Flared Iliac Wing (Ala of Ilium) & Iliac Crest
    addBoneMesh(
      new THREE.SphereGeometry(0.068, 22, 18),
      boneMat,
      [0.028, TABLE_SURFACE_Y + 0.088, side * 0.088],
      [side * 0.42, 0.22 * side, -0.28],
      [0.95, 0.24, 1.15],
      'abdomen-pelvis'
    );
    // Thickened Iliac Crest Rim & ASIS
    addBoneMesh(
      new THREE.TorusGeometry(0.066, 0.011, 10, 24, Math.PI * 0.95),
      boneMat,
      [0.028, TABLE_SURFACE_Y + 0.096, side * 0.092],
      [side * 0.42, Math.PI / 2, -0.18],
      [1.1, 0.88, 1.0],
      'abdomen-pelvis'
    );
    // Ischiopubic Ramus Ring surrounding Obturator Foramen
    addBoneMesh(
      new THREE.TorusGeometry(0.028, 0.0085, 10, 20),
      boneMat,
      [0.095, TABLE_SURFACE_Y + 0.086, side * 0.048],
      [side * 0.35, 0.45 * side, 0.25],
      [1.15, 0.9, 1.0],
      'abdomen-pelvis'
    );
    // Deep Acetabular Cup Rim
    addBoneMesh(
      new THREE.TorusGeometry(0.024, 0.0065, 10, 18),
      cartilageMat,
      [0.082, TABLE_SURFACE_Y + 0.082, side * 0.092],
      [0, Math.PI / 2 - side * 0.35, 0.3],
      [1, 1, 1],
      'abdomen-pelvis'
    );
  });

  // Fibrocartilaginous Pubic Symphysis Disc uniting Left & Right Pubic Bones
  addBoneMesh(
    new THREE.BoxGeometry(0.028, 0.024, 0.014),
    cartilageMat,
    [0.102, TABLE_SURFACE_Y + 0.118, 0],
    [0, 0, -0.12],
    [1, 1, 1],
    'abdomen-pelvis'
  );

  // ---------------------------------------------------------------------------
  // 2E. BILATERAL APPENDICULAR SKELETON (EPIPHYSEAL LONG BONES, HANDS & FEET)
  // ---------------------------------------------------------------------------
  [-1, 1].forEach((side) => {
    // 1. Glenohumeral Humeral Head seated in Glenoid Fossa
    addBoneMesh(
      new THREE.SphereGeometry(0.022, 16, 14),
      boneMat,
      [-0.495, TABLE_SURFACE_Y + 0.096, side * 0.204],
      [0, 0, 0],
      [1.08, 0.95, 1.0],
      'extremities'
    );

    // 2. Anatomically Flared Humerus (Shaft + Medial/Lateral Epicondyles + Trochlea)
    addBoneMesh(
      createAnatomicalLongBoneGeometry(0.245, 0.0115, 1.65, 1.85, 0.004),
      boneMat,
      [-0.36, TABLE_SURFACE_Y + 0.058, side * 0.232],
      [0, -side * 0.07, Math.PI / 2 + 0.14],
      [1, 1, 1],
      'extremities'
    );

    // 3. Ulna (Medial Forearm Bone with Olecranon Process at Elbow) & Radius (Lateral Forearm Bone)
    addBoneMesh(
      createAnatomicalLongBoneGeometry(0.218, 0.0072, 1.75, 1.35, -0.003),
      boneMat,
      [-0.085, TABLE_SURFACE_Y + 0.038, side * 0.244],
      [0, -side * 0.04, Math.PI / 2 + 0.06],
      [1, 1, 1],
      'extremities'
    );
    addBoneMesh(
      createAnatomicalLongBoneGeometry(0.212, 0.0076, 1.35, 1.85, 0.004),
      boneMat,
      [-0.082, TABLE_SURFACE_Y + 0.042, side * 0.264],
      [0, -side * 0.04, Math.PI / 2 + 0.06],
      [1, 1, 1],
      'extremities'
    );

    // 4. Articulated Hand Skeleton: 8 Carpals, 5 Metacarpals & 14 Phalanges
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        addBoneMesh(
          new THREE.SphereGeometry(0.0052, 8, 8),
          boneMat,
          [
            0.036 + row * 0.011,
            TABLE_SURFACE_Y + 0.028,
            side * (0.242 + col * 0.0095),
          ],
          [0, 0, 0],
          [1.1, 0.75, 0.95],
          'extremities'
        );
      }
    }
    for (let d = 0; d < 5; d++) {
      const isThumb = d === 0;
      const dz = side * (isThumb ? 0.232 : 0.244 + (d - 1) * 0.0135);
      const mcLen = isThumb ? 0.03 : 0.042 - Math.abs(d - 2) * 0.0025;
      const xMc = isThumb ? 0.066 : 0.078;

      // Metacarpal shaft with knuckle head
      addBoneMesh(
        createAnatomicalLongBoneGeometry(mcLen, 0.0034, 1.45, 1.55, 0.001),
        boneMat,
        [xMc, TABLE_SURFACE_Y + 0.026, dz],
        [0, isThumb ? side * 0.3 : 0, Math.PI / 2 + 0.04],
        [1, 1, 1],
        'extremities'
      );

      // Articulated Phalanges (2 for thumb, 3 for fingers)
      const numPhal = isThumb ? 2 : 3;
      let curX = xMc + mcLen * 0.55;
      for (let p = 0; p < numPhal; p++) {
        const pLen = (isThumb ? 0.018 : 0.02) * Math.pow(0.74, p);
        const pRad = 0.0034 * Math.pow(0.82, p);
        addBoneMesh(
          new THREE.CapsuleGeometry(pRad, pLen * 0.6, 8, 10),
          boneMat,
          [curX + pLen * 0.5, TABLE_SURFACE_Y + 0.022 - p * 0.0015, dz],
          [0, isThumb ? side * 0.24 : 0, Math.PI / 2 + 0.05 * (p + 1)],
          [1, 0.85, 1],
          'extremities'
        );
        curX += pLen + 0.0015;
      }
    }

    // 5. Spherical Femoral Head, Angled Femoral Neck (126°), Greater Trochanter & Bowed Femur
    const zLeg = side * 0.098;
    addBoneMesh(
      new THREE.SphereGeometry(0.023, 16, 14),
      boneMat,
      [0.082, TABLE_SURFACE_Y + 0.082, side * 0.088],
      [0, 0, 0],
      [1, 1, 1],
      'extremities'
    );
    // Angled Femoral Neck + Greater Trochanter prominence
    addBoneMesh(
      new THREE.CylinderGeometry(0.0125, 0.0155, 0.046, 12),
      boneMat,
      [0.095, TABLE_SURFACE_Y + 0.078, side * 0.106],
      [side * 0.55, 0, Math.PI / 2 - 0.32],
      [1, 1, 1],
      'extremities'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.018, 12, 12),
      boneMat,
      [0.104, TABLE_SURFACE_Y + 0.076, side * 0.124],
      [0, 0, 0],
      [1.2, 0.9, 0.85],
      'extremities'
    );

    // Flared Femur Shaft + Medial & Lateral Femoral Condyles
    addBoneMesh(
      createAnatomicalLongBoneGeometry(0.35, 0.015, 1.55, 2.05, 0.007),
      boneMat,
      [0.275, TABLE_SURFACE_Y + 0.072, zLeg],
      [0, side * 0.03, Math.PI / 2 + 0.04],
      [1, 1, 1],
      'extremities'
    );

    // Sculpted Sesamoid Patella (Kneecap)
    addBoneMesh(
      new THREE.SphereGeometry(0.019, 14, 12),
      boneMat,
      [0.458, TABLE_SURFACE_Y + 0.106, zLeg],
      [0, 0, 0],
      [1.05, 0.48, 1.05],
      'extremities'
    );

    // 6. Tibia (Broad Tibial Plateau, Anterior Crest, Medial Malleolus) & Slender Fibula
    addBoneMesh(
      createAnatomicalLongBoneGeometry(0.33, 0.013, 1.95, 1.55, -0.003),
      boneMat,
      [0.645, TABLE_SURFACE_Y + 0.056, zLeg - side * 0.007],
      [0, 0, Math.PI / 2 + 0.03],
      [1, 1, 1],
      'extremities'
    );
    addBoneMesh(
      createAnatomicalLongBoneGeometry(0.32, 0.0058, 1.55, 1.65, 0.002),
      boneMat,
      [0.648, TABLE_SURFACE_Y + 0.046, zLeg + side * 0.015],
      [0, 0, Math.PI / 2 + 0.03],
      [1, 1, 1],
      'extremities'
    );

    // 7. Articulated Foot Skeleton: Calcaneus Heel, Talus Ankle Dome, 5 Metatarsals & Toe Phalanges
    addBoneMesh(
      new THREE.BoxGeometry(0.056, 0.03, 0.032),
      boneMat,
      [0.835, TABLE_SURFACE_Y + 0.032, zLeg],
      [0, 0, 0.08],
      [1, 1, 1],
      'extremities'
    );
    addBoneMesh(
      new THREE.SphereGeometry(0.021, 12, 12),
      boneMat,
      [0.822, TABLE_SURFACE_Y + 0.058, zLeg],
      [0, 0, -0.18],
      [1.1, 0.85, 0.95],
      'extremities'
    );
    for (let mt = 0; mt < 5; mt++) {
      const mtZ = zLeg + side * (-0.022 + mt * 0.011);
      const isHallux = mt === 0;
      const mtLen = isHallux ? 0.054 : 0.058 - mt * 0.003;
      addBoneMesh(
        createAnatomicalLongBoneGeometry(
          mtLen,
          isHallux ? 0.0048 : 0.0036,
          1.45,
          1.55,
          0.002
        ),
        boneMat,
        [0.854, TABLE_SURFACE_Y + 0.098 - mt * 0.004, mtZ],
        [0, 0, -0.18],
        [1, 1, 1],
        'extremities'
      );
      addBoneMesh(
        new THREE.CapsuleGeometry(
          isHallux ? 0.0052 : 0.0038,
          isHallux ? 0.018 : 0.014,
          8,
          10
        ),
        boneMat,
        [0.875, TABLE_SURFACE_Y + 0.138 - mt * 0.005, mtZ],
        [0, 0, -0.22],
        [1, 1, 1],
        'extremities'
      );
    }
  });

  rootGroup.add(osteologyGroup);

  // ===========================================================================
  // LAYER 3: 3D INTERNAL VISCERAL ORGANS, VASCULAR TREE & MYOFASCIAL BUNDLES
  // ===========================================================================
  const visceralMyoGroup = new THREE.Group();

  const neuralMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
  });
  const pulmonaryMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.42,
    metalness: 0.08,
    transparent: true,
    opacity: 0.65,
  });
  const vascularMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.25,
    roughness: 0.3,
    metalness: 0.2,
  });
  const hepaticMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.38,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
  });
  const entericMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.2,
    roughness: 0.38,
    metalness: 0.1,
    transparent: true,
    opacity: 0.7,
  });
  const myofascialMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.45,
    metalness: 0.12,
    transparent: true,
    opacity: 0.56,
  });

  // 3A. Bilateral Cerebral Hemispheres inside Cranium
  [-1, 1].forEach((side) => {
    const hemi = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 18, 16),
      neuralMat
    );
    hemi.position.set(-0.805, TABLE_SURFACE_Y + 0.142, side * 0.028);
    hemi.scale.set(1.22, 0.88, 0.68);
    visceralMyoGroup.add(hemi);
  });

  // 3B. Bilateral Pulmonary Lobes (Left & Right Lungs) & Mediastinal Heart
  [-1, 1].forEach((side) => {
    const lung = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.052, 0.11, 14, 18),
      pulmonaryMat
    );
    lung.rotation.z = Math.PI / 2;
    lung.position.set(-0.44, TABLE_SURFACE_Y + 0.115, side * 0.068);
    lung.scale.set(0.82, 1.0, 0.92);
    visceralMyoGroup.add(lung);
  });

  const heartMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.038, 0.082, 16),
    vascularMat
  );
  heartMesh.position.set(-0.42, TABLE_SURFACE_Y + 0.13, -0.018);
  heartMesh.rotation.set(0.25, 0, -1.1);
  visceralMyoGroup.add(heartMesh);

  // 3C. Descending Thoracic/Abdominal Aorta + Carotid & Iliac/Femoral Arterial Tree
  const aortaTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.0075, 0.52, 12),
    vascularMat
  );
  aortaTrunk.rotation.z = Math.PI / 2;
  aortaTrunk.position.set(-0.26, TABLE_SURFACE_Y + 0.088, 0);
  visceralMyoGroup.add(aortaTrunk);

  [-1, 1].forEach((side) => {
    // Carotid vessels
    const carotid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.18, 8),
      vascularMat
    );
    carotid.rotation.z = Math.PI / 2;
    carotid.position.set(-0.62, TABLE_SURFACE_Y + 0.11, side * 0.026);
    visceralMyoGroup.add(carotid);

    // Iliac & Femoral vessels
    const femoral = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0035, 0.52, 8),
      vascularMat
    );
    femoral.rotation.z = Math.PI / 2;
    femoral.rotation.y = -side * 0.12;
    femoral.position.set(0.26, TABLE_SURFACE_Y + 0.075, side * 0.068);
    visceralMyoGroup.add(femoral);
  });

  // 3D. Hepatic Lobe (Liver), Gastric Compartment & Enteric Coils (Microbial Core)
  const liverMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.064, 16, 16),
    hepaticMat
  );
  liverMesh.position.set(-0.29, TABLE_SURFACE_Y + 0.115, 0.055);
  liverMesh.scale.set(0.95, 0.65, 1.15);
  visceralMyoGroup.add(liverMesh);

  const entericCoreMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 20, 18),
    entericMat
  );
  entericCoreMesh.position.set(-0.14, TABLE_SURFACE_Y + 0.098, 0);
  entericCoreMesh.scale.set(1.26, 0.56, 0.96);
  visceralMyoGroup.add(entericCoreMesh);

  // 3E. Longitudinal Myofascial Bands (Pectoralis, Rectus Abdominis, Quadriceps)
  [-1, 1].forEach((side) => {
    const rectusBand = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.016, 0.34, 10, 14),
      myofascialMat
    );
    rectusBand.rotation.z = Math.PI / 2;
    rectusBand.position.set(-0.24, TABLE_SURFACE_Y + 0.148, side * 0.038);
    visceralMyoGroup.add(rectusBand);

    const quadBand = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.26, 10, 14),
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
  // LAYER 5: REAL-TIME DERMAL BIOPHYSICAL VAPOR & MICRO-CLIMATE BOUNDARY PLUME
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

    // Refresh procedural human dermal skin texture when ADD, RH, or airflow changes
    const dermalKey = `${Math.round(addVal / 4)}-${Math.round(params.humidity / 3)}-${params.airflow.toFixed(1)}`;
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
      osteologyGroup.visible = addVal > 280; // Underlying skeleton emerges in late stage
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
        ? Math.max(0.62, 0.72 + massRatio * 0.28)
        : layerMode === 'anatomical-surface'
          ? Math.max(0.76, 0.65 + massRatio * 0.3)
          : layerMode === 'thermal-ir'
            ? 0.84
            : layerMode === 'myofascial-visceral'
              ? 0.28
              : layerMode === 'wireframe-shell'
                ? 0.34
                : 0.42 + massRatio * 0.34;

    // Region-selective highlighting & LWIR thermal / dermal skin shading
    const thermalColors: Record<AnatomicalRegionId, number> = {
      'head-neck': addVal > 85 && addVal < 250 ? 0x38bdf8 : 0x0284c7,
      thorax: addVal > 85 && addVal < 260 ? 0x22d3ee : 0x0ea5e9,
      'abdomen-pelvis': addVal > 60 && addVal < 280 ? 0xf59e0b : 0x06b6d4,
      extremities: 0x1d4ed8,
    };

    // Epidermal moisture clearcoat & roughness simulation (wet adipocere vs dry desiccation)
    const dermalRoughness =
      params.humidity > 80
        ? 0.26
        : params.humidity < 45 || params.airflow > 1.0
          ? 0.68
          : 0.42;
    const dermalClearcoat =
      params.humidity > 80 ? 0.55 : params.humidity < 45 ? 0.06 : 0.24;

    (Object.keys(regionShellMats) as AnatomicalRegionId[]).forEach((rId) => {
      const mat = regionShellMats[rId];
      const isSel = rId === selectedRegionId;

      if (layerMode === 'dermal-skin') {
        const isLateSkeleton = addVal > 280;
        mat.map = currentDermalTex;
        mat.transparent = isLateSkeleton;
        mat.depthWrite = !isLateSkeleton;
        mat.opacity = isLateSkeleton ? baseOpacity : 1.0;
        mat.roughness = dermalRoughness;
        mat.clearcoat = dermalClearcoat;
        mat.color.setHex(isSel ? 0xfff3eb : 0xffede0);
        mat.sheenColor.setHex(
          addVal < 110 ? 0xd9795d : params.humidity > 80 ? 0xc28a70 : 0xb87654
        );
        mat.emissive.setHex(isSel ? 0x4f1e12 : 0x3b150c);
        mat.emissiveIntensity = isSel ? 0.14 : 0.1;
        mat.needsUpdate = true;
      } else if (layerMode === 'thermal-ir') {
        mat.map = null;
        mat.transparent = true;
        mat.depthWrite = true;
        mat.opacity = baseOpacity;
        mat.color.setHex(thermalColors[rId]);
        mat.emissive.setHex(
          rId === 'abdomen-pelvis' && addVal > 60 && addVal < 280
            ? 0xd97706
            : isSel
              ? 0x0284c7
              : 0x0f172a
        );
        mat.emissiveIntensity =
          rId === 'abdomen-pelvis' && addVal > 60 && addVal < 280 ? 0.45 : 0.22;
        mat.needsUpdate = true;
      } else {
        mat.map = null;
        mat.transparent = true;
        mat.depthWrite = layerMode === 'anatomical-surface';
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

    // Dynamic Structural Volume Scaling on Sculpted Abdomen & Torso
    let bloatScaleY = 1.0;
    if (addVal > 45 && addVal < 265) {
      const bloatCurve = Math.sin(((addVal - 45) / 220) * Math.PI);
      bloatScaleY = 1.0 + bloatCurve * 0.22;
    } else if (addVal >= 265) {
      bloatScaleY = Math.max(0.72, 1.0 - ((addVal - 265) / 250) * 0.26);
    }

    // Apply vertex-level anterior abdominal displacement tapering to 0 at x = -0.23 so the thorax-abdomen seam remains 100% watertight
    const abPos = abdomenLoft.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const baseAb = abdomenLoft.basePositions;
    for (let k = 0; k < abPos.count; k++) {
      const bx = baseAb[k * 3];
      const by = baseAb[k * 3 + 1];
      const bz = baseAb[k * 3 + 2];
      const heightAboveTable = Math.max(0, by - TABLE_SURFACE_Y);
      // Smoothly pin boundary at x = -0.23 (seamWeight = 0) and peak around umbilical region (x = -0.09)
      const seamWeight = Math.min(1, Math.max(0, (bx - -0.23) / 0.07));
      const axialFactor =
        seamWeight * Math.exp(-Math.pow((bx - -0.09) * 5.4, 2));
      const newHeight =
        heightAboveTable * (1 + (bloatScaleY - 1) * axialFactor);
      abPos.setXYZ(
        k,
        bx,
        TABLE_SURFACE_Y + newHeight,
        bz * (1 + (bloatScaleY - 1) * 0.16 * axialFactor)
      );
    }
    abPos.needsUpdate = true;
    abdomenLoft.geometry.computeVertexNormals();

    // Apply uniform lateral contraction across neck, thorax, and abdomen so vertex rings stay seamlessly locked
    const torsoContraction = 0.88 + massRatio * 0.12;
    neckEnv.mesh.scale.set(1.0, 1.0, torsoContraction);
    neckEnv.wMesh.scale.set(1.003, 1.003, torsoContraction * 1.003);
    thoraxEnv.mesh.scale.set(1.0, 1.0, torsoContraction);
    thoraxEnv.wMesh.scale.set(1.003, 1.003, torsoContraction * 1.003);
    abdomenEnv.mesh.scale.set(1.0, 1.0, torsoContraction);
    abdomenEnv.wMesh.scale.set(1.003, 1.003, torsoContraction * 1.003);

    // Pulse enteric core during active decomposition
    const entericPulse =
      addVal > 50 && addVal < 265 ? 1 + Math.sin(clock * 3.2) * 0.06 : 1;
    entericCoreMesh.scale.set(
      1.26 * entericPulse,
      0.56 * bloatScaleY * entericPulse,
      0.96 * entericPulse
    );

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

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('wheel', onWheel, { passive: false });
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

      // Smooth damped camera motion
      curAz += (targetAz - curAz) * 0.14;
      curEl += (targetEl - curEl) * 0.14;
      curDist += (targetDist - curDist) * 0.14;

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
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('wheel', onWheel);
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
      className={`rounded-xl border overflow-hidden ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0B1120] border-slate-800 text-slate-100'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-950 border-slate-800/80 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Scan
            className={`w-4 h-4 ${
              isLightMode ? 'text-cyan-600' : 'text-cyan-400'
            }`}
          />
          <span
            className={`text-xs font-mono tracking-wider font-semibold ${
              isLightMode ? 'text-slate-900' : 'text-cyan-300'
            }`}
          >
            FORENSIC SUBJECT MODEL · 3D ANATOMICAL SCANNER
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
            Composite TBS:{' '}
            <strong
              className={isLightMode ? 'text-cyan-700' : 'text-cyan-300'}
            >
              {totalTbs}/47
            </strong>
          </span>
          <span className="text-slate-500">·</span>
          <span
            className={isLightMode ? 'text-emerald-700' : 'text-emerald-400'}
          >
            Sculpted 3D Anatomy
          </span>
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
        className={`relative w-full ${
          compact ? 'h-[360px]' : 'h-[480px]'
        } select-none`}
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
            Mass Retention: {metrics.massRetentionPercent}% · Volume Ratio:{' '}
            {(activeData.structuralVolumeRatio * 100).toFixed(0)}%
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
