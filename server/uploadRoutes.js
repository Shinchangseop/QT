const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 이미지 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 저장 경로
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// POST /api/upload/image
router.post('/image', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 업로드 실패' });
    }
    res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
    console.log('업로드된 파일 경로:', req.file.path);
  });

module.exports = router;
