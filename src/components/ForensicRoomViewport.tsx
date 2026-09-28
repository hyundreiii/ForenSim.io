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
  ForensicSubjectModel,
  StructuralLayerMode,
} from './ForensicSubjectModel';
import {
  Camera,
  Crosshair,
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
  const [cameraTargetY, setCameraTargetY] = useState<number>(0.92);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [hoveredObjectName, setHoveredObjectName] = useState<string | null>(
    null
  );

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
    cameraTargetY,
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
      cameraTargetY,
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
    cameraTargetY,
    autoOrbit,
  ]);

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
      setCameraAngle(0.38);
      setCameraPitch(0.48);
      setCameraZoom(3.05);
      setCameraTargetY(0.92);
      const spc = ROOM_OBJECTS.find((o) => o.id === 'specimen-area');
      if (spc) onSelectObject(spc);
    } else if (preset === 'overhead-autopsy') {
      setCameraAngle(0.01);
      setCameraPitch(1.32);
      setCameraZoom(3.4);
      setCameraTargetY(0.88);
    } else if (preset === 'full-room') {
      setCameraAngle(0.58);
      setCameraPitch(0.46);
      setCameraZoom(6.2);
      setCameraTargetY(1.0);
    } else if (preset === 'window-context') {
      setCameraAngle(0.0);
      setCameraPitch(0.24);
      setCameraZoom(5.0);
      setCameraTargetY(1.35);
      const win = ROOM_OBJECTS.find((o) => o.id === 'window');
      if (win) onSelectObject(win);
    } else if (preset === 'sensor-wall') {
      setCameraAngle(0.85);
      setCameraPitch(0.36);
      setCameraZoom(5.1);
      setCameraTargetY(1.25);
      const sen = ROOM_OBJECTS.find((o) => o.id === 'env-sensor');
      if (sen) onSelectObject(sen);
    } else if (preset === 'workstation') {
      setCameraAngle(-0.62);
      setCameraPitch(0.38);
      setCameraZoom(4.9);
      setCameraTargetY(1.05);
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

    // Interactive Clickable Meshes Registry
    const clickableMeshes: THREE.Object3D[] = [];
    const objectHighlightRings: Record<string, THREE.Mesh> = {};

    const createHighlightRing = (
      id: string,
      ringPos: [number, number, number],
      ringRadius = 0.26
    ) => {
      const ringGeo = new THREE.RingGeometry(
        ringRadius * 0.82,
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
    };

    const registerInteractiveGroup = (
      id: string,
      group: THREE.Group,
      ringPos: [number, number, number],
      ringRadius = 0.26
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
      createHighlightRing(id, ringPos, ringRadius);
    };

    // =========================================================================
    // 1. WIN-09: Reinforced Observation Window (Baguio City Pine Highland View)
    // =========================================================================
    const windowGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.72,
      roughness: 0.25,
    });
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.88, 1.52, 0.18),
      frameMat
    );
    winFrame.position.set(0, 1.78, -3.12);
    windowGroup.add(winFrame);

    const glassMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      GENERATED_ASSETS.windowView,
      (tex) => {
        glassMat.map = tex;
        glassMat.color.setHex(0xffffff);
        glassMat.needsUpdate = true;
      },
      undefined,
      () => {
        glassMat.color.setHex(0x38bdf8);
      }
    );
    const winPane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.34),
      glassMat
    );
    winPane.position.set(0, 1.78, -3.01);
    windowGroup.add(winPane);

    // Vertical aluminum window mullions & condensation glass sheen
    [-0.9, 0, 0.9].forEach((mx) => {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 1.36, 0.04),
        frameMat
      );
      mullion.position.set(mx, 1.78, -3.0);
      windowGroup.add(mullion);
    });

    registerInteractiveGroup('window', windowGroup, [0, 0.02, -2.55]);

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

    registerInteractiveGroup('exam-table', examTableGroup, [0, 0.02, 0], 0.42);
    createHighlightRing('specimen-area', [-0.12, 0.845, 0], 0.34);

    // =========================================================================
    // 4. EVD-03: Forensic Evidence Markers (#01–#04)
    // =========================================================================
    const markersGroup = new THREE.Group();
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.22,
    });
    const markerPositions: [number, number, number][] = [
      [-0.96, 0.89, 0.36],
      [-0.35, 0.89, -0.38],
      [0.25, 0.89, 0.37],
      [0.88, 0.89, -0.35],
    ];
    markerPositions.forEach(([mx, my, mz]) => {
      const tent = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.11, 4),
        markerMat
      );
      tent.position.set(mx, my, mz);
      tent.castShadow = true;
      markersGroup.add(tent);
    });
    registerInteractiveGroup(
      'evidence-markers',
      markersGroup,
      [-0.96, 0.85, 0.36],
      0.18
    );

    // =========================================================================
    // 5. SEN-01: Environmental Sensor Array (North-West Telemetry Mast)
    // =========================================================================
    const sensorGroup = new THREE.Group();
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.065, 2.18, 16),
      darkSteelMat
    );
    mast.position.set(-2.55, 1.09, -2.35);
    sensorGroup.add(mast);
    const sensorHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.36, 0.28),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.5,
        roughness: 0.22,
      })
    );
    sensorHead.position.set(-2.55, 2.05, -2.35);
    sensorGroup.add(sensorHead);
    // Anemometer cups & barometric antenna
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.35, 8),
      brushedSteelMat
    );
    antenna.position.set(-2.55, 2.38, -2.35);
    sensorGroup.add(antenna);
    registerInteractiveGroup('env-sensor', sensorGroup, [-2.55, 0.02, -2.35]);

    // =========================================================================
    // 6. VNT-06: Laminar Ventilation & HEPA Filtration System
    // =========================================================================
    const ventGroup = new THREE.Group();
    const duct = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.48, 1.95),
      brushedSteelMat
    );
    duct.position.set(-3.4, 2.48, -1.1);
    ventGroup.add(duct);
    for (let v = -1.85; v <= -0.35; v += 0.3) {
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.36, 0.04),
        darkSteelMat
      );
      vane.position.set(-3.19, 2.48, v);
      ventGroup.add(vane);
    }
    registerInteractiveGroup('ventilation', ventGroup, [-3.15, 0.02, -1.1]);

    // =========================================================================
    // 7. TMP-07: Temperature Monitor (West Wall Digital Console)
    // =========================================================================
    const tempGroup = new THREE.Group();
    const tempBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.54, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.32 })
    );
    tempBox.position.set(-3.52, 1.48, 0.45);
    tempGroup.add(tempBox);
    const tempScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'TMP-07 THERMISTOR',
        `${params.temperature.toFixed(1)}°C`,
        `Q10 Rate: ${metrics.q10Multiplier}x`,
        '#38bdf8'
      ),
    });
    const tempScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.44),
      tempScreenMat
    );
    tempScreen.rotation.y = Math.PI / 2;
    tempScreen.position.set(-3.43, 1.48, 0.45);
    tempGroup.add(tempScreen);
    registerInteractiveGroup('temp-monitor', tempGroup, [-3.15, 0.02, 0.45]);

    // =========================================================================
    // 8. HUM-08: Humidity Monitor (North-East Wall Hygrometer Console)
    // =========================================================================
    const humGroup = new THREE.Group();
    const humBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.54, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.32 })
    );
    humBox.position.set(2.25, 1.48, -3.05);
    humGroup.add(humBox);
    const humScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'HUM-08 HYGROMETER',
        `${params.humidity}% RH`,
        `Dew Pt: ${(params.temperature - (100 - params.humidity) / 5).toFixed(1)}°C`,
        '#22d3ee'
      ),
    });
    const humScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.44),
      humScreenMat
    );
    humScreen.position.set(2.25, 1.48, -2.96);
    humGroup.add(humScreen);
    registerInteractiveGroup('humidity-monitor', humGroup, [2.25, 0.02, -2.55]);

    // =========================================================================
    // 9. WKS-04: Dual-Monitor LIMS Research Workstation & Lab Chair (East Zone)
    // =========================================================================
    const wksGroup = new THREE.Group();
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.78, 1.85),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    desk.position.set(2.55, 0.39, 0.85);
    desk.castShadow = true;
    wksGroup.add(desk);

    const limsScreenMat = new THREE.MeshBasicMaterial({
      map: createInstrumentScreenTexture(
        'WKS-04 FORENSIC LIMS',
        `${metrics.add.toFixed(0)} ADD`,
        `VOC: ${metrics.vocPpm} ppm`,
        '#34d399'
      ),
    });

    // Dual Widescreen Monitors + Stands
    [0.42, 1.25].forEach((mz) => {
      const monitorBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.48, 0.76),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.25 })
      );
      monitorBezel.position.set(2.62, 1.08, mz);
      wksGroup.add(monitorBezel);

      const screenPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.42),
        limsScreenMat
      );
      screenPlane.rotation.y = -Math.PI / 2;
      screenPlane.position.set(2.59, 1.08, mz);
      wksGroup.add(screenPlane);
    });

    // Keyboard & Ergonomic Lab Stool
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.015, 0.46),
      darkSteelMat
    );
    keyboard.position.set(2.25, 0.79, 0.85);
    wksGroup.add(keyboard);

    const chairSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    chairSeat.position.set(1.72, 0.52, 0.85);
    wksGroup.add(chairSeat);
    const chairPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12),
      brushedSteelMat
    );
    chairPedestal.position.set(1.72, 0.25, 0.85);
    wksGroup.add(chairPedestal);

    registerInteractiveGroup('research-computer', wksGroup, [2.55, 0.02, 0.85]);

    // =========================================================================
    // 10. CAM-05: Dual Articulated Surgical Lamps & Optical/LWIR Camera Rig
    // =========================================================================
    const camGroup = new THREE.Group();
    const gantry = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 16),
      darkSteelMat
    );
    gantry.position.set(0, 2.82, 0);
    camGroup.add(gantry);

    const beamCones: THREE.Mesh[] = [];
    [-0.42, 0.42].forEach((lx) => {
      const dome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.3, 0.08, 24),
        brushedSteelMat
      );
      dome.position.set(lx, 2.52, 0);
      camGroup.add(dome);
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.26, 24),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(lx, 2.47, 0);
      camGroup.add(lens);

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

    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.34),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.55,
        roughness: 0.2,
      })
    );
    camBody.position.set(0, 2.55, 0);
    camGroup.add(camBody);
    registerInteractiveGroup('camera', camGroup, [0, 0.02, 0.65]);

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

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onPointerDown);
    domElem.addEventListener('mousemove', onPointerMove);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mouseup', onPointerUp);

    let animId: number;
    let clock = 0;
    let lastWallClockKey = '';

    // Smooth camera state variables
    let smoothAngle = stateRef.current.cameraAngle;
    let smoothPitch = stateRef.current.cameraPitch;
    let smoothZoom = stateRef.current.cameraZoom;
    let smoothTargetY = stateRef.current.cameraTargetY;

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
        cameraTargetY: targetY,
        autoOrbit: isOrbiting,
      } = stateRef.current;

      // Smoothly interpolate camera position and target
      const desiredAngle = isOrbiting ? targetAngle + clock * 0.15 : targetAngle;
      smoothAngle += (desiredAngle - smoothAngle) * 0.12;
      smoothPitch += (targetPitch - smoothPitch) * 0.12;
      smoothZoom += (targetZoom - smoothZoom) * 0.12;
      smoothTargetY += (targetY - smoothTargetY) * 0.12;

      camera.position.x =
        Math.sin(smoothAngle) * Math.cos(smoothPitch) * smoothZoom;
      camera.position.y = Math.sin(smoothPitch) * smoothZoom + 0.55;
      camera.position.z =
        Math.cos(smoothAngle) * Math.cos(smoothPitch) * smoothZoom;
      camera.lookAt(0, smoothTargetY, 0);

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
      }

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

      // Pulse selected object's floor locator ring
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
      window.removeEventListener('mouseup', onPointerUp);
      domElem.removeEventListener('mousedown', onPointerDown);
      domElem.removeEventListener('mousemove', onPointerMove);
      domElem.removeEventListener('wheel', onWheel);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Columns: Interactive 3D Chamber / Dedicated ForensicSubjectModel / 2D Blueprint */}
      <div
        className={`lg:col-span-7 rounded-xl border overflow-hidden relative ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#080D1A] border-slate-800 shadow-xl'
        }`}
      >
        {/* Top Viewport Mode & Camera Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b z-10 relative ${
            isLightMode
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-slate-950/95 border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {webglSupported && (
              <div
                className={`flex items-center p-1 rounded-lg border ${
                  isLightMode
                    ? 'bg-slate-200/70 border-slate-300'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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

          {viewMode === '3d' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyCameraPreset('body-closeup')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                Full Room
              </button>
            </div>
          )}
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
          <div className="relative w-full h-[480px] sm:h-[520px] select-none">
            {viewMode === '3d' && webglSupported ? (
              <>
                <div
                  ref={mountRef}
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                />
                {/* Clean Top-Left Active Target Readout */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <div
                    className={`flex items-center gap-2 backdrop-blur-md border px-3 py-1.5 rounded-lg shadow-sm ${
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
                    <span className="text-xs font-mono font-medium">
                      {hoveredObjectName ||
                        `${selectedObject.code} · ${selectedObject.name}`}
                    </span>
                  </div>
                </div>

                {/* Bottom Camera Zoom & Helper Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                  <div
                    className={`backdrop-blur-md border px-3 py-1.5 rounded-lg text-xs ${
                      isLightMode
                        ? 'bg-white/90 border-slate-300 text-slate-700 shadow-xs'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    Click any 3D region or instrument · Drag to rotate · Scroll
                    to zoom
                  </div>
                  <div
                    className={`flex items-center gap-1.5 pointer-events-auto backdrop-blur-md border px-2.5 py-1 rounded-lg ${
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
                className={`w-full h-full relative p-6 flex flex-col justify-between overflow-hidden ${
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
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-56 h-5 border-b border-x flex items-center justify-center ${
                      isLightMode
                        ? 'bg-cyan-100 border-cyan-500 text-cyan-900'
                        : 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    }`}
                  >
                    <span className="text-xs font-mono font-medium">
                      North Window (Baguio 1,540m)
                    </span>
                  </div>

                  {/* Central Examination Table with 2D Structural Anatomy SVG */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 rounded border-2 flex flex-col items-center justify-center ${
                      isLightMode
                        ? 'border-cyan-600/60 bg-slate-50 shadow-sm'
                        : 'border-cyan-400/60 bg-slate-900/90'
                    }`}
                  >
                    <svg
                      viewBox="0 0 220 70"
                      className={`w-52 h-20 ${
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
                      className={`text-xs font-mono font-semibold ${
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
                        className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-mono transition-transform duration-150 flex items-center gap-1.5 border ${
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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

      {/* Right 5 Columns: Multi-Mode Command & Telemetry Inspector Console */}
      <div
        className={`lg:col-span-5 rounded-xl border overflow-hidden flex flex-col ${
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
    </div>
  );
};
