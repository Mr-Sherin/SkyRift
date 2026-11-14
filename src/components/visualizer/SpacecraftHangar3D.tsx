'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SpacecraftComponent, SubsystemType } from '@/game/types';

interface SpacecraftHangar3DProps {
  components: SpacecraftComponent[];
  activeSubsystem: SubsystemType;
  stageOffsetX?: number;
  className?: string;
}

const SUBSYSTEM_FOCUS: Record<SubsystemType, { yaw: number; pitch: number }> = {
  structure: { yaw: 0.55, pitch: 0.28 },
  power: { yaw: -0.65, pitch: 0.35 },
  propulsion: { yaw: 2.35, pitch: 0.22 },
  communications: { yaw: 0.25, pitch: 0.58 },
  gnc: { yaw: -1.15, pitch: 0.42 },
  thermal: { yaw: 1.25, pitch: 0.32 },
  cdh: { yaw: -0.25, pitch: 0.25 },
  payload: { yaw: 0.85, pitch: -0.05 },
};

function disposeGroup(group: THREE.Group) {
  try {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        try { obj.geometry.dispose(); } catch {}
        try {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } catch {}
      }
    });
  } catch {
    // ignore
  }
}

export function SpacecraftHangar3D({
  components,
  activeSubsystem,
  stageOffsetX = 0,
  className = '',
}: SpacecraftHangar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const craftRootRef = useRef<THREE.Group | null>(null);
  const hangarEnvRef = useRef<THREE.Group | null>(null);
  const stageOffsetRef = useRef(stageOffsetX);
  const targetOrbitRef = useRef({ yaw: 0.55, pitch: 0.28, zoom: 17 });
  const isUserDraggingRef = useRef(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    stageOffsetRef.current = stageOffsetX;
  }, [stageOffsetX]);

  // Smoothly focus camera toward active subsystem whenever tab changes
  useEffect(() => {
    const focus = SUBSYSTEM_FOCUS[activeSubsystem];
    if (focus) {
      targetOrbitRef.current.yaw = focus.yaw;
      targetOrbitRef.current.pitch = focus.pitch;
    }
  }, [activeSubsystem]);

  // Initialize Three.js Hangar Bay Scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
    camera.position.set(10, 5, 14);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Balanced Tactical Aerospace Hangar Lighting with Soft Rim Accents
    const ambient = new THREE.AmbientLight(0x334155, 0.95);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(12, 18, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-14, 6, -10);
    scene.add(fillLight);

    // Soft Rim Lighting so spacecraft stands out sharply against dark background
    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 1.45);
    cyanRim.position.set(-12, 10, -14);
    scene.add(cyanRim);

    const orangeRim = new THREE.DirectionalLight(0xff5a1f, 1.2);
    orangeRim.position.set(12, 12, -12);
    scene.add(orangeRim);

    // Hangar Floor Platform & Technical Measurement Rings
    const hangarEnv = new THREE.Group();

    const gridHelper = new THREE.GridHelper(32, 32, 0x1e293b, 0x0c1326);
    gridHelper.position.y = -4.2;
    hangarEnv.add(gridHelper);

    // Dark Metallic 3D Platform
    const turntableGeo = new THREE.CylinderGeometry(5.6, 5.9, 0.22, 64);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x11192e,
      roughness: 0.28,
      metalness: 0.88,
    });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = -4.08;
    hangarEnv.add(turntable);

    // Existing Orange Ring
    const orangeFloorRingGeo = new THREE.RingGeometry(5.3, 5.48, 72);
    const orangeFloorRingMat = new THREE.MeshBasicMaterial({
      color: 0xff5a1f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const orangeFloorRing = new THREE.Mesh(orangeFloorRingGeo, orangeFloorRingMat);
    orangeFloorRing.rotation.x = -Math.PI / 2;
    orangeFloorRing.position.y = -3.96;
    hangarEnv.add(orangeFloorRing);

    const outerReticleGeo = new THREE.RingGeometry(7.2, 7.26, 72);
    const outerReticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    });
    const outerReticle = new THREE.Mesh(outerReticleGeo, outerReticleMat);
    outerReticle.rotation.x = -Math.PI / 2;
    outerReticle.position.y = -3.96;
    hangarEnv.add(outerReticle);

    // Overhead Assembly Gantry Ring
    const gantryGeo = new THREE.TorusGeometry(8.5, 0.06, 12, 96);
    const gantryMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8,
    });
    const gantry = new THREE.Mesh(gantryGeo, gantryMat);
    gantry.rotation.x = Math.PI / 2;
    gantry.position.y = 4.8;
    hangarEnv.add(gantry);

    hangarEnvRef.current = hangarEnv;
    scene.add(hangarEnv);

    // Modular Spacecraft Root
    const craftRoot = new THREE.Group();
    craftRootRef.current = craftRoot;
    scene.add(craftRoot);

    // Drag & Wheel Orbit Controls
    let lastX = 0;
    let lastY = 0;
    let currentYaw = targetOrbitRef.current.yaw;
    let currentPitch = targetOrbitRef.current.pitch;
    let currentZoom = targetOrbitRef.current.zoom;

    const onPointerDown = (e: PointerEvent) => {
      isUserDraggingRef.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerUp = () => {
      isUserDraggingRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isUserDraggingRef.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetOrbitRef.current.yaw -= dx * 0.008;
      targetOrbitRef.current.pitch = Math.max(-0.25, Math.min(1.1, targetOrbitRef.current.pitch + dy * 0.006));
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetOrbitRef.current.zoom = Math.max(10, Math.min(25, targetOrbitRef.current.zoom + e.deltaY * 0.01));
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);

    let rafId: number;
    let currentShiftPx = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (!isUserDraggingRef.current) {
        targetOrbitRef.current.yaw += 0.14 * dt;
      }

      currentYaw += (targetOrbitRef.current.yaw - currentYaw) * 0.08;
      currentPitch += (targetOrbitRef.current.pitch - currentPitch) * 0.08;
      currentZoom += (targetOrbitRef.current.zoom - currentZoom) * 0.1;

      const horizontalDist = Math.cos(currentPitch) * currentZoom;
      camera.position.x = Math.sin(currentYaw) * horizontalDist;
      camera.position.z = Math.cos(currentYaw) * horizontalDist;
      camera.position.y = Math.sin(currentPitch) * currentZoom + 0.3;
      camera.lookAt(0, -0.35, 0);

      // Shift perspective frustum cleanly when left browser panel is open on desktop
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 600;
      const targetShiftPx = w >= 1024 ? stageOffsetRef.current : 0;
      currentShiftPx += (targetShiftPx - currentShiftPx) * 0.08;
      if (Math.abs(currentShiftPx) > 0.5) {
        camera.setViewOffset(w, h, currentShiftPx, 0, w, h);
      } else if (camera.view) {
        camera.clearViewOffset();
      }

      // Gentle zero-G suspension float above turntable
      craftRoot.position.y = Math.sin(elapsed * 1.4) * 0.16;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('wheel', onWheel);
      if (craftRootRef.current) {
        disposeGroup(craftRootRef.current);
      }
      disposeGroup(hangarEnv);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Dynamically Rebuild 3D Spacecraft Parts Whenever Components or Active Subsystem Change
  useEffect(() => {
    const craftRoot = craftRootRef.current;
    if (!craftRoot) return;

    disposeGroup(craftRoot);
    craftRoot.clear();

    const matHull = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.2 });
    const matSlate = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.65 });
    const matSolar = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.22, metalness: 0.55 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.78 });
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xff5e1e, roughness: 0.25, metalness: 0.25 });
    const matGhost = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    const getAccent = (sub: SubsystemType, base: THREE.Material) =>
      activeSubsystem === sub ? matOrange : base;

    const hasStructure = components.some((c) => c.subsystem === 'structure');
    const structureComp = components.find((c) => c.subsystem === 'structure');
    const powerComps = components.filter((c) => c.subsystem === 'power');
    const propComps = components.filter((c) => c.subsystem === 'propulsion');
    const commComps = components.filter((c) => c.subsystem === 'communications');
    const gncComps = components.filter((c) => c.subsystem === 'gnc');
    const thermalComps = components.filter((c) => c.subsystem === 'thermal');
    const cdhComps = components.filter((c) => c.subsystem === 'cdh');
    const payloadComps = components.filter((c) => c.subsystem === 'payload');

    // 1. Structure Bus (or wireframe blueprint guide if empty!)
    if (!hasStructure) {
      const ghostGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.2, 6);
      const ghost = new THREE.Mesh(ghostGeo, matGhost);
      craftRoot.add(ghost);
    } else if (structureComp?.id === 'bus-cubesat-6u') {
      const bus = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.0, 1.1), matHull);
      craftRoot.add(bus);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.2, 1.16), getAccent('structure', matSlate));
      frame.position.y = 0.7;
      craftRoot.add(frame);
    } else if (structureComp?.id === 'bus-deepspace-titanium') {
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 2.6, 8), matHull);
      craftRoot.add(bus);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.1, 12, 32), getAccent('structure', matOrange));
      ring.rotation.x = Math.PI / 2;
      craftRoot.add(ring);
    } else {
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 2.2, 6), matHull);
      craftRoot.add(bus);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 6), getAccent('structure', matSlate));
      collar.position.y = 0.8;
      craftRoot.add(collar);
    }

    // 2. Thermal Blankets / Louvers
    if (thermalComps.length > 0) {
      const hasActive = thermalComps.some((c) => c.id === 'tcs-active-louvers');
      const wrapMat = activeSubsystem === 'thermal' ? matOrange : hasActive ? matSlate : matGold;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.7, 6), wrapMat);
      band.position.y = -0.2;
      craftRoot.add(band);
      if (hasActive) {
        for (let i = 0; i < 4; i++) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.8), wrapMat);
          const a = (i * Math.PI) / 2;
          fin.position.set(Math.cos(a) * 1.65, -0.2, Math.sin(a) * 1.65);
          fin.rotation.y = -a;
          craftRoot.add(fin);
        }
      }
    }

    // 3. Power: Solar Wings, Fixed Panels, Battery, or Nuclear RTG
    powerComps.forEach((p, idx) => {
      if (p.id === 'eps-rtg-nextgen') {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 12), matSlate);
        boom.rotation.z = Math.PI / 2;
        boom.position.set(-2.1, -0.5, 0.6 * (idx % 2 === 0 ? 1 : -1));
        craftRoot.add(boom);
        const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.3, 12), getAccent('power', matSlate));
        rtg.rotation.z = Math.PI / 2;
        rtg.position.set(-3.1, -0.5, 0.6 * (idx % 2 === 0 ? 1 : -1));
        craftRoot.add(rtg);
      } else if (p.id === 'eps-li-ion-heavy') {
        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.6), getAccent('power', matSlate));
        pack.position.set(0, -0.4, 1.55);
        craftRoot.add(pack);
      } else {
        const wingLen = p.id === 'eps-solar-deployable' ? 4.4 : 1.8;
        const wingWidth = p.id === 'eps-solar-deployable' ? 1.5 : 1.0;
        const zOff = (idx % 2) * 0.45;
        [-1, 1].forEach((side) => {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), matSlate);
          strut.rotation.z = Math.PI / 2;
          strut.position.set(side * 1.85, 0.25, zOff);
          craftRoot.add(strut);

          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(wingLen, 0.07, wingWidth),
            activeSubsystem === 'power' ? matOrange : matSolar
          );
          panel.position.set(side * (2.3 + wingLen / 2), 0.25, zOff);
          panel.rotation.x = 0.25;
          craftRoot.add(panel);
        });
      }
    });

    // 4. Propulsion Engine Bell & Tanks (Aft / Bottom)
    propComps.forEach((prop, idx) => {
      const xShift = (idx - (propComps.length - 1) / 2) * 0.85;
      const tank = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), matHull);
      tank.position.set(xShift, -1.35, 0);
      craftRoot.add(tank);

      const bellSize = prop.id === 'prop-ion-xenon' ? 0.55 : prop.id === 'prop-bipropellant' ? 0.5 : 0.32;
      const bell = new THREE.Mesh(
        new THREE.ConeGeometry(bellSize, 0.85, 24, 1, true),
        getAccent('propulsion', matSlate)
      );
      bell.position.set(xShift, -2.05, 0);
      craftRoot.add(bell);

      const nozzleGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(bellSize * 0.45, bellSize * 0.75, 0.18, 20),
        matOrange
      );
      nozzleGlow.position.set(xShift, -2.38, 0);
      craftRoot.add(nozzleGlow);
    });

    // 5. Communications Dish / Antenna (Top Deck)
    commComps.forEach((comm) => {
      if (comm.id === 'comm-omni-lga') {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 10), getAccent('communications', matSlate));
        mast.position.set(0.7, 1.7, -0.4);
        craftRoot.add(mast);
      } else {
        const radius = comm.id === 'comm-deepspace-hga' ? 1.55 : 0.9;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 12), matSlate);
        mast.position.set(0, 1.45, 0);
        craftRoot.add(mast);

        const dish = new THREE.Mesh(
          new THREE.ConeGeometry(radius, 0.45, 32, 1, true),
          getAccent('communications', matHull)
        );
        dish.rotation.x = Math.PI;
        dish.position.set(0, 2.0, 0);
        craftRoot.add(dish);

        const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 10), matOrange);
        feed.position.set(0, 2.25, 0);
        craftRoot.add(feed);
      }
    });

    // 6. GNC Star Trackers & Reaction Wheels
    if (gncComps.length > 0) {
      const wheelRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.1, 10, 28),
        getAccent('gnc', matSlate)
      );
      wheelRing.position.set(0, 1.15, 0);
      wheelRing.rotation.x = Math.PI / 2;
      craftRoot.add(wheelRing);

      const tracker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.22, 0.55, 14),
        getAccent('gnc', matSlate)
      );
      tracker.position.set(-1.1, 1.15, 0.7);
      tracker.rotation.z = 0.55;
      craftRoot.add(tracker);
    }

    // 7. C&DH Avionics Bay
    if (cdhComps.length > 0) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.9, 0.35),
        getAccent('cdh', matSlate)
      );
      box.position.set(-1.45, 0.15, -0.35);
      craftRoot.add(box);
    }

    // 8. Science Payloads (Front Instrument Bay)
    payloadComps.forEach((pay, idx) => {
      const angle = (idx - (payloadComps.length - 1) / 2) * 0.55;
      if (pay.id === 'inst-magnetometer') {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8), getAccent('payload', matSlate));
        boom.rotation.x = Math.PI / 2;
        boom.position.set(0.4, -0.4, 2.6);
        craftRoot.add(boom);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), matOrange);
        tip.position.set(0.4, -0.4, 4.2);
        craftRoot.add(tip);
      } else if (pay.id === 'inst-sar-radar') {
        const radar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 1.1), getAccent('payload', matGold));
        radar.position.set(0, -0.9, 1.7);
        radar.rotation.x = 0.4;
        craftRoot.add(radar);
      } else {
        const optic = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.34, 0.9, 18),
          getAccent('payload', matSlate)
        );
        optic.rotation.x = Math.PI / 2;
        optic.position.set(Math.sin(angle) * 1.45, 0.35, Math.cos(angle) * 1.45 + 0.3);
        optic.rotation.y = angle;
        craftRoot.add(optic);

        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), matOrange);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(Math.sin(angle) * 1.9, 0.35, Math.cos(angle) * 1.9 + 0.3);
        lens.rotation.y = angle;
        craftRoot.add(lens);
      }
    });
  }, [components, activeSubsystem]);

  if (webglUnavailable) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-[#F4F6F9] ${className}`}>
        <svg viewBox="0 0 320 240" className="w-64 h-48 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="160" cy="188" rx="115" ry="26" stroke="#FF5E1E" strokeOpacity="0.45" />
          <polygon points="160,68 195,90 195,140 160,162 125,140 125,90" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          <rect x="42" y="102" width="76" height="22" fill="#E2E8F0" stroke="#334155" />
          <rect x="202" y="102" width="76" height="22" fill="#E2E8F0" stroke="#334155" />
          <path d="M138 68 Q160 40 182 68" stroke="#FF5E1E" strokeWidth="2.5" />
          <polygon points="146,162 174,162 182,182 138,182" fill="#334155" stroke="#0F172A" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none ${className}`}
    />
  );
}
