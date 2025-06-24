const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ✅ Serve uploaded files
app.use('/videos', express.static(path.join(__dirname, 'uploads')));

// ✅ Multer storage config with dynamic folder creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'uncategorized';
    const uploadPath = path.join(__dirname, 'uploads', category);

    // ✅ Create the folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Created folder: ${uploadPath}`);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });


// Handle video upload with category
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.send('Video uploaded successfully!');
});

// ✅ Route to list all uploaded videos (grouped by category)
app.get('/videos-list', (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsPath)) return res.json([]);

  const categories = fs.readdirSync(uploadsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const result = categories.map(category => {
    const categoryPath = path.join(uploadsPath, category);
    const files = fs.readdirSync(categoryPath).filter(f => {
      return ['.mp4', '.webm', '.avi', '.mov'].includes(path.extname(f).toLowerCase());
    });

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
  console.log(`Server running on http://localhost:${PORT}`);
});
