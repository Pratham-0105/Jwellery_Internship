'use client';
// src/components/ConfiguratorModal.tsx
// Final Checkout & Order Placement Modal — populates location, size, and submits to PostgreSQL

import { useEffect, useState } from 'react';
import { getProducts, createOrder, Product, formatPrice } from '@/lib/api';

export interface CustomOrderData {
  location: string;
  latitude?: number;
  longitude?: number;
  engraving?: string;
  productId: number;
  priceInr?: number;
}

interface ConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customData?: CustomOrderData | null;
}

type Step = 'configure' | 'success';

export default function ConfiguratorModal({ isOpen, onClose, customData }: ConfiguratorModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<Step>('configure');
  const [orderId, setOrderId] = useState<number | null>(null);

  // Form state
  const [location, setLocation] = useState('');
  const [engraving, setEngraving] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load products on mount
  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        if (customData?.productId) {
          const match = data.find((p) => p.id === customData.productId);
          if (match) setSelectedProduct(match);
        } else if (data.length > 0 && !selectedProduct) {
          setSelectedProduct(data[0]);
        }
      })
      .catch(() => {
        const fallback: Product[] = [
          { id: 1, name: '18 mm', sizeLabel: '18 mm', sizeMm: 18, priceInr: 11900, description: null, isActive: true },
          { id: 2, name: '20 mm', sizeLabel: '20 mm', sizeMm: 20, priceInr: 12700, description: null, isActive: true },
          { id: 3, name: '25 mm', sizeLabel: '25 mm', sizeMm: 25, priceInr: 15700, description: null, isActive: true },
          { id: 4, name: '30 mm', sizeLabel: '30 mm', sizeMm: 30, priceInr: 19400, description: null, isActive: true },
        ];
        setProducts(fallback);
        setSelectedProduct(fallback[0]);
      });
  }, [customData]);

  // Sync customData whenever modal opens with map-selected location
  useEffect(() => {
    if (customData) {
      if (customData.location) setLocation(customData.location);
      if (customData.engraving) setEngraving(customData.engraving);
      if (customData.productId && products.length > 0) {
        const match = products.find((p) => p.id === customData.productId);
        if (match) setSelectedProduct(match);
      }
    }
  }, [customData, products]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset on close
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('configure');
      setError('');
    }, 300);
  };

  const handleSubmit = async () => {
    setError('');

    if (!customerName.trim()) return setError('Please enter your name.');
    if (!customerEmail.trim() || !customerEmail.includes('@')) return setError('Please enter a valid email.');
    if (!location.trim()) return setError('Please enter a location.');
    if (!selectedProduct) return setError('Please select a pendant size.');

    setSubmitting(true);
    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        location: location.trim(),
        latitude: customData?.latitude,
        longitude: customData?.longitude,
        engraving: engraving.trim() || undefined,
        productId: selectedProduct.id,
      });
      setOrderId(order.id);
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Pendant configurator"
    >
      <div className="modal-content">
        <button
          className="modal-close"
          onClick={handleClose}
          aria-label="Close configurator"
          id="modal-close-btn"
        >
          ×
        </button>

        {step === 'configure' ? (
          <>
            <div className="modal-header">
              <span>FINAL CHECKOUT</span>
              <h2>Complete your <em className="serif-em">Order.</em></h2>
              <p>Review your custom terrain pendant specifications and enter your delivery details.</p>
            </div>

            {/* Selected Location Banner */}
            <div className="modal-selected-banner">
              <div>
                <small>ENGRAVED TERRAIN</small>
                <strong>{location || 'Custom Coordinates'}</strong>
              </div>
              <div>
                <small>SIZE</small>
                <strong>{selectedProduct?.sizeLabel || '18 mm'}</strong>
              </div>
            </div>

            {/* Step 1 — Customer Info */}
            <div className="config-step">
              <label>01 — Your details</label>
              <input
                type="text"
                placeholder="Your full name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                id="modal-name-input"
              />
            </div>
            <div className="config-step">
              <label></label>
              <input
                type="email"
                placeholder="Email address *"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                id="modal-email-input"
              />
            </div>
            <div className="config-step">
              <label></label>
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                id="modal-phone-input"
              />
            </div>

            {/* Step 2 — Engraving / Notes */}
            <div className="config-step">
              <label>02 — Engraving / Inscription</label>
              <input
                type="text"
                placeholder="Optional inscription or date (max 40 chars)"
                maxLength={40}
                value={engraving}
                onChange={(e) => setEngraving(e.target.value)}
                id="modal-engraving-input"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="config-footer">
              <div>
                <small>Total amount</small>
                <strong>{selectedProduct ? formatPrice(selectedProduct.priceInr) : '—'}</strong>
              </div>
              <button
                className="primary-button"
                onClick={handleSubmit}
                disabled={submitting}
                id="modal-submit-btn"
                style={{ marginTop: 0 }}
              >
                {submitting ? 'Submitting...' : 'Place Order'} <span>→</span>
              </button>
            </div>
          </>
        ) : (
          <div className="order-success">
            <div className="success-icon">✨</div>
            <h3>Order placed!</h3>
            <p>
              Thank you, <strong>{customerName}</strong>. Your custom terrain pendant of <strong>{location}</strong> is now registered.
            </p>
            <p>
              We&apos;ll send production updates to <strong>{customerEmail}</strong>.
            </p>
            {orderId && (
              <div className="order-id">
                ORDER #{String(orderId).padStart(6, '0')}
              </div>
            )}
            <br /><br />
            <button className="primary-button" onClick={handleClose} style={{ margin: '0 auto' }} id="modal-done-btn">
              Done <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
