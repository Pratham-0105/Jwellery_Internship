'use client';
// src/components/Header.tsx
// Fixed navigation bar with mobile menu and smooth scroll to #customizer

import { useState } from 'react';

interface HeaderProps {
  onOpenCustomizer: () => void;
}

export default function Header({ onOpenCustomizer }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="header">
        <a href="#home" className="logo">JEWELLERY</a>

        <nav className="nav">
          <a href="#about">About</a>
          <a href="#quality">Quality</a>
          <a href="#gallery">Gallery</a>
          <a href="#pricing">Price</a>
          <button
            className="nav-create"
            onClick={onOpenCustomizer}
            id="header-create-btn"
          >
            Proceed <span>↗</span>
          </button>
        </nav>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      <div className={`mobile-nav${menuOpen ? ' open' : ''}`} role="navigation">
        <a href="#about" onClick={closeMenu}>About</a>
        <a href="#quality" onClick={closeMenu}>Quality</a>
        <a href="#gallery" onClick={closeMenu}>Gallery</a>
        <a href="#pricing" onClick={closeMenu}>Price</a>
        <button
          onClick={() => { onOpenCustomizer(); closeMenu(); }}
          id="mobile-create-btn"
        >
          Proceed →
        </button>
      </div>
    </>
  );
}
