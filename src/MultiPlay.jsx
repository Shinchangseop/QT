import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import YouTube from 'react-youtube';
import Layout from './Layout';

// 퀴즈 정보 영역 렌더
function QuizHeader({ quizTitle, currentIdx, total, timer }) {
  return (
    <div style={{
      backgroundColor: '#fdebd0',
      borderRadius: '12px',
      padding: '12px 0',
      marginBottom: '12px',
      textAlign: 'center'
    }}>
      <h2 style={{ margin: 0 }}>{quizTitle}</h2>
      <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '60px' }}>
        <span>{currentIdx + 1} / {total}</span>
        <span>⏰ {timer}초</span>
      </div>
    </div>
  );
}

function MultiPlay() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [playerScores, setPlayerScores] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  // 문제 관련 state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timer, setTimer] = useState(20);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredUser, setAnsweredUser] = useState('');
  const [answerType, setAnswerType] = useState('');
  const timerRef = useRef(null);

  // 사운드 문제용
  const [ytReady, setYtReady] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [player, setPlayer] = useState(null);

  const nickname = localStorage.getItem('nickname') || '익명';

  // 문제 중복 제거 및 랜덤화 (프론트)
  function getUniqueQuestions(qs, count) {
    const seen = new Set();
    const unique = [];
    for (let q of qs) {
      const key = q.text_content + (q.media_url || '');
      if (!seen.has(key)) {
        unique.push(q);
        seen.add(key);
        if (unique.length === count) break;
      }
    }
    return unique;
  }

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

useEffect(() => {
    if (!socketRef.current) {
        const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });
        socketRef.current = socket;
    }

    const socket = socketRef.current;

    socket.emit('join-room', { roomId, nickname });

    socket.on('start-quiz', ({ questions }) => {
        console.log('[🔔 start-quiz 수신]', questions);
        setQuestions(questions);
        setCurrentIdx(0);
        setIsAnswered(false);
        setAnsweredUser('');
        setAnswerType('');
        setTimer(20);
    });

  socket.on('multi-answer', ({ user, correct, nextIdx, scores }) => {
    setIsAnswered(true);
    setAnsweredUser(user);
    setAnswerType(correct ? 'correct' : 'wrong');
    setPlayerScores(Object.entries(scores).map(([user, score]) => ({ user, score })));

    if (nextIdx !== undefined) {
      setTimeout(() => {
        setCurrentIdx(nextIdx);
        setIsAnswered(false);
        setAnsweredUser('');
        setAnswerType('');
        setTimer(20);
      }, 1500);
    }
  });

  socket.on('receive-message', (message) => {
    setChatMessages(prev => [...prev, message]);
  });

  socket.on('init-scores', (scores) => {
    setPlayerScores(Object.entries(scores).map(([user, score]) => ({ user, score })));
  });

  socket.on('multi-sync-question', (nextIdx) => {
    setCurrentIdx(nextIdx);
    setIsAnswered(false);
    setAnsweredUser('');
    setAnswerType('');
    setTimer(20);
  });

  socket.on('update-players', (players) => {
    setPlayerScores((prevScores) => {
      const updated = players.map(name => {
        const existing = prevScores.find(p => p.user === name);
        return { user: name, score: existing?.score ?? 0 };
      });
      return updated;
    });
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, [roomId, nickname]);


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
        socketRef.current.emit('send-message', {
            roomId,
            message: { user: nickname, text: trimmed }
        });
      }
    } else {
      // 그냥 채팅
      socketRef.current.emit('send-message', {
        roomId,
        message: { user: nickname, text: trimmed }
        });
    }
    setChatInput('');
  };

   // 사운드 문제 핸들링
  const extractYouTubeId = (url) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : '';
  };

  const onYtReady = (event) => {
    // 유튜브 시작 시간 랜덤
    const duration = event.target.getDuration();
    let start = 0;
    if (duration > 60) start = Math.floor(Math.random() * (duration - 30));
    setStartTime(start);
    event.target.seekTo(start);
    event.target.playVideo();
    setYtReady(true);
    setPlayer(event.target);
  };

  // 문제 렌더링
  const currentQ = questions[currentIdx];

  return (
    <Layout>
      <div style={{ width: '80%', backgroundColor: '#fff4e6', padding: '20px', borderRadius: '20px', margin: '0 auto' }}>
        {/* 3. 퀴즈 정보/타이머 최상단 표시 */}
        <QuizHeader
          quizTitle={quizInfo?.title || ''}
          currentIdx={currentIdx}
          total={questions.length}
          timer={timer}
        />

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
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* 4. 정답자 메시지 */}
              {isAnswered && answeredUser &&
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, fontSize: 28,
                  color: answerType === 'correct' ? 'green' : 'red', fontWeight: 'bold', marginTop: 12
                }}>
                  {`${answeredUser}님 정답!`}
                </div>
              }
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
                        <YouTube
                          videoId={extractYouTubeId(currentQ.media_url)}
                          onReady={onYtReady}
                          opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0 } }}
                        />
                        <span
                          onClick={() => player?.seekTo(startTime)}
                          style={{ fontSize: '32px', cursor: 'pointer', marginBottom: '12px' }}
                        >
                          🔊
                        </span>
                        <div>{currentQ.text_content}</div>
                      </>
                    )
                    : (
                      <div>{currentQ.text_content}</div>
                    )
              }
            </div>

            {/* 채팅창: 20% 증가 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              height: '162px', // (135px보다 약간 크게)
              overflow: 'hidden'
            }}>
              <div style={{
                flex: 1,
                padding: '10px',
                overflowY: 'auto',
                fontSize: '14px',
                textAlign: 'left',
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

                    {/* 우측 점수판 + 버튼 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                minHeight: '180px'
            }}>
                👥 참가자 점수
                <ul style={{ marginTop: '12px', listStyle: 'none', padding: 0 }}>
                {playerScores.map(({ user, score }) => (
                    <li key={user} style={{ marginBottom: '6px' }}>
                    {user}: {score}점
                    </li>
                ))}
                </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn-orange">힌트</button>
                <button className="btn-orange">스킵</button>
                <button className="btn-orange" onClick={() => navigate('/')}>나가기</button>
            </div>
            </div>

        </div>
      </div>
    </Layout>
  );
}
export default MultiPlay;