const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ✅ Serve uploaded videos publicly
app.use('/videos', express.static(path.join(__dirname, 'uploads')));

// ✅ Multer storage config with dynamic category folder creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'uncategorized';
    const uploadPath = path.join(__dirname, 'uploads', category);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Created upload folder: ${uploadPath}`);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ Upload endpoint
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No video uploaded.');
  }

  res.send('Video uploaded successfully!');
});

// ✅ List videos grouped by category
app.get('/videos-list', (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');

  if (!fs.existsSync(uploadsPath)) return res.json([]);

  const categories = fs.readdirSync(uploadsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const result = categories.map(category => {
    const categoryPath = path.join(uploadsPath, category);

    const files = fs.readdirSync(categoryPath).filter(file =>
      ['.mp4', '.webm', '.mov', '.avi'].includes(path.extname(file).toLowerCase())
    );

    return {
      category,
      videos: files.map(filename => ({
        filename,
        url: `/videos/${category}/${filename}`
      }))
    };
  });

  res.json(result);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
