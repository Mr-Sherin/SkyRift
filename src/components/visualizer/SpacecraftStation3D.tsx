'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface SpacecraftStation3DProps {
  interactive?: boolean;
  centered?: boolean;
  className?: string;
}

export function SpacecraftStation3D({
  interactive = true,
  centered = false,
  className = ''
}: SpacecraftStation3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();

    // Center camera for dedicated viewports, or offset right for full-bleed hero overlays
    const focusX = centered ? 0 : 10;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    if (centered) {
      camera.position.set(0, 11, 44);
    } else {
      camera.position.set(20, 10, 48);
    }
    camera.lookAt(new THREE.Vector3(focusX, 0, 0));

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

    // High-Key Sci-Fi Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
    keyLight.position.set(30, 40, 30);
    scene.add(keyLight);

    const orangeRimLight = new THREE.DirectionalLight(0xFF5E1E, 1.4);
    orangeRimLight.position.set(-20, -10, -20);
    scene.add(orangeRimLight);

    // Materials
    const whiteHullMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.3,
      metalness: 0.15,
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.5,
      metalness: 0.7,
    });

    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xFF5E1E,
      roughness: 0.3,
      metalness: 0.2,
    });

    // Station Root Group
    const stationGroup = new THREE.Group();
    stationGroup.position.set(focusX, 0, 0);

    // 1. Central Vertical Spire
    const spireGeo = new THREE.CylinderGeometry(0.6, 1.4, 18, 32);
    const spire = new THREE.Mesh(spireGeo, whiteHullMat);
    stationGroup.add(spire);

    // Spire Antennas & Communication Mast
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.25, 7, 16);
    const mast = new THREE.Mesh(mastGeo, darkMetalMat);
    mast.position.set(0, 12, 0);
    stationGroup.add(mast);

    // Central Avionics Sphere
    const centerSphereGeo = new THREE.SphereGeometry(2.4, 32, 24);
    const centerSphere = new THREE.Mesh(centerSphereGeo, whiteHullMat);
    centerSphere.position.set(0, 1.5, 0);
    stationGroup.add(centerSphere);

    // Orange status collar on center
    const statusCollarGeo = new THREE.TorusGeometry(2.5, 0.12, 16, 48);
    const statusCollar = new THREE.Mesh(statusCollarGeo, orangeMat);
    statusCollar.rotation.x = Math.PI / 2;
    statusCollar.position.set(0, 1.5, 0);
    stationGroup.add(statusCollar);

    // 2. Upper Centrifugal Ring
    const upperRingGroup = new THREE.Group();
    const upperTorusGeo = new THREE.TorusGeometry(6.5, 0.45, 16, 64);
    const upperRing = new THREE.Mesh(upperTorusGeo, whiteHullMat);
    upperRing.rotation.x = Math.PI / 2;
    upperRingGroup.add(upperRing);

    // Upper Ring Orange Trim
    const upperTrimGeo = new THREE.TorusGeometry(6.8, 0.08, 16, 64);
    const upperTrim = new THREE.Mesh(upperTrimGeo, orangeMat);
    upperTrim.rotation.x = Math.PI / 2;
    upperRingGroup.add(upperTrim);

    // Upper Spokes
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const spokeGeo = new THREE.BoxGeometry(0.35, 0.25, 6);
      const spoke = new THREE.Mesh(spokeGeo, darkMetalMat);
      spoke.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
      spoke.rotation.y = -angle;
      upperRingGroup.add(spoke);
    }
    upperRingGroup.position.set(0, 4, 0);
    stationGroup.add(upperRingGroup);

    // 3. Lower Massive Habitat Gravity Ring
    const mainRingGroup = new THREE.Group();
    const mainTorusGeo = new THREE.TorusGeometry(10.5, 0.75, 20, 80);
    const mainRing = new THREE.Mesh(mainTorusGeo, whiteHullMat);
    mainRing.rotation.x = Math.PI / 2;
    mainRingGroup.add(mainRing);

    // Outer Orange Stripe
    const mainTrimGeo = new THREE.TorusGeometry(11.1, 0.12, 16, 80);
    const mainTrim = new THREE.Mesh(mainTrimGeo, orangeMat);
    mainTrim.rotation.x = Math.PI / 2;
    mainRingGroup.add(mainTrim);

    // 6 Radial Spokes & Habitation Modules
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const spokeGeo = new THREE.BoxGeometry(0.5, 0.4, 10);
      const spoke = new THREE.Mesh(spokeGeo, darkMetalMat);
      spoke.position.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
      spoke.rotation.y = -angle;
      mainRingGroup.add(spoke);

      // Outboard Modular Pods
      const podGeo = new THREE.BoxGeometry(1.6, 1.2, 2.2);
      const pod = new THREE.Mesh(podGeo, whiteHullMat);
      pod.position.set(Math.cos(angle) * 10.5, 0, Math.sin(angle) * 10.5);
      pod.rotation.y = -angle;

      const podOrangeStripGeo = new THREE.BoxGeometry(1.65, 0.2, 0.6);
      const podOrangeStrip = new THREE.Mesh(podOrangeStripGeo, orangeMat);
      podOrangeStrip.position.set(0, 0.3, 0);
      pod.add(podOrangeStrip);

      mainRingGroup.add(pod);
    }
    mainRingGroup.position.set(0, -1, 0);
    stationGroup.add(mainRingGroup);

    // 4. Floating Perimeter Arrays & Orbital Panels
    const panelsGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + 0.4;
      const radGeo = new THREE.BoxGeometry(0.08, 3.2, 1.2);
      const rad = new THREE.Mesh(radGeo, i % 2 === 0 ? whiteHullMat : darkMetalMat);
      rad.position.set(Math.cos(angle) * 14.5, (i % 2) * 1.5 - 0.75, Math.sin(angle) * 14.5);
      rad.rotation.y = -angle;
      panelsGroup.add(rad);
    }
    stationGroup.add(panelsGroup);

    // Angle station slightly forward
    stationGroup.rotation.x = 0.32;
    stationGroup.rotation.z = -0.12;
    scene.add(stationGroup);

    // 5. Pointer & Drag Interaction
    let targetRotationY = 0;
    let targetRotationX = 0.32;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragYaw = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      if (isDragging) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        dragYaw += dx * 0.008;
        targetRotationX = Math.max(-0.4, Math.min(0.95, targetRotationX + dy * 0.004));
        return;
      }

      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = mouseX * 0.5;
      targetRotationX = 0.32 - mouseY * 0.2;
    };

    if (interactive) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointerup', handlePointerUp);
      container.addEventListener('pointermove', handlePointerMove);
    }

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

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Counter-rotating rings
      upperRingGroup.rotation.z += 0.35 * delta;
      mainRingGroup.rotation.z -= 0.22 * delta;
      panelsGroup.rotation.y += 0.08 * delta;

      // Smooth pointer orientation & idle rotation
      dragYaw += 0.08 * delta;
      stationGroup.rotation.y += (targetRotationY + dragYaw - stationGroup.rotation.y) * 0.08;
      stationGroup.rotation.x += (targetRotationX - stationGroup.rotation.x) * 0.08;

      // Orbital hover bobbing
      stationGroup.position.y = Math.sin(time * 0.9) * 0.35;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      if (interactive) {
        container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerup', handlePointerUp);
        container.removeEventListener('pointermove', handlePointerMove);
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [interactive, centered]);

  if (webglUnavailable) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center bg-rift-surface/60 ${className}`}>
        <svg viewBox="0 0 240 240" className="w-48 h-48 text-rift-lineDark opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="120" cy="120" r="88" strokeDasharray="4 4" />
          <ellipse cx="120" cy="120" rx="80" ry="28" transform="rotate(-18 120 120)" stroke="#FF5E1E" strokeWidth="2.5" />
          <ellipse cx="120" cy="120" rx="52" ry="18" transform="rotate(-18 120 120)" stroke="#0F172A" strokeWidth="2" />
          <line x1="120" y1="32" x2="120" y2="208" stroke="#0F172A" strokeWidth="3" />
          <circle cx="120" cy="120" r="10" fill="#FF5E1E" stroke="none" />
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
