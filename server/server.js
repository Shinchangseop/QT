require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const quizRoutes = require('./quizRoutes');
const questionRoutes = require('./questionRoutes'); // ✅ 추가
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // 이미지 접근 가능하게 설정

app.use('/api/quiz', quizRoutes);
app.use('/api/question', questionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);

const port = 5000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중...`);
});
