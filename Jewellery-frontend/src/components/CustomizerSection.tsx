'use client';
// src/components/CustomizerSection.tsx
// Interactive Customization Section: Leaflet Map + 360° 3D Engraved Silver Pendant Preview + Order Placement

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Product, formatPrice } from '@/lib/api';

interface CustomizerSectionProps {
  products: Product[];
  onOpenOrderModal: (customData: {
    location: string;
    latitude?: number;
    longitude?: number;
    engraving?: string;
    productId: number;
    priceInr: number;
  }) => void;
}

interface LocationData {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

const PRESET_LOCATIONS: LocationData[] = [
  { name: 'Matterhorn, Swiss Alps', displayName: 'Matterhorn, Zermatt, Switzerland', lat: 45.9763, lng: 7.6586 },
  { name: 'Mount Everest, Himalayas', displayName: 'Mount Everest, Solukhumbu, Nepal', lat: 27.9881, lng: 86.9250 },
  { name: 'Mount Fuji, Japan', displayName: 'Mount Fuji, Honshu, Japan', lat: 35.3606, lng: 138.7274 },
  { name: 'Amalfi Coast, Italy', displayName: 'Amalfi Coast, Salerno, Italy', lat: 40.6340, lng: 14.6027 },
  { name: 'Grand Canyon, USA', displayName: 'Grand Canyon National Park, Arizona, USA', lat: 36.1069, lng: -112.1129 },
  { name: 'Manali, Himachal Pradesh', displayName: 'Manali, Kullu Valley, India', lat: 32.2432, lng: 77.1892 },
];

export default function CustomizerSection({ products, onOpenOrderModal }: CustomizerSectionProps) {
  // Selected location state
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(PRESET_LOCATIONS[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [engravingText, setEngravingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Map & DOM references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 360° 3D Pendant Interactive State
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const rotState = useRef({
    targetRotY: 15,
    targetRotX: 10,
    currentRotY: 15,
    currentRotX: 10,
    isInteracting: false,
    idleAngle: 0,
  });

  const [displayRot, setDisplayRot] = useState({ rotX: 10, rotY: 15 });

  // Initialize product selection
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  // Leaflet Map Initialization (SSR Safe)
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return; // already initialized

      // Dynamically import Leaflet to prevent SSR issues
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Import Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [selectedLocation.lat, selectedLocation.lng],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Luxury dark CartoDB tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom glowing silver marker icon
      const customPin = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="pin-pulse-ring"></div>
          <div class="pin-core"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: customPin,
      }).addTo(map);
      markerRef.current = marker;

      // Click on map to select any coordinate
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);

        // Reverse geocoding using OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
          );
          const data = await res.json();
          const placeName =
            data.address?.village ||
            data.address?.town ||
            data.address?.city ||
            data.address?.county ||
            data.address?.state ||
            data.name ||
            'Custom Coordinates';

