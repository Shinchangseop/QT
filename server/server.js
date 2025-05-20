require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const quizRoutes = require('./quizRoutes');
const questionRoutes = require('./questionRoutes'); // ✅ 추가
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');

app.use(cors());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/quiz', quizRoutes);
app.use('/api/question', questionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);

const port = 5000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중...`);
});
