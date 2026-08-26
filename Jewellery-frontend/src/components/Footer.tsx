// src/components/Footer.tsx
// Site footer — static content, server component

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">JEWELLERY</div>
          <p>Earth's terrain, turned into jewellery.</p>
        </div>
        <div className="footer-column">
          <h4>EXPLORE</h4>
          <a href="#about">About</a>
          <a href="#quality">Quality</a>
          <a href="#gallery">Gallery</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="footer-column">
          <h4>SUPPORT</h4>
          <a href="#">Shipping</a>
          <a href="#">Returns</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div className="footer-column">
          <h4>CONTACT</h4>
          <a href="mailto:hello@jewellery.com">hello@jewellery.com</a>
          <a href="#">Instagram</a>
          <a href="#">Telegram</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 JEWELLERY</span>
        <span>TERRAIN JEWELLERY</span>
      </div>
    </footer>
  );
}
