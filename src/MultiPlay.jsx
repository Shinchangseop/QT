import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';

function MultiPlay() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [playerScores, setPlayerScores] = useState([]); // [{ name: '유이', score: 0 }]
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then(res => res.json())
      .then(async data => {
        setRoomInfo(data);
        const quizRes = await fetch(`/api/quiz/${data.quiz_id}`);
        const quizData = await quizRes.json();
        setQuizInfo(quizData);

        // 임시: 플레이어 점수 0점 초기화
        const players = window.localStorage.getItem('playerList')?.split(',') || data.players || ['유저1', '유저2'];
        const initialScores = players.map(name => ({ name, score: 0 }));
        setPlayerScores(initialScores);
      });
  }, [roomId]);

  return (
    <Layout>
      <div style={{ width: '80%', backgroundColor: '#fff4e6', padding: '20px', borderRadius: '20px', margin: '0 auto' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '20px' }}>

          {/* 문제 영역 */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '280px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              문제 영역 (아직 미구현)
            </div>

            {/* 입력창: room 스타일 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log('입력됨:', chatInput);
                    setChatInput('');
                  }
                }}
                placeholder="정답 또는 메시지를 입력하세요..."
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '16px',
                  border: 'none',
                  outline: 'none'
                }}
              />
              <button className="btn-orange" style={{ marginLeft: '10px' }}>
                전송
              </button>
            </div>
          </div>

          {/* 우측 점수판 + 버튼 */}
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
