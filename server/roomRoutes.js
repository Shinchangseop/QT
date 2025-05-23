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
    res.status(201).json({ roomId });
  } catch (err) {
    console.error('❌ 방 생성 실패:', err);
    res.status(500).json({ error: '서버 오류로 방 생성 실패' });
  }
});

// ✅ GET /api/room/:roomId
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
