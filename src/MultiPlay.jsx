import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from './Layout';

const TIMER_DEFAULT = 20; // 제한 시간(초)

function MultiPlay() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);

  const [playerScores, setPlayerScores] = useState([]); // [{ name, score }]
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  // 문제 관련 state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timer, setTimer] = useState(TIMER_DEFAULT);
  const [isAnswered, setIsAnswered] = useState(false);
  const timerRef = useRef(null);

  const nickname = localStorage.getItem('nickname') || '익명';

  // socket 연결 및 실시간 이벤트 처리
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true
    });
    socketRef.current = socket;
    socket.emit('join-room', { roomId, nickname });

    socket.on('update-players', (list) => {
      setPlayerScores(old => {
        // 기존 점수 보존
        return list.map(name => {
          const prev = old.find(p => p.name === name);
          return { name, score: prev?.score || 0 };
        });
      });
    });

    socket.on('receive-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // 정답 맞춘 사람/채점 결과 브로드캐스트
    socket.on('multi-answer', ({ user, correct, nextIdx }) => {
      setIsAnswered(true);
      if (correct) {
        setChatMessages(prev => [...prev, { user: '[SYSTEM]', text: `${user}님이 정답!` }]);
        setPlayerScores(scores => scores.map(s =>
          s.name === user ? { ...s, score: s.score + 1 } : s
        ));
      }
      setTimeout(() => {
        if (nextIdx !== undefined) {
          setCurrentIdx(nextIdx);
          setIsAnswered(false);
          setTimer(TIMER_DEFAULT);
        }
      }, 1500);
    });

    // 문제 동기화
    socket.on('multi-sync-question', (idx) => {
      setCurrentIdx(idx);
      setIsAnswered(false);
      setTimer(TIMER_DEFAULT);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, nickname]);

  // 채팅 스크롤 자동 내리기
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 방/퀴즈/문제 정보 가져오기
  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then(res => res.json())
      .then(async data => {
        setRoomInfo(data);
        const quizRes = await fetch(`/api/quiz/${data.quiz_id}`);
        const quizData = await quizRes.json();
        setQuizInfo(quizData);

        // 문제 랜덤 섞어서 10문제(또는 전체)로 제한
        const qlist = (quizData.questions || [])
          .filter(q => ['text', 'image', 'sound'].includes(q.type));
        const shuffled = [...qlist].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 10));
      });
  }, [roomId]);

  // 타이머 카운트다운
  useEffect(() => {
    if (!questions[currentIdx] || isAnswered) return;
    if (timer === 0) {
      setIsAnswered(true);
      socketRef.current?.emit('multi-answer', {
        roomId,
        user: '[SYSTEM]',
        answer: null,
        correct: false,
        nextIdx: currentIdx + 1 < questions.length ? currentIdx + 1 : undefined,
      });
      return;
    }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timer, questions, currentIdx, isAnswered]);

  // 정답/채팅 입력 처리
  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    // 정답 체크(한 번만)
    if (!isAnswered && questions[currentIdx]) {
      const answers = questions[currentIdx].answer.split('/').map(a => a.trim().toLowerCase());
      const isCorrect = answers.includes(trimmed.toLowerCase());

      if (isCorrect) {
        // 서버에 "내가 정답자!" 알림
        socketRef.current.emit('multi-answer', {
          roomId,
          user: nickname,
          answer: trimmed,
          correct: true,
          nextIdx: currentIdx + 1 < questions.length ? currentIdx + 1 : undefined
        });
      } else {
        setChatMessages(prev => [...prev, { user: nickname, text: trimmed }]);
      }
    } else {
      // 그냥 채팅
      setChatMessages(prev => [...prev, { user: nickname, text: trimmed }]);
      socketRef.current?.emit('send-message', { roomId, message: { user: nickname, text: trimmed } });
    }
    setChatInput('');
  };

  // 문제 렌더링
  const currentQ = questions[currentIdx];

  return (
    <Layout>
      <div style={{ width: '80%', backgroundColor: '#fff4e6', padding: '20px', borderRadius: '20px', margin: '0 auto' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '20px' }}>

          {/* 문제 + 채팅 */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 문제 영역 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {!currentQ
                ? '문제를 불러오는 중...'
                : currentQ.type === 'image'
                ? (
                    <>
                      <img src={currentQ.media_url} alt="문제 이미지" style={{ maxHeight: '120px', marginBottom: '10px' }} />
                      <div>{currentQ.text_content}</div>
                    </>
                  )
                : currentQ.type === 'sound'
                ? (
                    <>
                      <div>🔊 사운드 문제 (미구현)</div>
                      <div>{currentQ.text_content}</div>
                    </>
                  )
                : (
                    <div>{currentQ.text_content}</div>
                  )
              }
              <div style={{ fontSize: 16, marginTop: 10, color: '#555' }}>
                <span>문제 {currentIdx + 1} / {questions.length}</span>
                {roomInfo?.use_timer && (
                  <span style={{ marginLeft: 16 }}>⏰ {timer}초</span>
                )}
              </div>
            </div>

            {/* 채팅창 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              height: '112px', // 기존 대비 30% 축소
              overflow: 'hidden'
            }}>
              <div style={{
                flex: 1,
                padding: '10px',
                overflowY: 'auto',
                fontSize: '14px',
                textAlign: 'left', // ✅ 왼쪽 정렬
                wordBreak: 'break-all'
              }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx}>
                    <strong>{msg.user}</strong>: {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid #ccc' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="정답 또는 메시지를 입력하세요..."
                  style={{ flex: 1, padding: '10px', border: 'none', outline: 'none' }}
                />
                <button className="btn-orange" style={{ borderRadius: '0 0 12px 0' }} onClick={handleSendMessage}>
                  전송
                </button>
              </div>
            </div>
          </div>

          {/* 점수판 + 버튼 */}
          <div style={{ width: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 0 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ textAlign: 'center', marginTop: 0 }}>현재 점수</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {playerScores.map((player, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    {player.name} - {player.score}점
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-orange">💡 힌트</button>
              <button className="btn-orange">⏩ 스킵</button>
              <button className="btn-orange" onClick={() => navigate('/')}>❌ 나가기</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MultiPlay;
