const express = require('express');
const router = express.Router();
const db = require('./db'); // DB 연결 모듈

router.post('/create', async (req, res) => {
  const {
    title,
    password,
    maxPlayers,
    quizId,
    questionCount,
    useHint,
    useDefaultTime,
    createdBy
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO rooms (title, password, max_players, quiz_id, question_count, use_hint, use_timer, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [title, password, maxPlayers, quizId, questionCount, useHint, useDefaultTime, createdBy]
    );

    const roomId = result.rows[0].id;

    const roomsMemory = require('./rooms');
    roomsMemory[roomId] = [];

    res.status(201).json({ roomId });
  } catch (err) {
    console.error('❌ 방 생성 실패:', err);
    res.status(500).json({ error: '서버 오류로 방 생성 실패' });
  }
});

// 활성화된 방 목록 조회
const roomsMemory = require('./rooms');

router.get('/active', async (req, res) => {
  try {
    const query = `
      SELECT r.id AS room_id, r.title, r.max_players, r.current_players, q.title AS quiz_title
      FROM rooms r
      JOIN "Quiz" q ON r.quiz_id = q.quiz_id
      WHERE r.current_players > 0
    `;

    const { rows } = await db.query(query);

    const result = rows.map((row) => ({
      id: row.room_id,
      title: row.title,
      quizTitle: row.quiz_title,
      participants: row.current_players,
      maxParticipants: row.max_players,
      showContent: true
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ 활성 대기실 불러오기 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});



// GET /api/room/:roomId
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const result = await db.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '존재하지 않는 방입니다.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ 방 조회 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});


module.exports = router;
