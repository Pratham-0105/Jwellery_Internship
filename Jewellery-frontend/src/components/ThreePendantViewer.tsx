'use client';
// src/components/ThreePendantViewer.tsx
// High-Fidelity 3D Sterling Silver CIRCULAR Terrain Pendant — precisely matched to reference.
// Circular disc body | Flat teardrop bail (narrow from front, full loop from side) | 100% terrain face

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Module-level constants shared across effects ─────────────────────────────
const COIN_RADIUS   = 1.80;            // circular pendant radius
const COIN_THICKNESS = 0.26;           // physical side depth (visible when rotated)
const HALF_DEPTH    = COIN_THICKNESS / 2;  // 0.13
const FACE_SIZE     = COIN_RADIUS * 2; // 3.60 — square plane matching the circle

interface ThreePendantViewerProps {
  lat: number;
  lng: number;
  zoom: number;
  activeStyleId: string;
  locationName: string;
  sizeMm?: number;
  engravingText?: string;
}

// ── Studio Environment ───────────────────────────────────────────────────────
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#1e2532'); bg.addColorStop(0.42, '#36404e');
  bg.addColorStop(0.6, '#4c5668');  bg.addColorStop(1, '#12151a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 512);

  // Key softbox — bright white glint on silver mountain crests
  const k = ctx.createRadialGradient(475, 108, 8, 475, 108, 272);
  k.addColorStop(0, '#ffffff'); k.addColorStop(0.22, '#f8fcff');
  k.addColorStop(0.62, 'rgba(255,255,255,0.40)'); k.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = k; ctx.fillRect(206, 0, 536, 350);

  // Left fill
  const lf = ctx.createRadialGradient(115, 215, 6, 115, 215, 178);
  lf.addColorStop(0, '#ffffff'); lf.addColorStop(0.42, 'rgba(236,246,255,0.46)');
  lf.addColorStop(1, 'rgba(236,246,255,0)');
  ctx.fillStyle = lf; ctx.fillRect(0, 55, 285, 275);

  // Right rim
  const rf = ctx.createRadialGradient(878, 268, 6, 878, 268, 208);
  rf.addColorStop(0, '#e6f2ff'); rf.addColorStop(0.42, 'rgba(230,242,255,0.50)');
  rf.addColorStop(1, 'rgba(230,242,255,0)');
  ctx.fillStyle = rf; ctx.fillRect(688, 68, 336, 364);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}

