'use client';
// src/components/FAQ.tsx
// Dynamic FAQ — fetches questions from the backend, accordion interaction

import { useEffect, useState } from 'react';
import { getFaqs, FaqItem } from '@/lib/api';

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        id={`faq-item-${item.id}`}
      >
        <span>{item.question}</span>
        <strong>{open ? '−' : '+'}</strong>
      </button>
      <div className="faq-answer" aria-hidden={!open}>
        <p>{item.answer}</p>
      </div>
    </div>
  );
}

const FALLBACK_FAQS: FaqItem[] = [
  { id: 1, index: 1, question: 'What is a terrain pendant?', answer: 'A terrain pendant is a piece of jewellery created from the actual landscape of a location.', isActive: true },
  { id: 2, index: 2, question: 'Can I choose any location?', answer: 'Yes. You can choose virtually any location on Earth.', isActive: true },
  { id: 3, index: 3, question: 'Can I add coordinates or engraving?', answer: 'Yes. Coordinates and a short personalized message can be added to the back of the pendant.', isActive: true },
  { id: 4, index: 4, question: 'How long does production take?', answer: 'Production usually takes approximately 7–14 days.', isActive: true },
  { id: 5, index: 5, question: 'How do I create my pendant?', answer: 'Open the configurator, select a location, choose the pendant size and add optional engraving.', isActive: true },
];

export default function FAQ() {
  const [faqs, setFaqs] = useState<FaqItem[]>(FALLBACK_FAQS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFaqs()
      .then((data) => {
        if (data && data.length > 0) setFaqs(data);
      })
      .catch(() => {
        // Keeps fallback FAQs gracefully
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section faq" id="faq">
      <div className="section-label">
        <span>05</span> FAQ
      </div>
      <div className="faq-header">
        <h2>
          Terrain jewellery:<br />
          <em className="serif-em">your questions.</em>
        </h2>
      </div>
      <div className="faq-list">
        {loading
          ? [1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 76, marginBottom: 1 }} />
            ))
          : faqs.map((faq) => <FaqRow key={faq.id} item={faq} />)}
      </div>
    </section>
  );
}
