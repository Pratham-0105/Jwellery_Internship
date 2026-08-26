'use client';
// src/components/Gallery.tsx
// Dynamic gallery — fetches items from the backend API on mount

import { useEffect, useState } from 'react';
import { getGallery, GalleryItem } from '@/lib/api';

function GalleryCard({ item }: { item: GalleryItem }) {
  const indexStr = item.index.toString().padStart(2, '0');
  return (
    <article className="gallery-card">
      <div
        className="gallery-image"
        style={{ background: item.bgColor }}
      >
        <div className={`gallery-pendant${item.darkPendant ? ' dark' : ''}`}>
          <div className="small-hole" />
          <div className="small-terrain" />
        </div>
      </div>
      <div className="gallery-info">
        <span>{indexStr}</span>
        <h3>{item.name}</h3>
        <small>{item.subtitle}</small>
      </div>
    </article>
  );
}

function GallerySkeletons() {
  return (
    <div className="loading-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGallery()
      .then(setItems)
      .catch(() => setError('Could not load gallery. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section gallery" id="gallery">
      <div className="gallery-header">
        <div>
          <div className="section-label">
            <span>03</span> GALLERY
          </div>
          <h2>
            Every piece<br />
            is <em className="serif-em">different.</em>
          </h2>
        </div>
        <p>Real landscapes transformed into objects you can carry with you every day.</p>
      </div>

      {loading && <GallerySkeletons />}

      {error && (
        <p style={{ color: '#888', fontStyle: 'italic', marginBottom: 20 }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="gallery-grid">
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <button className="outline-button" id="gallery-view-all-btn">
        View All Pieces <span>→</span>
      </button>
    </section>
  );
}