// ── Back Engraving Texture ───────────────────────────────────────────────────
function createBackTex(text?: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d8dde8'; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  for (let r = 18; r < 245; r += 7) {
    ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#667080'; ctx.font = '600 12px system-ui,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('TERRAIN JEWELLERY  ·  925 SILVER', 256, 218);
  if (text && text.trim()) {
    ctx.fillStyle = '#38424e'; ctx.font = '700 18px system-ui,sans-serif';
    ctx.fillText(`"${text.trim()}"`, 256, 262);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// ── Circular Alpha Mask ──────────────────────────────────────────────────────
function createCircleMask(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(256, 256, 253, 0, Math.PI * 2); ctx.fill();
  return new THREE.CanvasTexture(c);
}

// ── Flat Teardrop Bail Geometry ──────────────────────────────────────────────
// Creates a FLAT RING in teardrop shape (open at bottom).
// Shape is drawn in the XY plane and extruded in Z (thin), then rotated 90° around Y so:
//   • Viewed from FRONT (+Z): shows thin edge strip  ← narrow bail from front
//   • Viewed from SIDE  (+X): shows full teardrop outline ← full loop from side
function createFlatTearDropBail(): THREE.BufferGeometry {
  const bW  = 0.24;   // half-width of teardrop
  const bH  = 0.80;   // total height of teardrop
  const bTH = 0.072;  // ring wall thickness
  const bED = 0.060;  // extrusion depth (thin flat sheet)

  // ── Outer teardrop silhouette (open at bottom) ──
  const outer = new THREE.Shape();
  outer.moveTo(-bW, 0);                                // bottom-left opening
  outer.lineTo(-bW, bH * 0.38);                       // left side straight
  outer.bezierCurveTo(-bW, bH * 0.72, -bW * 0.55, bH, 0, bH);   // left arch → top
  outer.bezierCurveTo(bW * 0.55, bH, bW, bH * 0.72, bW, bH * 0.38); // top → right arch
  outer.lineTo(bW, 0);                                 // right side to opening

  // ── Inner hole (creates the ring/frame wall) ──
  const iW = bW - bTH;
  const iH = bH - bTH * 1.15;
  const hole = new THREE.Path();
  hole.moveTo(-iW, bTH);                               // inner bottom-left
  hole.lineTo(-iW, bH * 0.38);                        // inner left straight
  hole.bezierCurveTo(-iW, bH * 0.72 - bTH * 0.4, -iW * 0.55, iH, 0, iH); // inner left arch
  hole.bezierCurveTo(iW * 0.55, iH, iW, bH * 0.72 - bTH * 0.4, iW, bH * 0.38); // inner right arch
  hole.lineTo(iW, bTH);                                // inner right to bottom
  hole.lineTo(-iW, bTH);                              // close hole
  outer.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(outer, {
    depth: bED,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 52,
  });
  geom.center(); // center in Z (extrusion direction)
  return geom;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ThreePendantViewer({
  lat, lng, zoom, activeStyleId, locationName, sizeMm = 20, engravingText,
}: ThreePendantViewerProps) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const groupRef    = useRef<THREE.Group | null>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);
  const faceGeomRef = useRef<THREE.PlaneGeometry | null>(null);
  const backMeshRef = useRef<THREE.Mesh | null>(null);
  const maskTexRef  = useRef<THREE.CanvasTexture | null>(null);
  const animIdRef   = useRef<number>(0);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);

  const rot = useRef({
    targetRotY: -0.18, targetRotX: 0.14,
    currentRotY: -0.18, currentRotX: 0.14,
    isDragging: false, startX: 0, startY: 0,
    lastInteraction: Date.now(),
  });

  // ── Scene Setup (runs once) ──────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W = el.clientWidth || 340, H = el.clientHeight || 380;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.environment = createStudioEnvironment(renderer);

    // ── Studio Lighting —— crafted for polished sterling silver terrain ──
    scene.add(new THREE.AmbientLight(0xf2f6fc, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(3.8, 5.0, 4.8); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd2e0f0, 1.6);
    fill.position.set(-4.5, -2.5, 3.0); scene.add(fill);
    const top = new THREE.DirectionalLight(0xffffff, 2.0);
    top.position.set(0, 6.5, 2.5); scene.add(top);
    const back = new THREE.DirectionalLight(0xc6d4e4, 0.9);
    back.position.set(0, -3.5, -4.0); scene.add(back);

    // ── Pendant Group ────────────────────────────────────────────────────
    const group = new THREE.Group();
    groupRef.current = group;

    // Shared silver material factory
    const mkSilver = (rough: number) => new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xe2eaf6), metalness: 0.97, roughness: rough,
    });

    // 1. ── Perfectly circular coin body (128 segments = smooth) ──────────
    const bodyGeom = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 128, 1);
    const bodyMat  = mkSilver(0.18);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.rotation.x = Math.PI / 2; // disc faces +Z (camera direction)
    group.add(bodyMesh);

    // 2. ── Raised polished bezel rim (torus around front face edge) ──────
    const rimGeom = new THREE.TorusGeometry(COIN_RADIUS - 0.02, 0.052, 22, 128);
    const rimMat  = mkSilver(0.11);
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.position.z = HALF_DEPTH + 0.015;
    group.add(rimMesh);

    // 3. ── Back face ──────────────────────────────────────────────────────
    const backGeom = new THREE.CircleGeometry(COIN_RADIUS - 0.018, 128);
    const backMat  = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4dae6), metalness: 0.92, roughness: 0.25,
      map: createBackTex(engravingText),
    });
    const backMesh = new THREE.Mesh(backGeom, backMat);
    backMesh.position.z = -HALF_DEPTH - 0.016;
    backMesh.rotation.y  = Math.PI;
    group.add(backMesh);
    backMeshRef.current = backMesh;

    // 4. ── Front face terrain plane ───────────────────────────────────────
    const faceGeom = new THREE.PlaneGeometry(FACE_SIZE, FACE_SIZE, 200, 200);
    faceGeomRef.current = faceGeom;

    const maskTex = createCircleMask();
    maskTexRef.current = maskTex;

    const initFaceMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf0f6fc), metalness: 0.97, roughness: 0.15,
      alphaMap: maskTex, alphaTest: 0.5,
    });
    const faceMesh = new THREE.Mesh(faceGeom, initFaceMat);
    faceMesh.position.z = HALF_DEPTH + 0.005;
    group.add(faceMesh);
    faceMeshRef.current = faceMesh;

    // 5. ── Flat Teardrop Bail ─────────────────────────────────────────────
    // The bail is a flat open-ring in a teardrop shape.
    // Oriented so the flat face is perpendicular to pendant face:
    //   → From front: looks like a narrow vertical strip
    //   → From side:  shows the full teardrop/oval silhouette
    const bailGeom = createFlatTearDropBail();
    const bailMat  = mkSilver(0.12);
    const bailMesh = new THREE.Mesh(bailGeom, bailMat);

    // Rotate so shape (drawn in XY plane) lies in YZ plane after rotation
    bailMesh.rotation.y = Math.PI / 2;

    // Position at top of coin. The teardrop shape has height 0.80 centered in Z after .center().
    // We created it open at y=0 to y=0.80, so center is at y=0.40.
    // After rotation, the shape's Y remains Y. Position it so the bottom touches the coin top rim.
    const bailShapeHeight = 0.80;
    bailMesh.position.set(0, COIN_RADIUS + bailShapeHeight * 0.5 - 0.06, 0);
    group.add(bailMesh);

    // ── Center entire group vertically ──────────────────────────────────
    const box = new THREE.Box3().setFromObject(group);
    const ctr = new THREE.Vector3();
    box.getCenter(ctr);
    group.children.forEach(ch => { ch.position.y -= ctr.y; });
    scene.add(group);

    // ── Camera framing ──────────────────────────────────────────────────
    const frame = (cam: THREE.PerspectiveCamera, w: number, h: number, mm: number) => {
      cam.aspect = w / h;
      const fovR = THREE.MathUtils.degToRad(cam.fov / 2);
      const s = 1.0 + ((mm - 20) / 20) * 0.14;
      // Total height: coin diam (3.60) + bail height (0.80) = ~4.40, width = 3.60
      const tH = 4.42 * s, tW = 3.62 * s;
      const diag = Math.hypot(tW, tH) * 0.88;
      const pad  = 1.14;
      const dV   = (tH * pad) / (2 * Math.tan(fovR));
      const dH   = (tW * pad) / (2 * Math.tan(fovR) * Math.max(cam.aspect, 0.45));
      const dD   = (diag * pad) / (2 * Math.tan(fovR) * Math.min(Math.max(cam.aspect, 0.7), 1.0));
      cam.position.set(0, 0, Math.max(dV, dH, dD));
      cam.lookAt(0, 0, 0);
      cam.updateProjectionMatrix();
    };
    frame(camera, W, H, sizeMm);

    // ── Render loop ──────────────────────────────────────────────────────
    const tick = () => {
      animIdRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const r = rot.current;
      if (!r.isDragging && now - r.lastInteraction > 3500) {
        r.targetRotY += Math.sin(now * 0.00072) * 0.00095;
      }
      r.currentRotY += (r.targetRotY - r.currentRotY) * (r.isDragging ? 0.22 : 0.07);
      r.currentRotX += (r.targetRotX - r.currentRotX) * (r.isDragging ? 0.22 : 0.07);
      if (groupRef.current) {
        groupRef.current.rotation.y = r.currentRotY;
        groupRef.current.rotation.x = r.currentRotX;
      }
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width: w, height: h } = e.contentRect;
        if (w > 0 && h > 0) { frame(camera, w, h, sizeMm); renderer.setSize(w, h); }
      }
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      ro.disconnect();
      renderer.domElement.parentNode?.removeChild(renderer.domElement);
      renderer.dispose();
      [bodyGeom, rimGeom, backGeom, faceGeom, bailGeom].forEach(g => g.dispose());
      [bodyMat, rimMat, backMat, initFaceMat, bailMat].forEach(m => m.dispose());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Resize camera when sizeMm changes ───────────────────────────────────
  useEffect(() => {
    if (!groupRef.current || !cameraRef.current || !mountRef.current) return;
    const w = mountRef.current.clientWidth || 340;
    const h = mountRef.current.clientHeight || 380;
    const s = 1.0 + ((sizeMm - 20) / 20) * 0.14;
    groupRef.current.scale.set(s, s, s);
    const fovR = THREE.MathUtils.degToRad(cameraRef.current.fov / 2);
    const asp  = w / h;
    const tH = 4.42 * s, tW = 3.62 * s;
    const diag = Math.hypot(tW, tH) * 0.88;
    const pad  = 1.14;
    const dV  = (tH * pad) / (2 * Math.tan(fovR));
    const dH  = (tW * pad) / (2 * Math.tan(fovR) * Math.max(asp, 0.45));
    const dD  = (diag * pad) / (2 * Math.tan(fovR) * Math.min(Math.max(asp, 0.7), 1.0));
    cameraRef.current.position.set(0, 0, Math.max(dV, dH, dD));
    cameraRef.current.updateProjectionMatrix();
  }, [sizeMm]);

  // ── Engraving update ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!backMeshRef.current) return;
    const mat = backMeshRef.current.material as THREE.MeshStandardMaterial;
    if (!mat) return;
    if (mat.map) mat.map.dispose();
    mat.map = createBackTex(engravingText);
    mat.needsUpdate = true;
  }, [engravingText]);

  // ── Terrain Relief Pipeline ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!faceMeshRef.current || !faceGeomRef.current) return;

      const n  = Math.pow(2, zoom);
      const eX = ((lng + 180) / 360) * n;
      const latR = (lat * Math.PI) / 180;
      const eY = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
      const cTX = Math.floor(eX), cTY = Math.floor(eY);
      const spX = (eX - cTX) * 256, spY = (eY - cTY) * 256;

      const layerC = document.createElement('canvas'); layerC.width = layerC.height = 512;
      const lCtx = layerC.getContext('2d', { willReadFrequently: true })!;
      const demC  = document.createElement('canvas'); demC.width  = demC.height  = 512;
      const dCtx  = demC.getContext('2d', { willReadFrequently: true })!;

      const fetchTile = (url: string, dx: number, dy: number) =>
        new Promise<{ img: HTMLImageElement; dx: number; dy: number } | null>(res => {
          const img = new Image(); img.crossOrigin = 'anonymous';
          img.onload = () => res({ img, dx, dy });
          img.onerror = () => res(null);
          img.src = url;
        });

      const lP: ReturnType<typeof fetchTile>[] = [];
      const dP: ReturnType<typeof fetchTile>[] = [];
      for (let ddx = -1; ddx <= 1; ddx++) {
        for (let ddy = -1; ddy <= 1; ddy++) {
          const tx = cTX + ddx, ty = cTY + ddy;
          const drawX = 256 - spX + ddx * 256, drawY = 256 - spY + ddy * 256;
          let url = '';
          switch (activeStyleId) {
            case 'satellite':
              url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`; break;
            case 'roadmap':
              url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${ty}/${tx}`; break;
            case 'topographic':
              url = `https://a.tile.opentopomap.org/${zoom}/${tx}/${ty}.png`; break;
            case 'dark-surface': case 'silver-hillshade':
              url = `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${zoom}/${ty}/${tx}`; break;
            case 'light-surface':
              url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${zoom}/${ty}/${tx}`; break;
            default:
              url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${zoom}/${ty}/${tx}`; break;
          }
          lP.push(fetchTile(url, drawX, drawY));
          dP.push(fetchTile(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${tx}/${ty}.png`, drawX, drawY));
        }
      }

      const [layerTiles, demTiles] = await Promise.all([Promise.all(lP), Promise.all(dP)]);
      if (cancelled) return;

      lCtx.fillStyle = '#888'; lCtx.fillRect(0, 0, 512, 512);
      for (const t of layerTiles) { if (t) lCtx.drawImage(t.img, t.dx, t.dy, 256, 256); }

      dCtx.fillStyle = '#000'; dCtx.fillRect(0, 0, 512, 512);
      let demCnt = 0;
      for (const t of demTiles) { if (t) { dCtx.drawImage(t.img, t.dx, t.dy, 256, 256); demCnt++; } }
      const hasDem = demCnt >= 4;

      const W = 512, H = 512;
      const lData = lCtx.getImageData(0, 0, W, H).data;
      let dData: Uint8ClampedArray | null = null;
      if (hasDem) { try { dData = dCtx.getImageData(0, 0, W, H).data; } catch { dData = null; } }

      const hf  = new Float32Array(W * H);
      const rawE = new Float32Array(W * H);
      const rawL = new Float32Array(W * H);
      let minV = 1e9, maxV = -1e9;

      for (let i = 0; i < W * H; i++) {
        const p = i * 4;
        const r = lData[p]/255, g = lData[p+1]/255, b = lData[p+2]/255;
        let lum = 0.299*r + 0.587*g + 0.114*b;
        if (activeStyleId === 'satellite') lum = Math.min(1, lum * 1.35);
        rawL[i] = lum;
        if (dData) {
          const e = (dData[p]*256 + dData[p+1] + dData[p+2]/256) - 32768;
          rawE[i] = e; if (e < minV) minV = e; if (e > maxV) maxV = e;
        } else {
          rawE[i] = lum; if (lum < minV) minV = lum; if (lum > maxV) maxV = lum;
        }
      }

      const range = Math.max(maxV - minV, 1.0);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y*W+x;
          const nm = Math.min(1, Math.max(0, (rawE[i] - minV) / range));
          const c  = rawL[i];
          const t  = y>0      ? rawL[(y-1)*W+x] : c;
          const b2 = y<H-1    ? rawL[(y+1)*W+x] : c;
          const l2 = x>0      ? rawL[y*W+(x-1)] : c;
          const r2 = x<W-1    ? rawL[y*W+(x+1)] : c;
          const hp = c - (t+b2+l2+r2)*0.25;
          let v = hasDem
            ? nm*0.65 + (0.5 + hp*4.5)*0.35
            : nm*0.68 + (0.5 + hp*4.0)*0.32;
          v = Math.min(1, Math.max(0, v));
          hf[i] = v * v * (3 - 2*v); // smooth step
        }
      }

      // Normal map (Sobel filter)
      const nC = document.createElement('canvas'); nC.width = nC.height = 512;
      const nCtx = nC.getContext('2d')!;
      const nImg = nCtx.createImageData(512, 512);
      const nD = nImg.data;
      const NS = 6.0;
      for (let y = 1; y < H-1; y++) {
        for (let x = 1; x < W-1; x++) {
          const i = y*W+x;
          const tl=hf[(y-1)*W+(x-1)], t2=hf[(y-1)*W+x], tr=hf[(y-1)*W+(x+1)];
          const l2=hf[y*W+(x-1)],                          r2=hf[y*W+(x+1)];
          const bl=hf[(y+1)*W+(x-1)], b2=hf[(y+1)*W+x],  br=hf[(y+1)*W+(x+1)];
          const dX = (tr+2*r2+br)-(tl+2*l2+bl);
          const dY = (bl+2*b2+br)-(tl+2*t2+tr);
          const nx=-dX*NS, ny=-dY*NS, nz=1.0;
          const len=Math.sqrt(nx*nx+ny*ny+nz*nz);
          const p2=i*4;
          nD[p2]  =Math.round(((nx/len)*0.5+0.5)*255);
          nD[p2+1]=Math.round(((ny/len)*0.5+0.5)*255);
          nD[p2+2]=Math.round(((nz/len)*0.5+0.5)*255);
          nD[p2+3]=255;
        }
      }
      nCtx.putImageData(nImg, 0, 0);

      // Patina (silver color graded by height) + roughness map
      const pC = document.createElement('canvas'); pC.width = pC.height = 512;
      const pCtx = pC.getContext('2d')!;
      const pImg = pCtx.createImageData(512,512); const pD = pImg.data;
      const rC = document.createElement('canvas'); rC.width = rC.height = 512;
      const rCtx = rC.getContext('2d')!;
      const rImg = rCtx.createImageData(512,512); const roD = rImg.data;

      for (let y = 1; y < H-1; y++) {
        for (let x = 1; x < W-1; x++) {
          const i = y*W+x;
          const c = hf[i];
          const t2=hf[(y-1)*W+x], b2=hf[(y+1)*W+x];
          const l2=hf[y*W+(x-1)], r2=hf[y*W+(x+1)];
          const lap = c*4 - t2 - b2 - l2 - r2;
          const sc = Math.min(1, Math.max(0, c*0.62 + (0.5+lap*4.2)*0.38));
          const p2 = i*4;
          let rv: number, gv: number, bv: number, ro: number;

          if (sc < 0.32) {
            // Deep valleys — oxidised graphite silver
            const tt=sc/0.32;
            rv=Math.round(102+tt*80); gv=Math.round(108+tt*82); bv=Math.round(118+tt*80); ro=Math.round(100-tt*30);
          } else if (sc < 0.68) {
            // Mid slopes — solid sterling silver
            const tt=(sc-0.32)/0.36;
            rv=Math.round(182+tt*58); gv=Math.round(190+tt*54); bv=Math.round(198+tt*50); ro=Math.round(70-tt*40);
          } else {
            // Summit ridges — mirror polished silver
            const tt=(sc-0.68)/0.32;
            rv=Math.round(240+tt*15); gv=Math.round(244+tt*11); bv=Math.round(248+tt*7); ro=Math.round(30-tt*14);
          }
          pD[p2]=rv; pD[p2+1]=gv; pD[p2+2]=bv; pD[p2+3]=255;
          roD[p2]=ro; roD[p2+1]=ro; roD[p2+2]=ro; roD[p2+3]=255;
        }
      }
      pCtx.putImageData(pImg, 0, 0);
      rCtx.putImageData(rImg, 0, 0);

      // Bump (greyscale heightfield)
      const bC = document.createElement('canvas'); bC.width = bC.height = 512;
      const bCtx = bC.getContext('2d')!;
      const bImg = bCtx.createImageData(512,512); const bD = bImg.data;
      for (let i = 0; i < hf.length; i++) {
        const v=Math.round(hf[i]*255); const p2=i*4;
        bD[p2]=v; bD[p2+1]=v; bD[p2+2]=v; bD[p2+3]=255;
      }
      bCtx.putImageData(bImg, 0, 0);

      if (cancelled) return;

      const mkTex = (cv: HTMLCanvasElement, srgb: boolean) => {
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        t.needsUpdate = true; return t;
      };
      const nTex = mkTex(nC, false);
      const bTex = mkTex(bC, false);
      const pTex = mkTex(pC, true);
      const rTex = mkTex(rC, false);

      // Vertex displacement — full circle coverage with edge taper
      if (faceGeomRef.current) {
        const geom = faceGeomRef.current;
        const pos  = geom.attributes.position;
        const uvs  = geom.attributes.uv;
        const baseDisp  = 0.60;
        const scale     = (sizeMm || 20) / 20;
        const maxDisp   = baseDisp * Math.pow(scale, 1.1);
        const edgeStart = 0.91; // taper begins at 91% of COIN_RADIUS

        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i), vy = pos.getY(i);
          const dist = Math.hypot(vx, vy);

          if (dist <= COIN_RADIUS) {
            // Smooth taper at edge so peaks don't exceed the bezel rim
            let ef = 1.0;
            if (dist > COIN_RADIUS * edgeStart) {
              const tt = (dist - COIN_RADIUS * edgeStart) / (COIN_RADIUS * (1 - edgeStart));
              ef = 0.5 + 0.5 * Math.cos(tt * Math.PI);
            }
            const u  = uvs.getX(i);
            const v  = 1.0 - uvs.getY(i);
            const px = Math.min(511, Math.max(0, Math.floor(u * 512)));
            const py = Math.min(511, Math.max(0, Math.floor(v * 512)));
            const hv = hf[py * 512 + px] || 0;
            pos.setZ(i, hv * maxDisp * ef);
          } else {
            pos.setZ(i, 0);
          }
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      }

      // Apply final terrain material
      const faceMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        map: pTex, roughnessMap: rTex,
        metalness: 0.97, roughness: 0.14,
        bumpMap: bTex,
        bumpScale: 0.095 * ((sizeMm || 20) / 20),
        normalMap: nTex,
        normalScale: new THREE.Vector2(4.0, 4.0),
        alphaMap: maskTexRef.current || undefined,
        alphaTest: 0.5,
      });

      if (faceMeshRef.current) {
        const old = faceMeshRef.current.material;
        faceMeshRef.current.material = faceMat;
        if (Array.isArray(old)) old.forEach(m => m.dispose());
        else if (old) (old as THREE.Material).dispose();
      }
    };

    run().catch(console.error);
    return () => { cancelled = true; };
  }, [lat, lng, zoom, activeStyleId, sizeMm]);

  // ── Pointer / Touch Rotation ─────────────────────────────────────────────
  const onDown = (x: number, y: number) => {
    const r = rot.current;
    r.isDragging = true; r.startX = x; r.startY = y; r.lastInteraction = Date.now();
  };
  const onMove = (x: number, y: number) => {
    const r = rot.current;
    if (!r.isDragging) return;
    r.targetRotY += (x - r.startX) * 0.012;
    r.targetRotX  = Math.max(-0.55, Math.min(0.55, r.targetRotX + (y - r.startY) * 0.010));
    r.startX = x; r.startY = y; r.lastInteraction = Date.now();
  };
  const onUp = () => { rot.current.isDragging = false; rot.current.lastInteraction = Date.now(); };

  return (
    <div
      className="three-pendant-viewport"
      ref={mountRef}
      onMouseDown={e => onDown(e.clientX, e.clientY)}
      onMouseMove={e => onMove(e.clientX, e.clientY)}
      onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={e => { const t = e.touches[0]; onDown(t.clientX, t.clientY); }}
      onTouchMove={e =>  { const t = e.touches[0]; onMove(t.clientX, t.clientY); }}
      onTouchEnd={onUp}
      style={{
        width: '100%', height: '100%', minHeight: '380px', position: 'relative',
        cursor: 'grab', userSelect: 'none', touchAction: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {engravingText && (
        <div className="pendant-engraving-badge" style={{ zIndex: 10 }}>
          <span>&ldquo;{engravingText}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
