// RoomSettingModal.jsx
import React, { useEffect, useState } from 'react';

function RoomSettingModal({ visible, onClose, onConfirm, initialData = {}, roomId }) {
  const [modalStep, setModalStep] = useState(1);
  const [quizTab, setQuizTab] = useState('all');
  const [quizList, setQuizList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [useTimer, setUseTimer] = useState(false);
  const [useHint, setUseHint] = useState(false);

  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!visible) return;
    setTitle(initialData.title || '');
    setPassword(initialData.password || '');
    setUseTimer(initialData.use_timer || false);
    setUseHint(initialData.use_hint || false);
    setSelectedQuiz(initialData.quiz_id || null);
    setQuestionCount(initialData.question_count || 5);
  }, [visible, initialData]);

  useEffect(() => {
    const fetchQuizList = async () => {
      const baseUrl = quizTab === 'mine' ? `/api/quiz/list/${userId}` : '/api/quiz/list/paged?page=1';
      const url = searchKeyword ? `${baseUrl}&keyword=${encodeURIComponent(searchKeyword)}` : baseUrl;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setQuizList(Array.isArray(data) ? data : data.quizzes || []);
      } catch (err) {
        console.error('퀴즈 목록 로딩 실패:', err);
        setQuizList([]);
      }
    };
    fetchQuizList();
  }, [quizTab, searchKeyword]);

  const handleApply = async () => {
    const payload = {
      title,
      password,
      maxPlayers,
      use_timer: useTimer,
      use_hint: useHint,
      quiz_id: selectedQuiz,
      question_count: questionCount
    };
    try {
      const res = await fetch(`/api/room/update/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updated = await res.json();
      onConfirm(updated);
      onClose();
    } catch (err) {
      console.error('설정 업데이트 실패:', err);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {modalStep === 1 && (
          <>
            <h2>퀴즈 선택</h2>
            <div className="quiz-tab">
              <label><input type="radio" checked={quizTab === 'all'} onChange={() => setQuizTab('all')} /> 전체 퀴즈</label>
              <label><input type="radio" checked={quizTab === 'mine'} onChange={() => setQuizTab('mine')} /> 내 퀴즈</label>
            </div>
            <input type="text" placeholder="검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
            <div className="quiz-list">
              {quizList.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className={`quiz-item ${quiz.quiz_id === selectedQuiz ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedQuiz(quiz.quiz_id);
                    setQuestionCount(quiz.total_questions);
                  }}
                >
                  <strong>{quiz.title}</strong>
                  <p>{quiz.total_questions}문제 / {quiz.author}</p>
                </div>
              ))}
            </div>
            {selectedQuiz && (
              <div className="slider-section">
                <label>문제 수: {questionCount}</label>
                <input
                  type="range"
                  min={1}
                  max={quizList.find(q => q.quiz_id === selectedQuiz)?.total_questions || 30}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                />
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setModalStep(2)}>방 설정</button>
              <button onClick={handleApply}>적용</button>
              <button onClick={onClose}>취소</button>
            </div>
          </>
        )}

        {modalStep === 2 && (
          <>
            <h2>방 설정</h2>
            <label>대기실 제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />

            <label>비밀번호 (최대 8자리 숫자)</label>
            <input value={password} maxLength={8} onChange={(e) => {
              if (/^\d{0,8}$/.test(e.target.value)) setPassword(e.target.value);
            }} />

            <label>최대 인원: {maxPlayers}</label>
            <input
              type="range"
              min={2}
              max={8}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
            />

            <label>제한 시간</label>
            <label><input type="radio" checked={useTimer} onChange={() => setUseTimer(true)} /> 기본 시간</label>
            <label><input type="radio" checked={!useTimer} onChange={() => setUseTimer(false)} /> 제한 없음</label>

            <label>힌트 사용</label>
            <label><input type="radio" checked={useHint} onChange={() => setUseHint(true)} /> 사용함</label>
            <label><input type="radio" checked={!useHint} onChange={() => setUseHint(false)} /> 사용 안함</label>

            <div className="modal-actions">
              <button onClick={() => setModalStep(1)}>이전으로</button>
              <button onClick={handleApply}>적용</button>
              <button onClick={onClose}>취소</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoomSettingModal;