'use client';
// src/components/CustomizerSection.tsx
// Interactive Customization Workstation: Pure Silver Surface Terrain Map + Google Maps Style Layers Control + 360° 3D Engraved Silver Pendant Preview + Order Placement

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

const MAP_STYLES = [
  {
    id: 'silver-hillshade',
    name: 'Silver Surface Relief',
    icon: '✨',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    fallbackThumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/12/1550/2060',
  },
  {
    id: 'dark-surface',
    name: 'Dark Silver Terrain',
    icon: '🌑',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    fallbackThumb: 'https://a.basemaps.cartocdn.com/dark_nolabels/12/2048/1365.png',
  },
  {
    id: 'topo-contours',
    name: 'Topo Contours',
    icon: '🏔️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    fallbackThumb: 'https://a.tile.opentopomap.org/12/2048/1365.png',
  },
  {
    id: 'light-surface',
    name: 'Bright Silver Etch',
    icon: '💎',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    fallbackThumb: 'https://a.basemaps.cartocdn.com/light_nolabels/12/2048/1365.png',
  },
];

// Calculate static map tile URL for selected coordinates & style
function getStaticTileUrl(lat: number, lng: number, zoom: number, styleId: string) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );

  if (styleId === 'dark-surface') {
    return `https://a.basemaps.cartocdn.com/dark_nolabels/${zoom}/${x}/${y}.png`;
  }
  if (styleId === 'topo-contours') {
    return `https://a.tile.opentopomap.org/${zoom}/${x}/${y}.png`;
  }
  if (styleId === 'light-surface') {
    return `https://a.basemaps.cartocdn.com/light_nolabels/${zoom}/${x}/${y}.png`;
  }
  // Silver Hillshade (default pure surface texture)
  return `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${zoom}/${y}/${x}`;
}

