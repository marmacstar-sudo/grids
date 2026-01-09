const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data');
const ordersPath = path.join(DATA_PATH, 'orders.json');

const getOrders = () => {
  return JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
};

const saveOrders = (orders) => {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
};

// Yoco webhook handler
// Note: This route receives raw body for potential signature verification
router.post('/yoco', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const payload = req.body.toString();
    const event = JSON.parse(payload);

    console.log('Yoco webhook received:', event.type);

    if (event.type === 'checkout.succeeded') {
      const checkoutId = event.payload?.id;
      const metadata = event.payload?.metadata;
      const orderId = metadata?.orderId;

      console.log(`Payment succeeded for checkout: ${checkoutId}, orderId: ${orderId}`);

      if (orderId) {
        const orders = getOrders();
        const index = orders.findIndex(o => o.id === orderId);

        if (index !== -1) {
          orders[index].paymentStatus = 'paid';
          orders[index].paidAt = new Date().toISOString();
          saveOrders(orders);
          console.log(`Order ${orderId} marked as paid`);
        } else {
          console.warn(`Order ${orderId} not found for webhook`);
        }
      } else {
        // Try to find by yocoCheckoutId
        const orders = getOrders();
        const index = orders.findIndex(o => o.yocoCheckoutId === checkoutId);

        if (index !== -1) {
          orders[index].paymentStatus = 'paid';
          orders[index].paidAt = new Date().toISOString();
          saveOrders(orders);
          console.log(`Order ${orders[index].id} marked as paid (matched by checkoutId)`);
        }
      }
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still respond 200 to prevent retries for parse errors
    res.status(200).send('OK');
  }
});

module.exports = router;
