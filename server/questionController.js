const client = require('./db'); // PostgreSQL 연결

// 질문 추가 API
const addQuestion = async (req, res) => {
  const { quiz_id, type, text_content, media_url, answer } = req.body;

  try {
    // question 테이블에 질문 데이터를 삽입
    const result = await client.query(
      'INSERT INTO "question" (quiz_id, type, text_content, media_url, answer) VALUES ($1, $2, $3, $4, $5) RETURNING question_id',
      [quiz_id, type, text_content, media_url, answer]
    );

    res.status(201).json(result.rows[0]); // 생성된 question_id 반환
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '질문 추가 실패' });
  }
};

module.exports = { addQuestion };