export default function CustomizerSection({ products, onOpenOrderModal }: CustomizerSectionProps) {
  // Selected location & mapping state
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(PRESET_LOCATIONS[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [engravingText, setEngravingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Map customization state
  const [activeStyleId, setActiveStyleId] = useState<string>('silver-hillshade');
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);

  // Map & DOM references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const layerControlRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside & Escape key to close floating layer panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layerControlRef.current && !layerControlRef.current.contains(event.target as Node)) {
        setIsLayerPanelOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLayerPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

      // Dynamically import Leaflet
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Import Leaflet CSS if missing
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [selectedLocation.lat, selectedLocation.lng],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Add active tile layer
      const styleObj = MAP_STYLES.find((s) => s.id === activeStyleId) || MAP_STYLES[0];
      const layer = L.tileLayer(styleObj.url, {
        maxZoom: 18,
        subdomains: styleObj.subdomains,
        className: 'silver-surface-tile',
      }).addTo(map);

      tileLayerRef.current = layer;

      // Glowing marker
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

      // Click on map to pick coordinate
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);

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

  // Handle map style layer switch cleanly without recreating Leaflet map instance
  const handleStyleSwitch = async (styleId: string) => {
    setActiveStyleId(styleId);
    if (!mapInstanceRef.current) return;

    const L = (await import('leaflet')).default;
    const styleObj = MAP_STYLES.find((s) => s.id === styleId) || MAP_STYLES[0];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(styleObj.url, {
      maxZoom: 18,
      subdomains: styleObj.subdomains,
      className: 'silver-surface-tile',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // Update map center when location is selected
  const handleSelectLocation = useCallback((loc: LocationData) => {
    setSelectedLocation(loc);
    setSearchOpen(false);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 12, { duration: 1.5 });
      markerRef.current.setLatLng([loc.lat, loc.lng]);
    }
  }, []);

  // Location search with debounce
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

  // 3D Turntable rotation physics loop
  useEffect(() => {
    let animId: number;

    const updateRotation = () => {
      const state = rotState.current;

      if (!state.isInteracting) {
        state.idleAngle += 0.35;
        state.targetRotY = 15 + Math.sin((state.idleAngle * Math.PI) / 180) * 12;
      }

      state.currentRotY += (state.targetRotY - state.currentRotY) * 0.08;
      state.currentRotX += (state.targetRotX - state.currentRotX) * 0.08;

      setDisplayRot({
        rotX: Math.round(state.currentRotX * 10) / 10,
        rotY: Math.round(state.currentRotY * 10) / 10,
      });

      animId = requestAnimationFrame(updateRotation);
    };

    animId = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Mouse & Touch interaction handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    startPosRef.current = { x: clientX, y: clientY };
    rotState.current.isInteracting = true;
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    rotState.current.targetRotY += deltaX * 0.45;
    rotState.current.targetRotX = Math.max(-35, Math.min(35, rotState.current.targetRotX - deltaY * 0.35));

    startPosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      if (!isDraggingRef.current) {
        rotState.current.isInteracting = false;
      }
    }, 2500);
  };

  // Place order handler
  const handleProceedOrder = () => {
    if (!selectedProduct) return;
    onOpenOrderModal({
      location: selectedLocation.name,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      engraving: engravingText.trim() || undefined,
      productId: selectedProduct.id,
      priceInr: selectedProduct.priceInr,
    });
  };

  const latStr = `${Math.abs(selectedLocation.lat).toFixed(4)}° ${selectedLocation.lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(selectedLocation.lng).toFixed(4)}° ${selectedLocation.lng >= 0 ? 'E' : 'W'}`;

  // Current static map tile image URL for pendant projection
  const currentTileUrl = getStaticTileUrl(selectedLocation.lat, selectedLocation.lng, 12, activeStyleId);

  return (
    <section className="section-padding customizer-section" id="customizer">
      {/* Header */}
      <div className="section-label">
        <span>05</span> PENDANT CUSTOMIZATION & TERRAIN MAP
      </div>

      <div className="customizer-header">
        <h2>
          Select the Place That<br />
          Holds Your <em className="serif-em">Memory.</em>
        </h2>
        <p>
          Search any summit, coastline, or memory on Earth. We extract its pure topographical surface terrain—with no map text or labels—and engrave it in solid sterling silver.
        </p>
      </div>

      {/* Main 2-Column Customizer Workstation */}
      <div className="customizer-workstation">
        {/* Left Column: Interactive Silver Terrain Map */}
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
            <div className="leaflet-map-wrapper silver-terrain-wrapper">
              <div ref={mapContainerRef} className="leaflet-map-element" />

              <div className="map-hint-badge">
                <span>📍 Click anywhere on map to pin custom coordinates</span>
              </div>

              {/* Google Maps Style Floating Layers Control */}
              <div className="map-layers-control-container" ref={layerControlRef}>
                {/* Floating Layer Selection Panel */}
                {isLayerPanelOpen && (
                  <div
                    className="map-layers-panel"
                    role="dialog"
                    aria-label="Map style selection"
                  >
                    <div className="layers-panel-header">
                      <span className="panel-title">MAP LAYERS</span>
                      <button
                        className="panel-close-btn"
                        onClick={() => setIsLayerPanelOpen(false)}
                        aria-label="Close layers panel"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="layers-options-list" role="radiogroup" aria-label="Select map layer style">
                      {MAP_STYLES.map((style) => {
                        const isSelected = activeStyleId === style.id;
                        const thumbUrl = getStaticTileUrl(selectedLocation.lat, selectedLocation.lng, 12, style.id);
                        return (
                          <button
                            key={style.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={style.name}
                            className={`layer-option-card${isSelected ? ' selected' : ''}`}
                            onClick={() => {
                              handleStyleSwitch(style.id);
                              setIsLayerPanelOpen(false);
                            }}
                          >
                            <div className="option-thumb-wrapper">
                              <img
                                src={thumbUrl}
                                alt={style.name}
                                className="option-thumb-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = style.fallbackThumb;
                                }}
                              />
                              <span className="style-icon-badge">{style.icon}</span>
                            </div>
                            <div className="option-info">
                              <strong className="option-name">{style.name}</strong>
                            </div>
                            {isSelected && <span className="option-checkmark" aria-hidden="true">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Floating Layers Control Button */}
                <button
                  type="button"
                  className={`map-layers-toggle-btn${isLayerPanelOpen ? ' active' : ''}`}
                  onClick={() => setIsLayerPanelOpen((prev) => !prev)}
                  aria-label="Toggle map layers"
                  aria-expanded={isLayerPanelOpen}
                  id="map-layers-toggle-btn"
                >
                  <svg
                    className="layers-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  <span>Layers</span>
                </button>
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
                <label htmlFor="custom-engraving-field">CUSTOM BACK ENGRAVING (OPTIONAL)</label>
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
                <small>3D SILVER PENDANT PREVIEW</small>
                <h3>{selectedLocation.name}</h3>
              </div>
              <div className="rotation-hint">
                <span>🖱️ Drag to rotate 360°</span>
              </div>
            </div>

            {/* Interactive 3D Turntable Stage */}
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
              {/* Dynamic 3D Pendant Model */}
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

                {/* 3D Liquid Silver Body with Pure Engraved Surface Topography */}
                <div className="pendant-large shiny-emblem preview-pendant-body">
                  {/* Dynamic Specular Highlights */}
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

                  {/* PURE SURFACE TERRAIN TEXTURE MASK (No Map Labels / Only Topography Relief) */}
                  <div className="pendant-map-texture-mask">
                    <img
                      src={currentTileUrl}
                      alt="Pure Silver Surface Topography Texture"
                      className={`pendant-face-tile pure-surface-relief style-${activeStyleId}`}
                    />
                    <div className="pendant-silver-etch-grain" />
                  </div>

                  {/* Topographical Contour Isolines */}
                  <div className="engraved-terrain-layer">
                    <span className="contour-line contour-1" />
                    <span className="contour-line contour-2" />
                    <span className="contour-line contour-3" />
                    <span className="contour-line contour-4" />
                    <span className="contour-line contour-5" />
                  </div>

                  {/* Surface Engraved Crosshair & Coordinates Monogram */}
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
              <label>SELECT PENDANT SIZE</label>
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
