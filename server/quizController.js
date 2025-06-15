const client = require('./db'); // PostgreSQL 연결

// 퀴즈 추가 함수
const addQuiz = async (req, res) => {
  const { creator_id, title, created_at } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO "Quiz" (created_by, title, created_at) VALUES ($1, $2, $3) RETURNING quiz_id',
      [creator_id, title, created_at]
    );
    res.status(201).json(result.rows[0]); // 성공 시 quiz_id 반환
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '퀴즈 추가 실패' });
  }
};

const getQuizById = async (quizId) => {
  const quizRes = await client.query('SELECT * FROM "Quiz" WHERE quiz_id = $1', [quizId]);
  const quiz = quizRes.rows[0];
  if (!quiz) return null;

  const questionRes = await client.query(
    'SELECT * FROM question WHERE quiz_id = $1 ORDER BY question_id',
    [quizId]
  );
  quiz.questions = questionRes.rows;
  return quiz;
};

module.exports = {
  addQuiz,
  getQuizById
};