require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// 라우터 불러오기
const quizRoutes = require('./quizRoutes');
const questionRoutes = require('./questionRoutes');
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const roomRoutes = require('./roomRoutes');

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: '*', // 필요시 프론트엔드 주소로 변경
    methods: ['GET', 'POST']
  }
});

// ✅ 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ 라우터 등록
app.use('/api/quiz', quizRoutes);
app.use('/api/question', questionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);

// ✅ DB 테이블 생성
async function ensureRoomsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      password TEXT,
      max_players INT NOT NULL,
      quiz_id INT NOT NULL,
      question_count INT NOT NULL,
      use_hint BOOLEAN DEFAULT true,
      use_timer BOOLEAN DEFAULT true,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(query);
    console.log('✅ rooms 테이블 확인 완료 (없으면 생성됨)');
  } catch (err) {
    console.error('❌ rooms 테이블 생성 실패:', err);
  }
}

// ✅ Socket.IO 연결 및 이벤트 처리
const rooms = {}; // { roomId: [nickname, nickname, ...] }



io.on('connection', (socket) => {
  console.log('🟢 새 유저 접속');

  socket.on('join-room', ({ roomId, nickname }) => {
    socket.nickname = nickname;
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    if (!rooms[roomId].includes(nickname)) {
      rooms[roomId].push(nickname);
    }

    io.to(roomId).emit('update-players', rooms[roomId]);
  });

  socket.on('send-message', ({ roomId, message }) => {
    console.log(`📩 message from ${socket.nickname} to room ${roomId}:`, message);
    io.to(roomId).emit('receive-message', message);
  });

  // ✅ 이 위치로 이동!
  socket.on('disconnecting', () => {
    const joinedRooms = Array.from(socket.rooms).filter(id => id !== socket.id);
    for (const roomId of joinedRooms) {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(n => n !== socket.nickname);
        io.to(roomId).emit('update-players', rooms[roomId]);
      }
    }
  });
});

app.get('/api/room/active', async (req, res) => {
  try {
    const activeRoomIds = Object.keys(rooms)
      .filter((roomId) => rooms[roomId].length > 0)
      .map((roomId) => Number(roomId)); // 💥 여기 중요!

    if (activeRoomIds.length === 0) return res.json([]);

    const placeholders = activeRoomIds.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      SELECT r.id AS room_id, r.title, r.max_players, q.title AS quiz_title
      FROM rooms r
      JOIN quizzes q ON r.quiz_id = q.quiz_id
      WHERE r.id IN (${placeholders})
    `;

    const { rows } = await db.query(query, activeRoomIds);

    const result = rows.map((row) => ({
      id: row.room_id,
      title: row.title,
      quizTitle: row.quiz_title,
      participants: rooms[row.room_id]?.length || 0,
      maxParticipants: row.max_players,
      showContent: true
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ 활성 대기실 불러오기 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});




// ✅ 서버 실행
const port = 5000;
ensureRoomsTable().then(() => {
  server.listen(port, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${port}`);
  });
});
