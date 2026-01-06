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
    const { items, total, customerName, customerEmail, customerPhone, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items required' });
    }

    const newOrder = {
      id: uuidv4(),
      orderNumber: `BG-${Date.now().toString(36).toUpperCase()}`,
      items,
      total: parseFloat(total) || items.reduce((sum, item) => sum + item.price, 0),
      customerName: customerName || 'WhatsApp Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    saveOrders(orders);

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

module.exports = router;
