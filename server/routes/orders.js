const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data');
const ordersPath = path.join(DATA_PATH, 'orders.json');

const getOrders = () => {
  return JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
};

const saveOrders = (orders) => {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
};

// Get all orders (protected)
router.get('/', authenticateToken, (req, res) => {
  try {
    const orders = getOrders();
    // Sort by date, newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order (protected)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const orders = getOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create order (public - from checkout)
router.post('/', (req, res) => {
  try {
    const orders = getOrders();
    const { 
      items, 
      total, 
      subtotal,
      shippingCost,
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress,
      shippingService,
      notes 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items required' });
    }

    // Calculate totals
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    const shipping = parseFloat(shippingCost) || 0;
    const orderTotal = parseFloat(total) || (itemsTotal + shipping);

    const newOrder = {
      id: uuidv4(),
      orderNumber: `GG-${Date.now().toString(36).toUpperCase()}`,
      items,
      subtotal: parseFloat(subtotal) || itemsTotal,
      shippingCost: shipping,
      total: orderTotal,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      shippingAddress: shippingAddress || null,
      shippingService: shippingService || null,
      shipmentId: null,
      trackingNumber: null,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'unpaid',
      yocoCheckoutId: null,
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    saveOrders(orders);

    console.log('Order created:', newOrder.orderNumber, '- Total:', `R${orderTotal}`, '(incl. R${shipping} shipping)');

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (protected)
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    saveOrders(orders);

    res.json(orders[index]);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [deleted] = orders.splice(index, 1);
    saveOrders(orders);

    res.json({ message: 'Order deleted', order: deleted });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order status (public - for confirmation page)
router.get('/:id/status', (req, res) => {
  try {
    const orders = getOrders();
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus || 'unpaid',
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment link (public - for checkout)
router.post('/:id/payment-link', async (req, res) => {
  try {
    const yocoSecretKey = process.env.YOCO_SECRET_KEY;

    if (!yocoSecretKey) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const orders = getOrders();
    const index = orders.findIndex(o => o.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[index];

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Amount in cents
    const amountInCents = Math.round(order.total * 100);

    // Get the base URL for redirects
    // Use X-Forwarded-Proto header when behind a proxy (like Render)
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    const baseUrl = process.env.BASE_URL || `${protocol}://${req.get('host')}`;

    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yocoSecretKey}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'ZAR',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        successUrl: `${baseUrl}/order-confirmation.html?orderId=${order.id}&status=success`,
        cancelUrl: `${baseUrl}/order-confirmation.html?orderId=${order.id}&status=cancelled`,
        failureUrl: `${baseUrl}/order-confirmation.html?orderId=${order.id}&status=failed`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Yoco API error:', error);
      return res.status(500).json({ error: 'Failed to create payment link' });
    }

    const checkout = await response.json();

    // Store the checkout ID on the order
    orders[index].yocoCheckoutId = checkout.id;
    saveOrders(orders);

    res.json({ paymentUrl: checkout.redirectUrl });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

module.exports = router;
