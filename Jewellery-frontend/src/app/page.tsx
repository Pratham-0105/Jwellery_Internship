'use client';
// src/app/page.tsx
// Main landing page — integrates all sections including the new Interactive 360° Customizer Section

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Quality from '@/components/Quality';
import Gallery from '@/components/Gallery';
import Pricing from '@/components/Pricing';
import CustomizerSection from '@/components/CustomizerSection';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import ConfiguratorModal, { CustomOrderData } from '@/components/ConfiguratorModal';
import { getProducts, Product } from '@/lib/api';

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: '18 mm', sizeLabel: '18 mm', sizeMm: 18, priceInr: 11900, description: null, isActive: true },
  { id: 2, name: '20 mm', sizeLabel: '20 mm', sizeMm: 20, priceInr: 12700, description: null, isActive: true },
  { id: 3, name: '25 mm', sizeLabel: '25 mm', sizeMm: 25, priceInr: 15700, description: null, isActive: true },
  { id: 4, name: '30 mm', sizeLabel: '30 mm', sizeMm: 30, priceInr: 19400, description: null, isActive: true },
];

export default function HomePage() {
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [modalCustomData, setModalCustomData] = useState<CustomOrderData | null>(null);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);

  // Fetch product sizes on mount
  useEffect(() => {
    getProducts()
      .then((data) => {
        if (data && data.length > 0) setProducts(data);
      })
      .catch(() => {
        // Keeps fallback products
      });
  }, []);

  // Smooth scroll to the Customization section when clicking Proceed
  const handleProceed = () => {
    const customizerEl = document.getElementById('customizer');
    if (customizerEl) {
      customizerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Open final checkout modal from the customizer's Place Order button
  const handleOpenOrderModal = (customData: CustomOrderData) => {
    setModalCustomData(customData);
    setConfiguratorOpen(true);
  };

  const closeConfigurator = () => {
    setConfiguratorOpen(false);
  };

  return (
    <>
      <Header onOpenCustomizer={handleProceed} />

      <main id="home">
        <Hero onProceed={handleProceed} />

        <About />

        <Quality />

        {/* Visual Break */}
        <section
          className="visual-break"
          aria-label="Decorative section"
        >
          <div className="visual-break-content">
            <span>YOUR PLACE</span>
            <h2>
              YOUR<br />
              <em className="serif-em">STORY.</em>
            </h2>
          </div>
        </section>

        <Gallery />

        <Pricing onProceed={handleProceed} />

        {/* Interactive World Map & 360° 3D Silver Pendant Customizer */}
        <CustomizerSection
          products={products}
          onOpenOrderModal={handleOpenOrderModal}
        />

        <FAQ />
      </main>

      <Footer />

      <ConfiguratorModal
        isOpen={configuratorOpen}
        onClose={closeConfigurator}
        customData={modalCustomData}
      />
    </>
  );
}
