import React, { useEffect, useState } from 'react';

function RoomSettingModal({
  visible,
  onClose,
  onConfirm,
  initialData = {},
  quizListApi,  // /api/quiz/list/paged?page=1&keyword=...
  myQuizListApi, // /api/quiz/list/:user_id
  roomId,
  nickname
}) {
  // 1단계: 퀴즈 선택, 2단계: 방 설정
  const [modalStep, setModalStep] = useState(1);

  // 퀴즈 선택 관련
  const [quizTab, setQuizTab] = useState('all');
  const [quizList, setQuizList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 방 설정 관련
  const [roomTitle, setRoomTitle] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [useDefaultTime, setUseDefaultTime] = useState(true);
  const [useHint, setUseHint] = useState(true);

  // 최초 진입시 초기 데이터 반영
  useEffect(() => {
    if (!visible) return;
    setModalStep(1);
    setRoomTitle(initialData.title || '');
    setRoomPassword(initialData.password || '');
    setMaxPlayers(initialData.max_players || 8);
    setUseDefaultTime(initialData.use_timer ?? true);
    setUseHint(initialData.use_hint ?? true);
    setSelectedQuizId(initialData.quiz_id || null);
    setQuestionCount(initialData.question_count || 1);
  }, [visible, initialData]);

  // 퀴즈 목록 불러오기 (탭/검색/페이지)
  useEffect(() => {
    if (!visible || modalStep !== 1) return;
    let url = '';
    if (quizTab === 'all') {
      url = `/api/quiz/list/paged?page=${currentPage}`;
      if (searchKeyword) url += `&keyword=${encodeURIComponent(searchKeyword)}`;
    } else {
      const userId = localStorage.getItem('user_id');
      url = `/api/quiz/list/${userId}`;
      // mine에서 검색은 프론트에서 filter
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let list = data.quizzes || data; // paged는 quizzes, mine은 배열
        if (quizTab === 'mine' && searchKeyword) {
          const lower = searchKeyword.toLowerCase();
          list = list.filter(q => q.title.toLowerCase().includes(lower));
        }
        setQuizList(list);
        setTotalPages(data.totalPages || 1);
      });
  }, [quizTab, searchKeyword, currentPage, visible, modalStep]);

  // 퀴즈 선택 시 상세 정보 반영
  useEffect(() => {
    const found = quizList.find(q => q.quiz_id === selectedQuizId);
    setSelectedQuiz(found || null);
    if (found) setQuestionCount(found.total_questions);
  }, [selectedQuizId, quizList]);

  const formatQuestionCount = (quiz) => {
    const icons = [];
    if (quiz.text_count > 0) icons.push(`📝${quiz.text_count}`);
    if (quiz.image_count > 0) icons.push(`🖼️${quiz.image_count}`);
    if (quiz.sound_count > 0) icons.push(`🔊${quiz.sound_count}`);
    const total = quiz.total_questions || 0;
    return `${total}문제${icons.length ? ' (' + icons.join(', ') + ')' : ''}`;
  };

  const handleApply = async () => {
    // 적용 버튼 클릭(어느 단계든 동작)
    const body = {
      title: roomTitle,
      password: roomPassword,
      maxPlayers,
      use_timer: useDefaultTime,
      use_hint: useHint,
      quiz_id: selectedQuizId,
      question_count: questionCount,
    };
    try {
      const res = await fetch(`/api/room/update/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const updated = await res.json();
      onConfirm(updated); // 즉시 반영
      onClose();
    } catch (err) {
      console.error('설정 변경 실패:', err);
    }
  };

  const handleEnterKey = (e) => {
    if (e.key === 'Enter') setCurrentPage(1);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 650, maxWidth: 900 }}>
        {/* 1단계: 퀴즈 선택 */}
        {modalStep === 1 && (
          <>
            <h2>퀴즈 선택</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '16px', marginBottom: '10px' }}>
              <label>
                <input
                  type="radio"
                  checked={quizTab === 'all'}
                  onChange={() => {
                    setQuizTab('all');
                    setCurrentPage(1);
                  }}
                />
                전체 퀴즈
              </label>
              <label>
                <input
                  type="radio"
                  checked={quizTab === 'mine'}
                  onChange={() => {
                    setQuizTab('mine');
                    setCurrentPage(1);
                  }}
                />
                내 퀴즈
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={handleEnterKey}
                style={{
                  border: '1px solid #aaa',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  width: '400px'
                }}
              />
              <button className="btn-red" onClick={() => setCurrentPage(1)}>🔍</button>
            </div>

            <div
                className="quiz-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '14px',
                    marginTop: '18px',
                }}
                >
              {quizList.map((quiz) => (
                <div
                key={quiz.quiz_id}
                className={`quiz-card ${selectedQuizId === quiz.quiz_id ? 'selected' : ''}`}
                  onClick={() => setSelectedQuizId(quiz.quiz_id)}
                   style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', background: 'white'
                }}
                >
                <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '2px' }}>{quiz.title}</div>
                    <div style={{ fontSize: '13px', color: '#555' }}>{formatQuestionCount(quiz)}</div>
                </div>
                <div style={{ flex: 0, minWidth: '80px', textAlign: 'right', fontSize: '14px', color: '#888' }}>{quiz.author}</div>
                </div>
              ))}
            </div>

            {/* 문제 수 슬라이더 */}
            {selectedQuiz && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                <input
                  type="range"
                  min={1}
                  max={selectedQuiz?.total_questions || 1}
                  value={questionCount}
                  disabled={!selectedQuiz}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                />
                <input
                  type="number"
                  min={1}
                  max={selectedQuiz?.total_questions || 1}
                  value={questionCount}
                  disabled={!selectedQuiz}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(selectedQuiz?.total_questions || 1, Number(e.target.value)));
                    setQuestionCount(val);
                  }}
                  style={{
                    width: '40px',
                    textAlign: 'center',
                    fontSize: '14px',
                    padding: '2px 4px',
                    border: '1px solid #ccc',
                    borderRadius: '6px'
                  }}
                />
                <span>/ {selectedQuiz?.total_questions || 0} 문제</span>
              </div>
            )}

            {/* 페이지네이션 */}
            {quizTab === 'all' && (
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >{'<'}</button>
                <span>{currentPage} / {totalPages}</span>
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >{'>'}</button>
              </div>
            )}

            {/* 하단 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: 28 }}>
              <button className="btn-orange" onClick={() => setModalStep(2)}>방 설정</button>
              <button className="btn-orange" onClick={handleApply}>적용</button>
              <button className="btn-orange" onClick={onClose}>취소</button>
            </div>

          </>
        )}

        {/* 2단계: 방 설정 */}
        {modalStep === 2 && (
          <>
            <h2>방 설정</h2>

            {/* 대기실 제목 */}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ marginRight: '6px', fontWeight: 'bold', fontSize: '15px' }}>대기실 제목</label>
                <input
                type="text"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                style={{
                    width: '220px',
                    padding: '8px 10px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '6px'
                }}
                />
            </div>
            </div>


            {/* 비밀번호 */}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}></div>
              <label style={{ marginRight: '6px', fontWeight: 'bold', fontSize: '15px' }}>비밀번호</label>
              <input
                type="text"
                value={roomPassword}
                maxLength={8}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,8}$/.test(val)) setRoomPassword(val);
                }}
                    style={{
                    width: '320px',
                    padding: '8px',
                    fontSize: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    margin: '0 auto'
                    }}
              />
            </div>

            {/* 최대 인원 */}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}></div>
              <label style={{ marginRight: '6px', fontWeight: 'bold', fontSize: '15px' }}>최대 인원</label>
              <input
                type="range"
                min={2}
                max={8}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    style={{
                    width: '200px',
                    padding: '8px',
                    fontSize: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    margin: '0 auto'
                    }}
                
              />
              <span>{maxPlayers}명</span>
            </div>

            {/* 제한 시간 */}
            <div style={{ marginBottom: '16px' }}>
              <label>제한 시간</label>
              <div>
                <label style={{ marginRight: 24 }}>
                  <input type="radio" checked={useDefaultTime} onChange={() => setUseDefaultTime(true)} /> 기본 시간
                </label>
                <label>
                  <input type="radio" checked={!useDefaultTime} onChange={() => setUseDefaultTime(false)} /> 제한 없음
                </label>
              </div>
            </div>

            {/* 힌트 사용 */}
            <div style={{ marginBottom: '16px' }}>
              <label>힌트 사용</label>
              <div>
                <label style={{ marginRight: 24 }}>
                  <input type="radio" checked={useHint} onChange={() => setUseHint(true)} /> 사용함
                </label>
                <label>
                  <input type="radio" checked={!useHint} onChange={() => setUseHint(false)} /> 사용 안함
                </label>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: 28 }}>
              <button className="btn-orange" onClick={() => setModalStep(1)}>이전으로</button>
              <button className="btn-orange" onClick={handleApply}>적용</button>
              <button className="btn-orange" onClick={onClose}>취소</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoomSettingModal;
