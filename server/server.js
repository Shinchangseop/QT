require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const { getQuizById } = require('./quizController');

// 라우터 불러오기
const quizRoutes = require('./quizRoutes');
const questionRoutes = require('./questionRoutes');
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const roomRoutes = require('./roomRoutes');

const app = express();
const server = http.createServer(app);

const multiPlayState = {};

// ✅ Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: 'https://qtweb.xyz',
    methods: ['GET', 'POST'],
    credentials: true
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
  const createTableQuery = `
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

  const addColumnQuery = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='rooms' AND column_name='current_players'
      ) THEN
        ALTER TABLE rooms ADD COLUMN current_players INT DEFAULT 0;
      END IF;
    END
    $$;
  `;

  try {
    await db.query(createTableQuery);
    await db.query(addColumnQuery);
    console.log('✅ rooms 테이블 및 current_players 컬럼 확인 완료');
  } catch (err) {
    console.error('❌ rooms 테이블 또는 컬럼 생성 실패:', err);
  }
}


// ✅ Socket.IO 연결 및 이벤트 처리
const rooms = require('./rooms'); // { roomId: [nickname, nickname, ...] }



io.on('connection', (socket) => {
  console.log('🟢 새 유저 접속');

  socket.on('join-room', async ({ roomId, nickname }) => {
    socket.nickname = nickname;
    socket.roomId = roomId;
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];

    if (!rooms[roomId].includes(nickname)) {
      rooms[roomId].push(nickname);

      await db.query(
        'UPDATE rooms SET current_players = current_players + 1 WHERE id = $1',
        [roomId]
      );
    }

    // 본인 + 다른 참가자 모두에게 전송
    socket.emit('update-players', rooms[roomId]);
    socket.to(roomId).emit('update-players', rooms[roomId]);
    socket.emit('init-scores', multiPlayState[roomId]?.scores || {});

    if (multiPlayState[roomId]?.questions?.length > 0) {
      socket.emit('start-quiz', { questions: multiPlayState[roomId].questions });
      socket.emit('game-started');
    }

    await broadcastRoomList();
  });


  socket.on('send-message', ({ roomId, message }) => {
    console.log(`📩 message from ${socket.nickname} to room ${roomId}:`, message);
    io.to(roomId).emit('receive-message', message);
  });

  socket.on('start-game', async ({ roomId }) => {
    console.log(`🎮 ${roomId} 게임 시작`);

    const participants = rooms[roomId] || [];

    // 상태 초기화
    multiPlayState[roomId] = {
      quiz_id: null,
      questions: [],
      answered: false,
      scores: {}
    };

    // DB에서 퀴즈 ID 받아오기
    const roomRes = await db.query('SELECT quiz_id FROM rooms WHERE id = $1', [roomId]);
    const quizId = roomRes.rows[0]?.quiz_id;
    if (!quizId) {
      console.error('❌ 퀴즈 ID 불러오기 실패');
      return;
    }

    multiPlayState[roomId].quiz_id = quizId;

    const quizData = await getQuizById(quizId);
    const allQuestions = quizData.questions.filter(q =>
      ['text', 'image', 'sound'].includes(q.type)
    );

    const seen = new Set();
    const unique = [];
    for (let q of allQuestions.sort(() => 0.5 - Math.random())) {
      const key = q.text_content + (q.media_url || '');
      if (!seen.has(key)) {
        unique.push(q);
        seen.add(key);
        if (unique.length >= 10) break;
      }
    }

    multiPlayState[roomId].questions = unique;

    // 점수 초기화
    const initialScores = {};
    participants.forEach(name => {
      initialScores[name] = 0;
    });
    multiPlayState[roomId].scores = initialScores;

    // 클라이언트 전송
    io.to(roomId).emit('init-scores', initialScores);
    io.to(roomId).emit('start-quiz', { questions: unique });
    io.to(roomId).emit('game-started');
    console.log(`✅ 문제 ${unique.length}개 전송됨`);
  });


  // ✅ 이 위치로 이동!
  socket.on('disconnecting', async () => {
    const joinedRooms = Array.from(socket.rooms).filter(id => id !== socket.id);
    for (const roomId of joinedRooms) {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(n => n !== socket.nickname);
        io.to(roomId).emit('update-players', rooms[roomId]);

        // ✅ DB 참가자 수 감소
        await db.query(
          'UPDATE rooms SET current_players = GREATEST(current_players - 1, 0) WHERE id = $1',
          [roomId]
        );
      }
    }
    await broadcastRoomList();
  });

    // 멀티 정답 처리
  socket.on('multi-answer', ({ roomId, user, answer, correct, nextIdx }) => {
    // 방 상태 생성
    if (!multiPlayState[roomId]) {
      multiPlayState[roomId] = { answered: false, scores: {} };
    }

    // 선착순 처리 (이미 맞춘 사람 있으면 무시)
    if (multiPlayState[roomId].answered) return;

    if (correct) {
      multiPlayState[roomId].answered = true;

      if (user !== '[SYSTEM]') {
        // 점수 초기화가 안 되어 있으면 0으로 설정
        if (!multiPlayState[roomId].scores[user]) {
          multiPlayState[roomId].scores[user] = 0;
        }
        multiPlayState[roomId].scores[user] += 1;
      }
    }


    // 모두에게 정답 결과와 다음 문제 인덱스 브로드캐스트
    io.to(roomId).emit('multi-answer', {
      user,
      correct,
      nextIdx,
      scores: multiPlayState[roomId].scores,
    });


    // 다음 문제로 넘어갈 때 answered 플래그 리셋
    if (correct && nextIdx !== undefined) {
      setTimeout(() => {
        multiPlayState[roomId].answered = false;
        // 문제 인덱스 동기화
        io.to(roomId).emit('multi-sync-question', nextIdx);
      }, 1200);
    }
  });
});

