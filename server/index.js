const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths (support Render.com deployment)
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', 'data');
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH, { recursive: true });

// Export paths for routes
module.exports.DATA_PATH = DATA_PATH;
module.exports.UPLOADS_PATH = UPLOADS_PATH;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(UPLOADS_PATH));

// Initialize default admin user if not exists
const usersPath = path.join(DATA_PATH, 'users.json');
const initializeAdmin = async () => {
  try {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    if (users.length === 1 && users[0].password === '$2b$10$YourHashedPasswordHere') {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      users[0].password = hashedPassword;
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      console.log('Default admin password initialized');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

// Routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const galleryRoutes = require('./routes/gallery');
const ordersRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/orders', ordersRoutes);

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Initialize and start server
initializeAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
});
