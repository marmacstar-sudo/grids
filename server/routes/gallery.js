const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data');
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '..', '..', 'uploads');
const galleryPath = path.join(DATA_PATH, 'gallery.json');
const uploadsPath = UPLOADS_PATH;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uuidv4()}${ext}`);
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

const getGallery = () => {
  return JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
};

const saveGallery = (gallery) => {
  fs.writeFileSync(galleryPath, JSON.stringify(gallery, null, 2));
};

// Get all gallery images (public)
router.get('/', (req, res) => {
  try {
    const gallery = getGallery();
    // Sort by order
    gallery.sort((a, b) => a.order - b.order);
    res.json(gallery);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add gallery image (protected)
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }

    const gallery = getGallery();
    const { alt } = req.body;

    const newImage = {
      id: uuidv4(),
      image: `uploads/${req.file.filename}`,
      alt: alt || 'Gallery image',
      order: gallery.length
    };

    gallery.push(newImage);
    saveGallery(gallery);

    res.status(201).json(newImage);
  } catch (error) {
    console.error('Add gallery image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update gallery image order (protected)
router.put('/reorder', authenticateToken, (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array required' });
    }

    const gallery = getGallery();

    items.forEach(item => {
      const index = gallery.findIndex(g => g.id === item.id);
      if (index !== -1) {
        gallery[index].order = item.order;
      }
    });

    saveGallery(gallery);
    res.json(gallery.sort((a, b) => a.order - b.order));
  } catch (error) {
    console.error('Reorder gallery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update gallery image (protected)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const gallery = getGallery();
    const index = gallery.findIndex(g => g.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }

    const { alt } = req.body;
    gallery[index].alt = alt || gallery[index].alt;

    saveGallery(gallery);
    res.json(gallery[index]);
  } catch (error) {
    console.error('Update gallery image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete gallery image (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const gallery = getGallery();
    const index = gallery.findIndex(g => g.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }

    const [deleted] = gallery.splice(index, 1);

    // Reorder remaining items
    gallery.forEach((item, i) => {
      item.order = i;
    });

    saveGallery(gallery);

    res.json({ message: 'Gallery image deleted', image: deleted });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
