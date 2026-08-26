// src/routes/orders.js
// POST /api/orders   — create a new pendant order
// GET  /api/orders   — list all orders (admin)
// GET  /api/orders/:id — get single order

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// ── Validation rules for creating an order ────────────────────────────────────
const orderValidation = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),

  body('customerEmail')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address'),

  body('customerPhone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 6, max: 25 }).withMessage('Please enter a valid phone number (6-25 digits)'),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),

  body('productId')
    .notEmpty().withMessage('Pendant size is required')
    .isInt({ min: 1 }).withMessage('Invalid product selection'),

  body('engraving')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 }).withMessage('Engraving must be 40 characters or less'),

  body('latitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  body('longitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

// ── POST /api/orders — create order ──────────────────────────────────────────
router.post('/', orderValidation, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(422).json({
      success: false,
      error: errorList.map((e) => e.message).join('. '),
      errors: errorList,
    });
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    location,
    latitude,
    longitude,
    engraving,
    productId,
  } = req.body;

  try {
    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Selected pendant size not found or unavailable',
      });
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone ? customerPhone.trim() : null,
        location: location.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        engraving: engraving ? engraving.trim() : null,
        productId: product.id,
        totalInr: product.priceInr,
        status: 'PENDING',
      },
      include: {
        product: {
          select: { name: true, sizeLabel: true, priceInr: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order in DB:', error);
    res.status(500).json({ success: false, error: 'Database error: Failed to place order' });
  }
});

// ── GET /api/orders — list all orders (admin) ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: { select: { name: true, sizeLabel: true, priceInr: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ── GET /api/orders/:id — single order ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        product: { select: { name: true, sizeLabel: true, priceInr: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// ── PATCH /api/orders/:id/status — update order status ───────────────────────
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  if (!validStatuses.includes(status)) {
    return res.status(422).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: {
        product: { select: { name: true, sizeLabel: true } },
      },
    });
    res.json({ success: true, data: order });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

module.exports = router;
