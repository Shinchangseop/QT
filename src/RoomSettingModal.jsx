// RoomSettingModal.jsx
import React, { useState, useEffect } from 'react';

function RoomSettingModal({ visible, onClose, onConfirm, initialData = {} }) {
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [useTimer, setUseTimer] = useState(false);
  const [useHint, setUseHint] = useState(false);
  const [quizList, setQuizList] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    if (!visible) return;
    // 초기값 반영
    setTitle(initialData.title || '');
    setPassword(initialData.password || '');
    setUseTimer(initialData.use_timer || false);
    setUseHint(initialData.use_hint || false);
    setSelectedQuizId(initialData.quiz_id || null);

    // 퀴즈 목록 불러오기
    fetch('/api/quiz/my')
      .then(res => res.json())
      .then(setQuizList)
      .catch(console.error);
  }, [visible, initialData]);

  const handleConfirm = () => {
    onConfirm({
      title,
      password,
      use_timer: useTimer,
      use_hint: useHint,
      quiz_id: selectedQuizId,
    });
  };

  if (!visible) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>대기실 설정 변경</h2>
        <label>방 제목</label>
        <input value={title} onChange={e => setTitle(e.target.value)} />

        <label>비밀번호</label>
        <input value={password} onChange={e => setPassword(e.target.value)} />

        <label>
          <input type="checkbox" checked={useTimer} onChange={e => setUseTimer(e.target.checked)} />
          제한 시간 사용
        </label>

        <label>
          <input type="checkbox" checked={useHint} onChange={e => setUseHint(e.target.checked)} />
          힌트 사용
        </label>

        <label>퀴즈 선택</label>
        <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(Number(e.target.value))} // ✅ 정수로 변환
            >
          {quizList.map(q => (
            <option key={q.quiz_id} value={q.quiz_id}>{q.title}</option>
          ))}
        </select>

        <div className="modal-actions">
          <button className="btn-orange" onClick={handleConfirm}>확인</button>
          <button className="btn-gray" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

export default RoomSettingModal;
