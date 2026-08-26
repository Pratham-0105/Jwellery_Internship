'use client';
// src/components/PendantHero.tsx
// Premium Shining Animated Pendant Logo with smooth physical scroll parallax & pendulum sway

import React, { useEffect, useRef, useState } from 'react';

export default function PendantHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pendantRef = useRef<HTMLDivElement>(null);
  const chainRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Physics animation state using refs for 60/120fps performance without React re-renders
  const animState = useRef({
    targetY: 0,
    currentY: 0,
    targetRotate: 7, // natural resting angle
    currentRotate: 7,
    targetSwayX: 0,
    currentSwayX: 0,
    lastScrollY: 0,
    velocity: 0,
    mouseX: 0,
    mouseY: 0,
    targetTiltX: 0,
    targetTiltY: 0,
    currentTiltX: 0,
    currentTiltY: 0,
  });

  useEffect(() => {
    setIsClient(true);
    let animationFrameId: number;
    let lastTime = performance.now();

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const state = animState.current;

      // Calculate scroll velocity
      const deltaScroll = scrollY - state.lastScrollY;
      state.velocity = Math.max(Math.min(deltaScroll, 50), -50);
      state.lastScrollY = scrollY;

      // Parallax travel distance (controlled, elegant range)
      // As user scrolls down, pendant floats down smoothly with slight lag
      state.targetY = scrollY * 0.28;

      // Dynamic pendulum sway induced by scroll velocity
      // Scrolling down pushes the pendant slightly to one side; scrolling up sways back
      const dynamicSway = Math.max(Math.min(state.velocity * 0.35, 12), -12);
      state.targetRotate = 7 + dynamicSway;
      state.targetSwayX = dynamicSway * 1.8;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isNear =
        e.clientX >= rect.left - 150 &&
        e.clientX <= rect.right + 150 &&
        e.clientY >= rect.top - 150 &&
        e.clientY <= rect.bottom + 150;

      if (isNear) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const normX = (e.clientX - centerX) / (rect.width / 2);
        const normY = (e.clientY - centerY) / (rect.height / 2);

        animState.current.targetTiltX = -normY * 8; // subtle 3D tilt
        animState.current.targetTiltY = normX * 10;
      } else {
        animState.current.targetTiltX = 0;
        animState.current.targetTiltY = 0;
      }
    };

    const renderLoop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const state = animState.current;

      // Decay velocity gradually toward 0 for natural momentum recovery
      state.velocity *= 0.92;
      if (Math.abs(state.velocity) < 0.05) {
        state.targetRotate = 7;
        state.targetSwayX = 0;
      }

      // Smooth Linear Interpolation (LERP) for frictionless 60-120fps motion
      const lerpFactor = 0.075;
      state.currentY += (state.targetY - state.currentY) * lerpFactor;
      state.currentRotate += (state.targetRotate - state.currentRotate) * lerpFactor;
      state.currentSwayX += (state.targetSwayX - state.currentSwayX) * lerpFactor;
      state.currentTiltX += (state.targetTiltX - state.currentTiltX) * 0.08;
      state.currentTiltY += (state.targetTiltY - state.currentTiltY) * 0.08;

      // Idle harmonic breathing float (subtle organic motion when stationary)
      const idleOffset = Math.sin(time * 0.0016) * 6;
      const idleSway = Math.cos(time * 0.0012) * 1.2;

      const totalY = state.currentY + idleOffset;
      const totalRotate = state.currentRotate + idleSway;
      const totalX = state.currentSwayX;

      if (pendantRef.current) {
        pendantRef.current.style.transform = `
          translate3d(${totalX}px, ${totalY}px, 0)
          rotate(${totalRotate}deg)
          perspective(1000px)
          rotateX(${state.currentTiltX}deg)
          rotateY(${state.currentTiltY}deg)
        `;
      }

      if (chainRef.current) {
        chainRef.current.style.transform = `
          translate3d(${totalX * 0.5}px, ${totalY * 0.7}px, 0)
          rotate(${totalRotate * 0.6}deg)
        `;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="hero-visual" ref={containerRef}>
      {/* Soft ethereal ambient glow behind the pendant */}
      <div className="mountain-background" />

      {/* Hanging Chain Assembly */}
      <svg
        ref={chainRef}
        className="pendant-chain-svg"
        viewBox="0 0 100 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="chainShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="35%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <filter id="chainShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="rgba(10,22,40,0.35)" />
          </filter>
        </defs>
        {/* Dual hanging chain strands */}
        <path
          d="M 36 -40 L 48 110"
          stroke="url(#chainShine)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          filter="url(#chainShadow)"
        />
        <path
          d="M 64 -40 L 52 110"
          stroke="url(#chainShine)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          filter="url(#chainShadow)"
        />
      </svg>

      {/* 3D Shining Hanging Pendant Logo */}
      <div
        className="pendant-wrapper"
        ref={pendantRef}
        style={{ willChange: 'transform' }}
      >
        {/* Metallic Hanging Bail Ring */}
        <div className="pendant-bail">
          <div className="bail-inner" />
        </div>

        {/* Main 3D Metallic Emblem Body */}
        <div className="pendant-large shiny-emblem">
          {/* Specular Light Reflection Sweep Layers */}
          <div className="shine-beam-layer" aria-hidden="true">
            <div className="shine-sweep-diagonal" />
            <div className="shine-flare-gleam" />
            <div className="specular-rim-highlight" />
          </div>

          {/* Hanging Cord / Hole Connector with Realistic Depth Shadow */}
          <div className="pendant-hole">
            <div className="hole-inner-shadow" />
            <div className="hole-rim-highlight" />
          </div>

          {/* Micro Terrain Topography & Geometric Emblem Relief */}
          <div className="terrain-lines">
            <span className="contour-line contour-1" />
            <span className="contour-line contour-2" />
            <span className="contour-line contour-3" />
            <span className="contour-line contour-4" />
            <span className="contour-line contour-5" />
          </div>

          {/* Central Summit Peak Monogram / Logo Crest */}
          <div className="pendant-crest" aria-hidden="true">
            <svg
              className="crest-peak-svg"
              viewBox="0 0 60 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 30 6 L 52 42 L 30 35 L 8 42 Z"
                fill="url(#crestMetallic)"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="1.2"
              />
              <path
                d="M 30 6 L 8 42 L 30 35 Z"
                fill="rgba(255, 255, 255, 0.25)"
              />
              <defs>
                <linearGradient id="crestMetallic" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="40%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>
            </svg>
            <span className="crest-text">TERRAIN</span>
          </div>

          {/* Subtle Dynamic Glint Flare */}
          <div className="glint-sparkle glint-1" />
          <div className="glint-sparkle glint-2" />
        </div>
      </div>

      {/* Floating Coordinate Location Tag */}
      <div className="location-tag">
        <span className="tag-eyebrow">ELBRUS · CAUCASUS</span>
        <strong>5,642 M</strong>
        <small className="tag-coords">43.3499° N, 42.4453° E</small>
      </div>
    </div>
  );
}
