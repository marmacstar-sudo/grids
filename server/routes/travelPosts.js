const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { authenticateMember } = require('../middleware/memberAuth');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data');
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '..', '..', 'uploads');
const postsPath = path.join(DATA_PATH, 'travel-posts.json');
const membersPath = path.join(DATA_PATH, 'members.json');
const travelsUploadPath = path.join(UPLOADS_PATH, 'travels');

// Ensure travels upload directory exists
if (!fs.existsSync(travelsUploadPath)) {
  fs.mkdirSync(travelsUploadPath, { recursive: true });
}

// Configure multer for multiple image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, travelsUploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `travel-${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
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

const getPosts = () => {
  return JSON.parse(fs.readFileSync(postsPath, 'utf8'));
};

const savePosts = (posts) => {
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
};

const getMembers = () => {
  return JSON.parse(fs.readFileSync(membersPath, 'utf8'));
};

// Helper to get member public info
const getMemberPublicInfo = (memberId) => {
  const members = getMembers();
  const member = members.find(m => m.id === memberId);
  if (!member) return null;
  return {
    id: member.id,
    displayName: member.displayName,
    avatarImage: member.avatarImage
  };
};

// Get all posts (public feed)
router.get('/', (req, res) => {
  try {
    const posts = getPosts();

    // Sort by newest first
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Add member info to each post
    const postsWithMembers = posts.map(post => ({
      ...post,
      member: getMemberPublicInfo(post.memberId)
    }));

    res.json(postsWithMembers);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get posts for map (minimal data)
router.get('/map', (req, res) => {
  try {
    const posts = getPosts();

    // Return only data needed for map pins
    const mapData = posts
      .filter(post => post.location && post.location.lat && post.location.lng)
      .map(post => ({
        id: post.id,
        location: post.location,
        thumbnail: post.photos[0] || null,
        memberName: getMemberPublicInfo(post.memberId)?.displayName || 'Unknown'
      }));

    res.json(mapData);
  } catch (error) {
    console.error('Get map data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post
router.get('/:id', (req, res) => {
  try {
    const posts = getPosts();
    const post = posts.find(p => p.id === req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      ...post,
      member: getMemberPublicInfo(post.memberId)
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get posts by member
router.get('/member/:memberId', (req, res) => {
  try {
    const posts = getPosts();
    const memberPosts = posts
      .filter(p => p.memberId === req.params.memberId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const member = getMemberPublicInfo(req.params.memberId);

    res.json({
      member,
      posts: memberPosts
    });
  } catch (error) {
    console.error('Get member posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new post (protected)
router.post('/', authenticateMember, upload.array('photos', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    const { description, lat, lng, placeName, formattedAddress } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const posts = getPosts();
    const now = new Date().toISOString();

    const newPost = {
      id: uuidv4(),
      memberId: req.member.id,
      description,
      photos: req.files.map(f => `uploads/travels/${f.filename}`),
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        placeName: placeName || '',
        formattedAddress: formattedAddress || ''
      },
      createdAt: now,
      updatedAt: now
    };

    posts.push(newPost);
    savePosts(posts);

    res.status(201).json({
      ...newPost,
      member: getMemberPublicInfo(req.member.id)
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post (protected - owner only)
router.put('/:id', authenticateMember, (req, res) => {
  try {
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === req.params.id);

    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check ownership
    if (posts[postIndex].memberId !== req.member.id) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { description, lat, lng, placeName, formattedAddress } = req.body;

    if (description) posts[postIndex].description = description;
    if (lat && lng) {
      posts[postIndex].location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        placeName: placeName || posts[postIndex].location.placeName,
        formattedAddress: formattedAddress || posts[postIndex].location.formattedAddress
      };
    }
    posts[postIndex].updatedAt = new Date().toISOString();

    savePosts(posts);

    res.json({
      ...posts[postIndex],
      member: getMemberPublicInfo(req.member.id)
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post (protected - owner only)
router.delete('/:id', authenticateMember, (req, res) => {
  try {
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === req.params.id);

    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check ownership
    if (posts[postIndex].memberId !== req.member.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    const [deleted] = posts.splice(postIndex, 1);
    savePosts(posts);

    res.json({ message: 'Post deleted', post: deleted });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
