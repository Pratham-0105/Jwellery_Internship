// src/components/Quality.tsx
// Quality/Stats section — static content, server component

export default function Quality() {
  return (
    <section className="section quality" id="quality">
      <div className="section-label">
        <span>02</span> MATERIALS &amp; CRAFT
      </div>
      <div className="quality-header">
        <h2>
          Crafted with<br />
          <em className="serif-em">millimeter precision.</em>
        </h2>
        <p>
          Every pendant combines digital terrain data with traditional
          jewellery craftsmanship.
        </p>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-number">
            17 <small>YEARS</small>
          </div>
          <h3>Jewellery experience</h3>
          <p>Experienced craftsmen finish every piece by hand.</p>
        </div>
        <div className="stat">
          <div className="stat-number">
            0.1 <small>MM</small>
          </div>
          <h3>Terrain precision</h3>
          <p>Fine terrain details are reproduced with high precision.</p>
        </div>
        <div className="stat">
          <div className="stat-number">
            7–14 <small>DAYS</small>
          </div>
          <h3>Production time</h3>
          <p>From your order to the finished handcrafted piece.</p>
        </div>
      </div>
    </section>
  );
}
