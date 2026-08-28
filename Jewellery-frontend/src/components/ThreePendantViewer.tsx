'use client';
// src/components/ThreePendantViewer.tsx
// High-Fidelity 3D Sterling Silver Terrain Relief Pendant Viewer (WebGL / Three.js)
// Replicates the ne-rovno.ru physical engraved terrain medallion behavior.

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreePendantViewerProps {
  lat: number;
  lng: number;
  zoom: number;
  activeStyleId: string;
  locationName: string;
  sizeMm?: number;
  engravingText?: string;
}

export default function ThreePendantViewer({
  lat,
  lng,
  zoom,
  activeStyleId,
  locationName,
  sizeMm = 20,
  engravingText,
}: ThreePendantViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const coinGroupRef = useRef<THREE.Group | null>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Rotation & Drag state
  const rotState = useRef({
    targetRotY: 0.28,
    targetRotX: 0.18,
    currentRotY: 0.28,
    currentRotX: 0.18,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastInteraction: Date.now(),
  });

  // ── 1. Setup Three.js WebGL Scene ─────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Studio Lighting (Optimized for Silver Metallic Relief) ───────────────
    // Ambient fill keeps crevices dark silver rather than pitch black
    const ambientLight = new THREE.AmbientLight(0xf0f4f8, 1.1);
    scene.add(ambientLight);

    // Primary Directional Key Light (sharp grazing angle creates strong relief contrast)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3.5, 4.5, 4.0);
    scene.add(keyLight);

    // Secondary Cool Rim/Fill Light (enhances metallic edge curvature)
    const fillLight = new THREE.DirectionalLight(0xcfd8dc, 1.4);
    fillLight.position.set(-3.5, -2.0, 3.0);
    scene.add(fillLight);

    // Overhead Specular Light (glints off summit crests and ridges)
    const topLight = new THREE.DirectionalLight(0xffffff, 1.8);
    topLight.position.set(0, 5.0, 2.0);
    scene.add(topLight);

    // ── 3D Coin Medallion Assembly ──────────────────────────────────────────
    const coinGroup = new THREE.Group();
    coinGroupRef.current = coinGroup;

    // 1. Solid Sterling Silver Coin Cylinder Body (Thickness & Side walls)
    const bodyGeom = new THREE.CylinderGeometry(1.82, 1.82, 0.18, 96, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4d9e2),
      metalness: 0.92,
      roughness: 0.22,
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.rotation.x = Math.PI / 2;
    coinGroup.add(bodyMesh);

    // 2. Polished Outer Chamfer Rim (The thin realistic metallic edge ~2% radius)
    const rimGeom = new THREE.TorusGeometry(1.80, 0.032, 24, 96);
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf1f5f9),
      metalness: 0.96,
      roughness: 0.12,
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.position.z = 0.091;
    coinGroup.add(rimMesh);

    // 3. Front Face Circular Relief Disc (Where terrain heightmap is projected)
    // 1.78 radius gives exactly 97.8% surface coverage with only a razor-thin 1.80 rim
    const faceGeom = new THREE.CircleGeometry(1.78, 128);
    const initialFaceMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xdde2eb),
      metalness: 0.86,
      roughness: 0.28,
    });
    const faceMesh = new THREE.Mesh(faceGeom, initialFaceMat);
    faceMesh.position.z = 0.092; // sits right at the front surface
    coinGroup.add(faceMesh);
    faceMeshRef.current = faceMesh;

    // 4. Hanging Silver Bail Loop at Top
    const bailShape = new THREE.Shape();
    bailShape.moveTo(-0.16, 0);
    bailShape.lineTo(-0.16, 0.46);
    bailShape.quadraticCurveTo(-0.16, 0.62, 0, 0.62);
    bailShape.quadraticCurveTo(0.16, 0.62, 0.16, 0.46);
    bailShape.lineTo(0.16, 0);
    bailShape.closePath();

    const holePath = new THREE.Path();
    holePath.moveTo(-0.09, 0.08);
    holePath.lineTo(-0.09, 0.44);
    holePath.quadraticCurveTo(-0.09, 0.53, 0, 0.53);
    holePath.quadraticCurveTo(0.09, 0.53, 0.09, 0.44);
    holePath.lineTo(0.09, 0.08);
    holePath.closePath();
    bailShape.holes.push(holePath);

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    const bailGeom = new THREE.ExtrudeGeometry(bailShape, extrudeSettings);
    bailGeom.center();
    const bailMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xe2e8f0),
      metalness: 0.94,
      roughness: 0.18,
    });
    const bailMesh = new THREE.Mesh(bailGeom, bailMat);
    bailMesh.position.set(0, 1.98, 0);
    coinGroup.add(bailMesh);

    // 5. Center the entire medallion assembly (including bail and bottom rim) exactly at (0, 0, 0)
    const bbox = new THREE.Box3().setFromObject(coinGroup);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    coinGroup.children.forEach((child) => {
      child.position.y -= center.y;
    });

    scene.add(coinGroup);

    // 6. Responsive Camera Framing (guarantees full bail, face & bottom rim visible with comfortable padding)
    const updateCameraFraming = (cam: THREE.PerspectiveCamera, w: number, h: number, curSizeMm: number) => {
      const aspect = w / h;
      cam.aspect = aspect;

      const fovRad = THREE.MathUtils.degToRad(cam.fov / 2);

      // Scale factor corresponding to physical size selection (20mm baseline)
      const scaleFactor = 1.0 + ((curSizeMm - 20) / 20) * 0.16;

      // Complete vertical height including full bail and bottom rim is ~4.15 units
      const totalHeight = 4.15 * scaleFactor;
      const totalWidth = 3.66 * scaleFactor;
      // Diagonal bounding profile accounting for 360° turntable rotation tilt
      const maxDiag = Math.hypot(totalWidth, totalHeight) * 0.90;

      // 18% comfortable safety margin ensures visible space above the bail and below the bottom
      const padding = 1.18;

      const distV = (totalHeight * padding) / (2 * Math.tan(fovRad));
      const distH = (totalWidth * padding) / (2 * Math.tan(fovRad) * Math.max(aspect, 0.5));
      const distDiag = (maxDiag * padding) / (2 * Math.tan(fovRad) * Math.min(Math.max(aspect, 0.75), 1.0));

      const finalDistance = Math.max(distV, distH, distDiag);
      cam.position.set(0, 0, finalDistance);
      cam.lookAt(0, 0, 0);
      cam.updateProjectionMatrix();
    };

    updateCameraFraming(camera, width, height, sizeMm);

    // ── Animation / Turntable Render Loop ───────────────────────────────────
    let lastTime = performance.now();
    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = rotState.current;

      // Gentle natural idle breathing sway when user isn't interacting
      if (!state.isDragging && now - state.lastInteraction > 3000) {
        state.targetRotY += Math.sin(now * 0.001) * 0.0015;
      }

      // Smooth damping interpolation (Lerp)
      state.currentRotY += (state.targetRotY - state.currentRotY) * (state.isDragging ? 0.25 : 0.08);
      state.currentRotX += (state.targetRotX - state.currentRotX) * (state.isDragging ? 0.25 : 0.08);

      if (coinGroupRef.current) {
        coinGroupRef.current.rotation.y = state.currentRotY;
        coinGroupRef.current.rotation.x = state.currentRotX;
      }

      renderer.render(scene, camera);
    };

    render();

    // ── Resize Observer ─────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          updateCameraFraming(camera, w, h, sizeMm);
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bodyGeom.dispose();
      bodyMat.dispose();
      rimGeom.dispose();
      rimMat.dispose();
      faceGeom.dispose();
      bailGeom.dispose();
      bailMat.dispose();
    };
  }, []);

  // ── 2. Dynamically re-frame when sizeMm prop changes ──────────────────────
  useEffect(() => {
    if (!coinGroupRef.current || !cameraRef.current || !mountRef.current) return;
    const w = mountRef.current.clientWidth || 320;
    const h = mountRef.current.clientHeight || 380;
    const baseScale = 1.0 + ((sizeMm - 20) / 20) * 0.16;
    coinGroupRef.current.scale.set(baseScale, baseScale, baseScale);

    const aspect = w / h;
    const fovRad = THREE.MathUtils.degToRad(cameraRef.current.fov / 2);
    const totalHeight = 4.15 * baseScale;
    const totalWidth = 3.66 * baseScale;
    const maxDiag = Math.hypot(totalWidth, totalHeight) * 0.90;
    const padding = 1.18;
    const distV = (totalHeight * padding) / (2 * Math.tan(fovRad));
    const distH = (totalWidth * padding) / (2 * Math.tan(fovRad) * Math.max(aspect, 0.5));
    const distDiag = (maxDiag * padding) / (2 * Math.tan(fovRad) * Math.min(Math.max(aspect, 0.75), 1.0));
    cameraRef.current.position.set(0, 0, Math.max(distV, distH, distDiag));
    cameraRef.current.updateProjectionMatrix();
  }, [sizeMm]);

  // ── 3. Terrain Relief Heightmap & Normal Map Generation Pipeline ───────────
  useEffect(() => {
    let isCancelled = false;

    const generateTerrainRelief = async () => {
      if (!faceMeshRef.current) return;

      // 1. Calculate map tile coordinates
      const n = Math.pow(2, zoom);
      const exactX = ((lng + 180) / 360) * n;
      const latRad = (lat * Math.PI) / 180;
      const exactY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
      const centerTileX = Math.floor(exactX);
      const centerTileY = Math.floor(exactY);
      const subpixelX = (exactX - centerTileX) * 256;
      const subpixelY = (exactY - centerTileY) * 256;

      // 2. Stitch 3x3 tiles on offscreen high-res canvas (512x512)
      const offscreen = document.createElement('canvas');
      offscreen.width = 512;
      offscreen.height = 512;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const centerX = 256;
      const centerY = 256;

      // Build tile URLs
      const tilePromises: Promise<{ img: HTMLImageElement; drawX: number; drawY: number } | null>[] = [];

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tx = centerTileX + dx;
          const ty = centerTileY + dy;
          const drawX = centerX - subpixelX + dx * 256;
          const drawY = centerY - subpixelY + dy * 256;

          let tileUrl = '';
          switch (activeStyleId) {
            case 'satellite':
              tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
              break;
            case 'roadmap':
              tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${ty}/${tx}`;
              break;
            case 'topographic':
              tileUrl = `https://a.tile.opentopomap.org/${zoom}/${tx}/${ty}.png`;
              break;
            case 'dark-surface':
            case 'silver-hillshade':
              tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${zoom}/${ty}/${tx}`;
              break;
            case 'light-surface':
              tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${zoom}/${ty}/${tx}`;
              break;
            case 'terrain':
            default:
              tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${zoom}/${ty}/${tx}`;
              break;
          }

          tilePromises.push(
            new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve({ img, drawX, drawY });
              img.onerror = () => resolve(null);
              img.src = tileUrl;
            })
          );
        }
      }

      const loadedTiles = await Promise.all(tilePromises);
      if (isCancelled) return;

      // Draw all tiles to offscreen canvas
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 512, 512);
      for (const t of loadedTiles) {
        if (t) {
          ctx.drawImage(t.img, t.drawX, t.drawY, 256, 256);
        }
      }

      // 3. Process raw map image into Heightfield & Chiseled Normal Map
      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      const W = 512;
      const H = 512;
      const heightfield = new Float32Array(W * H);

      // Step A: Luminance conversion with layer-specific contrast curve
      let minLum = 1.0;
      let maxLum = 0.0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Satellite: Enhance feature contrast (water vs land & mountain texture)
        if (activeStyleId === 'satellite') {
          const isWater = b > r && g > r && r < 0.25;
          if (isWater) lum = 0.18;
          else lum = Math.min(1.0, lum * 1.35);
        }

        // Roadmap: Roads and borders become engraved channels / ridges
        if (activeStyleId === 'roadmap') {
          const isYellowOrangeRoad = r > 0.7 && g > 0.4 && b < 0.3;
          if (isYellowOrangeRoad) lum = 0.95;
        }

        heightfield[i / 4] = lum;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
      }

      // Step B: Normalize & High-Pass contrast curve
      const lumRange = Math.max(maxLum - minLum, 0.05);
      for (let i = 0; i < heightfield.length; i++) {
        let v = (heightfield[i] - minLum) / lumRange;
        // Non-linear S-curve for punchy chiseled terrain relief
        v = v * v * (3 - 2 * v);
        heightfield[i] = v;
      }

      // Step C: Circular feathering mask to seamlessly merge with the outer silver rim
      const halfW = W / 2;
      const halfH = H / 2;
      const maxR = halfW * 0.97;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          const dist = Math.hypot(x - halfW, y - halfH);
          if (dist > maxR) {
            const fade = Math.max(0, 1 - (dist - maxR) / (halfW * 0.03));
            heightfield[idx] = heightfield[idx] * fade + 0.5 * (1 - fade);
          }
        }
      }

      // Step D: Generate Normal Map Canvas using Sobel Gradient Operator
      const normalCanvas = document.createElement('canvas');
      normalCanvas.width = W;
      normalCanvas.height = H;
      const normCtx = normalCanvas.getContext('2d')!;
      const normImgData = normCtx.createImageData(W, H);
      const normData = normImgData.data;

      // Relief strength factor (creates the deep chiseled 3D shadows seen in reference)
      const normalStrength = 4.2;

      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;

          // Sobel operator
          const tl = heightfield[(y - 1) * W + (x - 1)];
          const t = heightfield[(y - 1) * W + x];
          const tr = heightfield[(y - 1) * W + (x + 1)];
          const l = heightfield[y * W + (x - 1)];
          const r = heightfield[y * W + (x + 1)];
          const bl = heightfield[(y + 1) * W + (x - 1)];
          const b = heightfield[(y + 1) * W + x];
          const br = heightfield[(y + 1) * W + (x + 1)];

          const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
          const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

          // Vector normal calculation
          const nx = -dX * normalStrength;
          const ny = -dY * normalStrength;
          const nz = 1.0;
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

          const pixelIdx = idx * 4;
          normData[pixelIdx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
          normData[pixelIdx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
          normData[pixelIdx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
          normData[pixelIdx + 3] = 255;
        }
      }
      normCtx.putImageData(normImgData, 0, 0);

      // Step E: Generate Cavity & Roughness Map Canvas (Chiseled highlights & dark valley shadows)
      const cavityCanvas = document.createElement('canvas');
      cavityCanvas.width = W;
      cavityCanvas.height = H;
      const cavCtx = cavityCanvas.getContext('2d')!;
      const cavImgData = cavCtx.createImageData(W, H);
      const cavData = cavImgData.data;

      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          const c = heightfield[idx];
          const t = heightfield[(y - 1) * W + x];
          const b = heightfield[(y + 1) * W + x];
          const l = heightfield[y * W + (x - 1)];
          const r = heightfield[y * W + (x + 1)];

          // Laplacian edge curvature detection
          const laplacian = (c * 4 - t - b - l - r);
          // Dark silver crevice shading with brilliant ridge highlights
          const cavity = Math.min(1.0, Math.max(0.0, 0.5 + laplacian * 3.5 + (c - 0.5) * 0.45));

          const pIdx = idx * 4;
          const val = Math.round(cavity * 255);
          cavData[pIdx] = val;
          cavData[pIdx + 1] = val;
          cavData[pIdx + 2] = val;
          cavData[pIdx + 3] = 255;
        }
      }
      cavCtx.putImageData(cavImgData, 0, 0);

      // Step F: Height Canvas for Bump Mapping
      const heightCanvas = document.createElement('canvas');
      heightCanvas.width = W;
      heightCanvas.height = H;
      const hCtx = heightCanvas.getContext('2d')!;
      const hImgData = hCtx.createImageData(W, H);
      const hData = hImgData.data;

      for (let i = 0; i < heightfield.length; i++) {
        const val = Math.round(heightfield[i] * 255);
        const pIdx = i * 4;
        hData[pIdx] = val;
        hData[pIdx + 1] = val;
        hData[pIdx + 2] = val;
        hData[pIdx + 3] = 255;
      }
      hCtx.putImageData(hImgData, 0, 0);

      if (isCancelled) return;

      // 4. Create Three.js Canvas Textures
      const normalTex = new THREE.CanvasTexture(normalCanvas);
      normalTex.colorSpace = THREE.LinearSRGBColorSpace;
      normalTex.needsUpdate = true;

      const bumpTex = new THREE.CanvasTexture(heightCanvas);
      bumpTex.colorSpace = THREE.LinearSRGBColorSpace;
      bumpTex.needsUpdate = true;

      const cavityTex = new THREE.CanvasTexture(cavityCanvas);
      cavityTex.colorSpace = THREE.SRGBColorSpace;
      cavityTex.needsUpdate = true;

      // 5. Apply to Sterling Silver Physical Material
      const faceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xdce1e8), // Solid sterling silver base
        map: cavityTex,                   // Chiseled relief shading (dark crevices, gleaming peaks)
        metalness: 0.82,
        roughness: 0.28,
        bumpMap: bumpTex,
        bumpScale: 0.09,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(2.8, 2.8),
        roughnessMap: cavityTex,
      });

      if (faceMeshRef.current) {
        const oldMat = faceMeshRef.current.material;
        faceMeshRef.current.material = faceMat;
        if (Array.isArray(oldMat)) oldMat.forEach((m) => m.dispose());
        else if (oldMat) oldMat.dispose();
      }
    };

    generateTerrainRelief();

    return () => {
      isCancelled = true;
    };
  }, [lat, lng, zoom, activeStyleId]);

  // ── 3. Pointer Drag Interactivity for 360° Turntable Rotation ─────────────
  const handlePointerDown = (clientX: number, clientY: number) => {
    rotState.current.isDragging = true;
    rotState.current.startX = clientX;
    rotState.current.startY = clientY;
    rotState.current.lastInteraction = Date.now();
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!rotState.current.isDragging) return;
    const deltaX = clientX - rotState.current.startX;
    const deltaY = clientY - rotState.current.startY;

    rotState.current.targetRotY += deltaX * 0.012;
    rotState.current.targetRotX = Math.max(
      -0.65,
      Math.min(0.65, rotState.current.targetRotX + deltaY * 0.01)
    );

    rotState.current.startX = clientX;
    rotState.current.startY = clientY;
    rotState.current.lastInteraction = Date.now();
  };

  const handlePointerUp = () => {
    rotState.current.isDragging = false;
    rotState.current.lastInteraction = Date.now();
  };

  return (
    <div
      className="three-pendant-viewport"
      ref={mountRef}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => {
        const t = e.touches[0];
        handlePointerDown(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        handlePointerMove(t.clientX, t.clientY);
      }}
      onTouchEnd={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '380px',
        position: 'relative',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Optional Inscribed Monogram Badge */}
      {engravingText && (
        <div className="pendant-engraving-badge" style={{ zIndex: 10 }}>
          <span>&ldquo;{engravingText}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
