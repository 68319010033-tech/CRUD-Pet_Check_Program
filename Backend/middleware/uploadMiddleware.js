const path = require('path');
const fs = require('fs');
const multer = require('multer');

const MAX_AVATAR_SIZE = Number(process.env.AVATAR_MAX_SIZE_BYTES || 2 * 1024 * 1024); // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
  }
  return cb(null, true);
};

const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter,
});

module.exports = {
  avatarUpload,
  MAX_AVATAR_SIZE,
  ALLOWED_MIME_TYPES,
  uploadDir,
};
