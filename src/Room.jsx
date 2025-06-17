import React, { useEffect, useState, useRef } from 'react';
import Layout from './Layout';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

function Room() {
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const [playerList, setPlayerList] = useState(Array(8).fill(null));
  const navigate = useNavigate();

  const nickname = localStorage.getItem('nickname') || '익명';
    const isHost = roomInfo && nickname === roomInfo.created_by;

  // 방 정보 및 퀴즈 정보 불러오기
  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then(res => res.json())
      .then(async data => {
        setRoomInfo(data);
        setChatMessages(data.chat || []);

        try {
          const quizRes = await fetch(`/api/quiz/${data.quiz_id}`);
          const quizData = await quizRes.json();
          setQuizInfo({
            ...quizData,
            total_questions: quizData.questions?.length || 0,
          });
        } catch (e) {
          console.error('❌ 퀴즈 정보 불러오기 실패:', e);
        }
      })
      .catch(err => {
        console.error('❌ 방 정보 가져오기 실패:', err);
        alert('방 정보를 불러오지 못했습니다.');
      });
  }, [roomId]);

  // 채팅창 스크롤 아래로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    console.log('🧪 socket connected?', socketRef.current?.connected);
}, []);

    useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
        transports: ['websocket'],
        withCredentials: true
    });
    socketRef.current = socket;

    if (!nickname || !roomId) return;

    const emitJoin = () => {
        socket.emit('join-room', { roomId, nickname });
    };

    if (socket.connected) {
        emitJoin();
    } else {
        socket.once('connect', emitJoin);
    }

    const handlePlayerUpdate = (list) => {
        const padded = [...list];
        while (padded.length < 8) padded.push(null);
        setPlayerList(padded);
    };

    const handleChatMessage = (msg) => {
        setChatMessages(prev => [...prev, msg]);
    };

    const handleGameStarted = () => {
    console.log('🎮 게임이 시작되었습니다!');
    setTimeout(() => {
        navigate(`/multi/${roomId}`);
    }, 300); // 300ms 지연
    };

    // 이벤트 리스너 등록
    socket.on('update-players', handlePlayerUpdate);
    socket.on('receive-message', handleChatMessage);
    socket.on('game-started', handleGameStarted);

    return () => {
        socket.off('update-players', handlePlayerUpdate);
        socket.off('receive-message', handleChatMessage);
        socket.off('game-started', handleGameStarted);
        socket.disconnect();
    };
    }, [roomId, nickname, navigate]);


  const handleStartGame = () => {
  if (!socketRef.current) return;

  // 1. 서버에 'start-game' 이벤트 전파
  socketRef.current.emit('start-game', { roomId });

  // 2. 방장은 바로 게임 화면으로 이동
  navigate(`/multi/${roomId}`);
};

  // 메시지 보내기
const handleSendMessage = () => {
  const trimmed = chatInput.trim();
  if (!trimmed) return;
  const newMsg = { user: localStorage.getItem('nickname') || '사용자', text: trimmed };

  console.log('📤 emit message:', newMsg); // ✅ 확인용
  socketRef.current?.emit('send-message', { roomId, message: newMsg });
  setChatInput('');
};




  return (
    <Layout>
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {!roomInfo || !quizInfo ? (
          <div style={{ fontSize: '20px' }}>로딩 중...</div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', minHeight: '400px' }}>
            {/* 왼쪽 정보 영역 */}
            <div style={{
              flex: '0 0 250px',
              backgroundColor: '#fff4e6',
              padding: '24px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>{roomInfo.title}</h1>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{quizInfo.title}
                  <span style={{ fontSize: '14px', color: '#888' }}> ({roomInfo.created_by})</span>
                </h2>
                <p>문제 수: {roomInfo.question_count} / {quizInfo.total_questions}</p>
                <p>힌트 사용: {roomInfo.use_hint ? '사용함' : '사용 안함'}</p>
                <p>제한 시간: {roomInfo.use_timer ? '기본 시간' : '제한 없음'}</p>
              </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '20px',
                  height: '100%'  // 버튼 아래로 밀기 위한 조건
                }}>
                  {isHost && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn-orange"
                        onClick={handleStartGame}
                        style={{ flex: 8 }}
                      >
                        게임 시작
                      </button>
                      <button
                        className="btn-orange"
                        style={{ flex: 2 }}
                      >
                        ⚙️
                      </button>
                    </div>
                  )}
                  <button
                    className="btn-orange"
                    style={{ width: '100%', marginTop: '10px' }}  // ✅ 상단 여백만 살짝 줌
                    onClick={() => navigate('/join')}
                  >
                    나가기
                  </button>
                </div>


            </div>

            {/* 오른쪽 플레이어 + 채팅 */}
            <div style={{ flex: '0 0 600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: '10px',
                backgroundColor: '#fff4e6',
                padding: '20px',
                borderRadius: '16px'
              }}>
                {playerList.map((player, index) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    color: player ? 'black' : '#888',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '60px',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                  {player
                    ? (player === roomInfo.created_by ? '👑 ' : '') + player
                    : '빈 자리'}
                  </div>
                ))}
              </div>

              <div style={{
                backgroundColor: '#fff4e6',
                borderRadius: '12px',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ flex: 1, padding: '10px', overflowY: 'auto', textAlign: 'left' }}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '6px' }}>
                      <strong>{msg.user}</strong>: {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ borderTop: '1px solid #ccc', display: 'flex' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="메시지를 입력하세요..."
                    style={{ flex: 1, padding: '10px', border: 'none', outline: 'none' }}
                  />
                  <button className="btn-orange" style={{ borderRadius: '0 0 12px 0' }} onClick={handleSendMessage}>
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Room;