app.get('/api/room/active', async (req, res) => {
  try {
    const activeRoomIds = Object.keys(rooms)
      .filter((roomId) => rooms[roomId].length > 0)
      .map((roomId) => Number(roomId));

    console.log('🔍 activeRoomIds:', activeRoomIds);

    if (activeRoomIds.length === 0) {
      console.log('ℹ️ No active rooms — returning empty list');
      return res.json([]); // 빈 배열 응답
    }

    const placeholders = activeRoomIds.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      SELECT r.id AS room_id, r.title, r.max_players, q.title AS quiz_title
      FROM rooms r
      JOIN "Quiz" q ON r.quiz_id = q.quiz_id
      WHERE r.id IN (${placeholders})
    `;

    console.log('🧪 SQL:', query);
    console.log('🧪 params:', activeRoomIds);

    const { rows } = await db.query(query, activeRoomIds);

    const result = rows.map((row) => ({
      id: row.room_id,
      title: row.title,
      quizTitle: row.quiz_title,
      participants: rooms[String(row.room_id)]?.length || 0,
      maxParticipants: row.max_players,
      showContent: true
    }));

    console.log('✅ room list sent:', result);
    res.json(result);
  } catch (err) {
    console.error('❌ 활성 대기실 불러오기 실패:', err.stack);
    res.status(500).json({ error: '서버 오류' });
  }
});

async function resetPlayerCounts() {
  try {
    await db.query('UPDATE rooms SET current_players = 0');
    console.log('🔄 모든 방 current_players 초기화 완료');
  } catch (err) {
    console.error('❌ current_players 초기화 실패:', err);
  }
}

// 대기실 목록 브로드캐스트 함수 추가
async function broadcastRoomList() {
  const activeRoomIds = Object.keys(rooms).filter(id => rooms[id].length > 0).map(Number);
  if (activeRoomIds.length === 0) {
    io.emit('update-room-list', []);
    return;
  }

  const placeholders = activeRoomIds.map((_, i) => `$${i + 1}`).join(', ');
  const query = `
    SELECT r.id AS room_id, r.title, r.max_players, q.title AS quiz_title
    FROM rooms r
    JOIN "Quiz" q ON r.quiz_id = q.quiz_id
    WHERE r.id IN (${placeholders})
  `;
  const { rows } = await db.query(query, activeRoomIds);

  const result = rows.map(row => ({
    id: row.room_id,
    title: row.title,
    quizTitle: row.quiz_title,
    participants: rooms[String(row.room_id)]?.length || 0,
    maxParticipants: row.max_players,
    showContent: true
  }));

  io.emit('update-room-list', result);
}


// ✅ 서버 실행
const port = 5000;
ensureRoomsTable().then(async () => {
  await resetPlayerCounts(); // 👈 여기에 삽입!
  server.listen(port, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${port}`);
  });
});

module.exports = { server, rooms };