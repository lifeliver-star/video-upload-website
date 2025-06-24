const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(cors()); // Optional: for cross-origin support
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Logger (optional but helpful)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ✅ Serve static files (frontend)
app.use(express.static('public'));

// ✅ Serve uploaded videos statically
app.use('/videos', express.static(path.join(__dirname, 'uploads')));

// ✅ Multer storage config (store videos by category)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'uncategorized';
    const uploadPath = path.join(__dirname, 'uploads', category);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`📁 Created upload folder: ${uploadPath}`);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ Upload video route
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('❌ No file uploaded.');
  res.send('✅ Video uploaded successfully!');
});

// ✅ Return videos grouped by category
app.get('/videos-list', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) return res.json([]);

  const categories = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const result = categories.map(category => {
    const categoryPath = path.join(uploadsDir, category);
    const files = fs.readdirSync(categoryPath).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext);
    });

    return {
      category,
      videos: files.map(filename => ({
        filename,
        url: `/videos/${category}/${filename}`,
      }))
    };
  });

  res.json(result);
});

// ✅ Analytics endpoint: Top 5 categories by video count
app.get('/analytics/top-categories', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) return res.json([]);

  const categories = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const result = categories.map(category => {
    const categoryPath = path.join(uploadsDir, category);
    const count = fs.readdirSync(categoryPath).length;
    return { category, count };
  });

  result.sort((a, b) => b.count - a.count);
  res.json(result.slice(0, 5)); // return top 5
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
