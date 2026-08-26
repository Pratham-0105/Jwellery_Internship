// src/components/About.tsx
// About section — with active link to /story

import Link from 'next/link';

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="section-label">
        <span>01</span> ABOUT US
      </div>
      <div className="about-grid">
        <div className="about-title">
          <h2>
            Every place<br />
            holds a<br />
            <em className="serif-em">Story.</em>
          </h2>
        </div>
        <div className="about-content">
          <p className="large-text">
            Some places are more than coordinates on a map.
          </p>
          <p>
            They are where you grew up, where you met someone special, where
            you found yourself, or where you simply felt free.
          </p>
          <p>
            Jewellery transforms these meaningful landscapes into handcrafted
            terrain jewellery.
          </p>
          <Link href="/story" className="text-button" id="about-story-btn">
            Discover Our Story <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
