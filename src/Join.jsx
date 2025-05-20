import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import './App.css';
import { useNavigate } from 'react-router-dom';

function Join() {
  const [showModal, setShowModal] = useState(false);
  const [quizTab, setQuizTab] = useState('all');
  const [quizList, setQuizList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [useDefaultTime, setUseDefaultTime] = useState(true);
  const [useHint, setUseHint] = useState(true);

  useEffect(() => {
    const found = quizList.find(q => q.quiz_id === selectedQuizId);
    if (found) {
      setSelectedQuiz(found);
      setQuestionCount(found.total_questions);  // ← 이거 추가
    }
  }, [selectedQuizId, quizList]);

  const handleQuizSelect = (quizId) => {
    setSelectedQuizId(quizId);
  };
``
  const dummyRooms = [
  {
    id: 1,
    title: '같이 퀴즈 할 사람',
    quizTitle: '넌센스 퀴즈',
    participants: 3,
    maxParticipants: 8,
    showContent: true
  },
  {
    id: 2,
    title: '게임 퀴즈 스겜 ㄱㄱ',
    quizTitle: '게임 음악 퀴즈',
    participants: 5,
    maxParticipants: 8,
    showContent: true
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: i + 3,
    showContent: false
  }))
];


  const navigate = useNavigate();

  useEffect(() => {
    if (showModal) {
      fetch(`/api/quiz/list/paged?page=${currentPage}`)
        .then(res => res.json())
        .then(data => {
          setQuizList(data.quizzes);
          setTotalPages(data.totalPages);
        })
        .catch(err => {
          console.error('❌ 퀴즈 목록 불러오기 실패:', err);
        });
    }
  }, [showModal, currentPage]);

  const formatQuestionCount = (quiz) => {
    const icons = [];
    if (quiz.text_count > 0) icons.push(`📝${quiz.text_count}`);
    if (quiz.image_count > 0) icons.push(`🖼️${quiz.image_count}`);
    if (quiz.sound_count > 0) icons.push(`🔊${quiz.sound_count}`);
    const total = quiz.total_questions || 0;
    return `${total}문제${icons.length ? ' (' + icons.join(', ') + ')' : ''}`;
  };

  return (
    <Layout>
      <div style={{ padding: '60px 40px 20px' }}>
        {/* 좌측 상단 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <button className="btn-orange" onClick={() => {
            setCurrentPage(1);     // 페이지 초기화
            setModalStep(1);       // 모달 스텝 초기화
            setSelectedQuizId(null);
            setShowModal(true);
          }}>
            👤 싱글 플레이
          </button>
          <button className="btn-orange" style={{ marginLeft: '10px' }}>
            👥 대기실 생성
          </button>
        </div>

        {/* 대기실 카드 2x4 */}
        <div style={{
          backgroundColor: '#fff4e6',
          borderRadius: '20px',
          padding: '24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px 70px',
          justifyItems: 'center'
        }}>
          {dummyRooms.map((room) => (
            <div key={room.id} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: room.showContent ? 'space-between' : 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minHeight: '68px',
              width: '100%',
              maxWidth: '480px'
            }}>
              {room.showContent ? (
                <>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      backgroundColor: '#ccc'
                    }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{room.title}</div>
                      <div style={{ fontSize: '14px' }}>{room.quizTitle}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {room.participants}/{room.maxParticipants}
                    </div>
                    <button className="btn-red" style={{ marginTop: '6px' }}>
                      입장
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ))}

        </div>

        {/* 페이지닷 & 검색창 */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}>{'<'}</button>
          <span style={{ fontSize: '16px' }}>1/1</span>
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}>{'>'}</button>

          <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
            <input type="text" placeholder="검색" style={{
              border: '1px solid #aaa',
              borderRadius: '6px',
              padding: '6px 10px',
              width: '100px',
              marginRight: '8px'
            }} />
            <button className="btn-red">🔍</button>
          </div>
        </div>
      </div>

      {/* 모델 */}
      {showModal && modalStep === 1 && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>퀴즈 선택</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '16px', marginBottom: '10px' }}>
        <label>
          <input type="radio" checked={quizTab === 'all'} onChange={() => setQuizTab('all')} />
          전체 퀴즈
        </label>
        <label>
          <input type="radio" checked={quizTab === 'mine'} onChange={() => setQuizTab('mine')} />
          내 퀴즈
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <input type="text" placeholder="검색" style={{
          border: '1px solid #aaa',
          borderRadius: '6px',
          padding: '6px 10px',
          width: '400px'
        }} />
        <button className="btn-red">🔍</button>
      </div>

      <div className="quiz-grid">
        {quizList.map((quiz) => (
          <div
            key={quiz.quiz_id}
            className={`quiz-card ${selectedQuizId === quiz.quiz_id ? 'selected' : ''}`}
            onClick={() => handleQuizSelect(quiz.quiz_id)}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold' }}>{quiz.title}</div>
              <div style={{ fontSize: '14px', color: '#555' }}>{formatQuestionCount(quiz)}</div>
            </div>
            <div style={{ fontSize: '14px' }}>{quiz.author}</div>
          </div>
        ))}
      </div>

      <div className="pagination-section" style={{
        display: 'flex',  justifyContent: 'center',  alignItems: 'center', marginTop: '20px'
      }}>
        <button
          className="page-btn"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        >{'<'}</button>
        <span>{currentPage} / {totalPages}</span>
        <button
          className="page-btn"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        >{'>'}</button>

      <button
        className="btn-orange"
        onClick={(e) => {
          e.stopPropagation();
          if (!selectedQuizId) {
            alert("퀴즈를 선택해주세요!");
            return;
          }
          setModalStep(2);
        }}
      >
        다음 ▶
      </button>

      </div>
    </div>
  </div>
)}

      {/* Step 2: 퀴즈 설정 */}
      {showModal && modalStep === 2 && selectedQuiz && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>퀴즈 설정</h2>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {selectedQuiz.title}
              <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>({selectedQuiz.author} 제작)</span>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
            <label>문제 수</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min={1}
                max={selectedQuiz.total_questions}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              />
              <input
                type="number"
                min={1}
                max={selectedQuiz.total_questions}
                value={questionCount}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(selectedQuiz.total_questions, Number(e.target.value)));
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
              <span style={{ fontSize: '14px' }}>/ {selectedQuiz.total_questions}</span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label>제한 시간</label><br />
              <label style={{ fontSize: '13px', marginRight: '24px' }}>
                <input type="checkbox" checked={useDefaultTime} onChange={() => setUseDefaultTime(true)} /> 기본 시간
              </label>
              <label style={{ fontSize: '13px' }}>
                <input type="checkbox" checked={!useDefaultTime} onChange={() => setUseDefaultTime(false)} /> 제한 없음
              </label>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label>힌트</label><br />
              <label style={{ fontSize: '13px', marginRight: '24px' }}>
                <input type="checkbox" checked={useHint} onChange={() => setUseHint(true)} /> 사용함
              </label>
              <label style={{ fontSize: '13px' }}>
                <input type="checkbox" checked={!useHint} onChange={() => setUseHint(false)} /> 사용 안함
              </label>
            </div>
          </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <button className="btn-orange" style={{ borderRadius: '8px' }} onClick={() => setModalStep(1)}>
                이전 ◀
              </button>
              <button
                className="btn-orange"
                style={{ borderRadius: '8px' }}
                onClick={() => {
                  const id = selectedQuiz.quiz_id;
                  const timeFlag = useDefaultTime ? 't' : 'f';
                  const hintFlag = useHint ? 't' : 'f';

                  navigate(`/single/${id}/${questionCount}/${timeFlag}/${hintFlag}`);
                }}
              >
                플레이 ▶
            </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Join;
