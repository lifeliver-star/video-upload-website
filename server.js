const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse form data for multer
app.use(express.urlencoded({ extended: true }));

// Multer storage config to save files by category folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Category sent in form-data
    const category = req.body.category || 'uncategorized';
    const uploadPath = path.join(__dirname, 'uploads', category);

    // Create category folder if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Serve frontend static files
app.use(express.static('public'));

// Serve uploaded videos statically
app.use('/videos', express.static(path.join(__dirname, 'uploads')));

// Upload page (optional, since static serves index.html)
// app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Handle video upload with category
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.send('Video uploaded successfully!');
});

// List all uploaded videos by category
app.get('/videos-list', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) return res.json([]);

  const categories = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const result = categories.map(category => {
    const categoryPath = path.join(uploadsDir, category);
    const files = fs.readdirSync(categoryPath).filter(f => {
      // Optional: filter video files by extension
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
    });
    return {
      category,
      videos: files.map(file => ({
        filename: file,
        url: `/videos/${category}/${file}`,
      })),
    };
  });

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

