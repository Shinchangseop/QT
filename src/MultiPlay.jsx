import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from './Layout';

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

  const nickname = localStorage.getItem('nickname') || '익명';

  // 1️⃣ socket 초기화 및 이벤트 처리
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true
    });
    socketRef.current = socket;

    socket.emit('join-room', { roomId, nickname });

    socket.on('update-players', (list) => {
      const updated = list.map(name => {
        const existing = playerScores.find(p => p.name === name);
        return { name, score: existing?.score || 0 };
      });
      setPlayerScores(updated);
    });

    socket.on('receive-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  // 2️⃣ 채팅 스크롤 자동 내리기
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 3️⃣ room/quiz 정보 로딩
  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then(res => res.json())
      .then(async data => {
        setRoomInfo(data);
        const quizRes = await fetch(`/api/quiz/${data.quiz_id}`);
        const quizData = await quizRes.json();
        setQuizInfo(quizData);
      });
  }, [roomId]);

  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const message = { user: nickname, text: trimmed };
    socketRef.current?.emit('send-message', { roomId, message });
    setChatInput('');
  };

  return (
    <Layout>
      <div style={{ width: '80%', backgroundColor: '#fff4e6', padding: '20px', borderRadius: '20px', margin: '0 auto' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '20px' }}>

          {/* 문제 + 채팅 영역 */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '240px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              문제 영역 (아직 미구현)
            </div>

            {/* 채팅창 전체 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              height: '240px',
              overflow: 'hidden'
            }}>
              {/* 채팅 로그 */}
              <div style={{ flex: 1, padding: '10px', overflowY: 'auto', fontSize: '14px' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx}><strong>{msg.user}</strong>: {msg.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* 채팅 입력 */}
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
