const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data');
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '..', '..', 'uploads');
const productsPath = path.join(DATA_PATH, 'products.json');
const uploadsPath = UPLOADS_PATH;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const getProducts = () => {
  return JSON.parse(fs.readFileSync(productsPath, 'utf8'));
};

const saveProducts = (products) => {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
};

// Get all products (public)
router.get('/', (req, res) => {
  try {
    const products = getProducts();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product (public)
router.get('/:id', (req, res) => {
  try {
    const products = getProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (protected)
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const products = getProducts();
    const { name, tag, tagIcon, description, price, specs, badge, badgeType, inStock } = req.body;

    const newProduct = {
      id: uuidv4(),
      name,
      tag: tag || '',
      tagIcon: tagIcon || 'fas fa-star',
      description,
      price: parseFloat(price),
      image: req.file ? `uploads/${req.file.filename}` : '',
      specs: typeof specs === 'string' ? JSON.parse(specs) : specs || [],
      badge: badge || '',
      badgeType: badgeType || 'bestseller',
      inStock: inStock === 'true' || inStock === true,
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (protected)
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const products = getProducts();
    const index = products.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, tag, tagIcon, description, price, specs, badge, badgeType, inStock } = req.body;

    products[index] = {
      ...products[index],
      name: name || products[index].name,
      tag: tag !== undefined ? tag : products[index].tag,
      tagIcon: tagIcon || products[index].tagIcon,
      description: description || products[index].description,
      price: price ? parseFloat(price) : products[index].price,
      image: req.file ? `uploads/${req.file.filename}` : products[index].image,
      specs: specs ? (typeof specs === 'string' ? JSON.parse(specs) : specs) : products[index].specs,
      badge: badge !== undefined ? badge : products[index].badge,
      badgeType: badgeType || products[index].badgeType,
      inStock: inStock !== undefined ? (inStock === 'true' || inStock === true) : products[index].inStock,
      updatedAt: new Date().toISOString()
    };

    saveProducts(products);
    res.json(products[index]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const products = getProducts();
    const index = products.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [deleted] = products.splice(index, 1);
    saveProducts(products);

    res.json({ message: 'Product deleted', product: deleted });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle stock status (protected)
router.patch('/:id/stock', authenticateToken, (req, res) => {
  try {
    const products = getProducts();
    const index = products.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[index].inStock = !products[index].inStock;
    products[index].updatedAt = new Date().toISOString();
    saveProducts(products);

    res.json(products[index]);
  } catch (error) {
    console.error('Toggle stock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
