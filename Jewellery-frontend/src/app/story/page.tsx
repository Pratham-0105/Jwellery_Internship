// src/app/story/page.tsx
// Story Page — The craftsmanship, metallurgy, and philosophy behind Terrain Jewellery

import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Our Story — JEWELLERY',
  description: 'Learn how we turn real Earth landscape elevations into bespoke, handcrafted silver terrain jewellery.',
};

export default function StoryPage() {
  return (
    <div className="story-page">
      {/* Header Navigation */}
      <header className="header">
        <Link href="/" className="logo">
          JEWELLERY
        </Link>
        <nav className="nav">
          <Link href="/#about">About</Link>
          <Link href="/#quality">Quality</Link>
          <Link href="/#gallery">Gallery</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/" className="nav-create">
            Home <span>←</span>
          </Link>
        </nav>
      </header>

      <main className="story-main">
        {/* Story Hero */}
        <section className="story-hero">
          <div className="eyebrow">
            OUR PHILOSOPHY <span>·</span> SINCE 2026
          </div>
          <h1>
            Every place holds a<br />
            <em className="serif-em">Sacred Story.</em>
          </h1>
          <p className="story-lead">
            We believe the landscapes of our lives shape who we are. Our mission is to capture Earth’s elevation topography and translate your unforgettable memories into wearable silver sculptures.
          </p>
        </section>

        {/* Chapter 1 */}
        <section className="story-chapter">
          <div className="section-label">
            <span>CHAPTER 01</span> THE GENESIS
          </div>
          <div className="story-grid">
            <div className="story-title">
              <h2>
                From Satellite<br />
                <em className="serif-em">Data</em> to Silver.
              </h2>
            </div>
            <div className="story-body">
              <p className="large-text">
                Every pendant begins millions of meters above Earth.
              </p>
              <p>
                Using high-resolution digital elevation models (DEM) gathered from satellite radar topographic missions, we extract the precise micro-elevations of your chosen coordinates — whether it is the knife-edge ridge of the Matterhorn, the serene coastline of Amalfi, or the quiet streets of your hometown.
              </p>
              <p>
                This topographical contour data is then mathematically refined into sub-millimeter 3D relief algorithms, capturing natural ridges, summit slopes, and geographical contours with unmatched fidelity.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 2 */}
        <section className="story-chapter alt-bg">
          <div className="section-label">
            <span>CHAPTER 02</span> THE METALLURGY
          </div>
          <div className="story-grid">
            <div className="story-title">
              <h2>
                Master<br />
                <em className="serif-em">Casting</em> & Finish.
              </h2>
            </div>
            <div className="story-body">
              <p className="large-text">
                Precision technology meets centuries-old artisanal metallurgy.
              </p>
              <p>
                Once the relief model is sculpted, our master jewellers cast each piece in recycled 925 sterling silver and high-grade surgical titanium. Each piece undergoes hand-burnishing and chamfer edge polishing to catch and reflect light across its contours.
              </p>
              <p>
                The recessed valleys receive a soft satin oxidization, creating dramatic contrast against the polished specular peaks — transforming raw topography into a tactile heirloom.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 3 */}
        <section className="story-chapter">
          <div className="section-label">
            <span>CHAPTER 03</span> YOUR MEMORY
          </div>
          <div className="story-grid">
            <div className="story-title">
              <h2>
                A Moment<br />
                <em className="serif-em">Immortalized.</em>
              </h2>
            </div>
            <div className="story-body">
              <p className="large-text">
                Coordinates are numbers. Memories are forever.
              </p>
              <p>
                Where you said &ldquo;yes&rdquo;, where you ran your first summit, where your roots began, or where you found peace — carrying your sacred place close to your heart is more than wearing jewellery; it is an enduring connection to the planet and your story.
              </p>
              <div style={{ marginTop: '40px' }}>
                <Link href="/" className="primary-button" id="story-create-btn">
                  Craft Your Pendant <span>↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
