import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CyberScene3DProps {
  statusMode?: 'safe' | 'scanning' | 'threat' | 'compare';
  interactive?: boolean;
  className?: string;
}

export const CyberScene3D: React.FC<CyberScene3DProps> = ({
  statusMode = 'safe',
  interactive = true,
  className = 'w-full h-48 md:h-64',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Color definitions based on status
    const getColor = (mode: string) => {
      switch (mode) {
        case 'threat':
          return { primary: 0xef4444, secondary: 0xf43f5e, ambient: 0x881337 };
        case 'scanning':
          return { primary: 0xf59e0b, secondary: 0x38bdf8, ambient: 0x78350f };
        case 'compare':
          return { primary: 0xa855f7, secondary: 0x06b6d4, ambient: 0x581c87 };
        case 'safe':
        default:
          return { primary: 0x06b6d4, secondary: 0x10b981, ambient: 0x083344 };
      }
    };

    let colors = getColor(statusMode);

    // 1. Central Cyber Core (Icosahedron Wireframe & Holographic Glow)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeo = new THREE.IcosahedronGeometry(1.8, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: colors.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(1.1, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      wireframe: false,
      transparent: true,
      opacity: 0.18,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerSphere);

    // 2. Orbital Rings (Quantum Radar Shield)
    const ringMat1 = new THREE.LineBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.6,
    });
    const ringGeo1 = new THREE.RingGeometry(2.5, 2.53, 64);
    const ringMesh1 = new THREE.LineLoop(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    coreGroup.add(ringMesh1);

    const ringMat2 = new THREE.LineBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.5,
    });
    const ringGeo2 = new THREE.RingGeometry(3.0, 3.03, 64);
    const ringMesh2 = new THREE.LineLoop(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    ringMesh2.rotation.x = -Math.PI / 6;
    coreGroup.add(ringMesh2);

    // 3. Floating Defense Nodes / Particle Cloud
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      scales[i] = Math.random();
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.primary,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particleSystem);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(colors.primary, 2.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(colors.secondary, 2.0);
    dirLight2.position.set(-5, -5, -2);
    scene.add(dirLight2);

    // Mouse & Mobile Touch Interaction (Tilt lerp)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 1.5;
      mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 1.5;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!interactive || !event.touches.length) return;
      const touch = event.touches[0];
      const rect = container.getBoundingClientRect();
      mouseX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2.0;
      mouseY = ((touch.clientY - rect.top) / rect.height - 0.5) * 2.0;
    };

    if (interactive) {
      window.addEventListener('mousemove', onMouseMove);
      container.addEventListener('touchmove', onTouchMove, { passive: true });
    }

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Autonomous rotations
      coreGroup.rotation.y = elapsedTime * 0.25;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.15;

      ringMesh1.rotation.z = elapsedTime * 0.35;
      ringMesh2.rotation.z = -elapsedTime * 0.45;

      // Particle pulse
      particleSystem.rotation.y = -elapsedTime * 0.1;

      // Mouse damping / lerp
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      coreGroup.rotation.y += targetX * 0.5;
      coreGroup.rotation.x += targetY * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // WebGL Context recovery
    const canvas = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };
    const handleContextRestored = () => {
      animate();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('touchmove', onTouchMove);
      }
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [statusMode, interactive]);

  return (
    <div className={`relative overflow-hidden pointer-events-auto ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      {/* Subtle futuristic holographic grid ring */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
    </div>
  );
};
