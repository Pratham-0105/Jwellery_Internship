'use client';
// src/components/Pricing.tsx
// Dynamic pricing — fetches pendant sizes and prices from the backend

import { useEffect, useState } from 'react';
import { getProducts, Product, formatPrice } from '@/lib/api';

interface PricingProps {
  onProceed: () => void;
}

export default function Pricing({ onProceed }: PricingProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setSelected(data[0] ?? null);
      })
      .catch(() => {
        // Fallback static data if API is offline
        const fallback: Product[] = [
          { id: 1, name: '18 mm Pendant', sizeLabel: '18 mm', sizeMm: 18, priceInr: 11900, description: null, isActive: true },
          { id: 2, name: '20 mm Pendant', sizeLabel: '20 mm', sizeMm: 20, priceInr: 12700, description: null, isActive: true },
          { id: 3, name: '25 mm Pendant', sizeLabel: '25 mm', sizeMm: 25, priceInr: 15700, description: null, isActive: true },
          { id: 4, name: '30 mm Pendant', sizeLabel: '30 mm', sizeMm: 30, priceInr: 19400, description: null, isActive: true },
        ];
        setProducts(fallback);
        setSelected(fallback[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section pricing" id="pricing">
      <div className="section-label">
        <span>04</span> PRICING
      </div>
      <div className="pricing-layout">
        <div className="pricing-title">
          <h2>
            Your terrain.<br />
            Your <em className="serif-em">size.</em>
          </h2>
          <p>Choose the size that fits your story.</p>
        </div>
        <div className="pricing-content">
          <div className="price-from">
            <span>FROM</span>
            <strong>
              {loading
                ? '...'
                : selected
                ? formatPrice(selected.priceInr)
                : '₹11,900'}
            </strong>
          </div>

          <div className="size-options">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 62, marginBottom: 1 }} />
                ))
              : products.map((p) => (
                  <button
                    key={p.id}
                    className={`size-option${selected?.id === p.id ? ' active' : ''}`}
                    onClick={() => setSelected(p)}
                    id={`pricing-size-${p.sizeMm}`}
                  >
                    <span>{p.sizeLabel}</span>
                    <strong>{formatPrice(p.priceInr)}</strong>
                  </button>
                ))}
          </div>

          <div className="features">
            <div><span>✓</span>Custom terrain from real data</div>
            <div><span>✓</span>High precision jewellery casting</div>
            <div><span>✓</span>Cord included</div>
            <div><span>✓</span>7–14 day production</div>
            <div><span>✓</span>Worldwide shipping</div>
            <div><span>✓</span>Gift packaging</div>
          </div>

          <button
            className="primary-button"
            onClick={onProceed}
            id="pricing-create-btn"
          >
            Proceed <span>↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}
