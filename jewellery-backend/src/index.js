// jewellery-backend/src/index.js
// Main Express server entry point

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const galleryRouter = require('./routes/gallery');
const faqRouter = require('./routes/faq');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '✨ Terrain Jewellery API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/products', productsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/faq', faqRouter);
app.use('/api/orders', ordersRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✨ Terrain Jewellery API');
  console.log(`  🚀 Server running at http://localhost:${PORT}`);
  console.log(`  🗄️  Database: PostgreSQL via Prisma`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    GET  http://localhost:${PORT}/api/products`);
  console.log(`    GET  http://localhost:${PORT}/api/gallery`);
  console.log(`    GET  http://localhost:${PORT}/api/faq`);
  console.log(`    POST http://localhost:${PORT}/api/orders`);
  console.log('');
});
