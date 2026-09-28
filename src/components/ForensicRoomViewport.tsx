import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  DECOMPOSITION_STAGES,
  ENVIRONMENTAL_PRESETS,
  EnvironmentalParams,
  GENERATED_ASSETS,
  ROOM_OBJECTS,
  RoomConditionType,
  RoomObjectInfo,
} from '../data/simulationData';
import { SimulationMetrics } from '../utils/simulationMath';
import {
  ANATOMICAL_REGIONS,
  AnatomicalRegionId,
  createForensicSubject3DGroup,
  createSurgicalEnvMap,
  ForensicSubjectModel,
  StructuralLayerMode,
} from './ForensicSubjectModel';
import {
  Camera,
  Crosshair,
  GripHorizontal,
  GripVertical,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Scan,
  Sliders,
} from 'lucide-react';

interface ForensicRoomViewportProps {
  params: EnvironmentalParams;
  metrics: SimulationMetrics;
  selectedObject: RoomObjectInfo;
  onSelectObject: (obj: RoomObjectInfo) => void;
  inspectedObjectIds: string[];
  isLightMode: boolean;
  onChangeParams?: (newParams: EnvironmentalParams) => void;
  onJumpToSimDay?: (day: number) => void;
}

type InspectorTab = 'inspector' | 'live-env' | 'stage-camera';

const ROOM_CONDITIONS: RoomConditionType[] = [
  'Highland Natural Draft',
  'Sealed Indoor Chamber',
  'High-Moisture Monsoonal',
  'Desiccating Forced Air',
];

// Helper: Build seamless laboratory epoxy tile floor texture with forensic grid & drainage markings
function createEpoxyFloorTexture(isLight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isLight ? '#cbd5e1' : '#0b1220';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tile bevel grid
  ctx.strokeStyle = isLight ? '#94a3b8' : '#162238';
  ctx.lineWidth = 2;
  const step = 64;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Cyan forensic safety perimeter & measurement crosshairs
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.36)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 484, 484);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

