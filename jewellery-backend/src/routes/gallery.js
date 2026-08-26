// src/routes/gallery.js
// GET /api/gallery — returns all active gallery items

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/gallery — all active gallery items in display order
router.get('/', async (req, res) => {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { isActive: true },
      orderBy: { index: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch gallery' });
  }
});

// GET /api/gallery/:id — single gallery item
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.galleryItem.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Gallery item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch gallery item' });
  }
});

module.exports = router;
