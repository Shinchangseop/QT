const express = require('express');
const router = express.Router();
const { addQuiz } = require('./quizController');
const db = require('./db');

// 퀴즈 추가
router.post('/add', addQuiz);

// 퀴즈 삭제
router.delete('/delete/:quiz_id', async (req, res) => {
  const quizId = req.params.quiz_id;

  try {
    await db.query('DELETE FROM question WHERE quiz_id = $1', [quizId]);
    await db.query('DELETE FROM "Quiz" WHERE quiz_id = $1', [quizId]);
    res.status(200).json({ message: '삭제 성공' });
  } catch (err) {
    console.error('삭제 실패:', err.message);
    res.status(500).json({ error: '삭제 중 오류 발생', detail: err.message });
  }
});

router.get('/list/paged', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const keyword = req.query.keyword || '';
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    const result = await db.query(`
      SELECT 
        q.quiz_id,
        q.title,
        u.username AS author,
        COUNT(qs.question_id) AS total_questions,
        COUNT(CASE WHEN qs.type = 'text' THEN 1 END) AS text_count,
        COUNT(CASE WHEN qs.type = 'image' THEN 1 END) AS image_count,
        COUNT(CASE WHEN qs.type = 'sound' THEN 1 END) AS sound_count
      FROM "Quiz" q
      JOIN "User" u ON q.created_by = u.user_id
      JOIN question qs ON q.quiz_id = qs.quiz_id
      WHERE LOWER(q.title) LIKE LOWER('%' || $3 || '%') -- 🔍 검색어 적용
      GROUP BY q.quiz_id, u.username
      ORDER BY q.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset, keyword]);

    const totalResult = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT 1
        FROM "Quiz" q
        JOIN question qs ON q.quiz_id = qs.quiz_id
        WHERE LOWER(q.title) LIKE LOWER('%' || $1 || '%')
        GROUP BY q.quiz_id
      ) AS filtered
    `, [keyword]);

    const total = parseInt(totalResult.rows[0].count);
    res.json({ quizzes: result.rows, totalPages: Math.ceil(total / limit) });

  } catch (err) {
    console.error('퀴즈 목록 불러오기 실패:', err.message);
    res.status(500).json({ error: '퀴즈 불러오기 실패' });
  }
});



// 관리자용 퀴즈 목록
router.get('/list/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT q.quiz_id, q.title, MAX(q.created_at) AS updated_at,
             COUNT(CASE WHEN que.type = 'text' THEN 1 END) AS text_count,
             COUNT(CASE WHEN que.type = 'image' THEN 1 END) AS image_count,
             COUNT(CASE WHEN que.type = 'sound' THEN 1 END) AS sound_count
      FROM "Quiz" q
      LEFT JOIN question que ON q.quiz_id = que.quiz_id
      GROUP BY q.quiz_id
      ORDER BY updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('전체 퀴즈 조회 실패:', err);
    res.status(500).json({ error: '전체 퀴즈 조회 실패' });
  }
});

  

// 퀴즈 목록 조회
router.get('/list/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  try {
    const result = await db.query(
      `SELECT q.quiz_id,
       q.title,
       MAX(q.created_at) AS updated_at,
       u.username AS author,
       COUNT(que.question_id) AS total_questions,
       COUNT(CASE WHEN que.type = 'text' THEN 1 END) AS text_count,
       COUNT(CASE WHEN que.type = 'image' THEN 1 END) AS image_count,
       COUNT(CASE WHEN que.type = 'sound' THEN 1 END) AS sound_count
        FROM "Quiz" q
        JOIN "User" u ON q.created_by = u.user_id
        LEFT JOIN question que ON q.quiz_id = que.quiz_id
        WHERE q.created_by = $1
        GROUP BY q.quiz_id, u.username
        ORDER BY updated_at DESC
        `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('퀴즈 목록 조회 실패:', err);
    res.status(500).json({ error: '퀴즈 목록 조회 실패' });
  }
});

router.get('/:quiz_id/questions', async (req, res) => {
    const quizId = req.params.quiz_id;
  
    try {
      const questionRes = await db.query(
        `SELECT question_id, type, text_content, media_url, answer
         FROM question
         WHERE quiz_id = $1`,
        [quizId]
      );
  
      res.json(questionRes.rows);
    } catch (err) {
      console.error('질문 불러오기 실패:', err.message);
      res.status(500).json({ error: '질문 로딩 실패' });
    }
  });
  
// 퀴즈 단일 조회
router.get('/:quiz_id', async (req, res) => {
  const quizId = req.params.quiz_id;

  try {
    const quizRes = await db.query(`SELECT * FROM "Quiz" WHERE quiz_id = $1`, [quizId]);
    if (quizRes.rows.length === 0) {
      return res.status(404).json({ error: '해당 퀴즈가 존재하지 않습니다.' });
    }

    const questionRes = await db.query(
      `SELECT question_id, type, text_content, media_url, answer FROM question WHERE quiz_id = $1`,
      [quizId]
    );

    res.json({
      quiz_id: quizId,
      title: quizRes.rows[0].title,
      questions: questionRes.rows
    });
  } catch (err) {
    console.error('퀴즈 불러오기 실패:', err.message);
    res.status(500).json({ error: '퀴즈 로딩 실패' });
  }
});

// 퀴즈 결과 저장
router.post('/result/save', async (req, res) => {
  const {
    user_id,
    quiz_id,
    total_questions,
    solved,
    correct,
    wrong,
    time_limited,
    hint_enabled,
    hint_count
  } = req.body;

  try {
    await db.query(`
      INSERT INTO "SinglePlayResult" 
      (user_id, quiz_id, total_questions, solved, correct, wrong, time_limited, hint_enabled, hint_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      user_id || null,
      quiz_id,
      total_questions,
      solved,
      correct,
      wrong,
      time_limited,
      hint_enabled,
      hint_count
    ]);

    res.status(200).json({ message: '결과 저장 성공' });
  } catch (err) {
    console.error('결과 저장 실패:', err.message);
    res.status(500).json({ error: '결과 저장 실패' });
  }
});

// 내 퀴즈 목록 조회 (RoomSettingModal에서 사용)
router.get('/my', async (req, res) => {
  const userId = parseInt(req.query.userId, 10);  // 문자열 → 숫자 변환

  if (isNaN(userId)) {
    return res.status(400).json({ error: '잘못된 userId입니다.' });
  }

  try {
    const result = await db.query(
      `SELECT q.quiz_id,
              q.title,
              u.username AS author,
              COUNT(qs.question_id) AS total_questions,
              COUNT(CASE WHEN qs.type = 'text' THEN 1 END) AS text_count,
              COUNT(CASE WHEN qs.type = 'image' THEN 1 END) AS image_count,
              COUNT(CASE WHEN qs.type = 'sound' THEN 1 END) AS sound_count
       FROM "Quiz" q
       JOIN "User" u ON q.created_by = u.user_id
       LEFT JOIN question qs ON q.quiz_id = qs.quiz_id
       WHERE q.created_by = $1
       GROUP BY q.quiz_id, u.username
       ORDER BY q.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ 내 퀴즈 불러오기 실패:', err.message);
    res.status(500).json({ error: '내 퀴즈 목록 조회 실패' });
  }
});



module.exports = router;
