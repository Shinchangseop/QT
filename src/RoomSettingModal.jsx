import React, { useEffect, useState } from 'react';
import axios from 'axios';

function RoomSettingModal({ visible, onClose, onConfirm, initialData = {}, roomId }) {
  const [quizList, setQuizList] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [useHint, setUseHint] = useState(false);
  const [useTimer, setUseTimer] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);

  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!visible) return;

    // 초기값 세팅
    setTitle(initialData.title || '');
    setPassword(initialData.password || '');
    setUseHint(initialData.use_hint || false);
    setUseTimer(initialData.use_timer || false);
    setSelectedQuiz(initialData.quiz_id || null);
    setQuestionCount(initialData.question_count || 5);

    axios.get(`/api/quiz/my?userId=${userId}`)
      .then((res) => setQuizList(res.data))
      .catch((err) => {
        console.error('퀴즈 불러오기 실패:', err.message);
        setQuizList([]);
      });
  }, [visible, initialData]);

  const handleConfirm = async () => {
    try {
      const payload = {
        title,
        password,
        use_hint: useHint,
        use_timer: useTimer,
        quiz_id: selectedQuiz,
        question_count: questionCount,
      };
      const res = await axios.post(`/api/room/update/${roomId}`, payload);
      onConfirm(res.data); // 실시간 반영
      onClose(); // 닫기
    } catch (err) {
      console.error('설정 업데이트 실패:', err.message);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-wrapper">
        <div className="modal-content">
          <h2>대기실 설정</h2>

          <label>방 제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label>비밀번호</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />

          <label>힌트 사용</label>
          <input type="checkbox" checked={useHint} onChange={(e) => setUseHint(e.target.checked)} />

          <label>타이머 사용</label>
          <input type="checkbox" checked={useTimer} onChange={(e) => setUseTimer(e.target.checked)} />

          <label>퀴즈 선택</label>
          <div className="quiz-list">
            {quizList.map(q => (
              <div
                key={q.quiz_id}
                className={`quiz-item ${q.quiz_id === selectedQuiz ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedQuiz(q.quiz_id);
                  setQuestionCount(q.total_questions || 5); // 퀴즈 선택 시 총 문제 수 자동 세팅
                }}
              >
                <strong>{q.title}</strong>
                <p>{q.total_questions}문제 (📝{q.text_count} 🖼️{q.image_count} 🎵{q.sound_count})</p>
              </div>
            ))}
          </div>

          <label>문제 수: {questionCount}개</label>
          <input
            type="range"
            min="1"
            max={
              quizList.find(q => q.quiz_id === selectedQuiz)?.total_questions || 30
            }
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
          />

          <div className="modal-actions">
            <button className="btn-orange" onClick={handleConfirm}>확인</button>
            <button className="btn-gray" onClick={onClose}>취소</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomSettingModal;
