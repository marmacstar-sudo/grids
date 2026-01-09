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
const productsPath = path.join(DATA_PATH, 'products.json');
const galleryPath = path.join(DATA_PATH, 'gallery.json');
const ordersPath = path.join(DATA_PATH, 'orders.json');
const membersPath = path.join(DATA_PATH, 'members.json');
const travelPostsPath = path.join(DATA_PATH, 'travel-posts.json');

const initializeData = async () => {
  try {
    // Initialize users.json with admin user
    if (!fs.existsSync(usersPath)) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const users = [{
        id: 'admin-1',
        username: 'admin',
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }];
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      console.log('Created users.json with default admin');
    } else {
      // Check if password needs to be hashed
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      if (users.length > 0 && users[0].password === '$2b$10$YourHashedPasswordHere') {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        users[0].password = hashedPassword;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        console.log('Default admin password initialized');
      }
    }

    // Initialize other data files if they don't exist
    if (!fs.existsSync(productsPath)) {
      fs.writeFileSync(productsPath, '[]');
      console.log('Created empty products.json');
    }
    if (!fs.existsSync(galleryPath)) {
      fs.writeFileSync(galleryPath, '[]');
      console.log('Created empty gallery.json');
    }
    if (!fs.existsSync(ordersPath)) {
      fs.writeFileSync(ordersPath, '[]');
      console.log('Created empty orders.json');
    }
    if (!fs.existsSync(membersPath)) {
      fs.writeFileSync(membersPath, '[]');
      console.log('Created empty members.json');
    }
    if (!fs.existsSync(travelPostsPath)) {
      fs.writeFileSync(travelPostsPath, '[]');
      console.log('Created empty travel-posts.json');
    }

    // Ensure travels upload directory exists
    const travelsUploadPath = path.join(UPLOADS_PATH, 'travels');
    if (!fs.existsSync(travelsUploadPath)) {
      fs.mkdirSync(travelsUploadPath, { recursive: true });
      console.log('Created travels upload directory');
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const galleryRoutes = require('./routes/gallery');
const ordersRoutes = require('./routes/orders');
const webhooksRoutes = require('./routes/webhooks');
const memberAuthRoutes = require('./routes/memberAuth');
const travelPostsRoutes = require('./routes/travelPosts');

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/members', memberAuthRoutes);
app.use('/api/travels', travelPostsRoutes);

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Serve In The Wild pages
app.get('/wild', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'wild', 'index.html'));
});

app.get('/wild/*', (req, res) => {
  const requestedFile = req.params[0];
  const filePath = path.join(__dirname, '..', 'wild', requestedFile);

  // Check if file exists, otherwise serve index.html
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, '..', 'wild', 'index.html'));
  }
});

// Initialize and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    console.log(`In The Wild: http://localhost:${PORT}/wild`);
  });
});
