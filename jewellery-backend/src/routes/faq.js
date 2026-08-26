// src/routes/faq.js
// GET /api/faq — returns all active FAQ items

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/faq — all active FAQ items in display order
router.get('/', async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: { index: 'asc' },
    });
    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch FAQs' });
  }
});

// GET /api/faq/:id — single FAQ item
router.get('/:id', async (req, res) => {
  try {
    const faq = await prisma.faq.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!faq) {
      return res.status(404).json({ success: false, error: 'FAQ not found' });
    }
    res.json({ success: true, data: faq });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch FAQ' });
  }
});

module.exports = router;