          setSelectedLocation({
            name: placeName,
            displayName: data.display_name || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
            lat,
            lng,
          });
        } catch {
          setSelectedLocation({
            name: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
            displayName: `Coordinates: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
            lat,
            lng,
          });
        }
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map viewport & marker when selected location changes
  const handleSelectLocation = useCallback((loc: LocationData) => {
    setSelectedLocation(loc);
    setSearchOpen(false);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 12, { duration: 1.5 });
      markerRef.current.setLatLng([loc.lat, loc.lng]);
    }
  }, []);

  // Search places via Nominatim API with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5`
        );
        const data = await res.json();
        const formatted: LocationData[] = data.map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
        }));
        setSearchResults(formatted);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 360° 3D Turntable & Drag Interaction Physics
  useEffect(() => {
    let animFrameId: number;

    const render3DLoop = () => {
      const s = rotState.current;

      if (!s.isInteracting) {
        // Slow subtle breathing turntable spin when not dragging
        s.idleAngle += 0.008;
        s.targetRotY = Math.sin(s.idleAngle) * 22;
        s.targetRotX = 8 + Math.cos(s.idleAngle * 0.7) * 4;
      }

      // Smooth Linear Interpolation (LERP)
      s.currentRotY += (s.targetRotY - s.currentRotY) * 0.08;
      s.currentRotX += (s.targetRotX - s.currentRotX) * 0.08;

      setDisplayRot({
        rotX: parseFloat(s.currentRotX.toFixed(2)),
        rotY: parseFloat(s.currentRotY.toFixed(2)),
      });

      animFrameId = requestAnimationFrame(render3DLoop);
    };

    animFrameId = requestAnimationFrame(render3DLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    rotState.current.isInteracting = true;
    startPosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    rotState.current.targetRotY += deltaX * 0.45;
    rotState.current.targetRotX = Math.max(Math.min(rotState.current.targetRotX - deltaY * 0.35, 45), -45);

    startPosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    // Release back to gentle rotation after a 2-second pause
    setTimeout(() => {
      if (!isDraggingRef.current) {
        rotState.current.isInteracting = false;
      }
    }, 2000);
  };

  // Format coordinates cleanly
  const latStr = `${Math.abs(selectedLocation.lat).toFixed(4)}° ${selectedLocation.lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(selectedLocation.lng).toFixed(4)}° ${selectedLocation.lng >= 0 ? 'E' : 'W'}`;

  // Proceed / Place Order trigger
  const handleProceedOrder = () => {
    if (!selectedProduct) return;
    onOpenOrderModal({
      location: selectedLocation.name || selectedLocation.displayName,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      engraving: engravingText || undefined,
      productId: selectedProduct.id,
      priceInr: selectedProduct.priceInr,
    });
  };

  return (
    <section className="section customizer-section" id="customizer">
      {/* Header */}
      <div className="section-label">
        <span>05</span> PENDANT CUSTOMIZATION
      </div>

      <div className="customizer-header">
        <h2>
          Select the Place That<br />
          Holds Your <em className="serif-em">Memory.</em>
        </h2>
        <p>
          Search any city, summit, coastline, or memory on Earth. We extract its real topographical terrain and engrave it into precious silver.
        </p>
      </div>

      {/* Main 2-Column Customizer Workstation */}
      <div className="customizer-workstation">
        {/* Left Column: Interactive Map & Location Selector */}
        <div className="map-column">
          <div className="map-card">
            {/* Search Bar */}
            <div className="map-search-container">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search city, mountain, beach, landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                  id="map-search-input"
                />
                {isSearching && <span className="search-spinner">⏳</span>}
              </div>

              {/* Autocomplete Dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      className="search-item"
                      onClick={() => handleSelectLocation(item)}
                    >
                      <strong>{item.name}</strong>
                      <small>{item.displayName}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="leaflet-map-wrapper">
              <div ref={mapContainerRef} className="leaflet-map-element" />
              <div className="map-hint-badge">
                <span>📍 Click anywhere on map to pin custom coordinates</span>
              </div>
            </div>

            {/* Quick Location Chips */}
            <div className="preset-locations">
              <span>Popular Terrain:</span>
              <div className="chips-row">
                {PRESET_LOCATIONS.map((loc, i) => (
                  <button
                    key={i}
                    className={`preset-chip${selectedLocation.name === loc.name ? ' active' : ''}`}
                    onClick={() => handleSelectLocation(loc)}
                  >
                    {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Data Summary & Engraving */}
            <div className="location-meta-card">
              <div className="meta-left">
                <small>SELECTED MEMORY</small>
                <h3>{selectedLocation.name}</h3>
                <span className="meta-coords">{latStr}, {lngStr}</span>
              </div>
              <div className="meta-right">
                <label htmlFor="custom-engraving-field">CUSTOM ENGRAVING (OPTIONAL)</label>
                <input
                  id="custom-engraving-field"
                  type="text"
                  placeholder="e.g. 24.10.2024 · Forever"
                  maxLength={40}
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 360° Interactive 3D Silver Pendant Preview */}
        <div className="preview-column">
          <div className="preview-card">
            <div className="preview-header">
              <div>
                <small>YOUR CUSTOM PENDANT</small>
                <h3>{selectedLocation.name}</h3>
              </div>
              <div className="rotation-hint">
                <span>🖱️ Drag to rotate 360°</span>
              </div>
            </div>

            {/* Interactive 3D Turntable Box */}
            <div
              className="pendant-3d-stage"
              ref={previewBoxRef}
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
            >
              {/* Dynamic 3D Pendant Model with Surface-Engraved Terrain & Lighting */}
              <div
                className="pendant-3d-model"
                style={{
                  transform: `perspective(900px) rotateX(${displayRot.rotX}deg) rotateY(${displayRot.rotY}deg)`,
                }}
              >
                {/* Silver Hanging Bail */}
                <div className="pendant-bail">
                  <div className="bail-inner" />
                </div>

                {/* 3D Liquid Silver Body with Engraved Location Topography */}
                <div className="pendant-large shiny-emblem preview-pendant-body">
                  {/* Dynamic Specular Highlights shifting with angle */}
                  <div
                    className="specular-reflection-surface"
                    style={{
                      transform: `translate(${displayRot.rotY * 1.8}px, ${displayRot.rotX * 1.5}px)`,
                    }}
                  />

                  {/* Hole connector */}
                  <div className="pendant-hole">
                    <div className="hole-rim-highlight" />
                  </div>

                  {/* Physically Engraved Topographical Terrain Contours */}
                  <div className="engraved-terrain-layer">
                    <span className="contour-line contour-1" />
                    <span className="contour-line contour-2" />
                    <span className="contour-line contour-3" />
                    <span className="contour-line contour-4" />
                    <span className="contour-line contour-5" />
                  </div>

                  {/* Surface Engraved Coordinate Crosshair & Location Monogram */}
                  <div className="engraved-location-surface">
                    <div className="engraved-pin-crosshair">
                      <div className="crosshair-ring" />
                      <div className="crosshair-dot" />
                    </div>
                    <span className="engraved-location-title">{selectedLocation.name.toUpperCase()}</span>
                    <span className="engraved-coords-text">{latStr} · {lngStr}</span>
                    {engravingText && (
                      <span className="engraved-custom-text">&ldquo;{engravingText}&rdquo;</span>
                    )}
                  </div>

                  {/* Polished Rim Highlight */}
                  <div className="specular-rim-highlight" />
                </div>
              </div>
            </div>

            {/* Size Selector in Customizer */}
            <div className="customizer-size-selector">
              <label>SELECT SIZE</label>
              <div className="size-buttons-grid">
                {products.map((p) => (
                  <button
                    key={p.id}
                    className={`custom-size-btn${selectedProduct?.id === p.id ? ' active' : ''}`}
                    onClick={() => setSelectedProduct(p)}
                  >
                    <span>{p.sizeLabel}</span>
                    <strong>{formatPrice(p.priceInr)}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Total Price & Final Place Order CTA */}
            <div className="customizer-footer">
              <div className="footer-price-block">
                <small>TOTAL ESTIMATE</small>
                <strong>{selectedProduct ? formatPrice(selectedProduct.priceInr) : '—'}</strong>
              </div>

              <button
                className="primary-button place-order-cta"
                onClick={handleProceedOrder}
                id="customizer-place-order-btn"
                disabled={!selectedLocation}
              >
                Place Order <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
