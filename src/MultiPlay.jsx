// MultiPlay.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from './Layout';

function MultiPlay() {
  const { roomId } = useParams();
  const [roomInfo, setRoomInfo] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playerScores, setPlayerScores] = useState([]); // 예: [{name: '유이', score: 2}]
  const [inputText, setInputText] = useState('');

  const inputRef = useRef();

  useEffect(() => {
    // 방 정보 불러오기
    fetch(`/api/room/${roomId}`)
      .then(res => res.json())
      .then(async data => {
        setRoomInfo(data);
        try {
          const quizRes = await fetch(`/api/quiz/${data.quiz_id}`);
          const quizData = await quizRes.json();
          setQuizInfo(quizData);

          // [💡임시] 첫 문제만 표시
          if (quizData.questions?.length > 0) {
            setCurrentQuestion(quizData.questions[0]);
          }

          // [💡임시] 플레이어 점수 초기화
          setPlayerScores(data.players?.map(name => ({ name, score: 0 })) || []);
        } catch (err) {
          console.error('퀴즈 정보 로딩 실패', err);
        }
      });
  }, [roomId]);

  return (
    <Layout>
      <div style={{ width: '80%', backgroundColor: '#fff4e6', padding: '20px', marginTop: '0px', borderRadius: '20px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 상단 문제 제목 및 상태 */}
          <div style={{ backgroundColor: '#fdebd0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>{quizInfo?.title || '퀴즈 제목'}</h2>
            <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '60px' }}>
              <span>1 / {quizInfo?.questions?.length || '?'}</span>
              <span>타이머: 30초</span> {/* 추후 실제 타이머 연결 */}
            </div>
          </div>

          {/* 본문: 문제 + 입력창 + 점수판 */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* 문제 영역 */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 0 6px rgba(0,0,0,0.1)',
                minHeight: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '20px',
                textAlign: 'center'
              }}>
                {currentQuestion?.text_content || '문제를 불러오는 중...'}
              </div>

              {/* 정답 입력창 */}
              <div>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="정답 또는 메시지 입력..."
                    style={{ flex: 1, border: 'none', fontSize: '16px', padding: '8px' }}
                  />
                  <button
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                    ✏️
                  </button>
                </div>
              </div>
            </div>

            {/* 우측 점수판 */}
            <div style={{ width: '220px', backgroundColor: 'white', borderRadius: '12px', padding: '12px', boxShadow: '0 0 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, textAlign: 'center' }}>플레이어 점수</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {playerScores.map((player, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    {player.name} - {player.score}점
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MultiPlay;
