'use client';
// src/components/Hero.tsx
// Hero section with Shining Animated Pendant Logo & Proceed CTA

import PendantHero from './PendantHero';

interface HeroProps {
  onProceed: () => void;
}

export default function Hero({ onProceed }: HeroProps) {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <div className="eyebrow">
          TERRAIN JEWELLERY <span>·</span> HANDCRAFTED
        </div>
        <h1>
          A pendant<br />
          shaped by<br />
          <em className="serif-em">your place.</em>
        </h1>
        <p className="hero-description">
          Choose any point on Earth and turn its landscape into a unique piece
          of jewellery.
        </p>
        <button
          className="primary-button"
          onClick={onProceed}
          id="hero-create-btn"
        >
          Proceed <span>↗</span>
        </button>
      </div>

      <PendantHero />

      <div className="scroll-indicator">
        <span>↓</span> SCROLL TO EXPLORE
      </div>
    </section>
  );
}