// Helper: Laser-etched metric ruler texture (0 cm to 200 cm) for the stainless-steel autopsy table rail
function createMetricRulerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 1024, 64);

  ctx.strokeStyle = '#38bdf8';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px monospace';

  for (let cm = 0; cm <= 200; cm += 2) {
    const x = 24 + (cm / 200) * 976;
    const isMajor = cm % 20 === 0;
    const isMid = cm % 10 === 0;
    ctx.lineWidth = isMajor ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, isMajor ? 32 : isMid ? 22 : 12);
    ctx.stroke();
    if (isMajor) {
      ctx.fillText(`${cm}cm`, x - 18, 52);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Helper: Dynamic 3D digital wall clock & telemetry screen texture
function createWallTelemetryTexture(
  simDay: number,
  add: number,
  temp: number,
  rh: number,
  stageShort: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 504, 152);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('BAGUIO FORENSIC CHAMBER · 1,540m ASL', 20, 36);

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(
    `DAY ${simDay.toFixed(1)} | ${temp.toFixed(1)}°C | ${rh}% RH`,
    20,
    90
  );

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 21px monospace';
  ctx.fillText(
    `ADD: ${add.toFixed(0)} °C·d  ·  ${stageShort.toUpperCase()}`,
    20,
    134
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Helper: Dynamic LIMS Workstation Monitor & Wall Instrument Screen Texture
function createInstrumentScreenTexture(
  title: string,
  primaryVal: string,
  secondaryVal: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 384, 256);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 376, 248);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(title, 18, 36);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 48px monospace';
  ctx.fillText(primaryVal, 18, 108);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(secondaryVal, 18, 152);

  // Simulated live telemetry waveform
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 18; x <= 360; x += 8) {
    const y = 205 + Math.sin(x * 0.06) * 18 + Math.cos(x * 0.15) * 8;
    if (x === 18) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Helper: Procedural Baguio 1,540m Cordillera Pine Highland & Fog Panorama for North Observation Window (WIN-09)
function createBaguioWindowViewTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Cool Cordillera highland sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 384);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.45, '#1e3a5f');
  skyGrad.addColorStop(0.78, '#64748b');
  skyGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 768, 384);

  // Distant Cordillera mountain ridges
  const drawRidge = (
    baseY: number,
    amp: number,
    freq: number,
    phase: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 384);
    for (let x = 0; x <= 768; x += 8) {
      const y =
        baseY +
        Math.sin(x * freq + phase) * amp +
        Math.cos(x * freq * 2.3 + phase) * (amp * 0.42);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(768, 384);
    ctx.closePath();
    ctx.fill();
  };

  drawRidge(175, 28, 0.009, 0.5, '#1e293b');
  drawRidge(215, 22, 0.012, 2.1, '#0f292e');
  drawRidge(255, 18, 0.015, 4.0, '#0c2224');

  // Highland valley advection fog layer
  const fogGrad = ctx.createLinearGradient(0, 185, 0, 290);
  fogGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
  fogGrad.addColorStop(0.5, 'rgba(203, 213, 225, 0.36)');
  fogGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, 185, 768, 105);

  // Benguet Pine (Pinus insularis) silhouettes along the foreground ridge
  for (let p = 0; p < 34; p++) {
    const px = 12 + p * 22.5 + ((p * 17) % 9);
    const treeBaseY = 384;
    const treeTopY = 175 + ((p * 29) % 75);
    ctx.strokeStyle = '#061417';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, treeBaseY);
    ctx.lineTo(px, treeTopY);
    ctx.stroke();

    ctx.fillStyle = p % 2 === 0 ? '#082022' : '#0b292b';
    for (let tier = 0; tier < 5; tier++) {
      const ty = treeTopY + tier * 17;
      const tw = 10 + tier * 5.5;
      ctx.beginPath();
      ctx.moveTo(px, ty - 8);
      ctx.lineTo(px - tw, ty + 12);
      ctx.lineTo(px + tw, ty + 12);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Helper: 3D Floating Node Callout Badge Sprite Texture (`SEN-01` .. `SPC-10`)
function createNodeCalloutTexture(
  code: string,
  shortName: string,
  isSelected: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 320, 80);
  ctx.fillStyle = isSelected
    ? 'rgba(6, 182, 212, 0.96)'
    : 'rgba(9, 14, 26, 0.9)';
  ctx.strokeStyle = isSelected ? '#ffffff' : '#22d3ee';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(6, 6, 308, 60, 12);
  ctx.fill();
  ctx.stroke();

  // Bottom pointer triangle
  ctx.beginPath();
  ctx.moveTo(148, 66);
  ctx.lineTo(160, 78);
  ctx.lineTo(172, 66);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isSelected ? '#020617' : '#22d3ee';
  ctx.font = 'bold 21px monospace';
  ctx.fillText(code, 18, 34);

  ctx.fillStyle = isSelected ? '#0f172a' : '#f1f5f9';
  ctx.font = 'bold 16px sans-serif';
  const label =
    shortName.length > 22 ? `${shortName.slice(0, 21)}…` : shortName;
  ctx.fillText(label, 18, 55);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Helper: Numbered Yellow Forensic Evidence A-Frame Tent Card Texture (`01`..`04`)
function createEvidenceTentTexture(numStr: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 120, 120);

  // Top photogrammetric crosshair circle
  ctx.beginPath();
  ctx.arc(64, 24, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(52, 24);
  ctx.lineTo(76, 24);
  ctx.moveTo(64, 12);
  ctx.lineTo(64, 36);
  ctx.stroke();

  // Bold Evidence Number
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(numStr, 64, 84);

  // Bottom metric scale ticks
  ctx.fillRect(10, 104, 108, 16);
  ctx.fillStyle = '#facc15';
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(12 + i * 18, 106, 18, 12);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const ForensicRoomViewport: React.FC<ForensicRoomViewportProps> = ({
  params,
  metrics,
  selectedObject,
  onSelectObject,
  inspectedObjectIds,
  isLightMode,
  onChangeParams,
  onJumpToSimDay,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'subject-model' | '2d'>('3d');
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('inspector');

  // 3D Structural Anatomy & Dermal Skin Subject Controls
  const [layerMode, setLayerMode] = useState<StructuralLayerMode>('dermal-skin');
  const [showReferencePlanes, setShowReferencePlanes] = useState<boolean>(true);
  const [showTelemetryNodes, setShowTelemetryNodes] = useState<boolean>(true);
  const [selectedRegionId, setSelectedRegionId] =
    useState<AnatomicalRegionId>('abdomen-pelvis');

  // Target Camera Coordinates (Interpolated smoothly in 60fps loop)
  const [cameraAngle, setCameraAngle] = useState<number>(0.46);
  const [cameraPitch, setCameraPitch] = useState<number>(0.5);
  const [cameraZoom, setCameraZoom] = useState<number>(3.95);
  const [cameraTargetX, setCameraTargetX] = useState<number>(0);
  const [cameraTargetY, setCameraTargetY] = useState<number>(0.92);
  const [cameraTargetZ, setCameraTargetZ] = useState<number>(0);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [hoveredObjectName, setHoveredObjectName] = useState<string | null>(
    null
  );

  // Responsive & Resizable Workspace State
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const [splitRatio, setSplitRatio] = useState<number>(58); // Left panel % on lg+ screens (36% to 78%)
  const [stageHeight, setStageHeight] = useState<number>(520); // 3D viewport height in px (320px to 880px)
  const [isInspectorCollapsed, setIsInspectorCollapsed] =
    useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isDraggingHeight, setIsDraggingHeight] = useState<boolean>(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const startSplitResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;
    setIsDraggingSplit(true);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const clientX =
        'touches' in ev
          ? ev.touches[0]?.clientX ?? 0
          : (ev as MouseEvent).clientX;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(36, Math.min(78, Math.round(pct * 10) / 10)));
    };

    const onEnd = () => {
      setIsDraggingSplit(false);
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

  const startStageHeightResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startH = stageHeight;
    setIsDraggingHeight(true);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const clientY =
        'touches' in ev
          ? ev.touches[0]?.clientY ?? startY
          : (ev as MouseEvent).clientY;
      const nextH = Math.max(320, Math.min(880, startH + (clientY - startY)));
      setStageHeight(nextH);
    };

    const onEnd = () => {
      setIsDraggingHeight(false);
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

  const stateRef = useRef({
    params,
    metrics,
    selectedObject,
    layerMode,
    showReferencePlanes,
    showTelemetryNodes,
    selectedRegionId,
    cameraAngle,
    cameraPitch,
    cameraZoom,
    cameraTargetX,
    cameraTargetY,
    cameraTargetZ,
    autoOrbit,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      params,
      metrics,
      selectedObject,
      layerMode,
      showReferencePlanes,
      showTelemetryNodes,
      selectedRegionId,
      cameraAngle,
      cameraPitch,
      cameraZoom,
      cameraTargetX,
      cameraTargetY,
      cameraTargetZ,
      autoOrbit,
    };
  }, [
    params,
    metrics,
    selectedObject,
    layerMode,
    showReferencePlanes,
    showTelemetryNodes,
    selectedRegionId,
    cameraAngle,
    cameraPitch,
    cameraZoom,
    cameraTargetX,
    cameraTargetY,
    cameraTargetZ,
    autoOrbit,
  ]);

  // Smoothly aims and zooms the 3D camera directly at any selected Laboratory Node & Instrument
  const focusCameraOnObject = (objectId: string) => {
    setAutoOrbit(false);
    switch (objectId) {
      case 'env-sensor': // SEN-01 North-West Multi-Gas Telemetry Mast
        setCameraAngle(0.54);
        setCameraPitch(0.24);
        setCameraZoom(2.25);
        setCameraTargetX(-2.45);
        setCameraTargetY(1.55);
        setCameraTargetZ(-2.25);
        break;
      case 'exam-table': // TBL-02 Stainless Steel Examination Table & Scale
        setCameraAngle(0.46);
        setCameraPitch(0.42);
        setCameraZoom(3.35);
        setCameraTargetX(0.0);
        setCameraTargetY(0.72);
        setCameraTargetZ(0.0);
        break;
      case 'evidence-markers': // EVD-03 Photogrammetric Tent Markers #01-#04
        setCameraAngle(0.32);
        setCameraPitch(0.5);
        setCameraZoom(2.15);
        setCameraTargetX(-0.15);
        setCameraTargetY(0.88);
        setCameraTargetZ(0.15);
        break;
      case 'research-computer': // WKS-04 Dual-Monitor LIMS Workstation
        setCameraAngle(-0.88);
        setCameraPitch(0.28);
        setCameraZoom(2.35);
        setCameraTargetX(2.35);
        setCameraTargetY(0.96);
        setCameraTargetZ(0.85);
        break;
      case 'camera': // CAM-05 Ceiling Gantry LWIR Thermal & Optical Rig
        setCameraAngle(0.38);
        setCameraPitch(0.14);
        setCameraZoom(2.25);
        setCameraTargetX(0.0);
        setCameraTargetY(2.46);
        setCameraTargetZ(0.0);
        break;
      case 'ventilation': // VNT-06 Upper West Laminar HEPA Filtration Unit
        setCameraAngle(1.02);
        setCameraPitch(0.18);
        setCameraZoom(2.25);
        setCameraTargetX(-3.18);
        setCameraTargetY(2.38);
        setCameraTargetZ(-1.1);
        break;
      case 'temp-monitor': // TMP-07 West Wall NIST Thermistor Console
        setCameraAngle(1.18);
        setCameraPitch(0.18);
        setCameraZoom(1.85);
        setCameraTargetX(-3.35);
        setCameraTargetY(1.48);
        setCameraTargetZ(0.45);
        break;
      case 'humidity-monitor': // HUM-08 North-East Wall Hygrometer Console
        setCameraAngle(-0.22);
        setCameraPitch(0.18);
        setCameraZoom(1.95);
        setCameraTargetX(2.25);
        setCameraTargetY(1.48);
        setCameraTargetZ(-2.85);
        break;
      case 'window': // WIN-09 North Observation Window (Baguio 1,540m)
        setCameraAngle(0.0);
        setCameraPitch(0.16);
        setCameraZoom(3.1);
        setCameraTargetX(0.0);
        setCameraTargetY(1.82);
        setCameraTargetZ(-2.85);
        break;
      case 'specimen-area': // SPC-10 3D Human Subject
      default:
        setCameraAngle(0.38);
        setCameraPitch(0.48);
        setCameraZoom(2.9);
        setCameraTargetX(-0.04);
        setCameraTargetY(0.92);
        setCameraTargetZ(0.0);
        break;
    }
  };

  const applyCameraPreset = (
    preset:
      | 'body-closeup'
      | 'overhead-autopsy'
      | 'full-room'
      | 'window-context'
      | 'sensor-wall'
      | 'workstation'
  ) => {
    setAutoOrbit(false);
    if (preset === 'body-closeup') {
      focusCameraOnObject('specimen-area');
      const spc = ROOM_OBJECTS.find((o) => o.id === 'specimen-area');
      if (spc) onSelectObject(spc);
    } else if (preset === 'overhead-autopsy') {
      setCameraAngle(0.01);
      setCameraPitch(1.32);
      setCameraZoom(3.3);
      setCameraTargetX(0);
      setCameraTargetY(0.88);
      setCameraTargetZ(0);
    } else if (preset === 'full-room') {
      setCameraAngle(0.56);
      setCameraPitch(0.44);
      setCameraZoom(6.1);
      setCameraTargetX(0);
      setCameraTargetY(1.05);
      setCameraTargetZ(0);
    } else if (preset === 'window-context') {
      focusCameraOnObject('window');
      const win = ROOM_OBJECTS.find((o) => o.id === 'window');
      if (win) onSelectObject(win);
    } else if (preset === 'sensor-wall') {
      focusCameraOnObject('env-sensor');
      const sen = ROOM_OBJECTS.find((o) => o.id === 'env-sensor');
      if (sen) onSelectObject(sen);
    } else if (preset === 'workstation') {
      focusCameraOnObject('research-computer');
      const wks = ROOM_OBJECTS.find((o) => o.id === 'research-computer');
      if (wks) onSelectObject(wks);
    }
  };

  useEffect(() => {
    if (viewMode !== '3d') return;
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
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.16;
    } catch {
      setWebglSupported(false);
      setViewMode('2d');
      return;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglSupported(false);
      setViewMode('2d');
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xdbeafe : 0x060a12);
    scene.fog = new THREE.FogExp2(isLightMode ? 0xdbeafe : 0x060a12, 0.028);
    scene.environment = createSurgicalEnvMap(renderer);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    // =========================================================================
    // Multi-Source Forensic Laboratory Lighting (5600K High-CRI Surgical Daylight)
    // =========================================================================
    const hemiLight = new THREE.HemisphereLight(0xfff5eb, 0x1e293b, 1.05);
    scene.add(hemiLight);

    const surgicalSpot = new THREE.SpotLight(
      0xfffaf2,
      3.15,
      12,
      Math.PI / 2.8,
      0.42,
      1
    );
    surgicalSpot.position.set(0, 2.58, 0.15);
    surgicalSpot.castShadow = true;
    surgicalSpot.shadow.mapSize.width = 1024;
    surgicalSpot.shadow.mapSize.height = 1024;
    surgicalSpot.shadow.bias = -0.0005;
    scene.add(surgicalSpot);

    const fillLight = new THREE.DirectionalLight(0xfff1e0, 1.15);
    fillLight.position.set(3.5, 4.2, 3.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffe4c4, 1.05, 10);
    rimLight.position.set(-2.6, 2.2, -2.1);
    scene.add(rimLight);

    const bodySubsurfaceLight = new THREE.PointLight(0xffdfb8, 1.1, 4.2);
    bodySubsurfaceLight.position.set(0, 1.42, 0.25);
    scene.add(bodySubsurfaceLight);

    // =========================================================================
    // Laboratory Architectural Envelope (Epoxy Floor, Walls, Ceiling Troffers)
    // =========================================================================
    const floorTex = createEpoxyFloorTexture(isLightMode);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.24,
      metalness: 0.22,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 6.8), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25,
    });
    const floorGrate = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.25),
      grateMat
    );
    floorGrate.rotation.x = -Math.PI / 2;
    floorGrate.position.set(0, 0.005, 0);
    scene.add(floorGrate);

    const wallMat = new THREE.MeshStandardMaterial({
      color: isLightMode ? 0xf1f5f9 : 0x0f172a,
      roughness: 0.55,
      metalness: 0.12,
    });
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 3.3, 0.16),
      wallMat
    );
    northWall.position.set(0, 1.65, -3.2);
    northWall.receiveShadow = true;
    scene.add(northWall);

    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 3.3, 6.8),
      wallMat
    );
    westWall.position.set(-3.68, 1.65, 0);
    westWall.receiveShadow = true;
    scene.add(westWall);

    // Stainless Steel Bumper Dado Rails & Baseboards
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.78,
      roughness: 0.22,
    });
    const northRail = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 0.08, 0.04),
      railMat
    );
    northRail.position.set(0, 1.05, -3.11);
    scene.add(northRail);
    const westRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.08, 6.7),
      railMat
    );
    westRail.position.set(-3.59, 1.05, 0);
    scene.add(westRail);

    // Overhead Cleanroom Gantry Trusses & Recessed LED Troffer Panels
    [-1.8, 1.8].forEach((gx) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 6.4),
        railMat
      );
      beam.position.set(gx, 3.15, 0);
      scene.add(beam);
    });
    [-1.6, 1.6].forEach((lz) => {
      const ledPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.45),
        new THREE.MeshBasicMaterial({
          color: 0xe0f2fe,
          side: THREE.DoubleSide,
        })
      );
      ledPanel.rotation.x = Math.PI / 2;
      ledPanel.position.set(0, 3.18, lz);
      scene.add(ledPanel);
    });

    // East Wall Stainless-Steel Forensic Bio-Storage Cabinets with Glass Doors
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.68,
      roughness: 0.28,
    });
    [-1.85, -0.72].forEach((cz) => {
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 2.08, 0.96),
        cabinetMat
      );
      cab.position.set(3.25, 1.04, cz);
      cab.castShadow = true;
      scene.add(cab);

      const glassDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.82, 1.55),
        new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.22,
          roughness: 0.1,
        })
      );
      glassDoor.rotation.y = -Math.PI / 2;
      glassDoor.position.set(2.92, 1.15, cz);
      scene.add(glassDoor);
    });

    // Live 3D Digital Wall Telemetry Clock mounted above the Observation Window
    const initialClockTex = createWallTelemetryTexture(
      metrics.simDay,
      metrics.add,
      params.temperature,
      params.humidity,
      metrics.currentStage.shortTitle
    );
    const wallClockMat = new THREE.MeshBasicMaterial({ map: initialClockTex });
    const wallClockBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.82, 0.44),
      wallClockMat
    );
    wallClockBoard.position.set(0, 2.82, -3.09);
    scene.add(wallClockBoard);

    // Interactive Clickable Meshes, Highlight Rings & 3D Floating Node Callout Badges
    const clickableMeshes: THREE.Object3D[] = [];
    const objectHighlightRings: Record<string, THREE.Mesh> = {};
    const objectCalloutSprites: Record<
      string,
      {
        sprite: THREE.Sprite;
        code: string;
        shortName: string;
        baseY: number;
        isSelRendered: boolean;
      }
    > = {};

    const createHighlightRing = (
      id: string,
      ringPos: [number, number, number],
      ringRadius = 0.26,
      calloutPos?: [number, number, number]
    ) => {
      const ringGeo = new THREE.RingGeometry(
        ringRadius * 0.8,
        ringRadius,
        36
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(ringPos[0], ringPos[1], ringPos[2]);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);
      objectHighlightRings[id] = ring;

      // Create 3D Floating Callout Badge directly above the instrument
      const objMeta = ROOM_OBJECTS.find((o) => o.id === id);
      if (objMeta) {
        const badgePos = calloutPos || [
          ringPos[0],
          ringPos[1] + 0.45,
          ringPos[2],
        ];
        const spriteMat = new THREE.SpriteMaterial({
          map: createNodeCalloutTexture(objMeta.code, objMeta.name, false),
          transparent: true,
          depthTest: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(badgePos[0], badgePos[1], badgePos[2]);
        sprite.scale.set(0.56, 0.135, 1);
        sprite.renderOrder = 10;
        sprite.userData = { objectId: id };
        scene.add(sprite);
        clickableMeshes.push(sprite);
        objectCalloutSprites[id] = {
          sprite,
          code: objMeta.code,
          shortName: objMeta.name,
          baseY: badgePos[1],
          isSelRendered: false,
        };
      }
    };

    const registerInteractiveGroup = (
      id: string,
      group: THREE.Group,
      ringPos: [number, number, number],
      ringRadius = 0.26,
      calloutPos?: [number, number, number]
    ) => {
      group.userData = { objectId: id };
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          if (!child.userData.objectId) {
            child.userData = { ...child.userData, objectId: id };
          }
          clickableMeshes.push(child);
        }
      });
      scene.add(group);
      createHighlightRing(id, ringPos, ringRadius, calloutPos);
    };

    // =========================================================================
    // 1. WIN-09: Reinforced Observation Window (Baguio City Pine Highland View)
    // =========================================================================
    const windowGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.78,
      roughness: 0.22,
    });
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.94, 1.56, 0.18),
      frameMat
    );
    winFrame.position.set(0, 1.78, -3.12);
    windowGroup.add(winFrame);

    // Stainless steel interior window sill ledge
    const winSill = new THREE.Mesh(
      new THREE.BoxGeometry(3.04, 0.05, 0.26),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.82,
        roughness: 0.2,
      })
    );
    winSill.position.set(0, 1.0, -3.04);
    windowGroup.add(winSill);

    // Procedural Baguio 1,540m Pine Highland Panorama (always renders crisply)
    const baguioPanoramaTex = createBaguioWindowViewTexture();
    const glassMat = new THREE.MeshBasicMaterial({
      map: baguioPanoramaTex,
      color: 0xffffff,
    });
    const winPane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.74, 1.38),
      glassMat
    );
    winPane.position.set(0, 1.78, -3.02);
    windowGroup.add(winPane);

    // Double-glazed acoustic glass specular reflection layer
    const glassSheen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.74, 1.38),
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.16,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
      })
    );
    glassSheen.position.set(0, 1.78, -3.0);
    windowGroup.add(glassSheen);

    // Vertical & horizontal aluminum window mullions
    [-0.9, 0, 0.9].forEach((mx) => {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 1.4, 0.05),
        frameMat
      );
      mullion.position.set(mx, 1.78, -2.99);
      windowGroup.add(mullion);
    });
    const transMullion = new THREE.Mesh(
      new THREE.BoxGeometry(2.76, 0.032, 0.045),
      frameMat
    );
    transMullion.position.set(0, 2.15, -2.99);
    windowGroup.add(transMullion);

    registerInteractiveGroup(
      'window',
      windowGroup,
      [0, 1.03, -2.92],
      0.22,
      [0, 2.34, -2.9]
    );

    // =========================================================================
    // 2. TBL-02: Stainless Steel Forensic Examination Table (`exam-table`)
    //    + Laser-Etched Ruler, Drainage Plates, Mayo Instrument Cart & `ForensicSubjectModel`
    // =========================================================================
    const examTableGroup = new THREE.Group();
    examTableGroup.name = 'exam-table';
    const brushedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.88,
      roughness: 0.18,
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.82,
      roughness: 0.25,
    });

    const tableBed = new THREE.Mesh(
      new THREE.BoxGeometry(2.38, 0.08, 0.92),
      brushedSteelMat
    );
    tableBed.position.set(0, 0.8, 0);
    tableBed.castShadow = true;
    tableBed.receiveShadow = true;
    examTableGroup.add(tableBed);

    // Laser-etched metric scale along the front rim (0cm to 200cm)
    const rulerTex = createMetricRulerTexture();
    const frontRim = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.042, 0.042),
      new THREE.MeshStandardMaterial({
        map: rulerTex,
        metalness: 0.6,
        roughness: 0.25,
      })
    );
    frontRim.position.set(0, 0.85, 0.45);
    examTableGroup.add(frontRim);

    const backRim = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.042, 0.042),
      darkSteelMat
    );
    backRim.position.set(0, 0.85, -0.45);
    examTableGroup.add(backRim);

    // Perforated stainless-steel recessed drainage louvers under the subject
    for (let d = -0.82; d <= 0.72; d += 0.31) {
      const louver = new THREE.Mesh(
        new THREE.PlaneGeometry(0.24, 0.78),
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.85,
          roughness: 0.28,
        })
      );
      louver.rotation.x = -Math.PI / 2;
      louver.position.set(d, 0.841, 0);
      examTableGroup.add(louver);
    }

    // Distal hydro-aspirator sink basin & gooseneck surgical faucet
    const sinkRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.05, 0.88),
      darkSteelMat
    );
    sinkRim.position.set(1.06, 0.85, 0);
    examTableGroup.add(sinkRim);
    const faucetNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.28, 12),
      brushedSteelMat
    );
    faucetNeck.position.set(1.14, 0.98, -0.32);
    examTableGroup.add(faucetNeck);
    const faucetSpout = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.012, 10, 18, Math.PI),
      brushedSteelMat
    );
    faucetSpout.position.set(1.085, 1.11, -0.32);
    examTableGroup.add(faucetSpout);

    // Anthropometric calibration grid on exam table surface
    const tableGrid = new THREE.GridHelper(2.2, 22, 0x06b6d4, 0x334155);
    tableGrid.position.set(-0.05, 0.842, 0);
    tableGrid.scale.set(0.92, 1, 0.38);
    examTableGroup.add(tableGrid);

    // Cervical/Occipital Headrest Block calibrated under the Subject's Cranium
    const headBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.055, 0.24),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.38,
        metalness: 0.25,
      })
    );
    headBlock.position.set(-0.78, 0.8675, 0);
    examTableGroup.add(headBlock);

    // Central Hydraulic Pedestal Column with Live Digital Weight Scale Readout
    const pedestalColumn = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.72, 0.52),
      brushedSteelMat
    );
    pedestalColumn.position.set(0, 0.4, 0);
    pedestalColumn.castShadow = true;
    examTableGroup.add(pedestalColumn);

    const scaleScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'LOAD-CELL MASS SCALE',
        `${metrics.massRetentionPercent}%`,
        `${(68 * (metrics.massRetentionPercent / 100)).toFixed(1)} kg Retained`,
        '#22d3ee'
      ),
    });
    const scaleScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.24),
      scaleScreenMat
    );
    scaleScreen.position.set(0, 0.48, 0.262);
    examTableGroup.add(scaleScreen);

    const pedestalBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.06, 0.68),
      darkSteelMat
    );
    pedestalBase.position.set(0, 0.03, 0);
    examTableGroup.add(pedestalBase);

    // Stainless Steel Mayo Surgical Instrument Stand beside the table
    const mayoStand = new THREE.Group();
    const mayoPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.82, 12),
      brushedSteelMat
    );
    mayoPole.position.set(-0.65, 0.41, 0.72);
    mayoStand.add(mayoPole);
    const mayoTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.02, 0.32),
      brushedSteelMat
    );
    mayoTray.position.set(-0.65, 0.82, 0.72);
    mayoTray.castShadow = true;
    mayoStand.add(mayoTray);
    // Forensic instruments on tray (calipers, digital probe, sample vials)
    const probeTool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.003, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.6 })
    );
    probeTool.rotation.z = Math.PI / 2;
    probeTool.position.set(-0.65, 0.84, 0.68);
    mayoStand.add(probeTool);
    [-0.76, -0.71, -0.66].forEach((vx) => {
      const vial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.055, 10),
        new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.75,
        })
      );
      vial.position.set(vx, 0.855, 0.78);
      mayoStand.add(vial);
    });
    examTableGroup.add(mayoStand);

    // Mount the sculpted 3D ForensicSubjectModel directly onto the `exam-table`
    const subjectController = createForensicSubject3DGroup(false);
    examTableGroup.add(subjectController.rootGroup);

    registerInteractiveGroup(
      'exam-table',
      examTableGroup,
      [0, 0.02, 0],
      0.42,
      [1.05, 1.24, 0.35]
    );
    createHighlightRing(
      'specimen-area',
      [-0.12, 0.845, 0],
      0.34,
      [-0.12, 1.34, 0]
    );

    // =========================================================================
    // 4. EVD-03: Numbered A-Frame Forensic Evidence Markers (#01–#04) & ABFO L-Scales
    // =========================================================================
    const markersGroup = new THREE.Group();
    const markerSpecs: {
      pos: [number, number, number];
      rotY: number;
      num: string;
    }[] = [
      { pos: [-0.94, 0.842, 0.35], rotY: 0.25, num: '01' },
      { pos: [-0.34, 0.842, -0.36], rotY: -0.35, num: '02' },
      { pos: [0.24, 0.842, 0.36], rotY: 0.18, num: '03' },
      { pos: [0.84, 0.842, -0.34], rotY: -0.22, num: '04' },
    ];

    markerSpecs.forEach(({ pos, rotY, num }) => {
      const tentCardGroup = new THREE.Group();
      tentCardGroup.position.set(pos[0], pos[1], pos[2]);
      tentCardGroup.rotation.y = rotY;

      const cardTex = createEvidenceTentTexture(num);
      const cardMat = new THREE.MeshStandardMaterial({
        map: cardTex,
        roughness: 0.28,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });

      // Front sloped A-frame face
      const frontLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.082, 0.095, 0.004),
        cardMat
      );
      frontLeaf.position.set(0, 0.044, 0.022);
      frontLeaf.rotation.x = -0.44;
      frontLeaf.castShadow = true;
      tentCardGroup.add(frontLeaf);

      // Back sloped A-frame face
      const backLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.082, 0.095, 0.004),
        cardMat
      );
      backLeaf.position.set(0, 0.044, -0.022);
      backLeaf.rotation.x = 0.44;
      backLeaf.castShadow = true;
      tentCardGroup.add(backLeaf);

      // Adjacent ABFO No. 2 Photomacrographic L-Scale Ruler on Table Surface
      const scaleMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.3,
      });
      const armA = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.003, 0.018),
        scaleMat
      );
      armA.position.set(0.075, 0.002, 0.02);
      tentCardGroup.add(armA);
      const armB = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.003, 0.09),
        scaleMat
      );
      armB.position.set(0.039, 0.002, -0.016);
      tentCardGroup.add(armB);

      markersGroup.add(tentCardGroup);
    });
    registerInteractiveGroup(
      'evidence-markers',
      markersGroup,
      [-0.94, 0.846, 0.35],
      0.16,
      [-0.94, 1.08, 0.35]
    );

    // =========================================================================
    // 5. SEN-01: Multi-Channel Environmental Sensor Array (North-West Telemetry Mast)
    // =========================================================================
    const sensorGroup = new THREE.Group();
    const senX = -2.55;
    const senZ = -2.35;

    // Heavy 3-leg cast-steel floor tripod base + leveling pads
    const tripodHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.14, 16),
      darkSteelMat
    );
    tripodHub.position.set(senX, 0.07, senZ);
    sensorGroup.add(tripodHub);

    for (let legIdx = 0; legIdx < 3; legIdx++) {
      const ang = (legIdx * Math.PI * 2) / 3 + 0.4;
      const legStrut = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.035, 0.045),
        darkSteelMat
      );
      legStrut.position.set(
        senX + Math.cos(ang) * 0.18,
        0.04,
        senZ + Math.sin(ang) * 0.18
      );
      legStrut.rotation.y = -ang;
      sensorGroup.add(legStrut);
    }

    // Brushed stainless steel vertical telemetry mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.048, 2.24, 20),
      brushedSteelMat
    );
    mast.position.set(senX, 1.15, senZ);
    mast.castShadow = true;
    sensorGroup.add(mast);

    // Multi-Gas Aspirated Sensor Manifold Enclosure (VOC / CO2 / H2S / Barometer)
    const sensorHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.44, 0.28),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.65,
        roughness: 0.24,
      })
    );
    sensorHead.position.set(senX, 1.56, senZ);
    sensorHead.castShadow = true;
    sensorGroup.add(sensorHead);

    // Cyan anodized protective instrument bezel around manifold
    const sensorTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.46, 0.24),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.55,
        roughness: 0.22,
      })
    );
    sensorTrim.position.set(senX, 1.56, senZ - 0.01);
    sensorGroup.add(sensorTrim);

    // Live OLED Telemetry Screen on SEN-01 Manifold
    const senScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'SEN-01 MULTI-GAS',
        `${metrics.vocPpm} ppm`,
        `845.2 hPa · CO2/H2S`,
        '#38bdf8'
      ),
    });
    const senScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.28),
      senScreenMat
    );
    senScreen.position.set(senX, 1.58, senZ + 0.145);
    sensorGroup.add(senScreen);

    // Aspirated gas sampling sniffer tubes & status beacon LED
    [-0.14, 0, 0.14].forEach((tx) => {
      const sniffer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.16, 12),
        brushedSteelMat
      );
      sniffer.position.set(senX + tx, 1.28, senZ + 0.06);
      sensorGroup.add(sniffer);
    });

    const senLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    senLed.position.set(senX + 0.18, 1.74, senZ + 0.145);
    sensorGroup.add(senLed);

    // Top Meteorological Crossbar + Rotating 3-Cup Ultrasonic Anemometer Rotor
    const crossArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.03, 0.03),
      brushedSteelMat
    );
    crossArm.position.set(senX, 2.22, senZ);
    sensorGroup.add(crossArm);

    const anemometerRotor = new THREE.Group();
    anemometerRotor.position.set(senX + 0.24, 2.3, senZ);
    const rotorHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.08, 14),
      darkSteelMat
    );
    anemometerRotor.add(rotorHub);
    for (let c = 0; c < 3; c++) {
      const cAng = (c * Math.PI * 2) / 3;
      const cupArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.11, 8),
        brushedSteelMat
      );
      cupArm.rotation.z = Math.PI / 2;
      cupArm.rotation.y = cAng;
      cupArm.position.set(Math.cos(cAng) * 0.055, 0.02, Math.sin(cAng) * 0.055);
      anemometerRotor.add(cupArm);

      const cup = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 12, 12, 0, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.4,
          roughness: 0.2,
          side: THREE.DoubleSide,
        })
      );
      cup.position.set(Math.cos(cAng) * 0.11, 0.02, Math.sin(cAng) * 0.11);
      cup.rotation.y = cAng;
      anemometerRotor.add(cup);
    }
    sensorGroup.add(anemometerRotor);

    // Barometric static pressure probe on opposite crossbar end
    const baroProbe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.28, 14),
      brushedSteelMat
    );
    baroProbe.position.set(senX - 0.24, 2.32, senZ);
    sensorGroup.add(baroProbe);

    registerInteractiveGroup(
      'env-sensor',
      sensorGroup,
      [senX, 0.02, senZ],
      0.32,
      [senX, 2.58, senZ]
    );

    // =========================================================================
    // 6. VNT-06: Laminar Ventilation & Negative-Pressure HEPA Filtration System
    // =========================================================================
    const ventGroup = new THREE.Group();
    const ductHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.56, 2.02),
      brushedSteelMat
    );
    ductHousing.position.set(-3.4, 2.46, -1.1);
    ductHousing.castShadow = true;
    ventGroup.add(ductHousing);

    // Dark recessed HEPA filter plenum face
    const plenumFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.86, 0.44),
      new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.7,
        metalness: 0.2,
      })
    );
    plenumFace.rotation.y = Math.PI / 2;
    plenumFace.position.set(-3.185, 2.46, -1.1);
    ventGroup.add(plenumFace);

    // Dual Rotating Axial HEPA Impeller Fans inside the plenum
    const hepaFanRotors: THREE.Group[] = [];
    [-1.55, -0.65].forEach((fz) => {
      const fanRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.17, 0.016, 12, 28),
        darkSteelMat
      );
      fanRing.rotation.y = Math.PI / 2;
      fanRing.position.set(-3.18, 2.46, fz);
      ventGroup.add(fanRing);

      const fanRotor = new THREE.Group();
      fanRotor.position.set(-3.18, 2.46, fz);
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.7 })
      );
      hub.rotation.z = Math.PI / 2;
      fanRotor.add(hub);

      for (let b = 0; b < 6; b++) {
        const bAng = (b * Math.PI * 2) / 6;
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 0.14, 0.042),
          brushedSteelMat
        );
        blade.position.set(
          0,
          Math.cos(bAng) * 0.085,
          Math.sin(bAng) * 0.085
        );
        blade.rotation.x = bAng;
        blade.rotation.y = 0.35;
        fanRotor.add(blade);
      }
      ventGroup.add(fanRotor);
      hepaFanRotors.push(fanRotor);
    });

    // Aerodynamic horizontal & vertical supply louvers
    for (let v = -1.92; v <= -0.28; v += 0.24) {
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.44, 0.025),
        brushedSteelMat
      );
      vane.position.set(-3.17, 2.46, v);
      ventGroup.add(vane);
    }

    // Side-mounted Magnehelic Differential Pressure Gauge & HEPA Status Beacon
    const magGauge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.04, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6 })
    );
    magGauge.rotation.x = Math.PI / 2;
    magGauge.position.set(-3.32, 2.46, -0.07);
    ventGroup.add(magGauge);

    registerInteractiveGroup(
      'ventilation',
      ventGroup,
      [-3.18, 2.12, -1.1],
      0.2,
      [-3.12, 2.88, -1.1]
    );

    // =========================================================================
    // 7. TMP-07: NIST Platinum Resistance Temperature Monitor (West Wall Console)
    // =========================================================================
    const tempGroup = new THREE.Group();
    const tempChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.58, 0.54),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.65,
        roughness: 0.25,
      })
    );
    tempChassis.position.set(-3.52, 1.48, 0.45);
    tempChassis.castShadow = true;
    tempGroup.add(tempChassis);

    // Brushed steel wall mounting flanges
    [-0.31, 0.31].forEach((fy) => {
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.05, 0.58),
        brushedSteelMat
      );
      flange.position.set(-3.58, 1.48 + fy, 0.45);
      tempGroup.add(flange);
    });

    const tempScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'TMP-07 THERMISTOR',
        `${params.temperature.toFixed(1)}°C`,
        `Q10 Rate: ${metrics.q10Multiplier}x`,
        '#38bdf8'
      ),
    });
    const tempScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.36),
      tempScreenMat
    );
    tempScreen.rotation.y = Math.PI / 2;
    tempScreen.position.set(-3.435, 1.53, 0.45);
    tempGroup.add(tempScreen);

    // Calibration control buttons & status LED on TMP-07 front bezel
    [-0.12, 0, 0.12].forEach((bz, idx) => {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
        new THREE.MeshStandardMaterial({
          color: idx === 0 ? 0x0ea5e9 : 0x475569,
          metalness: 0.5,
        })
      );
      btn.rotation.z = Math.PI / 2;
      btn.position.set(-3.435, 1.28, 0.45 + bz);
      tempGroup.add(btn);
    });

    // External Stainless-Steel Armored PRT Thermistor Probe & Conduit
    const prtProbe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.01, 0.48, 14),
      brushedSteelMat
    );
    prtProbe.position.set(-3.46, 1.62, 0.82);
    tempGroup.add(prtProbe);
    const prtTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 })
    );
    prtTip.position.set(-3.46, 1.87, 0.82);
    tempGroup.add(prtTip);

    registerInteractiveGroup(
      'temp-monitor',
      tempGroup,
      [-3.42, 1.15, 0.45],
      0.18,
      [-3.38, 1.92, 0.45]
    );

    // =========================================================================
    // 8. HUM-08: Capacitive Thin-Film Polymer Humidity Monitor (North-East Wall)
    // =========================================================================
    const humGroup = new THREE.Group();
    const humChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.58, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.65,
        roughness: 0.25,
      })
    );
    humChassis.position.set(2.25, 1.48, -3.04);
    humChassis.castShadow = true;
    humGroup.add(humChassis);

    [-0.31, 0.31].forEach((fy) => {
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.05, 0.04),
        brushedSteelMat
      );
      flange.position.set(2.25, 1.48 + fy, -3.1);
      humGroup.add(flange);
    });

    const humScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'HUM-08 HYGROMETER',
        `${params.humidity}% RH`,
        `Dew Pt: ${(params.temperature - (100 - params.humidity) / 5).toFixed(1)}°C`,
        '#22d3ee'
      ),
    });
    const humScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.36),
      humScreenMat
    );
    humScreen.position.set(2.25, 1.53, -2.955);
    humGroup.add(humScreen);

    // Sintered-bronze capacitive RH & Dew Point sensor wand mounted atop HUM-08
    const rhProbeStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.24, 16),
      brushedSteelMat
    );
    rhProbeStem.position.set(2.08, 1.88, -3.02);
    humGroup.add(rhProbeStem);
    const rhSinteredCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.09, 16),
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.78,
        roughness: 0.35,
      })
    );
    rhSinteredCap.position.set(2.08, 2.02, -3.02);
    humGroup.add(rhSinteredCap);

    [-0.12, 0, 0.12].forEach((bx, idx) => {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
        new THREE.MeshStandardMaterial({
          color: idx === 0 ? 0x22d3ee : 0x475569,
          metalness: 0.5,
        })
      );
      btn.rotation.x = Math.PI / 2;
      btn.position.set(2.25 + bx, 1.28, -2.955);
      humGroup.add(btn);
    });

    registerInteractiveGroup(
      'humidity-monitor',
      humGroup,
      [2.25, 1.15, -2.96],
      0.18,
      [2.25, 2.18, -2.95]
    );

    // =========================================================================
    // 9. WKS-04: Dual-Monitor LIMS Research Workstation, Tower PC & Ergonomic Chair
    // =========================================================================
    const wksGroup = new THREE.Group();
    // Chemical-resistant phenolic laboratory tabletop (with realistic leg space underneath)
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 0.055, 1.92),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.32,
        metalness: 0.25,
      })
    );
    deskTop.position.set(2.55, 0.76, 0.85);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    wksGroup.add(deskTop);

    // 4 Tubular Steel Desk Legs & Modesty Panel
    [
      [2.08, -0.04],
      [2.98, -0.04],
      [2.08, 1.74],
      [2.98, 1.74],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.74, 14),
        brushedSteelMat
      );
      leg.position.set(lx, 0.37, lz);
      leg.castShadow = true;
      wksGroup.add(leg);
    });

    const modestyPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.38, 1.76),
      darkSteelMat
    );
    modestyPanel.position.set(2.96, 0.54, 0.85);
    wksGroup.add(modestyPanel);

    const limsScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'WKS-04 FORENSIC LIMS',
        `${metrics.add.toFixed(0)} ADD`,
        `VOC: ${metrics.vocPpm} ppm`,
        '#34d399'
      ),
    });

    // Dual Widescreen Monitors + Articulated VESA Stands & Base Plates
    [
      { mz: 0.44, rotY: -Math.PI / 2 + 0.14 },
      { mz: 1.24, rotY: -Math.PI / 2 - 0.14 },
    ].forEach(({ mz, rotY }) => {
      const standBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.018, 0.26),
        darkSteelMat
      );
      standBase.position.set(2.74, 0.795, mz);
      wksGroup.add(standBase);

      const standPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.024, 0.32, 12),
        brushedSteelMat
      );
      standPillar.position.set(2.76, 0.95, mz);
      wksGroup.add(standPillar);

      const monGroup = new THREE.Group();
      monGroup.position.set(2.68, 1.12, mz);
      monGroup.rotation.y = rotY;

      const monitorBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.46, 0.035),
        new THREE.MeshStandardMaterial({
          color: 0x090d16,
          roughness: 0.22,
          metalness: 0.4,
        })
      );
      monitorBezel.castShadow = true;
      monGroup.add(monitorBezel);

      const screenPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.71, 0.41),
        limsScreenMat
      );
      screenPlane.position.set(0, 0, 0.019);
      monGroup.add(screenPlane);

      wksGroup.add(monGroup);
    });

    // High-Performance LIMS Workstation Tower PC Chassis on North Corner of Desk
    const pcTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.46, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.65,
        roughness: 0.24,
      })
    );
    pcTower.position.set(2.65, 1.02, 0.02);
    pcTower.castShadow = true;
    wksGroup.add(pcTower);
    const pcLightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.38, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    pcLightStrip.position.set(2.425, 1.02, 0.09);
    wksGroup.add(pcLightStrip);

    // Mechanical Keyboard, Wrist Pad & Optical Mouse on Desk
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.018, 0.46),
      darkSteelMat
    );
    keyboard.position.set(2.26, 0.795, 0.82);
    wksGroup.add(keyboard);

    const mousePad = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.006, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    mousePad.position.set(2.26, 0.79, 1.22);
    wksGroup.add(mousePad);
    const mouseBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4 })
    );
    mouseBody.scale.set(1.35, 0.55, 0.85);
    mouseBody.position.set(2.26, 0.805, 1.22);
    wksGroup.add(mouseBody);

    // 5-Star Ergonomic Laboratory Task Chair with Backrest & Casters
    const chairX = 1.72;
    const chairZ = 0.85;
    const chairSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.23, 0.065, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 })
    );
    chairSeat.position.set(chairX, 0.5, chairZ);
    chairSeat.castShadow = true;
    wksGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.42, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 })
    );
    chairBack.position.set(chairX - 0.22, 0.78, chairZ);
    chairBack.castShadow = true;
    wksGroup.add(chairBack);

    const chairSpine = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.34, 0.06),
      darkSteelMat
    );
    chairSpine.position.set(chairX - 0.24, 0.62, chairZ);
    wksGroup.add(chairSpine);

    const chairPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.44, 14),
      brushedSteelMat
    );
    chairPedestal.position.set(chairX, 0.26, chairZ);
    wksGroup.add(chairPedestal);

    for (let s = 0; s < 5; s++) {
      const sAng = (s * Math.PI * 2) / 5;
      const starLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.022, 0.03),
        brushedSteelMat
      );
      starLeg.position.set(
        chairX + Math.cos(sAng) * 0.12,
        0.05,
        chairZ + Math.sin(sAng) * 0.12
      );
      starLeg.rotation.y = -sAng;
      wksGroup.add(starLeg);
    }

    registerInteractiveGroup(
      'research-computer',
      wksGroup,
      [2.35, 0.02, 0.85],
      0.38,
      [2.55, 1.54, 0.85]
    );

    // =========================================================================
    // 10. CAM-05: Ceiling Gantry Dual-Spectrum LWIR Thermal & Optical Camera Rig
    // =========================================================================
    const camGroup = new THREE.Group();
    const ceilingFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.06, 24),
      darkSteelMat
    );
    ceilingFlange.position.set(0, 3.12, 0);
    camGroup.add(ceilingFlange);

    const gantry = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.56, 20),
      brushedSteelMat
    );
    gantry.position.set(0, 2.82, 0);
    camGroup.add(gantry);

    // Articulated Spring Boom Arms extending to the Dual Surgical Dome Lights
    const beamCones: THREE.Mesh[] = [];
    [-0.48, 0.48].forEach((lx) => {
      const boomArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.52, 14),
        brushedSteelMat
      );
      boomArm.rotation.z = lx < 0 ? 1.15 : -1.15;
      boomArm.position.set(lx * 0.5, 2.68, 0);
      camGroup.add(boomArm);

      const dome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.32, 0.09, 28),
        brushedSteelMat
      );
      dome.position.set(lx, 2.52, 0);
      camGroup.add(dome);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 28),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(lx, 2.47, 0);
      camGroup.add(lens);

      // Sterile central positioning handle under surgical lamp dome
      const sterileHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.012, 0.11, 12),
        darkSteelMat
      );
      sterileHandle.position.set(lx, 2.42, 0);
      camGroup.add(sterileHandle);

      // Volumetric Surgical Light Cone
      const beamCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.58, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xbae6fd,
          transparent: true,
          opacity: 0.045,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      beamCone.position.set(lx, 1.68, 0);
      scene.add(beamCone);
      beamCones.push(beamCone);
    });

    // Central Gimbal-Mounted Dual-Spectrum LWIR Thermal & 4K Optical Camera Pod
    const camChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.2, 0.34),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.68,
        roughness: 0.22,
      })
    );
    camChassis.position.set(0, 2.54, 0.08);
    camGroup.add(camChassis);

    const camShroud = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, 0.36),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.55,
        roughness: 0.2,
      })
    );
    camShroud.position.set(0, 2.63, 0.08);
    camGroup.add(camShroud);

    // Dual Downward-Facing Optical & Germanium LWIR Infrared Lens Barrels
    [
      { ox: -0.075, ringColor: 0x38bdf8 },
      { ox: 0.075, ringColor: 0xf59e0b }, // Gold-coated Germanium LWIR thermal lens
    ].forEach(({ ox, ringColor }) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.046, 0.052, 0.12, 20),
        darkSteelMat
      );
      barrel.position.set(ox, 2.41, 0.08);
      camGroup.add(barrel);

      const lensGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.042, 20),
        new THREE.MeshBasicMaterial({
          color: ringColor,
          side: THREE.DoubleSide,
        })
      );
      lensGlass.rotation.x = Math.PI / 2;
      lensGlass.position.set(ox, 2.348, 0.08);
      camGroup.add(lensGlass);
    });

    // Active Telemetry Recording Status LED on Camera Front
    const camLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    camLed.position.set(0.12, 2.54, 0.255);
    camGroup.add(camLed);

    registerInteractiveGroup(
      'camera',
      camGroup,
      [0, 2.32, 0.08],
      0.22,
      [0, 2.86, 0.22]
    );

    // =========================================================================
    // Laminar Airflow Particles
    // =========================================================================
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6.4;
      positions[i * 3 + 1] = 0.3 + Math.random() * 2.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5.4;
    }
    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
    });
    const airflowParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(airflowParticles);

    // =========================================================================
    // Raycaster for 3D Object & Structural Anatomical Region Picking
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.lastMouseX = e.clientX;
      stateRef.current.lastMouseY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (stateRef.current.isDragging) {
        const dx = e.clientX - stateRef.current.lastMouseX;
        const dy = e.clientY - stateRef.current.lastMouseY;
        stateRef.current.lastMouseX = e.clientX;
        stateRef.current.lastMouseY = e.clientY;
        setCameraAngle((prev) => prev - dx * 0.0065);
        setCameraPitch((prev) =>
          Math.max(0.15, Math.min(1.38, prev + dy * 0.0055))
        );
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const hitId = hitMesh.userData.objectId;
        const hitRegion = hitMesh.userData.regionId as
          | AnatomicalRegionId
          | undefined;
        const found = ROOM_OBJECTS.find((o) => o.id === hitId);
        if (found) {
          if (hitRegion) {
            const regObj = ANATOMICAL_REGIONS.find((r) => r.id === hitRegion);
            setHoveredObjectName(
              `SPC-10 · 3D Subject (${regObj?.shortLabel || hitRegion})`
            );
          } else {
            setHoveredObjectName(`${found.code} · ${found.name}`);
          }
        }
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredObjectName(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      const moveDelta =
        Math.abs(e.clientX - stateRef.current.lastMouseX) +
        Math.abs(e.clientY - stateRef.current.lastMouseY);
      stateRef.current.isDragging = false;

      if (moveDelta < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableMeshes, false);
        if (intersects.length > 0) {
          const hitMesh = intersects[0].object;
          const hitId = hitMesh.userData.objectId;
          const hitRegion = hitMesh.userData.regionId as
            | AnatomicalRegionId
            | undefined;
          if (hitRegion) {
            setSelectedRegionId(hitRegion);
            setInspectorTab('inspector');
          }
          const found = ROOM_OBJECTS.find((o) => o.id === hitId);
          if (found) {
            onSelectObject(found);
            if (!hitRegion) {
              focusCameraOnObject(found.id);
            }
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCameraZoom((z) =>
        Math.max(2.0, Math.min(8.8, z + (e.deltaY > 0 ? 0.32 : -0.32)))
      );
    };

    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.lastMouseX = e.touches[0].clientX;
        stateRef.current.lastMouseY = e.touches[0].clientY;
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
        const dx = e.touches[0].clientX - stateRef.current.lastMouseX;
        const dy = e.touches[0].clientY - stateRef.current.lastMouseY;
        stateRef.current.lastMouseX = e.touches[0].clientX;
        stateRef.current.lastMouseY = e.touches[0].clientY;
        setAutoOrbit(false);
        setCameraAngle((prev) => prev - dx * 0.0065);
        setCameraPitch((prev) =>
          Math.max(0.14, Math.min(1.42, prev + dy * 0.0055))
        );
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
          const delta = lastPinchDist - dist;
          setCameraZoom((z) =>
            Math.max(2.0, Math.min(8.8, z + delta * 0.012))
          );
        }
        lastPinchDist = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      stateRef.current.isDragging = false;
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const moveDelta =
          Math.abs(t.clientX - stateRef.current.lastMouseX) +
          Math.abs(t.clientY - stateRef.current.lastMouseY);
        if (moveDelta < 8) {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(clickableMeshes, false);
          if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const hitId = hitMesh.userData.objectId;
            const hitRegion = hitMesh.userData.regionId as
              | AnatomicalRegionId
              | undefined;
            if (hitRegion) {
              setSelectedRegionId(hitRegion);
              setInspectorTab('inspector');
            }
            const found = ROOM_OBJECTS.find((o) => o.id === hitId);
            if (found) {
              onSelectObject(found);
              if (!hitRegion) {
                focusCameraOnObject(found.id);
              }
            }
          }
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onPointerDown);
    domElem.addEventListener('mousemove', onPointerMove);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    domElem.addEventListener('touchmove', onTouchMove, { passive: false });
    domElem.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mouseup', onPointerUp);

    let animId: number;
    let clock = 0;
    let lastWallClockKey = '';

    // Smooth camera state variables
    let smoothAngle = stateRef.current.cameraAngle;
    let smoothPitch = stateRef.current.cameraPitch;
    let smoothZoom = stateRef.current.cameraZoom;
    let smoothTargetX = stateRef.current.cameraTargetX;
    let smoothTargetY = stateRef.current.cameraTargetY;
    let smoothTargetZ = stateRef.current.cameraTargetZ;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.025;

      const {
        params: curParams,
        metrics: curMetrics,
        selectedObject: curSelected,
        layerMode: curLayerMode,
        showReferencePlanes: curPlanes,
        showTelemetryNodes: curNodes,
        selectedRegionId: curRegion,
        cameraAngle: targetAngle,
        cameraPitch: targetPitch,
        cameraZoom: targetZoom,
        cameraTargetX: targetX,
        cameraTargetY: targetY,
        cameraTargetZ: targetZ,
        autoOrbit: isOrbiting,
      } = stateRef.current;

      // Smoothly interpolate camera position and 3D target + responsive aspect framing for narrow panes/screens
      const aspectScale =
        camera.aspect < 1.15
          ? Math.min(1.42, 1.15 / Math.max(0.5, camera.aspect))
          : 1.0;
      const effectiveTargetZoom = Math.min(8.8, targetZoom * aspectScale);
      const desiredAngle = isOrbiting ? targetAngle + clock * 0.15 : targetAngle;
      smoothAngle += (desiredAngle - smoothAngle) * 0.12;
      smoothPitch += (targetPitch - smoothPitch) * 0.12;
      smoothZoom += (effectiveTargetZoom - smoothZoom) * 0.12;
      smoothTargetX += (targetX - smoothTargetX) * 0.12;
      smoothTargetY += (targetY - smoothTargetY) * 0.12;
      smoothTargetZ += (targetZ - smoothTargetZ) * 0.12;

      camera.position.x =
        smoothTargetX +
        Math.sin(smoothAngle) * Math.cos(smoothPitch) * smoothZoom;
      camera.position.y =
        Math.max(
          0.35,
          smoothTargetY * 0.65 + Math.sin(smoothPitch) * smoothZoom + 0.25
        );
      camera.position.z =
        smoothTargetZ +
        Math.cos(smoothAngle) * Math.cos(smoothPitch) * smoothZoom;
      camera.lookAt(smoothTargetX, smoothTargetY, smoothTargetZ);

      surgicalSpot.intensity = 1.65 + (curParams.lightExposure / 1000) * 1.95;
      beamCones.forEach((cone) => {
        (cone.material as THREE.MeshBasicMaterial).opacity =
          0.02 + (curParams.lightExposure / 1000) * 0.06;
      });

      // Update live 3D wall clock & instrument monitor screens when parameters or day change
      const wallKey = `${curMetrics.simDay.toFixed(1)}-${curParams.temperature.toFixed(1)}-${curParams.humidity}-${curMetrics.currentStage.index}`;
      if (wallKey !== lastWallClockKey) {
        lastWallClockKey = wallKey;
        const nextTex = createWallTelemetryTexture(
          curMetrics.simDay,
          curMetrics.add,
          curParams.temperature,
          curParams.humidity,
          curMetrics.currentStage.shortTitle
        );
        if (wallClockMat.map) wallClockMat.map.dispose();
        wallClockMat.map = nextTex;
        wallClockMat.needsUpdate = true;

        // Update TMP-07 screen
        if (tempScreenMat.map) tempScreenMat.map.dispose();
        tempScreenMat.map = createInstrumentScreenTexture(
          'TMP-07 THERMISTOR',
          `${curParams.temperature.toFixed(1)}°C`,
          `Q10 Rate: ${curMetrics.q10Multiplier}x`,
          '#38bdf8'
        );
        tempScreenMat.needsUpdate = true;

        // Update HUM-08 screen
        if (humScreenMat.map) humScreenMat.map.dispose();
        humScreenMat.map = createInstrumentScreenTexture(
          'HUM-08 HYGROMETER',
          `${curParams.humidity}% RH`,
          `Dew Pt: ${(curParams.temperature - (100 - curParams.humidity) / 5).toFixed(1)}°C`,
          '#22d3ee'
        );
        humScreenMat.needsUpdate = true;

        // Update WKS-04 LIMS monitors
        if (limsScreenMat.map) limsScreenMat.map.dispose();
        limsScreenMat.map = createInstrumentScreenTexture(
          'WKS-04 FORENSIC LIMS',
          `${curMetrics.add.toFixed(0)} ADD`,
          `VOC: ${curMetrics.vocPpm} ppm`,
          '#34d399'
        );
        limsScreenMat.needsUpdate = true;

        // Update TBL-02 integrated load-cell scale screen
        if (scaleScreenMat.map) scaleScreenMat.map.dispose();
        scaleScreenMat.map = createInstrumentScreenTexture(
          'LOAD-CELL MASS SCALE',
          `${curMetrics.massRetentionPercent}%`,
          `${(68 * (curMetrics.massRetentionPercent / 100)).toFixed(1)} kg Retained`,
          '#22d3ee'
        );
        scaleScreenMat.needsUpdate = true;

        // Update SEN-01 multi-gas OLED screen
        if (senScreenMat.map) senScreenMat.map.dispose();
        senScreenMat.map = createInstrumentScreenTexture(
          'SEN-01 MULTI-GAS',
          `${curMetrics.vocPpm} ppm`,
          `845.2 hPa · CO2/H2S`,
          '#38bdf8'
        );
        senScreenMat.needsUpdate = true;
      }

      // Spin SEN-01 ultrasonic anemometer rotor & VNT-06 HEPA exhaust fans based on airflow
      const fanSpeed = 0.03 + curParams.airflow * 0.18;
      anemometerRotor.rotation.y += fanSpeed;
      hepaFanRotors.forEach((rotor) => {
        rotor.rotation.x += fanSpeed * 1.4;
      });

      // Update the sculpted ForensicSubjectModel mounted on the exam-table
      subjectController.update({
        params: curParams,
        metrics: curMetrics,
        layerMode: curLayerMode,
        showReferencePlanes: curPlanes,
        showTelemetryNodes: curNodes,
        selectedRegionId: curRegion,
        clock,
      });

      // Animate chamber airflow particles
      const posAttr = particleGeo.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const speed = 0.004 + curParams.airflow * 0.032;
      for (let i = 0; i < particleCount; i++) {
        let x = posAttr.getX(i) + speed;
        if (x > 3.2) x = -3.2;
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;
      particleMat.opacity = Math.min(0.85, 0.18 + curParams.airflow * 0.3);

      // Pulse selected object's locator ring & 3D floating callout badge
      Object.entries(objectHighlightRings).forEach(([id, ringMesh]) => {
        const isSel = curSelected.id === id;
        const scale = isSel ? 1 + Math.sin(clock * 3) * 0.14 : 0.78;
        ringMesh.scale.set(scale, scale, 1);
        (ringMesh.material as THREE.MeshBasicMaterial).color.setHex(
          isSel ? 0x22d3ee : 0x475569
        );
        (ringMesh.material as THREE.MeshBasicMaterial).opacity = isSel
          ? 0.95
          : 0.32;
      });

      Object.entries(objectCalloutSprites).forEach(([id, entry]) => {
        const isSel = curSelected.id === id;
        entry.sprite.visible = curNodes || isSel;
        if (entry.isSelRendered !== isSel) {
          entry.isSelRendered = isSel;
          const mat = entry.sprite.material as THREE.SpriteMaterial;
          if (mat.map) mat.map.dispose();
          mat.map = createNodeCalloutTexture(
            entry.code,
            entry.shortName,
            isSel
          );
          mat.needsUpdate = true;
        }
        const s = isSel ? 0.66 + Math.sin(clock * 3) * 0.03 : 0.52;
        entry.sprite.scale.set(s, s * 0.24, 1);
        entry.sprite.position.y =
          entry.baseY + (isSel ? Math.sin(clock * 3) * 0.025 : 0);
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
      window.removeEventListener('mouseup', onPointerUp);
      domElem.removeEventListener('mousedown', onPointerDown);
      domElem.removeEventListener('mousemove', onPointerMove);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('touchstart', onTouchStart);
      domElem.removeEventListener('touchmove', onTouchMove);
      domElem.removeEventListener('touchend', onTouchEnd);
      domElem.removeEventListener('webglcontextlost', handleContextLost);
      renderer.dispose();
    };
  }, [viewMode, isLightMode]);

  const liveReading = selectedObject.getLiveReading(
    params,
    metrics.simDay,
    metrics.add
  );

  const activeRegionObj =
    ANATOMICAL_REGIONS.find((r) => r.id === selectedRegionId) ||
    ANATOMICAL_REGIONS[2];
  const activeRegionData = activeRegionObj.getScoreAndFindings(params, metrics);

  const updateParamField = <K extends keyof EnvironmentalParams>(
    key: K,
    value: EnvironmentalParams[K]
  ) => {
    if (onChangeParams) {
      onChangeParams({ ...params, [key]: value });
    }
  };

  return (
    <div
      ref={splitContainerRef}
      style={
        {
          '--left-split': isInspectorCollapsed ? '100%' : `${splitRatio}%`,
          '--right-split': `${100 - splitRatio}%`,
        } as React.CSSProperties
      }
      className={`flex flex-col lg:flex-row items-stretch lg:items-start gap-4 lg:gap-0 transition-all ${
        isFullscreen
          ? isLightMode
            ? 'fixed inset-2 sm:inset-4 z-50 bg-slate-100/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-300 shadow-2xl overflow-y-auto'
            : 'fixed inset-2 sm:inset-4 z-50 bg-[#050811]/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl overflow-y-auto'
          : 'w-full'
      }`}
    >
      {/* Left Resizable Pane: Interactive 3D Chamber / Dedicated ForensicSubjectModel / 2D Blueprint */}
      <div
        className={`w-full ${
          isInspectorCollapsed ? 'lg:w-full' : 'lg:w-[var(--left-split)]'
        } shrink-0 rounded-xl border overflow-hidden relative transition-[width] duration-75 ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#080D1A] border-slate-800 shadow-xl'
        }`}
      >
        {/* Top Viewport Mode, Camera & Layout Resizer Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-4 py-2.5 border-b z-10 relative ${
            isLightMode
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-slate-950/95 border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {webglSupported && (
              <div
                className={`flex flex-wrap items-center p-1 rounded-lg border ${
                  isLightMode
                    ? 'bg-slate-200/70 border-slate-300'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    viewMode === '3d'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                      : isLightMode
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-slate-300 hover:text-white'
                  }`}
                >
                  3D Lab & Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('subject-model');
                    const spc = ROOM_OBJECTS.find(
                      (o) => o.id === 'specimen-area'
                    );
                    if (spc) onSelectObject(spc);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    viewMode === 'subject-model'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                      : isLightMode
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-slate-300 hover:text-white'
                  }`}
                >
                  3D Subject Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    viewMode === '2d'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                      : isLightMode
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-slate-300 hover:text-white'
                  }`}
                >
                  2D Blueprint
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {viewMode === '3d' && (
              <>
                <button
                  type="button"
                  onClick={() => applyCameraPreset('body-closeup')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    isLightMode
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 hover:bg-cyan-100'
                      : 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25'
                  }`}
                >
                  Focus: 3D Body
                </button>
                <button
                  type="button"
                  onClick={() => applyCameraPreset('overhead-autopsy')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    isLightMode
                      ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Top-Down
                </button>
                <button
                  type="button"
                  onClick={() => applyCameraPreset('full-room')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    isLightMode
                      ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Full Room
                </button>
              </>
            )}

            {/* Viewport Height Quick Presets (S / M / L) */}
            {viewMode !== 'subject-model' && (
              <div
                className={`hidden sm:flex items-center p-0.5 rounded-lg border text-[11px] font-mono ${
                  isLightMode
                    ? 'bg-white border-slate-300'
                    : 'bg-slate-900 border-slate-800'
                }`}
                title="Quick Viewport Height Presets"
              >
                {[
                  { label: 'S', h: 380 },
                  { label: 'M', h: 520 },
                  { label: 'L', h: 680 },
                ].map((sz) => (
                  <button
                    key={sz.label}
                    type="button"
                    onClick={() => setStageHeight(sz.h)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      Math.abs(stageHeight - sz.h) < 35
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : isLightMode
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            )}

            {/* Toggle Side Inspector Panel (Full-Width 3D vs Split View) */}
            <button
              type="button"
              onClick={() => setIsInspectorCollapsed((c) => !c)}
              title={
                isInspectorCollapsed
                  ? 'Show Right Inspector Console (Split View)'
                  : 'Hide Right Inspector Console (Full-Width 3D View)'
              }
              className={`hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                isInspectorCollapsed
                  ? isLightMode
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-800'
                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : isLightMode
                    ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {isInspectorCollapsed ? (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>Show Inspector</span>
                </>
              ) : (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Full Width</span>
                </>
              )}
            </button>

            {/* Fullscreen / Expanded Workspace Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title={
                isFullscreen
                  ? 'Exit Expanded View (Esc)'
                  : 'Expand 3D Workspace to Fullscreen'
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                isFullscreen
                  ? isLightMode
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold'
                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold'
                  : isLightMode
                    ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Second Toolbar: 3D Structural Anatomy Layer Switcher */}
        {viewMode === '3d' && webglSupported && (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b text-xs ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-slate-900/95 border-slate-800/70'
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`font-semibold mr-1 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Anatomy Layer:
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
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLayerMode(m.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                    layerMode === m.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                      : isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowReferencePlanes((p) => !p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                  showReferencePlanes
                    ? isLightMode
                      ? 'bg-sky-50 border-sky-400 text-sky-800 font-semibold'
                      : 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                    : isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-600'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {showReferencePlanes ? 'LiDAR Slice: On' : 'LiDAR Slice: Off'}
              </button>
              <button
                type="button"
                onClick={() => setShowTelemetryNodes((n) => !n)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                  showTelemetryNodes
                    ? isLightMode
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold'
                      : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                    : isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-600'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {showTelemetryNodes ? 'Nodes: On' : 'Nodes: Off'}
              </button>
              <button
                type="button"
                onClick={() => setAutoOrbit((o) => !o)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                  autoOrbit
                    ? isLightMode
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold'
                      : 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                    : isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-600'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {autoOrbit ? 'Orbiting' : 'Auto-Orbit'}
              </button>
            </div>
          </div>
        )}

        {/* Main 3D / Dedicated ForensicSubjectModel / 2D Viewport Stage */}
        {viewMode === 'subject-model' && webglSupported ? (
          <div className={isLightMode ? 'p-3 bg-slate-50' : 'p-3 bg-slate-950/60'}>
            <ForensicSubjectModel
              params={params}
              metrics={metrics}
              selectedRegionId={selectedRegionId}
              onSelectRegion={(regId) => {
                setSelectedRegionId(regId);
                const spc = ROOM_OBJECTS.find((o) => o.id === 'specimen-area');
                if (spc) onSelectObject(spc);
              }}
              isLightMode={isLightMode}
            />
          </div>
        ) : (
          <>
            <div
              style={{ height: `${stageHeight}px` }}
              className="relative w-full select-none transition-[height] duration-75"
            >
              {viewMode === '3d' && webglSupported ? (
                <>
                  <div
                    ref={mountRef}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                  />
                  {/* Clean Top-Left Active Target Readout */}
                  <div className="absolute top-3 left-3 right-3 sm:right-auto pointer-events-none">
                    <div
                      className={`inline-flex items-center gap-2 backdrop-blur-md border px-3 py-1.5 rounded-lg shadow-sm max-w-full ${
                        isLightMode
                          ? 'bg-white/95 border-slate-300 text-slate-900'
                          : 'bg-slate-950/85 border-slate-800 text-slate-100'
                      }`}
                    >
                      <Crosshair
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                        }`}
                      />
                      <span className="text-xs font-mono font-medium truncate">
                        {hoveredObjectName ||
                          `${selectedObject.code} · ${selectedObject.name}`}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Camera Zoom & Helper Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                    <div
                      className={`backdrop-blur-md border px-3 py-1.5 rounded-lg text-xs hidden sm:block ${
                        isLightMode
                          ? 'bg-white/90 border-slate-300 text-slate-700 shadow-xs'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      Click any 3D region or instrument · Drag to rotate ·
                      Scroll/Pinch to zoom
                    </div>
                    <div
                      className={`flex items-center gap-1.5 pointer-events-auto backdrop-blur-md border px-2.5 py-1 rounded-lg ml-auto ${
                        isLightMode
                          ? 'bg-white/95 border-slate-300 text-slate-800 shadow-xs'
                          : 'bg-slate-950/85 border-slate-800 text-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCameraZoom((z) => Math.max(2.0, z - 0.5))
                        }
                        className={`px-2 py-0.5 text-xs font-mono font-medium ${
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
                        onClick={() =>
                          setCameraZoom((z) => Math.min(8.8, z + 0.5))
                        }
                        className={`px-2 py-0.5 text-xs font-mono font-medium ${
                          isLightMode
                            ? 'text-slate-700 hover:text-cyan-700'
                            : 'text-slate-200 hover:text-cyan-300'
                        }`}
                      >
                        Zoom −
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* 2D Architectural Blueprint Schematic View with Structural Subject Silhouette */
                <div
                  className={`w-full h-full relative p-3 sm:p-6 flex flex-col justify-between overflow-hidden ${
                    isLightMode ? 'bg-slate-100' : 'bg-[#0B1120]'
                  }`}
                >
                  <svg
                    className="w-full h-full absolute inset-0 opacity-25 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="lab-grid"
                        width="32"
                        height="32"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 32 0 L 0 0 0 32"
                          fill="none"
                          stroke={isLightMode ? '#0284c7' : '#38bdf8'}
                          strokeWidth="0.6"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#lab-grid)" />
                  </svg>

                  <div
                    className={`relative w-full h-full border-2 rounded-lg ${
                      isLightMode
                        ? 'border-cyan-600/40 bg-white/80'
                        : 'border-cyan-500/40 bg-slate-950/50'
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 px-3 max-w-[80%] h-5 border-b border-x flex items-center justify-center ${
                        isLightMode
                          ? 'bg-cyan-100 border-cyan-500 text-cyan-900'
                          : 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs font-mono font-medium truncate">
                        North Window (Baguio 1,540m)
                      </span>
                    </div>

                    {/* Central Examination Table with 2D Structural Anatomy SVG */}
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46%] max-w-64 h-[28%] max-h-32 rounded border-2 flex flex-col items-center justify-center p-2 ${
                        isLightMode
                          ? 'border-cyan-600/60 bg-slate-50 shadow-sm'
                          : 'border-cyan-400/60 bg-slate-900/90'
                      }`}
                    >
                      <svg
                        viewBox="0 0 220 70"
                        className={`w-full max-w-52 h-auto max-h-20 ${
                          isLightMode
                            ? 'stroke-cyan-700 fill-cyan-500/20'
                            : 'stroke-cyan-300 fill-cyan-500/15'
                        }`}
                        strokeWidth="1.4"
                      >
                        {/* Continuous anatomical human body contour (Head, Neck, Shoulders, Arms/Hands, Torso, Pelvis, Legs/Feet) */}
                        <path d="M 16 35 C 16 27, 23 24, 31 24 C 36 24, 39 27, 41 30 L 46 30 C 49 21, 53 13, 60 12 L 116 14 C 120 14, 123 16, 123 19 C 123 21, 119 22, 114 21 L 64 20 L 64 22 C 76 23, 92 24, 108 23 C 115 22, 122 23, 128 24 L 194 25 C 199 25, 203 23, 205 26 C 206 29, 202 33, 194 33 L 128 34 L 128 36 L 194 37 C 202 37, 206 41, 205 44 C 203 47, 199 45, 194 45 L 128 46 C 122 47, 115 48, 108 47 C 92 46, 76 47, 64 48 L 64 50 L 114 49 C 119 48, 123 49, 123 51 C 123 54, 120 56, 116 56 L 60 58 C 53 57, 49 49, 46 40 L 41 40 C 39 43, 36 46, 31 46 C 23 46, 16 43, 16 35 Z" />
                        <line
                          x1="20"
                          y1="35"
                          x2="128"
                          y2="35"
                          strokeDasharray="3 2"
                        />
                      </svg>
                      <span
                        className={`text-[10px] sm:text-xs font-mono font-semibold truncate max-w-full ${
                          isLightMode ? 'text-cyan-800' : 'text-cyan-300'
                        }`}
                      >
                        3D Structural Subject (SPC-10)
                      </span>
                    </div>

                    {ROOM_OBJECTS.map((obj) => {
                      const isSelected = selectedObject.id === obj.id;
                      const isInspected = inspectedObjectIds.includes(obj.id);
                      return (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => onSelectObject(obj)}
                          style={{
                            left: `${obj.coords2D.x}%`,
                            top: `${obj.coords2D.y}%`,
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono transition-transform duration-150 flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 border-cyan-700 font-semibold scale-110 z-20 shadow-md'
                              : isInspected
                                ? isLightMode
                                  ? 'bg-white text-cyan-800 border-cyan-500 font-medium shadow-xs hover:scale-105 z-10'
                                  : 'bg-slate-900/95 text-cyan-300 border-cyan-500/60 hover:scale-105 z-10'
                                : isLightMode
                                  ? 'bg-white text-slate-700 border-slate-300 shadow-xs hover:border-cyan-500 hover:scale-105 z-10'
                                  : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400 hover:scale-105 z-10'
                          }`}
                        >
                          <span>{obj.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Vertical Height Resize Bar */}
            <div
              onMouseDown={startStageHeightResize}
              onTouchStart={startStageHeightResize}
              onDoubleClick={() => setStageHeight(520)}
              title="Drag vertically to resize 3D viewport height (double-click to reset to 520px)"
              className={`w-full h-3.5 cursor-row-resize flex items-center justify-center border-t transition-colors select-none ${
                isDraggingHeight
                  ? 'bg-cyan-500/25 border-cyan-400'
                  : isLightMode
                    ? 'bg-slate-100 hover:bg-cyan-50 border-slate-200'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <GripHorizontal
                className={`w-4 h-3.5 ${
                  isDraggingHeight
                    ? 'text-cyan-400'
                    : isLightMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                }`}
              />
            </div>
          </>
        )}

        {/* Bottom Interactive Instrument Selector Strip (All 10 Clickable Objects) */}
        <div
          className={`p-4 border-t ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-950/95 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span
              className={`text-xs font-medium ${
                isLightMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Laboratory Nodes & Instruments (Select to inspect):
            </span>
            <span
              className={`text-xs font-mono font-semibold ${
                isLightMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              {inspectedObjectIds.length}/{ROOM_OBJECTS.length} Inspected
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ROOM_OBJECTS.map((obj) => {
              const isSelected = selectedObject.id === obj.id;
              const isVisited = inspectedObjectIds.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => {
                    onSelectObject(obj);
                    setInspectorTab('inspector');
                    if (viewMode === 'subject-model' && obj.id !== 'specimen-area') {
                      setViewMode('3d');
                    }
                    focusCameraOnObject(obj.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? isLightMode
                        ? 'bg-cyan-50 border-cyan-500 text-slate-900 shadow-xs'
                        : 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-xs'
                      : isLightMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                        : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                      }`}
                    >
                      {obj.code}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        isVisited
                          ? isLightMode
                            ? 'text-emerald-700'
                            : 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isVisited ? 'Checked' : 'Inspect'}
                    </span>
                  </div>
                  <span className="text-xs font-medium truncate mt-0.5 w-full">
                    {obj.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Split Resizer Handle (lg+ screens) */}
      {!isInspectorCollapsed && (
        <div
          onMouseDown={startSplitResize}
          onTouchStart={startSplitResize}
          onDoubleClick={() => setSplitRatio(58)}
          title="Drag horizontally to resize 3D Chamber vs Inspector Console width (double-click to reset)"
          className="hidden lg:flex w-4 shrink-0 self-stretch cursor-col-resize items-center justify-center group select-none"
        >
          <div
            className={`w-1.5 h-24 rounded-full flex items-center justify-center transition-all ${
              isDraggingSplit
                ? 'bg-cyan-400 h-36 shadow-md shadow-cyan-500/30'
                : isLightMode
                  ? 'bg-slate-200 group-hover:bg-cyan-500/60 group-hover:h-32'
                  : 'bg-slate-800 group-hover:bg-cyan-400/60 group-hover:h-32'
            }`}
          >
            <GripVertical
              className={`w-3.5 h-3.5 ${
                isDraggingSplit
                  ? 'text-slate-950'
                  : isLightMode
                    ? 'text-slate-500 group-hover:text-white'
                    : 'text-slate-400 group-hover:text-slate-950'
              }`}
            />
          </div>
        </div>
      )}

      {/* Right Resizable Pane: Multi-Mode Command & Telemetry Inspector Console */}
      {!isInspectorCollapsed && (
        <div
          className={`w-full lg:w-[var(--right-split)] lg:flex-1 min-w-0 rounded-xl border overflow-hidden flex flex-col ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#0F172A] border-slate-800 text-slate-100 shadow-xl'
          }`}
        >
        {/* 3-Tab Command Console Switcher */}
        <div
          className={`grid grid-cols-3 border-b p-1.5 gap-1.5 ${
            isLightMode
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-950/90 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setInspectorTab('inspector')}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              inspectorTab === 'inspector'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Scan className="w-3.5 h-3.5 shrink-0" />
            <span>Node & Anatomy</span>
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab('live-env')}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              inspectorTab === 'live-env'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Climate Tuner</span>
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab('stage-camera')}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              inspectorTab === 'stage-camera'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Stage & Camera</span>
          </button>
        </div>

        {/* TAB 1: NODE TELEMETRY & 3D STRUCTURAL ANATOMY INSPECTOR */}
        {inspectorTab === 'inspector' && (
          <div
            className={`p-6 divide-y ${
              isLightMode ? 'divide-slate-200' : 'divide-slate-800/80'
            }`}
          >
            {/* Object Header & Live Reading */}
            <div className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`flex items-center gap-2 text-xs font-mono ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    <span>Node {selectedObject.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedObject.zone}</span>
                  </div>
                  <h3 className="text-xl font-semibold mt-1 tracking-tight">
                    {selectedObject.name}
                  </h3>
                </div>
                <span
                  className={`text-xs font-mono font-semibold ${
                    liveReading.statusLabel === 'ELEVATED'
                      ? isLightMode
                        ? 'text-amber-700'
                        : 'text-amber-400'
                      : liveReading.statusLabel === 'ALTERED'
                        ? isLightMode
                          ? 'text-cyan-700'
                          : 'text-cyan-400'
                        : isLightMode
                          ? 'text-emerald-700'
                          : 'text-emerald-400'
                  }`}
                >
                  {liveReading.statusLabel === 'ELEVATED'
                    ? 'Elevated'
                    : liveReading.statusLabel === 'ALTERED'
                      ? 'Shifted'
                      : 'Nominal'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span
                    className={`text-2xl font-mono font-semibold tabular-nums ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {liveReading.primaryMetric}
                  </span>
                  <span className="text-xs font-mono text-slate-500 ml-1.5">
                    {liveReading.primaryUnit}
                  </span>
                </div>
                <div
                  className={`text-xs font-mono ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {liveReading.secondaryMetric}
                </div>
              </div>
            </div>

            {/* Interactive 3D Structural Anatomy Regional Inspector */}
            <div className="py-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    isLightMode ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  3D Anatomical Region Inspector
                </span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  Regional TBS: {activeRegionData.score}/
                  {activeRegionObj.megyesiMaxScore}
                </span>
              </div>

              {/* 4 Anatomical Zone Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ANATOMICAL_REGIONS.map((reg) => {
                  const isRegActive = reg.id === selectedRegionId;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => {
                        setSelectedRegionId(reg.id);
                        const spc = ROOM_OBJECTS.find(
                          (o) => o.id === 'specimen-area'
                        );
                        if (spc) onSelectObject(spc);
                      }}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors text-center truncate ${
                        isRegActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                          : isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {reg.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm leading-relaxed">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      isLightMode
                        ? 'text-slate-700 font-semibold'
                        : 'text-slate-200 font-semibold'
                    }
                  >
                    {activeRegionObj.title}
                  </span>
                  <span
                    className={isLightMode ? 'text-cyan-700' : 'text-cyan-400'}
                  >
                    {activeRegionData.localTemp}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Landmarks: {activeRegionObj.structuralLandmarks}
                </p>
                <p className={isLightMode ? 'text-slate-700' : 'text-slate-200'}>
                  <strong className="font-semibold">Tissue State:</strong>{' '}
                  {activeRegionData.tissueState}
                </p>
                <p
                  className={`text-xs ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  <strong className="font-semibold">Mechanism:</strong>{' '}
                  {activeRegionData.internalProcess}
                </p>
              </div>
            </div>

            {/* 4 Educational Explanations for Selected Object */}
            <div className="pt-5 space-y-4 text-sm leading-relaxed">
              <div>
                <h4
                  className={`text-xs font-semibold mb-1 ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  01. What This Object Represents
                </h4>
                <p className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                  {selectedObject.whatItRepresents}
                </p>
              </div>

              <div>
                <h4
                  className={`text-xs font-semibold mb-1 ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  02. Forensic Science Significance
                </h4>
                <p className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                  {selectedObject.whyItIsImportant}
                </p>
              </div>

              <div>
                <h4
                  className={`text-xs font-semibold mb-1 ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  03. What Forensic Scientists Observe
                </h4>
                <p className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                  {selectedObject.whatScientistsObserve}
                </p>
              </div>

              <div>
                <h4
                  className={`text-xs font-semibold mb-1 ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  04. Contribution to PMI & ADD Analysis
                </h4>
                <p className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                  {selectedObject.contributionToAnalysis}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE ENVIRONMENT TUNER */}
        {inspectorTab === 'live-env' && (
          <div className="p-6 space-y-5">
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isLightMode ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div>
                <span
                  className={`text-xs font-medium ${
                    isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                  }`}
                >
                  Real-Time Chamber Controls
                </span>
                <h3 className="text-lg font-semibold mt-0.5">
                  Environmental Variable Tuner
                </h3>
              </div>
              {onChangeParams && (
                <button
                  type="button"
                  onClick={() => onChangeParams(ENVIRONMENTAL_PRESETS[0].params)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                    isLightMode
                      ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-600'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset (16.5°C)</span>
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <span
                className={`text-xs font-medium block mb-2 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Climate Regime Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ENVIRONMENTAL_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChangeParams && onChangeParams(preset.params)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isLightMode
                        ? 'border-slate-200 bg-slate-50 hover:border-cyan-500'
                        : 'border-slate-800 bg-slate-950/80 hover:border-cyan-400/60'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold truncate ${
                        isLightMode ? 'text-slate-900' : 'text-cyan-300'
                      }`}
                    >
                      {preset.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {preset.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Sliders */}
            <div className="space-y-4">
              {/* Temperature */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">Ambient Temperature</span>
                  <span
                    className={`font-mono font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {params.temperature.toFixed(1)}°C ({metrics.q10Multiplier}x Q₁₀)
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={38}
                  step={0.5}
                  value={params.temperature}
                  onChange={(e) =>
                    updateParamField('temperature', parseFloat(e.target.value))
                  }
                  className="w-full h-2 cursor-pointer"
                />
              </div>

              {/* Relative Humidity */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">Relative Humidity</span>
                  <span
                    className={`font-mono font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {params.humidity}% RH
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={98}
                  step={1}
                  value={params.humidity}
                  onChange={(e) =>
                    updateParamField('humidity', parseInt(e.target.value, 10))
                  }
                  className="w-full h-2 cursor-pointer"
                />
              </div>

              {/* Airflow */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">Ventilation Airflow</span>
                  <span
                    className={`font-mono font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {params.airflow.toFixed(2)} m/s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2.5}
                  step={0.05}
                  value={params.airflow}
                  onChange={(e) =>
                    updateParamField('airflow', parseFloat(e.target.value))
                  }
                  className="w-full h-2 cursor-pointer"
                />
              </div>

              {/* Light Exposure */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">Surgical Light Irradiance</span>
                  <span
                    className={`font-mono font-semibold ${
                      isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                    }`}
                  >
                    {params.lightExposure} Lux
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={20}
                  value={params.lightExposure}
                  onChange={(e) =>
                    updateParamField(
                      'lightExposure',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full h-2 cursor-pointer"
                />
              </div>

              {/* Room Condition */}
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Chamber Enclosure Regime
                </label>
                <select
                  value={params.roomCondition}
                  onChange={(e) =>
                    updateParamField(
                      'roomCondition',
                      e.target.value as RoomConditionType
                    )
                  }
                  className={`w-full px-3 py-2 text-xs font-medium rounded-lg border ${
                    isLightMode
                      ? 'border-slate-300 bg-white text-slate-900'
                      : 'border-slate-700 bg-slate-950 text-slate-100'
                  }`}
                >
                  {ROOM_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Pathway Response Bars */}
            <div
              className={`pt-4 border-t space-y-3 text-xs ${
                isLightMode ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div
                className={`font-semibold ${
                  isLightMode ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                Biochemical Pathway Response
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Microbial & Enzymatic Kinetics</span>
                  <span className="font-mono font-semibold">
                    {metrics.microbialIndex}%
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${metrics.microbialIndex}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Adipocere (Saponification) Potential</span>
                  <span className="font-mono font-semibold">
                    {metrics.adipocerePotential}%
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${metrics.adipocerePotential}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Evaporative Desiccation Index</span>
                  <span className="font-mono font-semibold">
                    {metrics.desiccationIndex}%
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${metrics.desiccationIndex}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUICK STAGE JUMPER & 3D CAMERA ANGLE DECK */}
        {inspectorTab === 'stage-camera' && (
          <div className="p-6 space-y-5">
            <div>
              <span
                className={`text-xs font-medium ${
                  isLightMode ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                Stage & Camera Controls
              </span>
              <h3 className="text-lg font-semibold mt-0.5">
                Decomposition Stage & 3D Camera Angles
              </h3>
            </div>

            {/* 5 Decomposition Stage Quick-Jump Cards */}
            <div className="space-y-2">
              <span
                className={`text-xs font-medium block ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Select Stage to Preview 3D Changes:
              </span>
              {DECOMPOSITION_STAGES.map((stg) => {
                const isCurrent = metrics.currentStage.id === stg.id;
                const targetMidAdd =
                  stg.index === 5
                    ? 435
                    : (stg.addThresholdRange[0] + stg.addThresholdRange[1]) / 2;
                const estDay = Math.min(
                  30,
                  Math.max(
                    0.5,
                    Number(
                      (targetMidAdd / Math.max(4, params.temperature)).toFixed(1)
                    )
                  )
                );
                return (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => onJumpToSimDay && onJumpToSimDay(estDay)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isCurrent
                        ? isLightMode
                          ? 'bg-cyan-50 border-cyan-500 text-slate-900'
                          : 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                        : isLightMode
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                          : 'bg-slate-950/75 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{stg.title}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        {stg.baguioDayRange} · {stg.addThresholdRange[0]}–
                        {stg.addThresholdRange[1]} ADD
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                        isLightMode
                          ? 'bg-white border-slate-200 text-cyan-700'
                          : 'bg-slate-900 border-slate-700 text-cyan-300'
                      }`}
                    >
                      {isCurrent ? 'Active' : `Day ${estDay}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 6 Cinematic 3D Laboratory Camera Angles */}
            <div
              className={`pt-4 border-t ${
                isLightMode ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <span
                className={`text-xs font-medium block mb-2 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                3D Camera Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'body-closeup',
                      label: '01. 3D Subject Close-Up',
                      desc: 'Exam Table & Anatomy',
                    },
                    {
                      id: 'overhead-autopsy',
                      label: '02. Coronal Top-Down',
                      desc: 'Overhead Surgical View',
                    },
                    {
                      id: 'full-room',
                      label: '03. Full Chamber Wide',
                      desc: 'Complete Baguio Facility',
                    },
                    {
                      id: 'window-context',
                      label: '04. Baguio Pine Window',
                      desc: '1,540m Highland Exterior',
                    },
                    {
                      id: 'sensor-wall',
                      label: '05. Telemetry & HVAC',
                      desc: 'SEN-01 & VNT-06 Array',
                    },
                    {
                      id: 'workstation',
                      label: '06. LIMS Workstation',
                      desc: 'WKS-04 & East Cabinets',
                    },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      setViewMode('3d');
                      applyCameraPreset(cam.id);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isLightMode
                        ? 'border-slate-200 bg-slate-50 hover:border-cyan-500'
                        : 'border-slate-800 bg-slate-950 hover:border-cyan-400'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold ${
                        isLightMode ? 'text-slate-900' : 'text-cyan-300'
                      }`}
                    >
                      {cam.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {cam.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
